"use client";

import { useState, useRef, useEffect } from "react";

// ── Helpers ───────────────────────────────────────────────────

// Markdown sembollerini soyarak düz, okunabilir metin üret (edit modu için)
function stripMarkdown(md = "") {
  return String(md)
    .replace(/^#{1,6}\s*/gm, "")           // ### Başlık → Başlık
    .replace(/\*\*([^*]+)\*\*/g, "$1")     // **bold** → bold
    .replace(/\*([^*]+)\*/g, "$1")         // *italic* → italic
    .replace(/^[-*_]{3,}$/gm, "────────────────────────")
    .trim();
}

// ── Download helpers ──────────────────────────────────────────

function escHtml(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function processInlineHtml(s) {
  return String(s || "")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function stripMdInline(s = "") {
  return String(s)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/^\s*#{1,6}\s*/, "")
    .replace(/^\s*>+\s?/, "")
    .replace(/[\*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function legalLabelRegex() {
  return /^(DAVACILAR|DAVALILAR|DAVACI|DAVALI|VEK[İI]LLER[İI]|VEK[İI]L[İI]|ADRES|DAVA DEĞER[İI]|KONU|AÇIKLAMALAR)(?:\s*:\s*(.*)|\s*)$/i;
}

function normalizeLegalLabel(label = "") {
  return String(label).toLocaleUpperCase("tr");
}

function isPartySection(section = "") {
  return /^(DAVACI|DAVACILAR|DAVALI|DAVALILAR|VEK[İI]L[İI]|VEK[İI]LLER[İI])$/i.test(section);
}

function unwrapOuterBrackets(s = "") {
  return String(s).trim().replace(/^\[([\s\S]*)\]$/, "$1").trim();
}

function isCourtHeading(plain = "") {
  return /MAHKEMES[İI]NE$/i.test(unwrapOuterBrackets(plain));
}

function isHorizontalRuleLine(s = "") {
  return /^[-*_]{3,}$/.test(String(s).trim());
}

function isSignatureLine(plain = "") {
  const normalized = unwrapOuterBrackets(plain).replace(/\s+/g, " ").toLocaleLowerCase("tr");
  return normalized === "davacı vekili"
    || normalized === "davalı vekili"
    || /^av\.\s/.test(normalized)
    || /e-?imza/.test(normalized)
    || normalized === "imza";
}

function isSignatureContinuation(plain = "") {
  const normalized = unwrapOuterBrackets(plain).replace(/\s+/g, " ").toLocaleLowerCase("tr");
  return normalized === "imza"
    || /^avukat/.test(normalized)
    || /^av\.\s/.test(normalized)
    || /adı soyadı/.test(normalized)
    || /e-?imza/.test(normalized);
}

function buildDownloadHtml(mdText, title = "Dilekçe") {
  const SECTION_HEADS = new Set([
    "HUKUKİ NEDENLER","HUKUKİ NEDEN","HUKUKİ SEBEP","HUKUKİ SEBEPLER",
    "HUKUKİ DELİLLER","DELİLLER","SONUÇ VE İSTEM","EKLER",
  ]);

  let bodyHtml = "";
  let currentSection = null;
  let konuYakalandi = false;
  let signatureBlockOpen = false;

  for (const rawLine of (mdText || "").split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed) { bodyHtml += '<div style="height:6px"></div>'; continue; }
    if (isHorizontalRuleLine(trimmed)) continue;

    const isQuote = /^>+\s?/.test(trimmed);
    const plain = stripMdInline(trimmed);
    if (!plain) continue;

    if (isCourtHeading(plain)) {
      signatureBlockOpen = false;
      bodyHtml += `<p style="text-align:center;font-weight:700;text-transform:uppercase;margin:20px 0 18px;">${escHtml(plain)}</p>`;
      continue;
    }

    const normalized = plain.replace(/\s*:\s*$/, "").toLocaleUpperCase("tr");
    if (SECTION_HEADS.has(normalized)) {
      currentSection = normalized;
      signatureBlockOpen = false;
      bodyHtml += `<p style="font-weight:700;text-decoration:underline;text-transform:uppercase;margin:16px 0 7px;">${escHtml(normalized)}:</p>`;
      continue;
    }

    const labelMatch = plain.match(legalLabelRegex());
    if (labelMatch) {
      const label = normalizeLegalLabel(labelMatch[1]);
      const value = (labelMatch[2] || "").trim();
      currentSection = label;
      signatureBlockOpen = false;

      if (label === "KONU") {
        if (konuYakalandi) { bodyHtml += `<p style="margin:0 0 0.45em;">${escHtml(plain)}</p>`; continue; }
        konuYakalandi = true;
      }

      if (label === "AÇIKLAMALAR" && !value) {
        bodyHtml += `<p style="font-weight:700;text-decoration:underline;text-transform:uppercase;margin:16px 0 7px;">AÇIKLAMALAR:</p>`;
        continue;
      }

      bodyHtml += `<div style="page-break-inside:avoid;break-inside:avoid;"><table style="width:100%;border-collapse:collapse;margin:3px 0;">
        <tr><td style="font-weight:700;width:180px;min-width:180px;vertical-align:top;padding-right:8px;">${escHtml(label)}:</td>
        <td style="vertical-align:top;">${processInlineHtml(escHtml(value))}</td></tr></table></div>`;
      continue;
    }

    const partyListMatch = plain.match(/^([0-9]+)[-.)]\s+(.+)$/);
    if (partyListMatch && isPartySection(currentSection)) {
      bodyHtml += `<div style="page-break-inside:avoid;break-inside:avoid;"><table style="width:100%;border-collapse:collapse;margin:1px 0;">
        <tr><td style="width:188px;min-width:188px;"></td><td>${escHtml(plain)}</td></tr></table></div>`;
      continue;
    }

    if (isPartySection(currentSection)) {
      bodyHtml += `<div style="page-break-inside:avoid;break-inside:avoid;"><table style="width:100%;border-collapse:collapse;margin:1px 0;">
        <tr><td style="width:188px;min-width:188px;"></td><td>${processInlineHtml(escHtml(plain))}</td></tr></table></div>`;
      continue;
    }

    if (currentSection === "AÇIKLAMALAR" || SECTION_HEADS.has(currentSection || "")) {
      if (isQuote) {
        bodyHtml += `<p style="border-left:3px solid #888;padding-left:12px;margin:6px 0;font-style:italic;">${escHtml(plain)}</p>`;
        continue;
      }
      const numMatch = plain.match(/^([0-9]+|[IVXLC]+)[-.]\s+(.+)$/);
      if (numMatch && currentSection === "AÇIKLAMALAR") {
        const head = numMatch[2];
        if (plain.length <= 100 && head.trim().split(/\s+/).length <= 14 && !/[.!?]/.test(head.replace(/\.\.\.$/, ""))) {
          bodyHtml += `<p style="font-weight:700;margin:10px 0;">${escHtml(plain)}</p>`;
          continue;
        }
      }
    }

    const isSignature = isSignatureLine(plain);
    if (isSignature) signatureBlockOpen = true;
    const alignAsSignature = isSignature || (signatureBlockOpen && isSignatureContinuation(plain));
    bodyHtml += alignAsSignature
      ? `<div style="page-break-inside:avoid;break-inside:avoid;"><p style="text-align:right;font-weight:${isSignature ? 700 : 500};margin:0 0 0.45em;">${escHtml(plain)}</p></div>`
      : `<div style="page-break-inside:avoid;break-inside:avoid;"><p style="margin:0 0 0.45em;">${processInlineHtml(escHtml(trimmed))}</p></div>`;
  }

  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${escHtml(title)}</title>
<style>
  *{box-sizing:border-box;}
  body{font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:1.75;color:#000;background:#fff;margin:0;padding:0;}
  p{page-break-inside:avoid;break-inside:avoid;orphans:3;widows:3;}
  table{border-collapse:collapse;page-break-inside:avoid;break-inside:avoid;width:100%;}
  strong{font-weight:700;}
</style></head><body style="padding:2.5cm;">${bodyHtml}</body></html>`;
}

function petitionToFullHtml(text, title = "Dilekçe") {
  return buildDownloadHtml(text, title);
}

function buildUdfXml(mdText) {
  const SECTION_HEADS = new Set([
    "HUKUKİ NEDENLER","HUKUKİ NEDEN","HUKUKİ SEBEP","HUKUKİ SEBEPLER",
    "HUKUKİ DELİLLER","DELİLLER","SONUÇ VE İSTEM","EKLER",
  ]);

  // paragraphs: { text, align: "1"|"2"|"3"|null, runs: [{len,bold,underline}]|null }
  const paragraphs = [];
  let currentSection = null;
  let konuYakalandi = false;
  let signatureBlockOpen = false;

  for (const rawLine of (mdText || "").split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed) { paragraphs.push({ text: "", align: null, runs: null }); continue; }
    if (isHorizontalRuleLine(trimmed)) continue;
    const isQuote = /^>+\s?/.test(trimmed);
    const plain = stripMdInline(trimmed);
    if (!plain) { paragraphs.push({ text: "", align: null, runs: null }); continue; }

    if (isCourtHeading(plain)) {
      const t = plain.toUpperCase();
      signatureBlockOpen = false;
      paragraphs.push({ text: t, align: "1", runs: [{ len: t.length, bold: true, underline: false }] });
      continue;
    }

    const normalized = plain.replace(/\s*:\s*$/, "").toUpperCase();
    if (SECTION_HEADS.has(normalized)) {
      currentSection = normalized;
      signatureBlockOpen = false;
      const t = normalized + (normalized.length <= 8 ? "\t\t:" : "\t:");
      paragraphs.push({ text: t, align: null, runs: [{ len: t.length, bold: true, underline: true }] });
      continue;
    }

    const labelMatch = plain.match(legalLabelRegex());
    if (labelMatch) {
      const label = normalizeLegalLabel(labelMatch[1]);
      const value = (labelMatch[2] || "").trim();
      currentSection = label;
      signatureBlockOpen = false;
      if (label === "KONU" && konuYakalandi) { paragraphs.push({ text: "\t" + plain, align: "3", runs: null }); continue; }
      if (label === "KONU") konuYakalandi = true;
      if (label === "AÇIKLAMALAR" && !value) {
        const t = "AÇIKLAMALAR\t:";
        paragraphs.push({ text: t, align: null, runs: [{ len: t.length, bold: true, underline: true }] });
        continue;
      }
      const tabs = label.length <= 8 ? "\t\t" : "\t";
      const prefix = label + tabs + ":";
      const suffix = value ? " " + value : "";
      paragraphs.push({ text: prefix + suffix, align: null, runs: [
        { len: prefix.length, bold: true, underline: true },
        { len: suffix.length, bold: false, underline: false },
      ]});
      continue;
    }

    if (isSignatureLine(plain)) {
      signatureBlockOpen = true;
      paragraphs.push({ text: plain, align: "2", runs: [{ len: plain.length, bold: true, underline: false }] });
      continue;
    }

    if (signatureBlockOpen && isSignatureContinuation(plain)) {
      paragraphs.push({ text: plain, align: "2", runs: null });
      continue;
    }

    if (isPartySection(currentSection || "")) {
      paragraphs.push({ text: "\t\t  " + plain, align: null, runs: null }); continue;
    }

    if (currentSection === "DELİLLER") {
      paragraphs.push({ text: "\t" + plain, align: null, runs: null });
      continue;
    }

    if (currentSection === "AÇIKLAMALAR" || SECTION_HEADS.has(currentSection || "")) {
      if (isQuote) { paragraphs.push({ text: plain, align: "3", runs: null }); continue; }
      const numMatch = plain.match(/^([0-9]+|[IVXLC]+)[-.]\s+(.+)$/);
      if (numMatch && currentSection === "AÇIKLAMALAR") {
        const head = numMatch[2];
        if (plain.length <= 100 && head.split(/\s+/).length <= 14) {
          paragraphs.push({ text: plain, align: null, runs: [{ len: plain.length, bold: true, underline: false }] }); continue;
        }
      }
      paragraphs.push({ text: "\t" + plain, align: "3", runs: null }); continue;
    }

    paragraphs.push({ text: plain, align: null, runs: null });
  }

  const fullText = paragraphs.map(p => p.text).join("\n") + "\n";
  let offset = 0, elemXml = "";

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
      elemXml += `      <content startOffset="${offset + tLen}" length="1"/>\n`;
    }
    elemXml += `    </paragraph>\n`;
    offset += tLen + 1;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<template format_id="1.8">
  <content><![CDATA[${fullText.replace(/]]>/g, "]]]]><![CDATA[>")}]]></content>
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

function triggerDl(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

async function ensureScript(src, gv) {
  if (typeof window === "undefined") return null;
  if (gv && window[gv]) return window[gv];
  return new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = src; s.async = true;
    s.onload = () => res(gv ? window[gv] : true);
    s.onerror = () => rej(new Error("Script yüklenemedi: " + src));
    document.head.appendChild(s);
  });
}

async function downloadWord(text, setErr) {
  try {
    const html = petitionToFullHtml(text);
    for (const [src, gv] of [
      ["https://cdn.jsdelivr.net/npm/html-docx-js@0.4.2/dist/html-docx.js", "htmlDocx"],
      ["https://cdnjs.cloudflare.com/ajax/libs/html-docx-js/0.4.2/html-docx.js", "htmlDocx"],
      ["https://unpkg.com/html-docx-js@0.4.2/dist/html-docx.js", "htmlDocx"],
    ]) {
      try { const m = await ensureScript(src, gv); if (m?.asBlob) { triggerDl(m.asBlob(html), "dilekce.docx"); return; } } catch (_) {}
    }
    await ensureScript("https://unpkg.com/docx@9.5.0/dist/index.iife.js", "docx");
    if (!window.docx?.Packer) throw new Error("docx lib yüklenemedi");
    const { Document, Paragraph, TextRun, AlignmentType } = window.docx;
    const clean = (text || "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s*/gm, "");
    const paras = clean.split("\n").map(l => new Paragraph({
      alignment: /mahkemesine/i.test(l.trim()) ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text: l.trim() })], spacing: { after: 80 },
    }));
    triggerDl(await window.docx.Packer.toBlob(new Document({ sections: [{ children: paras }] })), "dilekce.docx");
  } catch (e) { console.error(e); setErr("Word çıktısı hazırlanırken hata oluştu."); }
}

// CSS flex gap boşluklarını düzeltir — browser selection'ı ile raw markdown arasındaki fark
function fixFlexGaps(s) {
  return s
    .replace(/([^\s]):([^\s])/g, '$1: $2')           // "DAVACI:Ahmet" → "DAVACI: Ahmet"
    .replace(/(\d+)\.([^\s\d\n])/g, '$1. $2')         // "1.Kira" → "1. Kira"
    .replace(/([.!?])([A-ZÇĞİÖŞÜa-zA-Z])/g, '$1 $2');// "etti.Davacı" → "etti. Davacı"
}

function normalizeVisibleWithMap(s = "") {
  const out = [];
  const map = [];
  let lastWasSpace = true;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i] === "\u00a0" ? " " : s[i];
    if (/\s/.test(ch)) {
      if (!lastWasSpace && out.length > 0) {
        out.push(" ");
        map.push(i);
      }
      lastWasSpace = true;
      continue;
    }
    out.push(ch);
    map.push(i);
    lastWasSpace = false;
  }

  if (out[out.length - 1] === " ") {
    out.pop();
    map.pop();
  }

  return { text: out.join(""), map };
}

function findNormalizedRange(haystack, needle) {
  const h = normalizeVisibleWithMap(haystack);
  const n = normalizeVisibleWithMap(needle);
  if (!h.text || !n.text) return null;

  let idx = h.text.indexOf(n.text);
  if (idx === -1) idx = h.text.toLocaleLowerCase("tr").indexOf(n.text.toLocaleLowerCase("tr"));
  if (idx === -1) return null;

  const rawStart = h.map[idx];
  const rawEnd = h.map[idx + n.text.length - 1] + 1;
  if (rawStart === undefined || rawEnd === undefined) return null;
  return { start: rawStart, end: rawEnd };
}

// Başlangıç+bitiş anchor ile eşleştirip değiştir — tam eşleşme başarısız olduğunda son çare.
function replaceByAnchors(markdown, strippedStr, selText, replacement, posMap) {
  const sel = selText.trim();
  if (sel.length < 12) return null;

  const lowerStripped = strippedStr.toLowerCase();

  // Hem orijinal hem de gap-fixed versiyonu dene
  for (const candidate of [fixFlexGaps(sel), sel]) {
    for (const anchorLen of [24, 16, 10]) {
      if (anchorLen * 2 >= candidate.length) continue;
      const startAnchor = candidate.slice(0, anchorLen).toLowerCase();
      const endAnchor   = candidate.slice(-anchorLen).toLowerCase();

      const startIdx = lowerStripped.indexOf(startAnchor);
      if (startIdx === -1) continue;
      const endIdx = lowerStripped.indexOf(endAnchor, startIdx + anchorLen);
      if (endIdx === -1) continue;

      const replStart = posMap[startIdx];
      const replEnd   = posMap[endIdx + anchorLen - 1];
      if (replStart === undefined || replEnd === undefined) continue;

      return markdown.slice(0, replStart) + replacement + markdown.slice(replEnd + 1);
    }
  }
  return null;
}

// Seçili düz metin → markdown içerikle eşleştirip değiştir
// Rendered (görünen) bir seçimi, ham markdown içinde karakterlerin konumunu takip ederek değiştirir.
// Döndürür: değiştirilmiş string | null (bulunamazsa).
function replaceVisibleInMarkdown(markdown, visibleSel, replacement) {
  const stripped = [];
  const posMap = []; // posMap[i] = i. stripped karakterinin markdown'daki orijinal konumu
  let i = 0;
  while (i < markdown.length) {
    if (markdown[i] === '*' && markdown[i + 1] === '*') { i += 2; continue; }
    if (markdown[i] === '*') { i += 1; continue; }
    if (markdown[i] === '#' && (i === 0 || markdown[i - 1] === '\n')) {
      while (i < markdown.length && markdown[i] === '#') i++;
      while (i < markdown.length && markdown[i] === ' ') i++;
      continue;
    }
    stripped.push(markdown[i]);
    posMap.push(i);
    i++;
  }
  const strippedStr = stripped.join('');
  const base = visibleSel.trim();

  const fixed = fixFlexGaps(base);
  const singleNl = (s) => s.replace(/\n{2,}/g, '\n'); // cross-block: \n\n → \n
  const variants = [
    base,
    fixed,
    singleNl(base),
    singleNl(fixed),
  ];

  for (const sel of variants) {
    let idx = strippedStr.indexOf(sel);
    // Case-insensitive fallback (CSS text-transform uppercase gibi durumlar için)
    if (idx === -1) idx = strippedStr.toLowerCase().indexOf(sel.toLowerCase());
    if (idx === -1) continue;
    const endIdx = idx + sel.length - 1;
    if (endIdx >= posMap.length) continue;
    return markdown.slice(0, posMap[idx]) + replacement + markdown.slice(posMap[endIdx] + 1);
  }

  for (const sel of variants) {
    const range = findNormalizedRange(strippedStr, sel);
    if (!range) continue;
    const start = posMap[range.start];
    const end = posMap[range.end - 1];
    if (start === undefined || end === undefined) continue;
    return markdown.slice(0, start) + replacement + markdown.slice(end + 1);
  }

  // Son çare: başlangıç+bitiş anchor eşleştirme (uzun seçimler için)
  return replaceByAnchors(markdown, strippedStr, base, replacement, posMap);
}

function applyRevision(content, selText, revised) {
  // 1. Birebir eşleşme
  const idx = content.indexOf(selText);
  if (idx !== -1) return content.slice(0, idx) + revised + content.slice(idx + selText.length);
  // 2. Case-insensitive birebir eşleşme
  const lowerIdx = content.toLowerCase().indexOf(selText.toLowerCase());
  if (lowerIdx !== -1) return content.slice(0, lowerIdx) + revised + content.slice(lowerIdx + selText.length);
  // 3. Markdown-aware konum eşleştirme (** * # soyarak)
  return replaceVisibleInMarkdown(content, selText, revised); // null döner başarısızsa
}

async function downloadUdf(text, setErr) {
  try {
    await ensureScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js", "JSZip");
    if (!window.JSZip) throw new Error("JSZip yüklenemedi");
    const zip = new window.JSZip(); zip.file("content.xml", buildUdfXml(text));
    triggerDl(await zip.generateAsync({ type: "blob", compression: "DEFLATE" }), "dilekce.udf");
  } catch (e) { console.error(e); setErr("UDF hazırlanırken hata oluştu."); }
}

// ── Markdown view renderer ────────────────────────────────────

function renderInline(text) {
  return String(text || "").split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1, -1)}</em>;
    return <span key={i}>{p}</span>;
  });
}

function PetitionLine({ line }) {
  const t = line.trim();
  if (!t) return null;
  if (/^[-*_]{3,}$/.test(t)) return <hr className="my-6 border-t border-slate-300" />;
  const plain = t.replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s*/, "").trim();
  const upper = plain.toLocaleUpperCase("tr");
  if (/\bMAHKEMES[İI]NE\b/.test(upper)) return <p className="my-8 text-center text-[15px] font-bold uppercase leading-[1.7]">{plain}</p>;
  const isSignatureBlock =
    plain === "Davacı Vekili" ||
    plain === "Davalı Vekili" ||
    /^Av\.\s*\[.*\]/i.test(plain) ||
    /^Av\.\s/i.test(plain) ||
    /e-?imza/i.test(plain);
  if (isSignatureBlock) return <p className="my-2 text-right font-medium leading-[1.95]">{renderInline(t)}</p>;
  const hm = t.match(/^#{1,6}\s+(.*)/);
  if (hm) return <p className="mb-3 mt-8 text-[14px] font-bold uppercase leading-[1.8]">{renderInline(hm[1])}</p>;
  const lv = t.match(/^\*\*([^*:]+?):?\*\*:?\s*(.*)/);
  if (lv) return <p className="my-2 leading-[1.9]"><strong>{lv[1]}:</strong> {renderInline(lv[2])}</p>;
  const nm = t.match(/^(\d+)\.\s+(.*)/);
  if (nm) return <p className="my-3 grid grid-cols-[32px_minmax(0,1fr)] gap-2 leading-[1.95]"><span className="text-right font-bold">{nm[1]}.</span><span>{renderInline(nm[2])}</span></p>;
  return <p className="my-2 leading-[1.95]">{renderInline(t)}</p>;
}

// Seçili / değişen satırları inline olarak highlight eder (browser selection'a bağımlı değil)
function renderBlockLines(block, highlightText, bgColor, allowPartialLineFallback = false) {
  const lines = block.split("\n");
  const h = (highlightText || "").trim();
  if (!h) return lines.map((line, i) => <PetitionLine key={i} line={line} />);

  // Her satırın görünen (markdown soyulmuş) hali
  const visLines = lines.map(l =>
    l.replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s*/, "").trim()
  );
  const fullVis = visLines.join("\n");

  // highlight metni de markdown-stripped olarak ara (AI yanıtı ** içerebilir)
  const hVis = h.replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s*/gm, "").trim();

  // Eşleşme dene: tam → flex-gap fix → whitespace-normalized
  const hFixed = fixFlexGaps(hVis);
  const variants = [hVis, hFixed];
  let hlStart = -1, hlLen = 0;
  for (const v of variants) {
    let i = fullVis.indexOf(v);
    if (i === -1) i = fullVis.toLowerCase().indexOf(v.toLowerCase());
    if (i !== -1) { hlStart = i; hlLen = v.length; break; }
  }
  if (hlStart === -1) {
    for (const v of variants) {
      const range = findNormalizedRange(fullVis, v);
      if (range) {
        hlStart = range.start;
        hlLen = range.end - range.start;
        break;
      }
    }
  }

  if (hlStart === -1) {
    if (!allowPartialLineFallback) return lines.map((line, i) => <PetitionLine key={i} line={line} />);
    const normalizedHighlight = normalizeVisibleWithMap(hFixed).text.toLocaleLowerCase("tr");
    return lines.map((line, i) => {
      const normalizedLine = normalizeVisibleWithMap(visLines[i]).text.toLocaleLowerCase("tr");
      const inHL = normalizedLine.length > 3 && normalizedHighlight.includes(normalizedLine);
      if (!inHL) return <PetitionLine key={i} line={line} />;
      return (
        <div key={i} style={{ background: bgColor || "rgba(187,247,208,0.75)", borderRadius: "2px", margin: "0 -3px", padding: "0 3px" }}>
          <PetitionLine line={line} />
        </div>
      );
    });
  }

  const hlEnd = hlStart + hlLen;
  let pos = 0;
  const bg = bgColor || "rgba(254,240,138,0.65)";

  return lines.map((line, i) => {
    const vl = visLines[i];
    const lineEnd = pos + vl.length;
    const inHL = lineEnd > hlStart && pos < hlEnd;
    pos += vl.length + 1;
    if (!inHL) return <PetitionLine key={i} line={line} />;
    return (
      <div key={i} style={{ background: bg, borderRadius: "2px", margin: "0 -3px", padding: "0 3px" }}>
        <PetitionLine line={line} />
      </div>
    );
  });
}

function renderWholeBlockHighlighted(block, bgColor) {
  const bg = bgColor || "rgba(254,240,138,0.65)";
  return block.split("\n").map((line, i) => {
    if (!line.trim()) return <PetitionLine key={i} line={line} />;
    return (
      <div key={i} style={{ background: bg, borderRadius: "2px", margin: "0 -3px", padding: "0 3px" }}>
        <PetitionLine line={line} />
      </div>
    );
  });
}

// ── Per-block edit/revize panel ───────────────────────────────

function BlockPanel({ block, onSave, onRevize, onSendToChat, onClose, isRevising, revizeErr }) {
  const [tab, setTab] = useState("edit");
  const [editText, setEditText] = useState(() => stripMarkdown(block));
  const [instruction, setInstruction] = useState("");

  return (
    <div className="mb-3 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-0 border-b border-slate-100 bg-slate-50 px-3">
        <button onClick={() => setTab("edit")} className={`px-3 py-2 text-[10px] font-black border-b-2 transition ${tab === "edit" ? "border-blue-500 text-blue-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Düzenle</button>
        <button onClick={() => setTab("revize")} className={`px-3 py-2 text-[10px] font-black border-b-2 transition ${tab === "revize" ? "border-amber-500 text-amber-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}>AI Revize</button>
        <button onClick={onClose} className="ml-auto text-[10px] font-black text-slate-400 hover:text-slate-700 px-2 py-2 transition">✕</button>
      </div>

      <div className="p-3 space-y-2">
        {tab === "edit" && (
          <>
            <textarea
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12.5px] leading-[1.8] outline-none resize-y focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-100 transition"
              rows={Math.min(Math.max(editText.split("\n").length + 1, 3), 12)}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
            />
            <div className="flex gap-2">
              <button onClick={() => onSave(editText)} className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-[10px] font-black hover:bg-blue-700 transition">Kaydet</button>
              <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white text-slate-500 px-3 py-1.5 text-[10px] font-black hover:bg-slate-50 transition">İptal</button>
            </div>
          </>
        )}

        {tab === "revize" && (
          <>
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-[10px] text-slate-500 max-h-[72px] overflow-y-auto italic leading-[1.6]">
              {stripMarkdown(block).slice(0, 200)}{block.length > 200 ? "…" : ""}
            </div>
            <textarea
              autoFocus
              className="w-full rounded-lg border border-amber-200 bg-amber-50/40 p-2 text-[11px] outline-none resize-none focus:border-amber-400 focus:bg-white focus:ring-1 focus:ring-amber-100 transition"
              rows={2}
              placeholder="Talimat: 'Daha resmi yap', 'Genişlet', 'Maddele', 'Kısalt'…"
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onRevize(instruction); }}
            />
            {revizeErr && <p className="text-[10px] text-red-600">{revizeErr}</p>}
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => onRevize(instruction)} disabled={isRevising} className="rounded-lg bg-amber-500 text-white px-3 py-1.5 text-[10px] font-black hover:bg-amber-600 disabled:opacity-50 transition">
                {isRevising ? "Revize ediliyor…" : "Revize Et"}
              </button>
              <button onClick={() => onSendToChat(block, instruction)} className="rounded-lg bg-slate-700 text-white px-3 py-1.5 text-[10px] font-black hover:bg-slate-900 transition">
                Chat&apos;e Gönder
              </button>
              <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white text-slate-500 px-3 py-1.5 text-[10px] font-black hover:bg-slate-50 transition">İptal</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────

export default function DilekceDrawerPanel({ vm }) {
  const { dilekceContent, setDilekceContent, setDilekceDrawerOpen, setInput, saveDilekceDraft } = vm;

  // Global edit mode state
  const [editMode, setEditMode]   = useState(false);
  const [editText, setEditText]   = useState("");

  // Per-block revize state
  const [editingBlockIdx, setEditingBlockIdx] = useState(null);
  const [isRevising, setIsRevising]           = useState(false);
  const [revizeErr, setRevizeErr]             = useState("");

  // Seçim tabanlı işlemler
  const [selText, setSelText]           = useState("");
  const [selRevizeOpen, setSelRevizeOpen] = useState(false);
  const [selRevizeInstr, setSelRevizeInstr] = useState("");
  const [selRevizing, setSelRevizing]   = useState(false);
  const [selRevizeErr, setSelRevizeErr] = useState("");
  const [selEditOpen, setSelEditOpen]   = useState(false);
  const [selEditText, setSelEditText]   = useState("");
  const [selBlockIdx, setSelBlockIdx]   = useState(null); // seçimin hangi blokta olduğu
  const [selBlockRange, setSelBlockRange] = useState(null); // çok bloklu seçim aralığı
  const [changedText, setChangedText]     = useState(""); // yeşil highlight için
  const [changedBlockIdx, setChangedBlockIdx] = useState(null); // hangi blok değişti
  const [changedBlockRange, setChangedBlockRange] = useState(null); // yeşil highlight aralığı
  const [hasChanges, setHasChanges]     = useState(false); // Kaydet butonu için
  const [undoSnapshot, setUndoSnapshot] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [dlErr, setDlErr]               = useState("");

  const panelRef = useRef(null);
  const selStateRef = useRef({ editOpen: false, revizeOpen: false });
  const frozenSelRef = useRef(""); // selText'in dondurulmuş kopyası — async işlemlerde kullanılır
  const frozenBlockIdxRef = useRef(null); // seçim anındaki block index'i
  const frozenBlockRangeRef = useRef(null);
  const selRangeRef = useRef(null); // Browser Range nesnesi — highlight korunması için
  const dilekceContentRef = useRef(dilekceContent); // async API çağrılarında güncel içerik
  const lastSavedContentRef = useRef("");

  useEffect(() => {
    selStateRef.current = { editOpen: selEditOpen, revizeOpen: selRevizeOpen };
  }, [selEditOpen, selRevizeOpen]);

  useEffect(() => { dilekceContentRef.current = dilekceContent; }, [dilekceContent]);

  function getBlockIdxFromNode(node) {
    let current = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (current && current !== panelRef.current) {
      if (current.dataset?.blockIdx !== undefined) return Number(current.dataset.blockIdx);
      current = current.parentElement;
    }
    return null;
  }

  function getBoundaryNode(container, offset, preferPrevious = false) {
    if (!container || container.nodeType === Node.TEXT_NODE) return container;
    const children = container.childNodes;
    if (!children?.length) return container;
    const primaryIndex = preferPrevious
      ? Math.max(0, Math.min(offset - 1, children.length - 1))
      : Math.max(0, Math.min(offset, children.length - 1));
    return children[primaryIndex] || container;
  }

  function getBlockRangeFromRange(range) {
    if (!range) return null;
    const startNode = getBoundaryNode(range.startContainer, range.startOffset, false);
    const endNode = getBoundaryNode(range.endContainer, range.endOffset, true);
    const startIdx = getBlockIdxFromNode(startNode);
    const endIdx = getBlockIdxFromNode(endNode);
    const idxs = [startIdx, endIdx].filter(idx => idx !== null && Number.isFinite(idx));
    if (!idxs.length) return null;
    return { start: Math.min(...idxs), end: Math.max(...idxs) };
  }

  function getActiveEditRange(fallbackIdx = null) {
    return frozenBlockRangeRef.current
      || selBlockRange
      || (fallbackIdx !== null ? { start: fallbackIdx, end: fallbackIdx } : null);
  }

  // selRevizeOpen açıldığında autoFocus input seçimi temizler; 30ms sonra geri yükle
  useEffect(() => {
    if (!selRevizeOpen || !selRangeRef.current) return;
    const range = selRangeRef.current;
    const tid = window.setTimeout(() => {
      try {
        const s = window.getSelection();
        if (s) { s.removeAllRanges(); s.addRange(range); }
      } catch {}
    }, 30);
    return () => window.clearTimeout(tid);
  }, [selRevizeOpen]);

  // Metin seçim algılama — block index de yakalanır
  useEffect(() => {
    function onSel() {
      if (selStateRef.current.editOpen || selStateRef.current.revizeOpen) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) { setSelText(""); setSelBlockIdx(null); setSelBlockRange(null); return; }
      const t = sel.toString().trim();
      const range = sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
      let selectionTouchesPanel = false;
      try {
        selectionTouchesPanel = Boolean(range && panelRef.current && range.intersectsNode(panelRef.current));
      } catch {
        selectionTouchesPanel = Boolean(panelRef.current?.contains(sel.anchorNode));
      }
      if (t.length > 3 && selectionTouchesPanel) {
        setSelText(t);
        selRangeRef.current = range;
        const domRange = getBlockRangeFromRange(range);
        if (domRange) {
          setSelBlockRange(domRange);
          setSelBlockIdx(domRange.start);
          return;
        }
        if (selRangeRef.current) {
          const startIdx = getBlockIdxFromNode(selRangeRef.current.startContainer);
          const endIdx = getBlockIdxFromNode(selRangeRef.current.endContainer);
          if (startIdx !== null && endIdx !== null) {
            const range = {
              start: Math.min(startIdx, endIdx),
              end: Math.max(startIdx, endIdx),
            };
            setSelBlockRange(range);
            setSelBlockIdx(startIdx);
            return;
          }
        }
        const anchorIdx = getBlockIdxFromNode(sel.anchorNode);
        setSelBlockIdx(anchorIdx);
        setSelBlockRange(anchorIdx === null ? null : { start: anchorIdx, end: anchorIdx });
      } else {
        setSelBlockIdx(null);
        setSelBlockRange(null);
        setSelText("");
      }
    }
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  function openEditMode() {
    setEditText(stripMarkdown(cleanContent));
    setEditMode(true);
    setEditingBlockIdx(null);
  }

  function saveEditMode() {
    const nextCount = String(editText || "").split(/\n{2,}/).filter(b => b.trim()).length;
    rememberUndoSnapshot();
    setDilekceContent(editText);
    setChangedText(editText);
    setChangedBlockIdx(null);
    setChangedBlockRange(nextCount ? { start: 0, end: nextCount - 1 } : null);
    setHasChanges(true);
    setEditMode(false);
  }

  function cancelEditMode() {
    setEditMode(false);
  }

  // Marker kalıntılarını temizle (AI kapanış marker yazmayı atlarsa fallback)
  const cleanContent = (dilekceContent || "")
    .replace(/§§DILEKCE§§/g, "")
    .replace(/§§\/DILEKCE§§/g, "")
    .replace(/^Strateji Notu:[\s\S]*?\n(?=\[|[A-ZÇĞİÖŞÜ]{2})/m, "")
    .trim();

  useEffect(() => {
    if (!hasChanges) lastSavedContentRef.current = cleanContent;
  }, [cleanContent, hasChanges]);

  // Block helpers
  const blocks = cleanContent.split(/\n{2,}/);
  const contentBlocks = blocks.filter(b => b.trim());

  function replaceBlock(prev, blockIdx, newText) {
    const parts = prev.split(/\n{2,}/);
    let ni = 0;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].trim()) { if (ni === blockIdx) { parts[i] = newText; break; } ni++; }
    }
    return parts.join("\n\n");
  }

  function replaceBlockRange(prev, range, newText) {
    if (!range) return null;
    const parts = prev.split(/(\n{2,})/);
    let ni = 0;
    let firstPartIdx = null;
    let lastPartIdx = null;

    for (let i = 0; i < parts.length; i++) {
      if (/^\n+$/.test(parts[i]) || !parts[i].trim()) continue;
      if (ni >= range.start && ni <= range.end) {
        if (firstPartIdx === null) firstPartIdx = i;
        lastPartIdx = i;
      }
      ni++;
    }

    if (firstPartIdx === null || lastPartIdx === null) return null;
    const replacement = String(newText || "").trim();
    const nextParts = [
      ...parts.slice(0, firstPartIdx),
      ...(replacement ? [replacement] : []),
      ...parts.slice(lastPartIdx + 1),
    ];
    return nextParts.join("").replace(/\n{3,}/g, "\n\n").trim();
  }

  function findChangedBlockIdx(content, changed) {
    const clean = String(changed || "").trim();
    if (!clean || clean.includes("\n\n")) return null;
    const visibleChanged = clean.replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s*/gm, "").trim();
    const contentParts = String(content || "").split(/\n{2,}/).filter(b => b.trim());
    for (let i = 0; i < contentParts.length; i++) {
      const visibleBlock = contentParts[i].replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s*/gm, "").trim();
      if (findNormalizedRange(visibleBlock, visibleChanged)) return i;
    }
    return null;
  }

  function getChangedBlockIdx(content, changed, fallbackIdx) {
    if (String(changed || "").includes("\n\n")) return null;
    return findChangedBlockIdx(content, changed) ?? fallbackIdx;
  }

  function rememberUndoSnapshot() {
    setUndoSnapshot({
      content: dilekceContentRef.current,
      changedText,
      changedBlockIdx,
      changedBlockRange,
      hasChanges,
    });
  }

  function revertLastChange() {
    if (!undoSnapshot) return;
    setDilekceContent(undoSnapshot.content);
    setChangedText(undoSnapshot.changedText || "");
    setChangedBlockIdx(undoSnapshot.changedBlockIdx ?? null);
    setChangedBlockRange(undoSnapshot.changedBlockRange || null);
    setHasChanges(Boolean(undoSnapshot.hasChanges || undoSnapshot.content !== lastSavedContentRef.current));
    setUndoSnapshot(null);
    setSaveErr("");
    clearSel();
  }

  function handleBlockSave(blockIdx, newText) {
    rememberUndoSnapshot();
    const next = replaceBlock(dilekceContentRef.current, blockIdx, newText);
    setDilekceContent(next);
    setChangedText(newText);
    setChangedBlockIdx(getChangedBlockIdx(next, newText, blockIdx));
    setChangedBlockRange({ start: blockIdx, end: blockIdx });
    setHasChanges(true);
    setEditingBlockIdx(null);
  }

  async function handleBlockRevize(blockIdx, instruction) {
    const block = contentBlocks[blockIdx];
    if (!block?.trim()) return;
    setIsRevising(true); setRevizeErr("");
    try {
      const res = await fetch("/api/dilekce/revize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_text: block, instruction }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setRevizeErr(data?.error || "Revizyon başarısız."); return; }
      const revised = (data.revised_text || "").trim();
      if (!revised) { setRevizeErr("AI boş yanıt döndürdü."); return; }
      rememberUndoSnapshot();
      const next = replaceBlock(dilekceContentRef.current, blockIdx, revised);
      setDilekceContent(next);
      setChangedText(revised);
      setChangedBlockIdx(getChangedBlockIdx(next, revised, blockIdx));
      setChangedBlockRange({ start: blockIdx, end: blockIdx });
      setHasChanges(true);
      setEditingBlockIdx(null);
    } catch { setRevizeErr("Hata oluştu."); }
    finally { setIsRevising(false); }
  }

  function sendBlockToChat(block, instruction) {
    const msg = instruction?.trim()
      ? `Şu dilekçe bölümünü revize et — ${instruction}:\n\n${stripMarkdown(block)}`
      : `Şu dilekçe bölümünü hukuki dil açısından iyileştir:\n\n${stripMarkdown(block)}`;
    setInput(msg);
    setDilekceDrawerOpen(false);
  }

  function clearSel() {
    selRangeRef.current = null;
    frozenSelRef.current = "";
    frozenBlockIdxRef.current = null;
    frozenBlockRangeRef.current = null;
    selStateRef.current = { editOpen: false, revizeOpen: false };
    window.getSelection()?.removeAllRanges();
    setSelText(""); setSelBlockIdx(null); setSelBlockRange(null);
    setSelRevizeOpen(false);
    setSelRevizeInstr("");
    setSelRevizeErr("");
    setSelEditOpen(false);
    setSelEditText("");
  }

  function openSelEdit() {
    frozenSelRef.current = selText;
    frozenBlockIdxRef.current = selBlockIdx;
    frozenBlockRangeRef.current = selBlockRange;
    selStateRef.current = { editOpen: true, revizeOpen: false };
    setSelEditText(selText);
    setSelEditOpen(true);
    setSelRevizeOpen(false);
  }

  function freezeSel() {
    frozenSelRef.current = selText;
    frozenBlockIdxRef.current = selBlockIdx;
    frozenBlockRangeRef.current = selBlockRange;
    selStateRef.current = { editOpen: false, revizeOpen: true };
  }

  function replaceInBlock(prev, blockIdx, selText, newText) {
    const parts = prev.split(/(\n{2,})/);
    let ni = 0;
    for (let i = 0; i < parts.length; i++) {
      if (/^\n+$/.test(parts[i]) || !parts[i].trim()) continue;
      if (ni === blockIdx) {
        const block = parts[i];
        // 1. Birebir eşleşme
        const exact = block.indexOf(selText);
        if (exact !== -1) {
          parts[i] = block.slice(0, exact) + newText + block.slice(exact + selText.length);
          return parts.join("");
        }
        // 2. Case-insensitive birebir eşleşme
        const lowerExact = block.toLowerCase().indexOf(selText.toLowerCase());
        if (lowerExact !== -1) {
          parts[i] = block.slice(0, lowerExact) + newText + block.slice(lowerExact + selText.length);
          return parts.join("");
        }
        // 3. Markdown-aware konum eşleştirme (** * # karakterlerini atlayarak + gap fix + anchor)
        const mdResult = replaceVisibleInMarkdown(block, selText, newText);
        if (mdResult !== null) {
          parts[i] = mdResult;
          return parts.join("");
        }
        // 4. Hiçbiri işe yaramadı — null döndür, çağıran tam içerikte dener
        return null;
      }
      ni++;
    }
    return applyRevision(prev, selText, newText);
  }

  function saveSelEdit() {
    const target = frozenSelRef.current || selText;
    const bIdx = frozenBlockIdxRef.current ?? selBlockIdx;
    const edited = selEditText.trim();
    const editRange = getActiveEditRange(bIdx);
    if (!target) { clearSel(); return; }
    const current = dilekceContentRef.current;
    const newContent = (() => {
      if (bIdx !== null) {
        const r = replaceInBlock(current, bIdx, target, edited);
        if (r !== null) return r;
      }
      const contentResult = applyRevision(current, target, edited);
      if (contentResult !== null) return contentResult;
      return replaceBlockRange(current, editRange, edited);
    })();
    if (newContent === null) { clearSel(); return; }
    rememberUndoSnapshot();
    setDilekceContent(newContent);
    setChangedText(edited);
    setChangedBlockIdx(getChangedBlockIdx(newContent, edited, bIdx));
    setChangedBlockRange(editRange);
    setHasChanges(true);
    clearSel();
  }

  function deleteSelectedText() {
    const target = frozenSelRef.current || selText;
    const bIdx = frozenBlockIdxRef.current ?? selBlockIdx;
    const editRange = getActiveEditRange(bIdx);
    if (!target) { clearSel(); return; }
    const current = dilekceContentRef.current;
    const newContent = (() => {
      if (bIdx !== null) {
        const r = replaceInBlock(current, bIdx, target, "");
        if (r !== null) return r;
      }
      const contentResult = applyRevision(current, target, "");
      if (contentResult !== null) return contentResult;
      return replaceBlockRange(current, editRange, "");
    })();
    if (newContent === null) { clearSel(); return; }
    rememberUndoSnapshot();
    setDilekceContent(newContent);
    setChangedText("");
    setChangedBlockIdx(bIdx);
    setChangedBlockRange(editRange);
    setHasChanges(true);
    clearSel();
  }

  async function handleSaveChanges() {
    if (!cleanContent.trim()) return;
    setIsSavingDraft(true);
    setSaveErr("");
    try {
      if (typeof saveDilekceDraft !== "function") {
        throw new Error("Dilekçe kaydetme bağlantısı bulunamadı.");
      }
      await saveDilekceDraft(cleanContent);
      lastSavedContentRef.current = cleanContent;
      setChangedText("");
      setChangedBlockIdx(null);
      setChangedBlockRange(null);
      setUndoSnapshot(null);
      setHasChanges(false);
    } catch (error) {
      setSaveErr(error?.message || "Dilekçe kaydedilemedi.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function handleSelRevize() {
    const target = frozenSelRef.current || selText;
    const bIdx = frozenBlockIdxRef.current ?? selBlockIdx;
    const editRange = getActiveEditRange(bIdx);
    if (!target?.trim()) return;
    setSelRevizing(true); setSelRevizeErr("");
    try {
      const res = await fetch("/api/dilekce/revize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_text: target,
          instruction: selRevizeInstr || "Metni hukuki dil açısından iyileştir ve daha akıcı yap",
          full_petition: dilekceContentRef.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setSelRevizeErr(data?.error || "Revizyon başarısız."); return; }
      const revised = (data.revised_text || "").trim();
      if (!revised) { setSelRevizeErr("AI boş yanıt döndürdü."); return; }
      const current = dilekceContentRef.current;
      const newContent = (() => {
        if (bIdx !== null) {
          const blockResult = replaceInBlock(current, bIdx, target, revised);
          if (blockResult !== null) return blockResult;
        }
        // Block'ta bulunamazsa tüm içerikte dene (cross-block veya case mismatch)
        const contentResult = applyRevision(current, target, revised);
        if (contentResult !== null) return contentResult;
        return replaceBlockRange(current, editRange, revised);
      })();
      if (newContent === null) {
        setSelRevizeErr("Seçili metin yerleştirilemedi. Lütfen yeniden seçin.");
        return;
      }
      rememberUndoSnapshot();
      setDilekceContent(newContent);
      setChangedText(revised);
      setChangedBlockIdx(getChangedBlockIdx(newContent, revised, bIdx));
      setChangedBlockRange(editRange);
      setHasChanges(true);
      clearSel();
    } catch { setSelRevizeErr("Hata oluştu."); }
    finally { setSelRevizing(false); }
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
      <style>{`.dilekce-sel-area *::selection { background: #fef08a; color: inherit; }`}</style>

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-slate-400 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[11px] font-black text-slate-800 truncate">Dilekçe Editörü</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => downloadWord(cleanContent, setDlErr)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black text-slate-600 hover:bg-slate-50 transition">Word</button>
          <button onClick={() => downloadUdf(cleanContent, setDlErr)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 hover:bg-emerald-100 transition">.udf</button>
          {hasChanges && !editMode && (
            <>
              {undoSnapshot && (
                <button
                  onClick={revertLastChange}
                  disabled={isSavingDraft}
                  className="rounded-lg border border-slate-200 bg-white text-slate-600 px-2.5 py-1 text-[10px] font-black hover:bg-slate-50 disabled:opacity-60 transition"
                >
                  Geri al
                </button>
              )}
              <button
                onClick={handleSaveChanges}
                disabled={isSavingDraft}
                className="rounded-lg bg-green-600 border border-green-600 text-white px-2.5 py-1 text-[10px] font-black hover:bg-green-700 disabled:opacity-60 transition"
              >
                {isSavingDraft ? "Kaydediliyor..." : "✓ Kaydet"}
              </button>
            </>
          )}
          {editMode && (
            <div className="flex gap-1">
              <button onClick={saveEditMode} className="rounded-lg bg-blue-600 border border-blue-600 text-white px-2.5 py-1 text-[10px] font-black hover:bg-blue-700 transition">Kaydet</button>
              <button onClick={cancelEditMode} className="rounded-lg border border-slate-200 bg-white text-slate-500 px-2.5 py-1 text-[10px] font-black hover:bg-slate-50 transition">İptal</button>
            </div>
          )}
          <button onClick={() => setDilekceDrawerOpen(false)} className="rounded-lg border border-slate-200 bg-white p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      {dlErr && (
        <div className="shrink-0 px-4 py-1.5 text-[10px] text-red-600 bg-red-50 border-b border-red-100 flex justify-between items-center">
          <span>{dlErr}</span>
          <button onClick={() => setDlErr("")} className="font-black ml-2 hover:text-red-700">✕</button>
        </div>
      )}
      {saveErr && (
        <div className="shrink-0 px-4 py-1.5 text-[10px] text-red-600 bg-red-50 border-b border-red-100 flex justify-between items-center">
          <span>{saveErr}</span>
          <button onClick={() => setSaveErr("")} className="font-black ml-2 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar" ref={panelRef}>

        {!cleanContent?.trim() ? (
          /* Boş durum */
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center gap-3">
            <div className="text-4xl opacity-10 select-none">📄</div>
            <p className="text-xs font-bold text-slate-500">Dilekçe editörü hazır</p>
            <p className="text-[10px] text-slate-400 max-w-[210px] leading-5">
               Soldaki alana talimatlarınızı girin, dilekçeniz tamamlandığında editöre gelecektir.
            </p>
          </div>

        ) : editMode ? (
          /* ── DÜZENLEME MODU: temiz metin, kağıt stili textarea ── */
          <div className="relative">
            <textarea
              autoFocus
              className="w-full rounded-2xl border-0 shadow-[0_2px_24px_-6px_rgba(15,23,42,0.13)] ring-1 ring-slate-200 outline-none resize-none focus:ring-2 focus:ring-blue-300 transition-shadow"
              style={{
                fontFamily: "'Times New Roman', Georgia, 'Times', serif",
                fontSize: "13px",
                lineHeight: "1.9",
                color: "#1e293b",
                padding: "2.5rem 3rem",
                minHeight: "600px",
                background: "#fff",
              }}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              spellCheck={false}
            />
          </div>

        ) : (
          /* ── GÖRÜNTÜLEME MODU: Word benzeri kağıt görünümü ── */
          <div
            className="dilekce-sel-area mx-auto min-h-[820px] max-w-[900px] bg-white px-12 py-14 shadow-[0_1px_4px_rgba(15,23,42,0.12)] ring-1 ring-slate-200"
            style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "15px", lineHeight: "1.95", color: "#111827" }}
          >
            {(() => {
              let bIdx = 0;
              return blocks.map((block, bi) => {
                const isEmpty = !block.trim();
                const blockIdx = isEmpty ? null : bIdx++;
	                const isEditing = blockIdx !== null && blockIdx === editingBlockIdx;
	                const activeFrozenRange = frozenBlockRangeRef.current || selBlockRange;
	                const blockInFrozenRange = !isEmpty && blockIdx !== null && activeFrozenRange && blockIdx >= activeFrozenRange.start && blockIdx <= activeFrozenRange.end;
	                const isSelBlock = !isEmpty && blockIdx !== null && (selBlockIdx === blockIdx || frozenBlockIdxRef.current === blockIdx || blockInFrozenRange);
	                // Panel açıkken custom highlight; sadece toolbar açıkken native ::selection yeterli
	                const frozenHLText = frozenSelRef.current || selText;
	                const frozenRangeHasMultipleBlocks = activeFrozenRange && activeFrozenRange.end > activeFrozenRange.start;
	                const useFrozenHL = !isEmpty && Boolean(frozenHLText) && (selEditOpen || selRevizeOpen) && (activeFrozenRange ? blockInFrozenRange : isSelBlock);
	                const isChanged = !isEmpty
                    && hasChanges
                    && changedBlockRange
                    && Boolean(changedText)
                    && blockIdx >= changedBlockRange.start
                    && blockIdx <= changedBlockRange.end;

                return (
	                  <div key={bi}>
	                    <div
	                      data-block-idx={blockIdx ?? undefined}
	                      className={`${isEmpty ? "h-5" : "relative"}`}
	                    >
	                      <div className="select-text">
	                        {useFrozenHL
		                          ? frozenRangeHasMultipleBlocks
                              ? renderWholeBlockHighlighted(block, "rgba(254,240,138,0.7)")
                              : renderBlockLines(block, frozenHLText, "rgba(254,240,138,0.7)", true)
	                          : isChanged
                          ? renderBlockLines(block, changedText, "rgba(187,247,208,0.75)", true)
                          : block.split("\n").map((line, li) => <PetitionLine key={li} line={line} />)
                        }
                      </div>
                    </div>

                    {isEditing && (
                      <BlockPanel
                        block={block}
                        onSave={t => handleBlockSave(blockIdx, t)}
                        onRevize={instr => handleBlockRevize(blockIdx, instr)}
                        onSendToChat={sendBlockToChat}
                        onClose={() => { setEditingBlockIdx(null); setRevizeErr(""); }}
                        isRevising={isRevising}
                        revizeErr={revizeErr}
                      />
                    )}
                  </div>
                );
              });
            })()}

	            <p className="mt-10 text-center text-[10px] text-slate-300 select-none">
	              Metin seçerek düzenleyebilir veya revize isteyebilirsiniz.
	            </p>
          </div>
        )}
      </div>

      {/* Floating selection toolbar */}
      {(selText || selEditOpen || selRevizeOpen) && !editMode && (
        <div className="absolute bottom-5 left-1/2 z-30 w-[min(720px,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white/98 shadow-[0_18px_55px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl">

          {!selRevizeOpen && !selEditOpen ? (
            /* Ana bar: Düzenle + Revize İste */
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Seçili metin</div>
                <div className="mt-1 truncate text-[12px] font-semibold leading-5 text-slate-700">
                  &ldquo;{selText.slice(0, 110)}{selText.length > 110 ? "…" : ""}&rdquo;
                </div>
              </div>
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={openSelEdit}
                className="shrink-0 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-[12px] font-black text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                Düzenle
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); freezeSel(); }}
                onClick={() => { freezeSel(); setSelRevizeOpen(true); }}
                className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-[12px] font-black text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
              >
                Revize İste
              </button>
              <button onMouseDown={e => e.preventDefault()} onClick={clearSel} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[12px] font-black text-slate-500 transition hover:bg-slate-200">✕</button>
            </div>
          ) : selEditOpen ? (
            /* Seçili metin düzenleme */
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-black text-slate-800">Seçili metni düzenle</span>
                <button onClick={clearSel} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[12px] font-black text-slate-500 hover:bg-slate-200">✕</button>
              </div>
              <textarea
                autoFocus
                value={selEditText}
                onChange={e => setSelEditText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveSelEdit(); }}
                rows={Math.min(Math.max(selEditText.split("\n").length + 1, 2), 8)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] leading-[1.8] outline-none resize-y transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={deleteSelectedText}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12px] font-black text-red-700 transition hover:bg-red-100"
                >
                  Seçili kısmı sil
                </button>
                <button
                  onClick={saveSelEdit}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-[12px] font-black text-white transition hover:bg-blue-700"
                >
                  Kaydet
                </button>
                <button onClick={clearSel} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[12px] font-black text-slate-600 transition hover:bg-slate-50">İptal</button>
              </div>
            </div>
          ) : (
            /* Revize talimat girişi */
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-black text-slate-800">Revizyon talimatı</span>
                <button onClick={() => { setSelRevizeOpen(false); setSelRevizeErr(""); }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[12px] font-black text-slate-500 hover:bg-slate-200">✕</button>
              </div>
              <input
                autoFocus
                value={selRevizeInstr}
                onChange={e => setSelRevizeInstr(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !selRevizing && handleSelRevize()}
                placeholder="Örn. daha resmi yaz, kısa ve net hale getir, maddeyi güçlendir..."
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-[13px] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              {selRevizeErr && <span className="text-[9px] text-red-500">{selRevizeErr}</span>}
              <button
                onClick={handleSelRevize}
                disabled={selRevizing}
                className="rounded-xl bg-blue-600 py-2.5 text-[12px] font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {selRevizing ? "İşleniyor…" : "Uygula"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
