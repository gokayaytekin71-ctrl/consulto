"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Markdown render (SSR kapalı, projeye uygun)
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

// Opsiyonel: Canvas arka plan (varsa kullan)
let CanvasBackground = null;
try {
  CanvasBackground = require("@/components/CanvasBackground").default;
} catch (err) {
  // bileşen yoksa sorun değil
}


// -----------------------------
// Yardımcı Fonksiyonlar
// -----------------------------

// Dinamik script yükleyici (CDN'den tek sefer yükler)
async function ensureScriptLoaded(src, globalVar) {
  if (typeof window === "undefined") return null;
  if (globalVar && window[globalVar]) return window[globalVar];
  return await new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve(globalVar ? window[globalVar] : true);
    el.onerror = () => reject(new Error(`Script yüklenemedi: ${src}`));
    document.head.appendChild(el);
  });
}

// html-docx-js'i iki farklı CDN'den dene, ardından unpkg fallback
async function loadHtmlDocxUMD() {
  try {
    const mod = await ensureScriptLoaded(
      "https://cdn.jsdelivr.net/npm/html-docx-js@0.4.2/dist/html-docx.js",
      "htmlDocx"
    );
    if (mod && typeof mod.asBlob === "function") return mod;
  } catch (_) {}
  try {
    const mod = await ensureScriptLoaded(
      "https://cdnjs.cloudflare.com/ajax/libs/html-docx-js/0.4.2/html-docx.js",
      "htmlDocx"
    );
    if (mod && typeof mod.asBlob === "function") return mod;
  } catch (_) {}
  // Ek fallback: unpkg
  try {
    const mod = await ensureScriptLoaded(
      "https://unpkg.com/html-docx-js@0.4.2/dist/html-docx.js",
      "htmlDocx"
    );
    if (mod && typeof mod.asBlob === "function") return mod;
  } catch (_) {}
  return null;
}

// Panoya kopyalama
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Kopyalama hatası:", err);
    return false;
  }
}

