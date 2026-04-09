// lib/data.js
import prisma from "./prisma";

const ITEMS_PER_PAGE = 12;

export async function getKararlarFromDB(filters = {}, cursor = undefined) {
  // Param builder for $1, $2, ...
  const params = [];
  const p = (v) => { params.push(v); return `$${params.length}`; };

  const cond = [];

  // FTS vectors (fallback to on-the-fly to_tsvector if tsv_* columns are null)
  const tsvMain  = `COALESCE("tsv_main",  to_tsvector('turkish', "content"))`;
  const tsvExtra = `COALESCE("tsv_extra", to_tsvector('turkish', "aiSummary"))`;

  // Full-text conditions
  if (filters.q) {
    cond.push(`${tsvMain} @@ websearch_to_tsquery('turkish', ${p(String(filters.q))})`);
  }
  if (filters.aiq) {
    cond.push(`${tsvExtra} @@ websearch_to_tsquery('turkish', ${p(String(filters.aiq))})`);
  }

  // --- YENİ: tam ifade (content) ---
if (filters.phrase) {
  cond.push(`${tsvMain} @@ phraseto_tsquery('turkish', ${p(String(filters.phrase))})`);
}

// --- YENİ: içerikten hariç tut (virgülle çoklu) ---
if (filters.qnot) {
  const terms = String(filters.qnot).split(",").map(s => s.trim()).filter(Boolean);
  for (const term of terms) {
    // FTS tabanlı NOT (daha hızlı); istersen ILIKE NOT'a çevrilebilir
    cond.push(`NOT (${tsvMain} @@ plainto_tsquery('turkish', ${p(term)}))`);
  }
}

  // ILIKE conditions
  const like = (v) => `%${String(v)}%`;

  if (filters.kw) {
    cond.push(`"keywords" ILIKE ${p(like(filters.kw))}`);
  }

  const courtLike = filters.organ || filters.mahkeme;
  if (courtLike) {
    cond.push(`LOWER(TRIM("type")) = LOWER(TRIM(${p(String(courtLike))}))`);
  }

  // Esas filters — support both '-' and '/' between year and number
  if (filters.esasYili && filters.esasNo) {
    cond.push(
      `( "code" ILIKE ${p(`${filters.esasYili}-${filters.esasNo}% E%`)} OR "code" ILIKE ${p(`${filters.esasYili}/${filters.esasNo}% E%`)} )`
    );
  } else if (filters.esasYili) {
    cond.push(
      `( "code" ILIKE ${p(`${filters.esasYili}-%`)} OR "code" ILIKE ${p(`${filters.esasYili}/%`)} )`
    );
  } else if (filters.esasNo) {
    cond.push(
      `( "code" ILIKE ${p(`%-${filters.esasNo} E%`)} OR "code" ILIKE ${p(`%/${filters.esasNo} E%`)} )`
    );
  }

  // Karar filters — support both '-' and '/' between year and number
  if (filters.kararYili && filters.kararNo) {
    cond.push(
      `( "code" ILIKE ${p(`${filters.kararYili}-${filters.kararNo}% K%`)} OR "code" ILIKE ${p(`${filters.kararYili}/${filters.kararNo}% K`)} )`
    );
  } else if (filters.kararYili) {
    cond.push(
      `( "code" ILIKE ${p(`${filters.kararYili}-%`)} OR "code" ILIKE ${p(`${filters.kararYili}/%`)} )`
    );
  } else if (filters.kararNo) {
    cond.push(
      `( "code" ILIKE ${p(`%-${filters.kararNo} K%`)} OR "code" ILIKE ${p(`%/${filters.kararNo} K%`)} )`
    );
  }

  const sort = String(filters.sort || "relevance");

  // Keyset for 'newest' only; use composite cursor "createdAtISO|id"
  if (sort === "newest" && cursor != null) {
    const [curAt, curId] = String(cursor).split("|");
    if (curAt && curId) {
      cond.push(`(("createdAt" < ${p(new Date(curAt))}) OR ("createdAt" = ${p(new Date(curAt))} AND "id" < ${p(String(curId))}))`);
    }
  }

  const whereSQL = cond.length ? `WHERE ${cond.join(" AND ")}` : "";

  // ORDER BY logic
  let orderBySQL = `"createdAt" DESC NULLS LAST, "id" DESC`; // default

  if (sort === "esasNoDesc" || sort === "esasNoAsc") {
    // Esas: 'YYYY-N E'  (POSIX regex)
    const esasYil = `COALESCE(NULLIF(substring("code" from '([0-9]{4})[/-][0-9]+[[:space:]]*E\\.?'), '')::int, 0)`;
    const esasNo  = `COALESCE(NULLIF(substring("code" from '[/-]([0-9]+)[[:space:]]*E\\.?'), '')::int, 0)`;
    const dir = sort === "esasNoAsc" ? "ASC" : "DESC";
    orderBySQL = `${esasYil} ${dir}, ${esasNo} ${dir}, "id" ${dir}`;
  } else if (sort === "kararNoDesc" || sort === "kararNoAsc") {
    // Karar: 'YYYY-N K'
    const kararYil = `COALESCE(NULLIF(substring("code" from '([0-9]{4})[/-][0-9]+[[:space:]]*K\\.?'), '')::int, 0)`;
    const kararNo  = `COALESCE(NULLIF(substring("code" from '[/-]([0-9]+)[[:space:]]*K\\.?'), '')::int, 0)`;
    const dir = sort === "kararNoAsc" ? "ASC" : "DESC";
    orderBySQL = `${kararYil} ${dir}, ${kararNo} ${dir}, "id" ${dir}`;
  } else if (sort === "relevance" && (filters.q || filters.aiq || filters.phrase)) {
    // Rank by FTS score; phrase gets extra weight, summary weaker
    const rankMain   = filters.q
      ? `ts_rank(${tsvMain},  websearch_to_tsquery('turkish', ${p(String(filters.q))}))`
      : `0`;
    const rankPhrase = filters.phrase
      ? `ts_rank(${tsvMain},  phraseto_tsquery('turkish', ${p(String(filters.phrase))}))`
      : `0`;
    const rankExtra  = filters.aiq
      ? `ts_rank(${tsvExtra}, websearch_to_tsquery('turkish', ${p(String(filters.aiq))}))`
      : `0`;
    const rankExpr   = `(${rankMain} + 1.2*${rankPhrase} + 0.5*${rankExtra})`;
    orderBySQL = `${rankExpr} DESC, "createdAt" DESC NULLS LAST, "id" DESC`;
  } else if (sort === "newest") {
    orderBySQL = `"createdAt" DESC NULLS LAST, "id" DESC`;
  }

  // Pagination: LIMIT always; OFFSET for non-'newest'
  const limitSql = `LIMIT ${p(ITEMS_PER_PAGE)}`;
  let offsetSql = "";
  if (sort !== "newest") {
    const offset = Math.max(0, Number.isFinite(Number(cursor)) ? parseInt(cursor, 10) : 0);
    offsetSql = `OFFSET ${p(offset)}`;
  }

  const sql = `
    SELECT "id","fileName","type","code","aiSummary","keywords","createdAt","contentLength"
    FROM "Karar"
    ${whereSQL}
    ORDER BY ${orderBySQL}
    ${limitSql}
    ${offsetSql}
  `;

  const rows = await prisma.$queryRawUnsafe(sql, ...params);

  // Compute nextCursor
  let nextCursor;
  if (sort === "newest") {
    if (rows.length === ITEMS_PER_PAGE) {
      const last = rows[rows.length - 1];
      nextCursor = `${new Date(last.createdAt).toISOString()}|${last.id}`;
    }
  } else {
    const offset = Math.max(0, Number.isFinite(Number(cursor)) ? parseInt(cursor, 10) : 0);
    nextCursor = rows.length === ITEMS_PER_PAGE ? String(offset + ITEMS_PER_PAGE) : undefined;
  }

  // serialize createdAt
  const data = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  }));

  return { data, nextCursor };
}