// /app/bot/page.js
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const steps = [
  "Mevzuat taranıyor...",
  "Kararlar taranıyor...",
  "Emsal kararlar inceleniyor...",
  "Analiz tamamlanıyor...",
];
const colors = ["#FFA500", "#FFD700", "#FF69B4"];

const LoadingSteps = () => {
  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => {
    const it = setInterval(() => {
      setStepIndex((i) => (i + 1 < steps.length ? i + 1 : i));
    }, 7000);
    return () => clearInterval(it);
  }, []);
  const currentStep = steps[stepIndex];
  return (
    <div className="flex flex-col items-center justify-center text-white mt-6">
      <div className="text-lg font-medium text-white">{currentStep}</div>
      <div className="flex mt-2">
        {colors.map((color, i) => (
          <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.3}s`, color, fontSize: "1.5rem", margin: "0 0.3rem" }}>•</span>
        ))}
      </div>
    </div>
  );
};

export default function AnalysisPage() {
  const { data: session } = useSession();

  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const endRef = useRef(null);
  const [confirmDel, setConfirmDel] = useState({ open: false, id: null });

  // Popover state for mevzuat madde preview
  // Shape: { key: string, el: HTMLElement, top: number, left: number, placement: 'left'|'right'|'top'|'bottom' } | null
  const [openMevzuat, setOpenMevzuat] = useState(null);

  // Calculate popover position relative to the badge (viewport coords for position:fixed)
  function calcMevzuatPopover(el) {
    if (!el || !el.getBoundingClientRect) return { top: 0, left: 0, placement: 'bottom' };
    const GAP = 10;
    const POP_W = Math.min(672, Math.floor(window.innerWidth * 0.92)); // 42rem or 92vw
    const POP_H = 320; // approx height for placement decision
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceLeft   = rect.left;
    const spaceRight  = vw - rect.right;
    const spaceTop    = rect.top;
    const spaceBottom = vh - rect.bottom;

    let placement, top, left;

    // Prefer LEFT, then RIGHT, then TOP, else BOTTOM
    if (spaceLeft >= POP_W + GAP) {
      placement = 'left';
      top  = Math.round(rect.top + rect.height / 2);
      left = Math.round(rect.left - GAP);
    } else if (spaceRight >= POP_W + GAP) {
      placement = 'right';
      top  = Math.round(rect.top + rect.height / 2);
      left = Math.round(rect.right + GAP);
    } else if (spaceTop >= POP_H + GAP) {
      placement = 'top';
      top  = Math.round(rect.top - GAP);
      left = Math.round(rect.left + rect.width / 2);
    } else {
      placement = 'bottom';
      top  = Math.round(rect.bottom + GAP);
      left = Math.round(rect.left + rect.width / 2);
    }
    return { top, left, placement };
  }

  useEffect(() => {
    function onDocClick(e) {
      // Close only if click is OUTSIDE any mevzuat popover wrapper
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

  // Reposition popover on scroll/resize so it follows the badge
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

  // Cache for madde metin fetched from API
  const [maddeCache, setMaddeCache] = useState({});
  const pendingMadde = useRef(new Set());

  // persist sequencing
  const lastComputedNextRef = useRef(null);
  const persistedOnceRef = useRef(false);
  const saveSeq = useRef(0);
  const latestCommitted = useRef(0);

  const saveChats = async (nextChats, reason = "unspecified") => {
    const payload = JSON.parse(JSON.stringify(nextChats ?? []));
    const seq = ++saveSeq.current;
    console.log("[saveChats] begin seq=", seq, "items=", payload.length, "reason=", reason);
    try {
      const res = await fetch("/api/chats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chats: payload }),
        keepalive: true,
        cache: "no-store",
        credentials: "include",
      });
      const text = await res.text().catch(() => "");
      console.log("[saveChats] end   seq=", seq, "status=", res.status, "body=", text.slice(0, 300));
      if (!res.ok) return;
      if (seq > latestCommitted.current) latestCommitted.current = seq;
    } catch (e) {
      console.error("[saveChats] network error seq=", seq, e);
    }
  };

  const active = useMemo(() => chats.find(c => c.id === activeId) || null, [chats, activeId]);

  // Initial load
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      console.log("[boot] fetching chats…");
      try {
        const r = await fetch("/api/chats", { cache: "no-store", credentials: "include" });
        const data = r.ok ? await r.json() : { chats: [] };
        console.log("[boot] GET /api/chats status=", r.status, "keys=", Object.keys(data || {}));
        let stored = (data?.chats || []).slice()
          .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));

        if ((!stored || stored.length === 0) && typeof window !== "undefined") {
          console.log("[boot] no server chats, trying local backup…");
          try {
            const backup = JSON.parse(localStorage.getItem("chats_backup") || "[]");
            if (Array.isArray(backup) && backup.length) {
              stored = backup.slice().sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
            }
          } catch {}
        }
        if (cancelled) return;

        setChats(prev => (prev && prev.length ? prev : stored));
        setActiveId(prev => {
          if (prev) return prev;
          let fromLs = null;
          try { fromLs = localStorage.getItem("active_chat_id"); } catch {}
          const pick = stored.find(c => c?.id === fromLs) ? fromLs : (stored[0]?.id ?? null);
          return pick;
        });
      } catch (e) {
        console.error("[boot] GET /api/chats failed", e);
        if (cancelled) return;
        try {
          const backup = JSON.parse(localStorage.getItem("chats_backup") || "[]");
          if (Array.isArray(backup) && backup.length) {
            setChats(prev => (prev && prev.length ? prev : backup));
            setActiveId(prev => prev ?? backup[0]?.id ?? null);
          }
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    try { if (Array.isArray(chats)) localStorage.setItem("chats_backup", JSON.stringify(chats)); } catch {}
  }, [chats]);

  useEffect(() => {
    try { if (activeId) localStorage.setItem("active_chat_id", activeId); } catch {}
  }, [activeId]);

  function createEmptyAnalysis(initialQuery = "") {
    const id = crypto.randomUUID();
    const title = initialQuery ? `${initialQuery.slice(0, 40)}${initialQuery.length > 40 ? "…" : ""}` : "Yeni";
    return {
      id,
      title,
      messages: initialQuery ? [{ id: crypto.randomUUID(), sender: "user", text: initialQuery }] : [],
      createdAt: new Date().toISOString(),
    };
  }

  function onDeleteClick(e, id) {
    e?.stopPropagation?.(); if (!id) return;
    setConfirmDel({ open: true, id });
  }

  async function deleteChatById(id) {
    if (!id) return;
    let nextChats;
    setChats(prev => {
      const idx = prev.findIndex(c => c.id === id);
      nextChats = prev.filter(c => c.id !== id);
      if (activeId === id) {
        const candidate = nextChats[Math.min(idx, Math.max(0, nextChats.length - 1))];
        setActiveId(candidate?.id || null);
      }
      return nextChats;
    });
    await saveChats(nextChats, "after-delete-local");
    try {
      const delRes = await fetch(`/api/chats?id=${encodeURIComponent(id)}`, {
        method: "DELETE", cache: "no-store", credentials: "include",
      });
      console.log("[delete] status", delRes.status);
      if (!delRes.ok) {
        await fetch("/api/chats", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chats: JSON.parse(JSON.stringify(nextChats || [])) }),
          cache: "no-store",
          credentials: "include",
        });
      }
    } catch {}
  }

  async function handleAnalyze(e) {
    e?.preventDefault?.();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    persistedOnceRef.current = false;
    console.time("[analyze] total");

    const draft = createEmptyAnalysis(input.trim());
    setChats(prev => [draft, ...prev]);
    setActiveId(draft.id);

    try {
      console.log("[analyze] POST /api/chats body keys", ["sorgu"]);
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sorgu: input.trim() }),
        cache: "no-store",
        credentials: "include",
      });

      const raw = await res.text();
      let payload;
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch (e) {
        console.error("[analyze] invalid JSON from /api/chats", e, raw?.slice(0, 500));
        throw new Error("API_JSON_PARSE");
      }

      // Insert diagnostic log for analysis text length
      try {
        const diagSonuc = (payload?.dataFromPython?.sonuc_ve_degerlendirme ?? payload?.sonuc_ve_degerlendirme ?? "");
        console.log("[analyze] diag sonuc len=", typeof diagSonuc === "string" ? diagSonuc.length : -1);
      } catch {}

      console.log("[analyze] /api/chats status=", res.status, "keys=", Object.keys(payload || {}));

      if (!res.ok || payload?.ok === false) {
        const reason = payload?.error || `HTTP_${res.status}`;
        const diag = payload?.diag || payload;
        throw new Error(`API_ERROR:${reason}:${JSON.stringify(diag || {})}`);
      }

      const data = payload?.dataFromPython ?? payload ?? {};
      const analysisText = data?.sonuc_ve_degerlendirme ?? null;

      // UI güncelle (çıplak metin, sonra zenginleştirme)
      const botId = crypto.randomUUID();
      setChats(prev => {
        const next = prev.map(c =>
          c.id === draft.id
            ? {
                ...c,
                messages: [...(c.messages || []), { id: botId, sender: "bot", text: analysisText || "Analiz metni bulunamadı." }],
                sources: {
                  mevzuat: (data?.ilgili_mevzuat_parsed || []).map((src) => {
                    const read = (k) => (src?.[k] ?? "").toString().trim();
                    const props = src?.properties || {};
                    const readP = (k) => (props?.[k] ?? "").toString().trim();

                    const mevzuat_adi =
                      read("mevzuat_adi") || read("kanun_adi") || read("adi") || read("name") || read("title") ||
                      readP("mevzuat_adi") || readP("kanun_adi") || readP("adi") || readP("name") || readP("title") ||
                      "Mevzuat";

                    const madde =
                      read("madde_no") || read("madde") || readP("madde_no") || readP("madde") || "";

                    const baslik =
                      read("madde_baslik") || read("baslik") || readP("madde_baslik") || readP("baslik") || "";

                    // Only use maddeMetin from top-level or properties
                    const maddeMetinRaw = read("maddeMetin") || readP("maddeMetin") || "";
                    const metin = maddeMetinRaw ? stripHtmlTags(maddeMetinRaw) : "";

                    return {
                      mevzuat_adi: mevzuat_adi || "Mevzuat",
                      madde: madde || undefined,
                      baslik: baslik || undefined,
                      metin: metin || undefined,
                      maddeMetin: metin || undefined,
                      raw: src,
                    };
                  }),
                  kararlar: (() => {
                    const uniq = new Map();
                    (data?.ilgili_kararlar || []).forEach(k => {
                      const id = k?.properties?.orijinal_karar_id || k?.properties?.dosya_adi;
                      if (!id) return;
                      if (!uniq.has(id)) {
                        uniq.set(id, {
                          id,
                          dosya: k?.properties?.dosya_adi,
                          tip:   k?.properties?.kaynak_turu,
                          metin: k?.properties?.metin_parcasi,
                          code:  k?.properties?.code || "",
                          type:  k?.properties?.type || "",
                        });
                      }
                    });
                    return [...uniq.values()];
                  })(),
                  karar_kartlari: data?.karar_kartlari || [],
                  makaleler: (data?.ilgili_makaleler || []).map(a => ({
                    dosya: a?.properties?.dosya_adi,
                    metin: a?.properties?.metin_parcasi,
                  })),
                },
                updatedAt: new Date().toISOString(),
              }
            : c
        );
        lastComputedNextRef.current = next;
        return next;
      });

      // Persist once right after plain bot message so we see it in PUT logs
      if (lastComputedNextRef.current && !persistedOnceRef.current) {
        await saveChats(lastComputedNextRef.current, "after-plain-bot");
        persistedOnceRef.current = true;
      }

      // Zenginleştirme (atıf) — hata verirse UI devam eder
      try {
        const enriched = buildWithInlineCitations(analysisText || "", data?.ilgili_kararlar || []);
        setChats(prev => {
          const next = prev.map(c =>
            c.id === draft.id
              ? {
                  ...c,
                  messages: c.messages.map(m => (m.id === botId ? { ...m, text: enriched } : m)),
                }
              : c
          );
          lastComputedNextRef.current = next;
          return next;
        });
        // Persist enriched version for final state
        if (lastComputedNextRef.current) {
          await saveChats(lastComputedNextRef.current, "after-enrich");
          persistedOnceRef.current = true;
        }
      } catch (enrichErr) {
        console.error("[analyze] enrich failed", enrichErr);
      }
    } catch (err) {
      console.error("[analyze] FAILED", err);
      const errText = `Hukuki analiz oluşturulurken bir hata meydana geldi.\n\nDetay: ${String(err?.message || err).slice(0, 400)}`;
      setChats(prev => {
        const next = prev.map(c =>
          c.id === draft.id ? { ...c, messages: [...(c.messages || []), { id: crypto.randomUUID(), sender: "bot", text: errText }] } : c
        );
        lastComputedNextRef.current = next;
        return next;
      });
    } finally {
      try {
        const toPersist = lastComputedNextRef.current;
        if (toPersist && !persistedOnceRef.current) {
          await saveChats(toPersist, "finally");
          persistedOnceRef.current = true;
        }
      } catch (pErr) {
        console.error("[analyze] persist failed", pErr);
      }
      console.timeEnd("[analyze] total");
      setIsLoading(false);
      setInput("");
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  // ---- helpers ----
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
        if (c.slug) {
          enriched += `**[${c.number}]**: [${label}](/kararlar/${encodeURIComponent(c.slug)})\n`;
        } else {
          enriched += `**[${c.number}]**: ${label || c.displayCode}\n`;
        }
      });
    }
    return enriched;
  }

  function formatDecisionType(t = "") {
    if (!t) return "";
    return t.replace(/^Hukuk\s+Genel\s+Kurulu\b/i, "HGK");
  }
  function normalizeDecision(typeRaw = "", codeRaw = "") {
    let type = (typeRaw || "").trim();
    let code = (codeRaw || "").trim();
    code = code.replace(/^[—–-]\s*/, "");
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
    const mahkeme = clean(p.mahkeme || p.type || "");
    if (mahkeme) return mahkeme;
    const fnameRaw = clean(p.orijinal_karar_id || p.dosya_adi || p.dosya || p.slug);
    if (!fnameRaw) return "";
    const base = fnameRaw.replace(/\.txt$/i, "");
    let m = base.match(/^(\d+)_Hukuk_Dairesi_/i);
    if (m) return `${m[1]}. Hukuk Dairesi`;
    m = base.match(/^(\d+)_Ceza_Dairesi_/i);
    if (m) return `${m[1]}. Ceza Dairesi`;
    m = base.match(/^(Hukuk|Ceza)_Genel_Kurulu_/i);
    if (m) return `${m[1]} Genel Kurulu`;
    return "";
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

  // New: slugFromTypeAndCode
  function slugFromTypeAndCode(typeRaw = "", codeRaw = "") {
    // Turkish normalization
    const trMap = {
      "ı": "i", "İ": "i", "ş": "s", "Ş": "s", "ç": "c", "Ç": "c",
      "ö": "o", "Ö": "o", "ü": "u", "Ü": "u", "ğ": "g", "Ğ": "g"
    };
    function normalizeTr(str) {
      return (str || "").replace(/[ıİşŞçÇöÖüÜğĞ]/g, c => trMap[c] || c);
    }
    let type = normalizeTr(typeRaw || "").trim();
    // Remove leading "Yargıtay" (case-insensitive), dots, spaces->-, to lower, collapse --
    type = type.replace(/^Yargıtay\s*/i, "");
    type = type.replace(/\./g, "");
    type = type.replace(/\s+/g, "-");
    type = type.toLowerCase();
    type = type.replace(/-+/g, "-");
    const typeSlug = type;
    // Parse code: E and K
    const code = normalizeTr(codeRaw || "").trim();
    // Regex: (year1)-(E), (year2)-(K)
    const m = code.match(/^(?:.*?)(\d{4})\s*[/-]\s*([0-9A-Za-z-]+)\s*E\b.*?(\d{4})\s*[/-]\s*([0-9A-Za-z-]+)\s*K\b/i);
    if (!m) return "";
    const y1 = m[1], e = (m[2] || "").replace(/\s+/g, ""), y2 = m[3], k = (m[4] || "").replace(/\s+/g, "");
    const codeSlug = `${y1}-${e}E_${y2}-${k}K`;
    if (!typeSlug || !codeSlug) return "";
    return `${typeSlug}__${codeSlug}`;
  }

  // New: bestSlugTypeCodeFirst
  function bestSlugTypeCodeFirst(p = {}, allArr = []) {
    const code = deduceEsasKararFromProps(p);
    const court = deduceCourtLabelFromProps(p) || p.type || p.mahkeme || "";
    const slug = slugFromTypeAndCode(court, code);
    if (slug) return slug;
    return bestSlugFromProps(p, allArr);
  }

  function looksLikeSlug(s = "") {
    const base = String(s).replace(/\.txt$/i, "");
    if (!base) return false;
    // Old style: file-like
    if (/(Hukuk|Ceza)_(Dairesi|Genel_Kurulu)/i.test(base) && /E_/i.test(base) && /K\b/i.test(base)) return true;
    // New style: type__YYYY-EEE E_YYYY-KKKK K
    if (/__(\d{4})-[^_]+E_\d{4}-[^_]+K$/i.test(base)) return true;
    return false;
  }

  // --- Mevzuat helpers ---
  function slugifyMevzuatAdi(name = "") {
  const trMap = { "ı":"i","İ":"i","ş":"s","Ş":"s","ç":"c","Ç":"c","ö":"o","Ö":"o","ü":"u","Ü":"u","ğ":"g","Ğ":"g" };
  let s = (name || "").toString().trim();

  // Başındaki “XXXX sayılı / sayili / numaralı / no.lu …” öneklerini KALDIR
  s = s.replace(/^\s*\d+(?:\s*\/\s*\d+)?\s*(?:say[ıi]l[ıi]|numaral[ıi]|no\.?lu?)\s+/i, "");

  // Baştaki yalnız yıl/sayı varsa onu da indir
  s = s.replace(/^\s*\d{3,5}\s+/, "");

  // TR normalize + slug
  s = s.replace(/[ıİşŞçÇöÖüÜğĞ]/g, c => trMap[c] || c).toLowerCase();
  return s
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

  // Metin temizleyici (HTML -> düz metin, satır sonlarını korur)
  function stripHtmlTags(s = "") {
    // Preserve meaningful line breaks while stripping tags.
    // Handles both raw HTML (<br>, <p>) and HTML-escaped tags (&lt;br&gt;, &lt;p&gt;).
    let t = (s ?? "").toString();

    // Normalize Windows newlines first
    t = t.replace(/\r\n/g, "\n");

    // Convert common break tags to real newlines
    t = t
      // HTML-escaped variants
      .replace(/&lt;br\s*\/?&gt;/gi, "\n")
      .replace(/&lt;\/p\s*&gt;/gi, "\n")
      .replace(/&lt;p[^&gt;]*&gt;/gi, "")
      // Raw HTML variants
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p\s*>/gi, "\n")
      .replace(/<p[^>]*>/gi, "");

    // Strip any remaining tags (both escaped and raw)
    t = t
      .replace(/&lt;[^&gt;]*&gt;/g, " ")
      .replace(/<[^>]*>/g, " ");

    // Normalize nbsp and stray carriage returns
    t = t.replace(/&nbsp;/gi, " ").replace(/\r/g, "");

    // Collapse consecutive spaces/tabs but KEEP newlines
    t = t.replace(/[ \t\f\v]+/g, " ");

    // Trim spaces around newlines
    t = t.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n");

    // Collapse excessive blank lines to at most one empty line
    t = t.replace(/\n{3,}/g, "\n\n");

    return t.trim();
  }

  // Tam madde metnini döndürür; sonda kalan "1. Başlık", "I. Bölüm" vb. başlık kırıntılarını ayıklar
  function sanitizeMaddeTextFull(s = "") {
    const txt = stripHtmlTags(s || "");
    let out = txt;

    // Split and remove trailing heading-like lines
    const lines = out.split(/\r?\n/);

    const isUpperHeading = (t) =>
      /^(?:BİRİNCİ|İKİNCİ|ÜÇÜNCÜ|DÖRDÜNCÜ|BEŞİNCİ|ALTINCI|YEDİNCİ|SEKİZİNCİ|DOKUZUNCU|ONUNCU)\s+(?:KİTAP|BÖLÜM|KISIM|AYRIM)\b/.test(t);

    const isOutline = (t) =>
      /^(?:[IVXLCDM]+|[0-9]+|[A-ZÇĞİÖŞÜ])\.\s+\S/.test(t); // I., 1., A. + metin

    // Sondaki başlık görünümlü satırları at
    while (lines.length) {
      const last = (lines[lines.length - 1] || "").trim();
      if (!last) { lines.pop(); continue; }
      if (isOutline(last) || isUpperHeading(last)) {
        lines.pop();
        while (lines.length && !lines.length == 0 && !lines[lines.length - 1].trim()) lines.pop();
        while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
        continue;
      }
      break;
    }

    out = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

    // --- NEW: trailing inline heading fragments at the very end of the text ---
    // Examples: "... reddedilmiş sayılır. 2. Süre", "... reddedilmiş sayılır. II.", "... — I. Başlık"
    // 1) Remove a dash followed by an outline-like token
    out = out.replace(/\s*[—–-]\s*(?=(?:[IVXLCDM]+|[0-9]+|[A-ZÇĞİÖŞÜ])\.)[^\n]*$/u, "");
    // 2) Remove "2. Süre", "II. Başlık", "A. Giriş" (short tail at end)
    out = out.replace(/\s*(?:\b(?:[IVXLCDM]+|[0-9]+|[A-ZÇĞİÖŞÜ])\.\s*[A-ZÇĞİÖŞÜ][^\n]{0,60})\s*$/u, "");
    // 3) Remove bare "II." / "2." tails
    out = out.replace(/\s*(?:\b(?:[IVXLCDM]+|[0-9]+))\.\s*$/u, "");

    return out.trim();
  }

  function mevzuatCacheKey(kanun = "", madde = "") {
    const id = (madde || "").toString().match(/\d+/)?.[0] || (madde || "").toString();
    return `${slugifyMevzuatAdi(kanun || "")}::${id}`;
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
    } catch (e) {
      console.warn("[mevzuat] fetch madde failed", kanun, madde, e);
      setMaddeCache(prev => ({ ...prev, [key]: "" }));
    } finally {
      pendingMadde.current.delete(key);
    }
  }

  // Ham objeden sadece maddeMetin'i çek
  function extractMevzuatTextFromAny(raw) {
    const v = raw?.maddeMetin || raw?.properties?.maddeMetin || "";
    return stripHtmlTags(String(v || ""));
  }

  // Önizleme değil: TAM madde metni (temizlenmiş)
  function getMevzuatPreview(entry) {
    if (!entry) return "";
    const kanun = entry.mevzuat_adi || entry.kanun_adi || entry.name || "";
    const madde = entry.madde || entry.madde_no || "";
    if (kanun && madde) {
      const key = mevzuatCacheKey(kanun, madde);
      const cached = maddeCache[key];
      if (typeof cached === "string" && cached.length) return cached;
    }
    if (entry?.maddeMetin) return sanitizeMaddeTextFull(entry.maddeMetin);
    if (entry?.metin) return sanitizeMaddeTextFull(entry.metin);
    return sanitizeMaddeTextFull(extractMevzuatTextFromAny(entry?.raw ?? entry));
  }

  function maddeAnchor(madde) {
    const raw = (madde ?? "").toString();
    // Prefer first number; fallback to clean text
    const num = (raw.match(/\d+/)?.[0] ?? raw)
      .toString()
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
    return num ? `#madde-${num}` : "";
  }

  function shorten(s = "", max = 420) {
    const txt = (s || "").toString().replace(/\s+/g, " ").trim();
    if (!txt) return "";
    if (txt.length <= max) return txt;
    const slice = txt.slice(0, max);
    return slice.replace(/[,;.:!?]?\s+\S*$/, "") + "…";
  }

  function excerptWords(s = "", maxWords = 50) {
    const txt = (s || "").toString().replace(/\s+/g, " ").trim();
    if (!txt) return "";
    const words = txt.split(" ");
    if (words.length <= maxWords) return txt;
    return words.slice(0, maxWords).join(" ") + "…";
  }
  function cleanTitle(title = "") {
    return (title || "").replace(/^\s*Analiz\s*[—–-]\s*/i, "").trim();
  }

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter(c => c.title?.toLowerCase().includes(term));
  }, [chats, search]);

  const activeMarkdown = useMemo(() => {
    const msgs = active?.messages || [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      const s = String(msgs[i]?.sender || "").toLowerCase();
      if (s && s !== "user") return msgs[i]?.text || "";
    }
    return "";
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
    arr.forEach((m) => {
      const kanun = m?.mevzuat_adi || m?.kanun_adi || m?.name || "";
      const madde = m?.madde || m?.madde_no || "";
      if (kanun && madde) {
        // Her zaman sunucudan tam metni çekmeye çalış (satır sonlarını koruyan sürüm).
        // ensureMaddeInCache kendi içinde cache/pending kontrolü yapıyor.
        ensureMaddeInCache(kanun, madde);
      }
    });
  }, [active?.sources?.mevzuat]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100">
      <header className="sticky top-0 z-20 bg-[#0f1a2b] text-white border-b border-cyan-500">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-cyan-600 text-white grid place-items-center shadow"><span className="font-bold">A</span></div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Analiz Bot Pro</h1>
              <p className="text-xs text-slate-200">Özel eğitilmiş botumuzdan istediğiniz konuya ilişkin analiz isteyin.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded-full bg-[#1f2a3a] text-white">Toplam: {chats.length}</span>
            <span className="px-2 py-1 rounded-full bg-[#1f2a3a] text-white">Aktif: {active ? 1 : 0}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5">
        <aside className="rounded-2xl bg-slate-800 shadow-sm border border-slate-700 p-3 lg:sticky lg:top-16 h-fit text-slate-100 lg:-ml-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Son Analizler</h2>
            <button
              className="text-sm px-2 py-1 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
              onClick={() => {
                const c = createEmptyAnalysis("");
                setChats(prev => [c, ...prev]);
                setActiveId(c.id);
              }}
            >Yeni</button>
          </div>
          <div className="relative mb-3">
            <input
              placeholder="Listede ara…"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <ul className="space-y-2 max-h-[60vh] overflow-auto pr-1">
            {filteredChats.length === 0 && <li className="text-xs text-slate-500">Kayıt bulunamadı.</li>}
            {filteredChats.map(item => (
              <li key={item.id}>
                <div className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <button
                    onClick={() => setActiveId(item.id)}
                    title={cleanTitle(item.title) || (item.messages?.find(m => m.sender === "user")?.text || "Başlıksız")}
                    className={`min-w-0 text-left px-5 py-3 rounded-2xl border transition ${
                      item.id === activeId ? "bg-cyan-600 border-cyan-500 text-white" : "border-slate-700 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    <div className="text-base font-medium truncate">
                      {cleanTitle(item.title) || (item.messages?.find(m => m.sender === "user")?.text || "Başlıksız")}
                    </div>
                  </button>
                  <button
                    aria-label="Analizi Sil" title="Sil"
                    onClick={(e) => onDeleteClick(e, item.id)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600/20 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" /><path d="M10 11v6M14 11v6" /><path d="M9 6l1-2h4l1 2" /></svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-6">
          <form onSubmit={handleAnalyze} className="rounded-2xl bg-slate-800 shadow-sm border border-slate-700 p-4 text-slate-100">
            <div className="flex items-start gap-3">
              <div className="flex-1 relative">
                <label className={`block text-sm font-medium mb-2 transition-opacity duration-300 ${isLoading ? "opacity-0 pointer-events-none select-none" : "opacity-100"}`}>
                  Hukuki sorunuzu yazın
                </label>
                <div className="relative w-full">
                  <textarea
                    rows={4}
                    placeholder="Örn: Kamulaştırmasız el atma davalarında zamanaşımı işler mi?"
                    className={`w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-200 ${isLoading ? "text-center" : ""}`}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={isLoading}
                  />
                  {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none gap-2 bg-slate-900/80">
                      <div className="flex flex-col items-center justify-center gap-2 mt-6 w-full">
                        <LoadingSteps />
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-200">Yargıtay Kararlarına Atıf</span>
                  <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-200">Detaylı Analiz</span>
                  <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-200">Mevzuat-Karar Listesi</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button type="submit" disabled={isLoading || !input.trim()} className="px-4 py-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 disabled:bg-cyan-400 disabled:text-white/70 flex items-center justify-center">
                  {isLoading ? <div className="border-t-2 border-white border-solid rounded-full w-5 h-5 animate-spin mx-auto"></div> : "Analiz İste"}
                </button>
                <button type="button" className="px-4 py-2 rounded-xl border" onClick={() => setInput("")} disabled={isLoading}>Temizle</button>
              </div>
            </div>
          </form>

          <div className="rounded-2xl bg-slate-800 shadow-sm border border-slate-700 p-0 overflow-hidden text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3 bg-slate-900 text-slate-200">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Analiz Sonucu</div>
                <h3 className="text-base font-semibold truncate max-w-[60vw]">{cleanTitle(active?.title) || "Seçili analiz yok"}</h3>
              </div>
            </div>

            <div className="grid md:grid-cols-[minmax(0,1fr)_280px]">
              <div className="p-5 prose prose-invert max-w-none">
                {active ? (
                  activeMarkdown ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}
                      components={{
                        p: ({ node, ...props }) => <p className="leading-relaxed text-sm text-white" {...props} />,
                        strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />,
                      }}
                    >{activeMarkdown}</ReactMarkdown>
                  ) : <div className="text-sm text-slate-500">Bu analiz için henüz sonuç yok. Üstteki formdan sorgunuzu gönderin.</div>
                ) : <div className="text-sm text-slate-500">Sağdaki listeden bir analiz seçin veya yeni bir analiz başlatın.</div>}
                <div ref={endRef} />
              </div>

              <aside className="border-l border-slate-700 bg-slate-900 p-4 space-y-4">
                <Panel title="Soru"><div className="text-sm text-white whitespace-pre-wrap break-words">{activeUserQuery || "—"}</div></Panel>
                <Panel title="Mevzuat">
                  {active?.sources?.mevzuat?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {active.sources.mevzuat.map((m, i) => (
                        <div key={i} className="w-full space-y-1">
                          <div className="flex items-stretch gap-2" data-mevzuat-popover="1">
                            {(() => {
                const slug = slugifyMevzuatAdi(m.mevzuat_adi || "");
                const anchor = m.madde ? maddeAnchor(m.madde) : "";
                const href = slug ? `/mevzuat/${encodeURIComponent(slug)}${anchor}` : "";
                const popKey = `${slug || "mevzuat"}::${m.madde || ""}`;
                const preview = getMevzuatPreview(m); // Tam metin göster
                const titleText = (m.mevzuat_adi || "Mevzuat");
                const maddeNo = m.madde || "";

                // Name element stays a link (no tooltip)
                const NameEl = href ? (
                  <a
                    className="flex-1 inline-flex items-center px-3 py-2 rounded-lg bg-slate-700/60 text-[11px] text-slate-300 font-medium leading-tight min-h-[32px] hover:text-cyan-300 hover:bg-slate-600/60 transition-colors"
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e)=>e.stopPropagation()}
                  >
                    {titleText}
                  </a>
                ) : (
                  <span className="flex-1 inline-flex items-center px-3 py-2 rounded-lg bg-slate-700/60 text-[11px] text-slate-300 font-medium leading-tight min-h-[32px]">
                    {titleText}
                  </span>
                );

                // RETURN (badge + name + click popover)
                return (
                  <> 
                    {m.madde ? (
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
                    ) : null}

                    <div className="relative flex-1">
                      {NameEl}
                      {openMevzuat?.key === popKey && preview ? (
                        <div
                          data-mevzuat-popover="1"
                          role="dialog"
                          aria-modal="true"
                          onClick={(e)=>e.stopPropagation()}
                          className={
                            "fixed z-[999] w-[42rem] max-w-[92vw] max-h-[70vh] overflow-auto rounded-2xl " +
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
                          {/* Directional arrow */}
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
                          {/* Accent bar */}
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="text-slate-100">
                              <div className="font-semibold">{titleText}</div>
                              {maddeNo ? <div className="text-xs text-slate-300 mt-0.5">m. {maddeNo}</div> : null}
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
                          <div className="leading-snug whitespace-pre-wrap break-words font-medium">{preview}</div>
                        </div>
                      ) : null}
                    </div>
                  </>
                );
              })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">Kayıt yok</div>
                  )}
                </Panel>

                <Panel title="Yargıtay Kararları">
                  {(() => {
                    const pref = active?.sources?.karar_kartlari;
                    if (pref?.length) {
                      return (
                        <ul className="space-y-2">
                          {pref.map((r, i) => {
                            const autoSlug = slugFromTypeAndCode(r.type || "", r.code || "");
                            const slug = autoSlug || r.slug;
                            const hasSlug = slug && looksLikeSlug(slug);
                            const content = (
                              <span className="inline-flex flex-col leading-tight">
                                {r.type ? <span className="font-medium">{r.type}</span> : null}
                                <span className="tabular-nums text-slate-300">{r.code || slug}</span>
                              </span>
                            );
                            return (
                              <li key={i} className="text-[12px] leading-tight">
                                {hasSlug ? (
                                  <a
                                    className="text-white no-underline inline-flex flex-col leading-tight hover:text-cyan-400 hover:bg-cyan-500/10 hover:rounded px-1 transition-transform"
                                    href={`/kararlar/${encodeURIComponent(slug)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {content}
                                  </a>
                                ) : (
                                  content
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      );
                    }
                    if (active?.sources?.kararlar?.length) {
                      const allRaw = active.sources.kararlar || [];
                      const allProps = allRaw.map((k) => ({
                        code: k?.code || "",
                        type: k?.type || "",
                        orijinal_karar_id: k?.id || "",
                        dosya_adi: k?.dosya || "",
                        kaynak_turu: k?.tip || "",
                      }));

                      const dict = new Map();
                      for (const p of allProps) {
                        const typeRaw = String(p.kaynak_turu || "").toLowerCase();
                        const isSummaryName = /(?:\bözet\b|\bozet\b|gemini)/i.test(String(p.dosya_adi || ""));
                        const isSummary = typeRaw === "ai_ozet" || isSummaryName;
                        let slug = bestSlugFromProps(p, allProps);
                        const key = slug || String(p.orijinal_karar_id || p.dosya_adi || "").replace(/\.txt$/i, "");
                        if (!key) continue;
                        const code = deduceEsasKararFromProps(p);
                        const court = deduceCourtLabelFromProps(p);
                        const rec = dict.get(key) || { slug, code: "", court: "", hasOriginal: false };
                        if (!rec.slug && slug) rec.slug = slug;
                        if (code && !rec.code) rec.code = code;
                        if (court && !rec.court) rec.court = court;
                        if (!isSummary) rec.hasOriginal = true;
                        // Attach autogenerated slug if not present
                        const auto = slugFromTypeAndCode(rec.court || "", rec.code || "");
                        if (auto && !rec.slug) rec.slug = auto;
                        dict.set(key, rec);
                      }

                      const list = Array.from(dict.values())
                        .filter((r) => r.code || r.court || r.slug)
                        .sort((a, b) => (a.court || "").localeCompare(b.court || "") || (a.code || "").localeCompare(b.code || ""));

                      if (!list.length) return <div className="text-sm text-slate-500">Kayıt yok</div>;
                      return (
                        <ul className="space-y-2">
                          {list.map((r, i) => {
                            const hasSlug = r.slug && looksLikeSlug(r.slug);
                            const content = (
                              <span className="inline-flex flex-col leading-tight">
                                {r.court ? <span className="font-medium">{r.court}</span> : null}
                                <span className="tabular-nums text-slate-300">{r.code || r.slug}</span>
                              </span>
                            );
                            return (
                              <li key={i} className="text-[12px] leading-tight">
                                {hasSlug ? (
                                  <a
                                    className="text-white no-underline inline-flex flex-col leading-tight hover:text-cyan-400 hover:bg-cyan-500/10 hover:rounded px-1 transition-transform"
                                    href={`/kararlar/${encodeURIComponent(r.slug)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {content}
                                  </a>
                                ) : (
                                  <span className="inline-flex flex-col leading-tight">{content}</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      );
                    }
                    return <div className="text-sm text-slate-500">Kayıt yok</div>;
                  })()}
                </Panel>

              </aside>
            </div>
          </div>
        </section>
      </div>

      {/* ConfirmDialog */}
      {confirmDel.open ? (
        <ConfirmDialog
          title="Analizi silmek istiyor musunuz?"
          description={() => {
            const doomed = chats.find(c => c.id === confirmDel.id);
            const t = (doomed?.title || doomed?.messages?.find(m => m.sender === "user")?.text || "").trim();
            return t ? `“${t.slice(0, 80)}${t.length > 80 ? "…”" : "”"} silinecek.` : "";
          }}
          confirmText="Sil"
          cancelText="İptal"
          onCancel={() => setConfirmDel({ open: false, id: null })}
          onConfirm={() => {
            const id = confirmDel.id;
            setConfirmDel({ open: false, id: null });
            deleteChatById(id);
          }}
        />
      ) : null}
      <div ref={endRef} />
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 shadow-sm text-slate-100">
      <div className="px-3 py-2 text-xs font-semibold tracking-wide uppercase bg-[#0f1a2b] text-white">{title}</div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function ConfirmDialog({ title = "Emin misiniz?", description = "", confirmText = "Evet", cancelText = "Vazgeç", onCancel, onConfirm }) {
  const [desc, setDesc] = useState(typeof description === "function" ? description() : description);
  useEffect(() => { if (typeof description === "function") setDesc(description()); }, [description]);
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onCancel?.(); if (e.key === "Enter") onConfirm?.(); }
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, onConfirm]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl text-slate-100">
          <div className="px-5 py-4 border-b border-slate-700"><h4 className="text-lg font-semibold">{title}</h4></div>
          <div className="px-5 py-4">{desc ? <p className="text-sm text-slate-300">{desc}</p> : null}</div>
          <div className="px-5 py-4 border-t border-slate-700 flex items-center justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400">{cancelText}</button>
            <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400">{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}