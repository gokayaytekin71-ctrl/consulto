import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

// --- Yardımcı Fonksiyonlar (State Bağımsız) ---

function stripHtmlTags(s = "") {
  let t = (s ?? "").toString();
  t = t.replace(/\r\n/g, "\n");
  t = t.replace(/&lt;br\s*\/?&gt;/gi, "\n")
       .replace(/&lt;\/p\s*&gt;/gi, "\n")
       .replace(/&lt;p[^&gt;]*&gt;/gi, "")
       .replace(/<br\s*\/?>/gi, "\n")
       .replace(/<\/p\s*>/gi, "\n")
       .replace(/<p[^>]*>/gi, "")
       .replace(/&lt;[^&gt;]*&gt;/g, " ")
       .replace(/<[^>]*>/g, " ")
       .replace(/&nbsp;/gi, " ")
       .replace(/\r/g, "")
       .replace(/[ \t\f\v]+/g, " ")
       .replace(/[ \t]+\n/g, "\n")
       .replace(/\n[ \t]+/g, "\n")
       .replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function sanitizeMaddeTextFull(s = "") {
  const txt = stripHtmlTags(s || "");
  let out = txt;
  const lines = out.split(/\r?\n/);
  const isUpperHeading = (t) => /^(?:BİRİNCİ|İKİNCİ|ÜÇÜNCÜ|DÖRDÜNCÜ|BEŞİNCİ|ALTINCI|YEDİNCİ|SEKİZİNCİ|DOKUZUNCU|ONUNCU)\s+(?:KİTAP|BÖLÜM|KISIM|AYRIM)\b/.test(t);
  const isOutline = (t) => /^(?:[IVXLCDM]+|[0-9]+|[A-ZÇĞİÖŞÜ])\.\s+\S/.test(t);

  while (lines.length) {
    const last = (lines[lines.length - 1] || "").trim();
    if (!last) { lines.pop(); continue; }
    if (isOutline(last) || isUpperHeading(last)) {
      lines.pop();
      while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
      continue;
    }
    break;
  }
  out = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  out = out.replace(/\s*[—–-]\s*(?=(?:[IVXLCDM]+|[0-9]+|[A-ZÇĞİÖŞÜ])\.)[^\n]*$/u, "");
  out = out.replace(/\s*(?:\b(?:[IVXLCDM]+|[0-9]+|[A-ZÇĞİÖŞÜ])\.\s*[A-ZÇĞİÖŞÜ][^\n]{0,60})\s*$/u, "");
  out = out.replace(/\s*(?:\b(?:[IVXLCDM]+|[0-9]+))\.\s*$/u, "");
  return out.trim();
}

function slugifyMevzuatAdi(name = "") {
  const trMap = { "ı":"i","İ":"i","ş":"s","Ş":"s","ç":"c","Ç":"c","ö":"o","Ö":"o","ü":"u","Ü":"u","ğ":"g","Ğ":"g" };
  let s = (name || "").toString().trim();
  s = s.replace(/^\s*\d+(?:\s*\/\s*\d+)?\s*(?:say[ıi]l[ıi]|numaral[ıi]|no\.?lu?)\s+/i, "");
  s = s.replace(/^\s*\d{3,5}\s+/, "");
  s = s.replace(/[ıİşŞçÇöÖüÜğĞ]/g, c => trMap[c] || c).toLowerCase();
  return s.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

function mevzuatCacheKey(kanun = "", madde = "") {
  const id = (madde || "").toString().match(/\d+/)?.[0] || (madde || "").toString();
  return `${slugifyMevzuatAdi(kanun || "")}::${id}`;
}

function maddeAnchor(madde) {
  const raw = (madde ?? "").toString();
  const num = (raw.match(/\d+/)?.[0] ?? raw).toString().trim().replace(/\s+/g, "-").toLowerCase();
  return num ? `#madde-${num}` : "";
}

function cleanTitle(title = "") {
  return (title || "").replace(/^\s*Analiz\s*[—–-]\s*/i, "").trim();
}

// --- Karar Helperları ---
function looksLikeSlug(s = "") {
  const base = String(s).replace(/\.txt$/i, "");
  if (!base) return false;
  if (/(Hukuk|Ceza)_(Dairesi|Genel_Kurulu)/i.test(base) && /E_/i.test(base) && /K\b/i.test(base)) return true;
  if (/__(\d{4})-[^_]+E_\d{4}-[^_]+K$/i.test(base)) return true;
  return false;
}

function formatDecisionType(t = "") {
  if (!t) return "";
  return t.replace(/^Hukuk\s+Genel\s+Kurulu\b/i, "HGK");
}

function normalizeDecision(typeRaw = "", codeRaw = "") {
  let type = (typeRaw || "").trim();
  let code = (codeRaw || "").trim().replace(/^[—–-]\s*/, "");
  if (/Dairesi\b/i.test(type) && !/^Yargıtay\s/i.test(type)) {
    type = `Yargıtay ${type}`;
  }
  code = code.replace(/\b(\d{4})-(\d+)\b/g, "$1/$2");
  return `${type} ${code}`.replace(/\s+/g, " ").trim();
}

function deduceEsasKararFromProps(p = {}) {
  const clean = (s) => (s || "").toString().trim();
  const bad = (s) => !s || /^belirtilmemi[şs]/i.test(s) || /^n\/?a$/i.test(s);
  const codeField = clean(p.code);
  if (!bad(codeField)) return codeField;
  const esas = clean(p.esas_no);
  const karar = clean(p.karar_no);
  if (!bad(esas) && !bad(karar)) return `${esas} E. ${karar} K.`;
  const fnameRaw = clean(p.orijinal_karar_id || p.dosya_adi || p.dosya || p.slug);
  if (fnameRaw) {
    const base = fnameRaw.replace(/\.txt$/i, "");
    let m = base.match(/^(\d+)_Hukuk_Dairesi_(\d{4}-[0-9A-Za-z()\-\/]+)E_(\d{4}-[0-9A-Za-z()\-\/]+)K$/i);
    if (m) return `${m[2].replace(/\s*-\s*/g, "/")} E. ${m[3].replace(/\s*-\s*/g, "/")} K.`;
    m = base.match(/^(Hukuk|Ceza)_Genel_Kurulu_(\d{4}-[0-9A-Za-z()\-\/]+)E_(\d{4}-[0-9A-Za-z()\-\/]+)K$/i);
    if (m) return `${m[2].replace(/\s*-\s*/g, "/")} E. ${m[3].replace(/\s*-\s*/g, "/")} K.`;
  }
  return "";
}

function deduceCourtLabelFromProps(p = {}) {
  const clean = (s) => (s || "").toString().trim();

  // Önce dosya adından (orijinal_karar_id / dosya_adi / slug) tam mahkeme adını çıkarmaya çalış
  const fnameRaw = clean(p.orijinal_karar_id || p.dosya_adi || p.dosya || p.slug);
  if (fnameRaw) {
    const base = fnameRaw.replace(/\.txt$/i, "");
    let m = base.match(/^(\d+)_Hukuk_Dairesi_/i);
    if (m) return `${m[1]}. Hukuk Dairesi`;
    m = base.match(/^(\d+)_Ceza_Dairesi_/i);
    if (m) return `${m[1]}. Ceza Dairesi`;
    m = base.match(/^(Hukuk|Ceza)_Genel_Kurulu_/i);
    if (m) return `${m[1]} Genel Kurulu`;
  }

  // Dosya adından çıkarılamazsa, mahkeme/type alanını olduğu gibi kullan (HGK vb. kısaltmalar için fallback)
  const mahkeme = clean(p.mahkeme || p.type || "");
  return mahkeme;
}

function slugFromTypeAndCode(typeRaw = "", codeRaw = "") {
  const trMap = { "ı": "i", "İ": "i", "ş": "s", "Ş": "s", "ç": "c", "Ç": "c", "ö": "o", "Ö": "o", "ü": "u", "Ü": "u", "ğ": "g", "Ğ": "g" };
  function normalizeTr(str) { return (str || "").replace(/[ıİşŞçÇöÖüÜğĞ]/g, c => trMap[c] || c); }
  let type = normalizeTr(typeRaw || "").trim().replace(/^Yargıtay\s*/i, "").replace(/\./g, "").replace(/\s+/g, "-").toLowerCase().replace(/-+/g, "-");
  const code = normalizeTr(codeRaw || "").trim();
  const m = code.match(/^(?:.*?)(\d{4})\s*[/-]\s*([0-9A-Za-z-]+)\s*E\b.*?(\d{4})\s*[/-]\s*([0-9A-Za-z-]+)\s*K\b/i);
  if (!m) return "";
  const y1 = m[1], e = (m[2] || "").replace(/\s+/g, ""), y2 = m[3], k = (m[4] || "").replace(/\s+/g, "");
  if (!type || !y1) return "";
  return `${type}__${y1}-${e}E_${y2}-${k}K`;
}

function bestSlugFromProps(p = {}, allArr = []) {
  const primary = (p.orijinal_karar_id || p.dosya_adi || p.karar_id || p.slug || "").toString().replace(/\.txt$/i, "");
  if (looksLikeSlug(primary)) return primary;
  const rid = (p.orijinal_karar_id || p.karar_id || "").toString().replace(/\.txt$/i, "");
  if (rid) {
    for (const q of allArr) {
      const typeRaw = String(q.kaynak_turu || q.tur || "").toLowerCase();
      const isSummaryName = /(?:\bözet\b|\bozet\b|gemini)/i.test(String(q.dosya_adi || ""));
      const isSummary = typeRaw === "ai_ozet" || isSummaryName;
      const candidate = (q.dosya_adi || q.orijinal_karar_id || "").toString().replace(/\.txt$/i, "");
      if (looksLikeSlug(candidate) && !isSummary && (String(q.orijinal_karar_id || "").replace(/\.txt$/i, "") === rid)) {
        return candidate;
      }
    }
  }
  const fallback = (p.dosya_adi || "").toString().replace(/\.txt$/i, "");
  return looksLikeSlug(fallback) ? fallback : "";
}

function bestSlugTypeCodeFirst(p = {}, allArr = []) {
  const code = deduceEsasKararFromProps(p);
  const court = deduceCourtLabelFromProps(p) || p.type || p.mahkeme || "";
  const slug = slugFromTypeAndCode(court, code);
  if (slug) return slug;
  return bestSlugFromProps(p, allArr);
}
// --- YENİLENDİ (V4 - FİNAL): Tüm Tire Karakterleri ve Temiz Linkleme ---
function autoLinkDecisionsInText(text) {
  if (!text) return "";

  // Regex Açıklaması:
  // 1. (?:\[\s*)? -> Opsiyonel açılan köşeli parantez
  // 2. Mahkeme Adı
  // 3. [\/\-\u2013\u2014] -> BURASI KRİTİK: Standart tire, En-dash, Em-dash veya Taksim işaretini kabul et.
  // 4. (?:\s*\])? -> Opsiyonel kapanan köşeli parantez
  
  const regex = /(?:\[\s*)?(?:Yargıtay[\s\W]+)?((?:Hukuk|Ceza)[\s\W]+Genel[\s\W]+Kurulu|(?:\d+)\.?\s*(?:Hukuk|Ceza)[\s\W]+Dairesi)(?:\s*['’]?(?:nin|nın|nun|nün|in|ın|un|ün))?[\s\W,;]*(\d{4})\s*[\/\-\u2013\u2014]\s*(\d+)[\s\W]*E\.?[\s\W,;]*(\d{4})\s*[\/\-\u2013\u2014]\s*(\d+)[\s\W]*K\.?(?:\s*\])?/gi;

  return text.replace(regex, (match, courtName, eYear, eNo, kYear, kNo) => {
    // 1. TEMİZLİK: Match içindeki köşeli parantezleri (hem baştan hem sondan) tamamen soy.
    // Böylece "[[Yargıtay...]]" gibi iç içe giren bozuk yapılar oluşmaz.
    let label = match.trim();
    while (label.startsWith("[") || label.endsWith("]")) {
        if (label.startsWith("[")) label = label.slice(1).trim();
        if (label.endsWith("]")) label = label.slice(0, -1).trim();
    }

    // 2. SLUG OLUŞTURMA
    const trMap = { "ı": "i", "İ": "i", "ş": "s", "Ş": "s", "ç": "c", "Ç": "c", "ö": "o", "Ö": "o", "ü": "u", "Ü": "u", "ğ": "g", "Ğ": "g" };
    const normalizeTr = (str) => (str || "").replace(/[*_]/g, "").replace(/[ıİşŞçÇöÖüÜğĞ]/g, c => trMap[c] || c).toLowerCase();

    // courtName içindeki bold (**) veya diğer markdown karakterlerini temizle
    let cleanCourtName = courtName.replace(/[*_]/g, "").trim();

    let courtSlug = normalizeTr(cleanCourtName)
      .replace(/\./g, "")      // Noktaları kaldır
      .replace(/\s+/g, "-");   // Boşlukları tire yap

    // Slug formatı: hukuk-genel-kurulu__2014-7448E_2015-1504K
    const slug = `${courtSlug}__${eYear}-${eNo}E_${kYear}-${kNo}K`;
    
    // 3. SONUÇ: Temizlenmiş etiket + Link
    return `[${label}](/kararlar/${slug})`;
  });
}

// --- Ana Hook ---
export function useAnalysisBot() {
  const { data: session, update } = useSession();

  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const analysisEndRef = useRef(null);
  const [confirmDel, setConfirmDel] = useState({ open: false, id: null });
  const [openMevzuat, setOpenMevzuat] = useState(null);

  // Mevzuat Cache
  const [maddeCache, setMaddeCache] = useState({});
  const pendingMadde = useRef(new Set());

  // Persistence Refs
  const lastComputedNextRef = useRef(null);
  const persistedOnceRef = useRef(false);
  const saveSeq = useRef(0);
  const latestCommitted = useRef(0);

  // --- Mevzuat Popover Logic ---
  function calcMevzuatPopover(el) {
    if (!el || !el.getBoundingClientRect) return { top: 0, left: 0, placement: 'bottom' };
    const GAP = 10;
    const POP_W = Math.min(672, Math.floor(window.innerWidth * 0.92));
    const POP_H = 320;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spaceLeft = rect.left;
    const spaceRight = vw - rect.right;
    const spaceTop = rect.top;

    let placement, top, left;
    if (spaceLeft >= POP_W + GAP) {
      placement = 'left'; top = Math.round(rect.top + rect.height / 2); left = Math.round(rect.left - GAP);
    } else if (spaceRight >= POP_W + GAP) {
      placement = 'right'; top = Math.round(rect.top + rect.height / 2); left = Math.round(rect.right + GAP);
    } else if (spaceTop >= POP_H + GAP) {
      placement = 'top'; top = Math.round(rect.top - GAP); left = Math.round(rect.left + rect.width / 2);
    } else {
      placement = 'bottom';
      top = Math.round(rect.bottom + GAP);
      left = Math.round(rect.left + rect.width / 2 - POP_W / 2);
    }
    return { top, left, placement };
  }

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
      setOpenMevzuat(prev => { if (!prev?.el) return prev; const pos = calcMevzuatPopover(prev.el); return { ...prev, ...pos }; });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [openMevzuat?.el]);

  // --- API & Persistence ---
  const saveChats = async (nextChats, reason = "unspecified") => {
    const payload = JSON.parse(JSON.stringify(nextChats ?? []));
    const seq = ++saveSeq.current;
    if (JSON.stringify({ chats: payload }).length > 800 * 1024) console.warn("Large payload");
    try {
      const res = await fetch("/api/chats", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chats: payload }), cache: "no-store", credentials: "include",
      });
      if (!res.ok) return;
      if (seq > latestCommitted.current) latestCommitted.current = seq;
    } catch (e) { console.error("saveChats error", e); }
  };

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const r = await fetch("/api/chats", { cache: "no-store", credentials: "include" });
        const data = r.ok ? await r.json() : { chats: [] };
        let stored = (data?.chats || []).slice().sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
        if ((!stored || stored.length === 0) && typeof window !== "undefined") {
            try { const backup = JSON.parse(localStorage.getItem("chats_backup") || "[]"); if (Array.isArray(backup) && backup.length) stored = backup; } catch {}
        }
        setChats(prev => (prev && prev.length ? prev : stored));
        setActiveId(prev => { if (prev) return prev; let fromLs = null; try { fromLs = localStorage.getItem("active_chat_id"); } catch {} return stored.find(c => c?.id === fromLs) ? fromLs : (stored[0]?.id ?? null); });
      } catch (e) {
          try { const backup = JSON.parse(localStorage.getItem("chats_backup") || "[]"); if (Array.isArray(backup) && backup.length) { setChats(backup); setActiveId(backup[0]?.id); } } catch {}
      }
    })();
  }, [session]);

  useEffect(() => { try { if (Array.isArray(chats)) localStorage.setItem("chats_backup", JSON.stringify(chats)); } catch {} }, [chats]);
  useEffect(() => { try { if (activeId) localStorage.setItem("active_chat_id", activeId); } catch {} }, [activeId]);

  function createEmptyAnalysis(initialQuery = "") {
    const id = crypto.randomUUID();
    const title = initialQuery ? `${initialQuery.slice(0, 40)}${initialQuery.length > 40 ? "…" : ""}` : "Yeni";
    return { id, title, messages: initialQuery ? [{ id: crypto.randomUUID(), sender: "user", text: initialQuery }] : [], createdAt: new Date().toISOString() };
  }

  async function deleteChatById(id) {
    if (!id) return;
    const nextChats = chats.filter(c => c.id !== id);
    const idx = chats.findIndex(c => c.id === id);

    setChats(nextChats);

    if (activeId === id) {
      const candidate = nextChats[Math.min(idx, Math.max(0, nextChats.length - 1))];
      setActiveId(candidate?.id || null);
    }

    await saveChats(nextChats, "after-delete-local");

    try {
      await fetch(`/api/chats?id=${encodeURIComponent(id)}`, {
        method: "DELETE", cache: "no-store", credentials: "include"
      });
    } catch (e) { console.error("Delete API error", e); }
  }

  function buildWithInlineCitations(analysisText, ilgili_kararlar) {
    let enriched = analysisText || "";
    const citations = [];
    let counter = 1;
    const allDecisionProps = (ilgili_kararlar || []).map(k => k?.properties || {});

    (ilgili_kararlar || []).forEach(k => {
      const p = k?.properties || {};
      const typeLabel = p.type || p.mahkeme || "";
      const codeOnly  = p.code || deduceEsasKararFromProps(p) || p.orijinal_karar_id || "";
      if (!codeOnly) return;

      const displayCode = normalizeDecision(typeLabel, codeOnly);
      const slug = bestSlugTypeCodeFirst(p, allDecisionProps) || (p.orijinal_karar_id || p.dosya_adi || "");
      const court = deduceCourtLabelFromProps(p) || formatDecisionType(typeLabel);
      const escapeForRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const codeToRegexPart = (s) => escapeForRegex(s).replace(/\\-/g, "[-/]").replace(/\//g, "[-/]");

      const patterns = [];
      try { patterns.push(new RegExp(codeToRegexPart(codeOnly), "g")); } catch {}
      try { patterns.push(new RegExp(codeToRegexPart(`${displayCode}`), "g")); } catch {}

      for (const re of patterns) {
        if (re.test(enriched) && !citations.some(c => c.displayCode === displayCode)) {
          const url = slug ? `/kararlar/${encodeURIComponent(slug)}` : "";
          enriched = enriched.replace(re, url ? ` **[[${counter}]](${url})**` : ` **[[${counter}]]**`);
          citations.push({ number: counter, displayCode, slug, court, code: deduceEsasKararFromProps(p) || codeOnly });
          counter++;
          break;
        }
      }
    });

    if (citations.length) {
      enriched += "\n\n---\n\n### Metin İçi Atıflar\n\n";
      citations.forEach(c => {
        const label = [c.court || "", (c.court && (c.code || c.slug)) ? " · " : "", c.code || (c.slug || "")].join("");
        enriched += c.slug ? `**[${c.number}]**: [${label}](/kararlar/${encodeURIComponent(c.slug)})\n` : `**[${c.number}]**: ${label || c.displayCode}\n`;
      });
    }
    return enriched;
  }

  // --- ANALİZ BUTONU MANTIĞI ---
  async function handleAnalyze(e) {
    e?.preventDefault?.();
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    persistedOnceRef.current = false;
    const draft = createEmptyAnalysis(input.trim());
    setChats(prev => [draft, ...prev]);
    setActiveId(draft.id);

    try {
      const res = await fetch("/api/chats", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sorgu: input.trim(), chatId: draft.id }), cache: "no-store", credentials: "include",
      });

      // --- TOKEN / BAKİYE KONTROLÜ ---
      if (res.status === 402) {
        const errData = await res.json();
        if (errData.requirePayment) {
           if (confirm("Yetersiz Bakiye! Analiz yapmak için token satın almak ister misiniz?")) {
             window.location.href = "/paketler-ucretler"; 
           }
           // Hata mesajını chat'e bas
           setChats(prev => {
             const next = prev.map(c => c.id === draft.id ? { ...c, messages: [...(c.messages || []), { id: crypto.randomUUID(), sender: "bot", text: "İşlem durduruldu: Yetersiz bakiye." }] } : c);
             lastComputedNextRef.current = next;
             return next;
           });
           setIsLoading(false);
           return; 
        }
      }
      // -------------------------------

      const raw = await res.text();
      const payload = raw ? JSON.parse(raw) : {};
      
      if (!res.ok || payload?.ok === false) throw new Error(payload.message || "API Error");

      const data = payload?.dataFromPython ?? payload ?? {};

      if (payload?.tokenRemaining !== undefined) {
        await update({ tokenBalance: payload.tokenRemaining });
      }

      const analysisText = data?.sonuc_ve_degerlendirme ?? null;
      const botId = crypto.randomUUID();

      setChats(prev => {
        const next = prev.map(c => c.id === draft.id ? {
            ...c,
            messages: [...(c.messages || []), { id: botId, sender: "bot", text: analysisText || "Analiz bulunamadı." }],
            sources: {
              mevzuat: (data?.ilgili_mevzuat_parsed || []).map((src) => {
                const read = (k) => (src?.[k] ?? "").toString().trim();
                const props = src?.properties || {};
                const readP = (k) => (props?.[k] ?? "").toString().trim();
                const mevzuat_adi = read("mevzuat_adi") || read("kanun_adi") || read("adi") || read("name") || readP("title") || "Mevzuat";
                const maddeMetinRaw = read("maddeMetin") || readP("maddeMetin") || "";
                return {
                  mevzuat_adi,
                  madde: read("madde_no") || read("madde") || readP("madde_no") || "",
                  baslik: read("madde_baslik") || readP("baslik") || "",
                  metin: maddeMetinRaw ? stripHtmlTags(maddeMetinRaw) : "",
                  maddeMetin: maddeMetinRaw ? stripHtmlTags(maddeMetinRaw) : "",
                  raw: src,
                };
              }),
              kararlar: (data?.ilgili_kararlar || []).map(k => ({ id: k?.properties?.orijinal_karar_id, dosya: k?.properties?.dosya_adi, tip: k?.properties?.kaynak_turu, code: k?.properties?.code, type: k?.properties?.type })),
              karar_kartlari: data?.karar_kartlari || [],
              makaleler: [],
            },
            updatedAt: new Date().toISOString(),
          } : c
        );
        lastComputedNextRef.current = next;
        return next;
      });

      if (lastComputedNextRef.current && !persistedOnceRef.current) {
        await saveChats(lastComputedNextRef.current, "after-plain");
        persistedOnceRef.current = true;
      }

      try {
        // Dipnotları (citation) işle. autoLinkDecisionsInText artık activeMarkdown içinde otomatik çalışıyor,
        // ama veritabanına kaydederken de işlenmiş halini saklayabiliriz veya olduğu gibi bırakabiliriz.
        // Karışıklığı önlemek için burada SADECE dipnotları ekleyelim.
        // Linkleme işini 'display' zamanında (render) activeMarkdown hook'una bıraktık.
        const enriched = buildWithInlineCitations(analysisText || "", data?.ilgili_kararlar || []);
        
        setChats(prev => {
          const next = prev.map(c => c.id === draft.id ? { ...c, messages: c.messages.map(m => (m.id === botId ? { ...m, text: enriched } : m)) } : c);
          lastComputedNextRef.current = next;
          return next;
        });
        if (lastComputedNextRef.current) {
          await saveChats(lastComputedNextRef.current, "after-enrich");
          persistedOnceRef.current = true;
        }
      } catch (e) { console.error("Enrich fail", e); }

    } catch (err) {
      console.error(err);
      const errText = err.message.includes("Yeterli tokeniniz yok") 
        ? "Yeterli tokeniniz yok. İşlem yapmak için lütfen token satın alın." 
        : "Analiz yapılamadı veya yetkisiz erişim.";
        
      setChats(prev => {
        const next = prev.map(c => c.id === draft.id ? { ...c, messages: [...(c.messages || []), { id: crypto.randomUUID(), sender: "bot", text: errText }] } : c);
        lastComputedNextRef.current = next;
        return next;
      });
    } finally {
        if (lastComputedNextRef.current && !persistedOnceRef.current) await saveChats(lastComputedNextRef.current);
        setIsLoading(false);
        setInput("");
        setTimeout(() => analysisEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    }
  }

  async function ensureMaddeInCache(kanun = "", madde = "") {
    if (!kanun || !madde) return;
    const key = mevzuatCacheKey(kanun, madde);
    if (maddeCache[key] || pendingMadde.current.has(key)) return;
    pendingMadde.current.add(key);
    try {
      const url = `/api/mevzuat/madde?kanun=${encodeURIComponent(kanun)}&madde=${encodeURIComponent(madde)}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      const metin = sanitizeMaddeTextFull(data?.maddeMetin || "");
      setMaddeCache(prev => ({ ...prev, [key]: metin }));
    } catch (e) { setMaddeCache(prev => ({ ...prev, [key]: "" })); } finally { pendingMadde.current.delete(key); }
  }

  function getMevzuatPreview(entry) {
    if (!entry) return "";
    const kanun = entry.mevzuat_adi || entry.kanun_adi || entry.name || "";
    const madde = entry.madde || entry.madde_no || "";
    if (kanun && madde) {
      const key = mevzuatCacheKey(kanun, madde);
      if (typeof maddeCache[key] === "string" && maddeCache[key].length) return maddeCache[key];
    }
    return sanitizeMaddeTextFull(entry?.maddeMetin || entry?.metin || "");
  }

  const active = useMemo(() => chats.find(c => c.id === activeId) || null, [chats, activeId]);

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter(c => c.title?.toLowerCase().includes(term));
  }, [chats, search]);

  // --- KRİTİK DEĞİŞİKLİK BURADA: ---
  // Metin ekrana basılmak üzere hazırlanırken (render time) otomatik linkleme yapılıyor.
  // Böylece eski kayıtlar ve sayfa yenilemeleri dahil her durumda linkler çalışır.
  const activeMarkdown = useMemo(() => {
    const msgs = active?.messages || [];
    let rawText = "";
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (String(msgs[i]?.sender || "").toLowerCase() !== "user") {
        rawText = msgs[i]?.text || "";
        break;
      }
    }
    // Metni otomatik olarak işle ve linkleri oluştur
    return autoLinkDecisionsInText(rawText);
  }, [active]);

  const activeUserQuery = useMemo(() => {
    const msgs = active?.messages || [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (String(msgs[i]?.sender || "").toLowerCase() === "user") return msgs[i]?.text || "";
    }
    return "";
  }, [active]);

  useEffect(() => {
    const arr = active?.sources?.mevzuat || [];
    arr.forEach((m) => ensureMaddeInCache(m?.mevzuat_adi || m?.kanun_adi, m?.madde || m?.madde_no));
  }, [active?.sources?.mevzuat]);

  return {
    chats, activeId, setActiveId, input, setInput, isLoading, search, setSearch,
    analysisEndRef, confirmDel, setConfirmDel, openMevzuat, setOpenMevzuat,
    active, filteredChats, activeMarkdown, activeUserQuery,
    handleAnalyze, deleteChatById, createEmptyAnalysis, calcMevzuatPopover, getMevzuatPreview,
    utils: {
        cleanTitle, slugifyMevzuatAdi, maddeAnchor, looksLikeSlug, slugFromTypeAndCode,
        bestSlugFromProps, deduceEsasKararFromProps, deduceCourtLabelFromProps
    }
  };
}