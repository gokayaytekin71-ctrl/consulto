import path from "node:path";
import PDFDocument from "@react-pdf/pdfkit";

export const runtime = "nodejs";

function cleanText(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|h[1-6]|li)>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[^\s]{80,}/g, (token) => token.match(/.{1,56}/g)?.join(" ") || token)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function titleCaseTr(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .split(" ")
    .map((word) => {
      if (!word) return word;
      if (/^\d/.test(word)) return word;
      return word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1);
    })
    .join(" ");
}

function formatDecisionCode(code) {
  const raw = String(code || "").replace(/\s+/g, " ").trim();
  if (!raw) return "Dosya No Belirtilmemiş";

  const parsed = raw.match(/(\d{4}\s*\/\s*\d+)\s*E\.?\s*,?\s*(\d{4}\s*\/\s*\d+)\s*K\.?/i);
  if (parsed) {
    return `${parsed[1].replace(/\s*\/\s*/g, "/")} Esas, ${parsed[2].replace(/\s*\/\s*/g, "/")} Karar`;
  }

  return raw
    .replace(/(\d{4}\s*\/\s*\d+)\s*E\.?/gi, (_, no) => `${no.replace(/\s*\/\s*/g, "/")} Esas`)
    .replace(/(\d{4}\s*\/\s*\d+)\s*K\.?/gi, (_, no) => `${no.replace(/\s*\/\s*/g, "/")} Karar`)
    .replace(/\s+/g, " ")
    .trim();
}

function splitLogicalBlocks(content) {
  return cleanText(content)
    .split(/\n{2,}/)
    .flatMap((block) => block.split("\n"))
    .map((block) => block.trim())
    .filter(Boolean);
}

