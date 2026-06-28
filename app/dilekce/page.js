"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import TokenBalance from "@/components/TokenBalance";
import { useTheme } from "@/app/context/ThemeContext";
// SADECE BU SATIRI EKLEDİM: Veriyi dışarıdan çekiyoruz.
import { CASE_TYPES } from "./caseData";
// Markdown render (SSR kapalı, projeye uygun)

/* ============================================================
   CONSULTO · Dilekçe Oluşturucu
   Modern "editöryel hukuk" arayüzü — krem/lacivert + altın aksan
   Analiz sayfasıyla aynı görsel dil · Serif başlıklar
   ============================================================ */
const T = (dark) => ({
  appBg:      dark ? "bg-[#0A0F1C]"        : "bg-[#F3EDE1]",
  surface:    dark ? "bg-[#101626]"        : "bg-[#FBF7EE]",
  surfaceAlt: dark ? "bg-[#0D1322]"        : "bg-white",
  line:       dark ? "border-white/10"     : "border-[#E4DAC6]",
  lineSoft:   dark ? "border-white/5"      : "border-[#ECE3D2]",
  ink:        dark ? "text-slate-100"      : "text-[#1C2A47]",
  inkSoft:    dark ? "text-slate-400"      : "text-[#5B6478]",
  inkMute:    dark ? "text-slate-500"      : "text-[#8A8270]",
  navy:       dark ? "text-amber-300"      : "text-[#1C2A47]",
  gold:       dark ? "text-amber-400"      : "text-[#A77B2E]",
  goldBg:     dark ? "bg-amber-400/10"     : "bg-[#F2E7CC]",
  goldBorder: dark ? "border-amber-400/30" : "border-[#DCC68C]",
});

