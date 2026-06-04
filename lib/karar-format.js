// lib/karar-format.js
// Kararlar için ortak biçimlendirme yardımcıları.
// DecisionRow, SectionRow ve SearchResults bu modülü paylaşır.

// Daireyi kategoriye ve renk koduna eşler.
export function chamberStyle(type = "") {
  const t = String(type || "");
  if (/Birleş|İçtihad|Ictihad|İBK|IBK/i.test(t))
    return { chip: "bg-amber-50 text-amber-800 border-amber-200", cat: "İBK" };
  if (/Genel Kurul/i.test(t))
    return { chip: "bg-violet-50 text-violet-800 border-violet-200", cat: "Genel Kurul" };
  if (/Ceza/i.test(t))
    return { chip: "bg-rose-50 text-rose-800 border-rose-200", cat: "Ceza" };
  if (/Hukuk/i.test(t))
    return { chip: "bg-sky-50 text-sky-800 border-sky-200", cat: "Hukuk" };
  return { chip: "bg-slate-100 text-slate-600 border-slate-200", cat: "" };
}

export const toKeywordList = (kw) =>
  typeof kw === "string"
    ? kw.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean)
    : [];

export const esc = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const highlight = (text = "", term = "") => {
  if (!term) return esc(text);
  const safe = esc(text);
  const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return safe.replace(re, '<mark class="bg-amber-200 text-[#0f2a4a] rounded px-0.5">$1</mark>');
};

// Özetin başındaki "Uyuşmazlık:" cümlesini önizleme olarak çıkarır.
export const extractUyusmazlikLine = (aiSummary = "") => {
  if (!aiSummary) return "";
  const m = aiSummary.match(/Uyuşmazlık:\s*([\s\S]*?)(?:\n|Gerekçe|Sonuç|$)/i);
  if (!m || !m[1]) return "";
  const line = m[1].trim().replace(/\s+/g, " ");
  return line.length > 220 ? line.slice(0, 200) + "…" : line;
};

// AI özetini "Uyuşmazlık" / "Gerekçe ve Sonuç" bloklarına ayırır.
// Etiket bulunamazsa null döner (çağıran ham metni gösterir).
export function parseStructuredSummary(text = "") {
  const s = String(text || "").replace(/\r/g, "").trim();
  if (!s) return null;

  const uM = s.match(/Uyuşmazlık\s*:/i);
  const gM = s.match(/Gerekçe\s*(?:ve\s*Sonuç)?\s*:/i);
  if (!uM && !gM) return null;

  const blocks = [];

  if (uM) {
    const start = uM.index + uM[0].length;
    const end = gM && gM.index > uM.index ? gM.index : undefined;
    const body = s.slice(start, end).trim();
    if (body) blocks.push({ label: "Uyuşmazlık", body });
  }

  if (gM) {
    const start = gM.index + gM[0].length;
    const body = s.slice(start).trim();
    const label = gM[0].replace(/\s*:\s*$/, "").trim();
    if (body) blocks.push({ label, body });
  }

  return blocks.length ? blocks : null;
}

export const formatDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
};