import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { checkTokenBalance, consumeToken } from "@/lib/tokens";
import path from "path";
import mammoth from "mammoth";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";


const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const FILE_PROFILE_TOKEN_COST = 1;
const WORKSPACE_AI_API_BASE =
  process.env.WORKSPACE_AI_API_BASE ||
  process.env.NEXT_PUBLIC_WORKSPACE_AI_API_BASE ||
  "https://api.consultohukuk.com";

const FILE_PROFILE_TIMEOUT_MS = 190000;
const FILE_OCR_TIMEOUT_MS = 180000;
const MIN_EXTRACTED_TEXT_LENGTH = 80;

// --- Liste yaniti boyutu sinirlari (Vercel serverless yanit limiti ~4.5 MB) ---
// Dosya listesinde buyuk metin alanlarini kirpar; extractedText hic donmez.
const MAX_AI_SUMMARY_CHARS = 1500;
const MAX_DETAILED_SUMMARY_CHARS = 3000;
const MAX_SEARCH_SUMMARY_CHARS = 1500;

function truncateText(value, max) {
  const str = String(value || "");
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "txt",
  "rtf",
  "jpg",
  "jpeg",
  "png",
  "webp",
]);

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

function sanitizeFileName(name = "dosya") {
  const original = String(name || "dosya").trim() || "dosya";
  const parsed = path.parse(original);
  const safeBase = (parsed.name || "dosya")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "dosya";

  const safeExt = (parsed.ext || "")
    .replace(/[^a-zA-Z0-9.]/g, "")
    .toLowerCase();

  return `${safeBase}${safeExt}`;
}

function getFileExtension(fileName = "") {
  return path.extname(fileName).replace(/^\./, "").toLowerCase();
}