// --- Dilekçe Satır Satır Renderer ---
const renderDilekce = (text) => {
  const lines = (text || "").split("\n");
  let konuYakalandi = false;
  // Hangi bölümdeyiz? (AÇIKLAMALAR, DELİLLER, SONUÇ VE İSTEM, HUKUKİ NEDENLER vb.)
  // Numaralı madde başlığı kalınlaştırma kuralı SADECE AÇIKLAMALAR içinde uygulanacak;
  // aksi halde DELİLLER/SONUÇ VE İSTEM listelerindeki maddeler tutarsız şekilde kalınlaşıyor.
  let currentSection = null;

  // Markdown + HTML temizleme: <h3>, <br>, **bold**, _italic_, "> alıntı" vb. işaretleri kaldır
  const stripMd = (s = "") => String(s)
    .replace(/<br\s*\/?>/gi, " ")      // <br> → boşluk
    .replace(/<\/?[^>]+>/g, "")         // tüm HTML etiketleri kaldırılır, metin korunur
    .replace(/^\s*#{1,6}\s*/, "")       // markdown başlık (#) işareti
    .replace(/^\s*>+\s?/, "")           // markdown alıntı (>) işareti
    .replace(/[\*_`]/g, "")             // **bold**, _italic_, `code`
    .replace(/\s+/g, " ")
    .trim();

  return lines.map((line, i) => {
    const trimmed = line.trim();

    // Tamamen boş kaynak satırı → küçük dikey boşluk (paragraf aralığı)
    if (!trimmed) return <div key={i} style={{ height: "8px" }} />;

    // Alıntı (blockquote) satırı mı? — temizlemeden ÖNCE tespit et
    const isQuote = /^>+\s?/.test(trimmed);

    const plain = stripMd(trimmed);

    // Sadece işaretten ibaret olup içeriği boşalan satırları atla (örn. yalın ">")
    if (!plain) return null;

    // === ALINTI SATIRLARI (Yargıtay kararları vb.) — sol kenarlık + italik ===
    if (isQuote) {
      return (
        <p
          key={i}
          style={{
            borderLeft: "3px solid #C9A24B",
            paddingLeft: "14px",
            margin: "6px 0",
            fontStyle: "italic",
          }}
        >
          {plain}
        </p>
      );
    }

    // === BÖLÜM BAŞLIKLARI (HUKUKİ NEDENLER / DELİLLER / SONUÇ VE İSTEM) ===
    const normalized = plain
      .replace(/\s*:\s*$/, "") // sondaki ":" ve boşlukları temizle
      .toUpperCase();

    if (
      normalized === "HUKUKİ NEDENLER" ||
      normalized === "HUKUKİ NEDEN" ||
      normalized === "HUKUKİ SEBEP" ||
      normalized === "HUKUKİ SEBEPLER" ||
      normalized === "HUKUKİ DELİLLER" ||
      normalized === "DELİLLER" ||
      normalized === "SONUÇ VE İSTEM"
    ) {
      currentSection = normalized;
      return (
        <p
          key={i}
          className="font-extrabold uppercase mt-4 mb-1"
          style={{ fontWeight: 800, textTransform: "uppercase", margin: "14px 0 6px" }}
        >
          {normalized}:
        </p>
      );
    }

    // MAHKEME BAŞLIĞI
    if (/MAHKEMES[İI]NE$/i.test(plain)) {
      return (
        <p
          key={i}
          className="text-center font-bold mb-4"
          style={{ textAlign: "center", fontWeight: 700, margin: "20px 0", textTransform: "uppercase" }}
        >
          {plain}
        </p>
      );
    }

    // === NUMARALI MADDE BAŞLIKLARI → KALIN ===
    // Büyük/küçük harf farketmez. Örn: "6. 01.04.1974 TARİHLİ ..." (tamamı büyük)
    // veya "6. Emsal Bedel Tespiti ve Tapu İptal Tescil Talebimiz" (Title Case).
    // Başlık niteliğinde sayılması için: kısa olmalı ve içinde cümle bitirici
    // (. ! ?) bulunmamalı — yoksa bu bir madde başlığı değil, normal bir cümledir.
    const numberedHeadingMatch = plain.match(/^([0-9]+|[IVXLC]+)\.\s+(.+)$/);
    if (numberedHeadingMatch && currentSection === "AÇIKLAMALAR") {
      const headingText = numberedHeadingMatch[2];
      const wordCount = headingText.trim().split(/\s+/).length;
      const isShortTitle =
        plain.length <= 100 &&
        wordCount <= 14 &&
        !/[.!?]/.test(headingText.replace(/\.\.\.$/, ""));

      if (isShortTitle) {
        return (
          <p key={i} className="font-bold mb-2" style={{ fontWeight: 700, margin: "10px 0" }}>
            {plain}
          </p>
        );
      }
    }

    // === ÇOK TARAFLI DAVACI/DAVALI LİSTESİ ===
    // Örn: "DAVALI:" etiketi boş değerle gelip altında "1- Ankara Büyükşehir Belediye
    // Başkanlığı" / "2- Etimesgut Belediye Başkanlığı" gibi numaralı taraflar geldiğinde,
    // bu satırlar DAVACI/VEKİLİ değer sütunuyla (etiketten sonraki 180px+gap) hizalı
    // girintili gösterilir; sayfanın en solundan başlamaz.
    const partyListMatch = plain.match(/^([0-9]+)[-.)]\s+(.+)$/);
    if (
      partyListMatch &&
      (currentSection === "DAVACI" || currentSection === "DAVALI")
    ) {
      return (
        <div key={i} className="mb-1" style={{ paddingLeft: "188px" }}>
          {plain}
        </div>
      );
    }

    // ETİKETLİ SATIRLAR
    const labelMatch = plain.match(
      /^(DAVACI|VEK[İI]L[İI]|DAVALI|ADRES|DAVA DEĞER[İI]|KONU|AÇIKLAMALAR)\s*:?\s*(.*)$/i
    );

    if (labelMatch) {
      const label = labelMatch[1].toUpperCase();
      currentSection = label;

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
        <div
          key={i}
          className="grid grid-cols-[180px_1fr] gap-2 mb-1"
          style={{ margin: "3px 0" }}
        >
          <div className="font-bold" style={{ fontWeight: 700 }}>
            {label}:
          </div>
          <div>{labelMatch[2]}</div>
        </div>
      );
    }

    // === DAVACI/VEKİLİ/DAVALI ALTINDAKİ DEVAM SATIRLARI (örn. "[Adres]") ===
    // Etiket satırından sonra gelen, yeni bir etiket/bölüm olmayan devam satırları
    // (adres vb.) da değer sütunuyla hizalı girintili gösterilir; sayfanın en
    // solundan başlamaz — DAVACI/VEKİLİ/DAVALI değeriyle aynı dikey çizgide durur.
    if (
      currentSection === "DAVACI" ||
      currentSection === "VEKİLİ" ||
      currentSection === "DAVALI"
    ) {
      return (
        <div key={i} className="mb-1" style={{ paddingLeft: "188px" }}>
          {plain}
        </div>
      );
    }

    // NORMAL SATIR
    const isSignatureBlock =
      plain === "Davacı Vekili" ||
      /^Av\.\s*\[.*\]/i.test(plain) ||
      /^Av\.\s/i.test(plain) ||
      /e-?imza/i.test(plain);

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
async function downloadAsDocxFromPreviewNode(previewNode, filenameBase, setError, mdText) {
  try {
    const html = buildPdfHtml(mdText || "", filenameBase);

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

// Markdown metinden PDF için temiz HTML üretir (DOM snapshot almaz — Tailwind bağımlılığı yok)
function buildPdfHtml(mdText, title = "Dilekçe") {
  const stripMd = (s = "") => String(s)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/^\s*#{1,6}\s*/, "")
    .replace(/^\s*>+\s?/, "")
    .replace(/[\*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const esc = (s = "") => String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const lines = (mdText || "").split("\n");
  let bodyHtml = "";
  let currentSection = null;
  let konuYakalandi = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { bodyHtml += '<div style="height:6px"></div>'; continue; }
    const isQuote = /^>+\s?/.test(trimmed);
    const plain = stripMd(trimmed);
    if (!plain) continue;

    if (isQuote) {
      bodyHtml += `<p style="border-left:3px solid #888;padding-left:12px;margin:6px 0;font-style:italic;">${esc(plain)}</p>`;
      continue;
    }

    const normalized = plain.replace(/\s*:\s*$/, "").toUpperCase();
    const SECTION_HEADS = ["HUKUKİ NEDENLER","HUKUKİ NEDEN","HUKUKİ SEBEP","HUKUKİ SEBEPLER","HUKUKİ DELİLLER","DELİLLER","SONUÇ VE İSTEM"];
    if (SECTION_HEADS.includes(normalized)) {
      currentSection = normalized;
      bodyHtml += `<p style="font-weight:800;text-transform:uppercase;margin:14px 0 6px;">${esc(normalized)}:</p>`;
      continue;
    }

    if (/MAHKEMES[İI]NE$/i.test(plain)) {
      bodyHtml += `<p style="text-align:center;font-weight:700;margin:20px 0;text-transform:uppercase;">${esc(plain)}</p>`;
      continue;
    }

    const numberedMatch = plain.match(/^([0-9]+|[IVXLC]+)\.\s+(.+)$/);
    if (numberedMatch && currentSection === "AÇIKLAMALAR") {
      const heading = numberedMatch[2];
      const isShort = plain.length <= 100 && heading.trim().split(/\s+/).length <= 14 && !/[.!?]/.test(heading.replace(/\.\.\.$/, ""));
      if (isShort) { bodyHtml += `<p style="font-weight:700;margin:10px 0;">${esc(plain)}</p>`; continue; }
    }

    const labelMatch = plain.match(/^(DAVACI|VEK[İI]L[İI]|DAVALI|ADRES|DAVA DEĞER[İI]|KONU|AÇIKLAMALAR)\s*:?\s*(.*)$/i);
    if (labelMatch) {
      const label = labelMatch[1].toUpperCase();
      currentSection = label;
      if (label === "KONU") {
        if (konuYakalandi) { bodyHtml += `<p style="margin-bottom:0.4em;">${esc(plain)}</p>`; continue; }
        konuYakalandi = true;
      }
      bodyHtml += `<div style="page-break-inside:avoid;break-inside:avoid;"><table style="width:100%;border-collapse:collapse;margin:3px 0;">
        <tr><td style="font-weight:700;width:180px;min-width:180px;vertical-align:top;padding-right:8px;">${esc(label)}:</td>
        <td style="vertical-align:top;">${esc(labelMatch[2])}</td></tr></table></div>`;
      continue;
    }

    if (currentSection === "DAVACI" || currentSection === "VEKİLİ" || currentSection === "DAVALI") {
      bodyHtml += `<div style="page-break-inside:avoid;break-inside:avoid;"><table style="width:100%;border-collapse:collapse;margin:1px 0;">
        <tr><td style="width:188px;min-width:188px;"></td><td>${esc(plain)}</td></tr></table></div>`;
      continue;
    }

    const isSig = plain === "Davacı Vekili" || /^Av\.\s*\[.*\]/i.test(plain) || /^Av\.\s/i.test(plain) || /e-?imza/i.test(plain);
    const wrapStyle = "page-break-inside:avoid;break-inside:avoid;";
    bodyHtml += isSig
      ? `<div style="${wrapStyle}"><p style="text-align:right;font-weight:500;margin-bottom:0.4em;">${esc(plain)}</p></div>`
      : `<div style="${wrapStyle}"><p style="margin-bottom:0.4em;">${esc(plain)}</p></div>`;
  }

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.75; color: #000; background: #fff; margin: 0; padding: 0; }
  p {
    margin: 0 0 0.5em 0;
    page-break-inside: avoid;
    break-inside: avoid;
    orphans: 3;
    widows: 3;
  }
  table {
    border-collapse: collapse;
    page-break-inside: avoid;
    break-inside: avoid;
    width: 100%;
  }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

// .pdf indirme
async function downloadAsPdfFromPreviewNode(_previewNode, filenameBase, setError, mdText) {
  try {
    const html = buildPdfHtml(mdText || "", filenameBase);

    const html2pdf = await ensureScriptLoaded("https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js", "html2pdf");
    if (!html2pdf) throw new Error("html2pdf.js yüklenemedi");

    const opt = {
      filename: `${filenameBase}.pdf`,
      margin: [15, 20, 15, 20],
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: "css" },
    };
    await window.html2pdf().set(opt).from(html).save();
  } catch (e) {
    console.error(e);
    setError && setError("PDF hazırlanırken bir hata oluştu.");
  }
}

// UYAP UDF formatında content.xml oluşturur
// Format: ZIP içinde content.xml; karakter-offset tabanlı <elements> ile bold/align stilleri
function buildUdfXml(mdText) {
  const stripMd = (s = "") => String(s)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/^\s*#{1,6}\s*/, "")
    .replace(/^\s*>+\s?/, "")
    .replace(/[\*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const SECTION_HEADS = new Set([
    "HUKUKİ NEDENLER","HUKUKİ NEDEN","HUKUKİ SEBEP","HUKUKİ SEBEPLER",
    "HUKUKİ DELİLLER","DELİLLER","SONUÇ VE İSTEM","EKLER",
  ]);

  // paragraphs: { text, align: "1"|"2"|"3"|null, runs: [{len,bold,underline}]|null }
  const paragraphs = [];
  let currentSection = null;
  let konuYakalandi = false;

  for (const rawLine of (mdText || "").split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed) { paragraphs.push({ text: "", align: null, runs: null }); continue; }
    const isQuote = /^>+\s?/.test(trimmed);
    const plain = stripMd(trimmed);
    if (!plain) { paragraphs.push({ text: "", align: null, runs: null }); continue; }

    // Mahkeme başlığı
    if (/MAHKEMES[İI]NE$/i.test(plain)) {
      const t = plain.toUpperCase();
      paragraphs.push({ text: t, align: "1", runs: [{ len: t.length, bold: true, underline: false }] });
      continue;
    }

    const normalized = plain.replace(/\s*:\s*$/, "").toUpperCase();

    // Bölüm başlıkları (HUKUKİ NEDENLER, DELİLLER, SONUÇ VE İSTEM)
    if (SECTION_HEADS.has(normalized)) {
      currentSection = normalized;
      const t = normalized + "\t:";
      paragraphs.push({ text: t, align: null, runs: [{ len: t.length, bold: true, underline: true }] });
      continue;
    }

    // Etiketli satırlar (DAVACI:, VEKİLİ:, vs.)
    const labelMatch = plain.match(/^(DAVACI|VEK[İI]L[İI]|DAVALI|ADRES|DAVA DEĞER[İI]|KONU|AÇIKLAMALAR)\s*:?\s*(.*)$/i);
    if (labelMatch) {
      const label = labelMatch[1].toUpperCase();
      const value = (labelMatch[2] || "").trim();
      currentSection = label;

      if (label === "KONU" && konuYakalandi) {
        paragraphs.push({ text: "\t" + plain, align: "3", runs: null });
        continue;
      }
      if (label === "KONU") konuYakalandi = true;

      if (label === "AÇIKLAMALAR" && !value) {
        paragraphs.push({ text: "AÇIKLAMALAR", align: null, runs: [{ len: 11, bold: true, underline: true }] });
        continue;
      }

      // UYAP tab hizalaması: ≤8 karakter → 2 tab, >8 → 1 tab
      const tabs = label.length <= 8 ? "\t\t" : "\t";
      const after = tabs + ":" + (value ? " " + value : "");
      const t = label + after;
      paragraphs.push({ text: t, align: null, runs: [
        { len: label.length, bold: true, underline: true },
        { len: after.length, bold: false, underline: false },
      ]});
      continue;
    }

    // Taraf devam satırları (adres vb.)
    if (["DAVACI", "VEKİLİ", "DAVALI"].includes(currentSection || "")) {
      paragraphs.push({ text: "\t\t  " + plain, align: null, runs: null });
      continue;
    }

    // Gövde metni
    if (currentSection === "AÇIKLAMALAR" || SECTION_HEADS.has(currentSection || "")) {
      if (isQuote) { paragraphs.push({ text: plain, align: "3", runs: null }); continue; }
      const numMatch = plain.match(/^([0-9]+|[IVXLC]+)[-.]\s+(.+)$/);
      if (numMatch && currentSection === "AÇIKLAMALAR") {
        const head = numMatch[2];
        if (plain.length <= 100 && head.split(/\s+/).length <= 14) {
          paragraphs.push({ text: plain, align: null, runs: [{ len: plain.length, bold: true, underline: false }] });
          continue;
        }
      }
      paragraphs.push({ text: "\t" + plain, align: "3", runs: null });
      continue;
    }

    // İmza
    const isSig = plain === "Davacı Vekili" || /^Av\.\s/i.test(plain) || /e-?imza/i.test(plain);
    if (isSig) {
      paragraphs.push({ text: plain, align: "2", runs: [{ len: plain.length, bold: true, underline: false }] });
      continue;
    }

    paragraphs.push({ text: plain, align: null, runs: null });
  }

  // Tam metin (her satır \n ile biter)
  const fullText = paragraphs.map(p => p.text).join("\n") + "\n";

  // <elements> XML'i; her paragraf karakterin CDATA offsetini belirtir
  let offset = 0;
  let elemXml = "";
  for (const para of paragraphs) {
    const tLen = para.text.length;
    const alignAttr = para.align ? ` Alignment="${para.align}"` : "";
    elemXml += `    <paragraph${alignAttr}>\n`;

    if (!para.runs) {
      elemXml += `      <content startOffset="${offset}" length="${tLen + 1}"/>\n`;
    } else {
      let rOff = offset;
      for (const run of para.runs) {
        if (run.len <= 0) continue;
        const attrs = [run.bold ? 'bold="true"' : null, run.underline ? 'underline="true"' : null].filter(Boolean).join(" ");
        elemXml += `      <content${attrs ? " " + attrs : ""} startOffset="${rOff}" length="${run.len}"/>\n`;
        rOff += run.len;
      }
      const fr = para.runs[0];
      const nlAttrs = [fr?.bold ? 'bold="true"' : null, fr?.underline ? 'underline="true"' : null].filter(Boolean).join(" ");
      elemXml += `      <content${nlAttrs ? " " + nlAttrs : ""} startOffset="${offset + tLen}" length="1"/>\n`;
    }

    elemXml += `    </paragraph>\n`;
    offset += tLen + 1;
  }

  const safeCdata = fullText.replace(/]]>/g, "]]]]><![CDATA[>");

  return `<?xml version="1.0" encoding="UTF-8"?>
<template format_id="1.8">
  <content><![CDATA[${safeCdata}]]></content>
  <properties>
    <pageFormat mediaSizeName="1" leftMargin="42.525000000000006" rightMargin="42.525000000000006" topMargin="42.525000000000006" bottomMargin="42.52500000000006" paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0"/>
  </properties>
  <elements resolver="hvl-default">
${elemXml}  </elements>
  <styles>
    <style name="default" description="Geçerli" family="Lucida Grande" size="13" bold="false" italic="false" FONT_ATTRIBUTE_KEY="com.apple.laf.AquaFonts$DerivedUIResourceFont[family=Lucida Grande,name=Lucida Grande,style=plain,size=13]"/>
    <style name="hvl-default" family="Times New Roman" size="12" description="Gövde"/>
  </styles>
</template>`;
}

// UYAP UDF indirme (JSZip ile ZIP → .udf)
async function downloadAsUdf(dilekceMd, filenameBase, setError) {
  try {
    const xmlContent = buildUdfXml(dilekceMd || "");

    const loaded = await ensureScriptLoaded(
      "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
      "JSZip"
    );
    if (!loaded || !window.JSZip) throw new Error("JSZip kütüphanesi yüklenemedi");

    const zip = new window.JSZip();
    zip.file("content.xml", xmlContent);
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.udf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    setError && setError("UDF dosyası hazırlanırken bir hata oluştu.");
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

function FieldInput({ field, value, onChange, isDarkMode }) {
  const common = `w-full rounded-xl border p-2.5 text-sm outline-none transition-all focus:ring-2 ${isDarkMode ? "border-white/10 bg-[#0D1322] text-slate-200 placeholder:text-slate-600 focus:border-amber-400/40 focus:ring-amber-400/10" : "border-[#E4DAC6] bg-white text-[#1C2A47] placeholder:text-[#A8A08C] focus:border-[#A77B2E] focus:ring-[#A77B2E]/15"}`;
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
  const { isDarkMode, toggleTheme } = useTheme();
  const c = T(isDarkMode);
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

  // --- Editör state ---
  const [editMode, setEditMode] = useState(false);
  const [selectedParaIdx, setSelectedParaIdx] = useState(null);
  const [revisionInstruction, setRevisionInstruction] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [reviseError, setReviseError] = useState("");

const processedMd = useMemo(() => {
    if (!dilekceMd) return "";
    
    // 1. <br> veya <br/> etiketlerini gerçek satır atlamasına (\n) çevir
    let cleaned = dilekceMd.replace(/<br\s*\/?>/gi, "\n");
    
    // 2. Kalan tüm gereksiz HTML etiketlerini (<b>, <center>, <i> vb.) yok et
    cleaned = cleaned.replace(/<[^>]*>?/gm, "");
    
    // 3. Numaralı başlıkları Markdown'da bold yap (Mevcut kodun)
    return cleaned.replace(/^(\d+|[IVX]+)\.\s+([A-ZÇĞİÖŞÜ0-9\s\-\(\)\"\']+)$/gm, "**$1. $2**");
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
      const res = await fetch("/api/dilekce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => undefined);

      if (!res.ok) {
        if (res.status === 402) {
          setLoading(false);
          setStep(1);
          if (confirm("Yetersiz Bakiye! Dilekçe oluşturmak için token satın almak ister misiniz?")) {
            window.location.href = "/paketler-ucretler";
          } else {
            setError("Yetersiz bakiye. İşlem gerçekleştirilemedi.");
          }
          return;
        }
        setLoading(false);
        setStep(1);
        setError(data?.message || "Sunucu tarafında bir hata oluştu.");
        return;
      }

      if (data && (data.dilekce || data.taslak_md)) {
        const finalObj = data.dilekce
          ? data
          : {
              dilekce: { dilekce_md: data.taslak_md || "" },
              kaynaklar: data.kaynaklar,
              girdi_ozeti: data.girdi_ozeti,
            };
        await finalizeResult(finalObj);
      } else {
        throw new Error("Sunucudan beklenen dilekçe formatı alınamadı.");
      }
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
    setEditMode(false);
    setSelectedParaIdx(null);
    setRevisionInstruction("");
    setReviseError("");
  }

  const Stepper = () => {
    const steps = [ { id: 1, label: "Bilgi" }, { id: 2, label: "Oluşturuluyor" }, { id: 3, label: "Sonuç" }, ];
    return (
      <ol className="flex items-center gap-2 md:gap-3">
        {steps.map((s) => {
          const isActive = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span className={["h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                done ? (isDarkMode ? "bg-amber-400 text-[#0A0F1C]" : "bg-[#16223E] text-white")
                : isActive ? (isDarkMode ? "bg-amber-400/20 text-amber-200 ring-2 ring-amber-400/40" : "bg-white text-[#A77B2E] ring-2 ring-[#DCC68C]")
                : (isDarkMode ? "bg-white/5 text-slate-500" : "bg-[#EFE6D4] text-[#8A8270]")].join(" ")}>{done ? "✓" : s.id}</span>
              <span className={`text-xs font-medium hidden sm:inline ${isActive ? c.ink : c.inkMute}`}>{s.label}</span>
              {s.id !== 3 && <span className={`w-6 md:w-12 h-px mx-1 ${isDarkMode ? "bg-white/10" : "bg-[#E4DAC6]"}`} />}
            </li>
          );
        })}
      </ol>
    );
  };

  const LoaderCard = () => (
    <div className={`rounded-2xl border ${c.line} ${c.surface} p-6 animate-pulse`}>
      <div className={`h-5 w-40 rounded mb-4 ${isDarkMode ? "bg-white/10" : "bg-[#E4DAC6]"}`} />
      <div className="space-y-2">
        <div className={`h-4 w-full rounded ${isDarkMode ? "bg-white/5" : "bg-[#ECE3D2]"}`} />
        <div className={`h-4 w-11/12 rounded ${isDarkMode ? "bg-white/5" : "bg-[#ECE3D2]"}`} />
        <div className={`h-4 w-10/12 rounded ${isDarkMode ? "bg-white/5" : "bg-[#ECE3D2]"}`} />
      </div>
    </div>
  );

  const iconPath = "M12 18.75a6 6 0 006-6v-1.5a.75.75 0 011.5 0v1.5a7.5 7.5 0 11-15 0v-1.5a.75.75 0 011.5 0v1.5a6 6 0 006 6zM12 9a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75V11.25a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V9z";

  return (
    <main className={`min-h-screen relative overflow-hidden font-serif transition-colors duration-500 ${c.appBg} ${c.ink} ${isDarkMode ? "selection:bg-amber-400/30 selection:text-amber-100" : "selection:bg-[#1C2A47]/15 selection:text-[#1C2A47]"}`}>
      {CanvasBackground ? <CanvasBackground /> : null}

      <style jsx global>{`
        .paper-grain { background-image: radial-gradient(${isDarkMode ? "rgba(255,255,255,0.015)" : "rgba(28,42,71,0.025)"} 1px, transparent 1px); background-size: 22px 22px; }
      `}</style>
      <div className="fixed inset-0 z-0 pointer-events-none paper-grain"></div>

      <div className="relative z-10 px-3 sm:px-4 lg:px-6 pt-4 pb-10">
        <div className="max-w-6xl mx-auto space-y-6">

          <div className={`rounded-2xl border ${c.line} ${c.surface} shadow-xl ${isDarkMode ? "shadow-black/30" : "shadow-[0_8px_30px_-18px_rgba(28,42,71,0.35)]"} backdrop-blur-sm overflow-hidden`}>
            <header className={`p-6 md:p-8 border-b ${c.lineSoft} ${isDarkMode ? "bg-white/[0.02]" : "bg-[#F6EFE2]"}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className={`block text-[9px] font-serif tracking-[0.22em] uppercase ${c.inkMute} mb-1`}>Hazırlık</span>
                  <h2 className={`text-2xl font-serif font-semibold leading-tight ${c.ink}`}>Dilekçe Oluşturucu</h2>
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                  <div className="w-full md:w-auto"><TokenBalance /></div>
                  <button type="button" onClick={() => { fetchRecentDrafts(); setShowDrafts(true); }} className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${isDarkMode ? "border-white/10 text-slate-300 hover:bg-white/[0.05]" : "border-[#E4DAC6] text-[#5B6478] hover:bg-white"}`} title="Son dilekçelerinizi görüntüleyin">Son Dilekçeleriniz</button>
                  <button onClick={toggleTheme} className={`p-2 rounded-xl border transition-colors ${isDarkMode ? "border-white/10 text-white/70 hover:text-amber-300 hover:bg-white/[0.05]" : "border-[#E4DAC6] text-[#5B6478] hover:text-[#A77B2E] hover:bg-white"}`} title={isDarkMode ? "Açık Mod" : "Koyu Mod"}>
                    {isDarkMode
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                  </button>
                  <Stepper />
                </div>
              </div>
              <p className={`mt-3 text-sm ${c.inkSoft}`}>Önce dava türünü seçin, ardından olay özetinizi ve talebinizi girin. Diğer alanlar seçiminize göre dinamik olarak gelecektir.</p>
            </header>

            <div className={`divide-y ${c.lineSoft}`}>
              {step === 1 && (() => {
                const fieldCls = `w-full rounded-xl border p-2.5 text-sm outline-none transition-all focus:ring-2 ${isDarkMode ? "border-white/10 bg-[#0D1322] text-slate-200 placeholder:text-slate-600 focus:border-amber-400/40 focus:ring-amber-400/10" : "border-[#E4DAC6] bg-white text-[#1C2A47] placeholder:text-[#A8A08C] focus:border-[#A77B2E] focus:ring-[#A77B2E]/15"}`;
                const labelCls = `block text-xs font-semibold tracking-wide mb-1.5 ${c.inkSoft}`;
                return (
                <section className="p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Dava Türü *</label>
                        <select className={fieldCls} value={caseType} onChange={(e) => handleCaseTypeChange(e.target.value)} required>
                          {Object.entries(CASE_TYPES).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}
                        </select>
                        <p className={`text-xs mt-1.5 ${c.inkMute}`}>Örn: Kamulaştırmasız El Atma davası seçildiğinde taşınmaz ada parsel bilgisi gibi alanlar otomatik gelir.</p>
                      </div>
                      <div>
                        <label className={labelCls}>Davacı Adı (isteğe bağlı)</label>
                        <input className={fieldCls} placeholder="Örn. Can Yılmaz" value={davaciAdSoyad} onChange={(e) => setDavaciAdSoyad(e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Talep *</label>
                        <input className={fieldCls} placeholder="Boşanma, 20.000 TL Tazminat..." value={talep} onChange={(e) => setTalep(e.target.value)} required />
                      </div>
                      <div>
                        <label className={labelCls}>Davalı Adı (isteğe bağlı)</label>
                        <input className={fieldCls} placeholder="Örn. Cem Yılmaz" value={davaliAdSoyad} onChange={(e) => setDavaliAdSoyad(e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelCls}>Davaya Sebebiyet Veren Somut Olaylar *</label>
                        <textarea className={fieldCls} rows={4} placeholder="Örn. Müvekkilin kocası müvekkili aldatmıştır..." value={olayOzet} onChange={(e) => setOlayOzet(e.target.value)} required />
                        <div className={`flex justify-between text-xs mt-1.5 ${c.inkMute}`}><span>En az 20 karakter</span>{caseType === "cevap" && (<span className={`ml-2 ${c.gold}`}>(Cevap Dilekçesi modunda zorunlu değil)</span>)}<span>{olayCharCount} karakter</span></div>
                      </div>
                      {activeFields.length > 0 && (
                        <div className="md:col-span-2">
                          <div className={`rounded-xl border ${c.line} ${isDarkMode ? "bg-white/[0.02]" : "bg-[#F6EFE2]"} p-4`}>
                            <h3 className={`font-serif font-semibold mb-3 ${c.ink}`}>{CASE_TYPES[caseType]?.label} — Özel Bilgiler</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              {activeFields.map((f) => (
                                <div key={f.id}>
                                  <label className={labelCls}>{f.label} {f.required ? "*" : ""}</label>
                                  <FieldInput field={f} value={extraValues[f.id] || ""} onChange={handleExtraChange} isDarkMode={isDarkMode} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <label className={labelCls}>Eldeki Deliller (isteğe bağlı) — her satır bir delil</label>
                        <textarea className={fieldCls} rows={2} placeholder={`Tanık Beyanları\nNüfus Kayıtları\nFaturalar`} value={delillerInput} onChange={(e) => setDelillerInput(e.target.value)} />
                      </div>
                    </div>
                    {error && (<div className={`rounded-xl border p-3 text-sm ${isDarkMode ? "border-red-400/40 bg-red-500/10 text-red-300" : "border-red-300 bg-red-50 text-red-700"}`}>{error}</div>)}
                    <div className="flex items-center gap-3">
                      <button type="submit" disabled={loading} className={`rounded-xl px-6 py-2.5 text-sm font-semibold shadow-lg disabled:opacity-50 transition ${isDarkMode ? "bg-amber-400 text-[#0A0F1C] hover:bg-amber-300 shadow-amber-900/30" : "bg-[#16223E] text-white hover:bg-[#1f2f54] shadow-[0_12px_28px_-12px_rgba(28,42,71,0.7)]"}`}>{loading ? "Gönderiliyor..." : "Dilekçe Oluştur"}</button>
                      <button type="button" onClick={resetForm} className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition ${isDarkMode ? "border-white/10 hover:bg-white/[0.05]" : "border-[#E4DAC6] hover:bg-white"}`}>Temizle</button>
                    </div>
                  </form>
                </section>
                );
              })()}

              {step === 2 && (
                <section className="p-6 md:p-8 space-y-6">
                  <div className="space-y-4">
                    <div className={`font-serif italic ${c.inkSoft}`}>Consulto dilekçenizi hazırlıyor…</div>
                    <div className="space-y-2.5">
                      {LOADING_MESSAGES.map((msg, i) => {
                        const done = i < loadStepIdx;
                        const active = i === loadStepIdx;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            {done ? (<span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs ${isDarkMode ? "bg-amber-400/10 border border-amber-400/50 text-amber-300" : "bg-[#F2E7CC] border border-[#DCC68C] text-[#A77B2E]"}`}>✓</span>) : active ? (<span className="inline-flex items-center justify-center h-5 w-5 rounded-full"><span className={`h-4 w-4 rounded-full border-2 animate-spin ${isDarkMode ? "border-amber-400/30 border-t-amber-400" : "border-[#A77B2E]/30 border-t-[#A77B2E]"}`} /></span>) : (<span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs ${isDarkMode ? "bg-white/5 border border-white/10 text-slate-500" : "bg-[#EFE6D4] border border-[#E4DAC6] text-[#8A8270]"}`}>•</span>)}
                            <span className={`text-sm ${active ? c.gold : done ? c.inkSoft : c.inkMute}`}>{msg}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className={`h-1.5 rounded overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-[#E4DAC6]"}`}>
                      <div className={`h-full transition-all duration-500 ${isDarkMode ? "bg-amber-400" : "bg-[#16223E]"}`} style={{ width: `${Math.round(((loadStepIdx + 1) / LOADING_MESSAGES.length) * 100)}%` }} />
                    </div>
                  </div>
                  <LoaderCard /><LoaderCard />
                </section>
              )}

              {step === 3 && (
                <section className="p-6 md:p-8 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-serif tracking-wider ${isDarkMode ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : "border-[#DCC68C] bg-[#F2E7CC] text-[#A77B2E]"}`}>✓ HAZIR</span>
                      <h2 className={`text-xl font-serif font-semibold ${c.ink}`}>Taslak Dilekçe</h2>
                      {saving && <span className={`text-xs ml-1 ${c.inkMute}`}>kaydediliyor…</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={handleCopy} className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${isDarkMode ? "border-white/10 hover:bg-white/[0.05]" : "border-[#E4DAC6] hover:bg-white"}`} title="Markdown'ı panoya kopyala">{copied ? "Kopyalandı ✓" : "Kopyala"}</button>
                      <button
                        onClick={() => { setEditMode(m => !m); setSelectedParaIdx(null); setReviseError(""); }}
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                          editMode
                            ? (isDarkMode ? "border-amber-400/50 bg-amber-400/10 text-amber-300" : "border-[#A77B2E] bg-[#F2E7CC] text-[#A77B2E]")
                            : (isDarkMode ? "border-white/10 hover:bg-white/[0.05]" : "border-[#E4DAC6] hover:bg-white")
                        }`}
                        title={editMode ? "Görüntüleme moduna geç" : "Düzenleme moduna geç"}
                      >{editMode ? "Görüntüle" : "Düzenle"}</button>
                      <button onClick={() => downloadAsDocxFromPreviewNode(dilekcePreviewRef.current, "dilekce_taslak", setError, dilekceMd)} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${isDarkMode ? "bg-[#1f2f54] hover:bg-[#2a3d6b]" : "bg-[#16223E] hover:bg-[#1f2f54]"}`} title="Word (.docx) olarak indir">Word (.docx)</button>
                      <button onClick={() => downloadAsPdfFromPreviewNode(dilekcePreviewRef.current, "dilekce_taslak", setError, dilekceMd)} className="rounded-xl bg-[#8B2E3C] text-white px-4 py-2 hover:bg-[#a23647] transition text-sm font-semibold" title="PDF olarak indir">PDF</button>
                      <button onClick={() => downloadAsUdf(dilekceMd, "dilekce_taslak", setError)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${isDarkMode ? "bg-emerald-700 hover:bg-emerald-600 text-white" : "bg-[#1A5C3A] hover:bg-[#236b44] text-white"}`} title="UYAP UDF olarak indir">UYAP (.udf)</button>
                    </div>
                  </div>
                  {error && (<div className={`w-full mt-2 rounded-xl border p-2 text-xs ${isDarkMode ? "border-red-400/40 bg-red-500/10 text-red-300" : "border-red-300 bg-red-50 text-red-700"}`}>{error}</div>)}

                  <div className={`flex items-center gap-1 border-b overflow-x-auto ${c.lineSoft}`}>
                    {[ { key: "dilekce", label: "Dilekçe Metni" }, { key: "kaynaklar", label: "Yararlanılan Kaynaklar" }, { key: "girdi", label: "Girdi Özeti" }, { key: "dikkat", label: "Davada Dikkat" }, ].map((t) => (
                      <button key={t.key} onClick={() => setActiveTab(t.key)} className={["px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors", activeTab === t.key ? (isDarkMode ? "border-b-2 border-amber-400 text-amber-300" : "border-b-2 border-[#A77B2E] text-[#16223E]") : `${c.inkMute} hover:${isDarkMode ? "text-slate-300" : "text-[#1C2A47]"}`].join(" ")}>{t.label}</button>
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
                            {isEmpty ? ( <div className={`rounded-xl border ${c.line} p-4 text-sm ${c.inkMute}`}>Bu bölüm için özetlenmiş bir içerik oluşturulamadı.</div> ) : (
                              <div className="grid md:grid-cols-3 gap-4">
                                <div className={`rounded-xl border p-4 ${isDarkMode ? "border-amber-500/40 bg-amber-500/5" : "border-amber-300 bg-amber-50"}`}>
                                  <div className="flex items-center justify-between mb-2"><h3 className={`font-serif font-semibold ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>Olası Riskler</h3><span className={`text-xs px-2 py-0.5 rounded-full border ${isDarkMode ? "bg-amber-500/10 border-amber-500/40 text-amber-300" : "bg-amber-100 border-amber-300 text-amber-800"}`}>{riskler.length}</span></div>
                                  {riskler.length ? (<ul className="list-disc pl-5 space-y-1 text-sm">{riskler.map((it, idx) => (<li key={idx} className={isDarkMode ? "text-amber-100/90" : "text-amber-900"}>{it}</li>))}</ul>) : (<p className={`text-sm ${c.inkMute}`}>Herhangi bir risk öne çıkmadı.</p>)}
                                </div>
                                <div className={`rounded-xl border p-4 ${isDarkMode ? "border-sky-500/40 bg-sky-500/5" : "border-sky-300 bg-sky-50"}`}>
                                  <div className="flex items-center justify-between mb-2"><h3 className={`font-serif font-semibold ${isDarkMode ? "text-sky-300" : "text-sky-800"}`}>Muhtemel Karşı İddialar</h3><span className={`text-xs px-2 py-0.5 rounded-full border ${isDarkMode ? "bg-sky-500/10 border-sky-500/40 text-sky-300" : "bg-sky-100 border-sky-300 text-sky-800"}`}>{karsi.length}</span></div>
                                  {karsi.length ? (<ul className="list-disc pl-5 space-y-1 text-sm">{karsi.map((it, idx) => (<li key={idx} className={isDarkMode ? "text-sky-100/90" : "text-sky-900"}>{it}</li>))}</ul>) : (<p className={`text-sm ${c.inkMute}`}>Öne çıkan bir karşı iddia listelenmedi.</p>)}
                                </div>
                                <div className={`rounded-xl border p-4 ${isDarkMode ? "border-emerald-500/40 bg-emerald-500/5" : "border-emerald-300 bg-emerald-50"}`}>
                                  <div className="flex items-center justify-between mb-2"><h3 className={`font-serif font-semibold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>Mutlaka Sunulması Gereken Deliller</h3><span className={`text-xs px-2 py-0.5 rounded-full border ${isDarkMode ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300" : "bg-emerald-100 border-emerald-300 text-emerald-800"}`}>{deliller.length}</span></div>
                                  {deliller.length ? (<ul className="list-disc pl-5 space-y-1 text-sm">{deliller.map((it, idx) => (<li key={idx} className={isDarkMode ? "text-emerald-100/90" : "text-emerald-900"}>{it}</li>))}</ul>) : (<p className={`text-sm ${c.inkMute}`}>Bu dava için kritik delil önerisi bulunamadı.</p>)}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {activeTab === "dilekce" && (
                    <div className={`rounded-2xl p-3 md:p-6 relative ${isDarkMode ? "bg-white/[0.02] border border-white/10" : "bg-[#EDE5D5]"}`}>
                      {editMode ? (
                        /* --- DÜZENLEME MODU: Ham metin textarea --- */
                        <div className="max-w-3xl mx-auto">
                          <p className={`text-xs mb-2 font-medium ${c.inkMute}`}>Dilekçe metnini doğrudan düzenleyebilirsiniz. Değişiklikler otomatik kaydedilir.</p>
                          <textarea
                            className={`w-full min-h-[580px] rounded-lg border p-5 text-sm font-serif leading-relaxed resize-y outline-none focus:ring-2 transition-all ${
                              isDarkMode
                                ? "border-white/10 bg-[#0D1322] text-slate-200 focus:border-amber-400/40 focus:ring-amber-400/10"
                                : "border-[#E4DAC6] bg-white text-[#15233B] focus:border-[#A77B2E] focus:ring-[#A77B2E]/15"
                            }`}
                            value={dilekceMd}
                            onChange={(e) => { setDilekceMd(e.target.value); setSelectedParaIdx(null); }}
                            spellCheck={false}
                          />
                        </div>
                      ) : (
                        /* --- GÖRÜNTÜLEME MODU: Seçilebilir paragraflar --- */
                        <>
                          {selectedParaIdx !== null && (
                            <div className={`mb-3 max-w-3xl mx-auto rounded-xl border p-3 flex items-start gap-3 ${isDarkMode ? "border-amber-400/30 bg-amber-400/5" : "border-[#DCC68C] bg-[#FBF3E0]"}`}>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-semibold mb-1.5 ${c.gold}`}>Seçili bölümü revize et</p>
                                <textarea
                                  className={`w-full rounded-lg border p-2 text-xs outline-none resize-none focus:ring-1 transition-all ${
                                    isDarkMode
                                      ? "border-white/10 bg-[#0D1322] text-slate-200 placeholder:text-slate-600 focus:border-amber-400/40 focus:ring-amber-400/20"
                                      : "border-[#E4DAC6] bg-white text-[#1C2A47] placeholder:text-[#A8A08C] focus:border-[#A77B2E] focus:ring-[#A77B2E]/20"
                                  }`}
                                  rows={2}
                                  placeholder="Revizyon talimatı: 'Daha resmi yaz', 'Madde ekle', 'Bu kısmı sil'..."
                                  value={revisionInstruction}
                                  onChange={(e) => setRevisionInstruction(e.target.value)}
                                />
                                {reviseError && <p className="mt-1 text-[10px] text-red-500">{reviseError}</p>}
                              </div>
                              <div className="flex flex-col gap-1.5 shrink-0">
                                <button
                                  onClick={async () => {
                                    const paras = dilekceMd.split(/\n{2,}/).filter(p => p.trim());
                                    const selectedText = paras[selectedParaIdx];
                                    if (!selectedText) return;
                                    setIsRevising(true);
                                    setReviseError("");
                                    try {
                                      const res = await fetch("/api/dilekce/revize", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ selected_text: selectedText, instruction: revisionInstruction }),
                                      });
                                      const data = await res.json().catch(() => ({}));
                                      if (!res.ok) { setReviseError(data?.error || "Revizyon başarısız."); return; }
                                      const revisedText = data.revised_text || "";
                                      if (!revisedText) { setReviseError("AI boş yanıt döndürdü."); return; }
                                      setDilekceMd(prev => {
                                        const parts = prev.split(/\n{2,}/);
                                        let ni = 0;
                                        for (let i = 0; i < parts.length; i++) {
                                          if (parts[i].trim()) {
                                            if (ni === selectedParaIdx) parts[i] = revisedText;
                                            ni++;
                                          }
                                        }
                                        return parts.join("\n\n");
                                      });
                                      setSelectedParaIdx(null);
                                      setRevisionInstruction("");
                                    } catch (e) {
                                      setReviseError("Bir hata oluştu.");
                                    } finally {
                                      setIsRevising(false);
                                    }
                                  }}
                                  disabled={isRevising}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${isDarkMode ? "bg-amber-400 text-[#0A0F1C] hover:bg-amber-300" : "bg-[#16223E] text-white hover:bg-[#1f2f54]"}`}
                                >{isRevising ? "Revize ediliyor…" : "Revize Et"}</button>
                                <button
                                  onClick={() => { setSelectedParaIdx(null); setRevisionInstruction(""); setReviseError(""); }}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${isDarkMode ? "border-white/10 hover:bg-white/[0.05]" : "border-[#E4DAC6] hover:bg-white"}`}
                                >İptal</button>
                              </div>
                            </div>
                          )}

                          {/* Beyaz kağıt yüzeyi */}
                          <div
                            ref={dilekcePreviewRef}
                            className="max-w-3xl mx-auto bg-[#FCFAF4] text-[#15233B] rounded-lg shadow-[0_12px_40px_-16px_rgba(28,42,71,0.45)] ring-1 ring-[#E4DAC6] px-7 py-10 md:px-14 md:py-16 text-[15px] leading-[1.7]"
                            style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
                          >
                            {(() => {
                              const paras = dilekceMd ? dilekceMd.split(/\n{2,}/) : [];
                              if (!paras.length) return renderDilekce("_Dilekçe metni yok._");
                              let nonEmptyIdx = 0;
                              return paras.map((para, i) => {
                                const isEmpty = !para.trim();
                                const paraIdx = isEmpty ? null : nonEmptyIdx++;
                                const isSelected = paraIdx !== null && paraIdx === selectedParaIdx;
                                return (
                                  <div
                                    key={i}
                                    onClick={() => {
                                      if (isEmpty) return;
                                      setSelectedParaIdx(prev => prev === paraIdx ? null : paraIdx);
                                      setRevisionInstruction("");
                                      setReviseError("");
                                    }}
                                    className={`transition-all rounded ${
                                      isEmpty ? "" :
                                      isSelected
                                        ? "ring-2 ring-[#A77B2E] bg-[#FBF3E0] cursor-pointer px-1 -mx-1"
                                        : "cursor-pointer hover:bg-[#F5EFE3] px-1 -mx-1"
                                    }`}
                                    title={isEmpty ? "" : "Tıklayarak bu bölümü seçin ve revize edin"}
                                  >
                                    {renderDilekce(para)}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                          {dilekceMd && (
                            <p className={`text-center text-[10px] mt-3 ${c.inkMute}`}>
                              Bir bölüme tıklayarak seçin, ardından revize talimatınızı yazın.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === "kaynaklar" && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className={`rounded-xl border ${c.line} ${c.surfaceAlt} p-4`}>
                        <h3 className={`font-serif font-semibold mb-3 ${c.ink}`}>Dayanaklar (Kanun Maddeleri)</h3>
                        {parsedDayanaklar && parsedDayanaklar.length ? (
                          <div className="flex flex-col gap-2">
                            {parsedDayanaklar.map((d, i) => {
                              const hasStruct = d.kanun && d.madde;
                              if (!hasStruct) return <div key={i} className={`text-sm ${c.inkSoft}`}>• {d.display}</div>;
                              const slug = slugifyMevzuatAdi(d.kanun);
                              const href = slug ? `/mevzuat/${encodeURIComponent(slug)}${maddeAnchor(d.madde)}` : "";
                              const popKey = `${slug || "mevzuat"}::${d.madde}`;
                              const preview = getMevzuatPreview({ mevzuat_adi: d.kanun, madde: d.madde }, maddeCache);
                              return (
                                <div key={i} className="w-full space-y-1" data-mevzuat-popover="1">
                                  <div className="flex items-stretch gap-2">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); const el = e.currentTarget; const pos = calcMevzuatPopover(el); setOpenMevzuat(prev => (prev?.key === popKey ? null : { key: popKey, el, ...pos })); }} aria-expanded={openMevzuat?.key === popKey} className={`inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-serif font-semibold rounded-lg whitespace-nowrap leading-none transition-colors focus:outline-none focus:ring-2 ${isDarkMode ? "bg-amber-400/15 text-amber-200 hover:bg-amber-400/25 focus:ring-amber-300/30" : "bg-[#16223E] text-white hover:bg-[#1f2f54] focus:ring-[#A77B2E]/30"}`}><span>m.</span><span className="tabular-nums">{d.madde}</span></button>
                                    <div className="relative flex-1">
                                      {href ? (<a className={`flex-1 inline-flex items-center px-3 py-2 rounded-lg text-[11px] font-medium leading-tight min-h-[32px] transition-colors ${isDarkMode ? "bg-white/5 text-slate-300 hover:text-amber-300 hover:bg-white/10" : "bg-[#F6EFE2] text-[#5B6478] hover:text-[#A77B2E] hover:bg-[#EFE6D4]"}`} href={href} target="_blank" rel="noreferrer" onClick={(e)=>e.stopPropagation()} title="Tam mevzuat sayfasına git">{d.kanun}</a>) : (<span className={`flex-1 inline-flex items-center px-3 py-2 rounded-lg text-[11px] font-medium leading-tight min-h-[32px] ${isDarkMode ? "bg-white/5 text-slate-300" : "bg-[#F6EFE2] text-[#5B6478]"}`}>{d.kanun}</span>)}
                                      {openMevzuat?.key === popKey && (
                                        <div data-mevzuat-popover="1" role="dialog" aria-modal="true" onClick={(e)=>e.stopPropagation()} className={`fixed z-[999] w-[42rem] max-w-[92vw] max-h-[70vh] overflow-auto rounded-xl border p-4 text-[12px] transition-transform duration-150 ease-out will-change-transform ${isDarkMode ? "border-white/10 bg-[#0D1322]/95 backdrop-blur-md shadow-[0_24px_60px_rgba(0,0,0,0.6)] ring-1 ring-amber-400/25 text-slate-100" : "border-[#E4DAC6] bg-white shadow-[0_24px_60px_-20px_rgba(28,42,71,0.45)] ring-1 ring-[#DCC68C] text-[#1C2A47]"} ` + (openMevzuat?.placement === 'left' ? "-translate-x-full -translate-y-1/2" : openMevzuat?.placement === 'right' ? "-translate-y-1/2" : openMevzuat?.placement === 'bottom' ? "-translate-x-1/2" : "-translate-x-1/2 -translate-y-full")} style={{ top: openMevzuat.top, left: openMevzuat.left }}>
                                          <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent to-transparent ${isDarkMode ? "via-amber-400/30" : "via-[#A77B2E]/40"}`}></div>
                                          <div className="flex items-center justify-between gap-2 mb-2"><div><div className="font-serif font-semibold">{d.kanun}</div><div className={`text-xs mt-0.5 font-serif ${c.inkSoft}`}>m. {d.madde}</div></div><button type="button" onClick={() => setOpenMevzuat(null)} className={`shrink-0 w-8 h-8 grid place-items-center rounded-md focus:outline-none focus:ring-2 ${isDarkMode ? "bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white ring-1 ring-white/15 focus:ring-amber-400/40" : "bg-[#F6EFE2] text-[#5B6478] hover:bg-[#EFE6D4] hover:text-[#1C2A47] ring-1 ring-[#E4DAC6] focus:ring-[#A77B2E]/40"}`} aria-label="Kapat"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>
                                          <div className="leading-snug whitespace-pre-wrap break-words">{preview || "Madde metni getirilemedi."}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (<ul className={`list-disc pl-5 space-y-1 text-sm ${c.inkSoft}`}><li className={c.inkMute}>Belirtilmedi</li></ul>)}
                      </div>
                      <div className={`rounded-xl border ${c.line} ${c.surfaceAlt} p-4`}>
                        <h3 className={`font-serif font-semibold mb-3 ${c.ink}`}>Yargıtay Kararları</h3>
                        <ul className={`list-disc pl-5 space-y-1 text-sm ${c.inkSoft}`}>
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
                            if (!list.length) return <li className={c.inkMute}>Belirtilmedi</li>;
                            return list.map((r, i) => {
                              const hasSlug = r.slug && looksLikeSlug(r.slug);
                              const content = (<>{r.court ? <span>{r.court}</span> : null}{r.court && (r.code || r.slug) ? <span className={`mx-1 ${c.inkMute}`}>·</span> : null}{r.code ? <span className="tabular-nums">{r.code}</span> : (r.slug || "")}</>);
                              if (hasSlug) { return (<li key={i}><Link href={`/kararlar/${encodeURIComponent(r.slug)}`} target="_blank" rel="noopener noreferrer" className={`hover:underline ${isDarkMode ? "text-amber-400" : "text-[#A77B2E]"}`}>{content}</Link></li>); }
                              return <li key={i}>{content}</li>;
                            });
                          })()}
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === "girdi" && (() => {
                    const k = c.inkMute; const v = c.ink;
                    return (
                    <div className={`rounded-xl border ${c.line} ${c.surfaceAlt} p-5 text-sm space-y-2.5`}>
                      <div><span className={k}>Dava Türü:</span> <span className={v}>{CASE_TYPES[caseType]?.label || "(belirtilmedi)"}</span></div>
                      <div><span className={k}>Olay Özeti:</span> <span className={v}>{result?.girdi_ozeti?.olay_ozet || olayOzet}</span></div>
                      <div><span className={k}>Talep:</span> <span className={v}>{result?.girdi_ozeti?.talep || talep}</span></div>
                      <div><span className={k}>Davacı:</span> <span className={v}>{result?.girdi_ozeti?.davaci?.ad_soyad || davaciAdSoyad || "(belirtilmedi)"}</span></div>
                      {activeFields.length > 0 && (<div><span className={k}>Özel Bilgiler:</span> <span className={v}>{Object.keys(extraValues).length ? activeFields.map((f) => `${f.label}: ${extraValues[f.id] || "-"}`).join(" • ") : "(belirtilmedi)"}</span></div>)}
                      <div><span className={k}>Deliller:</span> <span className={v}>{Array.isArray(result?.girdi_ozeti?.eldeki_deliller) && result.girdi_ozeti.eldeki_deliller.length ? result.girdi_ozeti.eldeki_deliller.join(", ") : deliller.length ? deliller.join(", ") : "(belirtilmedi)"}</span></div>
                    </div>
                    );
                  })()}

                  <div className="flex items-center gap-3">
                    <button type="button" onClick={resetForm} className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition ${isDarkMode ? "border-white/10 hover:bg-white/[0.05]" : "border-[#E4DAC6] hover:bg-white"}`}>Yeni Dilekçe</button>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDrafts(false)} />
          <div className={`relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${c.line} ${isDarkMode ? "bg-[#0A0F1C]" : "bg-[#F3EDE1]"} animate-in fade-in zoom-in-95 duration-200`}>

            {/* Başlık */}
            <div className={`flex-none flex items-center justify-between gap-3 px-5 py-4 border-b ${c.lineSoft} ${isDarkMode ? "bg-white/[0.02]" : "bg-[#F6EFE2]"}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${isDarkMode ? "bg-amber-400/10 text-amber-300 border-amber-400/20" : "bg-[#F2E7CC] text-[#A77B2E] border-[#DCC68C]"}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div className="min-w-0">
                  <h3 className={`text-sm font-serif font-semibold leading-tight ${c.ink}`}>Son Dilekçeleriniz</h3>
                  <span className={`text-[10px] font-serif tracking-[0.18em] ${c.inkMute}`}>{Array.isArray(recentDrafts) ? recentDrafts.length : 0} KAYIT</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => fetchRecentDrafts()} title="Yenile" className={`p-2 rounded-lg border transition ${isDarkMode ? "border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05]" : "border-[#E4DAC6] text-[#5B6478] hover:text-[#1C2A47] hover:bg-white"}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button onClick={() => setShowDrafts(false)} title="Kapat" className={`p-2 rounded-lg border transition ${isDarkMode ? "border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05]" : "border-[#E4DAC6] text-[#5B6478] hover:text-[#1C2A47] hover:bg-white"}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="flex-1 overflow-y-auto p-4">
              {Array.isArray(recentDrafts) && recentDrafts.length ? (
                <div className="space-y-2.5">
                  {recentDrafts.map((d) => {
                    const created = d.createdAt || d.created_at;
                    const when = created ? new Date(created).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
                    const label = d.dava_turu ? (CASE_TYPES[d.dava_turu]?.label || d.dava_turu) : "Taslak";
                    const loadable = !!d?.dilekce_md;
                    return (
                      <div
                        key={d.id}
                        onClick={() => { if (loadable) { loadDraft(d); setShowDrafts(false); } }}
                        className={`group rounded-xl border p-4 transition-all ${loadable ? "cursor-pointer" : "opacity-60"} ${isDarkMode ? "border-white/10 bg-white/[0.02] hover:border-amber-400/30 hover:bg-white/[0.04]" : "border-[#E4DAC6] bg-white hover:border-[#DCC68C] hover:shadow-[0_8px_20px_-12px_rgba(28,42,71,0.4)]"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-serif tracking-wide mb-2 border ${c.goldBg} ${c.goldBorder} ${c.gold}`}>{label}</span>
                            {d.olay_ozet && <p className={`text-xs leading-relaxed line-clamp-2 ${c.inkSoft}`}>{d.olay_ozet}</p>}
                            {when && <div className={`mt-2 text-[10px] font-serif ${c.inkMute}`}>{when}</div>}
                          </div>
                          {loadable && (
                            <span className={`shrink-0 self-center transition-transform group-hover:translate-x-0.5 ${c.gold}`}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center text-center h-full min-h-[320px] gap-3 ${c.inkMute}`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${c.line} ${c.surfaceAlt}`}>
                    <svg className="w-7 h-7 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <p className={`text-sm font-serif italic ${c.inkSoft}`}>Henüz kayıtlı dilekçe yok</p>
                  <p className="text-xs max-w-[230px]">Oluşturduğunuz dilekçeler otomatik kaydedilir ve burada listelenir.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}