function normalizeComparable(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeRepeatedHeaderBlocks(blocks, type) {
  const normalizedType = normalizeComparable(type);
  return blocks.filter((block, index) => {
    if (index > 2 || block.length > 180) return true;
    const normalizedBlock = normalizeComparable(block);
    const looksLikeCodeLine = /\d{4}\s*[/-]\s*\d+/.test(block);
    return !(looksLikeCodeLine && normalizedType && normalizedBlock.includes(normalizedType));
  });
}

function isIctihatHeading(text) {
  return text
    .replace(/["“”]/g, "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[:\s]+$/g, "") === "içtihat metni";
}

function isHeading(text) {
  const clean = text.replace(/["“”]/g, "").trim();
  if (!clean || clean.length > 82) return false;
  const lower = clean.toLocaleLowerCase("tr-TR").replace(/[:\s]+$/g, "");
  return ["mahkemesi", "dava", "karar", "sonuç", "gerekçe", "inceleme", "özet", "t.c."].includes(lower);
}


function collectPdf(doc) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

async function renderPdfKitFallback(karar) {
  const type = titleCaseTr(karar?.type || "Yargıtay Kararı");
  const code = formatDecisionCode(karar?.code);
  const blocks = removeRepeatedHeaderBlocks(splitLogicalBlocks(karar?.content), type);
  const fontDir = path.join(process.cwd(), "public", "fonts");

  const doc = new PDFDocument({
    size: "A4",
    margin: 54,
    bufferPages: true,
    info: {
      Title: `${type} ${code}`,
      Author: "Consülto Hukuk",
      Subject: "Yargıtay İçtihat Metni",
    },
  });

  doc.registerFont("SourceSerif", path.join(fontDir, "SourceSerif4-Regular.ttf"));
  doc.registerFont("SourceSerifBold", path.join(fontDir, "SourceSerif4-Bold.ttf"));
  doc.registerFont("Roboto", path.join(fontDir, "Roboto-Regular.ttf"));
  doc.registerFont("RobotoBold", path.join(fontDir, "Roboto-Bold.ttf"));

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const marginX = 54;
  const contentWidth = pageWidth - marginX * 2;
  const bottom = pageHeight - 112;

  const drawChrome = () => {
    doc.rect(0, 0, pageWidth, pageHeight).fill("#f6f3ec");
    doc.rect(0, 0, pageWidth, 13).fill("#132b49");
    doc.rect(0, 13, pageWidth, 2.5).fill("#b98a30");
    doc.rect(0, 15.5, 8, pageHeight - 15.5).fill("#efebe1");
    doc.rect(8, 15.5, 1.2, pageHeight - 15.5).fill("#e3d8c5");
    doc.fillColor("#e9dfcd").font("RobotoBold").fontSize(7).text("CONSÜLTO HUKUK", pageWidth - 168, 30, {
      width: 106,
      align: "right",
      characterSpacing: 0.6,
    });
  };

  const addPage = () => {
    doc.addPage();
    drawChrome();
    doc.x = marginX;
    doc.y = 48;
  };

  const ensureSpace = (height = 42) => {
    if (doc.y + height > bottom) addPage();
  };

  const isSectionTitle = (text) => {
    const clean = String(text || "").replace(/["“”]/g, "").trim();
    if (!clean || clean.length > 90) return false;
    return (
      isHeading(clean) ||
      /^[IVXLCDM]+\.\s+[A-ZÇĞİÖŞÜ0-9][A-ZÇĞİÖŞÜ0-9\s.,()-]{1,}$/u.test(clean) ||
      /^[A-ZÇĞİÖŞÜ\s]{4,}:/.test(clean)
    );
  };

  const splitToFit = (text, options, availableHeight) => {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    if (words.length <= 1) return [String(text || "").trim(), ""];

    let low = 1;
    let high = words.length;
    let best = 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const candidate = words.slice(0, mid).join(" ");
      const height = doc.heightOfString(candidate, options);

      if (height <= availableHeight) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return [
      words.slice(0, best).join(" "),
      words.slice(best).join(" "),
    ];
  };

  const writeMeasuredText = (text, options, moveDown = 0.48, minHeight = 42, applyStyle = () => {}) => {
    let rest = String(text || "").trim();
    if (!rest) return;

    while (rest) {
      applyStyle();
      let available = bottom - doc.y;
      if (available < minHeight) {
        addPage();
        applyStyle();
        available = bottom - doc.y;
      }

      const safeAvailable = Math.max(24, available - 14);
      const fullHeight = doc.heightOfString(rest, options);

      if (fullHeight <= safeAvailable) {
        doc.text(rest, options);
        doc.moveDown(moveDown);
        return;
      }

      const [part, next] = splitToFit(rest, options, safeAvailable);
      applyStyle();
      doc.text(part, { ...options, align: "justify" });
      rest = next.trim();

      if (rest) addPage();
    }
  };

  drawChrome();

  doc.x = marginX;
  doc.y = 44;
  doc.roundedRect(marginX, doc.y, 30, 30, 6).fill("#132b49");
  doc.fillColor("#b98a30").font("SourceSerifBold").fontSize(16).text("§", marginX, doc.y + 4, {
    width: 30,
    align: "center",
  });
  doc.fillColor("#132b49").font("RobotoBold").fontSize(10.5).text("CONSÜLTO HUKUK", marginX + 42, 47, {
    characterSpacing: 0.7,
  });
  doc.fillColor("#667085").font("Roboto").fontSize(7).text("YAPAY ZEKA DESTEKLI HUKUK ASISTANI", marginX + 42, 63, {
    characterSpacing: 0.7,
  });

  doc.moveTo(marginX, 96).lineTo(pageWidth - marginX, 96).lineWidth(1).strokeColor("#d8ccb8").stroke();

  doc.x = marginX;
  doc.y = 118;
  doc.fillColor("#b98a30").font("RobotoBold").fontSize(7).text("YARGITAY IÇTIHAT VERITABANI", {
    width: contentWidth,
    characterSpacing: 1.1,
  });
  doc.moveDown(0.65);
  doc.fillColor("#132b49").font("SourceSerifBold").fontSize(26).text(type, {
    width: contentWidth,
    lineGap: 2,
  });
  doc.moveDown(0.35);
  doc.fillColor("#667085").font("SourceSerifBold").fontSize(12.2).text(code, { width: contentWidth });
  doc.moveDown(1.1);
  doc.moveTo(marginX, doc.y).lineTo(marginX + 86, doc.y).lineWidth(2).strokeColor("#b98a30").stroke();
  doc.moveDown(1.35);

  for (const block of blocks) {
    ensureSpace(44);

    if (isIctihatHeading(block)) {
      ensureSpace(58);
      doc.moveDown(0.1);
      doc.fillColor("#132b49").font("SourceSerifBold").fontSize(19).text("“ İçtihat Metni", {
        width: contentWidth,
      });
      doc.moveDown(0.85);
      continue;
    }

    if (isSectionTitle(block)) {
      ensureSpace(48);
      doc.moveDown(0.1);
      doc.fillColor("#132b49").font("SourceSerifBold").fontSize(11.7);
      writeMeasuredText(
        block.replace(/["“”]/g, ""),
        {
          width: contentWidth,
          lineGap: 2,
          align: "left",
        },
        0.45,
        48,
        () => doc.fillColor("#132b49").font("SourceSerifBold").fontSize(11.7),
      );
      continue;
    }

    const shouldJustify = block.length > 120;
    writeMeasuredText(
      block,
      {
        width: contentWidth,
        align: shouldJustify ? "justify" : "left",
        lineGap: 2.2,
      },
      0.48,
      42,
      () => doc.fillColor("#182033").font("SourceSerif").fontSize(10.35),
    );
  }

  const initialRange = doc.bufferedPageRange();
  const totalPages = initialRange.count;
  const footerY = pageHeight - 82;

  for (let i = initialRange.start; i < initialRange.start + totalPages; i += 1) {
    doc.switchToPage(i);
    doc.fillColor("#98a2b3").font("Roboto").fontSize(7.5).text("consultohukuk.com", marginX, footerY, {
      width: 180,
      lineBreak: false,
    });
    doc.fillColor("#98a2b3").font("Roboto").fontSize(7.5).text(`Sayfa ${i + 1} / ${totalPages}`, pageWidth - marginX - 90, footerY, {
      width: 90,
      align: "right",
      lineBreak: false,
    });
  }

  return collectPdf(doc);
}

export async function POST(request) {
  try {
    const karar = await request.json();

    if (!karar || typeof karar !== "object") {
      return Response.json({ message: "Karar verisi bulunamadı." }, { status: 400 });
    }

    const buffer = await renderPdfKitFallback(karar);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
        "X-Karar-Pdf-Engine": "pdfkit",
      },
    });
  } catch (error) {
    console.error("Karar PDF API hatası:", error);
    return Response.json(
      { message: error?.message || "PDF oluşturulamadı." },
      { status: 500 },
    );
  }
}
