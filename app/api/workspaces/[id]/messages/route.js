import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { checkTokenBalance, consumeToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FIRST_TIER_MESSAGE_LIMIT = 3;
const FIRST_TIER_MESSAGE_COST = 1;
const NEXT_TIER_MESSAGE_COST = 2;

// --- Context yanıt boyutu sınırları (Vercel serverless yanıt limiti ~4.5 MB) ---
// Tek tek alanları ve toplam yanıtı güvenli bir tavanın altında tutar.
const MAX_CHUNK_CONTENT_CHARS = 2000;   // her chunk içeriği en fazla bu kadar karakter
const MAX_PROFILE_FIELD_CHARS = 1500;   // uzun profil metin alanları için tavan
const MAX_CONTEXT_CHUNKS = 8;           // yanıta giren chunk sayısı
const MAX_CONTEXT_BYTES = 3 * 1024 * 1024; // toplam yanıt için güvenli tavan (~3 MB)

function truncateText(value = "", max = MAX_PROFILE_FIELD_CHARS) {
  const str = String(value || "");
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

function getWorkspaceMessageTokenCost(existingUserMessageCount = 0) {
  return existingUserMessageCount < FIRST_TIER_MESSAGE_LIMIT
    ? FIRST_TIER_MESSAGE_COST
    : NEXT_TIER_MESSAGE_COST;
}

async function requireSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      response: Response.json(
        {
          error: "UNAUTHORIZED",
          message: "Bu işlem için oturum açmalısınız.",
          requireLogin: true,
        },
        { status: 401 }
      ),
    };
  }

  return { session, response: null };
}

async function getOwnedWorkspace(workspaceId, userId) {
  if (!workspaceId) return null;

  return prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      userId,
    },
    select: {
      id: true,
    },
  });
}
function normalizeSearchText(value = "") {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[.,;:!?()[\]{}"'“”‘’<>/\\|_*`~\-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getQueryTerms(query = "") {
  const stopWords = new Set([
    "bu",
    "şu",
    "o",
    "ve",
    "veya",
    "ile",
    "için",
    "bir",
    "da",
    "de",
    "mi",
    "mı",
    "mu",
    "mü",
    "ne",
    "nasıl",
    "hangi",
    "dosya",
    "belge",
    "dava",
    "incele",
  ]);

  return normalizeSearchText(query)
    .split(" ")
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !stopWords.has(term))
    .slice(0, 20);
}

function uniqueTerms(terms = []) {
  return Array.from(
    new Set(
      terms
        .map((term) => normalizeSearchText(term))
        .filter((term) => term.length >= 2)
    )
  );
}