function splitTextIntoChunks(text = "", chunkSize = 1200, overlap = 200) {
  const cleanText = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleanText) return [];

  const chunks = [];
  let start = 0;

  while (start < cleanText.length) {
    const end = Math.min(start + chunkSize, cleanText.length);
    const content = cleanText.slice(start, end).trim();

    if (content) {
      chunks.push(content);
    }

    if (end >= cleanText.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}

async function generateFileProfile({
  fileName,
  fileType,
  extractedText,
  isPartyRepresentative = false,
  representedParty = "",
}) {
  const cleanText = String(extractedText || "").trim();

  if (!cleanText) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FILE_PROFILE_TIMEOUT_MS);

  try {
    const res = await fetch(`${WORKSPACE_AI_API_BASE}/workspace-file-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        fileName,
        fileType,
        text: cleanText,
        isPartyRepresentative,
        representedParty,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.ok === false) {
      throw new Error(data?.message || "Dosya profili üretilemedi.");
    }

    const rawProfile =
      data?.profile && typeof data.profile === "object" ? data.profile : data;

    return rawProfile && typeof rawProfile === "object" ? rawProfile : null;

  } catch (error) {
    console.error("AI dosya profili üretilemedi:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function extractTextWithOcr({ buffer, fileName, fileType }) {
  if (!buffer?.length) return "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FILE_OCR_TIMEOUT_MS);

  try {
    const formData = new FormData();
    const blob = new Blob([buffer], {
      type: fileType === "PDF" ? "application/pdf" : "application/octet-stream",
    });

    formData.append("file", blob, fileName || "dosya.pdf");

    const endpoint = `${WORKSPACE_AI_API_BASE}/workspace-extract-text`;

    const res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      body: formData,
    });

    const rawText = await res.text().catch(() => "");
    let data = {};

    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = {};
    }

    if (!res.ok || data?.ok === false) {
      console.error("OCR backend başarısız:", {
        endpoint,
        status: res.status,
        statusText: res.statusText,
        message: data?.message,
        error: data?.error,
        method: data?.method,
        hasPyMuPDF: data?.hasPyMuPDF,
        hasTesseract: data?.hasTesseract,
        hasPIL: data?.hasPIL,
        rawText: rawText?.slice?.(0, 1000) || "",
      });

      throw new Error(
        data?.message ||
          data?.error ||
          `OCR backend ${res.status} ${res.statusText || "hatası"}`
      );
    }

    return String(data?.text || data?.extractedText || "").trim();
  } catch (error) {
    console.error("OCR text extraction hatası:", error);
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

function toJsonArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeUserPerspective({ isPartyRepresentative = false, representedParty = "", profile = null } = {}) {
  const profilePerspective =
    profile && typeof profile === "object" && profile.userPerspective && typeof profile.userPerspective === "object"
      ? profile.userPerspective
      : {};

  return {
    isPartyRepresentative: Boolean(
      isPartyRepresentative ||
        profilePerspective.isPartyRepresentative ||
        profilePerspective.is_party_representative
    ),
    representedParty: String(
      representedParty ||
        profilePerspective.representedParty ||
        profilePerspective.represented_party ||
        ""
    ).trim(),
    strategyFocus: String(
      profilePerspective.strategyFocus ||
        profilePerspective.strategy_focus ||
        ""
    ).trim(),
  };
}

function attachUserPerspective(file) {
  if (!file || typeof file !== "object") return file;

  const aiProfile = file.aiProfile && typeof file.aiProfile === "object" ? file.aiProfile : null;

  return {
    ...file,
    userPerspective: normalizeUserPerspective({ profile: aiProfile }),
  };
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
    const fileId = url.searchParams.get("fileId");

    if (fileId) {
      const file = await prisma.workspaceFile.findFirst({
        where: {
          id: fileId,
          workspaceId,
        },
        select: {
          name: true,
          type: true,
          fileData: true,
        },
      });

      if (!file || !file.fileData) {
        return Response.json(
          {
            error: "NOT_FOUND",
            message: "Dosya içeriği bulunamadı.",
          },
          { status: 404 }
        );
      }

      const extension = String(file.type || "").toLowerCase();
      const contentTypeMap = {
        pdf: "application/pdf",
        txt: "text/plain; charset=utf-8",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        rtf: "application/rtf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
      };
      const contentType = contentTypeMap[extension] || "application/octet-stream";
      const encodedFileName = encodeURIComponent(file.name || "dosya");

      return new Response(file.fileData, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename*=UTF-8''${encodedFileName}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const files = await prisma.workspaceFile.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      // NOT: extractedText ve fileData LISTEDE DONDURULMEZ.
      // extractedText 9 MB'lik dosyalarda tek basina 4.5 MB yanit limitini
      // asiyor ve FUNCTION_PAYLOAD_TOO_LARGE (413) hatasina sebep oluyordu.
      // Tam metne ihtiyac duyan yerler dosyayi ayrica (fileId ile) cekmelidir.
      select: {
        id: true,
        workspaceId: true,
        name: true,
        type: true,
        size: true,
        url: true,
        storageKey: true,
        createdAt: true,
        aiSummary: true,
        detailedSummary: true,
        documentType: true,
        documentClass: true,
        legalKeywords: true,
        detectedStatutes: true,
        keyFacts: true,
        keyDates: true,
        parties: true,
        evidenceList: true,
        claimsOrAccusations: true,
        fields: true,
        risks: true,
        defenseIssues: true,
        searchSummary: true,
        aiProfile: true,
        profiledAt: true,
      },
    });

    // Ek guvenlik: buyuk metin alanlarini da makul bir tavanda kirp.
    const safeFiles = files.map((file) => {
      const trimmed = {
        ...file,
        aiSummary: truncateText(file.aiSummary, MAX_AI_SUMMARY_CHARS),
        detailedSummary: truncateText(file.detailedSummary, MAX_DETAILED_SUMMARY_CHARS),
        searchSummary: truncateText(file.searchSummary, MAX_SEARCH_SUMMARY_CHARS),
      };
      return attachUserPerspective(trimmed);
    });

    return Response.json(
      {
        ok: true,
        files: safeFiles,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/workspaces/[id]/files error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Dosyalar alınırken hata oluştu.",
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

    const formData = await request.formData();
    const uploadedFiles = formData.getAll("files").filter(Boolean);
    const isPartyRepresentative = String(formData.get("isPartyRepresentative") || "").toLowerCase() === "true";
    const representedParty = String(formData.get("representedParty") || "").trim();
    const shouldAnalyzeFile = String(formData.get("shouldAnalyzeFile") || "true").toLowerCase() !== "false";

    if (isPartyRepresentative && !representedParty) {
      return Response.json(
        {
          error: "VALIDATION_ERROR",
          message: "Taraf vekiliyseniz temsil edilen taraf bilgisini girmelisiniz.",
        },
        { status: 400 }
      );
    }

    if (!uploadedFiles.length) {
      return Response.json(
        {
          error: "VALIDATION_ERROR",
          message: "Yüklenecek dosya bulunamadı.",
        },
        { status: 400 }
      );
    }

    const savedFiles = [];
    let tokenBalanceAfterUpload = null;


    for (const file of uploadedFiles) {
      if (!file || typeof file.arrayBuffer !== "function") continue;

      const originalName = sanitizeFileName(file.name || "dosya");
      const extension = getFileExtension(originalName);

      if (!ALLOWED_EXTENSIONS.has(extension)) {
        return Response.json(
          {
            error: "VALIDATION_ERROR",
            message: `${originalName} dosya türü desteklenmiyor.`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return Response.json(
          {
            error: "VALIDATION_ERROR",
            message: `${originalName} dosyası çok büyük. En fazla 10 MB yüklenebilir.`,
          },
          { status: 413 }
        );
      }

      const storageKey = `db/workspaces/${workspaceId}/${Date.now()}-${crypto.randomUUID()}-${originalName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      let extractedText = "";

      try {
        if (extension === "pdf") {
          extractedText = await extractTextWithOcr({
            buffer,
            fileName: originalName,
            fileType: extension.toUpperCase(),
          });
        }
        else if (extension === "docx") {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value || "";
        }
        else if (extension === "txt") {
          extractedText = buffer.toString("utf8");
        }
        extractedText = extractedText.trim();
      } catch (extractError) {
        console.error("Dosya text extraction hatası:", extractError);
      }


      let savedFile = await prisma.workspaceFile.create({
        data: {
          workspaceId,
          name: originalName,
          type: extension.toUpperCase(),
          size: file.size,
          url: null,
          storageKey,
          fileData: buffer,
          extractedText,
        },
      });

      const chunks = splitTextIntoChunks(extractedText);

      if (chunks.length) {
        await prisma.workspaceFileChunk.createMany({
          data: chunks.map((content, index) => ({
            workspaceId,
            fileId: savedFile.id,
            chunkIndex: index,
            content,
          })),
          skipDuplicates: true,
        });
      }

      if (shouldAnalyzeFile && extractedText) {
        const balanceCheck = await checkTokenBalance(session.user.id, FILE_PROFILE_TOKEN_COST);

        if (!balanceCheck.ok) {
          return Response.json(
            {
              error: "QUOTA_EXCEEDED",
              message: "Dosya AI profili üretmek için yeterli tokeniniz yok. Lütfen token satın alın.",
              requirePayment: true,
              tokenBalance: balanceCheck.balance ?? 0,
              remaining: balanceCheck.balance ?? 0,
              files: savedFiles.map(({ fileData, extractedText, ...f }) => attachUserPerspective(f)),
            },
            { status: 402 }
          );
        }

        const profile = await generateFileProfile({
          fileName: originalName,
          fileType: extension.toUpperCase(),
          extractedText,
          isPartyRepresentative,
          representedParty,
        });

        if (profile) {
          savedFile = await prisma.workspaceFile.update({
            where: {
              id: savedFile.id,
            },
            data: {
              aiSummary: profile.shortSummary || "",
              detailedSummary: profile.detailedSummary || "",
              documentType: profile.documentType || "diğer",
              documentClass: profile.documentClass || profile.document_class || "",
              legalKeywords: toJsonArray(profile.legalKeywords),
              detectedStatutes: toJsonArray(profile.detectedStatutes),
              keyFacts: toJsonArray(profile.keyFacts),
              keyDates: toJsonArray(profile.keyDates),
              parties: toJsonArray(profile.parties),
              evidenceList: toJsonArray(profile.evidenceList),
              claimsOrAccusations: toJsonArray(profile.claimsOrAccusations || profile.claims_or_accusations),
              fields: toJsonArray(profile.fields),
              risks: toJsonArray(profile.risks),
              defenseIssues: toJsonArray(profile.defenseIssues),
              searchSummary: profile.searchSummary || "",
              aiProfile: {
                ...profile,
                userPerspective: normalizeUserPerspective({
                  isPartyRepresentative,
                  representedParty,
                  profile,
                }),
              },
              profiledAt: new Date(),
            },
          });

          const tokenConsumption = await consumeToken(session.user.id, "WORKSPACE_FILE_PROFILE", FILE_PROFILE_TOKEN_COST, {
            workspaceId,
            fileId: savedFile.id,
            fileName: originalName,
            source: "workspace-file-upload",
          });

          if (!tokenConsumption.ok) {
            return Response.json(
              {
                error: "QUOTA_EXCEEDED",
                message: "Dosya AI profili oluşturuldu ancak token düşülemedi. Lütfen token bakiyenizi kontrol edin.",
                requirePayment: true,
                tokenBalance: tokenConsumption.remaining ?? 0,
                remaining: tokenConsumption.remaining ?? 0,
                files: [...savedFiles, savedFile].map(({ fileData, extractedText, ...f }) => attachUserPerspective(f)),
              },
              { status: 402 }
            );
          }

          tokenBalanceAfterUpload = tokenConsumption.remaining ?? null;
        }
      } else if (!shouldAnalyzeFile) {
        savedFile = await prisma.workspaceFile.update({
          where: {
            id: savedFile.id,
          },
          data: {
            aiSummary: "",
            detailedSummary: "",
            documentType: "",
            documentClass: "",
            legalKeywords: [],
            detectedStatutes: [],
            keyFacts: [],
            keyDates: [],
            parties: [],
            evidenceList: [],
            claimsOrAccusations: [],
            fields: [],
            risks: [],
            defenseIssues: [],
            searchSummary: "",
            aiProfile: {
              skippedAnalysis: true,
              reason: "Kullanıcı dosya yükleme sırasında AI analizi istemedi.",
              userPerspective: normalizeUserPerspective({
                isPartyRepresentative,
                representedParty,
              }),
            },
            profiledAt: null,
          },
        });
      }

      savedFiles.push(savedFile);
    }

    await prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    // Yanitta fileData VE extractedText dondurulmez (buyuk alanlar).
    const responseFiles = savedFiles.map(({ fileData, extractedText, ...file }) =>
      attachUserPerspective(file)
    );

    return Response.json(
      {
        ok: true,
        files: responseFiles,
        tokenBalance: tokenBalanceAfterUpload,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/workspaces/[id]/files error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Dosya yüklenirken hata oluştu.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
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

    const body = await request.json().catch(() => ({}));
    const fileId = String(body?.fileId || "").trim();
    const rawName = String(body?.name || "").trim();

    if (!fileId) {
      return Response.json(
        {
          error: "VALIDATION_ERROR",
          message: "Güncellenecek dosya için fileId gereklidir.",
        },
        { status: 400 }
      );
    }

    if (!rawName) {
      return Response.json(
        {
          error: "VALIDATION_ERROR",
          message: "Dosya adı boş bırakılamaz.",
        },
        { status: 400 }
      );
    }

    const cleanName = sanitizeFileName(rawName);

    if (!cleanName) {
      return Response.json(
        {
          error: "VALIDATION_ERROR",
          message: "Geçerli bir dosya adı giriniz.",
        },
        { status: 400 }
      );
    }

    const file = await prisma.workspaceFile.findFirst({
      where: {
        id: fileId,
        workspaceId,
      },
    });

    if (!file) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Dosya bulunamadı.",
        },
        { status: 404 }
      );
    }

    const updatedFile = await prisma.workspaceFile.update({
      where: {
        id: file.id,
      },
      data: {
        name: cleanName,
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

    const { fileData, extractedText, ...safeUpdatedFile } = updatedFile;

    return Response.json(
      {
        ok: true,
        file: attachUserPerspective(safeUpdatedFile),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/workspaces/[id]/files error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Dosya adı güncellenirken hata oluştu.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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

  const url = new URL(request.url);
  const fileId = url.searchParams.get("fileId");

  if (!fileId) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Silmek için fileId gereklidir.",
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

    const file = await prisma.workspaceFile.findFirst({
      where: {
        id: fileId,
        workspaceId,
      },
    });

    if (!file) {
      return Response.json(
        {
          error: "NOT_FOUND",
          message: "Dosya bulunamadı.",
        },
        { status: 404 }
      );
    }


    await prisma.workspaceFile.delete({
      where: {
        id: file.id,
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
        message: "Dosya silindi.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/workspaces/[id]/files error:", error);

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Dosya silinirken hata oluştu.",
      },
      { status: 500 }
    );
  }
}