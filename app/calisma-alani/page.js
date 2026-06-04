"use client";

import { useMemo, useState, useEffect, useRef } from "react";
const WORKSPACE_AI_API_BASE =
  process.env.NEXT_PUBLIC_WORKSPACE_AI_API_BASE || "http://45.141.151.34:5005";
const MAX_WORKSPACE_FILE_SIZE_MB = 10;
const MAX_WORKSPACE_FILE_SIZE_BYTES = MAX_WORKSPACE_FILE_SIZE_MB * 1024 * 1024;
const FIRST_TIER_MESSAGE_LIMIT = 3;
const FIRST_TIER_MESSAGE_COST = 1;
const NEXT_TIER_MESSAGE_COST = 2;

function getWorkspaceMessageTokenCost(existingUserMessageCount = 0) {
  return existingUserMessageCount < FIRST_TIER_MESSAGE_LIMIT
    ? FIRST_TIER_MESSAGE_COST
    : NEXT_TIER_MESSAGE_COST;
}

const WORKSPACE_MODES = [
  {
    id: "general_analysis",
    label: "Genel Analiz",
    helper: "Dosya, not ve karar bağlamıyla genel hukuki değerlendirme yapar.",
  },
  {
    id: "file_strategy",
    label: "Dosya Stratejisi",
    helper: "Dosyadan güçlü/zayıf yön, risk ve yol haritası çıkarır.",
  },
  {
    id: "contradiction_detection",
    label: "Çelişki Bul",
    helper: "Belgeler, beyanlar ve tarihler arasındaki tutarsızlıkları arar.",
  },
  {
    id: "evidence_analysis",
    label: "Delil Analizi",
    helper: "Delillerin ispat gücünü, eksikleri ve risklerini değerlendirir.",
  },
  {
    id: "document_summary",
    label: "Özetle",
    helper: "Yüklenen dosya ve çalışma bağlamını sade şekilde özetler.",
  },
  {
    id: "petition_draft",
    label: "Dilekçe Taslağı",
    helper: "Dosya bağlamına göre dilekçe/cevap taslağı üretmeye odaklanır.",
  },
];

function looksLikeDecisionSlug(value = "") {
  const base = String(value || "").replace(/\.txt$/i, "");
  if (!base) return false;
  if (/(Hukuk|Ceza)_(Dairesi|Genel_Kurulu)/i.test(base) && /E_/i.test(base) && /K\b/i.test(base)) return true;
  if (/__(\d{4})-[^_]+E_\d{4}-[^_]+K$/i.test(base)) return true;
  return false;
}