function getExpandedQueryTerms(query = "", mode = "") {
  const baseTerms = getQueryTerms(query);
  const normalizedQuery = normalizeSearchText(query);
  const normalizedMode = normalizeSearchText(mode);

  const generalLegalTerms = [
    "iddianame",
    "sanık",
    "şüpheli",
    "müşteki",
    "mağdur",
    "suç",
    "isnat",
    "sevk",
    "madde",
    "delil",
    "beyan",
    "tanık",
    "tutanak",
    "arama",
    "el koyma",
    "yakalama",
    "ifade",
    "hts",
    "kamera",
    "bilirkişi",
    "rapor",
    "tck",
    "cmk",
  ];

  const strategyTerms = [
    "savunma",
    "müdafii",
    "müdafi",
    "hukuka aykırı",
    "çelişki",
    "risk",
    "lehe",
    "aleyhe",
    "itiraz",
    "eksik delil",
  ];

  const evidenceTerms = [
    "delil",
    "ispat",
    "tanık",
    "beyan",
    "tutanak",
    "arama",
    "el koyma",
    "kamera",
    "hts",
    "bilirkişi",
    "rapor",
    "kolluk",
    "hukuka aykırı delil",
  ];

  const contradictionTerms = [
    "çelişki",
    "tutarsızlık",
    "beyan",
    "tarih",
    "saat",
    "olay",
    "tanık",
    "ifade",
    "rapor",
    "tutanak",
  ];

  const petitionTerms = [
    "talep",
    "sonuç",
    "açıklama",
    "dilekçe",
    "itiraz",
    "savunma",
    "delil",
    "hukuki neden",
  ];

  const expandedTerms = [...baseTerms, ...generalLegalTerms];

  if (
    normalizedMode.includes("file strategy") ||
    normalizedMode.includes("file_strategy") ||
    normalizedQuery.includes("strateji") ||
    normalizedQuery.includes("öner") ||
    normalizedQuery.includes("müdafi") ||
    normalizedQuery.includes("müdafii") ||
    normalizedQuery.includes("savun")
  ) {
    expandedTerms.push(...strategyTerms);
  }

  if (
    normalizedMode.includes("evidence") ||
    normalizedMode.includes("evidence_analysis") ||
    normalizedQuery.includes("delil") ||
    normalizedQuery.includes("ispat")
  ) {
    expandedTerms.push(...evidenceTerms);
  }

  if (
    normalizedMode.includes("Contract") ||
    normalizedMode.includes("contract_protocol_drafting") ||
    normalizedQuery.includes("Sözleşme") ||
    normalizedQuery.includes("Protokol")
  ) {
    expandedTerms.push(...contradictionTerms);
  }

  if (
    normalizedMode.includes("petition") ||
    normalizedMode.includes("petition_draft") ||
    normalizedQuery.includes("dilekçe") ||
    normalizedQuery.includes("taslak")
  ) {
    expandedTerms.push(...petitionTerms);
  }

  return uniqueTerms(expandedTerms).slice(0, 80);
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function profileToContextItem(file) {
  if (!file) return null;

  const hasProfile =
    file.aiSummary ||
    file.detailedSummary ||
    file.searchSummary ||
    file.documentType ||
    toArray(file.legalKeywords).length ||
    toArray(file.detectedStatutes).length ||
    toArray(file.keyFacts).length ||
    toArray(file.evidenceList).length ||
    toArray(file.risks).length ||
    toArray(file.defenseIssues).length;

  if (!hasProfile) return null;

  return {
    id: `${file.id}-profile`,
    fileId: file.id,
    fileName: file.name || "Dosya",
    fileType: file.type || "Dosya",
    contentType: "file_profile",
    documentType: file.documentType || "",
    aiSummary: truncateText(file.aiSummary || "", MAX_PROFILE_FIELD_CHARS),
    detailedSummary: truncateText(file.detailedSummary || "", MAX_PROFILE_FIELD_CHARS),
    legalKeywords: toArray(file.legalKeywords),
    detectedStatutes: toArray(file.detectedStatutes),
    keyFacts: toArray(file.keyFacts),
    keyDates: toArray(file.keyDates),
    parties: toArray(file.parties),
    evidenceList: toArray(file.evidenceList),
    risks: toArray(file.risks),
    defenseIssues: toArray(file.defenseIssues),
    searchSummary: truncateText(file.searchSummary || "", MAX_PROFILE_FIELD_CHARS),
    profiledAt: file.profiledAt || null,
    score: 9999,
  };
}

function scoreChunkContent(content = "", terms = []) {
  const normalized = normalizeSearchText(content);
  if (!normalized || !terms.length) return 0;

  let score = 0;

  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = normalized.match(new RegExp(`\\b${escaped}`, "g"));

    if (matches?.length) {
      score += matches.length * Math.min(8, term.length);
    }
  }

  return score;
}

