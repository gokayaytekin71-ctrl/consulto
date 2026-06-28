import React from 'react';
import { Document, Font, Page, StyleSheet, Svg, Text, Text as SvgText, View } from '@react-pdf/renderer';

const MAX_KEYWORDS = 8;
const MAX_BLOCK_CHARS = 950;
const FONT_BASE = typeof window === 'undefined' ? `${process.cwd()}/public/fonts` : '/fonts';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: `${FONT_BASE}/Roboto-Regular.ttf`, fontWeight: 400 },
    { src: `${FONT_BASE}/Roboto-Bold.ttf`, fontWeight: 700 },
    { src: `${FONT_BASE}/Roboto-Italic.ttf`, fontStyle: 'italic' },
  ],
});

Font.register({
  family: 'SourceSerif',
  fonts: [
    { src: `${FONT_BASE}/SourceSerif4-Regular.ttf`, fontWeight: 400 },
    { src: `${FONT_BASE}/SourceSerif4-Regular.ttf`, fontWeight: 400, fontStyle: 'italic' },
    { src: `${FONT_BASE}/SourceSerif4-Semibold.ttf`, fontWeight: 600 },
    { src: `${FONT_BASE}/SourceSerif4-Bold.ttf`, fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback((word) => [word]);

const C = {
  page: '#ffffff',
  ink: '#1c2536',
  muted: '#64748b',
  faint: '#94a3b8',
  navy: '#132b49',
  gold: '#b98a30',
  line: '#e2e8f0',
  lineMed: '#cbd5e1',
  softGold: '#fdf8f0',
  white: '#ffffff',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 82,
    paddingRight: 58,
    paddingBottom: 72,
    paddingLeft: 58,
    backgroundColor: C.page,
    color: C.ink,
    fontFamily: 'SourceSerif',
    fontSize: 10.5,
    lineHeight: 1.65,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: C.navy,
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runningHeader: {
    position: 'absolute',
    top: 16,
    left: 58,
    right: 58,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 0.75,
    borderBottomColor: C.line,
  },
  brandName: {
    fontFamily: 'Roboto',
    fontSize: 8.5,
    fontWeight: 700,
    color: C.navy,
    letterSpacing: 0.6,
  },
  brandSub: {
    fontFamily: 'Roboto',
    marginTop: 2,
    fontSize: 6,
    color: C.muted,
    letterSpacing: 0.4,
  },
  runningKicker: {
    fontFamily: 'Roboto',
    fontSize: 7,
    color: C.muted,
    textAlign: 'right',
  },
  hero: {
    marginTop: 6,
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.lineMed,
  },
  heroLabel: {
    fontFamily: 'Roboto',
    fontSize: 7,
    fontWeight: 700,
    color: C.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: 'SourceSerif',
    fontSize: 21,
    fontWeight: 600,
    color: C.navy,
    lineHeight: 1.2,
    marginBottom: 10,
  },
  heroCode: {
    fontFamily: 'Roboto',
    fontSize: 9,
    color: C.muted,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 0.75,
    borderBottomColor: C.line,
  },
  metaItem: {
    marginRight: 28,
  },
  metaLabel: {
    fontFamily: 'Roboto',
    fontSize: 6.5,
    fontWeight: 700,
    color: C.faint,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  metaValue: {
    fontFamily: 'SourceSerif',
    fontSize: 10,
    fontWeight: 600,
    color: C.navy,
    lineHeight: 1.3,
  },
  quickRead: {
    marginBottom: 18,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: C.gold,
  },
  quickReadLabel: {
    fontFamily: 'Roboto',
    fontSize: 6.5,
    fontWeight: 700,
    color: C.gold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  quickReadText: {
    fontFamily: 'SourceSerif',
    fontSize: 10.2,
    color: C.muted,
    lineHeight: 1.6,
    textAlign: 'justify',
    fontStyle: 'italic',
  },
  keywordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 0.75,
    borderBottomColor: C.line,
  },
  keyword: {
    marginRight: 5,
    marginBottom: 5,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: C.lineMed,
    backgroundColor: C.softGold,
  },
  keywordText: {
    fontFamily: 'Roboto',
    fontSize: 7,
    color: C.muted,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 6,
    paddingBottom: 5,
    borderBottomWidth: 0.75,
    borderBottomColor: C.lineMed,
  },
  sectionHeading: {
    fontFamily: 'SourceSerif',
    fontSize: 11.5,
    fontWeight: 600,
    color: C.navy,
    letterSpacing: 0,
  },
  ictihatIntro: {
    marginTop: 4,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.75,
    borderBottomColor: C.lineMed,
  },
  ictihatTitle: {
    fontFamily: 'SourceSerif',
    fontSize: 13,
    fontWeight: 600,
    color: C.navy,
  },
  paragraph: {
    marginBottom: 8,
    fontFamily: 'SourceSerif',
    fontSize: 10.5,
    color: C.ink,
    lineHeight: 1.68,
    textAlign: 'justify',
  },
  safeParagraph: {
    marginBottom: 8,
    fontFamily: 'SourceSerif',
    fontSize: 10.5,
    color: C.ink,
    lineHeight: 1.68,
    textAlign: 'justify',
  },
  leadParagraph: {
    marginBottom: 8,
    fontFamily: 'SourceSerif',
    fontSize: 10.5,
    color: C.ink,
    lineHeight: 1.68,
    textAlign: 'justify',
  },
  rulingParagraph: {
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: C.navy,
    backgroundColor: '#f8fafc',
    fontFamily: 'SourceSerif',
    fontSize: 10.5,
    color: C.ink,
    lineHeight: 1.68,
    textAlign: 'justify',
  },
  decisionMark: {
    marginTop: 10,
    marginBottom: 4,
    alignSelf: 'center',
    fontSize: 13,
    color: C.faint,
  },
  footer: {
    position: 'absolute',
    left: 58,
    right: 58,
    top: 795,
    paddingTop: 8,
    borderTopWidth: 0.75,
    borderTopColor: C.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Roboto',
    fontSize: 7,
    color: C.faint,
  },
  footerPage: {
    fontFamily: 'Roboto',
    fontSize: 7,
    color: C.muted,
  },
  safeTitle: {
    marginBottom: 6,
    fontSize: 18,
    fontWeight: 700,
    color: C.navy,
    lineHeight: 1.2,
  },
  safeCode: {
    marginBottom: 18,
    fontSize: 10,
    fontWeight: 400,
    color: C.muted,
    fontFamily: 'Roboto',
  },
});

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function sanitizePdfText(value) {
  const str = String(value || '');
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c === 0 || (c >= 1 && c <= 8) || c === 11 || c === 12 || (c >= 14 && c <= 31) || c === 127) continue;
    if (c === 8232 || c === 8233) { out += String.fromCharCode(10); continue; }
    if (c === 173) continue;
    out += str[i];
  }
  return out.replace(/[^\s]{80,}/g, (token) => token.match(/.{1,56}/g)?.join(' ') || token);
}

function normalizeContent(content) {
  let text = sanitizePdfText(decodeEntities(content))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|h[1-6]|li)>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const markers = ['"İçtihat Metni"', 'İçtihat Metni'];
  for (const marker of markers) {
    const index = text.indexOf(marker);
    if (index !== -1 && index < 700) {
      text = text.substring(index).trim();
      break;
    }
  }

  return text || 'İçerik yüklenemedi.';
}

function isHeading(text) {
  const clean = text.replace(/["""]/g, '').trim();
  const lower = clean.toLocaleLowerCase('tr-TR');
  if (!clean || clean.length > 74) return false;
  if (['içtihat metni', 'mahkemesi', 'dava', 'karar', 'sonuç', 'gerekçe', 'inceleme', 'özet', 't.c.'].includes(lower.replace(/[:\s]+$/g, ''))) return true;
  if (/^[A-ZÇĞİÖŞÜ0-9 .\/():-]{3,}$/.test(clean) && /[A-ZÇĞİÖŞÜ]/.test(clean)) return true;
  return false;
}

function isIctihatHeading(text) {
  return text
    .replace(/["""]/g, '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[:\s]+$/g, '') === 'içtihat metni';
}

function splitIntoBlocks(content) {
  const normalized = normalizeContent(content);
  const roughBlocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const blocks = [];
  for (const block of roughBlocks) {
    const compactLines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (compactLines.length > 1) {
      compactLines.forEach((line) => blocks.push(line));
    } else {
      blocks.push(block);
    }
  }

  const expandedBlocks = [];
  for (const text of blocks) {
    if (isHeading(text) || text.length <= MAX_BLOCK_CHARS) {
      expandedBlocks.push(text);
      continue;
    }

    let remaining = text;
    while (remaining.length > MAX_BLOCK_CHARS) {
      const slice = remaining.slice(0, MAX_BLOCK_CHARS);
      const sentenceBreak = Math.max(
        slice.lastIndexOf('. '),
        slice.lastIndexOf('? '),
        slice.lastIndexOf('! '),
        slice.lastIndexOf('; '),
      );
      const spaceBreak = slice.lastIndexOf(' ');
      const cutAt = sentenceBreak > 420 ? sentenceBreak + 1 : spaceBreak > 420 ? spaceBreak : MAX_BLOCK_CHARS;
      expandedBlocks.push(remaining.slice(0, cutAt).trim());
      remaining = remaining.slice(cutAt).trim();
    }
    if (remaining) expandedBlocks.push(remaining);
  }

  return expandedBlocks.map((text, index) => ({
    id: `${index}-${text.slice(0, 18)}`,
    text,
    kind: isHeading(text) ? 'heading' : 'paragraph',
  }));
}

function summarize(content) {
  const paragraphBlocks = splitIntoBlocks(content)
    .filter((block) => block.kind === 'paragraph' && !isIctihatHeading(block.text));

  const paragraphs = paragraphBlocks
    .map((block) => block.text.replace(/\s+/g, ' ').trim())
    .filter((text) => text.length > 80);

  const source = paragraphs[0] || paragraphBlocks[0]?.text || normalizeContent(content);
  return source.length > 310 ? `${source.slice(0, 307).trim()}...` : source;
}

function titleCaseTr(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .split(' ')
    .map((word) => {
      if (!word) return word;
      if (/^\d/.test(word)) return word;
      if (word === 't.c.' || word === 't.c') return 'T.C.';
      return word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1);
    })
    .join(' ');
}

function formatDecisionCode(code) {
  const raw = String(code || '').replace(/\s+/g, ' ').trim();
  if (!raw) return 'Dosya No Belirtilmemiş';

  const parsed = raw.match(/(\d{4}\s*\/\s*\d+)\s*E\.?\s*,?\s*(\d{4}\s*\/\s*\d+)\s*K\.?/i);
  if (parsed) {
    const esas = parsed[1].replace(/\s*\/\s*/g, '/');
    const karar = parsed[2].replace(/\s*\/\s*/g, '/');
    return `${esas} Esas, ${karar} Karar`;
  }

  return raw
    .replace(/(\d{4}\s*\/\s*\d+)\s*E\.?/gi, (_, no) => `${no.replace(/\s*\/\s*/g, '/')} Esas`)
    .replace(/(\d{4}\s*\/\s*\d+)\s*K\.?/gi, (_, no) => `${no.replace(/\s*\/\s*/g, '/')} Karar`)
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function courtLabel(type) {
  const lower = String(type || '').toLocaleLowerCase('tr-TR');
  if (lower.includes('hukuk genel')) return 'Hukuk Genel Kurulu';
  if (lower.includes('ceza genel')) return 'Ceza Genel Kurulu';
  if (lower.includes('daire')) return 'Yargıtay Dairesi';
  return 'Yargıtay';
}

function normalizeKeywords(keywords) {
  if (!Array.isArray(keywords)) return [];
  return keywords
    .map((keyword) => String(keyword || '').trim())
    .filter(Boolean)
    .slice(0, MAX_KEYWORDS);
}

const Watermark = () => (
  <View style={styles.watermarkContainer} fixed>
    <Svg width="595" height="842" viewBox="0 0 595 842">
      <SvgText
        x="300"
        y="430"
        textAnchor="middle"
        fill={C.navy}
        fillOpacity={0.03}
        fontSize="80"
        fontWeight="bold"
        transform="rotate(-38, 300, 430)"
      >
        CONSÜLTO HUKUK
      </SvgText>
    </Svg>
  </View>
);

const PageChrome = ({ type }) => (
  <>
    <View style={styles.topAccent} fixed />
    <Watermark />
    <View style={styles.runningHeader} fixed>
      <View>
        <Text style={styles.brandName}>CONSÜLTO HUKUK</Text>
        <Text style={styles.brandSub}>Yapay Zeka Destekli Hukuk Asistanı</Text>
      </View>
      <Text style={styles.runningKicker}>{type}</Text>
    </View>
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>consultohukuk.com — Yargıtay İçtihat Arşivi</Text>
      <Text
        style={styles.footerPage}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  </>
);

const SafePageChrome = ({ type }) => (
  <>
    <View style={styles.topAccent} fixed />
    <View style={styles.runningHeader} fixed>
      <View>
        <Text style={styles.brandName}>CONSÜLTO HUKUK</Text>
        <Text style={styles.brandSub}>Yapay Zeka Destekli Hukuk Asistanı</Text>
      </View>
      <Text style={styles.runningKicker}>{type}</Text>
    </View>
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>consultohukuk.com — Yargıtay İçtihat Arşivi</Text>
      <Text
        style={styles.footerPage}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  </>
);

const IctihatIntro = () => (
  <View style={styles.ictihatIntro} minPresenceAhead={70}>
    <Text style={styles.ictihatTitle}>İçtihat Metni</Text>
  </View>
);

const KararPDFDocument = ({ karar }) => {
  const type = titleCaseTr(karar?.type || 'Yargıtay Kararı');
  const code = karar?.code || 'Dosya No Belirtilmemiş';
  const displayCode = formatDecisionCode(code);
  const keywords = normalizeKeywords(karar?.keywords);
  const blocks = splitIntoBlocks(karar?.content);
  const quickRead = summarize(karar?.content);
  const safeMode = Boolean(karar?.safeMode);
  const hasIctihatIntro = blocks.some((block) => isIctihatHeading(block.text));

  if (safeMode) {
    return (
      <Document
        title={`${type} ${displayCode}`}
        author="Consülto Hukuk"
        subject="Yargıtay Kararı"
        keywords={keywords.join(', ')}
      >
        <Page size="A4" style={styles.page}>
          <SafePageChrome type={type} />
          <Text style={styles.safeTitle}>{type}</Text>
          <Text style={styles.safeCode}>{displayCode}</Text>
          {hasIctihatIntro && <IctihatIntro />}
          {blocks.map((block) => (
            isIctihatHeading(block.text) ? null : (
              <Text key={block.id} style={block.kind === 'heading' ? styles.sectionHeading : styles.safeParagraph}>
                {block.kind === 'heading' ? block.text.replace(/["""]/g, '') : block.text}
              </Text>
            )
          ))}
        </Page>
      </Document>
    );
  }

  return (
    <Document
      title={`${type} ${displayCode}`}
      author="Consülto Hukuk"
      subject="Yargıtay Kararı"
      keywords={keywords.join(', ')}
    >
      <Page size="A4" style={styles.page}>
        <PageChrome type={type} />

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{courtLabel(type)}</Text>
          <Text style={styles.heroTitle}>{type}</Text>
          <Text style={styles.heroCode}>{displayCode}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Merci</Text>
            <Text style={styles.metaValue}>{courtLabel(type)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Karar Kimliği</Text>
            <Text style={styles.metaValue}>{displayCode}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Belge Türü</Text>
            <Text style={styles.metaValue}>Tam İçtihat Metni</Text>
          </View>
        </View>

        {hasIctihatIntro && <IctihatIntro />}

        <View style={styles.quickRead}>
          <Text style={styles.quickReadLabel}>Hızlı Bakış</Text>
          <Text style={styles.quickReadText}>{quickRead}</Text>
        </View>

        {keywords.length > 0 && (
          <View style={styles.keywordWrap}>
            {keywords.map((keyword) => (
              <View key={keyword} style={styles.keyword}>
                <Text style={styles.keywordText}>{keyword}</Text>
              </View>
            ))}
          </View>
        )}

        {blocks.map((block, index) => {
          if (block.kind === 'heading') {
            if (isIctihatHeading(block.text)) return null;

            return (
              <View key={block.id} style={styles.sectionHeader} minPresenceAhead={54}>
                <Text style={styles.sectionHeading}>{block.text.replace(/["""]/g, '')}</Text>
              </View>
            );
          }

          const lower = block.text.toLocaleLowerCase('tr-TR');
          const isRuling = lower.includes('sonuç') || lower.includes('karar verildi') || lower.includes('oybirliği') || lower.includes('oy çokluğu');
          const paragraphStyle = isRuling
            ? styles.rulingParagraph
            : index < 4
              ? styles.leadParagraph
              : styles.paragraph;

          return (
            <View key={block.id} style={styles.section}>
              <Text style={paragraphStyle}>{block.text}</Text>
            </View>
          );
        })}

        <Text style={styles.decisionMark}>§</Text>
      </Page>
    </Document>
  );
};

export default KararPDFDocument;
