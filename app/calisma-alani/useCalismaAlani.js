"use client";

// =============================================================================
// useCalismaAlani
// Çalışma Alanı sayfasının TÜM mantığı: state, ref, effect ve handler'lar.
// page.jsx ve alt bileşenler bu hook'un döndürdüğü `vm` nesnesini kullanır.
// Davranış, eski tek-dosya sürümle birebir aynıdır; yalnızca yer değiştirdi.
// =============================================================================

import { useMemo, useState, useEffect, useRef } from "react";

import {
  WORKSPACE_AI_API_BASE,
  MAX_WORKSPACE_FILE_SIZE_MB,
  MAX_WORKSPACE_FILE_SIZE_BYTES,
  WORKSPACE_MODES,
  getWorkspaceMessageTokenCost,
  getDecisionSlug,
  getDecisionKey,
  getStatuteKey,
  stripDecisionCardsPayload,
} from "./workspace-utils";

export default function useCalismaAlani() {
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
  const [contextDecisions, setContextDecisions] = useState([]);
  // Bağlam kararlarının AI özetleri: { [decisionKey]: { loading, summary, error } }
  const [contextSummaries, setContextSummaries] = useState({});
  // AI özeti modalı için seçili bağlam kararı
  const [activeContextSummary, setActiveContextSummary] = useState(null);
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

  // --- Mobil / responsive durum ---
  // hasMounted: SSR ile ilk client render'ın aynı olması için (hydration güvenliği)
  const [hasMounted, setHasMounted] = useState(false);
  // isMobile: xl (1280px) altındaki tüm ekranlar mobil/tablet düzenini kullanır
  const [isMobile, setIsMobile] = useState(false);
  // mobileTab: mobilde tek seferde gösterilen panel
  const [mobileTab, setMobileTab] = useState("chat");
  // mobileSidebarOpen: mobilde soldan kayan belge çekmecesi
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 1279px)");
    const update = () => setIsMobile(mq.matches);
    update();
    // Eski Safari uyumu için addListener fallback
    if (mq.addEventListener) {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  // Masaüstüne geçildiğinde mobil çekmece açık kalmasın
  useEffect(() => {
    if (!isMobile) setMobileSidebarOpen(false);
  }, [isMobile]);

  const [forceCaseSearchEnabled, setForceCaseSearchEnabled] = useState(false);
  const [deepThinkingEnabled, setDeepThinkingEnabled] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState("general_analysis");
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [expandedNoteIds, setExpandedNoteIds] = useState([]);
  const [selectedChatText, setSelectedChatText] = useState("");
  // Sohbet en altta mı? "En alta in" butonu ve oto-takip için kullanılır.
  const [isAtChatBottom, setIsAtChatBottom] = useState(true);

  // Yeni Tasarım İçin Eklenen Stateler
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [workspaceDeleteTarget, setWorkspaceDeleteTarget] = useState(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
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
  // Oto-takip durumunu effect içinde bayat closure olmadan okumak için ref.
  const isAtChatBottomRef = useRef(true);

  // Aktif workspace id'sini her render'da güncel tutan ref.
  // Stream (handleSubmit) sürerken kullanıcı başka bir workspace'e geçerse,
  // eski gönderimin kararlarının yeni workspace'in state'ini ezmesini engellemek
  // için kullanılır.
  const activeWorkspaceIdRef = useRef(activeWorkspaceId);
  useEffect(() => {
    activeWorkspaceIdRef.current = activeWorkspaceId;
  }, [activeWorkspaceId]);

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

  // Sohbet en alta yakın mı? (eşik: 80px)
  function isChatNearBottom() {
    const el = chatScrollRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance <= 80;
  }

  // Kullanıcının elle kaydırmasını dinler: en alttaysa oto-takip açık,
  // yukarı kaydırdıysa kapalı kalır.
  function handleChatScroll() {
    const atBottom = isChatNearBottom();
    isAtChatBottomRef.current = atBottom;
    setIsAtChatBottom((prev) => (prev === atBottom ? prev : atBottom));
  }

  // Programatik olarak en alta in ve oto-takibi tekrar aç.
  function scrollChatToBottom(behavior = "smooth") {
    isAtChatBottomRef.current = true;
    setIsAtChatBottom(true);
    requestAnimationFrame(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }

  // Yeni mesaj/akış geldiğinde: yalnızca kullanıcı en alttaysa takip et.
  useEffect(() => {
    if (!chatScrollRef.current) return;
    if (!isAtChatBottomRef.current) return;

    requestAnimationFrame(() => {
      chatMessagesEndRef.current?.scrollIntoView({
        behavior: "auto",
        block: "end",
      });
    });
  }, [messages, isLoadingWorkspaceDetail]);

  // Workspace değişince oto-takibi sıfırla (yeni sohbet en altta başlasın).
  useEffect(() => {
    isAtChatBottomRef.current = true;
    setIsAtChatBottom(true);
  }, [activeWorkspaceId]);

  const [notes, setNotes] = useState([]);

  const [files, setFiles] = useState([]);

  const [workspaces, setWorkspaces] = useState([]);

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
    if (!file?.id) return [];

    return notes.filter((note) => {
      if (note?.fileId) {
        return note.fileId === file.id;
      }

      // Eski kayıtlarla geriye dönük uyumluluk:
      // fileId eklenmeden önce belge notları type alanında dosya adıyla tutuluyordu.
      return note?.type === getFileNoteType(file);
    });
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
          text: "Bu çalışma alanı hazır. İstediğiniz hukuki sorularınızı sorabilir, dosyalarınızı ekleyebilir ve bunlar hakkında da görüş isteyebilir, notlarınızı ve kararlarınızı burada toplayabilirsiniz.",
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
      setContextDecisions([]);
      setContextSummaries({});
      setActiveContextSummary(null);
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
    setContextDecisions([]);
    setContextSummaries({});
    setActiveContextSummary(null);
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
                  text: "Bu çalışma alanı hazır. İstediğiniz hukuki sorularınızı sorabilir, dosyalarınızı ekleyebilir ve bunlar hakkında da görüş isteyebilir, notlarınızı ve kararlarınızı burada toplayabilirsiniz.",
                  createdAt: new Date().toISOString(),
                },
              ]
        );

        setNotes(
          Array.isArray(workspace.notes)
            ? workspace.notes.map((note) => ({
                id: note.id,
                fileId: note.fileId || null,
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
                documentClass: file.documentClass || file.aiProfile?.documentClass || file.aiProfile?.document_class || "",
                legalKeywords: Array.isArray(file.legalKeywords) ? file.legalKeywords : [],
                detectedStatutes: Array.isArray(file.detectedStatutes) ? file.detectedStatutes : [],
                keyFacts: Array.isArray(file.keyFacts) ? file.keyFacts : [],
                keyDates: Array.isArray(file.keyDates) ? file.keyDates : [],
                parties: Array.isArray(file.parties) ? file.parties : [],
                evidenceList: Array.isArray(file.evidenceList) ? file.evidenceList : [],
                claimsOrAccusations: Array.isArray(file.claimsOrAccusations)
                  ? file.claimsOrAccusations
                  : Array.isArray(file.aiProfile?.claimsOrAccusations)
                    ? file.aiProfile.claimsOrAccusations
                    : Array.isArray(file.aiProfile?.claims_or_accusations)
                      ? file.aiProfile.claims_or_accusations
                      : [],
                fields: Array.isArray(file.fields)
                  ? file.fields
                  : Array.isArray(file.aiProfile?.fields)
                    ? file.aiProfile.fields
                    : [],
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

        const loadedAiDecisions = Array.isArray(latestAssistantWithSources?.sources?.decisions)
          ? latestAssistantWithSources.sources.decisions
          : [];

        const loadedContextDecisions = Array.isArray(latestAssistantWithSources?.sources?.contextDecisions)
          ? latestAssistantWithSources.sources.contextDecisions
          : [];

        const splitLoaded = splitAiAndContextDecisions(loadedAiDecisions);
        setAiDecisions(splitLoaded.ai);
        setContextDecisions(
          loadedContextDecisions.length ? loadedContextDecisions : splitLoaded.context
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

  // Yararlanılan (ai) listesi: tekrarsız. Bu liste önceliklidir; AI'ın
  // gerçekten yararlandığı kararlar her zaman burada görünür.
  const displayedAiDecisions = useMemo(() => {
    // Bağlam (emsal) kararlarındaki gerçek rerank sırasını key -> rank olarak indeksle.
    // AI kartında rank yoksa, aynı karar bağlam listesinde bulunuyorsa oradaki
    // rerank sırasını ödünç alırız; böylece "Yararlanılan" sekmesi de arama
    // sonucuyla aynı sırayı izler.
    const rankByKey = new Map();
    for (const decision of Array.isArray(contextDecisions) ? contextDecisions : []) {
      const key = getDecisionKey(decision);
      if (key && !rankByKey.has(key) && Number.isFinite(Number(decision?.rank))) {
        rankByKey.set(key, Number(decision.rank));
      }
    }

    const rankFor = (decision) => {
      if (Number.isFinite(Number(decision?.rank))) return Number(decision.rank);
      const key = getDecisionKey(decision);
      if (key && rankByKey.has(key)) return rankByKey.get(key);
      return Number.MAX_SAFE_INTEGER;
    };

    const seen = new Set();
    const out = [];
    for (const decision of Array.isArray(aiDecisions) ? aiDecisions : []) {
      const key = getDecisionKey(decision);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(decision);
    }

    // Önce kartın kendi rank'i, yoksa bağlamdan ödünç alınan rank, o da yoksa
    // ekleme sırası (stable sort sayesinde korunur).
    out.sort((a, b) => rankFor(a) - rankFor(b));
    return out;
  }, [aiDecisions, contextDecisions]);

  // Emsal (context) listesi: tekrarsız + yararlanılan listesinde olanlar çıkarılır.
  // Böylece aynı karar iki sekmede birden görünmez, ama yararlanılan kararlar kaybolmaz.
  const displayedContextDecisions = useMemo(() => {
    const aiKeys = new Set(displayedAiDecisions.map((d) => getDecisionKey(d)));
    const seen = new Set();
    const out = [];
    for (const decision of Array.isArray(contextDecisions) ? contextDecisions : []) {
      const key = getDecisionKey(decision);
      if (!key || seen.has(key)) continue;
      if (aiKeys.has(key)) continue;
      seen.add(key);
      out.push(decision);
    }
    // Backend'den gelen rerank sırasını koru (rank alanı). rank yoksa mevcut
    // (ekleme) sırası korunur; sort kararlı (stable) olduğu için güvenli.
    out.sort((a, b) => {
      const ra = Number.isFinite(Number(a?.rank)) ? Number(a.rank) : Number.MAX_SAFE_INTEGER;
      const rb = Number.isFinite(Number(b?.rank)) ? Number(b.rank) : Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });
    return out;
  }, [contextDecisions, displayedAiDecisions]);

  const savedStatuteKeys = useMemo(
    () => new Set(savedStatutes.map((item) => getStatuteKey(item))),
    [savedStatutes]
  );

  async function toggleSavedDecision(decisionId) {
    if (!activeWorkspaceId) return;

    const decision = [...aiDecisions, ...contextDecisions, ...savedDecisionItems].find((item) => getDecisionKey(item) === decisionId);
    if (!decision) return;

    const alreadySaved = savedDecisionIds.includes(decisionId);

    setSavedDecisionIds((prev) =>
      alreadySaved
        ? prev.filter((id) => id !== decisionId)
        : [...prev, decisionId]
    );

    try {
      if (alreadySaved) {
        const deleteParams = new URLSearchParams();

        // Öncelik: kararId (DB tarafında en stabil anahtar)
        if (decision.kararId) {
          deleteParams.set("kararId", decision.kararId);
        } else {
          // Yedek: slug/fileName tabanlı kimlik
          const deleteSlug = getDecisionSlug(decision) || decision.slug || decision.id || decision.source_id || "";
          if (deleteSlug) {
            deleteParams.set("slug", deleteSlug);
          }
        }

        // En kötü ihtimal: yine de eski davranışa dön (UI key)
        if (![...deleteParams.keys()].length) {
          deleteParams.set("slug", decisionId);
        }

        const res = await fetch(
          `/api/workspaces/${activeWorkspaceId}/decisions?${deleteParams.toString()}`,
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
          subtitle: "Çalışma Alanı",
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
function openDeleteWorkspaceModal(workspace) {
  if (!workspace?.id) return;
  setWorkspaceDeleteTarget(workspace);
}

function closeDeleteWorkspaceModal() {
  if (isDeletingWorkspace) return;
  setWorkspaceDeleteTarget(null);
}

async function confirmDeleteWorkspace() {
  const workspaceId = workspaceDeleteTarget?.id;
  if (!workspaceId || isDeletingWorkspace) return;

  const previousWorkspaces = workspaces;
  setIsDeletingWorkspace(true);

  try {
    // Optimistic UI: listeden kaldır
    const nextWorkspaces = previousWorkspaces.filter((ws) => ws.id !== workspaceId);
    setWorkspaces(nextWorkspaces);

    // Eğer aktif workspace silindiyse, kalanlardan ilkine geç
    if (activeWorkspaceId === workspaceId) {
      setActiveWorkspaceId(nextWorkspaces[0]?.id || null);
    }

    const res = await fetch(`/api/workspaces/${workspaceId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "Çalışma alanı silinemedi.");
    }

    setWorkspaceDeleteTarget(null);
    setWorkspaceError("");
  } catch (error) {
    console.error("Workspace silinirken hata:", error);
    // rollback
    setWorkspaces(previousWorkspaces);
    setWorkspaceError(error?.message || "Çalışma alanı silinemedi.");
  } finally {
    setIsDeletingWorkspace(false);
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

  function splitAiAndContextDecisions(list) {
    const arr = Array.isArray(list) ? list : [];

    const isAi = (d) => {
      const used = String(d?.used_part || d?.usedPart || "").trim();
      const rel = String(d?.relevance || "").trim();
      return Boolean(used || rel);
    };

    return {
      ai: arr.filter(isAi),
      context: arr.filter((d) => !isAi(d)),
    };
  }
  // Bağlam kararının AI özetini, dosya adından (slug) DB'deki aiSummary kolonuyla
  // eşleştirerek getirir. Tek seferlik fetch yapar ve sonucu cache'ler.
  async function openContextSummary(decision) {
    if (!decision) return;

    const key = getDecisionKey(decision);
    setActiveContextSummary(decision);

    const existing = contextSummaries[key];
    if (existing && (existing.loading || existing.summary)) return;

    // DB fileName tabanı = slug. Karar tablosu fileName ile eşleştiği için
    // özeti code/type yerine slug ile sorguluyoruz; code/type yedek kalıyor.
    const slug = getDecisionSlug(decision) || decision.slug || decision.source_id || "";
    const code = decision.code;
    const court = decision.court || decision.type || decision.daire;

    if (!slug && !code) {
      setContextSummaries((prev) => ({
        ...prev,
        [key]: { loading: false, summary: "", error: "Karar kimliği bulunamadı." },
      }));
      return;
    }

    setContextSummaries((prev) => ({
      ...prev,
      [key]: { loading: true, summary: "", error: "" },
    }));

    try {
      const params = new URLSearchParams();
      if (slug) params.set("slug", slug);
      if (code) params.set("code", code);
      if (court) params.set("type", court);

      const res = await fetch(`/api/kararlar/summary?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "DB'den AI özeti alınamadı.");
      }

      setContextSummaries((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          summary: data.aiSummary || "Bu karar için AI özeti henüz oluşturulmamış.",
          error: "",
        },
      }));
    } catch (error) {
      console.error("Bağlam kararı AI özeti alınamadı:", error);
      setContextSummaries((prev) => ({
        ...prev,
        [key]: { loading: false, summary: "", error: error.message },
      }));
    }
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
    const deepThinking = Boolean(deepThinkingEnabled);
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
      text: "",
      createdAt: new Date().toISOString(),
      sources: {
        loading: true,
        forceCaseSearch,
        deepThinking,
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

    // Yeni soru başlarken önceki cevabın kararlarını/emsallerini temizle.
    // Aksi halde yeni cevapta emsal gelmezse eski emsal kararlar ekranda kalıyor.
    setAiDecisions([]);
    setContextDecisions([]);
    setContextSummaries({});
    setActiveContextSummary(null);

    // Kullanıcı kendi mesajını gönderince her zaman en alta in ve takibi aç.
    isAtChatBottomRef.current = true;
    setIsAtChatBottom(true);

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
          deep_thinking: deepThinking,
          history,
          workspace_context: workspaceContext,
          notes: notes.map((note) => ({
            id: note.id,
            fileId: note.fileId || null,
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
      let nextContextDecisions = [];
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
                    deepThinking,
                    workspaceMode: selectedWorkspaceMode,
                    workspaceModeLabel: selectedWorkspaceModeLabel,
                    didCaseSearch,
                    effectiveQuery,
                    decisions: nextAiDecisions,
                    contextDecisions: nextContextDecisions,
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

      function isTabHidden() {
        return typeof document !== "undefined" && document.visibilityState === "hidden";
      }

      function scheduleTypingFlush() {
        if (typingTimer) return;

        // Sekme arka plandaysa tarayıcı setTimeout'u throttle eder; bu yüzden
        // gelen metni daktilo efekti olmadan anında yazıp render'ı diri tutuyoruz.
        // Böylece kullanıcı başka sekmedeyken de cevap akmaya devam eder.
        if (isTabHidden()) {
          if (queuedStreamText) {
            visibleStreamedAnswer += queuedStreamText;
            queuedStreamText = "";
            updateStreamingBotMessage(visibleStreamedAnswer);
          }
          return;
        }

        typingTimer = window.setTimeout(() => {
          typingTimer = null;

          if (!queuedStreamText) return;

          // Tick anında sekme arka plana geçtiyse tüm kuyruğu boşalt.
          if (isTabHidden()) {
            visibleStreamedAnswer += queuedStreamText;
            queuedStreamText = "";
            updateStreamingBotMessage(visibleStreamedAnswer);
            return;
          }

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

          // Bu gönderim sırasındaki workspace artık aktif değilse, karar/emsal/mevzuat
          // event'lerini işleme; yoksa eski workspace'in sonuçları yeni workspace'e taşar.
          const isStaleSubmission = activeWorkspaceIdRef.current !== submittingWorkspaceId;
          if (
            isStaleSubmission &&
            (event === "context_decisions" || event === "decisions" || event === "statutes")
          ) {
            continue;
          }

          if (event === "context_decisions") {
            const cards = Array.isArray(data.decisions) ? data.decisions : [];
            nextContextDecisions = cards;
            setContextDecisions(cards);
            updateStreamingBotMessage(visibleStreamedAnswer || streamedAnswer || localBotMessage.text, {
              decisions: nextAiDecisions,
              contextDecisions: cards,
            });
          }

          if (event === "decisions") {
            const incoming = Array.isArray(data.decisions) ? data.decisions : [];
            const split = splitAiAndContextDecisions(incoming);

            nextAiDecisions = split.ai;

            // backend emsalleri de decisions içine karıştırdıysa ve context_decisions gelmediyse:
            if (!nextContextDecisions.length && split.context.length) {
              nextContextDecisions = split.context;
              setContextDecisions(split.context);
            }

            setAiDecisions(split.ai);
            setDecisionView("ai");
            updateStreamingBotMessage(visibleStreamedAnswer || streamedAnswer || localBotMessage.text, {
              decisions: split.ai,
              contextDecisions: nextContextDecisions,
            });
          }

          if (event === "statutes") {
            nextAiStatutes = Array.isArray(data.statutes) ? data.statutes : [];

            setAiStatutes(nextAiStatutes);
            setVisiblePanels((prev) => ({
              ...prev,
              statutes: false,
            }));
            updateStreamingBotMessage(visibleStreamedAnswer || streamedAnswer || localBotMessage.text, {
              statutes: nextAiStatutes,
            });
          }

          if (event === "warning") {
            console.warn("Workspace AI warning:", data);
          }

          if (event === "status" && data.message && !streamedAnswer) {
          }

          if (event === "token") {
            const deltaText = String(data.text || "");
            if (!deltaText) continue;

            streamedAnswer += deltaText;

            if (
              deltaText.includes("[DECISION_CARDS_JSON]") ||
              deltaText.includes("[/DECISION_CARDS_JSON]") ||
              streamedAnswer.includes("[DECISION_CARDS_JSON]")
            ) {
              const cleanedVisibleAnswer = stripDecisionCardsPayload(streamedAnswer);
              visibleStreamedAnswer = cleanedVisibleAnswer;
              queuedStreamText = "";
              updateStreamingBotMessage(cleanedVisibleAnswer);
              continue;
            }

            queueStreamingText(deltaText);
          }

          if (event === "done") {
            finalAnswer = String(data.answer || streamedAnswer || "").trim();
                        const doneIncoming = Array.isArray(data.decisions) ? data.decisions : nextAiDecisions;
            const splitDone = splitAiAndContextDecisions(doneIncoming);
            // Stream sırasında yararlanılan kararlar zaten geldiyse, done'daki
            // (çoğu zaman emsalleri de içeren) tam listeyle ezme.
            if (!nextAiDecisions.length) {
              nextAiDecisions = splitDone.ai;
            }
            if (!nextContextDecisions.length && splitDone.context.length) {
              nextContextDecisions = splitDone.context;
            }
            nextAiStatutes = Array.isArray(data.statutes) ? data.statutes : nextAiStatutes;
            didCaseSearch = Boolean(data.did_case_search);
            effectiveQuery = data.effective_query || effectiveQuery;
            raw = data.raw || raw;

            if (Array.isArray(data.context_decisions)) {
              nextContextDecisions = data.context_decisions;
            }

            // Sadece gönderim sırasındaki workspace hâlâ aktifse UI state'ini güncelle.
            if (activeWorkspaceIdRef.current === submittingWorkspaceId) {
              setAiDecisions(nextAiDecisions);
              setContextDecisions(nextContextDecisions);
              setAiStatutes(nextAiStatutes);
              setVisiblePanels((prev) => ({
                ...prev,
                statutes: false,
              }));
              setDecisionView("ai");
            }
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

          const isStaleSubmission = activeWorkspaceIdRef.current !== submittingWorkspaceId;
          if (
            isStaleSubmission &&
            (event === "context_decisions" || event === "decisions" || event === "statutes")
          ) {
            continue;
          }

          if (event === "token") {
            const deltaText = String(data.text || "");
            streamedAnswer += deltaText;

            if (
              deltaText.includes("[DECISION_CARDS_JSON]") ||
              deltaText.includes("[/DECISION_CARDS_JSON]") ||
              streamedAnswer.includes("[DECISION_CARDS_JSON]")
            ) {
              const cleanedVisibleAnswer = stripDecisionCardsPayload(streamedAnswer);
              visibleStreamedAnswer = cleanedVisibleAnswer;
              queuedStreamText = "";
              updateStreamingBotMessage(cleanedVisibleAnswer);
              continue;
            }

            queueStreamingText(deltaText);
          }

          if (event === "context_decisions") {
            const cards = Array.isArray(data.decisions) ? data.decisions : [];
            nextContextDecisions = cards;
            setContextDecisions(cards);
          }

                    if (event === "decisions") {
            const incoming = Array.isArray(data.decisions) ? data.decisions : [];
            const split = splitAiAndContextDecisions(incoming);

            nextAiDecisions = split.ai;

            // backend emsalleri de decisions içine karıştırdıysa ve context_decisions gelmediyse:
            if (!nextContextDecisions.length && split.context.length) {
              nextContextDecisions = split.context;
              setContextDecisions(split.context);
            }

            setAiDecisions(split.ai);
            setDecisionView("ai");
            updateStreamingBotMessage(visibleStreamedAnswer || streamedAnswer || localBotMessage.text, {
              decisions: split.ai,
              contextDecisions: nextContextDecisions,
            });
          }

          if (event === "statutes") {
            nextAiStatutes = Array.isArray(data.statutes) ? data.statutes : [];
            setAiStatutes(nextAiStatutes);
            setVisiblePanels((prev) => ({
              ...prev,
              statutes: false,
            }));
          }

          if (event === "warning") {
            console.warn("Workspace AI warning:", data);
          }

          if (event === "done") {
            finalAnswer = String(data.answer || streamedAnswer || "").trim();
                        const doneIncoming = Array.isArray(data.decisions) ? data.decisions : nextAiDecisions;
            const splitDone = splitAiAndContextDecisions(doneIncoming);
            // Stream sırasında yararlanılan kararlar zaten geldiyse, done'daki
            // (çoğu zaman emsalleri de içeren) tam listeyle ezme.
            if (!nextAiDecisions.length) {
              nextAiDecisions = splitDone.ai;
            }
            if (!nextContextDecisions.length && splitDone.context.length) {
              nextContextDecisions = splitDone.context;
            }
            nextAiStatutes = Array.isArray(data.statutes) ? data.statutes : nextAiStatutes;
            didCaseSearch = Boolean(data.did_case_search);
            effectiveQuery = data.effective_query || effectiveQuery;
            raw = data.raw || raw;

            if (Array.isArray(data.context_decisions)) {
              nextContextDecisions = data.context_decisions;
            }

            if (activeWorkspaceIdRef.current === submittingWorkspaceId) {
              setAiDecisions(nextAiDecisions);
              setContextDecisions(nextContextDecisions);
              setAiStatutes(nextAiStatutes);
            }
          }

          if (event === "error") {
            streamError = new Error(data.message || "Stream sırasında hata oluştu.");
          }
        }
      }

      await drainQueuedStreamingText();

      if (streamError) throw streamError;

      const answer = stripDecisionCardsPayload(finalAnswer || streamedAnswer || "Analiz üretilemedi.");

      const finalDecisions = nextAiDecisions;
      // Yalnızca gönderim sırasındaki workspace hâlâ aktifse karar panelini güncelle.
      if (activeWorkspaceIdRef.current === submittingWorkspaceId) {
        setAiDecisions(finalDecisions);
        setContextDecisions(nextContextDecisions);
      }

      const finalBotMessage = {
        ...localBotMessage,
        text: answer,
        sources: {
          loading: false,
          forceCaseSearch,
          deepThinking,
          workspaceMode: selectedWorkspaceMode,
          workspaceModeLabel: selectedWorkspaceModeLabel,
          didCaseSearch,
          effectiveQuery,
          decisions: finalDecisions,
          contextDecisions: nextContextDecisions,
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
            deepThinking,
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
          fileId: file.id,
          type: "Belge Notu",
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
          fileId: savedNote?.fileId || file.id,
          type: savedNote?.type || "Belge Notu",
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
          fileId: savedNote?.fileId || null,
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
          fileId: savedNote?.fileId || null,
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

  // Sidebar'daki satır içi silme handler'ı buraya alındı (davranış birebir aynı).
  async function handleDeleteFile(file) {
    if (!activeWorkspaceId || !file?.id) return;

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
        documentClass: file.documentClass || file.aiProfile?.documentClass || file.aiProfile?.document_class || "",
        legalKeywords: Array.isArray(file.legalKeywords) ? file.legalKeywords : [],
        detectedStatutes: Array.isArray(file.detectedStatutes) ? file.detectedStatutes : [],
        keyFacts: Array.isArray(file.keyFacts) ? file.keyFacts : [],
        keyDates: Array.isArray(file.keyDates) ? file.keyDates : [],
        parties: Array.isArray(file.parties) ? file.parties : [],
        evidenceList: Array.isArray(file.evidenceList) ? file.evidenceList : [],
        claimsOrAccusations: Array.isArray(file.claimsOrAccusations)
          ? file.claimsOrAccusations
          : Array.isArray(file.aiProfile?.claimsOrAccusations)
            ? file.aiProfile.claimsOrAccusations
            : Array.isArray(file.aiProfile?.claims_or_accusations)
              ? file.aiProfile.claims_or_accusations
              : [],
        fields: Array.isArray(file.fields)
          ? file.fields
          : Array.isArray(file.aiProfile?.fields)
            ? file.aiProfile.fields
            : [],
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

  // --- Tüm görünüm modeli (view model) tek nesnede ---
  return {
    // state + setters
    activeWorkspaceId, setActiveWorkspaceId,
    sidebarOpen, setSidebarOpen,
    hasMounted, isMobile,
    mobileTab, setMobileTab,
    mobileSidebarOpen, setMobileSidebarOpen,
    isHeaderHidden, setIsHeaderHidden,
    input, setInput,
    newNoteText, setNewNoteText,
    fileNoteDrafts, setFileNoteDrafts,
    savingFileNoteIds,
    editingFileNameId, setEditingFileNameId,
    editingFileNameValue, setEditingFileNameValue,
    savingFileNameId,
    activePanel, setActivePanel,
    activeFileSummary, setActiveFileSummary,
    activeFileDetailTab, setActiveFileDetailTab,
    aiDecisions: displayedAiDecisions,
    contextDecisions: displayedContextDecisions,
    contextSummaries,
    activeContextSummary, setActiveContextSummary,
    aiStatutes,
    savedDecisionIds,
    savedStatutes,
    decisionView, setDecisionView,
    visiblePanels,
    forceCaseSearchEnabled, setForceCaseSearchEnabled,
    deepThinkingEnabled, setDeepThinkingEnabled,
    workspaceMode, setWorkspaceMode,
    isModeMenuOpen, setIsModeMenuOpen,
    selectedChatText,
    isAtChatBottom, handleChatScroll, scrollChatToBottom,
    isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen,
    isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen,
    workspaceDeleteTarget,
    isDeletingWorkspace,
    newWorkspaceName, setNewWorkspaceName,
    isLoadingWorkspaces,
    isLoadingWorkspaceDetail,
    isUploadingFiles,
    pendingUploadFiles,
    isUploadPerspectiveModalOpen,
    isPartyRepresentative, setIsPartyRepresentative,
    representedParty, setRepresentedParty,
    shouldAnalyzeFile, setShouldAnalyzeFile,
    uploadPerspectiveError, setUploadPerspectiveError,
    workspaceError, setWorkspaceError,
    tokenBalance,
    isLoadingTokenBalance,
    messages,
    notes,
    files, setFiles,
    workspaces,

    // refs
    dropdownRef, modeMenuRef, selectedTextActionRef, chatScrollRef, chatMessagesEndRef,

    // derived
    activeWorkspace, activeWorkspaceMode, currentMessageTokenCost, savedDecisions,

    // handlers
    toggleVisiblePanel, handleChatTextSelection, clearSelectedChatText,
    isNoteExpanded, toggleNoteExpanded, getNotesForFile,
    toggleSavedDecision, toggleSavedStatute,
    handleCreateWorkspaceSubmit, openDeleteWorkspaceModal, closeDeleteWorkspaceModal, confirmDeleteWorkspace,
    openContextSummary, handleSubmit,
    addFileNote, addBotTextToNotes, handleAddManualNote, handleDeleteNote,
    handleUpdateFileName, handleDeleteFile, handleFileSelect,
    resetUploadPerspectiveState, uploadPendingFilesWithPerspective,
  };
}