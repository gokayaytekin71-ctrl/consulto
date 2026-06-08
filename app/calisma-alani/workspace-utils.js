// =============================================================================
// workspace-utils.js
// Çalışma Alanı sayfasının sabitleri ve saf (UI'dan bağımsız) yardımcıları.
// Bu dosya hiçbir React state'ine dokunmaz; tüm fonksiyonlar girdi -> çıktı.
// =============================================================================

export const WORKSPACE_AI_API_BASE =
  process.env.NEXT_PUBLIC_WORKSPACE_AI_API_BASE || "https://api.consultohukuk.com";

export const MAX_WORKSPACE_FILE_SIZE_MB = 10;
export const MAX_WORKSPACE_FILE_SIZE_BYTES = MAX_WORKSPACE_FILE_SIZE_MB * 1024 * 1024;

export const FIRST_TIER_MESSAGE_LIMIT = 3;
export const FIRST_TIER_MESSAGE_COST = 1;
export const NEXT_TIER_MESSAGE_COST = 2;

export function getWorkspaceMessageTokenCost(existingUserMessageCount = 0) {
  return existingUserMessageCount < FIRST_TIER_MESSAGE_LIMIT
    ? FIRST_TIER_MESSAGE_COST
    : NEXT_TIER_MESSAGE_COST;
}

export const WORKSPACE_MODES = [
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
    id: "contract_protocol_drafting",
    label: "Sözleşme-Protokol Taslağı",
    helper: "Talep edilen konuda ilişkin sözleşme, protokol, ibraname vs. hazırlar.",
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

export function looksLikeDecisionSlug(value = "") {
  const base = String(value || "").replace(/\.txt$/i, "");
  if (!base) return false;
  if (/(Hukuk|Ceza)_(Dairesi|Genel_Kurulu)/i.test(base) && /E_/i.test(base) && /K\b/i.test(base)) return true;
  if (/__(\d{4})-[^_]+E_\d{4}-[^_]+K$/i.test(base)) return true;
  return false;
}

export function slugFromDecisionTypeAndCode(typeRaw = "", codeRaw = "") {
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

export function getDecisionSlug(decision = {}) {
  const direct = String(decision.slug || decision.id || decision.kararId || "").replace(/\.txt$/i, "");
  if (looksLikeDecisionSlug(direct)) return direct;
  return slugFromDecisionTypeAndCode(decision.court || decision.type || decision.daire || "", decision.code || "");
}

export function autoLinkDecisionsInText(text) {
  if (!text) return "";

  const regex = /(?:\[\s*)?(?:Yargıtay[\s\W]+)?((?:Hukuk|Ceza)[\s\W]+Genel[\s\W]+Kurulu|(?:\d+)\.?\s*(?:Hukuk|Ceza)[\s\W]+Dairesi)(?:\s*['’]?(?:nin|nın|nun|nün|in|ın|un|ün))?[\s\W,;]*(\d{4})\s*[\/\-–—]\s*(\d+)[\s\W]*E\.?[\s\W,;]*(\d{4})\s*[\/\-–—]\s*(\d+)[\s\W]*K\.?(?:\s*\])?/gi;

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

export function stripDecisionCardsPayload(value = "") {
  return String(value || "")
    .replace(/\[DECISION_CARDS_JSON\][\s\S]*?\[\/DECISION_CARDS_JSON\]/gi, "")
    .replace(/\n?\s*isons"?\s*:\s*\[[\s\S]*?\]\s*}\s*\n?\s*\[\/DECISION_CARDS_JSON\]/gi, "")
    .replace(/\n?\s*isions"?\s*:\s*\[[\s\S]*?\]\s*}\s*\n?\s*\[\/DECISION_CARDS_JSON\]/gi, "")
    .replace(/\n?\s*"?decisions"?\s*:\s*\[[\s\S]*?\]\s*}\s*\n?\s*\[\/DECISION_CARDS_JSON\]/gi, "")
    .replace(/\n?\s*\{\s*"decisions"\s*:\s*\[[\s\S]*?\]\s*}\s*\n?/gi, "")
    .replace(/\n?\s*\[\/DECISION_CARDS_JSON\]\s*/gi, "")
    .trim();
}

// --- Anahtar üreticileri (eski hâlde CalismaAlaniPage içinde tanımlıydı) ---

export function getDecisionKey(item) {
  const slug = getDecisionSlug(item);
  return slug || item?.id || item?.slug || item?.kararId || `${item?.court || ""}::${item?.code || ""}`;
}

export function getStatuteKey(item) {
  return `${item?.name || item?.mevzuatAdi || item?.mevzuat_adi || ""}::${item?.article || item?.madde || ""}`;
}

export function getPanelTitle(id) {
  const map = {
    chat: "Çalışma Alanı",
    decisions: "Kararlar",
    statutes: "Mevzuat",
    notes: "Strateji & Notlar",
  };
  return map[id] || "Panel";
}