function slugFromDecisionTypeAndCode(typeRaw = "", codeRaw = "") {
  const trMap = { "ı": "i", "İ": "i", "ş": "s", "Ş": "s", "ç": "c", "Ç": "c", "ö": "o", "Ö": "o", "ü": "u", "Ü": "u", "ğ": "g", "Ğ": "g" };
  const normalizeTr = (str) => String(str || "").replace(/[ıİşŞçÇöÖüÜğĞ]/g, (c) => trMap[c] || c);

  let type = normalizeTr(typeRaw || "")
    .trim()
    .replace(/^Yargıtay\s*/i, "")
    .replace(/\./g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const code = normalizeTr(codeRaw || "").trim();
  const match = code.match(/^(?:.*?)(\d{4})\s*[/-]\s*([0-9A-Za-z-]+)\s*E\b.*?(\d{4})\s*[/-]\s*([0-9A-Za-z-]+)\s*K\b/i);
  if (!type || !match) return "";

  const [, eYear, eNo, kYear, kNo] = match;
  return `${type}__${eYear}-${String(eNo).replace(/\s+/g, "")}E_${kYear}-${String(kNo).replace(/\s+/g, "")}K`;
}

function getDecisionSlug(decision = {}) {
  const direct = String(decision.slug || decision.id || decision.kararId || "").replace(/\.txt$/i, "");
  if (looksLikeDecisionSlug(direct)) return direct;
  return slugFromDecisionTypeAndCode(decision.court || decision.type || decision.daire || "", decision.code || "");
}

function autoLinkDecisionsInText(text) {
  if (!text) return "";

  const regex = /(?:\[\s*)?(?:Yargıtay[\s\W]+)?((?:Hukuk|Ceza)[\s\W]+Genel[\s\W]+Kurulu|(?:\d+)\.?\s*(?:Hukuk|Ceza)[\s\W]+Dairesi)(?:\s*['’]?(?:nin|nın|nun|nün|in|ın|un|ün))?[\s\W,;]*(\d{4})\s*[\/\-\u2013\u2014]\s*(\d+)[\s\W]*E\.?[\s\W,;]*(\d{4})\s*[\/\-\u2013\u2014]\s*(\d+)[\s\W]*K\.?(?:\s*\])?/gi;

  return String(text).replace(regex, (match, courtName, eYear, eNo, kYear, kNo) => {
    if (/\]\(\/kararlar\//i.test(match)) return match;

    let label = match.trim();
    while (label.startsWith("[") || label.endsWith("]")) {
      if (label.startsWith("[")) label = label.slice(1).trim();
      if (label.endsWith("]")) label = label.slice(0, -1).trim();
    }

    const trMap = { "ı": "i", "İ": "i", "ş": "s", "Ş": "s", "ç": "c", "Ç": "c", "ö": "o", "Ö": "o", "ü": "u", "Ü": "u", "ğ": "g", "Ğ": "g" };
    const normalizeTr = (str) => String(str || "").replace(/[*_]/g, "").replace(/[ıİşŞçÇöÖüÜğĞ]/g, (c) => trMap[c] || c).toLowerCase();
    const cleanCourtName = String(courtName || "").replace(/[*_]/g, "").trim();
    const courtSlug = normalizeTr(cleanCourtName).replace(/\./g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
    const slug = `${courtSlug}__${eYear}-${eNo}E_${kYear}-${kNo}K`;

    return `[${label}](/kararlar/${slug})`;
  });
}

export default function CalismaAlaniPage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isHeaderHidden, setIsHeaderHidden] = useState(true);
  const [input, setInput] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [fileNoteDrafts, setFileNoteDrafts] = useState({});
  const [savingFileNoteIds, setSavingFileNoteIds] = useState([]);
  const [editingFileNameId, setEditingFileNameId] = useState(null);
  const [editingFileNameValue, setEditingFileNameValue] = useState("");
  const [savingFileNameId, setSavingFileNameId] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [activeFileSummary, setActiveFileSummary] = useState(null);
  const [activeFileDetailTab, setActiveFileDetailTab] = useState("analysis");
  const [aiDecisions, setAiDecisions] = useState([]);
  const [aiStatutes, setAiStatutes] = useState([]);
  const [savedDecisionIds, setSavedDecisionIds] = useState([]);
  const [savedDecisionItems, setSavedDecisionItems] = useState([]);
  const [savedStatutes, setSavedStatutes] = useState([]);
  const [decisionView, setDecisionView] = useState("ai");
  const [visiblePanels, setVisiblePanels] = useState({
    decisions: true,
    statutes: true,
    notes: true,
  });

  const [forceCaseSearchEnabled, setForceCaseSearchEnabled] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState("general_analysis");
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [expandedNoteIds, setExpandedNoteIds] = useState([]);
  const [selectedChatText, setSelectedChatText] = useState("");

  // Yeni Tasarım İçin Eklenen Stateler
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isLoadingWorkspaceDetail, setIsLoadingWorkspaceDetail] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState([]);
  const [isUploadPerspectiveModalOpen, setIsUploadPerspectiveModalOpen] = useState(false);
  const [isPartyRepresentative, setIsPartyRepresentative] = useState(null);
const [representedParty, setRepresentedParty] = useState("");
const [shouldAnalyzeFile, setShouldAnalyzeFile] = useState(true);
const [uploadPerspectiveError, setUploadPerspectiveError] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [tokenBalance, setTokenBalance] = useState(null);
  const [isLoadingTokenBalance, setIsLoadingTokenBalance] = useState(false);

  const dropdownRef = useRef(null);

  const modeMenuRef = useRef(null);
  const selectedTextActionRef = useRef(null);
  const chatScrollRef = useRef(null);
  const chatMessagesEndRef = useRef(null);

  function extractTokenBalanceFromResponse(data) {
    const candidates = [
      data?.tokenBalance,
      data?.balance,
      data?.tokens,
      data?.user?.tokenBalance,
      data?.user?.balance,
    ];

    const found = candidates.find((value) => Number.isFinite(Number(value)));
    return found === undefined ? null : Number(found);
  }

  async function refreshTokenBalance() {
    setIsLoadingTokenBalance(true);

    try {
      const endpoints = ["/api/workspaces", "/api/tokens/balance", "/api/token-balance", "/api/user/tokens"];

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) continue;

          const nextBalance = extractTokenBalanceFromResponse(data);
          if (nextBalance !== null) {
            setTokenBalance(nextBalance);
            return nextBalance;
          }
        } catch (endpointError) {
          console.error("Token bakiyesi endpoint hatası:", endpointError);
        }
      }

      return tokenBalance;
    } finally {
      setIsLoadingTokenBalance(false);
    }
  }


  // Dropdown / mod menüsü / seçili metin barı dışına tıklandığında kapatma mantığı
  useEffect(() => {
    function handleClickOutside(event) {
      const target = event.target;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsWorkspaceDropdownOpen(false);
      }

      if (modeMenuRef.current && !modeMenuRef.current.contains(target)) {
        setIsModeMenuOpen(false);
      }

      if (
        selectedChatText &&
        selectedTextActionRef.current &&
        !selectedTextActionRef.current.contains(target)
      ) {
        clearSelectedChatText();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [selectedChatText]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.classList.toggle("calisma-global-header-hidden", isHeaderHidden);

    return () => {
      document.body.classList.remove("calisma-global-header-hidden");
    };
  }, [isHeaderHidden]);

  useEffect(() => {
    refreshTokenBalance();
    setVisiblePanels((prev) => ({
      ...prev,
      statutes: false,
    }));
  }, []);
  // Çalışma alanlarını veritabanından yükle

  useEffect(() => {
    setVisiblePanels((prev) => ({
      ...prev,
      statutes: false,
    }));
  }, [activeWorkspaceId]);
  useEffect(() => {
    let cancelled = false;

    async function loadWorkspaces() {
      setIsLoadingWorkspaces(true);
      setWorkspaceError("");

      try {
        const res = await fetch("/api/workspaces", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Çalışma alanları alınamadı.");
        }

        const list = Array.isArray(data?.workspaces) ? data.workspaces : [];
        const nextBalance = extractTokenBalanceFromResponse(data);
        if (nextBalance !== null) {
          setTokenBalance(nextBalance);
        }
        if (cancelled) return;

        setWorkspaces(list);
        setActiveWorkspaceId((prev) => {
          if (prev && list.some((workspace) => workspace.id === prev)) return prev;
          return list[0]?.id || null;
        });
      } catch (error) {
        if (cancelled) return;
        console.error("Çalışma alanları yüklenemedi:", error);
        setWorkspaceError(error?.message || "Çalışma alanları yüklenemedi.");
      } finally {
        if (!cancelled) setIsLoadingWorkspaces(false);
      }
    }

    loadWorkspaces();

    return () => {
      cancelled = true;
    };
  }, []);

  const [messages, setMessages] = useState([
    {
      id: "m1",
      role: "assistant",
      text: "Çalışma masası hazır. Bu alanda aynı dosya üzerinde birden fazla soru sorabilir, kararları kaydedebilir, not alabilir ve dosya ekleyebilirsiniz.",
      createdAt: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    if (!chatScrollRef.current) return;

    requestAnimationFrame(() => {
      chatMessagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [messages, isLoadingWorkspaceDetail]);

  const [notes, setNotes] = useState([]);

  const [files, setFiles] = useState([]);

  const [workspaces, setWorkspaces] = useState([]);

  function getDecisionKey(item) {
    const slug = getDecisionSlug(item);
    return slug || item?.id || item?.slug || item?.kararId || `${item?.court || ""}::${item?.code || ""}`;
  }

  function getStatuteKey(item) {
    return `${item?.name || item?.mevzuatAdi || item?.mevzuat_adi || ""}::${item?.article || item?.madde || ""}`;
  }

  function isNoteExpanded(noteId) {
    return expandedNoteIds.includes(noteId);
  }

  function toggleNoteExpanded(noteId) {
    setExpandedNoteIds((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );
  }
  function getFileNoteType(file) {
  return `Belge Notu: ${file?.name || "Dosya"}`;
}

function getNotesForFile(file) {
  const noteType = getFileNoteType(file);
  return notes.filter((note) => note?.type === noteType);
}

  function toggleVisiblePanel(panelKey) {
    setVisiblePanels((prev) => ({
      ...prev,
      [panelKey]: !prev[panelKey],
    }));
  }

  function handleChatTextSelection() {
  if (typeof window === "undefined") return;

  const selected = window.getSelection?.().toString().trim() || "";

  if (selected.length >= 3) {
    setSelectedChatText(selected);
    return;
  }

  setSelectedChatText("");
}

  function clearSelectedChatText() {
    setSelectedChatText("");

    if (typeof window !== "undefined") {
      window.getSelection?.().removeAllRanges?.();
    }
  }



  const activeWorkspace = useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === activeWorkspaceId) ||
      workspaces[0] || {
        id: null,
        title: isLoadingWorkspaces ? "Çalışmalar yükleniyor..." : "Henüz çalışma alanı yok",
        subtitle: isLoadingWorkspaces
          ? "Lütfen bekleyin"
          : "Yeni çalışma alanı oluşturarak başlayın",
        status: isLoadingWorkspaces ? "Yükleniyor" : "Boş",
      },
    [activeWorkspaceId, workspaces, isLoadingWorkspaces]
  );

  const activeWorkspaceMode = useMemo(
    () => WORKSPACE_MODES.find((mode) => mode.id === workspaceMode) || WORKSPACE_MODES[0],
    [workspaceMode]
  );

  const currentUserMessageCount = useMemo(
    () => messages.filter((message) => message?.role === "user").length,
    [messages]
  );

  const currentMessageTokenCost = useMemo(
    () => getWorkspaceMessageTokenCost(currentUserMessageCount),
    [currentUserMessageCount]
  );

  useEffect(() => {
    if (!activeWorkspaceId) {
      setMessages([
        {
          id: "m-empty-assistant",
          role: "assistant",
          text: "Bu çalışma alanı hazır. Dosyalarınızı ekleyip soru sorabilir, notlarınızı ve kararlarınızı burada toplayabilirsiniz.",
          createdAt: new Date().toISOString(),
        },
      ]);
      setNotes([]);
      setFiles([]);
      setFileNoteDrafts({});
      setSavingFileNoteIds([]);
      setEditingFileNameId(null);
      setEditingFileNameValue("");
      setSavingFileNameId(null);
      setAiDecisions([]);
      setAiStatutes([]);
      setSavedDecisionIds([]);
      setSavedDecisionItems([]);
      setSavedStatutes([]);
      setExpandedNoteIds([]);
      setActiveFileSummary(null);
      return;
    }

    let cancelled = false;
    const loadingWorkspaceId = activeWorkspaceId;

    setIsLoadingWorkspaceDetail(true);
    setWorkspaceError("");
    setMessages([
      {
        id: "m-loading-assistant",
        role: "assistant",
        text: "Çalışma alanı yükleniyor...",
        createdAt: new Date().toISOString(),
      },
    ]);
    setNotes([]);
    setFiles([]);
    setFileNoteDrafts({});
    setSavingFileNoteIds([]);
    setEditingFileNameId(null);
    setEditingFileNameValue("");
    setSavingFileNameId(null);
    setAiDecisions([]);
    setAiStatutes([]);
    setSavedDecisionIds([]);
    setSavedDecisionItems([]);
    setSavedStatutes([]);
    setExpandedNoteIds([]);
    setActiveFileSummary(null);

    async function loadWorkspaceDetail() {

      try {
        const res = await fetch(`/api/workspaces/${activeWorkspaceId}`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Çalışma alanı detayları alınamadı.");
        }

        const workspace = data?.workspace;
        if (!workspace || cancelled || loadingWorkspaceId !== activeWorkspaceId) return;

        const loadedMessages = Array.isArray(workspace.messages)
          ? workspace.messages.map((message) => ({
              id: message.id,
              role: message.role,
              text: message.content,
              createdAt: message.createdAt,
              sources: message.sources || null,
            }))
          : [];

        setMessages(
          loadedMessages.length
            ? loadedMessages
            : [
                {
                  id: "m-empty-assistant",
                  role: "assistant",
                  text: "Bu çalışma alanı hazır. Dosyalarınızı ekleyip soru sorabilir, notlarınızı ve kararlarınızı burada toplayabilirsiniz.",
                  createdAt: new Date().toISOString(),
                },
              ]
        );

        setNotes(
          Array.isArray(workspace.notes)
            ? workspace.notes.map((note) => ({
                id: note.id,
                type: note.type || "Kullanıcı Notu",
                text: note.content || "",
                createdAt: note.createdAt,
              }))
            : []
        );
        setExpandedNoteIds([]);
        setActiveFileSummary(null);

        setFiles(
          Array.isArray(workspace.files)
            ? workspace.files.map((file) => ({
                id: file.id,
                name: file.name,
                type: file.type || "Dosya",
                size:
                  typeof file.size === "number"
                    ? `${Math.max(1, Math.round(file.size / 1024))} KB`
                    : file.size || "",
                url: file.url || "",
                storageKey: file.storageKey || "",
                aiSummary: file.aiSummary || "",
                detailedSummary: file.detailedSummary || "",
                documentType: file.documentType || "",
                legalKeywords: Array.isArray(file.legalKeywords) ? file.legalKeywords : [],
                detectedStatutes: Array.isArray(file.detectedStatutes) ? file.detectedStatutes : [],
                keyFacts: Array.isArray(file.keyFacts) ? file.keyFacts : [],
                evidenceList: Array.isArray(file.evidenceList) ? file.evidenceList : [],
                risks: Array.isArray(file.risks) ? file.risks : [],
                defenseIssues: Array.isArray(file.defenseIssues) ? file.defenseIssues : [],
                searchSummary: file.searchSummary || "",
                userPerspective: file.userPerspective || file.user_perspective || null,
                profiledAt: file.profiledAt || null,
              }))
            : []
        );

        const loadedSavedDecisionItems = Array.isArray(workspace.decisions)
          ? workspace.decisions.map((decision) => ({
              id: decision.kararId || decision.slug || decision.id,
              kararId: decision.kararId || "",
              slug: decision.slug || "",
              court: decision.court || "",
              code: decision.code || "",
              tag: decision.tag || "Kaydedilen karar",
              source: decision.source || "USER",
            }))
          : [];

        setSavedDecisionItems(loadedSavedDecisionItems);
        setSavedDecisionIds(loadedSavedDecisionItems.map((decision) => getDecisionKey(decision)).filter(Boolean));

        setSavedStatutes(
          Array.isArray(workspace.statutes)
            ? workspace.statutes.map((statute) => ({
                id: statute.id,
                name: statute.mevzuatAdi,
                article: statute.madde || "",
                baslik: statute.baslik || "",
                note: statute.note || "",
                content: statute.content || "",
              }))
            : []
        );

        const latestAssistantWithSources = loadedMessages
          .slice()
          .reverse()
          .find((message) => message.role === "assistant" && message.sources);

        setAiDecisions(
          Array.isArray(latestAssistantWithSources?.sources?.decisions)
            ? latestAssistantWithSources.sources.decisions
            : []
        );

        setAiStatutes(
          Array.isArray(latestAssistantWithSources?.sources?.statutes)
            ? latestAssistantWithSources.sources.statutes
            : []
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Çalışma alanı detayları yüklenemedi:", error);
        setWorkspaceError(error?.message || "Çalışma alanı detayları yüklenemedi.");
      } finally {
        if (!cancelled) setIsLoadingWorkspaceDetail(false);
      }
    }

    loadWorkspaceDetail();

    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId]);

  const savedDecisions = useMemo(
    () => savedDecisionItems,
    [savedDecisionItems]
  );

  const savedStatuteKeys = useMemo(
    () => new Set(savedStatutes.map((item) => getStatuteKey(item))),
    [savedStatutes]
  );

  async function toggleSavedDecision(decisionId) {
    if (!activeWorkspaceId) return;

    const decision = [...aiDecisions, ...savedDecisionItems].find((item) => getDecisionKey(item) === decisionId);
    if (!decision) return;

    const alreadySaved = savedDecisionIds.includes(decisionId);

    setSavedDecisionIds((prev) =>
      alreadySaved
        ? prev.filter((id) => id !== decisionId)
        : [...prev, decisionId]
    );

    try {
      if (alreadySaved) {
        const res = await fetch(
          `/api/workspaces/${activeWorkspaceId}/decisions?slug=${encodeURIComponent(decisionId)}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok && res.status !== 404) {
          throw new Error(data?.message || "Karar çalışma alanından kaldırılamadı.");
        }
      } else {
        const res = await fetch(`/api/workspaces/${activeWorkspaceId}/decisions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            kararId: decision.kararId || "",
            slug: getDecisionSlug(decision) || decision.slug || decision.id || "",
            court: decision.court,
            code: decision.code,
            tag: decision.tag,
            source: decision.source || "AI",
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Karar çalışma alanına kaydedilemedi.");
        }
      }

      if (!alreadySaved) {
        setSavedDecisionItems((prev) => {
          const key = getDecisionKey(decision);
          if (prev.some((item) => getDecisionKey(item) === key)) return prev;
          return [decision, ...prev];
        });
      } else {
        setSavedDecisionItems((prev) => prev.filter((item) => getDecisionKey(item) !== decisionId));
      }
      setWorkspaceError("");
    } catch (error) {
      console.error("Karar kaydetme/kaldırma hatası:", error);
      setSavedDecisionIds((prev) =>
        alreadySaved
          ? [...prev, decisionId]
          : prev.filter((id) => id !== decisionId)
      );
      if (alreadySaved) {
        setSavedDecisionItems((prev) => {
          if (prev.some((item) => getDecisionKey(item) === decisionId)) return prev;
          return [decision, ...prev];
        });
      } else {
        setSavedDecisionItems((prev) => prev.filter((item) => getDecisionKey(item) !== decisionId));
      }
      setWorkspaceError(error?.message || "Karar işlemi tamamlanamadı.");
    }
  }

  async function toggleSavedStatute(item) {
    if (!activeWorkspaceId || !item) return;

    const key = getStatuteKey(item);
    const alreadySaved = savedStatuteKeys.has(key);
    const existing = savedStatutes.find((statute) => getStatuteKey(statute) === key);

    if (alreadySaved) {
      setSavedStatutes((prev) => prev.filter((statute) => getStatuteKey(statute) !== key));
    } else {
      setSavedStatutes((prev) => [item, ...prev]);
    }

    try {
      if (alreadySaved) {
        const params = existing?.id
          ? `statuteId=${encodeURIComponent(existing.id)}`
          : `mevzuatAdi=${encodeURIComponent(item.name)}&madde=${encodeURIComponent(item.article || "")}`;

        const res = await fetch(`/api/workspaces/${activeWorkspaceId}/statutes?${params}`, {
          method: "DELETE",
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok && res.status !== 404) {
          throw new Error(data?.message || "Mevzuat çalışma alanından kaldırılamadı.");
        }
      } else {
        const res = await fetch(`/api/workspaces/${activeWorkspaceId}/statutes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            mevzuatAdi: item.name,
            madde: item.article,
            note: item.note,
            baslik: item.baslik || "",
            content: item.content || "",
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Mevzuat çalışma alanına kaydedilemedi.");
        }

        const saved = data?.statute;
        if (saved?.id) {
          setSavedStatutes((prev) =>
            prev.map((statute) =>
              getStatuteKey(statute) === key
                ? {
                    id: saved.id,
                    name: saved.mevzuatAdi,
                    article: saved.madde || "",
                    baslik: saved.baslik || "",
                    note: saved.note || "",
                    content: saved.content || "",
                  }
                : statute
            )
          );
        }
      }

      setWorkspaceError("");
    } catch (error) {
      console.error("Mevzuat kaydetme/kaldırma hatası:", error);
      if (alreadySaved) {
        setSavedStatutes((prev) => [existing || item, ...prev]);
      } else {
        setSavedStatutes((prev) => prev.filter((statute) => getStatuteKey(statute) !== key));
      }
      setWorkspaceError(error?.message || "Mevzuat işlemi tamamlanamadı.");
    }
  }

  async function handleCreateWorkspaceSubmit(e) {
    e.preventDefault();
    const clean = newWorkspaceName.trim();
    if (!clean) return;

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: clean,
          subtitle: "Yeni oluşturulan çalışma",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Çalışma alanı oluşturulamadı.");
      }

      const created = data?.workspace;
      if (!created?.id) {
        throw new Error("Çalışma alanı oluşturuldu ancak yanıt eksik döndü.");
      }

      setWorkspaces((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setActiveWorkspaceId(created.id);
      setIsCreateWorkspaceModalOpen(false);
      setNewWorkspaceName("");
      setIsWorkspaceDropdownOpen(false);
      setWorkspaceError("");
    } catch (error) {
      console.error("Çalışma alanı oluşturulamadı:", error);
      setWorkspaceError(error?.message || "Çalışma alanı oluşturulamadı.");
    }
  }

  function parseSseChunk(chunkText) {
    return chunkText
      .split("\n\n")
      .map((rawEvent) => rawEvent.trim())
      .filter(Boolean)
      .map((rawEvent) => {
        const lines = rawEvent.split("\n");
        let event = "message";
        const dataLines = [];

        for (const line of lines) {
          if (line.startsWith("event:")) {
            event = line.slice(6).trim() || "message";
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trimStart());
          }
        }

        let data = null;
        const dataText = dataLines.join("\n");

        if (dataText) {
          try {
            data = JSON.parse(dataText);
          } catch {
            data = { text: dataText };
          }
        }

        return { event, data };
      });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const clean = input.trim();
    if (!clean || !activeWorkspaceId || isLoadingWorkspaceDetail) return;

    const messageTokenCost = getWorkspaceMessageTokenCost(
      messages.filter((message) => message?.role === "user").length
    );

    const latestTokenBalance = await refreshTokenBalance();
    if (Number.isFinite(Number(latestTokenBalance)) && Number(latestTokenBalance) < messageTokenCost) {
      setWorkspaceError(
        `Bu mesaj için ${messageTokenCost} token gereklidir. Lütfen paket satın alarak token bakiyenizi artırın.`
      );
      return;
    }

    const submittingWorkspaceId = activeWorkspaceId;
    const forceCaseSearch = Boolean(forceCaseSearchEnabled);
    const selectedWorkspaceMode = workspaceMode;
    const selectedWorkspaceModeLabel = activeWorkspaceMode.label;

    const localUserMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: clean,
      createdAt: new Date().toISOString(),
    };

    const localBotMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: forceCaseSearch
        ? `${selectedWorkspaceModeLabel} modunda yeni karar araması yapılıyor. Yargıtay kararları taranıyor ve cevap hazırlanıyor...`
        : `${selectedWorkspaceModeLabel} modunda cevap hazırlanıyor...`,
      createdAt: new Date().toISOString(),
      sources: {
        loading: true,
        forceCaseSearch,
      },
    };

    const previousMessages = messages;
    const hasPreviousUserMessage = messages.some((message) => message?.role === "user");
    const history = hasPreviousUserMessage
      ? messages
          .filter((message) => message?.role === "user" || message?.role === "assistant")
          .filter((message) => message?.id !== "m1" && message?.id !== "m-empty-assistant")
          .map((message) => ({
            role: message.role,
            content: message.text || "",
          }))
          .filter((message) => message.content.trim())
      : [];

    setMessages((prev) => [...prev, localUserMessage, localBotMessage]);
    setInput("");
    setWorkspaceError("");
    setDecisionView("ai");

    try {
      let workspaceContext = [];

      try {
        const contextRes = await fetch(
          `/api/workspaces/${submittingWorkspaceId}/messages?context=1&q=${encodeURIComponent(clean)}&mode=${encodeURIComponent(selectedWorkspaceMode)}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        const contextData = await contextRes.json().catch(() => ({}));

        if (contextRes.ok && Array.isArray(contextData?.workspaceContext)) {
          workspaceContext = contextData.workspaceContext;
        }
      } catch (contextError) {
        console.error("Workspace context alınamadı:", contextError);
      }

      const aiRes = await fetch(`${WORKSPACE_AI_API_BASE}/workspace-analyze-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: clean,
          workspace_mode: selectedWorkspaceMode,
          force_case_search: forceCaseSearch,
          history,
          workspace_context: workspaceContext,
          notes: notes.map((note) => ({
            id: note.id,
            type: note.type,
            content: note.text,
          })),
        }),
      });

      if (!aiRes.ok || !aiRes.body) {
        const errorData = await aiRes.json().catch(() => ({}));
        throw new Error(errorData?.message || "Workspace AI stream servisi cevap üretemedi.");
      }

      const reader = aiRes.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let streamedAnswer = "";
      let visibleStreamedAnswer = "";
      let queuedStreamText = "";
      let typingTimer = null;
      let finalAnswer = "";
      let nextAiDecisions = [];
      let nextAiStatutes = [];
      let didCaseSearch = false;
      let effectiveQuery = "";
      let raw = null;
      let streamError = null;

      const STREAM_TYPE_DELAY_MS = 40;
      const STREAM_TYPE_CHARS_PER_TICK = 3;

      function updateStreamingBotMessage(text, extraSources = {}) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === localBotMessage.id
              ? {
                  ...message,
                  text,
                  sources: {
                    ...(message.sources || {}),
                    loading: true,
                    forceCaseSearch,
                    workspaceMode: selectedWorkspaceMode,
                    workspaceModeLabel: selectedWorkspaceModeLabel,
                    didCaseSearch,
                    effectiveQuery,
                    decisions: nextAiDecisions,
                    statutes: nextAiStatutes,
                    raw,
                    workspaceContext,
                    ...extraSources,
                  },
                }
              : message
          )
        );
      }

      function scheduleTypingFlush() {
        if (typingTimer) return;

        typingTimer = window.setTimeout(() => {
          typingTimer = null;

          if (!queuedStreamText) return;

          const nextText = queuedStreamText.slice(0, STREAM_TYPE_CHARS_PER_TICK);
          queuedStreamText = queuedStreamText.slice(STREAM_TYPE_CHARS_PER_TICK);
          visibleStreamedAnswer += nextText;
          updateStreamingBotMessage(visibleStreamedAnswer);

          if (queuedStreamText) {
            scheduleTypingFlush();
          }
        }, STREAM_TYPE_DELAY_MS);
      }

      function queueStreamingText(deltaText) {
        if (!deltaText) return;
        queuedStreamText += deltaText;
        scheduleTypingFlush();
      }

      async function drainQueuedStreamingText() {
        if (typingTimer) {
          window.clearTimeout(typingTimer);
          typingTimer = null;
        }

        while (queuedStreamText) {
          const nextText = queuedStreamText.slice(0, STREAM_TYPE_CHARS_PER_TICK);
          queuedStreamText = queuedStreamText.slice(STREAM_TYPE_CHARS_PER_TICK);
          visibleStreamedAnswer += nextText;
          updateStreamingBotMessage(visibleStreamedAnswer);
          await new Promise((resolve) => window.setTimeout(resolve, STREAM_TYPE_DELAY_MS));
        }
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        const events = parseSseChunk(parts.join("\n\n"));

        for (const item of events) {
          const event = item.event;
          const data = item.data || {};

          if (event === "sources") {
            nextAiDecisions = Array.isArray(data.decisions) ? data.decisions : [];
            nextAiStatutes = Array.isArray(data.statutes) ? data.statutes : [];
            didCaseSearch = Boolean(data.did_case_search);
            effectiveQuery = data.effective_query || "";

            setAiDecisions(nextAiDecisions);
            setAiStatutes(nextAiStatutes);
            setVisiblePanels((prev) => ({
              ...prev,
              statutes: false,
            }));
            setDecisionView("ai");
            updateStreamingBotMessage(streamedAnswer || localBotMessage.text);
          }

          if (event === "status" && data.message && !streamedAnswer) {
            updateStreamingBotMessage(data.message);
          }

          if (event === "delta") {
            const deltaText = String(data.text || "");
            if (!deltaText) continue;

            streamedAnswer += deltaText;
            queueStreamingText(deltaText);
          }

          if (event === "done") {
            finalAnswer = String(data.answer || streamedAnswer || "").trim();
            nextAiDecisions = Array.isArray(data.decisions) ? data.decisions : nextAiDecisions;
            nextAiStatutes = Array.isArray(data.statutes) ? data.statutes : nextAiStatutes;
            didCaseSearch = Boolean(data.did_case_search);
            effectiveQuery = data.effective_query || effectiveQuery;
            raw = data.raw || raw;

            setAiDecisions(nextAiDecisions);
            setAiStatutes(nextAiStatutes);
            setVisiblePanels((prev) => ({
              ...prev,
              statutes: false,
            }));
            setDecisionView("ai");
          }

          if (event === "error") {
            streamError = new Error(data.message || "Stream sırasında hata oluştu.");
          }
        }
      }

      if (buffer.trim()) {
        const events = parseSseChunk(buffer);
        for (const item of events) {
          const event = item.event;
          const data = item.data || {};

          if (event === "delta") {
            const deltaText = String(data.text || "");
            streamedAnswer += deltaText;
            queueStreamingText(deltaText);
          }

          if (event === "done") {
            finalAnswer = String(data.answer || streamedAnswer || "").trim();
            nextAiDecisions = Array.isArray(data.decisions) ? data.decisions : nextAiDecisions;
            nextAiStatutes = Array.isArray(data.statutes) ? data.statutes : nextAiStatutes;
            didCaseSearch = Boolean(data.did_case_search);
            effectiveQuery = data.effective_query || effectiveQuery;
            raw = data.raw || raw;
          }

          if (event === "error") {
            streamError = new Error(data.message || "Stream sırasında hata oluştu.");
          }
        }
      }

      await drainQueuedStreamingText();

      if (streamError) throw streamError;

      const answer = (finalAnswer || streamedAnswer || "Analiz üretilemedi.").trim();

      const finalBotMessage = {
        ...localBotMessage,
        text: answer,
        sources: {
          loading: false,
          forceCaseSearch,
          workspaceMode: selectedWorkspaceMode,
          workspaceModeLabel: selectedWorkspaceModeLabel,
          didCaseSearch,
          effectiveQuery,
          decisions: nextAiDecisions,
          statutes: nextAiStatutes,
          raw,
          workspaceContext,
          stream: true,
        },
      };

      setMessages((prev) =>
        prev.map((message) =>
          message.id === localBotMessage.id ? finalBotMessage : message
        )
      );

      const userRes = await fetch(`/api/workspaces/${submittingWorkspaceId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: "user",
          content: clean,
        }),
      });

      const userData = await userRes.json().catch(() => ({}));

      if (!userRes.ok) {
        throw new Error(userData?.message || "Kullanıcı mesajı kaydedilemedi.");
      }

      const userMessageTokenBalance = extractTokenBalanceFromResponse(userData);
      if (userMessageTokenBalance !== null) {
        setTokenBalance(userMessageTokenBalance);
      }

      const assistantRes = await fetch(`/api/workspaces/${submittingWorkspaceId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: "assistant",
          content: answer,
          sources: finalBotMessage.sources,
        }),
      });

      const assistantData = await assistantRes.json().catch(() => ({}));

      if (!assistantRes.ok) {
        throw new Error(assistantData?.message || "Asistan mesajı kaydedilemedi.");
      }


      const savedUserMessage = userData?.message;
      const savedAssistantMessage = assistantData?.message;

      setMessages((prev) =>
        prev.map((message) => {
          if (message.id === localUserMessage.id && savedUserMessage?.id) {
            return {
              id: savedUserMessage.id,
              role: savedUserMessage.role,
              text: savedUserMessage.content,
              createdAt: savedUserMessage.createdAt,
              sources: savedUserMessage.sources || null,
            };
          }

          if (message.id === localBotMessage.id && savedAssistantMessage?.id) {
            return {
              id: savedAssistantMessage.id,
              role: savedAssistantMessage.role,
              text: savedAssistantMessage.content,
              createdAt: savedAssistantMessage.createdAt,
              sources: savedAssistantMessage.sources || finalBotMessage.sources,
            };
          }

          return message;
        })
      );

      setWorkspaceError("");
      setForceCaseSearchEnabled(false);
    } catch (error) {
      console.error("Workspace AI stream işlemi tamamlanamadı:", error);
      if (typingTimer) {
        window.clearTimeout(typingTimer);
      }
      setWorkspaceError(error?.message || "Cevap üretilemedi.");
      setMessages([
        ...previousMessages,
        localUserMessage,
        {
          ...localBotMessage,
          text: `Cevap üretilemedi: ${error?.message || "Bilinmeyen hata"}`,
          sources: {
            loading: false,
            forceCaseSearch,
            error: true,
          },
        },
      ]);
    }
  }

  async function addFileNote(file) {
    if (!activeWorkspaceId || !file?.id) return;

    const clean = String(fileNoteDrafts[file.id] || "").trim();
    if (!clean) return;

    setSavingFileNoteIds((prev) => (prev.includes(file.id) ? prev : [...prev, file.id]));
    setWorkspaceError("");

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: `Belge Notu: ${file.name || "Dosya"}`,
          content: clean,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Belge notu kaydedilemedi.");
      }

      const savedNote = data?.note;

      setNotes((prev) => [
        {
          id: savedNote?.id || crypto.randomUUID(),
          type: savedNote?.type || `Belge Notu: ${file.name || "Dosya"}`,
          text: savedNote?.content || clean,
          createdAt: savedNote?.createdAt || new Date().toISOString(),
        },
        ...prev,
      ]);

      setFileNoteDrafts((prev) => ({
        ...prev,
        [file.id]: "",
      }));

      setWorkspaceError("");
    } catch (error) {
      console.error("Belge notu kaydedilemedi:", error);
      setWorkspaceError(error?.message || "Belge notu kaydedilemedi.");
    } finally {
      setSavingFileNoteIds((prev) => prev.filter((id) => id !== file.id));
    }
  }

  async function addBotTextToNotes(text) {
    const clean = String(text || "").trim();
    if (!clean || !activeWorkspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "AI Cevabı",
          content: clean,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Not kaydedilemedi.");
      }

      const savedNote = data?.note;

      setNotes((prev) => [
        {
          id: savedNote?.id || crypto.randomUUID(),
          type: savedNote?.type || "AI Cevabı",
          text: savedNote?.content || clean,
          createdAt: savedNote?.createdAt || new Date().toISOString(),
        },
        ...prev,
      ]);

      setWorkspaceError("");
    } catch (error) {
      console.error("AI cevabı nota eklenemedi:", error);
      setWorkspaceError(error?.message || "Not kaydedilemedi.");
    }
  }

  async function handleAddManualNote() {
    const clean = newNoteText.trim();
    if (!clean || !activeWorkspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "Kullanıcı Notu",
          content: clean,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Not kaydedilemedi.");
      }

      const savedNote = data?.note;

      setNotes((prev) => [
        {
          id: savedNote?.id || crypto.randomUUID(),
          type: savedNote?.type || "Kullanıcı Notu",
          text: savedNote?.content || clean,
          createdAt: savedNote?.createdAt || new Date().toISOString(),
        },
        ...prev,
      ]);

      setNewNoteText("");
      setWorkspaceError("");
    } catch (error) {
      console.error("Not kaydedilemedi:", error);
      setWorkspaceError(error?.message || "Not kaydedilemedi.");
    }
  }

  async function handleDeleteNote(noteId) {
    if (!noteId || !activeWorkspaceId) return;

    const previousNotes = notes;
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
    setWorkspaceError("");

    try {
      const res = await fetch(
        `/api/workspaces/${activeWorkspaceId}/notes?noteId=${encodeURIComponent(noteId)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Not silinemedi.");
      }
    } catch (error) {
      console.error("Not silinemedi:", error);
      setNotes(previousNotes);
      setWorkspaceError(error?.message || "Not silinemedi.");
    }
  }

  async function handleUpdateFileName(file) {
    if (!activeWorkspaceId || !file?.id) return;

    const cleanName = String(editingFileNameValue || "").trim();
    if (!cleanName) {
      setWorkspaceError("Dosya adı boş bırakılamaz.");
      return;
    }

    if (cleanName === file.name) {
      setEditingFileNameId(null);
      setEditingFileNameValue("");
      return;
    }

    const previousFiles = files;
    setSavingFileNameId(file.id);
    setWorkspaceError("");

    setFiles((prev) =>
      prev.map((item) =>
        item.id === file.id
          ? {
              ...item,
              name: cleanName,
            }
          : item
      )
    );

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/files`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileId: file.id,
          name: cleanName,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Dosya adı güncellenemedi.");
      }

      const updatedFile = data?.file;

      setFiles((prev) =>
        prev.map((item) =>
          item.id === file.id
            ? {
                ...item,
                name: updatedFile?.name || cleanName,
              }
            : item
        )
      );

      setEditingFileNameId(null);
      setEditingFileNameValue("");
      setWorkspaceError("");
    } catch (error) {
      console.error("Dosya adı güncellenemedi:", error);
      setFiles(previousFiles);
      setWorkspaceError(error?.message || "Dosya adı güncellenemedi.");
    } finally {
      setSavingFileNameId(null);
    }
  }

  function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = "";

    if (!selectedFiles.length || !activeWorkspaceId) {
      return;
    }

    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > MAX_WORKSPACE_FILE_SIZE_BYTES
    );

    if (oversizedFiles.length) {
      const oversizedNames = oversizedFiles.map((file) => file.name).join(", ");
      setWorkspaceError(
        `${MAX_WORKSPACE_FILE_SIZE_MB} MB üstü dosya yüklenemez: ${oversizedNames}`
      );
      return;
    }

    setPendingUploadFiles(selectedFiles);
    setIsPartyRepresentative(null);
setRepresentedParty("");
setShouldAnalyzeFile(true);
setUploadPerspectiveError("");
    setWorkspaceError("");
    setIsUploadPerspectiveModalOpen(true);
  }

  function resetUploadPerspectiveState() {
    setPendingUploadFiles([]);
    setIsUploadPerspectiveModalOpen(false);
    setIsPartyRepresentative(null);
    setRepresentedParty("");
    setShouldAnalyzeFile(true);
    setUploadPerspectiveError("");
  }

  async function uploadPendingFilesWithPerspective(e) {
    e?.preventDefault?.();

    if (!pendingUploadFiles.length || !activeWorkspaceId || isUploadingFiles) return;

    if (isPartyRepresentative === null) {
      setUploadPerspectiveError("Lütfen taraf vekili olup olmadığınızı seçin.");
      return;
    }

    if (isPartyRepresentative && !representedParty.trim()) {
      setUploadPerspectiveError("Lütfen hangi tarafın vekili olduğunuzu yazın.");
      return;
    }

    const formData = new FormData();
    pendingUploadFiles.forEach((file) => {
      formData.append("files", file);
    });

formData.append("isPartyRepresentative", isPartyRepresentative ? "true" : "false");
formData.append("representedParty", isPartyRepresentative ? representedParty.trim() : "");
formData.append("shouldAnalyzeFile", shouldAnalyzeFile ? "true" : "false");

setIsUploadPerspectiveModalOpen(false);
setIsUploadingFiles(true);
setWorkspaceError("");
setUploadPerspectiveError("");

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/files`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Dosya yüklenemedi.");
      }

      const uploadedFiles = Array.isArray(data?.files) ? data.files : [];
      const nextBalance = extractTokenBalanceFromResponse(data);
      if (nextBalance !== null) {
        setTokenBalance(nextBalance);
      }

      const mapped = uploadedFiles.map((file) => ({
        id: file.id,
        name: file.name,
        type: file.type || "Dosya",
        size:
          typeof file.size === "number"
            ? `${Math.max(1, Math.round(file.size / 1024))} KB`
            : file.size || "",
        url: file.url || "",
        storageKey: file.storageKey || "",
        aiSummary: file.aiSummary || "",
        detailedSummary: file.detailedSummary || "",
        documentType: file.documentType || "",
        legalKeywords: Array.isArray(file.legalKeywords) ? file.legalKeywords : [],
        detectedStatutes: Array.isArray(file.detectedStatutes) ? file.detectedStatutes : [],
        keyFacts: Array.isArray(file.keyFacts) ? file.keyFacts : [],
        evidenceList: Array.isArray(file.evidenceList) ? file.evidenceList : [],
        risks: Array.isArray(file.risks) ? file.risks : [],
        defenseIssues: Array.isArray(file.defenseIssues) ? file.defenseIssues : [],
        searchSummary: file.searchSummary || "",
        userPerspective: file.userPerspective || file.user_perspective || null,
        profiledAt: file.profiledAt || null,
      }));

      setFiles((prev) => [...mapped, ...prev]);
      resetUploadPerspectiveState();
      setWorkspaceError("");
    } catch (error) {
      console.error("Dosya yüklenemedi:", error);
setWorkspaceError(error?.message || "Dosya yüklenemedi.");
setUploadPerspectiveError(error?.message || "Dosya yüklenemedi.");

if (pendingUploadFiles.length) {
  setIsUploadPerspectiveModalOpen(true);
}
    } finally {
      setIsUploadingFiles(false);
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
      <div className="flex h-full">
        {/* Sol Panel */}
        {sidebarOpen && (
          <aside className="hidden w-[280px] shrink-0 border-r border-slate-200 bg-white/90 p-4 md:flex md:flex-col relative z-20 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
            <div className="mb-5">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-600">
                Consülto
              </div>
              <h1 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                Belgelerim
              </h1>
              <p className="mt-2 text-xs leading-5 text-slate-500 font-medium">
                Aktif çalışmaya dahil edilen ve AI tarafından analiz edilen dosyalar.
              </p>
            </div>
            <label className={`relative mb-4 block overflow-hidden rounded-2xl bg-gradient-to-b from-blue-800 to-blue-950 px-4 py-3 text-center text-sm font-black text-white shadow-[0_4px_12px_rgba(30,58,138,0.25)] transition-all active:scale-95 ${activeWorkspaceId && !isUploadingFiles ? "cursor-pointer hover:scale-[1.02] hover:shadow-[0_6px_16px_rgba(30,58,138,0.35)]" : "cursor-not-allowed opacity-60"}`}>
  <span className={isUploadingFiles ? "opacity-20" : "opacity-100"}>
    + Yeni Dosya Ekle
  </span>

  <div className={`mt-1 text-[10px] font-bold text-blue-100/85 ${isUploadingFiles ? "opacity-20" : "opacity-100"}`}>
    Maks. {MAX_WORKSPACE_FILE_SIZE_MB} MB • Perspektif bilgisi zorunlu
  </div>

  {isUploadingFiles && (
    <div className="absolute inset-0 flex items-center justify-center bg-blue-950/88 backdrop-blur-sm">
      <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 shadow-lg">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        <span className="text-[11px] font-black text-white">
          Dosya yükleniyor...
        </span>
      </div>
    </div>
  )}

  <input
    type="file"
    multiple
    disabled={!activeWorkspaceId || isUploadingFiles}
    className="hidden"
    onChange={handleFileSelect}
  />
</label>
            <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between items-center border-b border-slate-100 pb-2">
              <span>Yüklü Dosyalar</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                {files.length}
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                  <span className="text-2xl mb-2 opacity-50">📄</span>
                  <span className="text-xs font-bold text-slate-400">Henüz dosya eklenmedi</span>
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>

                        <div className="min-w-0">
                          {editingFileNameId === file.id ? (
                            <form
                              onSubmit={(event) => {
                                event.preventDefault();
                                handleUpdateFileName(file);
                              }}
                              className="space-y-2"
                            >
                              <input
                                value={editingFileNameValue}
                                onChange={(event) => setEditingFileNameValue(event.target.value)}
                                autoFocus
                                disabled={savingFileNameId === file.id}
                                className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-slate-900 outline-none ring-4 ring-blue-50 transition-all focus:border-blue-500 disabled:opacity-60"
                                placeholder="Dosya adı"
                              />
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="submit"
                                  disabled={savingFileNameId === file.id}
                                  className="rounded-lg bg-blue-700 px-2.5 py-1.5 text-[10px] font-black text-white transition-all hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {savingFileNameId === file.id ? "Kaydediliyor" : "Kaydet"}
                                </button>
                                <button
                                  type="button"
                                  disabled={savingFileNameId === file.id}
                                  onClick={() => {
                                    setEditingFileNameId(null);
                                    setEditingFileNameValue("");
                                  }}
                                  className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-black text-slate-500 transition-all hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  İptal
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                {file.url ? (
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block break-words text-sm font-black leading-5 text-slate-900 hover:text-blue-800 hover:underline"
                                    title={file.name}
                                  >
                                    {file.name}
                                  </a>
                                ) : (
                                  <div className="break-words text-sm font-black leading-5 text-slate-900" title={file.name}>
                                    {file.name}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFileNameId(file.id);
                                  setEditingFileNameValue(file.name || "");
                                }}
                                disabled={savingFileNameId === file.id}
                                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Dosya adını düzenle"
                                aria-label="Dosya adını düzenle"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.875 4.5" />
                                </svg>
                              </button>
                            </div>
                          )}
                          <div className="mt-0.5 text-[10px] font-bold text-slate-400">
                            {file.type} • {file.size}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {(file.aiSummary || file.detailedSummary) && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFileSummary(file);
                            setActiveFileDetailTab("analysis");
                          }}
                          className="min-w-0 rounded-2xl bg-blue-50 px-3 py-2.5 text-center text-[10px] font-black leading-tight text-blue-800 transition-all hover:bg-blue-100"
                        >
                          Akıllı Analiz
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setActiveFileSummary(file);
                          setActiveFileDetailTab("notes");
                        }}
                        className="min-w-0 rounded-2xl bg-slate-100 px-3 py-2.5 text-center text-[10px] font-black leading-tight text-slate-700 transition-all hover:bg-slate-200"
                      >
                        Belge Notları
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!activeWorkspaceId || !file.id) return;

                          const previousFiles = files;
                          setFiles((prev) => prev.filter((item) => item.id !== file.id));
                          setWorkspaceError("");

                          try {
                            const res = await fetch(
                              `/api/workspaces/${activeWorkspaceId}/files?fileId=${encodeURIComponent(file.id)}`,
                              {
                                method: "DELETE",
                                credentials: "include",
                              }
                            );

                            const data = await res.json().catch(() => ({}));

                            if (!res.ok) {
                              throw new Error(data?.message || "Dosya silinemedi.");
                            }
                          } catch (error) {
                            console.error("Dosya silinemedi:", error);
                            setFiles(previousFiles);
                            setWorkspaceError(error?.message || "Dosya silinemedi.");
                          }
                        }}
                        className="col-span-2 rounded-2xl bg-slate-50 px-3 py-2 text-[10px] font-black text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        <main className="flex min-w-0 flex-1 flex-col relative z-10">
        {/* Üst Menü & Özel Çalışma Alanı Seçici (Şov Kısmı) */}
            <header className="relative z-30 flex h-[86px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-2xl md:px-6">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                title={sidebarOpen ? "Belgeleri Gizle" : "Belgeleri Göster"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>

              {/* Özel Dropdown Container */}
              <div className="relative min-w-[320px]" ref={dropdownRef}>
                <button
                  onClick={() => setIsWorkspaceDropdownOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between gap-3 rounded-[1.35rem] border p-2.5 pl-3 pr-4 transition-all duration-200 ${
                    isWorkspaceDropdownOpen
                      ? "border-blue-200 bg-blue-50/80 shadow-[0_14px_35px_rgba(37,99,235,0.10)] ring-4 ring-blue-50"
                      : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <div className="mb-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                        Aktif Çalışma
                      </div>
                      <div className="truncate text-sm font-black text-slate-900 w-full text-left">
                        {activeWorkspace.title}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:flex rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-slate-500 shadow-sm border border-slate-100">
                      {activeWorkspace.status}
                    </span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth="3"
                      className={`text-slate-400 transition-transform duration-300 ${isWorkspaceDropdownOpen ? "rotate-180 text-blue-600" : ""}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isWorkspaceDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full min-w-[320px] origin-top-left overflow-hidden rounded-3xl border border-slate-200 bg-white/95 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-2 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                      {isLoadingWorkspaces ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">
                          Çalışma alanları yükleniyor...
                        </div>
                      ) : workspaces.length ? (
                        workspaces.map((ws) => {
                          const isActive = ws.id === activeWorkspaceId;
                          return (
                            <button
                              key={ws.id}
                              onClick={() => {
                                setActiveWorkspaceId(ws.id);
                                setIsWorkspaceDropdownOpen(false);
                              }}
                              className={`flex w-full items-center justify-between gap-3 rounded-2xl p-3 mb-1 transition-all last:mb-0 ${
                                isActive
                                  ? "bg-blue-50"
                                  : "bg-transparent hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                  isActive ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-400"
                                }`}>
                                  {isActive ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex flex-col items-start min-w-0">
                                  <div className={`truncate text-sm font-black ${isActive ? "text-blue-950" : "text-slate-800"}`}>
                                    {ws.title}
                                  </div>
                                  <div className="truncate text-[11px] font-medium text-slate-500">
                                    {ws.subtitle || "Çalışma alanı"}
                                  </div>
                                </div>
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider uppercase border ${
                                isActive ? "border-blue-200 bg-white text-blue-800" : "border-slate-200 bg-slate-50 text-slate-400"
                              }`}>
                                {ws.status || "Aktif"}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">
                          Henüz çalışma alanı yok. Aşağıdan yeni çalışma oluşturabilirsiniz.
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 border-t border-slate-100 pt-2 px-1 pb-1">
                      <button
                        onClick={() => setIsCreateWorkspaceModalOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Yeni Çalışma Alanı Oluştur
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsHeaderHidden((prev) => !prev)}
                className={`hidden shrink-0 items-center gap-2 rounded-[1.15rem] border px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] shadow-sm transition-all hover:-translate-y-0.5 sm:flex ${
                  isHeaderHidden
                    ? "border-slate-900 bg-slate-950 text-white hover:bg-slate-800"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                }`}
                title={isHeaderHidden ? "Global header'ı göster" : "Global header'ı gizle"}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isHeaderHidden ? "bg-emerald-400" : "bg-slate-300"}`} />
                {isHeaderHidden ? "Header Göster" : "Header Gizle"}
              </button>

            </div>

            <div className="ml-4 hidden shrink-0 items-center gap-2 md:flex">
              <div className={`flex items-center gap-2 rounded-[1.15rem] border px-3 py-2 text-[11px] font-black shadow-sm ${Number.isFinite(Number(tokenBalance)) && Number(tokenBalance) < currentMessageTokenCost ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {isLoadingTokenBalance ? "Token yükleniyor" : `Token: ${Number.isFinite(Number(tokenBalance)) ? tokenBalance : "-"}`}
              </div>

              <div className="flex items-center rounded-[1.4rem] border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => toggleVisiblePanel("decisions")}
                className={`group flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black transition-all ${
                  visiblePanels.decisions
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${visiblePanels.decisions ? "bg-blue-600" : "bg-slate-300"}`} />
                <span>Kararlar</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${visiblePanels.decisions ? "bg-white text-slate-700" : "bg-slate-100 text-slate-400"}`}>
                  {aiDecisions.length || 0}
                </span>
              </button>

              <div className="mx-1 h-6 w-px bg-slate-200" />

              <button
                type="button"
                onClick={() => toggleVisiblePanel("statutes")}
                className={`group flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black transition-all ${
                  visiblePanels.statutes
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${visiblePanels.statutes ? "bg-indigo-600" : "bg-slate-300"}`} />
                <span>Mevzuat</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${visiblePanels.statutes ? "bg-white text-slate-700" : "bg-slate-100 text-slate-400"}`}>
                  {aiStatutes.length || 0}
                </span>
              </button>

              <div className="mx-1 h-6 w-px bg-slate-200" />

              <button
                type="button"
                onClick={() => toggleVisiblePanel("notes")}
                className={`group flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black transition-all ${
                  visiblePanels.notes
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${visiblePanels.notes ? "bg-emerald-600" : "bg-slate-300"}`} />
                <span>Notlar</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${visiblePanels.notes ? "bg-white text-slate-700" : "bg-slate-100 text-slate-400"}`}>
                  {notes.length || 0}
                </span>
              </button>
              </div>
            </div>
          </header>

          {/* Mevcut İçerik Alanı (Değiştirilmedi) */}
          <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 xl:grid-cols-12">
            <div className={`min-h-0 ${
              visiblePanels.decisions || visiblePanels.statutes || visiblePanels.notes
                ? visiblePanels.notes && (visiblePanels.decisions || visiblePanels.statutes)
                  ? "xl:col-span-5"
                  : "xl:col-span-8"
                : "xl:col-span-12"
            }`}>
              <WorkspacePanel
                id="chat"
                title="Çalışma Alanı"
                subtitle="Soru-cevap alanı"
                setActivePanel={setActivePanel}
                actions={
                  <div ref={modeMenuRef} className="relative flex min-w-0 flex-1 items-center justify-end px-2">
                    <button
                      type="button"
                      onClick={() => setIsModeMenuOpen((prev) => !prev)}
                      disabled={!activeWorkspaceId || isLoadingWorkspaceDetail}
                      className="group flex max-w-[220px] shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md disabled:opacity-40 sm:max-w-[260px]"
                      title={`Mod: ${activeWorkspaceMode.label}`}
                    >
                      <span className="hidden shrink-0 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 sm:inline">
                        Mod
                      </span>
                      <span className="min-w-0 truncate text-xs font-black text-slate-900">
                        {activeWorkspaceMode.label}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                        className={`shrink-0 text-slate-400 transition-transform ${isModeMenuOpen ? "rotate-180 text-blue-600" : "group-hover:text-blue-700"}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isModeMenuOpen && (
                      <div className="absolute right-2 top-full z-50 mt-2 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_55px_rgba(15,23,42,0.14)]">
                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                          Çalışma Modu Seç
                        </div>
                        <div className="space-y-1">
                          {WORKSPACE_MODES.map((mode) => {
                            const active = mode.id === workspaceMode;

                            return (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => {
                                  setWorkspaceMode(mode.id);
                                  setIsModeMenuOpen(false);
                                }}
                                disabled={!activeWorkspaceId || isLoadingWorkspaceDetail}
                                className={`flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition-all disabled:opacity-40 ${
                                  active
                                    ? "bg-blue-50 text-blue-950"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                }`}
                              >
                                <span className="min-w-0">
                                  <span className="block text-xs font-black">
                                    {mode.label}
                                  </span>
                                  <span className="mt-0.5 line-clamp-2 block text-[10px] font-medium leading-4 text-slate-500">
                                    {mode.helper}
                                  </span>
                                </span>
                                {active && (
                                  <span className="mt-0.5 shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white">
                                    Aktif
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                }
              >
   <div className="flex h-full min-h-0 flex-col">
     <div
  ref={chatScrollRef}
  onMouseUp={handleChatTextSelection}
  onTouchEnd={handleChatTextSelection}
  className="flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar"
>
       {isLoadingWorkspaceDetail ? (
         <div className="flex h-full min-h-[220px] items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
           <div>
             <div className="mb-2 text-2xl opacity-50">⏳</div>
             <div className="text-xs font-bold text-slate-500">Çalışma alanı yükleniyor...</div>
           </div>
         </div>
       ) : messages.map((message) => {
         const isUser = message.role === "user";
         const isThinkingMessage = !isUser && Boolean(message.sources?.loading);
         return (
           <div key={message.id} className="flex w-full">
             <div className={[
                 isUser
            ? "ml-auto max-w-[78%] rounded-3xl px-5 py-4 text-[12px] leading-6 shadow-sm border"
            : isThinkingMessage
              ? "mr-auto w-full rounded-3xl px-5 py-4 text-[12px] leading-6 shadow-sm border"
              : "mr-auto w-full rounded-3xl px-5 py-4 text-[12px] leading-6 shadow-sm border",
                 isUser
                   ? "border-blue-800 bg-gradient-to-br from-blue-800 to-blue-950 text-white"
                   : "border-slate-200 bg-white text-slate-800",
               ].join(" ")}>
               {isThinkingMessage ? (
                 <div className="flex items-center gap-3 text-slate-500">
                   <span className="flex shrink-0 items-center gap-1">
                     <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.24s]" />
                     <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.12s]" />
                     <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                   </span>
                   <span className="animate-pulse font-bold italic text-slate-500">
                     {message.text}
                   </span>
                 </div>
               ) : (
                 <RichMessageText text={message.text} isUser={isUser} autoLink={!isUser} />
               )}
               {!isUser && !isThinkingMessage && (
                 <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                   <button
                     onClick={() => addBotTextToNotes(message.text)}
                     className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                   >
                     Notlara Ekle
                   </button>
                 </div>
               )}
             </div>
           </div>
         );
       })}
       <div ref={chatMessagesEndRef} className="h-1" />
       {selectedChatText && (
  <div className="sticky bottom-2 z-20 flex justify-center">
    <div ref={selectedTextActionRef} className="flex max-w-[92%] items-center gap-2 rounded-2xl border border-blue-100 bg-white/95 px-3 py-2 shadow-[0_12px_35px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div className="min-w-0 truncate text-[11px] font-semibold text-slate-500">
        Seçildi: {selectedChatText.slice(0, 80)}{selectedChatText.length > 80 ? "..." : ""}
      </div>

      <button
        type="button"
        onClick={() => {
          addBotTextToNotes(selectedChatText);
          clearSelectedChatText();
        }}
        className="shrink-0 rounded-xl bg-blue-600 px-3 py-1.5 text-[10px] font-black text-white transition-all hover:bg-blue-700"
      >
        Notlara Ekle
      </button>

      <button
        type="button"
        onClick={clearSelectedChatText}
        className="shrink-0 rounded-xl bg-slate-100 px-2.5 py-1.5 text-[10px] font-black text-slate-500 transition-all hover:bg-slate-200"
      >
        Kapat
      </button>
    </div>
  </div>
)}

     </div>

                  <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 bg-white p-2.5 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10">
                    <div className="relative rounded-2xl border-2 border-slate-100 bg-slate-50 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`${activeWorkspace.title} kapsamında ${activeWorkspaceMode.label} için sorunuzu yazın...`}
                        className="min-h-[58px] w-full resize-none rounded-2xl bg-transparent px-4 pb-12 pt-3 text-[13px] font-medium leading-5 outline-none placeholder:text-slate-400 custom-scrollbar"
                      />

                      <div className="absolute bottom-2 right-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setForceCaseSearchEnabled((prev) => !prev)}
                          className={`rounded-xl border px-3.5 py-2 text-[11px] font-black shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:shadow-none ${
                            forceCaseSearchEnabled
                              ? "border-blue-700 bg-blue-700 text-white"
                              : "border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
                          }`}
                          disabled={!activeWorkspaceId || isLoadingWorkspaceDetail}
                        >
                          {forceCaseSearchEnabled ? "✓ Karar Aranacak" : "Yeni Karar Ara"}
                        </button>

                        <button
                          type="submit"
                          className="rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-black text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:shadow-none"
                          disabled={
                            !input.trim() ||
                            !activeWorkspaceId ||
                            isLoadingWorkspaceDetail ||
                            isLoadingTokenBalance ||
                            (Number.isFinite(Number(tokenBalance)) && Number(tokenBalance) < currentMessageTokenCost)
                          }
                        >
                          {Number.isFinite(Number(tokenBalance)) && Number(tokenBalance) < currentMessageTokenCost ? "Token Yok" : "Sor"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[10px] font-bold text-slate-400">
                      <span>İlk 3 mesaj 1 token, sonraki mesajlar 2 token. Bu mesaj: {currentMessageTokenCost} token.</span>
                      {Number.isFinite(Number(tokenBalance)) && (
                        <span className={Number(tokenBalance) < currentMessageTokenCost ? "text-red-600" : "text-emerald-600"}>
                          Kalan token: {tokenBalance}
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              </WorkspacePanel>
            </div>

            <div className={`${visiblePanels.decisions || visiblePanels.statutes ? "grid" : "hidden"} min-h-0 gap-4 xl:col-span-4`}>
                           {visiblePanels.decisions && (
                <WorkspacePanel id="decisions" title="Kararlar" subtitle="AI karar önerileri ve kaydettikleriniz" setActivePanel={setActivePanel}>
                  <div className="flex h-full min-h-0 flex-col overflow-hidden">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-white/50 px-4 py-3 backdrop-blur-md">
                      <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase tracking-widest text-blue-900">
                          {decisionView === "ai" ? "Yapay Zeka Buldu" : "Kayıtlı Kararlar"}
                        </div>
                        <div className="mt-0.5 text-[10px] font-bold text-slate-500">
                          {decisionView === "ai" ? `${aiDecisions.length} öneri` : `${savedDecisions.length} kayıt`}
                        </div>
                      </div>

                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setDecisionView("ai")}
                          className={`rounded-lg px-3 py-1.5 text-[10px] font-black transition-all ${decisionView === "ai" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                          Öneriler
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionView("saved")}
                          className={`rounded-lg px-3 py-1.5 text-[10px] font-black transition-all ${decisionView === "saved" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                          Kayıtlılar
                        </button>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 custom-scrollbar">
                      {decisionView === "ai" ? (
                        aiDecisions.length ? aiDecisions.map((decision) => {
                          const decisionKey = getDecisionKey(decision);
                          const saved = savedDecisionIds.includes(decisionKey);

                          return (
                            <DecisionCard
                              key={decisionKey}
                              decision={decision}
                              saved={saved}
                              onToggleSave={() => toggleSavedDecision(decisionKey)}
                              primaryLabel={saved ? "Kaydedildi" : "Kaydet"}
                            />
                          );
                        }) : (
                          <div className="flex flex-col items-center justify-center h-full rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
                            <span className="text-2xl mb-2 opacity-40">⚖️</span>
                            <div className="text-xs font-bold text-slate-500">Henüz AI tarafından bulunan karar yok.</div>
                          </div>
                        )
                      ) : savedDecisions.length ? (
                        savedDecisions.map((decision) => (
                          <DecisionCard
                            key={getDecisionKey(decision)}
                            decision={decision}
                            saved
                            onToggleSave={() => toggleSavedDecision(getDecisionKey(decision))}
                            primaryLabel="Kaldır"
                          />
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
                          <span className="text-2xl mb-2 opacity-40">⚖️</span>
                          <div className="text-xs font-bold text-slate-500">Henüz kaydedilen karar yok.</div>
                        </div>
                      )}
                    </div>
                  </div>
                </WorkspacePanel>
              )}

              {visiblePanels.statutes && (
                <WorkspacePanel id="statutes" title="Mevzuat" subtitle="Tespit edilen ilgili kanun maddeleri" setActivePanel={setActivePanel}>
                  <div className="space-y-3 overflow-y-auto p-4 custom-scrollbar h-full">
                    {aiStatutes.length ? aiStatutes.map((item) => {

                      return (
                        <div key={item.id} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md cursor-pointer relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-100 group-hover:bg-blue-500 transition-colors"></div>

                          <div className="flex justify-between items-start mb-1 pl-2 gap-2">
                            <div className="min-w-0">
                              <div className="text-xs font-black text-slate-900">{item.name}</div>
                              <div className="mt-2 text-[11px] font-medium text-slate-500">{item.note}</div>
                            </div>

<div className="flex shrink-0 flex-col items-end gap-2">
  <div className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">{item.article}</div>
</div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
                        <span className="text-2xl mb-2 opacity-40">📚</span>
                        <div className="text-xs font-bold text-slate-500">Henüz AI tarafından bulunan mevzuat yok.</div>
                      </div>
                    )}
                  </div>
                </WorkspacePanel>
              )}
            </div>

            <div className={`${visiblePanels.notes ? "block" : "hidden"} min-h-0 ${visiblePanels.decisions || visiblePanels.statutes ? "xl:col-span-3" : "xl:col-span-4"}`}>
              <WorkspacePanel id="notes" title="Strateji & Notlar" subtitle="Dosya içi hatırlatmalar" setActivePanel={setActivePanel}>
                <div className="flex h-full min-h-0 flex-col bg-slate-50/50">
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {notes.length ? (
                      <div className="space-y-3">
                        {notes.map((note) => (
                          <div key={note.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                            <div className={`absolute inset-y-0 left-0 w-1 ${note.type === 'Risk' ? 'bg-red-500' : 'bg-gradient-to-b from-blue-900 to-blue-500'}`} />
                            <div className="pl-2">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest ${note.type === 'Risk' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-800'}`}>
                                  {note.type}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="rounded-lg bg-slate-50 px-2 py-1 text-[9px] font-black text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                                >
                                  Sil
                                </button>
                              </div>
                              <ExpandableNoteText
                                text={note.text}
                                expanded={isNoteExpanded(note.id)}
                                onToggle={() => toggleNoteExpanded(note.id)}
                                className="text-[11px] font-medium leading-5 text-slate-700"
                                buttonClassName="mt-2 rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-800 hover:bg-blue-100"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
                        <span className="text-2xl mb-2 opacity-40">📝</span>
                        <div className="text-xs font-bold text-slate-500">Henüz not yok</div>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 border-t border-slate-200 bg-white p-3 z-10">
                    <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-3 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]">
                      <textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Yeni not ekle..."
                        className="min-h-[80px] w-full resize-none bg-transparent text-xs font-medium leading-5 text-slate-700 outline-none placeholder:text-slate-400 custom-scrollbar"
                      />
                      <div className="mt-2 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-slate-400">
                          {newNoteText.trim().length} harf
                        </span>
                        <button
                          type="button"
                          onClick={handleAddManualNote}
                          disabled={!newNoteText.trim() || !activeWorkspaceId}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-black text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-40 hover:-translate-y-0.5"
                        >
                          Ekle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </WorkspacePanel>
            </div>
          </section>
        </main>
      </div>
{activeFileSummary && (
  <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-800">
              Belge Detayları
            </div>
            <h2 className="mt-2 truncate text-xl font-black text-slate-950">
              {activeFileSummary.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setActiveFileSummary(null)}
            className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50"
          >
            Kapat
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-white/70 p-1 shadow-sm ring-1 ring-slate-200/70">
          <button
            type="button"
            onClick={() => setActiveFileDetailTab("analysis")}
            className={`rounded-xl px-3 py-2 text-[11px] font-black transition-all ${
              activeFileDetailTab === "analysis"
                ? "bg-blue-700 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Akıllı Analiz
          </button>

          <button
            type="button"
            onClick={() => setActiveFileDetailTab("notes")}
            className={`rounded-xl px-3 py-2 text-[11px] font-black transition-all ${
              activeFileDetailTab === "notes"
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Belge Notlarım
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6 custom-scrollbar">
        {activeFileDetailTab === "analysis" && (
          <div className="space-y-4">
            {activeFileSummary.aiSummary && (
              <section className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-800">
                  Kısa Özet
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
                  {activeFileSummary.aiSummary}
                </p>
              </section>
            )}

            {activeFileSummary.detailedSummary && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Detaylı Özet
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700">
                  {activeFileSummary.detailedSummary}
                </p>
              </section>
            )}

            {activeFileSummary.legalKeywords?.length ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Hukuki Anahtar Kelimeler
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeFileSummary.legalKeywords.map((keyword) => (
                    <span
                      key={`${activeFileSummary.id}-modal-${keyword}`}
                      className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {activeFileSummary.risks?.length ? (
              <section className="rounded-3xl border border-red-100 bg-red-50/60 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-red-700">
                  Riskler
                </div>
                <div className="mt-3 space-y-2">
                  {activeFileSummary.risks.map((risk) => (
                    <div
                      key={`${activeFileSummary.id}-risk-${risk}`}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700 shadow-sm"
                    >
                      {risk}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeFileSummary.defenseIssues?.length ? (
              <section className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  Savunma / Strateji Notları
                </div>
                <div className="mt-3 space-y-2">
                  {activeFileSummary.defenseIssues.map((issue) => (
                    <div
                      key={`${activeFileSummary.id}-defense-${issue}`}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700 shadow-sm"
                    >
                      {issue}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        {activeFileDetailTab === "notes" && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Bu Belgeye Ait Notlarım
                </div>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  Burada yalnızca bu belge için sizin aldığınız notlar görünür. AI analizi bu bölümde gösterilmez.
                </p>
              </div>

              <textarea
                value={fileNoteDrafts[activeFileSummary.id] || ""}
                onChange={(e) =>
                  setFileNoteDrafts((prev) => ({
                    ...prev,
                    [activeFileSummary.id]: e.target.value,
                  }))
                }
                placeholder="Bu belge için not yaz..."
                className="min-h-[150px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              />

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => addFileNote(activeFileSummary)}
                  disabled={
                    !String(fileNoteDrafts[activeFileSummary.id] || "").trim() ||
                    savingFileNoteIds.includes(activeFileSummary.id)
                  }
                  className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingFileNoteIds.includes(activeFileSummary.id)
                    ? "Kaydediliyor..."
                    : "Notu Kaydet"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {getNotesForFile(activeFileSummary).length ? (
                getNotesForFile(activeFileSummary).map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Belge Notu
                    </div>

                    <div className="whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                      {note.text}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <span className="text-[10px] font-bold text-slate-400">
                        {note.createdAt
                          ? new Date(note.createdAt).toLocaleString("tr-TR")
                          : ""}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="rounded-xl bg-red-50 px-3 py-1.5 text-[10px] font-black text-red-600 transition-all hover:bg-red-100"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-xs font-bold text-slate-400">
                  Bu belge için henüz kullanıcı notu yok.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {/* YENİ ÇALIŞMA ALANI OLUŞTURMA MODALI (ŞOV KISMI) */}
      {isCreateWorkspaceModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 border-b border-slate-200 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10">
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-slate-900">Yeni Çalışma Alanı</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Dosyalarınızı, kararları ve AI sohbetlerinizi bu alan altında organize edin.
                </p>
              </div>
            </div>
            
            <form onSubmit={handleCreateWorkspaceSubmit} className="p-6">
              <div className="mb-6">
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                  Çalışma Adı
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Örn: Ankara Tahliye Dosyası"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateWorkspaceModalOpen(false)}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-black text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!newWorkspaceName.trim()}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:shadow-none"
                >
                  Oluştur
                </button>
              </div>

              {workspaceError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                  {workspaceError}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Odak Modu Modalı */}
      {activePanel && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/30 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur-xl">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-900">
                  Odak Modu
                </div>
                <div className="mt-1 text-xl font-black text-slate-950">
                  {getPanelTitle(activePanel)}
                </div>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Kapat
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-5 text-sm custom-scrollbar">
              {activePanel === "chat" && (
                <div className="mx-auto max-w-4xl space-y-4">
                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    return (
                      <div key={message.id} className="flex w-full">
                        <div
                          className={[
                            isUser
                              ? "ml-auto max-w-[78%] rounded-3xl border px-5 py-4 shadow-sm"
                              : "mr-auto w-full rounded-3xl border px-5 py-4 shadow-sm",
                            isUser
                              ? "border-blue-800 bg-gradient-to-br from-blue-800 to-blue-950 text-white rounded-tr-sm"
                              : "border-slate-200 bg-white text-slate-800 rounded-tl-sm",
                          ].join(" ")}
                        >
                          <RichMessageText text={message.text} isUser={isUser} autoLink={!isUser} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activePanel === "decisions" && (
                <div className="mx-auto max-w-5xl">
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-blue-900">Kararlar</div>
                      <div className="mt-1 text-xs font-bold text-slate-500">
                        AI önerileri ve kaydedilen kararlar geniş görünümde listelenir.
                      </div>
                    </div>
                    <div className="flex rounded-2xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setDecisionView("ai")}
                        className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${decisionView === "ai" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        Öneriler
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisionView("saved")}
                        className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${decisionView === "saved" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        Kayıtlılar
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {(decisionView === "ai" ? aiDecisions : savedDecisions).length ? (
                      (decisionView === "ai" ? aiDecisions : savedDecisions).map((decision) => {
                        const decisionKey = getDecisionKey(decision);
                        const saved = savedDecisionIds.includes(decisionKey);
                        return (
                          <DecisionCard
                            key={decisionKey}
                            decision={decision}
                            saved={decisionView === "saved" ? true : saved}
                            onToggleSave={() => toggleSavedDecision(decisionKey)}
                            primaryLabel={decisionView === "saved" ? "Kaldır" : saved ? "Kaydedildi" : "Kaydet"}
                          />
                        );
                      })
                    ) : (
                      <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 p-10 text-center text-sm font-bold text-slate-500">
                        Bu bölümde henüz karar yok.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activePanel === "statutes" && (
                <div className="mx-auto max-w-4xl space-y-3">
                  {aiStatutes.length ? (
                    aiStatutes.map((item) => {

                      return (
                        <div key={item.id || getStatuteKey(item)} className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-sm font-black text-slate-900">{item.name}</div>
                              <div className="mt-2 text-xs font-medium leading-6 text-slate-500">{item.note}</div>
                              {item.content && (
                                <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                                  {item.content}
                                </div>
                              )}
                            </div>
                           <div className="flex shrink-0 flex-col items-end gap-2">
  <div className="rounded-xl bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{item.article}</div>
</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 p-10 text-center text-sm font-bold text-slate-500">
                      Henüz AI tarafından bulunan mevzuat yok.
                    </div>
                  )}
                </div>
              )}

              {activePanel === "notes" && (
                <div className="mx-auto max-w-4xl space-y-4">
                  {notes.length ? (
                    notes.map((note) => (
                      <div key={note.id} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-xl bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-800">
                            {note.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="rounded-xl bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            Sil
                          </button>
                        </div>
                        <ExpandableNoteText
                          text={note.text}
                          expanded={isNoteExpanded(note.id)}
                          onToggle={() => toggleNoteExpanded(note.id)}
                          maxLength={1200}
                          className="text-sm font-medium leading-7 text-slate-700"
                          buttonClassName="mt-3 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-800 hover:bg-blue-100"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 p-10 text-center text-sm font-bold text-slate-500">
                      Henüz not yok.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isUploadPerspectiveModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <form
            onSubmit={uploadPendingFilesWithPerspective}
            className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]"
          >
            <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">
                Dosya Yükleme Perspektifi
              </div>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                Belgeyi hangi taraf açısından analiz edelim?
              </h2>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                Bu bilgi zorunludur. AI; risk, savunma, delil ve strateji başlıklarını seçtiğiniz perspektife göre önceliklendirir.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Seçilen dosyalar
                </div>
                <div className="mt-2 max-h-24 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
                  {pendingUploadFiles.map((file) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="truncate text-xs font-bold text-slate-700">
                      • {file.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-black text-slate-900">
                  Bu belgede taraf vekili misiniz? <span className="text-red-500">*</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPartyRepresentative(true);
                      setUploadPerspectiveError("");
                    }}
                    disabled={isUploadingFiles}
                    className={`rounded-xl px-4 py-3 text-xs font-black transition-all disabled:opacity-50 ${
                      isPartyRepresentative === true
                        ? "bg-blue-700 text-white shadow-sm"
                        : "bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-800"
                    }`}
                  >
                    Evet
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPartyRepresentative(false);
                      setRepresentedParty("");
                      setUploadPerspectiveError("");
                    }}
                    disabled={isUploadingFiles}
                    className={`rounded-xl px-4 py-3 text-xs font-black transition-all disabled:opacity-50 ${
                      isPartyRepresentative === false
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Hayır
                  </button>
                </div>
              </div>

              {isPartyRepresentative === true && (
                <div>
                  <label className="mb-1.5 block text-sm font-black text-slate-900">
                    Hangi tarafın vekilisiniz? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={representedParty}
                    onChange={(e) => {
                      setRepresentedParty(e.target.value);
                      setUploadPerspectiveError("");
                    }}
                    disabled={isUploadingFiles}
                    placeholder="Örn. Davacı, Davalı, Sanık, Müşteki, Alacaklı..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:opacity-50"
                    autoFocus
                  />
                </div>
              )}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
  <div className="flex items-start justify-between gap-3">
    <div>
      <div className="text-sm font-black text-slate-950">
        Dosya analizi yapılsın mı?
      </div>
      <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">
        AI dosyayı özetler, riskleri ve delilleri çıkarır. Bu işlem 1 token kullanır.
      </div>
    </div>

    <div className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-blue-700 shadow-sm">
      1 Token
    </div>
  </div>

  <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-inner">
    <button
      type="button"
      onClick={() => setShouldAnalyzeFile(true)}
      disabled={isUploadingFiles}
      className={`rounded-xl px-3 py-2 text-xs font-black transition-all disabled:opacity-50 ${
        shouldAnalyzeFile
          ? "bg-blue-700 text-white shadow-sm"
          : "text-slate-500 hover:bg-blue-50 hover:text-blue-800"
      }`}
    >
      Evet, analiz et
    </button>

    <button
      type="button"
      onClick={() => setShouldAnalyzeFile(false)}
      disabled={isUploadingFiles}
      className={`rounded-xl px-3 py-2 text-xs font-black transition-all disabled:opacity-50 ${
        !shouldAnalyzeFile
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      Hayır, sadece kaydet
    </button>
  </div>
</div>

              {uploadPerspectiveError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                  {uploadPerspectiveError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={resetUploadPerspectiveState}
                disabled={isUploadingFiles}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={
                  isUploadingFiles ||
                  isPartyRepresentative === null ||
                  (isPartyRepresentative === true && !representedParty.trim())
                }
                className="rounded-2xl bg-blue-700 px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_22px_rgba(37,99,235,0.28)] transition-all hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {isUploadingFiles ? "Yükleniyor..." : shouldAnalyzeFile ? "Yükle ve Analiz Et" : "Sadece Kaydet"}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Scrollbar Stilleri İçin CSS */}
    <style dangerouslySetInnerHTML={{__html: `
        body.calisma-global-header-hidden [data-global-header="true"] {
          display: none !important;
        }

        body.calisma-global-header-hidden {
          padding-top: 0 !important;
        }

        body.calisma-global-header-hidden > main,
        body.calisma-global-header-hidden #__next > main,
        body.calisma-global-header-hidden [data-app-main="true"] {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.3);
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.5);
        }
      `}} />
    </div>
  );
}
function ExpandableNoteText({
  text,
  expanded,
  onToggle,
  maxLength = 200,
  className = "",
  buttonClassName = "",
}) {
  const value = String(text || "");
  const shouldCollapse = value.length > maxLength;
  const visibleText = shouldCollapse && !expanded ? `${value.slice(0, maxLength).trim()}...` : value;

  return (
    <div>
      <div className={className}>
        <RichMessageText text={visibleText} isUser={false} autoLink />
      </div>

      {shouldCollapse && (
        <button type="button" onClick={onToggle} className={buttonClassName}>
          {expanded ? "Daha az göster" : "Devamını gör"}
        </button>
      )}
    </div>
  );
}

function RichMessageText({ text, isUser, autoLink = false }) {
const preparedText = autoLink ? autoLinkDecisionsInText(text) : String(text || "");
const normalizedText = preparedText
  .replace(/\r\n/g, "\n")
  .replace(/[ \t]+\n/g, "\n")
  .replace(/\n{3,}/g, "\n")
  .trim();

const lines = normalizedText.split("\n");

  function renderInline(value) {
    const parts = String(value || "").split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className={isUser ? "font-black text-white" : "font-black text-slate-950"}>
            {renderInline(part.slice(2, -2))}
          </strong>
        );
      }

      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const href = linkMatch[2];
        const isDecisionLink = href.startsWith("/kararlar/");
        return (
          <a
            key={index}
            href={href}
            target={isDecisionLink ? "_blank" : undefined}
            rel={isDecisionLink ? "noreferrer" : undefined}
            className={isUser ? "font-black underline decoration-white/60 underline-offset-4" : "font-black text-blue-800 underline decoration-blue-300 underline-offset-4 hover:text-blue-950"}
          >
            {linkMatch[1]}
          </a>
        );
      }

      return <span key={index}>{part}</span>;
    });
  }

  return (
    <div className={isUser ? "space-y-2 text-[12px] leading-6" : "space-y-3 text-[12px] leading-6 text-slate-800"}>
      {lines.map((line, index) => {
        const clean = line.trim();

        if (!clean) {
          return <div key={index} className="h-1" />;
        }

        if (/^####\s+/.test(clean)) {
          return (
            <h5 key={index} className={isUser ? "text-[12px] font-black text-white" : "mt-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-[12px] font-black leading-5 text-blue-950"}>
              {renderInline(clean.replace(/^####\s+/, ""))}
            </h5>
          );
        }

        if (/^###\s+/.test(clean)) {
          return (
            <h4 key={index} className={isUser ? "text-sm font-black text-white" : "mt-3 text-sm font-black uppercase tracking-wide text-blue-900"}>
              {renderInline(clean.replace(/^###\s+/, ""))}
            </h4>
          );
        }

        if (/^##\s+/.test(clean)) {
          return (
            <h3 key={index} className={isUser ? "text-sm font-black text-white" : "mt-3 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-black tracking-tight text-slate-950"}>
              {renderInline(clean.replace(/^##\s+/, ""))}
            </h3>
          );
        }

        if (/^#\s+/.test(clean)) {
          return (
            <h2 key={index} className={isUser ? "text-base font-black text-white" : "mt-3 text-[12px] font-black tracking-tight text-slate-950"}>
              {renderInline(clean.replace(/^#\s+/, ""))}
            </h2>
          );
        }

        if (clean.startsWith(">")) {
          return (
            <blockquote key={index} className="rounded-2xl border-l-4 border-blue-500 bg-blue-50/70 px-4 py-3 text-sm font-semibold leading-7 text-slate-800 shadow-sm">
              {renderInline(clean.replace(/^>\s?/, ""))}
            </blockquote>
          );
        }

        if (/^[-•]\s+/.test(clean)) {
          return (
            <div key={index} className={isUser ? "flex gap-2 text-white" : "flex gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-700"}>
              <span className={isUser ? "mt-0.5 text-white" : "mt-0.5 text-blue-700"}>•</span>
              <span>{renderInline(clean.replace(/^[-•]\s+/, ""))}</span>
            </div>
          );
        }

        if (/^\d+[.)]\s+/.test(clean)) {
          const number = clean.match(/^\d+/)?.[0];
          return (
            <div key={index} className={isUser ? "flex gap-2 text-white" : "flex gap-3 rounded-xl bg-slate-50 px-3 py-2 text-slate-700"}>
              <span className={isUser ? "font-black text-white" : "font-black text-blue-800"}>{number}.</span>
              <span>{renderInline(clean.replace(/^\d+[.)]\s+/, ""))}</span>
            </div>
          );
        }

        return (
          <p key={index} className={isUser ? "text-white" : "text-slate-800"}>
            {renderInline(clean)}
          </p>
        );
      })}
    </div>
  );
}

function WorkspacePanel({ id, title, subtitle, children, setActivePanel, actions }) {
  return (
    <section className="flex h-full min-h-[260px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-slate-900">{title}</h3>
            <p className="truncate text-[11px] font-medium text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button
              onClick={() => setActivePanel(id)}
              className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              Büyüt
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </section>
  );
}

function DecisionCard({ decision, saved, onToggleSave, onOpenDetail, primaryLabel }) {
  const decisionSlug = getDecisionSlug(decision);
  const [localDetailOpen, setLocalDetailOpen] = useState(false);
  const openDetail = onOpenDetail || (() => setLocalDetailOpen(true));

  return (
    <>
      <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900">{decision.court}</div>
            <div className="mt-1 inline-block rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
              {decision.code}
            </div>
          </div>
          {saved && (
            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700">
              Kayıtlı
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="line-clamp-2">{decision.tag}</span>
        </div>

        {(String(decision?.used_part || decision?.usedPart || "").trim() || String(decision?.relevance || "").trim()) && (
          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
            {String(decision?.used_part || decision?.usedPart || "").trim() ? (
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-blue-800">
                  Yararlanılan Kısım
                </div>
                <div className="mt-1 line-clamp-2 text-[11px] font-medium leading-5 text-slate-700">
                  {decision.used_part || decision.usedPart}
                </div>
              </div>
            ) : (
              String(decision?.relevance || "").trim() ? (
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-blue-800">
                    Somut Olayla Bağlantı
                  </div>
                  <div className="mt-1 line-clamp-2 text-[11px] font-medium leading-5 text-slate-700">
                    {decision.relevance}
                  </div>
                </div>
              ) : null
            )}

            <button
              type="button"
              onClick={openDetail}
              className="mt-2 rounded-lg bg-white px-2.5 py-1 text-[10px] font-black text-blue-800 shadow-sm transition-all hover:bg-blue-100"
            >
              Detay Gör
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {decisionSlug ? (
            <a
              href={`/kararlar/${encodeURIComponent(decisionSlug)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Tam Karar Metnini Gör
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center text-[11px] font-bold text-slate-400 transition-colors"
            >
              Detay Yok
            </button>
          )}
          <button
            type="button"
            onClick={onToggleSave}
            className={`flex-1 rounded-xl px-2 py-2 text-center text-[11px] font-bold transition-all ${
              saved
                ? "bg-slate-800 text-white shadow-md hover:bg-slate-900"
                : "border border-blue-100 bg-blue-50 text-blue-800 hover:bg-blue-100"
            }`}
          >
            {primaryLabel}
          </button>
        </div>
      </div>

      {localDetailOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-800">
                    Karar Detayı
                  </div>
                  <h2 className="mt-2 text-xl font-black text-slate-950">
                    {decision.court || "Yargıtay Kararı"}
                  </h2>
                  {decision.code && (
                    <div className="mt-2 inline-flex rounded-xl bg-blue-700 px-3 py-1 text-xs font-black text-white shadow-sm">
                      {decision.code}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setLocalDetailOpen(false)}
                  className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6 custom-scrollbar">
              {decision.tag && (
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Konu Etiketi
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
                    {decision.tag}
                  </p>
                </section>
              )}

              {String(decision?.used_part || decision?.usedPart || "").trim() && (
                <section className="mt-4 rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-800">
                    Yararlanılan Kısım
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
                    {decision.used_part || decision.usedPart}
                  </p>
                </section>
              )}

              {String(decision?.relevance || "").trim() && (
                <section className="mt-4 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                    Somut Olayla Bağlantı
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
                    {decision.relevance}
                  </p>
                </section>
              )}

              {decision.summary && (
                <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Kısa Özet
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700">
                    {decision.summary}
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function getPanelTitle(id) {
  const map = {
    chat: "Çalışma Alanı",
    decisions: "Kararlar",
    statutes: "Mevzuat",
    notes: "Strateji & Notlar",
  };
  return map[id] || "Panel";
}