// .md indirme
function downloadAsMd(filename, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// .docx indirme (Markdown <div> HTML'inden üretir)
async function downloadAsDocxFromPreviewNode(previewNode, filenameBase, setError) {
  if (!previewNode) {
    setError && setError("Önizleme alanı bulunamadı.");
    return;
  }
  try {
    // İçeriği beyaz zemin/siyah yazı ile sar
    const inner = serializeWithManualNumbering(previewNode);
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Dilekçe</title>
<style>
  /* Genel yazı ve arka plan */
  * { color: #000 !important; background: transparent !important; }
  body { background: #fff !important; font-family: Arial, Helvetica, sans-serif; line-height: 1.4; }
  a, a * { color: #000 !important; text-decoration: none !important; }
  code, pre { border: 1px solid #999; }
  h1,h2,h3,h4,h5,h6{ margin: 0.6em 0 0.3em; }
  p,li{ margin: 0.2em 0; }
    /* Manual numbering & header styling for exports */
  ol { list-style: none; padding-left: 0; }
  li { margin-left: 0; }
  .manual-li-index { display: inline-block; min-width: 1.6em; }
  .section-head { margin-top: 1em; }

  /* “... MAHKEMESİNE” satırı: ortalı, kalın ve üstte iki satır boşluk etkisi */
  .mahkemesine {
    text-align: center;
    font-weight: 700;
    margin-top: 2.2em;
  }

  /* "BAŞLIK: Değer" satırlarında ":" hizalansın ve başlıklar kalın olsun */
  .kv {
    display: grid;
    grid-template-columns: max-content 1fr;
    align-items: baseline;
    gap: 0.75rem;
    margin: 0.15rem 0;
  }
  .kv .kv-key {
    font-weight: 700;
    white-space: nowrap;
  }

  /* Rakamlar düzgün dursun */
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
</style>
</head>
<body>${inner}</body>
</html>`;

    // Önce html-docx-js UMD sürümünü dene (paket kurmadan)
    const htmlDocx = await loadHtmlDocxUMD();
    if (htmlDocx && typeof htmlDocx.asBlob === "function") {
      const blob = htmlDocx.asBlob(html);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filenameBase}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return; // başarı
    }

    // Yedek plan: docx UMD ile düz metin docx üret (çok basit ama garantili)
    const docx = await ensureScriptLoaded(
      "https://unpkg.com/docx@9.5.0/dist/index.iife.js",
      "docx"
    );
    if (!docx || !window.docx || !window.docx.Packer) throw new Error("docx kütüphanesi yüklenemedi");

const { Document, Paragraph, TextRun, AlignmentType } = window.docx;

// HTML'den görünen metni satır satır işle (manuel numaralar innerText'e düşmüş durumda)
const plain = (previewNode.innerText || "").replace(/\r\n/g, "\n");
const lines = plain.split("\n");

// Ana başlıklar: AÇIKLAMALAR, HUKUKİ DELİLLER, HUKUKİ NEDEN, SONUÇ VE İSTEM, EKLER, DAVA DEĞERİ, DAVACI, DAVALI, KONU
const sectionRegex = /^(AÇIKLAMALAR|HUKUK[İI]\s*(NEDEN(LER)?|DEL[İI]LLER)|SONUÇ\s*VE\s*İSTEM|EKLER|DAVA DEĞER[İI]|DAVACI|DAVALI|KONU)$/i;

const paragraphs = [];
for (const rawLine of lines) {
  const line = rawLine.trim();

  // Boş satır → araya biraz boşluk
  if (!line) {
    paragraphs.push(new Paragraph({ children: [new TextRun("")], spacing: { after: 200 } }));
    continue;
  }

  // “... MAHKEMESİNE” satırı → ortalı + kalın
  if (/\bMAHKEMES[İI]NE\b/i.test(line)) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: line, bold: true })],
        spacing: { after: 200 },
      })
    );
    continue;
  }

  // "BAŞLIK: Değer" satırları → başlık kısmını kalın yap
  const kv = line.match(/^(.+?)\s*:\s*(.+)$/);
  if (kv) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: kv[1] + ": ", bold: true }),
          new TextRun({ text: kv[2] }),
        ],
        spacing: { after: 120 },
      })
    );
    continue;
  }

  // Tam başlık satırı (iki nokta olmadan) → kalın
  if (sectionRegex.test(line)) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: line, bold: true })],
        spacing: { after: 120 },
      })
    );
    continue;
  }

  // Normal paragraf
  paragraphs.push(
    new Paragraph({
      children: [new TextRun(line)],
      spacing: { after: 120 },
    })
  );
}

const doc = new Document({
  sections: [
    {
      properties: {},
      children: paragraphs.length ? paragraphs : [new Paragraph(" ")],
    },
  ],
});

const blob = await window.docx.Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  } catch (e) {
    console.error(e);
    setError && setError(`Word (.docx) çıktısı hazırlanırken bir hata oluştu: ${e?.message || e}`);
  }
}

// .pdf indirme (önizleme HTML'inden üretir, otomatik indirir)
async function downloadAsPdfFromPreviewNode(previewNode, filenameBase, setError) {
  if (!previewNode) {
    setError && setError("Önizleme alanı bulunamadı.");
    return;
  }
  try {
    const inner = serializeWithManualNumbering(previewNode);
    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${filenameBase}</title>
      <style>
        /* Genel yazı ve arka plan */
        * { color: #000 !important; background: transparent !important; }
        body { background: #fff !important; font-family: Arial, Helvetica, sans-serif; line-height: 1.4; }
        a, a * { color: #000 !important; text-decoration: none !important; }
        code, pre { border: 1px solid #999; }
        h1,h2,h3,h4,h5,h6{ margin: 0.6em 0 0.3em; }
        p,li{ margin: 0.2em 0; }
          /* Manual numbering & header styling for exports */
        ol { list-style: none; padding-left: 0; }
        li { margin-left: 0; }
        .manual-li-index { display: inline-block; min-width: 1.6em; }
        .section-head { margin-top: 1em; }

        /* “... MAHKEMESİNE” satırı: ortalı, kalın ve üstte iki satır boşluk etkisi */
        .mahkemesine {
          text-align: center;
          font-weight: 700;
          margin-top: 2.2em;
        }

        /* "BAŞLIK: Değer" satırlarında ":" hizalansın ve başlıklar kalın olsun */
        .kv {
          display: grid;
          grid-template-columns: max-content 1fr;
          align-items: baseline;
          gap: 0.75rem;
          margin: 0.15rem 0;
        }
        .kv .kv-key {
          font-weight: 700;
          white-space: nowrap;
        }

        /* Rakamlar düzgün dursun */
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      </style>
    </head><body>${inner}</body></html>`;

    const html2pdf = await ensureScriptLoaded(
      "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js",
      "html2pdf"
    );
    if (!html2pdf) throw new Error("html2pdf.js yüklenemedi");

    const opt = {
      filename: `${filenameBase}.pdf`,
      margin: 10,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    await window.html2pdf().set(opt).from(html).save();
  } catch (e) {
    console.error(e);
    setError && setError("PDF hazırlanırken bir hata oluştu.");
  }
}

// Esas/Karar formatlayıcı (dosya adına göre de çıkarsar)
function deduceEsasKararFromProps(p = {}) {
  const clean = (s) => (s || "").toString().trim();
  const bad = (s) => !s || /^belirtilmemi[şs]/i.test(s) || /^n\/?a$/i.test(s);

  // 1) DB alanı varsa doğrudan kullan
  const codeField = clean(p.code);
  if (!bad(codeField)) {
    return codeField;
  }

  const esas = clean(p.esas_no);
  const karar = clean(p.karar_no);
  if (!bad(esas) && !bad(karar)) {
    return `${esas} E. ${karar} K.`;
  }

  // 2) Öncelik: orijinal_karar_id (özetler için güvenilir)
  const fnameRaw = clean(p.orijinal_karar_id || p.dosya_adi || p.dosya || p.slug);
  if (fnameRaw) {
    const base = fnameRaw.replace(/\.txt$/i, "");

    // Örn: 5_Hukuk_Dairesi_2022-15576E_2023-2784K
    let m = base.match(/^(\d+)_Hukuk_Dairesi_(\d{4}-[0-9A-Za-z()\-\/]+)E_(\d{4}-[0-9A-Za-z()\-\/]+)K$/i);
    if (m) {
      const ePart = m[2].replace(/\s*-\s*/g, "/");
      const kPart = m[3].replace(/\s*-\s*/g, "/");
      return `${ePart} E. ${kPart} K.`;
    }

    // Örn: Hukuk_Genel_Kurulu_2017-2345E_2020-739K
    m = base.match(/^(Hukuk|Ceza)_Genel_Kurulu_(\d{4}-[0-9A-Za-z()\-\/]+)E_(\d{4}-[0-9A-Za-z()\-\/]+)K$/i);
    if (m) {
      const ePart = m[2].replace(/\s*-\s*/g, "/");
      const kPart = m[3].replace(/\s*-\s*/g, "/");
      return `${ePart} E. ${kPart} K.`;
    }
  }
  return "";
}

// Daire/Kurul başlığını çıkar (mahkeme alanı yoksa dosya adından)
function deduceCourtLabelFromProps(p = {}) {
  const clean = (s) => (s || "").toString().trim();
  const bad = (s) => !s || /^belirtilmemi[şs]/i.test(s) || /^n\/?a$/i.test(s);

  // 1) DB alanları
  const mahkeme = clean(p.mahkeme || p.type || "");
  if (!bad(mahkeme)) return mahkeme;

  // 2) Öncelik: orijinal_karar_id (özetlerde dosya_adi yanıltıcıdır)
  const fnameRaw = clean(p.orijinal_karar_id || p.dosya_adi || p.dosya || p.slug);
  if (!fnameRaw) return "";
  const base = fnameRaw.replace(/\.txt$/i, "");

  // 5_Hukuk_Dairesi_... → "5. Hukuk Dairesi"
  let m = base.match(/^(\d+)_Hukuk_Dairesi_/i);
  if (m) return `${m[1]}. Hukuk Dairesi`;

  // 5_Ceza_Dairesi_... → "5. Ceza Dairesi"
  m = base.match(/^(\d+)_Ceza_Dairesi_/i);
  if (m) return `${m[1]}. Ceza Dairesi`;

  // (Hukuk|Ceza)_Genel_Kurulu_... → "Hukuk Genel Kurulu" / "Ceza Genel Kurulu"
  m = base.match(/^(Hukuk|Ceza)_Genel_Kurulu_/i);
  if (m) return `${m[1]} Genel Kurulu`;

  return "";
}

// Slug benzeri dosya adı mı? (…E_…K kalıbı ve Daire/Kurul içermeli)
function looksLikeSlug(s = "") {
  const base = String(s).replace(/\.txt$/i, "");
  if (!base) return false;
  if (!/(Hukuk|Ceza)_(Dairesi|Genel_Kurulu)/i.test(base)) return false;
  return /E_/i.test(base) && /K\b/i.test(base);
}

// Özet kaydını, aynı kararın orijinaliyle eşleştirerek en iyi slug'ı bul
function bestSlugFromProps(p = {}, allArr = []) {
  const primary = (p.orijinal_karar_id || p.dosya_adi || p.karar_id || p.slug || "")
    .toString()
    .replace(/\.txt$/i, "");
  if (looksLikeSlug(primary)) return primary;

  const rid = (p.orijinal_karar_id || p.karar_id || "").toString().replace(/\.txt$/i, "");
  if (rid) {
    for (const k of allArr) {
      const q = k?.properties || {};
      const typeRaw = String(q.kaynak_turu || q.tur || "").toLowerCase();
      const isSummaryName = /(?:\bözet\b|\bozet\b|gemini)/i.test(String(q.dosya_adi || ""));
      const isSummary = typeRaw === "ai_ozet" || isSummaryName;
      const candidate = (q.dosya_adi || q.orijinal_karar_id || "").toString().replace(/\.txt$/i, "");
      if (looksLikeSlug(candidate) && !isSummary && (String(q.orijinal_karar_id || "").replace(/\.txt$/i, "") === rid)) {
        return candidate; // aynı kararın orijinal satırı bulundu
      }
    }
  }

  // Son çare: dosya_adi slug gibiyse onu dön, yoksa boş bırak
  const fallback = (p.dosya_adi || "").toString().replace(/\.txt$/i, "");
  return looksLikeSlug(fallback) ? fallback : "";
}

/**
 * Dayanakları normalize et: trim, boşları at ve tekrarı engelle.
 */

function normalizeDayanaklar(arr){
  const set = new Set();
  for (const x of (Array.isArray(arr) ? arr : [])) {
    const s = String(x || "").trim();
    if (s) set.add(s);
  }
  return Array.from(set);
}

// Yeni: Davada dikkat kartı normalizasyonu
function normalizeDavadaDikkat(v){
  const safeList = (x) => Array.isArray(x) ? x.map(s => String(s||"").trim()).filter(Boolean) : [];
  const obj = (v && typeof v === 'object') ? v : {};
  return {
    riskler: safeList(obj.riskler),
    karsi_iddialar: safeList(obj.karsi_iddialar),
    kritik_deliller: safeList(obj.kritik_deliller),
  };
}

// ---------- MEVZUAT HELPERS (Analiz sayfasıyla uyumlu) ----------

// Küçük TR-normalize + slug
function slugifyMevzuatAdi(name = "") {
  const trMap = { "ı":"i","İ":"i","ş":"s","Ş":"s","ç":"c","Ç":"c","ö":"o","Ö":"o","ü":"u","Ü":"u","ğ":"g","Ğ":"g" };
  let s = (name || "").toString().trim();
  // baştaki “XXXX sayılı / numaralı / no.lu …” öneklerini kaldır
  s = s.replace(/^\s*\d+(?:\s*\/\s*\d+)?\s*(?:say[ıi]l[ıi]|numaral[ıi]|no\.?lu?)\s+/i, "");
  s = s.replace(/^\s*\d{3,5}\s+/, ""); // tek başına sayı/yıl öneğini indir
  s = s.replace(/[ıİşŞçÇöÖüÜğĞ]/g, c => trMap[c] || c).toLowerCase();
  return s
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// HTML -> düz metin (satır sonlarını korumaya dönük)
function stripHtmlTags(s = "") {
  let t = (s ?? "").toString();
  t = t.replace(/\r\n/g, "\n");
  t = t
    .replace(/&lt;br\s*\/?&gt;/gi, "\n")
    .replace(/&lt;\/p\s*&gt;/gi, "\n")
    .replace(/&lt;p[^&gt;]*&gt;/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<p[^>]*>/gi, "");
  t = t.replace(/&lt;[^&gt;]*&gt;/g, " ").replace(/<[^>]*>/g, " ");
  t = t.replace(/&nbsp;/gi, " ").replace(/\r/g, "");
  t = t.replace(/[ \t\f\v]+/g, " ");
  t = t.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

// Tam madde metnini sonundaki “2. Bölüm” / “II. …” artıklarını atarak temizle
function sanitizeMaddeTextFull(s = "") {
  const txt = stripHtmlTags(s || "");
  let out = txt;
  const lines = out.split(/\r?\n/);
  const isUpperHeading = (t) =>
    /^(?:BİRİNCİ|İKİNCİ|ÜÇÜNCÜ|DÖRDÜNCÜ|BEŞİNCİ|ALTINCI|YEDİNCİ|SEKİZİNCİ|DOKUZUNCU|ONUNCU)\s+(?:KİTAP|BÖLÜM|KISIM|AYRIM)\b/.test(t);
  const isOutline = (t) => /^(?:[IVXLCDM]+|[0-9]+|[A-ZÇĞİÖŞÜ])\.\s+\S/.test(t);
  while (lines.length) {
    const last = (lines[lines.length - 1] || "").trim();
    if (!last) { lines.pop(); continue; }
    if (isOutline(last) || isUpperHeading(last)) { lines.pop(); while (lines.length && !lines[lines.length - 1].trim()) lines.pop(); continue; }
    break;
  }
  out = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  out = out.replace(/\s*[—–-]\s*(?=(?:[IVXLCDM]+|[0-9]+|[A-ZÇĞİÖŞÜ])\.)[^\n]*$/u, "");
  out = out.replace(/\s*(?:\b(?:[IVXLCDM]+|[0-9]+|[A-ZÇĞİÖŞÜ])\.\s*[A-ZÇĞİÖŞÜ][^\n]{0,60})\s*$/u, "");
  out = out.replace(/\s*(?:\b(?:[IVXLCDM]+|[0-9]+))\.\s*$/u, "");
  return out.trim();
}

function maddeAnchor(madde) {
  const raw = (madde ?? "").toString();
  const num = (raw.match(/\d+/)?.[0] ?? raw).toString().trim().replace(/\s+/g, "-").toLowerCase();
  return num ? `#madde-${num}` : "";
}

function mevzuatCacheKey(kanun = "", madde = "") {
  const id = (madde || "").toString().match(/\d+/)?.[0] || (madde || "").toString();
  return `${slugifyMevzuatAdi(kanun || "")}::${id}`;
}

// Sunucu API’n: /api/mevzuat/madde?kanun=…&madde=…
async function ensureMaddeInCache(kanun = "", madde = "", setMaddeCache, pendingMadde) {
  if (!kanun || !madde) return;
  const key = mevzuatCacheKey(kanun, madde);
  if (pendingMadde.current.has(key)) return;
  if (typeof window !== "undefined" && window.__MADDE_CACHE__?.[key]) return; // (isteğe bağlı) global cache
  pendingMadde.current.add(key);
  try {
    const url = `/api/mevzuat/madde?kanun=${encodeURIComponent(kanun)}&madde=${encodeURIComponent(madde)}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const metin = sanitizeMaddeTextFull(data?.maddeMetin || "");
    setMaddeCache(prev => ({ ...prev, [key]: metin }));
    if (typeof window !== "undefined") {
      window.__MADDE_CACHE__ = window.__MADDE_CACHE__ || {};
      window.__MADDE_CACHE__[key] = metin;
    }
  } catch (e) {
    setMaddeCache(prev => ({ ...prev, [key]: "" }));
  } finally {
    pendingMadde.current.delete(key);
  }
}

function getMevzuatPreview(entry, maddeCache) {
  if (!entry) return "";
  const kanun = entry.kanun || entry.mevzuat_adi || "";
  const madde = entry.madde || "";
  if (kanun && madde) {
    const key = mevzuatCacheKey(kanun, madde);
    const cached = maddeCache[key] || (typeof window !== "undefined" ? window.__MADDE_CACHE__?.[key] : "");
    if (typeof cached === "string" && cached.length) return cached;
  }
  return sanitizeMaddeTextFull(entry?.maddeMetin || entry?.metin || "");
}

// Popover pozisyonu
function calcMevzuatPopover(el) {
  if (!el || !el.getBoundingClientRect) return { top: 0, left: 0, placement: 'bottom' };
  const GAP = 10;
  const POP_W = Math.min(672, Math.floor(window.innerWidth * 0.92));
  const POP_H = 320;
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceLeft   = rect.left;
  const spaceRight  = vw - rect.right;
  const spaceTop    = rect.top;
  const spaceBottom = vh - rect.bottom;
  let placement, top, left;
  if (spaceLeft >= POP_W + GAP) {
    placement = 'left';  top  = Math.round(rect.top + rect.height / 2); left = Math.round(rect.left - GAP);
  } else if (spaceRight >= POP_W + GAP) {
    placement = 'right'; top  = Math.round(rect.top + rect.height / 2); left = Math.round(rect.right + GAP);
  } else if (spaceTop >= POP_H + GAP) {
    placement = 'top';   top  = Math.round(rect.top - GAP);             left = Math.round(rect.left + rect.width / 2);
  } else {
    placement = 'bottom';top  = Math.round(rect.bottom + GAP);          left = Math.round(rect.left + rect.width / 2);
  }
  return { top, left, placement };
}

// "TBK m.315", "6100 sayılı HMK m.389/1", "TTK 54", "Geçici 1" tarzlarını parçala
function parseDayanakString(s = "") {
  const raw = String(s || "").replace(/\s+/g, " ").trim();
  if (!raw) return null;

  // 1) “... (madde|m.) <geçici?> <no>” kalıbı
  let m = raw.match(/^(.*?)(?:\bmadde\b|m\.)\s*(geçici\s*)?([0-9]+(?:[\/.-][0-9A-Za-z()]+)*)/i);
  if (m) {
    const kanunGuess = (m[1] || "").replace(/[,.;:()]+$/g, "").trim() || raw; // baş kısmı kanun adı varsay
    const madde = (m[2] ? `Geçici ${m[3]}` : m[3]).trim();
    return { kanun: kanunGuess, madde, display: raw };
  }

  // 2) “<KANUN KISA ADI> <no>” (HMK 389/1, TMK 166 vb.)
  m = raw.match(/^([A-ZÇĞİÖŞÜ]{2,6})\s+([0-9]+(?:[\/.-][0-9A-Za-z()]+)*)$/);
  if (m) return { kanun: m[1], madde: m[2], display: raw };

  // 3) “Geçici <no>” (kanun kısmı yok ama yine döndür)
  m = raw.match(/^(geçici)\s+([0-9]+)/i);
  if (m) return { kanun: raw, madde: `Geçici ${m[2]}`, display: raw };

  // 4) Sayılı kanun adları direkt verilmişse: “6100 sayılı HMK 389/1”
  m = raw.match(/^(.+?\bsay[ıi]l[ıi]\b.*?)([0-9]+(?:[\/.-][0-9A-Za-z()]+)*)$/i);
  if (m) return { kanun: m[1].trim(), madde: m[2].trim(), display: raw };

  // Bulamazsak düz döndür, popover çıkarmayız
  return { kanun: "", madde: "", display: raw };
}

// -------- Markdown özel renderers --------
import React from "react";


function _textFromChildren(children) {
  const arr = React.Children.toArray(children);
  let out = "";
  for (const c of arr) {
    if (typeof c === "string") out += c;
    else if (typeof c === "number") out += String(c);
    else if (c && c.props && c.props.children) out += _textFromChildren(c.props.children);
  }
  return out;
}

// Export helper: force explicit numbers for <ol> so PDF/DOCX never drop markers
function serializeWithManualNumbering(containerNode) {
  const clone = containerNode.cloneNode(true);
  clone.querySelectorAll('ol').forEach((ol) => {
    const start = parseInt(ol.getAttribute('start') || '1', 10) || 1;
    let i = 0;
    Array.from(ol.children).forEach((li) => {
      if (!li || (li.tagName || '').toLowerCase() !== 'li') return;
      if (li.querySelector(':scope > .manual-li-index')) return; // avoid duplicates
      const span = document.createElement('span');
      span.className = 'manual-li-index';
      span.textContent = (start + i) + '. ';
      const firstEl = li.firstElementChild;
      if (firstEl && firstEl.tagName && firstEl.tagName.toLowerCase() === 'p') {
        firstEl.insertBefore(span, firstEl.firstChild);
      } else if (li.firstChild) {
        li.insertBefore(span, li.firstChild);
      } else {
        li.appendChild(span);
      }
      i += 1;
    });
  });
  return clone.innerHTML;
}

// Paragraf renderer: MAHKEMESİNE satırını ortala/kalın yap; "BAŞLIK: değer" satırlarında ":" hizalansın
function ParagraphRenderer(props) {
  const { children } = props;
  const raw = _textFromChildren(children).trim();

  // Başlıkları (iki nokta olmasa bile) kalın göster
  const upper = raw.toUpperCase();
  if (/^(AÇIKLAMALAR|HUKUK[İI]\s*(NEDEN(LER)?|DEL[İI]LLER)|SONUÇ\s*VE\s*İSTEM|EKLER|DAVA DEĞER[İI]|DAVACI|DAVALI|KONU)$/.test(upper)) {
    return <p className="section-head"><strong>{raw}</strong></p>;
  }

  // “... MAHKEMESİNE” satırı: ortalı/kalın
  if (/\bMAHKEMES[İI]NE\b/.test(raw)) {
    return (
      <p className="mahkemesine">
        <strong>{raw}</strong>
      </p>
    );
  }

  // "BAŞLIK: Değer" satırları — ":" hizalansın, başlık kalın olsun
  // Unicode ve küçük/büyük harf dostu: "Davacı :", "DAVALI:", "Dava Değeri :"
const m = raw.match(/^([\p{L}0-9\-()./ ]+?)\s*:\s*(.+)$/u);
  if (m) {
    return (
      <div className="kv">
        <span className="kv-key"><strong>{m[1].trim()}:</strong></span>
        <span className="kv-value">{m[2]}</span>
      </div>
    );
  }

  return <p>{children}</p>;
}

// -----------------------------
// Dilekçe oluşturma sürecinde ekranda dönecek adım mesajları
const LOADING_MESSAGES = [
  "Uyuşmazlık ile ilgili analiz yapılıyor…",
  "Mevzuat taraması yapılıyor…",
  "Emsal Yargıtay kararları inceleniyor…",
  "Son rütuşlar yapılıyor…"
];
// DAVA TÜRÜ YAPILANDIRMASI
// -----------------------------

/**
 * Her dava türü, alan tanımlarından oluşur.
 * type: "text" | "number" | "date" | "textarea" | "select"
 * options: [{ value, label }] (select için)
 * required: true/false
 */
const CASE_TYPES = {
  "": { label: "Seçiniz...", fields: [] },
  cevap: {
    label: "Cevap Dilekçesi (Karşı Tarafa Cevap)",
    fields: [
      {
        id: "gelen_dava_dilekcesi",
        label: "Gelen Dava Dilekçesi (Metin)",
        type: "textarea",
        required: true,
        placeholder: "Davacının dava dilekçesini buraya yapıştırın (metin/Markdown)"
      }
    ],
  },

  kira: {
    label: "Kira (Tahliye / Alacak)",
    fields: [
      {
        id: "tasinmaz_adresi",
        label: "Taşınmaz Adresi",
        type: "textarea",
        required: true,
        placeholder: "İl / İlçe / Mahalle / Cadde / No / Daire ...",
      },
      { id: "sozlesme_tarihi", label: "Kira Sözleşmesi Tarihi", type: "date", required: false },
      {
        id: "aylik_kira_bedeli",
        label: "Aylık Kira Bedeli (TL)",
        type: "number",
        step: "0.01",
        required: false,
      },
      {
        id: "kira_turu",
        label: "Kira Türü",
        type: "select",
        required: false,
        options: [
          { value: "konut", label: "Konut" },
          { value: "isyeri", label: "İşyeri" },
        ],
      },
      { id: "artis_orani", label: "Artış Oranı / Şekli", type: "text", required: false },
      {
        id: "odemeler",
        label: "Ödeme Geçmişi / Eksik Ödemeler",
        type: "textarea",
        required: false,
        placeholder: "Ay ay yapılan/eksik ödemeler...",
      },
      { id: "ihtar_tarihi", label: "İhtar/İhbar Tarihi", type: "date", required: false },
      {
        id: "ihtarname_icerigi",
        label: "İhtarname İçeriği",
        type: "textarea",
        required: false,
        placeholder: "Tahliye talep edildi mi, ödeme için makul süre verildi mi... ",
      },
      {
        id: "tahliye_sebebi",
        label: "Tahliye Sebebi",
        type: "select",
        required: false,
        options: [
          { value: "odeme_yapilmamasi", label: "Ödeme Yapılmaması (TBK 315)" },
          { value: "ihtiyac", label: "İhtiyaç Nedeni (TBK 350)" },
          { value: "yeniden_insa", label: "Yeniden İnşa / İmar (TBK 350)" },
          { value: "iki_hakli_ihtar", label: "İki Haklı İhtar" },
          { value: "surenin_sona_ermesi", label: "Sürenin Sona Ermesi" },
          { value: "temerrut", label: "Temerrüt" },
          { value: "tahliye_taahutu", label: "Tahliye Taahüdü" },
          { value: "diger", label: "Diğer" },
        ],
      },
      {
        id: "ek_bilgiler",
        label: "Diğer Önemli Hususlar",
        type: "textarea",
        required: false,
        placeholder: "Örn: Depozito, teslim-tesellüm, ayıplar, komşu şikayetleri, vb.",
      },
    ],
  },

  kira_tespiti: {
    label: "Kira Tespit Davası",
    fields: [
      {
        id: "tasinmaz_adresi",
        label: "Taşınmaz Adresi",
        type: "textarea",
        required: true,
        placeholder: "İl / İlçe / Mahalle / Cadde / No / Daire ...",
      },
      { id: "mevcut_kira", label: "Mevcut Kira (TL)", type: "number", step: "0.01", required: true },
      { id: "emsal_kira", label: "Emsal Kira (TL)", type: "number", step: "0.01", required: false },
      { id: "sozlesme_tarihi", label: "Sözleşme Tarihi", type: "date", required: false },
      { id: "yeni_donem_basi", label: "Yeni Dönem Başlangıcı", type: "date", required: false },
    ],
  },

  bosanma: {
    label: "Aile (Boşanma / Nafaka / Velayet / Mal Rejiminin Tasfiyesi)",
    fields: [
      { id: "es_ad_soyad", label: "Davalı Eş Adı Soyadı", type: "text", required: true },
      { id: "evlilik_tarihi", label: "Evlilik Tarihi", type: "date", required: false },
      {
        id: "cocuk_bilgileri",
        label: "Çocuk Bilgileri",
        type: "textarea",
        required: false,
        placeholder: "Ad-soyad / doğum tarihi / özel durumlar...",
      },
      {
        id: "nafaka_talebi",
        label: "Nafaka Talebi",
        type: "select",
        required: false,
        options: [
          { value: "yoksulluk", label: "Yoksulluk Nafakası" },
          { value: "tedbir", label: "Tedbir Nafakası" },
          { value: "istirak", label: "İştirak Nafakası" },
          { value: "artirim", label: "Nafaka Artırımı" },
          { value: "yok", label: "Yok" },
        ],
      },
      {
        id: "siddet_ve_vakialar",
        label: "Vakıalar / Şiddet İddiaları",
        type: "textarea",
        required: false,
        placeholder: "Kronolojik vakıa özeti, sağlık raporları, koruma kararları vb.",
      },
      {
        id: "mal_rejimi",
        label: "Mal Rejimi / Tazmin Talepleri",
        type: "textarea",
        required: false,
        placeholder: "Katkı payı, değer artış payı, ziynet, maddi-manevi tazminat talepleri...",
      },
    ],
  },

  iscilik: {
    label: "İşçilik Alacakları",
    fields: [
      { id: "isveren_unvan", label: "İşveren Unvan/Adı", type: "text", required: true },
      { id: "isyeri_adresi", label: "İşyeri Adresi", type: "textarea", required: false },
      { id: "pozisyon", label: "Görev/Unvan", type: "text", required: false },
      { id: "ise_giris", label: "İşe Giriş Tarihi", type: "date", required: true },
      { id: "is_cikis", label: "İşten Ayrılış Tarihi", type: "date", required: false },
      { id: "brut_ucret", label: "Brüt Ücret (TL)", type: "number", step: "0.01", required: true },
      {
        id: "odeme_sekli",
        label: "Ücret Ödeme Şekli",
        type: "select",
        required: false,
        options: [
          { value: "banka", label: "Banka" },
          { value: "elden ödeme", label: "Elden Ödeme" },
        ],
      },
      {
        id: "hafta_tatili",
        label: "Hafta Tatili",
        type: "textarea",
        required: false,
        placeholder: "Çalışılan Hafta Sonları, Kaç Saat Çalışıldığı...",
      },
      {
        id: "fazla_mesai",
        label: "Fazla Mesai Alacağı",
        type: "textarea",
        required: false,
        placeholder: "Mesaiye Kalınan Gün, Saat...",
      },
      {
        id: "ubgt_alacagi",
        label: "UBGT Alacağı",
        type: "textarea",
        required: false,
        placeholder: "Çalışılan Bayramlar, Resmi Tatiller...",
      },
      {
        id: "yillik_izin",
        label: "Yıllık İzin Alacağı",
        type: "text",
        required: false,
        placeholder: "Kullanılmayan İzinler",
      },
      {
        id: "is_akit_feshi",
        label: "Fesih Şekli ve Sebebi",
        type: "textarea",
        required: false,
        placeholder: "Haklı nedenle fesih iddiası, çıkış kodu, ihtarname vb.",
      },
    ],
  },

  trafik_tazminat: {
    label: "Trafik Kazası (Maddi/Manevi Tazminat)",
    fields: [
      { id: "kaza_tarihi", label: "Kaza Tarihi", type: "date", required: true },
      { id: "kaza_yeri", label: "Kaza Yeri", type: "text", required: true },
      { id: "davaci_plaka", label: "Davacı Araç Plakası", type: "text", required: false },
      { id: "davalı_plaka", label: "Davalı Araç Plakası", type: "text", required: false },
      { id: "polis_tutanagi", label: "Polis/Jandarma Tutanak No", type: "text", required: false },
      { id: "sigorta_sirketi", label: "Sigorta Şirketi", type: "text", required: false },
      { id: "hasar_bedeli", label: "Hasar/Masraf Bedelleri (TL)", type: "number", step: "0.01", required: false },
      { id: "maluliyet_orani", label: "Maluliyet/İş Gücü Kaybı (%)", type: "number", step: "0.01", required: false },
    ],
  },

  tapu_iptal_tescil: {
    label: "Tapu İptali ve Tescil",
    fields: [
      { id: "il_ilce", label: "İl / İlçe", type: "text", required: true },
      { id: "ada", label: "Ada", type: "text", required: false },
      { id: "parsel", label: "Parsel", type: "text", required: false },
      { id: "nitelik", label: "Taşınmaz Niteliği", type: "text", required: false },
      {
        id: "sebep",
        label: "Sebep",
        type: "select",
        required: true,
        options: [
          { value: "muris_muvazaasi", label: "Muris Muvazaası" },
          { value: "vekalet_kotuye", label: "Vekaletin Kötüye Kullanılması" },
          { value: "sahtecilik", label: "Belgede Sahtecilik" },
          { value: "ehliyetsizlik", label: "Ehliyetsizlik" },
          { value: "satis_vaadi", label: "Satış Vaadi" },
          { value: "diger", label: "Diğer" },
        ],
      },
      { id: "islem_tarihleri", label: "İşlem/Tapu Tarihleri", type: "textarea", required: false },
      { id: "muris_malik_bilgi", label: "Muris/Malik Bilgileri", type: "textarea", required: false },
    ],
  },

  izale_i_suyu: {
    label: "Ortaklığın Giderilmesi (İzale-i Şuyu)",
    fields: [
      { id: "tasinmaz_bilgileri", label: "Taşınmaz Bilgileri", type: "textarea", required: true },
      { id: "paydaslar", label: "Paydaşlar ve Pay Oranları", type: "textarea", required: true },
      {
        id: "aynen_taksim_mumkun",
        label: "Aynen Taksim Mümkün mü?",
        type: "select",
        required: false,
        options: [
          { value: "evet", label: "Evet" },
          { value: "hayir", label: "Hayır (Satış Yoluyla)" },
        ],
      },
      { id: "kullanim_durumu", label: "Fiili Kullanım / İntifa", type: "textarea", required: false },
    ],
  },

  ecrimisil: {
    label: "Ecrimisil (İşgal Tazminatı)",
    fields: [
      { id: "tasinmaz_bilgileri", label: "Taşınmaz Bilgileri", type: "textarea", required: true },
      { id: "kullanim_baslangic", label: "Kullanım Başlangıcı", type: "date", required: true },
      { id: "kullanim_bitis", label: "Kullanım Bitişi", type: "date", required: false },
      { id: "emsal_kira", label: "Emsal Kira (TL)", type: "number", step: "0.01", required: false },
      { id: "yasaya_aykiri_nitelik", label: "Yasaya Aykırı Kullanım Niteliği", type: "textarea", required: false },
    ],
  },

  kamulastirmasiz_el_atma: {
    label: "Kamulaştırmasız El Atma",
    fields: [
      { id: "idare_adi", label: "İdare Adı", type: "text", required: true },
      { id: "tasinmaz_bilgileri", label: "Taşınmaz Bilgileri (Ada/Parsel)", type: "textarea", required: true },
      { id: "el_atma_tarihi", label: "El Atma Tarihi", type: "date", required: false },
      {
        id: "el_atma_sekli",
        label: "El Atma Şekli",
        type: "select",
        required: false,
        options: [
          { value: "fiili", label: "Fiili Yol" },
          { value: "hukuki", label: "Hukuki El Atma (İmar vb.)" },
        ],
      },
      { id: "bedel_tespiti_emsal", label: "Bedel Tespiti / Emsaller", type: "textarea", required: false },
    ],
  },

  menfi_tespit: {
    label: "Menfi Tespit (Borcun Bulunmadığının Tespiti)",
    fields: [
      { id: "alacakli_unvan", label: "Alacaklı Unvan/Adı", type: "text", required: true },
      { id: "borclu_unvan", label: "Borçlu Unvan/Adı", type: "text", required: false },
      { id: "takip_dosyasi_no", label: "İcra Dosyası No", type: "text", required: false },
      { id: "icra_mudurlugu", label: "İcra Dairesi/Müdürlüğü", type: "text", required: false },
      { id: "borcun_sebebi", label: "Borcun Dayanağı", type: "textarea", required: true },
      {
        id: "ihtiyati_tedbir",
        label: "İhtiyati Tedbir Talebi",
        type: "select",
        required: false,
        options: [
          { value: "evet", label: "Evet" },
          { value: "hayir", label: "Hayır" },
        ],
      },
    ],
  },

  itirazin_iptali: {
    label: "İtirazın İptali",
    fields: [
      { id: "icra_dosyasi_no", label: "İcra Dosyası No", type: "text", required: true },
      { id: "alacak_tutari", label: "Alacak Tutarı (TL)", type: "number", step: "0.01", required: true },
      { id: "alacak_kalemi", label: "Alacak Kalemleri", type: "textarea", required: false },
      { id: "sozlesme_turu", label: "Sözleşme/İlişki Türü", type: "text", required: false },
      { id: "faiz_talebi", label: "Faiz Talebi", type: "text", required: false },
      { id: "takip_tarihi", label: "Takip Tarihi", type: "date", required: false },
    ],
  },

  diger: {
    label: "Diğer (Listede Olmayan Dava)",
    fields: [
      { id: "diger_dava_turu", label: "Dava Türü", type: "text", required: true },
    ],
  },

  tespit_davasi: {
    label: "Tespit Davası",
    fields: [
      { id: "tespit_konusu", label: "Tespit Konusu", type: "text", required: true },
      {
        id: "hukuki_yarar",
        label: "Hukuki Yarar Gerekçesi",
        type: "textarea",
        required: true,
        placeholder: "Neden tespit hükmüne ihtiyaç var?",
      },
      { id: "delil_durumu", label: "Delil Durumu", type: "textarea", required: false },
    ],
  },

  tuketici: {
    label: "Tüketici Hukuku",
    fields: [
      { id: "alt_tur", label: "Alt Tür", type: "select", required: true,
        options: [
          { value: "ayipli_mal_hizmet", label: "Ayıplı Mal/Hizmet – İade/Ayıp Oranı" },
          { value: "mesafeli_satis", label: "Mesafeli Satış / Cayma Hakkı" },
          { value: "abonelik_feshi_cezai_sart", label: "Abonelik Feshi / Cezai Şart (internet/enerji/telefon)" },
          { value: "konut_on_odemeli_teslim_gecikme", label: "Konut Ön Ödemeli Satış / Teslimde Gecikme" },
        ],
      },
      { id: "satici_unvan", label: "Satıcı/Servis Unvanı", type: "text", required: true },
      { id: "urun_hizmet", label: "Ürün/Hizmet", type: "text", required: true },
      { id: "bedel", label: "Bedel (TL)", type: "number", step: "0.01", required: false },
      { id: "fatura_tarihi", label: "Fatura/Alış Tarihi", type: "date", required: false },
      { id: "surec", label: "Başvuru/Servis Süreci", type: "textarea", required: false },
      { id: "ayip_orani", label: "Ayıp Oranı / Eksiklik", type: "text", required: false },
      { id: "cayma_hakki_kullanimi", label: "Cayma Hakkı Kullanımı", type: "textarea", required: false },
      { id: "abonelik_sozlesme_tarihi", label: "Abonelik Sözleşme Tarihi", type: "date", required: false },
      { id: "cezai_sart_miktari", label: "Cezai Şart Miktarı", type: "number", step: "0.01", required: false },
      { id: "teslim_tarihi_beklenen", label: "Beklenen Teslim Tarihi", type: "date", required: false },
    ],
  },

  nafaka_artirimi: {
    label: "Nafaka Artırımı/İndirimi",
    fields: [
      { id: "karar_bilgisi", label: "Önceki Karar/Protokol Bilgisi", type: "textarea", required: true },
      { id: "mevcut_nafaka", label: "Mevcut Nafaka (TL)", type: "number", step: "0.01", required: true },
      { id: "talep_edilen_nafaka", label: "Talep Edilen Nafaka (TL)", type: "number", step: "0.01", required: false },
      {
        id: "gelir_gider",
        label: "Gelir-Gider ve Koşul Değişikliği",
        type: "textarea",
        required: false,
        placeholder: "Tarafların gelir-gider değişikliği, ihtiyaçlar...",
      },
    ],
  },

  is_kazasi: {
    label: "İş Kazası / Meslek Hastalığı (Tazminat)",
    fields: [
      { id: "kaza_tarihi", label: "Olay Tarihi", type: "date", required: true },
      { id: "kaza_yeri", label: "Olay Yeri", type: "text", required: false },
      { id: "isveren_unvan", label: "İşveren", type: "text", required: true },
      { id: "kusur_durumu", label: "Kusur / İhmal İddiaları", type: "textarea", required: false },
      { id: "maluliyet_orani", label: "Maluliyet Oranı (%)", type: "number", step: "0.01", required: false },
      { id: "saglik_raporlari", label: "Sağlık Raporları / Tedavi", type: "textarea", required: false },
      { id: "maddi_manevi_talep", label: "Talep (Maddi/Manevi)", type: "textarea", required: true },
    ],
  },

  malpraktis: {
    label: "Hekim Hatası (Malpraktis)",
    fields: [
      { id: "saglik_kurumu", label: "Sağlık Kurumu / Hekim", type: "text", required: true },
      { id: "mudehale_tarihi", label: "Müdahale / Tedavi Tarihi", type: "date", required: false },
      { id: "aydinlatilmis_riza", label: "Aydınlatılmış Rıza Durumu", type: "textarea", required: false },
      { id: "hata_aciklamasi", label: "Hata / İhmal Açıklaması", type: "textarea", required: true },
      { id: "bilirkisi_raporu", label: "Rapor / Şikayet / İnceleme", type: "textarea", required: false },
      { id: "tazminat_talebi", label: "Talep (Maddi/Manevi)", type: "textarea", required: true },
    ],
  },

  sozlesmeye_aykirilik: {
    label: "Sözleşmeye Aykırılık (Satış/Eser/Vekâlet)",
    fields: [
      { id: "sozlesme_turu", label: "Sözleşme Türü", type: "select", required: true,
        options: [
          { value: "satis", label: "Satış" },
          { value: "eser", label: "Eser" },
          { value: "vekalet", label: "Vekâlet" },
        ],
      },
      { id: "sozlesme_tarihi", label: "Sözleşme Tarihi", type: "date", required: false },
      { id: "bedel", label: "Bedel (TL)", type: "number", step: "0.01", required: false },
      { id: "ayip_iddialari", label: "Ayıp / Aykırılık", type: "textarea", required: true },
      { id: "ifa_durumu", label: "İfa / Teslim Durumu", type: "textarea", required: false },
      { id: "ihtarlar", label: "İhtarlar / Yazışmalar", type: "textarea", required: false },
      { id: "tazminat_talebi", label: "Talep (Bedel/İndirim/İfa/İptal)", type: "textarea", required: true },
    ],
  },

  manevi_tazminat: {
    label: "Manevi Tazminat (Kişilik Haklarına Saldırı)",
    fields: [
      { id: "saldiri_turu", label: "Saldırı Türü", type: "select", required: true,
        options: [
          { value: "hakaret", label: "Hakaret / İftira" },
          { value: "haksiz_yayin", label: "Haksız Yayın" },
          { value: "kisisel_veri", label: "Kişisel Verilerin İhlali" },
          { value: "diger", label: "Diğer" },
        ],
      },
      { id: "olay_ozet", label: "Olay Özeti", type: "textarea", required: true },
      { id: "deliller", label: "Deliller (Link/Dosya Açıklaması)", type: "textarea", required: false },
      { id: "manevi_talep", label: "Manevi Tazminat Talebi", type: "text", required: false },
    ],
  },

  veraset_ilami: {
    label: "Çekişmesiz: Veraset İlamı",
    fields: [
      { id: "muris_adi", label: "Muris Adı Soyadı", type: "text", required: true },
      { id: "olum_tarihi", label: "Ölüm Tarihi", type: "date", required: false },
      { id: "nufus_kaydi", label: "Nüfus Kayıt Bilgileri", type: "textarea", required: false },
      { id: "mirasci_listesi", label: "Bilinen Mirasçılar", type: "textarea", required: false },
    ],
  },

  isim_yas_tashihi: {
    label: "Çekişmesiz: İsim/Yaş Tashihi",
    fields: [
      { id: "duzeltilecek_bilgi", label: "Düzeltilecek Bilgi", type: "text", required: true },
      { id: "gerekce", label: "Gerekçe", type: "textarea", required: true },
      { id: "deliller", label: "Deliller", type: "textarea", required: false },
    ],
  },

  vesayet_kayyim: {
    label: "Çekişmesiz: Vesayet / Kayyım",
    fields: [
      { id: "kisi_bilgisi", label: "Vesayet Altına Alınacak Kişi", type: "text", required: true },
      { id: "gerekceler", label: "Gerekçeler / Sağlık Raporu", type: "textarea", required: false },
      { id: "talep", label: "Talep", type: "textarea", required: true },
    ],
  },

  delil_tespiti: {
    label: "Çekişmesiz: Delil Tespiti",
    fields: [
      { id: "tespit_konusu", label: "Tespit Konusu", type: "text", required: true },
      { id: "aciliyet", label: "Acil/Acil Değil", type: "select", required: false,
        options: [
          { value: "acil", label: "Acil" },
          { value: "normal", label: "Normal" },
        ],
      },
      { id: "gerekce", label: "Gerekçe", type: "textarea", required: true },
    ],
  },

  erisim_engeli_5651: {
    label: "Çekişmesiz: Erişim Engeli / İçerik Kaldırma (5651)",
    fields: [
      { id: "url", label: "URL/Platform", type: "text", required: true },
      { id: "icerik_turu", label: "İçerik Türü", type: "select", required: false,
        options: [
          { value: "haber", label: "Haber" },
          { value: "sosyal_medya", label: "Sosyal Medya" },
          { value: "forum", label: "Forum" },
          { value: "diger", label: "Diğer" },
        ],
      },
      { id: "ihlaller", label: "İhlal Edildiği İddia Edilen Haklar", type: "textarea", required: true },
      { id: "aciliyet", label: "Acil/Acil Değil", type: "select", required: false,
        options: [
          { value: "acil", label: "Acil" },
          { value: "normal", label: "Normal" },
        ],
      },
    ],
  },

  kat_karsiligi_insaat: {
    label: "Kat Karşılığı İnşaat Sözleşmesi",
    fields: [
      { id: "arsa_sahibi", label: "Arsa Sahibi", type: "text", required: true },
      { id: "yuklenici", label: "Yüklenici", type: "text", required: true },
      { id: "sozlesme_tarihi", label: "Sözleşme Tarihi", type: "date", required: false },
      { id: "arsa_pay_orani", label: "Arsa Payı / Bağımsız Bölüm", type: "text", required: false },
      { id: "teslim_suresi", label: "Teslim Süresi / Tarihi", type: "text", required: false },
      { id: "iskan_durumu", label: "İskan / Ruhsat", type: "text", required: false },
      { id: "eksiklikler", label: "Eksiklik / Ayıplar", type: "textarea", required: false },
      { id: "cezai_sart", label: "Cezai Şart / Gecikme", type: "text", required: false },
    ],
  },
};

// Alan render helper
function FieldInput({ field, value, onChange }) {
  const common =
    "w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500";
  if (field.type === "textarea") {
    return (
      <textarea
        className={common}
        rows={field.rows || 3}
        placeholder={field.placeholder || ""}
        value={value || ""}
        onChange={(e) => onChange(field.id, e.target.value)}
        required={!!field.required}
      />
    );
  }
  if (field.type === "select") {
    return (
      <select
        className={common}
        value={value || ""}
        onChange={(e) => onChange(field.id, e.target.value)}
        required={!!field.required}
      >
        <option value="">Seçiniz</option>
        {(field.options || []).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
  // Özel: Sayı alanları için binde ayıracı (.) ve isteğe bağlı ondalık (,) biçimleme
  if (field.type === "number") {
    const formatThousandsTr = (raw) => {
      const str = String(raw || "");
      // Önce mevcut binlik noktalarını sil, sadece rakam ve virgülü tut
      const cleaned = str.replace(/\./g, "").replace(/[^\d,]/g, "");
      const [intPartRaw, decPart] = cleaned.split(",", 2);
      const intPart = (intPartRaw || "").replace(/^0+(?=\d)/, "");
      const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return decPart !== undefined && decPart !== "" ? `${withDots},${decPart}` : withDots;
    };

    const handleNumberChange = (e) => {
      const formatted = formatThousandsTr(e.target.value);
      onChange(field.id, formatted);
    };

    return (
      <input
        className={common}
        type="text"
        inputMode="numeric"
        placeholder={field.placeholder || ""}
        value={value || ""}
        onChange={handleNumberChange}
        required={!!field.required}
      />
    );
  }
  return (
    <input
      className={common}
      type={field.type || "text"}
      step={field.step || undefined}
      placeholder={field.placeholder || ""}
      value={value || ""}
      onChange={(e) => onChange(field.id, e.target.value)}
      required={!!field.required}
    />
  );
}

export default function DilekcePage() {
  // Form state
  const [olayOzet, setOlayOzet] = useState("");
  const [talep, setTalep] = useState("");
  const [davaciAdSoyad, setDavaciAdSoyad] = useState("");
  const [davaliAdSoyad, setDavaliAdSoyad] = useState("");
  const [delillerInput, setDelillerInput] = useState("");

  // Dava türü + dinamik alanlar
  const [caseType, setCaseType] = useState("");
  const [extraValues, setExtraValues] = useState({}); // { alanId: deger }

  // UI state
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Oluşturuluyor, 3: Sonuç
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("dilekce"); // dilekce | kaynaklar | girdi

  // Mevzuat popover & madde önbellek
  const [openMevzuat, setOpenMevzuat] = useState(null); // { key, el, top, left, placement }
  const [maddeCache, setMaddeCache] = useState({});
  const pendingMadde = useRef(new Set());

  // Yükleme adımlarını sırayla göstermek için
  const [loadStepIdx, setLoadStepIdx] = useState(0);

  useEffect(() => {
    if (step !== 2) return;
    setLoadStepIdx(0);
    let cancelled = false;
    let timeoutId = null;

    function nextStep(currentIdx) {
      // Determine duration for current index
      let duration = 2000;
      if (currentIdx === 0 || currentIdx === 1) duration = 10000;
      else if (currentIdx === 2) duration = 15000;
      else duration = 2000;

      // Only cycle if not at the last message
      if (currentIdx < LOADING_MESSAGES.length - 1) {
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          setLoadStepIdx((idx) => {
            // Only increment if not at last index
            if (idx < LOADING_MESSAGES.length - 1) {
              // Schedule next step
              nextStep(idx + 1);
              return idx + 1;
            }
            // Stay at last message
            return idx;
          });
        }, duration);
      }
      // If at last message, do not schedule further timeout (stay until step changes)
    }

    // Start recursive timeout
    nextStep(0);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [step]);

  // Sonuç state
  const [result, setResult] = useState(null); // tüm JSON
  const [dilekceMd, setDilekceMd] = useState("");
  const [saving, setSaving] = useState(false);
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);

  // Önizleme alanı (PDF/DOCX export için)
  const dilekcePreviewRef = useRef(null);

  const pollTimerRef = useRef(null);

  const deliller = useMemo(
    () =>
      delillerInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    [delillerInput]
  );

  const olayCharCount = olayOzet.trim().length;

  const activeCaseConfig = CASE_TYPES[caseType] || CASE_TYPES[""];
  const activeFields = activeCaseConfig.fields || [];

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  // Popover kapatma (dışarı tıklama / ESC)
  useEffect(() => {
    function onDocClick(e) {
      const t = e?.target;
      if (t && t.closest && t.closest('[data-mevzuat-popover="1"]')) return;
      setOpenMevzuat(null);
    }
    function onEsc(e) { if (e.key === "Escape") setOpenMevzuat(null); }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // Popover açıkken scroll/resize ile pozisyonu güncelle
  useEffect(() => {
    if (!openMevzuat?.el) return;
    function update() {
      setOpenMevzuat(prev => {
        if (!prev?.el) return prev;
        const pos = calcMevzuatPopover(prev.el);
        return { ...prev, ...pos };
      });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [openMevzuat?.el]);
  // Dava türü değişince dinamik alanları sıfırla
  function handleCaseTypeChange(val) {
    setCaseType(val);
    setExtraValues({}); // eski alanları temizle
  }

  function handleExtraChange(fieldId, fieldValue) {
    setExtraValues((prev) => ({ ...prev, [fieldId]: fieldValue }));
  }

  // Gerekli alanları doğrula (dava türü + dinamik alanlar)
  function validateForm() {
    // CEVAP modu: yalnızca gelen dava dilekçesi zorunlu
    if (caseType === "cevap") {
      const pasted = (extraValues["gelen_dava_dilekcesi"] || "").trim();
      if (pasted.length < 20) {
        setError("Lütfen gelen dava dilekçesini metin olarak ekleyin (en az 20 karakter).");
        return false;
      }
      setError("");
      return true;
    }

    // Standart (dava) modu kontrolleri
    if (olayCharCount < 20) {
      setError("Olay özeti en az 20 karakter olmalı.");
      return false;
    }
    if (talep.trim().length < 5) {
      setError("Talep en az 5 karakter olmalı.");
      return false;
    }
    if (!caseType) {
      setError("Lütfen bir dava türü seçiniz.");
      return false;
    }
    const missing = activeFields
      .filter((f) => f.required)
      .filter((f) => !extraValues[f.id] || String(extraValues[f.id]).trim() === "")
      .map((f) => f.label);
    if (missing.length) {
      setError(`Eksik zorunlu alan(lar): ${missing.join(", ")}`);
      return false;
    }
    setError("");
    return true;
  }

async function saveDraftToDB(draft) {
  try {
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    // Always read text first so we can show useful errors even if JSON değilse
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      const msg =
        (json && (json.error || json.message || json.detail)) ||
        text ||
        "Taslak kaydı başarısız";
      throw new Error(msg);
    }

    return json || {};
  } catch (e) {
    console.error("saveDraftToDB error:", e);
    throw e;
  }
}

async function fetchRecentDrafts(limit = 50) {
  try {
    const res = await fetch(`/api/drafts?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    setRecentDrafts(Array.isArray(json?.items) ? json.items : (Array.isArray(json) ? json : []));
  } catch (e) {
    console.error("fetchRecentDrafts error:", e);
  }
}

function loadDraft(d) {
  // DB'den dönen alan adları örnek: id, createdAt, dava_turu, olay_ozet, talep, dilekce_md, kaynaklar, girdi_ozeti
  setCaseType(d?.dava_turu || "");
  setOlayOzet(d?.olay_ozet || "");
  setTalep(d?.talep || "");
  setDavaciAdSoyad(d?.davaci?.ad_soyad || "");
  setDavaliAdSoyad(d?.davali?.ad_soyad || "");
  setDelillerInput(
    Array.isArray(d?.eldeki_deliller) ? d.eldeki_deliller.join("\n") : (d?.eldeki_deliller || "")
  );

  setDilekceMd(d?.dilekce_md || "");

  setResult({
    girdi_ozeti:
      d?.girdi_ozeti || {
        olay_ozet: d?.olay_ozet,
        talep: d?.talep,
        davaci: d?.davaci,
        davali: d?.davali,
        eldeki_deliller: d?.eldeki_deliller,
      },
    kaynaklar: d?.kaynaklar || {},
    dilekce: {
      dilekce_md: d?.dilekce_md || "",
      dayanaklar: normalizeDayanaklar(
        d?.dilekce_json?.dayanaklar ||
        d?.dayanaklar ||
        d?.kaynaklar?.dayanaklar),
      davada_dikkat: normalizeDavadaDikkat(
        d?.dilekce_json?.davada_dikkat || d?.dilekce?.davada_dikkat || d?.davada_dikkat
      ),
    },
  });

  setStep(3);
  setActiveTab("dilekce");
}

// Dayanak stringlerini (result?.dilekce?.dayanaklar) parse et
  const parsedDayanaklar = useMemo(() => {
    const arr = Array.isArray(result?.dilekce?.dayanaklar) ? result.dilekce.dayanaklar : [];
    return arr.map(parseDayanakString).filter(Boolean);
  }, [result?.dilekce?.dayanaklar]);

  // Popover açıldığında hızlı gelsin diye önceden madde metinlerini çek
  useEffect(() => {
    parsedDayanaklar.forEach(d => {
      if (d?.kanun && d?.madde) {
        ensureMaddeInCache(d.kanun, d.madde, setMaddeCache, pendingMadde);
      }
    });
  }, [parsedDayanaklar]);

async function finalizeResult(finalObj) {
  const md =
    finalObj?.dilekce?.dilekce_md ||
    finalObj?.taslak_md ||
    (typeof finalObj?.dilekce?.taslak_md === "string" ? finalObj.dilekce.taslak_md : "");

  const finalForUI = {
    ...finalObj,
    dilekce: {
      ...(finalObj?.dilekce || {}),
      dayanaklar: normalizeDayanaklar(finalObj?.dilekce?.dayanaklar),
    },
  };

  // Yeni alanı normalize et
  if (finalForUI && finalForUI.dilekce) {
    finalForUI.dilekce.davada_dikkat = normalizeDavadaDikkat(
      finalForUI.dilekce.davada_dikkat
    );
  }

  setResult(finalForUI);
  setDilekceMd(md || "");
  setStep(3);
  setLoading(false);

  // DB’ye kaydet
  try {
    setSaving(true);
    const dayanakOut =
      Array.isArray(finalForUI?.dilekce?.dayanaklar) && finalForUI.dilekce.dayanaklar.length
        ? finalForUI.dilekce.dayanaklar
        : null;
    await saveDraftToDB({
      dava_turu: caseType,
      olay_ozet: olayOzet.trim(),
      talep: talep.trim(),
      dilekce_md: md || "",
      kaynaklar: finalForUI?.kaynaklar || null,
      girdi_ozeti: finalForUI?.girdi_ozeti || null,
      dilekce_json: finalForUI?.dilekce || null,
      dayanaklar: dayanakOut,
    });
    await fetchRecentDrafts();
  } catch (e) {
    console.error("Taslak kaydı başarısız:", e);
    setError(`Taslak DB'ye kaydedilemedi: ${e?.message || e}`);
  } finally {
    setSaving(false);
  }
}

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setDilekceMd("");
    setActiveTab("dilekce");

    if (!validateForm()) return;

    setLoading(true);
    setStep(2);

    const API_BASE = process.env.NEXT_PUBLIC_DILEKCE_API_BASE || "http://51.159.28.179:5003";

    try {
      const payload = {
        olay_ozet: olayOzet.trim(),
        talep: talep.trim(),
        dava_turu: caseType,
        dilekce_tipi: caseType === "cevap" ? "cevap" : "dava",
        ozel_bilgiler: {
          tip: caseType,
          alanlar: extraValues,
        },
        ...(davaciAdSoyad.trim() ? { davaci: { ad_soyad: davaciAdSoyad.trim() } } : {}),
        ...(davaliAdSoyad.trim() ? { davali: { ad_soyad: davaliAdSoyad.trim() } } : {}),
        ...(deliller.length ? { eldeki_deliller: deliller } : {}),
        ...(caseType === "cevap"
          ? { gelen_dava_dilekcesi: (extraValues["gelen_dava_dilekcesi"] || "").trim() }
          : {}),
      };

      // 1) Önce Next.js proxy route'u dene (CORS yok)
      let data;
      let res;
      try {
        res = await fetch("/api/dilekce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        data = await res.json().catch(() => undefined);
      } catch (_) {
        data = undefined;
      }

      // 1.a) Proxy direkt sonucu verdiyse bitir (id yoksa bile ikinci POST atma)
      if (res?.ok && data && (data?.dilekce || data?.taslak_md || data?.durum === "completed")) {
        const finalObj = data?.dilekce
          ? data
          : { dilekce: { dilekce_md: data?.taslak_md || "" }, kaynaklar: data?.kaynaklar, girdi_ozeti: data?.girdi_ozeti };
        await finalizeResult(finalObj);
        return;
      }

      // 1.b) Proxy id verdiyse poll et
      if (res?.ok && data?.id) {
        const id = data.id;

        const startTs = Date.now();
        const timeoutMs = 180_000; // 60 sn

        const pollOnce = async () => {
          let j;
          try {
            const r = await fetch(`/api/dilekce?id=${encodeURIComponent(id)}`, { cache: "no-store" });
            j = await r.json().catch(() => undefined);
          } catch (_) {
            j = undefined;
          }

          // Gerekirse doğrudan Flask'tan dene (proxy çökerse)
          if (!j) {
            const dr = await fetch(`${API_BASE}/dilekce/durum/${encodeURIComponent(id)}`, { cache: "no-store" });
            j = await dr.json().catch(() => undefined);
          }

          if (j?.durum === "completed") {
            await finalizeResult(j);
            return true;
          }
          if (j?.durum === "failed") {
            throw new Error(j?.hata || "Dilekçe hazırlama başarısız.");
          }
          return false;
        };

        let done = await pollOnce();
        while (!done) {
          if (Date.now() - startTs > timeoutMs) {
            throw new Error("İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.");
          }
          await new Promise((r) => setTimeout(r, 1500));
          done = await pollOnce();
        }
        return;
      }

      // 1.c) Proxy işe yaramadı → tek seferlik doğrudan Flask
      const directRes = await fetch(`${API_BASE}/dilekce/olustur`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const directJson = await directRes.json().catch(() => undefined);

      // Sunucu direkt sonucu döndürdüyse finalize et
      if (directJson?.dilekce || directJson?.taslak_md || directJson?.durum === "completed") {
        const finalObj = directJson?.dilekce
          ? directJson
          : { dilekce: { dilekce_md: directJson?.taslak_md || "" }, kaynaklar: directJson?.kaynaklar, girdi_ozeti: directJson?.girdi_ozeti };
        await finalizeResult(finalObj);
        return;
      }

      // Kuyruk modeli ise id ile poll et (doğrudan Flask)
      if (directJson?.id) {
        const id = directJson.id;

        const startTs = Date.now();
        const timeoutMs = 60_000; // 60 sn

        const pollOnce = async () => {
          let j;
          try {
            const dr = await fetch(`${API_BASE}/dilekce/durum/${encodeURIComponent(id)}`, { cache: "no-store" });
            j = await dr.json().catch(() => undefined);
          } catch (_) {
            j = undefined;
          }

          if (j?.durum === "completed") {
            await finalizeResult(j);
            return true;
          }
          if (j?.durum === "failed") {
            throw new Error(j?.hata || "Dilekçe hazırlama başarısız.");
          }
          return false;
        };

        let done = await pollOnce();
        while (!done) {
          if (Date.now() - startTs > timeoutMs) {
            throw new Error("İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.");
          }
          await new Promise((r) => setTimeout(r, 1500));
          done = await pollOnce();
        }
        return;
      }

      throw new Error("Sunucudan beklenen veri alınamadı.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Bilinmeyen hata.");
      setLoading(false);
      setStep(1);
    }
  }

  async function handleCopy() {
    if (!dilekceMd) return;
    const ok = await copyToClipboard(dilekceMd);
    setCopied(ok);
    setTimeout(() => setCopied(false), 1800);
  }

  function resetForm() {
    setOlayOzet("");
    setTalep("");
    setDavaciAdSoyad("");
    setDavaliAdSoyad("");
    setDelillerInput("");
    setCaseType("");
    setExtraValues({});
    setError("");
    setResult(null);
    setDilekceMd("");
    setStep(1);
    setActiveTab("dilekce");
  }

  // UI parçaları
  const Stepper = () => {
    const steps = [
      { id: 1, label: "Bilgi" },
      { id: 2, label: "Oluşturuluyor" },
      { id: 3, label: "Sonuç" },
    ];
    return (
      <ol className="flex items-center gap-2 md:gap-4">
        {steps.map((s) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span
                className={[
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold",
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-blue-600 text-white ring-2 ring-blue-300"
                    : "bg-slate-800 text-slate-400",
                ].join(" ")}
              >
                {done ? "✓" : s.id}
              </span>
              <span className={active ? "text-slate-100" : "text-slate-400"}>{s.label}</span>
              {s.id !== 3 && <span className="w-8 md:w-16 h-px bg-slate-700/70 mx-1 md:mx-2" />}
            </li>
          );
        })}
      </ol>
    );
  };

  const LoaderCard = () => (
    <div className="rounded-xl border border-slate-700/60 p-6 bg-slate-900/40 animate-pulse">
      <div className="h-5 w-40 bg-slate-700/60 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-800/60 rounded" />
        <div className="h-4 w-11/12 bg-slate-800/60 rounded" />
        <div className="h-4 w-10/12 bg-slate-800/60 rounded" />
      </div>
    </div>
  );

  // Dikkat Edilecek Hususlar paneli
  const DikkatPanel = ({ data }) => {
    const toList = (arr) =>
      Array.isArray(arr) && arr.length
        ? arr.map((x, i) => <li key={i} className="list-disc ml-5 mb-1">{String(x)}</li>)
        : [<li key="empty" className="ml-5 text-slate-400">—</li>];

    const riskler = Array.isArray(data?.riskler) ? data.riskler : [];
    const karsi  = Array.isArray(data?.karsi_iddialar) ? data.karsi_iddialar : [];
    const delil  = Array.isArray(data?.kritik_deliller) ? data.kritik_deliller : [];

    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 md:p-5">
        <h3 className="text-amber-300 font-semibold text-base md:text-lg mb-2">
          Dikkat Edilecek Hususlar
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-amber-200 font-medium mb-1">Riskler</div>
            <ul>{toList(riskler)}</ul>
          </div>
          <div>
            <div className="text-amber-200 font-medium mb-1">Karşı Tarafın Muhtemel İddiaları</div>
            <ul>{toList(karsi)}</ul>
          </div>
          <div>
            <div className="text-amber-200 font-medium mb-1">Mutlaka Sunulması Gereken Deliller</div>
            <ul>{toList(delil)}</ul>
          </div>
        </div>
      </div>
    );
  };

  const iconPath =
    "M12 18.75a6 6 0 006-6v-1.5a.75.75 0 011.5 0v1.5a7.5 7.5 0 11-15 0v-1.5a.75.75 0 011.5 0v1.5a6 6 0 006 6zM12 9a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75V11.25a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V9z";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black text-gray-100 relative overflow-hidden">
      {CanvasBackground ? <CanvasBackground /> : null}

      <div className="relative z-10 py-6 md:py-8 px-3 sm:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl shadow-xl backdrop-blur-sm">
            {/* Header */}
            <header className="p-6 md:p-8 border-b border-slate-700/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-400 relative -top-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                  </svg>
                  <h1 className="text-xl lg:text-1xl font-bold text-gray-100 leading-tight">
                    Dilekçe Oluşturucu Pro
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { fetchRecentDrafts(); setShowDrafts(true); }}
                    className="ml-0 mr-auto rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-600 transition self-start"
                    title="Son dilekçelerinizi görüntüleyin"
                  >
                    Son Dilekçeleriniz
                  </button>
                  <Stepper />
                </div>
              </div>
              <p className="mt-2 text-slate-400 text-sm">
                Önce dava türünü seçin, ardından olay özetinizi ve talebinizi girin. Diğer alanlar
                seçiminize göre dinamik olarak gelecektir. Dilekçeyi tek
                tıkla kopyalayabilir, Word/PDF formatında indirebilirsiniz.
              </p>
            </header>

            {/* Body */}
            <div className="divide-y divide-slate-700/60">
              {/* Form */}
              {step === 1 && (
                <section className="p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dava Türü */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Dava Türü *</label>
                        <select
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500"
                          value={caseType}
                          onChange={(e) => handleCaseTypeChange(e.target.value)}
                          required
                        >
                          {Object.entries(CASE_TYPES).map(([key, cfg]) => (
                            <option key={key} value={key}>
                              {cfg.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">
                          Örn: Kamulaştırmasız El Atma davası seçildiğinde taşınmaz ada parsel bilgisi gibi alanlar otomatik gelir.
                        </p>
                      </div>

                      {/* Davacı Adı opsiyonel */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Davacı Adı (isteğe bağlı)</label>
                        <input
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Örn. Can Yılmaz"
                          value={davaciAdSoyad}
                          onChange={(e) => setDavaciAdSoyad(e.target.value)}
                        />
                      </div>
                      {/* Talep */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Talep *</label>
                        <input
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Boşanma, 20.000 TL Maddi Tazminat, Kiralananın Tahliyesi..."
                          value={talep}
                          onChange={(e) => setTalep(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Davalı Adı (isteğe bağlı)</label>
                        <input
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Örn. Cem Yılmaz"
                          value={davaliAdSoyad}
                          onChange={(e) => setDavaliAdSoyad(e.target.value)}
                        />
                      </div>
                      

                      {/* Olay Özeti */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Davaya Sebebiyet Veren Somut Olaylar *</label>
                        <textarea
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                          placeholder="Örn. Müvekkilin kocası müvekkili aldatmıştır. Kumar alışkanlığı vardır. Ayrıca müvekkile sürekli hakaret etmektedir."
                          value={olayOzet}
                          onChange={(e) => setOlayOzet(e.target.value)}
                          required
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>En az 20 karakter</span>
                          {caseType === "cevap" && (
                            <span className="ml-2 text-amber-300">(Cevap Dilekçesi modunda zorunlu değil)</span>
                          )}
                          <span>{olayCharCount} karakter</span>
                        </div>
                      </div>

                    

                      {/* Dinamik Alanlar (Dava Türüne Göre) */}
                      {activeFields.length > 0 && (
                        <div className="md:col-span-2">
                          <div className="rounded-xl border border-slate-700 p-4">
                            <h3 className="font-medium mb-3 text-gray-200">
                              {CASE_TYPES[caseType]?.label} — Özel Bilgiler
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              {activeFields.map((f) => (
                                <div key={f.id}>
                                  <label className="block text-sm font-medium mb-1">
                                    {f.label} {f.required ? "*" : ""}
                                  </label>
                                  <FieldInput
                                    field={f}
                                    value={extraValues[f.id] || ""}
                                    onChange={handleExtraChange}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Eldeki Deliller */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                          Eldeki Deliller (isteğe bağlı) — her satır bir delil
                        </label>
                        <textarea
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder={`Tanık Beyanları\nNüfus Kayıtları\nFaturalar`}
                          value={delillerInput}
                          onChange={(e) => setDelillerInput(e.target.value)}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-xl border border-red-400/60 bg-red-500/10 p-3 text-sm text-red-300">
                        {error}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-blue-600 text-white px-5 py-2 hover:bg-blue-500 disabled:opacity-60 transition"
                      >
                        {loading ? "Gönderiliyor..." : "Dilekçe Oluştur"}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-xl border border-slate-600 px-5 py-2 hover:bg-slate-800 transition"
                      >
                        Temizle
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {/* Oluşturuluyor (Skeleton) */}
              {step === 2 && (
                <section className="p-6 md:p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="text-slate-300">İşlemler sürüyor…</div>

                    <div className="space-y-2">
                      {LOADING_MESSAGES.map((msg, i) => {
                        const done = i < loadStepIdx;
                        const active = i === loadStepIdx;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            {done ? (
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-400/50 text-emerald-300 text-xs">✓</span>
                            ) : active ? (
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full">
                                <span className="h-4 w-4 rounded-full border-2 border-sky-400/30 border-t-sky-400 animate-spin" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-slate-800 border border-slate-700 text-slate-500 text-xs">•</span>
                            )}
                            <span className={active ? "text-sky-300" : done ? "text-slate-300" : "text-slate-500"}>
                              {msg}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="h-1.5 bg-slate-800 rounded overflow-hidden">
                      <div
                        className="h-full bg-sky-500 transition-all duration-500"
                        style={{ width: `${Math.round(((loadStepIdx + 1) / LOADING_MESSAGES.length) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <LoaderCard />
                  <LoaderCard />
                </section>
              )}

              {/* Sonuç */}
              {step === 3 && (
                <section className="p-6 md:p-8 space-y-8">
                  {/* Başlık ve aksiyonlar */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                        ✓ Hazır
                      </span>
                      <h2 className="text-xl font-semibold text-gray-200">Taslak Dilekçe</h2>
                      {saving && <span className="text-xs text-slate-400 ml-2">kaydediliyor…</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          if (!dilekceMd) {
                            setError("Kopyalanacak içerik bulunamadı.");
                            return;
                          }
                          handleCopy();
                        }}
                        className="rounded-xl border border-slate-600 px-4 py-2 hover:bg-slate-800 transition text-sm"
                        title="Markdown'ı panoya kopyala"
                      >
                        {copied ? "Kopyalandı ✓" : "Kopyala"}
                      </button>
                      <button
                        onClick={() =>
                          downloadAsDocxFromPreviewNode(dilekcePreviewRef.current, "dilekce_taslak", setError)
                        }
                        className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-500 transition text-sm"
                        title="Word (.docx) olarak indir"
                      >
                        Word (.docx)
                      </button>
                      <button
                        onClick={() =>
                          downloadAsPdfFromPreviewNode(dilekcePreviewRef.current, "dilekce_taslak", setError)
                        }
                        className="rounded-xl bg-rose-600 text-white px-4 py-2 hover:bg-rose-500 transition text-sm"
                        title="PDF olarak indir"
                      >
                        PDF
                      </button>
                    </div>
                  </div>
                  {/* Dikkat Paneli — sadece veri varsa göster */}
                  {(() => {
                    const d = result?.dilekce?.davada_dikkat;
                    const hasData =
                      d &&
                      (
                        (Array.isArray(d?.riskler) && d.riskler.length > 0) ||
                        (Array.isArray(d?.karsi_iddialar) && d.karsi_iddialar.length > 0) ||
                        (Array.isArray(d?.kritik_deliller) && d.kritik_deliller.length > 0)
                      );
                    return hasData ? (
                      <DikkatPanel data={d} />
                    ) : null;
                  })()}
                  {error && (
                    <div className="w-full mt-2 rounded-xl border border-red-400/60 bg-red-500/10 p-2 text-xs text-red-300">
                      {error}
                    </div>
                  )}

                  {/* Tablar */}
                  <div className="flex items-center gap-2 border-b border-slate-700/60">
                    {[
                      { key: "dilekce", label: "Dilekçe Metni" },
                      { key: "kaynaklar", label: "Yararlanılan Kaynaklar" },
                      { key: "girdi", label: "Girdi Özeti" },
                      { key: "dikkat", label: "Davada Dikkat" },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={[
                          "px-4 py-2 text-sm",
                          activeTab === t.key
                            ? "border-b-2 border-blue-500 text-blue-300"
                            : "text-slate-400 hover:text-slate-200",
                        ].join(" ")}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Davada Dikkat Paneli */}
                  {activeTab === "dikkat" && (
                    <div className="mt-4 space-y-4">
                      {(() => {
                        const card = (result?.dilekce?.davada_dikkat) || {};
                        const riskler = Array.isArray(card.riskler) ? card.riskler : [];
                        const karsi = Array.isArray(card.karsi_iddialar) ? card.karsi_iddialar : [];
                        const deliller = Array.isArray(card.kritik_deliller) ? card.kritik_deliller : [];

                        const isEmpty = (!riskler.length && !karsi.length && !deliller.length);

                        return (
                          <>
                            {isEmpty ? (
                              <div className="rounded-xl border border-slate-700/60 p-4 text-slate-400 text-sm">
                                Bu bölüm için özetlenmiş bir içerik oluşturulamadı. Lütfen yeniden deneyin veya verilerinizi zenginleştirin.
                              </div>
                            ) : (
                              <div className="grid md:grid-cols-3 gap-4">
                                {/* Riskler */}
                                <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-amber-300">Olası Riskler</h3>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300">
                                      {riskler.length}
                                    </span>
                                  </div>
                                  {riskler.length ? (
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                      {riskler.map((it, idx) => (
                                        <li key={idx} className="text-amber-100/90">{it}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-slate-400 text-sm">Herhangi bir risk öne çıkmadı.</p>
                                  )}
                                </div>

                                {/* Karşı Taraf İddiaları */}
                                <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-sky-300">Muhtemel Karşı İddialar</h3>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/40 text-sky-300">
                                      {karsi.length}
                                    </span>
                                  </div>
                                  {karsi.length ? (
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                      {karsi.map((it, idx) => (
                                        <li key={idx} className="text-sky-100/90">{it}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-slate-400 text-sm">Öne çıkan bir karşı iddia listelenmedi.</p>
                                  )}
                                </div>

                                {/* Kritik Deliller */}
                                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-emerald-300">Mutlaka Sunulması Gereken Deliller</h3>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-300">
                                      {deliller.length}
                                    </span>
                                  </div>
                                  {deliller.length ? (
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                      {deliller.map((it, idx) => (
                                        <li key={idx} className="text-emerald-100/90">{it}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-slate-400 text-sm">Bu dava için kritik delil önerisi bulunamadı.</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Tab içerikleri */}
                  {activeTab === "dilekce" && (
                    <div
                      ref={dilekcePreviewRef}
                      className="rounded-xl border border-slate-700/60 p-4 prose prose-invert max-w-none"
                    >
                      <ReactMarkdown components={{ p: ParagraphRenderer }}>
                        {dilekceMd || "_Dilekçe metni yok._"}
                      </ReactMarkdown>
                    </div>
                  )}

                  {activeTab === "kaynaklar" && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-slate-700 p-4">
                        <h3 className="font-medium mb-2 text-gray-200">Dayanaklar (Kanun Maddeleri)</h3>

  {parsedDayanaklar && parsedDayanaklar.length ? (
    <div className="flex flex-col gap-2">
      {parsedDayanaklar.map((d, i) => {
        const hasStruct = d.kanun && d.madde;
        if (!hasStruct) {
          // parse edemediysek metni olduğu gibi göster
          return <div key={i} className="text-sm text-slate-300">• {d.display}</div>;
        }

        const slug = slugifyMevzuatAdi(d.kanun);
        const href = slug ? `/mevzuat/${encodeURIComponent(slug)}${maddeAnchor(d.madde)}` : "";
        const popKey = `${slug || "mevzuat"}::${d.madde}`;
        const preview = getMevzuatPreview({ mevzuat_adi: d.kanun, madde: d.madde }, maddeCache);
        const titleText = d.kanun;
        const maddeNo = d.madde;

        return (
          <div key={i} className="w-full space-y-1" data-mevzuat-popover="1">
            <div className="flex items-stretch gap-2">
              {/* m. badge (popover trigger) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const el = e.currentTarget;
                  const pos = calcMevzuatPopover(el);
                  setOpenMevzuat(prev => (prev?.key === popKey ? null : { key: popKey, el, ...pos }));
                }}
                aria-expanded={openMevzuat?.key === popKey}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-semibold rounded-lg bg-cyan-600/40 text-white whitespace-nowrap leading-none hover:bg-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/30 transition-colors"
              >
                <span>m.</span>
                <span className="tabular-nums">{maddeNo}</span>
              </button>

              {/* Kanun adı (link) */}
              <div className="relative flex-1">
                {href ? (
                  <a
                    className="flex-1 inline-flex items-center px-3 py-2 rounded-lg bg-slate-700/60 text-[11px] text-slate-300 font-medium leading-tight min-h-[32px] hover:text-cyan-300 hover:bg-slate-600/60 transition-colors"
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e)=>e.stopPropagation()}
                    title="Tam mevzuat sayfasına git"
                  >
                    {titleText}
                  </a>
                ) : (
                  <span className="flex-1 inline-flex items-center px-3 py-2 rounded-lg bg-slate-700/60 text-[11px] text-slate-300 font-medium leading-tight min-h-[32px]">
                    {titleText}
                  </span>
                )}

                {/* Popover */}
                {openMevzuat?.key === popKey && (
                  <div
                    data-mevzuat-popover="1"
                    role="dialog"
                    aria-modal="true"
                    onClick={(e)=>e.stopPropagation()}
                    className={
                      "fixed z-[999] w-[42rem] max-w-[92vw] max-h-[70vh] overflow-auto rounded-xl " +
                      "border border-white/10 bg-slate-900/95 backdrop-blur-md " +
                      "shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_24px_rgba(34,211,238,0.2)] ring-1 ring-cyan-400/35 p-4 " +
                      "text-[12px] text-slate-100 transition-transform duration-150 ease-out will-change-transform " +
                      (openMevzuat?.placement === 'left'
                        ? "-translate-x-full -translate-y-1/2"
                        : openMevzuat?.placement === 'right'
                          ? "-translate-y-1/2"
                          : openMevzuat?.placement === 'bottom'
                            ? "-translate-x-1/2"
                            : "-translate-x-1/2 -translate-y-full")
                    }
                    style={{ top: openMevzuat.top, left: openMevzuat.left }}
                  >
                    {/* yön oku */}
                    {openMevzuat?.placement === 'left' && (
                      <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -right-2 w-3.5 h-3.5 rotate-45 bg-slate-900/95 border-t border-r border-white/10 shadow-[0_0_10px_rgba(34,211,238,0.18)]"></div>
                    )}
                    {openMevzuat?.placement === 'right' && (
                      <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -left-2 w-3.5 h-3.5 rotate-45 bg-slate-900/95 border-b border-l border-white/10 shadow-[0_0_10px_rgba(34,211,238,0.18)]"></div>
                    )}
                    {openMevzuat?.placement === 'top' && (
                      <div className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 bg-slate-900/95 border-l border-b border-white/10 shadow-[0_0_10px_rgba(34,211,238,0.18)]"></div>
                    )}
                    {openMevzuat?.placement === 'bottom' && (
                      <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 bg-slate-900/95 border-t border-r border-white/10 shadow-[0_0_10px_rgba(34,211,238,0.18)]"></div>
                    )}

                    <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-slate-100">
                        <div className="font-semibold">{titleText}</div>
                        <div className="text-xs text-slate-300 mt-0.5">m. {maddeNo}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenMevzuat(null)}
                        className="shrink-0 w-8 h-8 grid place-items-center rounded-md bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                        aria-label="Kapat"
                        title="Kapat"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>

                    <div className="leading-snug whitespace-pre-wrap break-words font-medium">
                      {preview || "Madde metni getirilemedi."}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <ul className="list-disc pl-5 space-y-1 text-slate-300 text-sm">
      <li className="text-slate-400">Belirtilmedi</li>
    </ul>
  )}
</div>

                      <div className="rounded-xl border border-slate-700 p-4">
                        <h3 className="font-medium mb-2 text-gray-200">Yargıtay Kararları</h3>
                        <ul className="list-disc pl-5 space-y-1 text-slate-300 text-sm">
    {(() => {
      const all = result?.kaynaklar?.yargitay_kararlari || [];
      const dict = new Map();

      for (const k of all) {
        const p = k?.properties || {};
        const typeRaw = String(p.kaynak_turu || p.tur || "").toLowerCase();
        const isSummaryName = /(?:\bözet\b|\bozet\b|gemini)/i.test(String(p.dosya_adi || ""));
        const isSummary = typeRaw === "ai_ozet" || isSummaryName;

        const slug = bestSlugFromProps(p, all);
        const key = slug || (String(p.orijinal_karar_id || p.karar_id || p.dosya_adi || "").replace(/\.txt$/i, ""));
        if (!key) continue;

        const code = deduceEsasKararFromProps(p);
        const court = deduceCourtLabelFromProps(p);

        const rec = dict.get(key) || { slug, code: "", court: "", hasOriginal: false };
        if (!rec.slug && slug) rec.slug = slug; // link için orijinal slug'ı tercih et
        if (code && !rec.code) rec.code = code;
        if (court && !rec.court) rec.court = court;
        if (!isSummary) rec.hasOriginal = true;
        dict.set(key, rec);
      }

      const list = Array.from(dict.values())
        .filter((r) => r.code || r.court || r.slug)
        .sort((a, b) => (a.court || "").localeCompare(b.court || "") || (a.code || "").localeCompare(b.code || ""));

      if (!list.length) {
        return <li className="text-slate-400">Belirtilmedi</li>;
      }

      return list.map((r, i) => {
        const hasSlug = r.slug && looksLikeSlug(r.slug);

        const content = (
          <>
            {r.court ? <span>{r.court}</span> : null}
            {r.court && (r.code || r.slug) ? <span className="mx-1 text-slate-400">·</span> : null}
            {r.code ? <span className="tabular-nums">{r.code}</span> : (r.slug || "")}
          </>
        );

        if (hasSlug) {
          return (
            <li key={i}>
              <Link
                href={`/kararlar/${encodeURIComponent(r.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline"
              >
                {content}
              </Link>
            </li>
          );
        }
        return <li key={i}>{content}</li>;
      });
    })()}
  </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === "girdi" && (
                    <div className="rounded-xl border border-slate-700/60 p-4 text-sm text-slate-300 space-y-2">
                      <div>
                        <span className="text-slate-400">Dava Türü:</span>{" "}
                        <span className="text-slate-200">{CASE_TYPES[caseType]?.label || "(belirtilmedi)"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Olay Özeti:</span>{" "}
                        <span className="text-slate-200">{result?.girdi_ozeti?.olay_ozet || olayOzet}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Talep:</span>{" "}
                        <span className="text-slate-200">{result?.girdi_ozeti?.talep || talep}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Davacı:</span>{" "}
                        <span className="text-slate-200">
                          {result?.girdi_ozeti?.davaci?.ad_soyad || davaciAdSoyad || "(belirtilmedi)"}
                        </span>
                      </div>
                      {activeFields.length > 0 && (
                        <div>
                          <span className="text-slate-400">Özel Bilgiler:</span>{" "}
                          <span className="text-slate-200">
                            {Object.keys(extraValues).length
                              ? activeFields
                                  .map((f) => `${f.label}: ${extraValues[f.id] || "-"}`)
                                  .join(" • ")
                              : "(belirtilmedi)"}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Deliller:</span>{" "}
                        <span className="text-slate-200">
                          {Array.isArray(result?.girdi_ozeti?.eldeki_deliller) &&
                          result.girdi_ozeti.eldeki_deliller.length
                            ? result.girdi_ozeti.eldeki_deliller.join(", ")
                            : deliller.length
                            ? deliller.join(", ")
                            : "(belirtilmedi)"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-slate-600 px-5 py-2 hover:bg-slate-800 transition"
                    >
                      Yeni Dilekçe
                    </button>
                  </div>
                </section>

              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ana başlığı ortalama - sadece bu sayfa için */}
      <style jsx global>{`
        .prose h1:first-child,
        .prose h2:first-child {
          text-align: center;
        }

        /* “... MAHKEMESİNE” satırı: ortalı, kalın ve üstte iki satır boşluk etkisi */
        .prose .mahkemesine {
          text-align: center;
          font-weight: 700;
          margin-top: 2.2em; /* ~2 satır boşluk */
        }

        /* "BAŞLIK: Değer" satırlarında ":" hizalansın ve başlıklar kalın olsun */
        .prose .kv {
          display: grid;
          grid-template-columns: max-content 1fr;
          align-items: baseline;
          gap: 0.75rem;
          margin: 0.15rem 0;
        }
        .prose .kv .kv-key {
          font-weight: 700;
          white-space: nowrap;
        }

        /* Rakamlar düzgün dursun */
        .prose .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
        .prose .section-head { margin-top: 1rem; }
        
      `}</style>
      {showDrafts && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowDrafts(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-slate-900 border-l border-slate-700 shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200">Son Dilekçeleriniz</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchRecentDrafts()}
                  className="text-xs px-3 py-1 rounded border border-slate-600 hover:bg-slate-800"
                >
                  Yenile
                </button>
                <button
                  onClick={() => setShowDrafts(false)}
                  className="text-xs px-3 py-1 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700"
                >
                  Kapat
                </button>
              </div>
            </div>

            {Array.isArray(recentDrafts) && recentDrafts.length ? (
              <ul className="divide-y divide-slate-700/60">
                {recentDrafts.map((d) => {
                  const created = d.createdAt || d.created_at;
                  const when = created ? new Date(created).toLocaleString("tr-TR") : "";
                  return (
                    <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-slate-200 truncate">
                          {d.dava_turu ? (CASE_TYPES[d.dava_turu]?.label || d.dava_turu) : "Taslak"}
                        </div>
                        {when && <div className="text-xs text-slate-400 truncate">{when}</div>}
                        {d.olay_ozet && (
                          <div className="text-xs text-slate-400 line-clamp-1">{d.olay_ozet}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {d?.dilekce_md ? (
                          <button
                            onClick={() => { loadDraft(d); setShowDrafts(false); }}
                            className="text-xs px-3 py-1 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700"
                          >
                            Yükle
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-sm text-slate-400">Kayıt bulunamadı.</div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}