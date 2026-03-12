"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import TokenBalance from "@/components/TokenBalance";
// SADECE BU SATIRI EKLEDİM: Veriyi dışarıdan çekiyoruz.
import { CASE_TYPES } from "./caseData";
// Markdown render (SSR kapalı, projeye uygun)

// --- Dilekçe Satır Satır Renderer ---
const renderDilekce = (text) => {
  const lines = (text || "").split("\n");
  let konuYakalandi = false;

  // Markdown temizleme: **bold**, _italic_ vb. işaretleri kaldır
  const stripMd = (s = "") => String(s)
    .replace(/[\*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return lines.map((line, i) => {
    const trimmed = line.trim();
    const plain = stripMd(trimmed);

    // === BÖLÜM BAŞLIKLARI (HUKUKİ NEDENLER / DELİLLER / SONUÇ VE İSTEM) ===
    const normalized = plain
      .replace(/\s*:\s*$/, "") // sondaki ":" ve boşlukları temizle
      .toUpperCase();

    if (
      normalized === "HUKUKİ NEDENLER" ||
      normalized === "HUKUKİ DELİLLER" ||
      normalized === "SONUÇ VE İSTEM"
    ) {
      return (
        <div
          key={i}
          className="grid grid-cols-[180px_1fr] gap-2 mt-4 mb-1"
        >
          <div className="font-extrabold uppercase">
            {normalized}:
          </div>
          <div></div>
        </div>
      );
    }

    // MAHKEME BAŞLIĞI
    if (/MAHKEMES[İI]NE$/i.test(plain)) {
      return (
        <p key={i} className="text-center font-bold mb-4">
          {plain}
        </p>
      );
    }

    // === TAMAMI BÜYÜK HARFLE YAZILMIŞ SATIRLAR → KALIN ===
    const upperOnly = plain === plain.toUpperCase();

    // NUMARALI + TAMAMI BÜYÜK HARF BAŞLIKLAR (örn: "6. 01.04.1974 TARİHLİ ...")
    if (
      upperOnly &&
      /^[0-9IVX]+\./.test(plain) &&
      plain.length > 8
    ) {
      return (
        <p key={i} className="font-bold mb-2">
          {plain}
        </p>
      );
    }

    // ETİKETLİ SATIRLAR
    const labelMatch = plain.match(
      /^(DAVACI|VEK[İI]L[İI]|DAVALI|ADRES|DAVA DEĞER[İI]|KONU|AÇIKLAMALAR)\s*:?\s*(.*)$/i
    );

    if (labelMatch) {
      const label = labelMatch[1].toUpperCase();

      if (label === "KONU") {
        if (konuYakalandi) {
          return (
            <p key={i} className="mb-2">
              {plain}
            </p>
          );
        }
        konuYakalandi = true;
      }

      return (
        <div key={i} className="grid grid-cols-[180px_1fr] gap-2 mb-1">
          <div className="font-bold">
            {label}:
          </div>
          <div>{labelMatch[2]}</div>
        </div>
      );
    }

    // NORMAL SATIR
    const isSignatureBlock =
      plain === "Davacı Vekili" ||
      /^Av\.\s*\[.*\]/i.test(plain);

    return (
      <p
        key={i}
        className={`mb-2 ${isSignatureBlock ? "text-right font-medium" : ""}`}
      >
        {plain || line}
      </p>
    );
  });
};

// Opsiyonel: Canvas arka plan (varsa kullan)
let CanvasBackground = null;
try {
  CanvasBackground = require("@/components/CanvasBackground").default;
} catch (err) {}

// -----------------------------
// Yardımcı Fonksiyonlar (Scriptler, İndirme vb.) - SENİN KODUNLA AYNI
// -----------------------------

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

async function loadHtmlDocxUMD() {
  try {
    const mod = await ensureScriptLoaded("https://cdn.jsdelivr.net/npm/html-docx-js@0.4.2/dist/html-docx.js", "htmlDocx");
    if (mod && typeof mod.asBlob === "function") return mod;
  } catch (_) {}
  try {
    const mod = await ensureScriptLoaded("https://cdnjs.cloudflare.com/ajax/libs/html-docx-js/0.4.2/html-docx.js", "htmlDocx");
    if (mod && typeof mod.asBlob === "function") return mod;
  } catch (_) {}
  try {
    const mod = await ensureScriptLoaded("https://unpkg.com/html-docx-js@0.4.2/dist/html-docx.js", "htmlDocx");
    if (mod && typeof mod.asBlob === "function") return mod;
  } catch (_) {}
  return null;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Kopyalama hatası:", err);
    return false;
  }
}

// .docx indirme
async function downloadAsDocxFromPreviewNode(previewNode, filenameBase, setError) {
  if (!previewNode) {
    setError && setError("Önizleme alanı bulunamadı.");
    return;
  }
  try {
    const inner = serializeWithManualNumbering(previewNode);
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Dilekçe</title>
<style>
  * { color: #000 !important; background: transparent !important; }
  body { background: #fff !important; font-family: "Times New Roman", Times, serif; line-height: 1.3; font-size: 12pt; }
  h1,h2,h3,h4,h5,h6{ margin: 0.8em 0 0.4em; }
  p,li{ margin: 0.3em 0; }
  .mahkemesine { text-align: center; font-weight: 700; margin-top: 1.5em; margin-bottom: 1.5em; text-transform: uppercase; }
  .kv { display: grid; grid-template-columns: 160px 1fr; gap: 10px; margin: 2px 0; }
  .kv .kv-key { font-weight: 700; }
  .section-head { margin-top: 1em; margin-bottom: 0.5em; font-weight: 700; }
</style>
</head>
<body>${inner}</body>
</html>`;

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
      return;
    }
    // Fallback: docx lib
    const docx = await ensureScriptLoaded("https://unpkg.com/docx@9.5.0/dist/index.iife.js", "docx");
    if (!docx || !window.docx || !window.docx.Packer) throw new Error("docx kütüphanesi yüklenemedi");

    const { Document, Paragraph, TextRun, AlignmentType } = window.docx;
    const plain = (previewNode.innerText || "").replace(/\r\n/g, "\n");
    const lines = plain.split("\n");
    // Başlıkları tanıyan regex (AÇIKLAMALAR vb.)
    const sectionRegex = /^(AÇIKLAMALAR|HUKUK[İI]\s*(NEDEN(LER)?|DEL[İI]LLER)|SONUÇ\s*VE\s*İSTEM|EKLER|DAVA DEĞER[İI]|DAVACI|DAVALI|KONU)[:]?\s*$/i;
    // Numaralı başlıkları tanıyan regex (1. Başlık vb.)
    const numberedHeaderRegex = /^(\d+|[IVX]+)\.\s+([A-ZÇĞİÖŞÜ0-9\s\-\(\)\"\']+)$/i;

    const paragraphs = [];
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        paragraphs.push(new Paragraph({ children: [new TextRun("")], spacing: { after: 120 } })); // Boş satır aralığı azaltıldı
        continue;
      }
      // Mahkeme Hitabı
      if (/\bMAHKEMES[İI]NE\b/i.test(line)) {
        paragraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: line, bold: true })], spacing: { before: 240, after: 240 } }));
        continue;
      }
      // Anahtar: Değer (Örn: DAVACI: Ad Soyad)
      const kv = line.match(/^([^:]+?)\s*:\s*(.+)$/);
      if (kv) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: kv[1] + ": ", bold: true }), new TextRun({ text: kv[2] })], spacing: { after: 60 } }));
        continue;
      }
      // Standart Bölüm Başlıkları (AÇIKLAMALAR: vb.)
      if (sectionRegex.test(line)) {
        let headerText = line;
        if (!headerText.endsWith(":")) headerText += ":";
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: headerText, bold: true })], spacing: { before: 180, after: 120 } }));
        continue;
      }
      // Numaralı Başlıklar (1. Başlık vb.)
      if (numberedHeaderRegex.test(line)) {
         paragraphs.push(new Paragraph({ children: [new TextRun({ text: line, bold: true })], spacing: { before: 180, after: 120 } }));
         continue;
      }

      // Normal Paragraf
      paragraphs.push(new Paragraph({ children: [new TextRun(line)], spacing: { after: 120 } }));
    }
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs.length ? paragraphs : [new Paragraph(" ")] }] });
    const blob = await window.docx.Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    setError && setError(`Word (.docx) çıktısı hazırlanırken bir hata oluştu.`);
  }
}

// .pdf indirme
async function downloadAsPdfFromPreviewNode(previewNode, filenameBase, setError) {
  if (!previewNode) {
    setError && setError("Önizleme alanı bulunamadı.");
    return;
  }
  try {
    const inner = serializeWithManualNumbering(previewNode);
    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${filenameBase}</title>
      <style>
        * { color: #000 !important; background: transparent !important; }
        body { background: #fff !important; font-family: "Times New Roman", serif; line-height: 1.3; font-size: 12pt; }
        .mahkemesine { text-align: center; font-weight: 700; margin-top: 1.5em; margin-bottom: 1.5em; text-transform: uppercase; }
        .kv { display: grid; grid-template-columns: 160px 1fr; gap: 10px; margin: 2px 0; }
        .kv .kv-key { font-weight: 700; }
        .section-head { margin-top: 1em; margin-bottom: 0.5em; font-weight: 700; }
        p { margin-bottom: 0.5em; }
      </style>
    </head><body>${inner}</body></html>`;

    const html2pdf = await ensureScriptLoaded("https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js", "html2pdf");
    if (!html2pdf) throw new Error("html2pdf.js yüklenemedi");

    const opt = {
      filename: `${filenameBase}.pdf`,
      margin: 20,
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

// Helperlar (Orijinal Kodundaki gibi)
function slugifyMevzuatAdi(name = "") {
  const trMap = { "ı":"i","İ":"i","ş":"s","Ş":"s","ç":"c","Ç":"c","ö":"o","Ö":"o","ü":"u","Ü":"u","ğ":"g","Ğ":"g" };
  let s = (name || "").toString().trim();
  s = s.replace(/^\s*\d+(?:\s*\/\s*\d+)?\s*(?:say[ıi]l[ıi]|numaral[ıi]|no\.?lu?)\s+/i, "").replace(/^\s*\d{3,5}\s+/, "");
  s = s.replace(/[ıİşŞçÇöÖüÜğĞ]/g, c => trMap[c] || c).toLowerCase();
  return s.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}
function stripHtmlTags(s = "") {
  let t = (s ?? "").toString().replace(/\r\n/g, "\n");
  t = t.replace(/&lt;br\s*\/?&gt;/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p\s*>/gi, "\n").replace(/<[^>]*>/g, " ");
  return t.trim();
}
function sanitizeMaddeTextFull(s = "") {
  let out = stripHtmlTags(s || "");
  const lines = out.split(/\r?\n/);
  // Basit temizleme
  return lines.join("\n").trim();
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
async function ensureMaddeInCache(kanun = "", madde = "", setMaddeCache, pendingMadde) {
  if (!kanun || !madde) return;
  const key = mevzuatCacheKey(kanun, madde);
  if (pendingMadde.current.has(key)) return;
  if (typeof window !== "undefined" && window.__MADDE_CACHE__?.[key]) return;
  pendingMadde.current.add(key);
  try {
    const res = await fetch(`/api/mevzuat/madde?kanun=${encodeURIComponent(kanun)}&madde=${encodeURIComponent(madde)}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const metin = sanitizeMaddeTextFull(data?.maddeMetin || "");
    setMaddeCache(prev => ({ ...prev, [key]: metin }));
    if (typeof window !== "undefined") { window.__MADDE_CACHE__ = window.__MADDE_CACHE__ || {}; window.__MADDE_CACHE__[key] = metin; }
  } catch (e) { setMaddeCache(prev => ({ ...prev, [key]: "" })); } finally { pendingMadde.current.delete(key); }
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
function calcMevzuatPopover(el) {
  if (!el || !el.getBoundingClientRect) return { top: 0, left: 0, placement: 'bottom' };
  const GAP = 10, POP_W = Math.min(672, Math.floor(window.innerWidth * 0.92)), POP_H = 320;
  const rect = el.getBoundingClientRect();
  const spaceLeft = rect.left, spaceRight = window.innerWidth - rect.right, spaceTop = rect.top;
  let placement, top, left;
  if (spaceLeft >= POP_W + GAP) { placement = 'left'; top = Math.round(rect.top + rect.height / 2); left = Math.round(rect.left - GAP); }
  else if (spaceRight >= POP_W + GAP) { placement = 'right'; top = Math.round(rect.top + rect.height / 2); left = Math.round(rect.right + GAP); }
  else if (spaceTop >= POP_H + GAP) { placement = 'top'; top = Math.round(rect.top - GAP); left = Math.round(rect.left + rect.width / 2); }
  else { placement = 'bottom'; top = Math.round(rect.bottom + GAP); left = Math.round(rect.left + rect.width / 2); }
  return { top, left, placement };
}
function parseDayanakString(s = "") {
  const raw = String(s || "").replace(/\s+/g, " ").trim();
  if (!raw) return null;
  let m = raw.match(/^(.*?)(?:\bmadde\b|m\.)\s*(geçici\s*)?([0-9]+(?:[\/.-][0-9A-Za-z()]+)*)/i);
  if (m) return { kanun: (m[1]||"").trim() || raw, madde: (m[2] ? `Geçici ${m[3]}` : m[3]).trim(), display: raw };
  m = raw.match(/^([A-ZÇĞİÖŞÜ]{2,6})\s+([0-9]+(?:[\/.-][0-9A-Za-z()]+)*)$/);
  if (m) return { kanun: m[1], madde: m[2], display: raw };
  m = raw.match(/^(geçici)\s+([0-9]+)/i);
  if (m) return { kanun: raw, madde: `Geçici ${m[2]}`, display: raw };
  m = raw.match(/^(.+?\bsay[ıi]l[ıi]\b.*?)([0-9]+(?:[\/.-][0-9A-Za-z()]+)*)$/i);
  if (m) return { kanun: m[1].trim(), madde: m[2].trim(), display: raw };
  return { kanun: "", madde: "", display: raw };
}
function normalizeDayanaklar(arr){ const set = new Set(); for (const x of (Array.isArray(arr) ? arr : [])) { const s = String(x || "").trim(); if (s) set.add(s); } return Array.from(set); }
function normalizeDavadaDikkat(v){ const safeList = (x) => Array.isArray(x) ? x.map(s => String(s||"").trim()).filter(Boolean) : []; const obj = (v && typeof v === 'object') ? v : {}; return { riskler: safeList(obj.riskler), karsi_iddialar: safeList(obj.karsi_iddialar), kritik_deliller: safeList(obj.kritik_deliller), }; }
function deduceEsasKararFromProps(p = {}) {
  const clean = (s) => (s || "").toString().trim();
  const bad = (s) => !s || /^belirtilmemi[şs]/i.test(s) || /^n\/?a$/i.test(s);
  const codeField = clean(p.code); if (!bad(codeField)) return codeField;
  const esas = clean(p.esas_no), karar = clean(p.karar_no); if (!bad(esas) && !bad(karar)) return `${esas} E. ${karar} K.`;
  const fnameRaw = clean(p.orijinal_karar_id || p.dosya_adi || p.dosya || p.slug);
  if (fnameRaw) {
    const base = fnameRaw.replace(/\.txt$/i, "");
    let m = base.match(/^(\d+)_Hukuk_Dairesi_(\d{4}-[0-9A-Za-z()\-\/]+)E_(\d{4}-[0-9A-Za-z()\-\/]+)K$/i);
    if (m) return `${m[2].replace(/-/g,"/")} E. ${m[3].replace(/-/g,"/")} K.`;
    m = base.match(/^(Hukuk|Ceza)_Genel_Kurulu_(\d{4}-[0-9A-Za-z()\-\/]+)E_(\d{4}-[0-9A-Za-z()\-\/]+)K$/i);
    if (m) return `${m[2].replace(/-/g,"/")} E. ${m[3].replace(/-/g,"/")} K.`;
  }
  return "";
}
function deduceCourtLabelFromProps(p = {}) {
  const clean = (s) => (s || "").toString().trim();
  const bad = (s) => !s || /^belirtilmemi[şs]/i.test(s) || /^n\/?a$/i.test(s);
  const mahkeme = clean(p.mahkeme || p.type || ""); if (!bad(mahkeme)) return mahkeme;
  const fnameRaw = clean(p.orijinal_karar_id || p.dosya_adi || p.dosya || p.slug);
  if (!fnameRaw) return "";
  const base = fnameRaw.replace(/\.txt$/i, "");
  let m = base.match(/^(\d+)_Hukuk_Dairesi_/i); if (m) return `${m[1]}. Hukuk Dairesi`;
  m = base.match(/^(\d+)_Ceza_Dairesi_/i); if (m) return `${m[1]}. Ceza Dairesi`;
  m = base.match(/^(Hukuk|Ceza)_Genel_Kurulu_/i); if (m) return `${m[1]} Genel Kurulu`;
  return "";
}
function looksLikeSlug(s = "") {
  const base = String(s).replace(/\.txt$/i, "");
  if (!base || !/(Hukuk|Ceza)_(Dairesi|Genel_Kurulu)/i.test(base)) return false;
  return /E_/i.test(base) && /K\b/i.test(base);
}
function bestSlugFromProps(p = {}, allArr = []) {
  const primary = (p.orijinal_karar_id || p.dosya_adi || p.karar_id || p.slug || "").toString().replace(/\.txt$/i, "");
  if (looksLikeSlug(primary)) return primary;
  const rid = (p.orijinal_karar_id || p.karar_id || "").toString().replace(/\.txt$/i, "");
  if (rid) {
    for (const k of allArr) {
      const q = k?.properties || {};
      const typeRaw = String(q.kaynak_turu || q.tur || "").toLowerCase();
      const isSummary = typeRaw === "ai_ozet" || /(?:\bözet\b|\bozet\b|gemini)/i.test(String(q.dosya_adi || ""));
      const candidate = (q.dosya_adi || q.orijinal_karar_id || "").toString().replace(/\.txt$/i, "");
      if (looksLikeSlug(candidate) && !isSummary && (String(q.orijinal_karar_id || "").replace(/\.txt$/i, "") === rid)) return candidate;
    }
  }
  const fallback = (p.dosya_adi || "").toString().replace(/\.txt$/i, "");
  return looksLikeSlug(fallback) ? fallback : "";
}

// React Helper
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
function serializeWithManualNumbering(containerNode) {
  const clone = containerNode.cloneNode(true);
  clone.querySelectorAll('ol').forEach((ol) => {
    const start = parseInt(ol.getAttribute('start') || '1', 10) || 1;
    let i = 0;
    Array.from(ol.children).forEach((li) => {
      if (!li || (li.tagName || '').toLowerCase() !== 'li') return;
      if (li.querySelector(':scope > .manual-li-index')) return;
      const span = document.createElement('span'); span.className = 'manual-li-index'; span.textContent = (start + i) + '. ';
      const firstEl = li.firstElementChild;
      if (firstEl && firstEl.tagName && firstEl.tagName.toLowerCase() === 'p') firstEl.insertBefore(span, firstEl.firstChild);
      else if (li.firstChild) li.insertBefore(span, li.firstChild);
      else li.appendChild(span);
      i += 1;
    });
  });
  return clone.innerHTML;
}

// --- GÜNCELLENMİŞ RENDERER ---
function ParagraphRenderer(props) {
  const { children } = props;
  const rawText = _textFromChildren(children);
  // Satır sonlarını boşlukla birleştir (Kopmaları önler)
  const cleanRaw = rawText.replace(/[\r\n]+/g, " ").trim();

  if (!cleanRaw) return null;

  const upper = cleanRaw.replace(/[*_]/g, "").toUpperCase();

  // 1. KURAL: Numaralı Başlıklar (1. GİRİŞ vb.) - KALIN OLACAK
  const numberedHeaderRegex = /^(\d+|[IVX]+)\.\s+([A-ZÇĞİÖŞÜ0-9\s\-\(\)\"\']+)$/i;
  if (numberedHeaderRegex.test(cleanRaw.replace(/[*_]/g, ""))) {
    return (
      <p className="section-head">
        {cleanRaw.replace(/[*_]/g, "")}
      </p>
    );
  }

  // 2. KURAL: Standart Bölüm Başlıkları (AÇIKLAMALAR, KONU vb.) - SONUNA : EKLENECEK
  const sectionRegex = /^(AÇIKLAMALAR|HUKUK[İI]\s*(NEDEN(LER)?|DEL[İI]LLER)|SONUÇ\s*VE\s*İSTEM|EKLER|DAVA DEĞER[İI]|DAVACI|DAVALI|KONU)[:]?\s*$/;
  if (sectionRegex.test(upper)) {
    let headerText = cleanRaw.replace(/[*_:]/g, "").trim();
    if (!headerText.endsWith(":")) headerText += ":";
    return (
      <p className="section-head">
        {headerText}
      </p>
    );
  }

  // 3. KURAL: Mahkeme Hitabı
  if (/\bMAHKEMES[İI]NE\b/.test(upper)) {
    return (
      <p className="mahkemesine">
        {cleanRaw.replace(/[*_]/g, "").trim()}
      </p>
    );
  }

  // 4. KURAL: Davacı ve Vekili Ayrımı (YENİ)
  // "DAVACI: ... VEKİLİ: ..." formatını yakalar
  const davaciVekiliMatch = cleanRaw.match(/^DAVACI\s*:\s*(.+?)\s+VEKİLİ\s*:\s*(.+)$/i);
  if (davaciVekiliMatch) {
    const davaciVal = davaciVekiliMatch[1].trim();
    const vekilVal = davaciVekiliMatch[2].trim();
    return (
      <>
        <div className="kv">
          <span className="kv-key">DAVACI:</span>
          <span className="kv-value">{davaciVal}</span>
        </div>
        <div className="kv">
          <span className="kv-key">DAVACI VEKİLİ:</span>
          <span className="kv-value">{vekilVal}</span>
        </div>
      </>
    );
  }

  // 5. KURAL: Diğer Anahtar: Değer Çiftleri
  const kvMatch = cleanRaw.match(/^([^:\n]+?)\s*:\s*(.+)$/);
  if (kvMatch && kvMatch[1].length < 50) { // Anahtar uzunluk kontrolü
    const keyClean = kvMatch[1].replace(/[*_]/g, "").trim();
    const valClean = kvMatch[2].trim();
    return (
      <div className="kv">
        <span className="kv-key">{keyClean}:</span>
        <span className="kv-value">{valClean}</span>
      </div>
    );
  }

  // Standart Paragraf
  return <p>{children}</p>;
}

const LOADING_MESSAGES = [
  "Uyuşmazlık ile ilgili analiz yapılıyor…", "Mevzuat taraması yapılıyor…", "Emsal Yargıtay kararları inceleniyor…", "Son rütuşlar yapılıyor…"
];

function FieldInput({ field, value, onChange }) {
  const common = "w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500";
  if (field.type === "textarea") {
    return <textarea className={common} rows={field.rows || 3} placeholder={field.placeholder || ""} value={value || ""} onChange={(e) => onChange(field.id, e.target.value)} required={!!field.required} />;
  }
  if (field.type === "select") {
    return (
      <select className={common} value={value || ""} onChange={(e) => onChange(field.id, e.target.value)} required={!!field.required}>
        <option value="">Seçiniz</option>
        {(field.options || []).map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
      </select>
    );
  }
  if (field.type === "number") {
    const formatThousandsTr = (raw) => {
      const str = String(raw || "");
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
    return <input className={common} type="text" inputMode="numeric" placeholder={field.placeholder || ""} value={value || ""} onChange={handleNumberChange} required={!!field.required} />;
  }
  return <input className={common} type={field.type || "text"} step={field.step || undefined} placeholder={field.placeholder || ""} value={value || ""} onChange={(e) => onChange(field.id, e.target.value)} required={!!field.required} />;
}

// -----------------------------
// ANA BİLEŞEN
// -----------------------------
export default function DilekcePage() {
  // STATE TANIMLARI EN ÜSTE ALINDI
  const [olayOzet, setOlayOzet] = useState("");
  const [talep, setTalep] = useState("");
  const [davaciAdSoyad, setDavaciAdSoyad] = useState("");
  const [davaliAdSoyad, setDavaliAdSoyad] = useState("");
  const [delillerInput, setDelillerInput] = useState("");
  const [caseType, setCaseType] = useState("");
  const [extraValues, setExtraValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("dilekce");
  const [openMevzuat, setOpenMevzuat] = useState(null);
  const [maddeCache, setMaddeCache] = useState({});
  const pendingMadde = useRef(new Set());
  const [loadStepIdx, setLoadStepIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [dilekceMd, setDilekceMd] = useState("");
  const [saving, setSaving] = useState(false);
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const dilekcePreviewRef = useRef(null);
  const pollTimerRef = useRef(null);

  const processedMd = useMemo(() => {
    if (!dilekceMd) return "";
    // Numaralı başlıkları Markdown'da bold yap (örn: "1. Başlık" -> "**1. Başlık**")
    // Bu sayede ReactMarkdown bunları otomatik olarak strong etiketi içine alır.
    return dilekceMd.replace(/^(\d+|[IVX]+)\.\s+([A-ZÇĞİÖŞÜ0-9\s\-\(\)\"\']+)$/gm, "**$1. $2**");
  }, [dilekceMd]);

  const deliller = useMemo(() => delillerInput.split("\n").map((s) => s.trim()).filter(Boolean), [delillerInput]);
  const olayCharCount = olayOzet.trim().length;
  const activeCaseConfig = CASE_TYPES[caseType] || CASE_TYPES[""];
  const activeFields = activeCaseConfig.fields || [];

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

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

  const isCevapMode = ((result?.girdi_ozeti?.dilekce_tipi || (caseType === "cevap" ? "cevap" : "dava")) === "cevap");

  function handleCaseTypeChange(val) {
    setCaseType(val);
    setExtraValues({});
  }

  function handleExtraChange(fieldId, fieldValue) {
    setExtraValues((prev) => ({ ...prev, [fieldId]: fieldValue }));
  }

  function validateForm() {
    if (caseType === "cevap") {
      const pasted = (extraValues["gelen_dava_dilekcesi"] || "").trim();
      if (pasted.length < 20) {
        setError("Lütfen gelen dava dilekçesini metin olarak ekleyin (en az 20 karakter).");
        return false;
      }
      setError("");
      return true;
    }
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
    const missing = activeFields.filter((f) => f.required).filter((f) => !extraValues[f.id] || String(extraValues[f.id]).trim() === "").map((f) => f.label);
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
      const text = await res.text();
      let json;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      if (!res.ok) {
        const msg = (json && (json.error || json.message || json.detail)) || text || "Taslak kaydı başarısız";
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
    setCaseType(d?.dava_turu || "");
    setOlayOzet(d?.olay_ozet || "");
    setTalep(d?.talep || "");
    setDavaciAdSoyad(d?.davaci?.ad_soyad || "");
    setDavaliAdSoyad(d?.davali?.ad_soyad || "");
    setDelillerInput(Array.isArray(d?.eldeki_deliller) ? d.eldeki_deliller.join("\n") : (d?.eldeki_deliller || ""));
    setDilekceMd(d?.dilekce_md || "");
    setResult({
      girdi_ozeti: d?.girdi_ozeti || { olay_ozet: d?.olay_ozet, talep: d?.talep, davaci: d?.davaci, davali: d?.davali, eldeki_deliller: d?.eldeki_deliller, },
      kaynaklar: d?.kaynaklar || {},
      dilekce: {
        dilekce_md: d?.dilekce_md || "",
        dayanaklar: normalizeDayanaklar(d?.dilekce_json?.dayanaklar || d?.dayanaklar || d?.kaynaklar?.dayanaklar),
        davada_dikkat: normalizeDavadaDikkat(d?.dilekce_json?.davada_dikkat || d?.dilekce?.davada_dikkat || d?.davada_dikkat),
      },
    });
    setStep(3);
    setActiveTab("dilekce");
  }

  const parsedDayanaklar = useMemo(() => {
    const arr = Array.isArray(result?.dilekce?.dayanaklar) ? result.dilekce.dayanaklar : [];
    return arr.map(parseDayanakString).filter(Boolean);
  }, [result?.dilekce?.dayanaklar]);

  useEffect(() => {
    parsedDayanaklar.forEach(d => {
      if (d?.kanun && d?.madde) {
        ensureMaddeInCache(d.kanun, d.madde, setMaddeCache, pendingMadde);
      }
    });
  }, [parsedDayanaklar]);

  async function finalizeResult(finalObj) {
    const md = finalObj?.dilekce?.dilekce_md || finalObj?.taslak_md || (typeof finalObj?.dilekce?.taslak_md === "string" ? finalObj.dilekce.taslak_md : "");
    const finalForUI = { ...finalObj, dilekce: { ...(finalObj?.dilekce || {}), dayanaklar: normalizeDayanaklar(finalObj?.dilekce?.dayanaklar), }, };
    if (finalForUI && finalForUI.dilekce) {
      finalForUI.dilekce.davada_dikkat = normalizeDavadaDikkat(finalForUI.dilekce.davada_dikkat);
    }
    setResult(finalForUI);
    setDilekceMd(md || "");
    setStep(3);
    setLoading(false);
    try {
      setSaving(true);
      const dayanakOut = Array.isArray(finalForUI?.dilekce?.dayanaklar) && finalForUI.dilekce.dayanaklar.length ? finalForUI.dilekce.dayanaklar : null;
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

  useEffect(() => {
    if (step !== 2) return;
    setLoadStepIdx(0);
    const interval = setInterval(() => {
      setLoadStepIdx((prev) => (prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, [step]);

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
        ozel_bilgiler: { tip: caseType, alanlar: extraValues },
        ...(davaciAdSoyad.trim() ? { davaci: { ad_soyad: davaciAdSoyad.trim() } } : {}),
        ...(davaliAdSoyad.trim() ? { davali: { ad_soyad: davaliAdSoyad.trim() } } : {}),
        ...(deliller.length ? { eldeki_deliller: deliller } : {}),
        ...(caseType === "cevap" ? { gelen_dava_dilekcesi: (extraValues["gelen_dava_dilekcesi"] || "").trim() } : {}),
      };
      let data;
      let res;
      try {
        res = await fetch("/api/dilekce", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), });
        data = await res.json().catch(() => undefined);
      } catch (_) { data = undefined; }
      if (res && res.status === 402) {
        setLoading(false); setStep(1);
        if (confirm("Yetersiz Bakiye! Dilekçe oluşturmak için token satın almak ister misiniz?")) { window.location.href = "/paketler-ucretler"; } else { setError("Yetersiz bakiye. İşlem gerçekleştirilemedi."); }
        return;
      }
      if (res && !res.ok) {
        if (res.status === 402 && data?.error === "QUOTA_EXCEEDED") {
          setLoading(false); setStep(1);
          setError(data?.message || `Haftalık dilekçe kotanız dolmuştur. Plan: ${data?.plan ?? "-"}, limit: ${data?.limit ?? "-"}, kalan: ${data?.remaining ?? 0}.`);
          return;
        }
        if (res.status === 401) { setLoading(false); setStep(1); setError("Lütfen giriş yapın. Dilekçe oluşturmak için oturum gereklidir."); return; }
      }
      if (res?.ok && data && (data?.dilekce || data?.taslak_md || data?.durum === "completed")) {
        const finalObj = data?.dilekce ? data : { dilekce: { dilekce_md: data?.taslak_md || "" }, kaynaklar: data?.kaynaklar, girdi_ozeti: data?.girdi_ozeti };
        await finalizeResult(finalObj);
        return;
      }
      if (res?.ok && data?.id) {
        const id = data.id;
        const startTs = Date.now();
        const timeoutMs = 180_000;
        const pollOnce = async () => {
          let j;
          try { const r = await fetch(`/api/dilekce?id=${encodeURIComponent(id)}`, { cache: "no-store" }); j = await r.json().catch(() => undefined); } catch (_) { j = undefined; }
          if (!j) { const dr = await fetch(`${API_BASE}/dilekce/durum/${encodeURIComponent(id)}`, { cache: "no-store" }); j = await dr.json().catch(() => undefined); }
          if (j?.durum === "completed") { await finalizeResult(j); return true; }
          if (j?.durum === "failed") { throw new Error(j?.hata || "Dilekçe hazırlama başarısız."); }
          return false;
        };
        let done = await pollOnce();
        while (!done) {
          if (Date.now() - startTs > timeoutMs) { throw new Error("İşlem zaman aşımına uğradı. Lütfen tekrar deneyin."); }
          await new Promise((r) => setTimeout(r, 1500));
          done = await pollOnce();
        }
        return;
      }
      const directRes = await fetch(`${API_BASE}/dilekce/olustur`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), });
      const directJson = await directRes.json().catch(() => undefined);
      if (!directRes.ok) {
        if (directRes.status === 402 && directJson?.error === "QUOTA_EXCEEDED") { setLoading(false); setStep(1); setError(directJson?.message || `Haftalık dilekçe kotanız dolmuştur.`); return; }
        if (directRes.status === 401) { setLoading(false); setStep(1); setError("Lütfen giriş yapın."); return; }
      }
      if (directJson?.dilekce || directJson?.taslak_md || directJson?.durum === "completed") {
        const finalObj = directJson?.dilekce ? directJson : { dilekce: { dilekce_md: directJson?.taslak_md || "" }, kaynaklar: directJson?.kaynaklar, girdi_ozeti: directJson?.girdi_ozeti };
        await finalizeResult(finalObj);
        return;
      }
      if (directJson?.id) {
        const id = directJson.id;
        const startTs = Date.now();
        const timeoutMs = 60_000;
        const pollOnce = async () => {
          let j;
          try { const dr = await fetch(`${API_BASE}/dilekce/durum/${encodeURIComponent(id)}`, { cache: "no-store" }); j = await dr.json().catch(() => undefined); } catch (_) { j = undefined; }
          if (j?.durum === "completed") { await finalizeResult(j); return true; }
          if (j?.durum === "failed") { throw new Error(j?.hata || "Dilekçe hazırlama başarısız."); }
          return false;
        };
        let done = await pollOnce();
        while (!done) {
          if (Date.now() - startTs > timeoutMs) { throw new Error("İşlem zaman aşımına uğradı."); }
          await new Promise((r) => setTimeout(r, 1500));
          done = await pollOnce();
        }
        return;
      }
      throw new Error("Sunucudan beklenen veri alınamadı.");
    } catch (err) {
      console.error(err);
      setError("Bilinmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.");
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

  const Stepper = () => {
    const steps = [ { id: 1, label: "Bilgi" }, { id: 2, label: "Oluşturuluyor" }, { id: 3, label: "Sonuç" }, ];
    return (
      <ol className="flex items-center gap-2 md:gap-4">
        {steps.map((s) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span className={["h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold", done ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white ring-2 ring-blue-300" : "bg-slate-800 text-slate-400"].join(" ")}>{done ? "✓" : s.id}</span>
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

  const iconPath = "M12 18.75a6 6 0 006-6v-1.5a.75.75 0 011.5 0v1.5a7.5 7.5 0 11-15 0v-1.5a.75.75 0 011.5 0v1.5a6 6 0 006 6zM12 9a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75V11.25a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V9z";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black text-gray-100 relative overflow-hidden">
      {CanvasBackground ? <CanvasBackground /> : null}
      <div className="relative z-10 py-6 md:py-8 px-3 sm:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl shadow-xl backdrop-blur-sm">
            <header className="p-6 md:p-8 border-b border-slate-700/60">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400 relative -top-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={iconPath} /></svg>
                  <h1 className="text-xl lg:text-1xl font-bold text-gray-100 leading-tight">Dilekçe Oluşturucu Pro</h1>
                </div>
                <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
                  <div className="w-full md:w-auto"><TokenBalance /></div>
                  <button type="button" onClick={() => { fetchRecentDrafts(); setShowDrafts(true); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-600 transition" title="Son dilekçelerinizi görüntüleyin">Son Dilekçeleriniz</button>
                  <Stepper />
                </div>
              </div>
              <p className="mt-2 text-slate-400 text-sm">Önce dava türünü seçin, ardından olay özetinizi ve talebinizi girin. Diğer alanlar seçiminize göre dinamik olarak gelecektir.</p>
            </header>

            <div className="divide-y divide-slate-700/60">
              {step === 1 && (
                <section className="p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Dava Türü *</label>
                        <select className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500" value={caseType} onChange={(e) => handleCaseTypeChange(e.target.value)} required>
                          {Object.entries(CASE_TYPES).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Örn: Kamulaştırmasız El Atma davası seçildiğinde taşınmaz ada parsel bilgisi gibi alanlar otomatik gelir.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Davacı Adı (isteğe bağlı)</label>
                        <input className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Örn. Can Yılmaz" value={davaciAdSoyad} onChange={(e) => setDavaciAdSoyad(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Talep *</label>
                        <input className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Boşanma, 20.000 TL Tazminat..." value={talep} onChange={(e) => setTalep(e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Davalı Adı (isteğe bağlı)</label>
                        <input className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Örn. Cem Yılmaz" value={davaliAdSoyad} onChange={(e) => setDavaliAdSoyad(e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Davaya Sebebiyet Veren Somut Olaylar *</label>
                        <textarea className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500" rows={4} placeholder="Örn. Müvekkilin kocası müvekkili aldatmıştır..." value={olayOzet} onChange={(e) => setOlayOzet(e.target.value)} required />
                        <div className="flex justify-between text-xs text-slate-400 mt-1"><span>En az 20 karakter</span>{caseType === "cevap" && (<span className="ml-2 text-amber-300">(Cevap Dilekçesi modunda zorunlu değil)</span>)}<span>{olayCharCount} karakter</span></div>
                      </div>
                      {activeFields.length > 0 && (
                        <div className="md:col-span-2">
                          <div className="rounded-xl border border-slate-700 p-4">
                            <h3 className="font-medium mb-3 text-gray-200">{CASE_TYPES[caseType]?.label} — Özel Bilgiler</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              {activeFields.map((f) => (
                                <div key={f.id}>
                                  <label className="block text-sm font-medium mb-1">{f.label} {f.required ? "*" : ""}</label>
                                  <FieldInput field={f} value={extraValues[f.id] || ""} onChange={handleExtraChange} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Eldeki Deliller (isteğe bağlı) — her satır bir delil</label>
                        <textarea className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-2 outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder={`Tanık Beyanları\nNüfus Kayıtları\nFaturalar`} value={delillerInput} onChange={(e) => setDelillerInput(e.target.value)} />
                      </div>
                    </div>
                    {error && (<div className="rounded-xl border border-red-400/60 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>)}
                    <div className="flex items-center gap-3">
                      <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 text-white px-5 py-2 hover:bg-blue-500 disabled:opacity-60 transition">{loading ? "Gönderiliyor..." : "Dilekçe Oluştur"}</button>
                      <button type="button" onClick={resetForm} className="rounded-xl border border-slate-600 px-5 py-2 hover:bg-slate-800 transition">Temizle</button>
                    </div>
                  </form>
                </section>
              )}

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
                            {done ? (<span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-400/50 text-emerald-300 text-xs">✓</span>) : active ? (<span className="inline-flex items-center justify-center h-5 w-5 rounded-full"><span className="h-4 w-4 rounded-full border-2 border-sky-400/30 border-t-sky-400 animate-spin" /></span>) : (<span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-slate-800 border border-slate-700 text-slate-500 text-xs">•</span>)}
                            <span className={active ? "text-sky-300" : done ? "text-slate-300" : "text-slate-500"}>{msg}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${Math.round(((loadStepIdx + 1) / LOADING_MESSAGES.length) * 100)}%` }} />
                    </div>
                  </div>
                  <LoaderCard /><LoaderCard />
                </section>
              )}

              {step === 3 && (
                <section className="p-6 md:p-8 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">✓ Hazır</span>
                      <h2 className="text-xl font-semibold text-gray-200">Taslak Dilekçe</h2>
                      {saving && <span className="text-xs text-slate-400 ml-2">kaydediliyor…</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={handleCopy} className="rounded-xl border border-slate-600 px-4 py-2 hover:bg-slate-800 transition text-sm" title="Markdown'ı panoya kopyala">{copied ? "Kopyalandı ✓" : "Kopyala"}</button>
                      <button onClick={() => downloadAsDocxFromPreviewNode(dilekcePreviewRef.current, "dilekce_taslak", setError)} className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-500 transition text-sm" title="Word (.docx) olarak indir">Word (.docx)</button>
                      <button onClick={() => downloadAsPdfFromPreviewNode(dilekcePreviewRef.current, "dilekce_taslak", setError)} className="rounded-xl bg-rose-600 text-white px-4 py-2 hover:bg-rose-500 transition text-sm" title="PDF olarak indir">PDF</button>
                    </div>
                  </div>
                  {error && (<div className="w-full mt-2 rounded-xl border border-red-400/60 bg-red-500/10 p-2 text-xs text-red-300">{error}</div>)}

                  <div className="flex items-center gap-2 border-b border-slate-700/60">
                    {[ { key: "dilekce", label: "Dilekçe Metni" }, { key: "kaynaklar", label: "Yararlanılan Kaynaklar" }, { key: "girdi", label: "Girdi Özeti" }, { key: "dikkat", label: "Davada Dikkat" }, ].map((t) => (
                      <button key={t.key} onClick={() => setActiveTab(t.key)} className={["px-4 py-2 text-sm", activeTab === t.key ? "border-b-2 border-blue-500 text-blue-300" : "text-slate-400 hover:text-slate-200"].join(" ")}>{t.label}</button>
                    ))}
                  </div>

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
                            {isEmpty ? ( <div className="rounded-xl border border-slate-700/60 p-4 text-slate-400 text-sm">Bu bölüm için özetlenmiş bir içerik oluşturulamadı.</div> ) : (
                              <div className="grid md:grid-cols-3 gap-4">
                                <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
                                  <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-amber-300">Olası Riskler</h3><span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300">{riskler.length}</span></div>
                                  {riskler.length ? (<ul className="list-disc pl-5 space-y-1 text-sm">{riskler.map((it, idx) => (<li key={idx} className="text-amber-100/90">{it}</li>))}</ul>) : (<p className="text-slate-400 text-sm">Herhangi bir risk öne çıkmadı.</p>)}
                                </div>
                                <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-4">
                                  <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-sky-300">Muhtemel Karşı İddialar</h3><span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/40 text-sky-300">{karsi.length}</span></div>
                                  {karsi.length ? (<ul className="list-disc pl-5 space-y-1 text-sm">{karsi.map((it, idx) => (<li key={idx} className="text-sky-100/90">{it}</li>))}</ul>) : (<p className="text-slate-400 text-sm">Öne çıkan bir karşı iddia listelenmedi.</p>)}
                                </div>
                                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
                                  <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-emerald-300">Mutlaka Sunulması Gereken Deliller</h3><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-300">{deliller.length}</span></div>
                                  {deliller.length ? (<ul className="list-disc pl-5 space-y-1 text-sm">{deliller.map((it, idx) => (<li key={idx} className="text-emerald-100/90">{it}</li>))}</ul>) : (<p className="text-slate-400 text-sm">Bu dava için kritik delil önerisi bulunamadı.</p>)}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {activeTab === "dilekce" && (
                    <div ref={dilekcePreviewRef} className="max-w-none text-[15px] leading-[1.55] bg-slate-900/50 rounded-xl border border-slate-700/60 p-8">
                      <div className="text-[15px] leading-[1.6]">
                        {renderDilekce(dilekceMd || "_Dilekçe metni yok._")}
                      </div>
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
                              if (!hasStruct) return <div key={i} className="text-sm text-slate-300">• {d.display}</div>;
                              const slug = slugifyMevzuatAdi(d.kanun);
                              const href = slug ? `/mevzuat/${encodeURIComponent(slug)}${maddeAnchor(d.madde)}` : "";
                              const popKey = `${slug || "mevzuat"}::${d.madde}`;
                              const preview = getMevzuatPreview({ mevzuat_adi: d.kanun, madde: d.madde }, maddeCache);
                              return (
                                <div key={i} className="w-full space-y-1" data-mevzuat-popover="1">
                                  <div className="flex items-stretch gap-2">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); const el = e.currentTarget; const pos = calcMevzuatPopover(el); setOpenMevzuat(prev => (prev?.key === popKey ? null : { key: popKey, el, ...pos })); }} aria-expanded={openMevzuat?.key === popKey} className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-semibold rounded-lg bg-cyan-600/40 text-white whitespace-nowrap leading-none hover:bg-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/30 transition-colors"><span>m.</span><span className="tabular-nums">{d.madde}</span></button>
                                    <div className="relative flex-1">
                                      {href ? (<a className="flex-1 inline-flex items-center px-3 py-2 rounded-lg bg-slate-700/60 text-[11px] text-slate-300 font-medium leading-tight min-h-[32px] hover:text-cyan-300 hover:bg-slate-600/60 transition-colors" href={href} target="_blank" rel="noreferrer" onClick={(e)=>e.stopPropagation()} title="Tam mevzuat sayfasına git">{d.kanun}</a>) : (<span className="flex-1 inline-flex items-center px-3 py-2 rounded-lg bg-slate-700/60 text-[11px] text-slate-300 font-medium leading-tight min-h-[32px]">{d.kanun}</span>)}
                                      {openMevzuat?.key === popKey && (
                                        <div data-mevzuat-popover="1" role="dialog" aria-modal="true" onClick={(e)=>e.stopPropagation()} className={"fixed z-[999] w-[42rem] max-w-[92vw] max-h-[70vh] overflow-auto rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_24px_rgba(34,211,238,0.2)] ring-1 ring-cyan-400/35 p-4 text-[12px] text-slate-100 transition-transform duration-150 ease-out will-change-transform " + (openMevzuat?.placement === 'left' ? "-translate-x-full -translate-y-1/2" : openMevzuat?.placement === 'right' ? "-translate-y-1/2" : openMevzuat?.placement === 'bottom' ? "-translate-x-1/2" : "-translate-x-1/2 -translate-y-full")} style={{ top: openMevzuat.top, left: openMevzuat.left }}>
                                          <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
                                          <div className="flex items-center justify-between gap-2 mb-2"><div className="text-slate-100"><div className="font-semibold">{d.kanun}</div><div className="text-xs text-slate-300 mt-0.5">m. {d.madde}</div></div><button type="button" onClick={() => setOpenMevzuat(null)} className="shrink-0 w-8 h-8 grid place-items-center rounded-md bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-400/40" aria-label="Kapat"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>
                                          <div className="leading-snug whitespace-pre-wrap break-words font-medium">{preview || "Madde metni getirilemedi."}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (<ul className="list-disc pl-5 space-y-1 text-slate-300 text-sm"><li className="text-slate-400">Belirtilmedi</li></ul>)}
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
                              const isSummary = typeRaw === "ai_ozet" || /(?:\bözet\b|\bozet\b|gemini)/i.test(String(p.dosya_adi || ""));
                              const slug = bestSlugFromProps(p, all);
                              const key = slug || (String(p.orijinal_karar_id || p.karar_id || p.dosya_adi || "").replace(/\.txt$/i, ""));
                              if (!key) continue;
                              const code = deduceEsasKararFromProps(p);
                              const court = deduceCourtLabelFromProps(p);
                              const rec = dict.get(key) || { slug, code: "", court: "", hasOriginal: false };
                              if (!rec.slug && slug) rec.slug = slug;
                              if (code && !rec.code) rec.code = code;
                              if (court && !rec.court) rec.court = court;
                              if (!isSummary) rec.hasOriginal = true;
                              dict.set(key, rec);
                            }
                            const list = Array.from(dict.values()).filter((r) => r.code || r.court || r.slug).sort((a, b) => (a.court || "").localeCompare(b.court || "") || (a.code || "").localeCompare(b.code || ""));
                            if (!list.length) return <li className="text-slate-400">Belirtilmedi</li>;
                            return list.map((r, i) => {
                              const hasSlug = r.slug && looksLikeSlug(r.slug);
                              const content = (<>{r.court ? <span>{r.court}</span> : null}{r.court && (r.code || r.slug) ? <span className="mx-1 text-slate-400">·</span> : null}{r.code ? <span className="tabular-nums">{r.code}</span> : (r.slug || "")}</>);
                              if (hasSlug) { return (<li key={i}><Link href={`/kararlar/${encodeURIComponent(r.slug)}`} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{content}</Link></li>); }
                              return <li key={i}>{content}</li>;
                            });
                          })()}
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === "girdi" && (
                    <div className="rounded-xl border border-slate-700/60 p-4 text-sm text-slate-300 space-y-2">
                      <div><span className="text-slate-400">Dava Türü:</span> <span className="text-slate-200">{CASE_TYPES[caseType]?.label || "(belirtilmedi)"}</span></div>
                      <div><span className="text-slate-400">Olay Özeti:</span> <span className="text-slate-200">{result?.girdi_ozeti?.olay_ozet || olayOzet}</span></div>
                      <div><span className="text-slate-400">Talep:</span> <span className="text-slate-200">{result?.girdi_ozeti?.talep || talep}</span></div>
                      <div><span className="text-slate-400">Davacı:</span> <span className="text-slate-200">{result?.girdi_ozeti?.davaci?.ad_soyad || davaciAdSoyad || "(belirtilmedi)"}</span></div>
                      {activeFields.length > 0 && (<div><span className="text-slate-400">Özel Bilgiler:</span> <span className="text-slate-200">{Object.keys(extraValues).length ? activeFields.map((f) => `${f.label}: ${extraValues[f.id] || "-"}`).join(" • ") : "(belirtilmedi)"}</span></div>)}
                      <div><span className="text-slate-400">Deliller:</span> <span className="text-slate-200">{Array.isArray(result?.girdi_ozeti?.eldeki_deliller) && result.girdi_ozeti.eldeki_deliller.length ? result.girdi_ozeti.eldeki_deliller.join(", ") : deliller.length ? deliller.join(", ") : "(belirtilmedi)"}</span></div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button type="button" onClick={resetForm} className="rounded-xl border border-slate-600 px-5 py-2 hover:bg-slate-800 transition">Yeni Dilekçe</button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
  /* ========= PROSE (TYPOGRAPHY) ========= */
  .prose { font-size: 0.95rem; line-height: 1.55; color: #e2e8f0; }

  .prose p {
    margin: 0 0 0.4rem 0;
    text-align: justify;
  }

  .prose p:empty { display: none; }

  .prose ol {
    margin: 0.15rem 0 0.3rem 1.1rem;
    padding: 0;
  }

  .prose li {
    margin: 0;
    line-height: 1.4;
  }

  .prose li > p {
    margin: 0;
  }

  .prose .section-head {
    margin-top: 0.8rem !important;
    margin-bottom: 0.25rem !important;
    font-weight: 800;
    text-transform: uppercase;
  }

  .prose .mahkemesine {
    text-align: center;
    font-weight: 800;
    margin: 0 0 0.8rem 0;
  }

  .prose strong {
    color: #fff;
    font-weight: 800;
  }

  /* ========= NOT-PROSE (DİLEKÇE METNİ KONTROLÜ) ========= */
  .not-prose p {
    margin: 0 0 0.35rem 0;
    line-height: 1.45;
    text-align: justify;
  }

  .not-prose ol,
  .not-prose ul {
    margin: 0.2rem 0 0.4rem 1.1rem;
    padding: 0;
  }

  .not-prose li {
    margin: 0;
    padding: 0;
    line-height: 1.45;
  }

  .not-prose li > p {
    margin: 0;
  }

  .not-prose .section-head {
    margin-top: 0.8rem;
    margin-bottom: 0.25rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .not-prose .mahkemesine {
    margin: 0 0 0.8rem 0;
    text-align: center;
    font-weight: 800;
  }
`}</style>
      
      {/* Geçmiş Modal */}
      {showDrafts && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDrafts(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-slate-900 border-l border-slate-700 shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-200">Son Dilekçeleriniz</h3><div className="flex items-center gap-2"><button onClick={() => fetchRecentDrafts()} className="text-xs px-3 py-1 rounded border border-slate-600 hover:bg-slate-800">Yenile</button><button onClick={() => setShowDrafts(false)} className="text-xs px-3 py-1 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700">Kapat</button></div></div>
            {Array.isArray(recentDrafts) && recentDrafts.length ? (<ul className="divide-y divide-slate-700/60">{recentDrafts.map((d) => { const created = d.createdAt || d.created_at; const when = created ? new Date(created).toLocaleString("tr-TR") : ""; return (<li key={d.id} className="py-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="text-sm text-slate-200 truncate">{d.dava_turu ? (CASE_TYPES[d.dava_turu]?.label || d.dava_turu) : "Taslak"}</div>{when && <div className="text-xs text-slate-400 truncate">{when}</div>}{d.olay_ozet && (<div className="text-xs text-slate-400 line-clamp-1">{d.olay_ozet}</div>)}</div><div className="flex items-center gap-2">{d?.dilekce_md ? (<button onClick={() => { loadDraft(d); setShowDrafts(false); }} className="text-xs px-3 py-1 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700">Yükle</button>) : null}</div></li>); })}</ul>) : (<div className="text-sm text-slate-400">Kayıt bulunamadı.</div>)}
          </div>
        </div>
      )}
    </main>
  );
}