export async function GET(request, { params }) {
  const { session, response } = await requireSession();
  if (response) return response;

  const workspaceId = params?.id;

  if (!workspaceId) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Çalışma alanı id değeri zorunludur.",
      },
      { status: 400 }
    );
  }

  try {
    const workspace = await getOwnedWorkspace(workspaceId, session.user.id);

    if (!workspace) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Çalışma alanı bulunamadı.",
        },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const wantsContext = url.searchParams.get("context") === "1";

    if (wantsContext) {
      const query = String(url.searchParams.get("q") || "").trim();
      const mode = String(url.searchParams.get("mode") || "").trim();
      const terms = getExpandedQueryTerms(query, mode);

      const filesWithProfiles = await prisma.workspaceFile.findMany({
        where: {
          workspaceId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          type: true,
          aiSummary: true,
          detailedSummary: true,
          documentType: true,
          legalKeywords: true,
          detectedStatutes: true,
          keyFacts: true,
          keyDates: true,
          parties: true,
          evidenceList: true,
          risks: true,
          defenseIssues: true,
          searchSummary: true,
          profiledAt: true,
        },
      });

      const fileProfileContext = filesWithProfiles
        .map(profileToContextItem)
        .filter(Boolean);

      const chunks = await prisma.workspaceFileChunk.findMany({
        where: {
          workspaceId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 300,
        select: {
          id: true,
          fileId: true,
          chunkIndex: true,
          content: true,
          file: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      const selectedChunks = chunks
        .map((chunk) => ({
          id: chunk.id,
          fileId: chunk.fileId,
          fileName: chunk.file?.name || "Dosya",
          fileType: chunk.file?.type || "Dosya",
          contentType: "file_chunk",
          chunkIndex: chunk.chunkIndex,
          // Skor TAM içerik üzerinden hesaplanır; yanıta giren metin kırpılır.
          score: scoreChunkContent(chunk.content, terms),
          content: truncateText(chunk.content, MAX_CHUNK_CONTENT_CHARS),
        }))
        .filter((chunk) => chunk.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_CONTEXT_CHUNKS);

      let workspaceContext = [...fileProfileContext, ...selectedChunks];

      // Son güvenlik ağı: toplam yanıt boyutu tavanı aşarsa en düşük skorlu
      // chunk'lardan başlayarak kırp. Profil bağlamı her zaman korunur.
      const byteSize = (obj) => Buffer.byteLength(JSON.stringify(obj));
      while (
        workspaceContext.length > fileProfileContext.length &&
        byteSize({ ok: true, workspaceContext }) > MAX_CONTEXT_BYTES
      ) {
        workspaceContext.pop();
      }

      return Response.json(
        {
          ok: true,
          workspaceContext,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const messages = await prisma.workspaceMessage.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return Response.json(
      {
        ok: true,
        messages,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/workspaces/[id]/messages error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Mesajlar alınırken hata oluştu.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  const { session, response } = await requireSession();
  if (response) return response;

  const workspaceId = params?.id;

  if (!workspaceId) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Çalışma alanı id değeri zorunludur.",
      },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: "BAD_REQUEST",
        message: "Geçersiz JSON gövdesi.",
      },
      { status: 400 }
    );
  }

  const role = String(body?.role || "").trim();
  const content = String(body?.content || body?.text || "").trim();
  const sources = body?.sources ?? null;

  if (!role || !["user", "assistant", "system"].includes(role)) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Mesaj rolü geçersiz. role: user, assistant veya system olmalıdır.",
      },
      { status: 400 }
    );
  }

  if (!content) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Mesaj içeriği boş olamaz.",
      },
      { status: 400 }
    );
  }

  try {
    const workspace = await getOwnedWorkspace(workspaceId, session.user.id);

    if (!workspace) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Çalışma alanı bulunamadı.",
        },
        { status: 404 }
      );
    }

    let tokenCost = 0;
    let tokenRemaining = null;
    let userMessageNumber = null;

    if (role === "user") {
      const existingUserMessageCount = await prisma.workspaceMessage.count({
        where: {
          workspaceId,
          role: "user",
        },
      });

      tokenCost = getWorkspaceMessageTokenCost(existingUserMessageCount);
      userMessageNumber = existingUserMessageCount + 1;

      const balanceCheck = await checkTokenBalance(session.user.id, tokenCost);

      if (!balanceCheck.ok) {
        return Response.json(
          {
            error: "QUOTA_EXCEEDED",
            message:
              userMessageNumber <= FIRST_TIER_MESSAGE_LIMIT
                ? "Bu mesaj için 1 token gereklidir. Yeterli tokeniniz bulunmuyor."
                : "Bu mesaj için 2 token gereklidir. Yeterli tokeniniz bulunmuyor.",
            requirePayment: true,
            tokenCost,
            userMessageNumber,
            tokenBalance: balanceCheck.balance ?? 0,
            remaining: balanceCheck.balance ?? 0,
          },
          { status: 402 }
        );
      }

      const consumption = await consumeToken(session.user.id, "WORKSPACE_MESSAGE", tokenCost, {
        workspaceId,
        userMessageNumber,
        contentPreview: content.slice(0, 500),
        source: "workspace-message",
      });

      if (!consumption.ok) {
        return Response.json(
          {
            error: "QUOTA_EXCEEDED",
            message:
              userMessageNumber <= FIRST_TIER_MESSAGE_LIMIT
                ? "Bu mesaj için 1 token gereklidir. Yeterli tokeniniz bulunmuyor."
                : "Bu mesaj için 2 token gereklidir. Yeterli tokeniniz bulunmuyor.",
            requirePayment: true,
            tokenCost,
            userMessageNumber,
            tokenBalance: consumption.remaining ?? 0,
            remaining: consumption.remaining ?? 0,
          },
          { status: 402 }
        );
      }

      tokenRemaining = consumption.remaining ?? null;
    }

    const message = await prisma.workspaceMessage.create({
      data: {
        workspaceId,
        role,
        content,
        sources,
      },
    });

    await prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return Response.json(
      {
        ok: true,
        message,
        tokenCost,
        tokenBalance: tokenRemaining,
        tokenRemaining,
        userMessageNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/workspaces/[id]/messages error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Mesaj oluşturulurken hata oluştu.",
      },
      { status: 500 }
    );
  }
}