import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Svg, Text as SvgText } from '@react-pdf/renderer';

const SITE_URL = 'https://www.consultohukuk.com';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: `${SITE_URL}/fonts/Roboto-Regular.ttf`, fontWeight: 400 },
    { src: `${SITE_URL}/fonts/Roboto-Bold.ttf`, fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 70, // footer için yer
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 12, // 60 çok fazlaydı; metni aşağı itiyordu
  },
  headerTitleBlock: {
    flexDirection: 'column',
    width: '65%',
  },
  mainTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    lineHeight: 1.2,
  },
  logoBlock: {
    alignItems: 'flex-end',
    width: '35%',
    paddingBottom: 2,
  },
  brandName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  brandSub: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'right',
  },
  metaBox: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: '#0f172a',
    padding: 12,
    marginBottom: 25,
    borderRadius: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  metaLabel: {
    width: 90,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  metaValue: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    textAlign: 'justify',
    fontSize: 10,
    lineHeight: 1.8,
    color: '#1e293b',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: -1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  footerLink: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
    textDecoration: 'none',
  },
});

// Filigran artık SVG: kopyalanamaz, seçilemez, metin akışını bozmaz
const Watermark = () => (
  <View style={styles.watermarkContainer} fixed>
    <Svg width="595" height="842" viewBox="0 0 595 842">
      <SvgText
        x="297"
        y="421"
        textAnchor="middle"
        fill="#cbd5e1"
        fillOpacity={0.15}
        fontSize="100"
        fontWeight="bold"
        transform="rotate(-45, 297, 421)"
      >
        CONSÜLTO
      </SvgText>
    </Svg>
  </View>
);

const KararPDFDocument = ({ karar }) => {
  let safeContent = karar?.content
    ? String(karar.content).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
    : 'İçerik yüklenemedi.';

  const marker = '"İçtihat Metni"';
  const markerIndex = safeContent.indexOf(marker);

  if (markerIndex !== -1 && markerIndex < 500) {
    safeContent = safeContent.substring(markerIndex);
  } else {
    const markerNoQuote = 'İçtihat Metni';
    const indexNoQuote = safeContent.indexOf(markerNoQuote);
    if (indexNoQuote !== -1 && indexNoQuote < 500) {
      safeContent = safeContent.substring(indexNoQuote);
    }
  }

  const safeType = karar?.type
    ? String(karar.type).toLocaleUpperCase('tr-TR')
    : 'KARAR';

  const safeCode = karar?.code || 'Dosya No Belirtilmemiş';

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <Watermark />

        <View style={styles.header} fixed>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.mainTitle}>T.C. YARGITAY KARARI</Text>
            <Text style={styles.subTitle}>{safeType}</Text>
          </View>
          <View style={styles.logoBlock}>
            <Text style={styles.brandName}>CONSÜLTO HUKUK</Text>
            <Text style={styles.brandSub}>Yapay Zeka Destekli Hukuk Asistanı</Text>
          </View>
        </View>

        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>DAİRE/KURUL:</Text>
            <Text style={styles.metaValue}>{safeType}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>DOSYA NO:</Text>
            <Text style={styles.metaValue}>{safeCode}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text>{safeContent}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Consülto. Tüm Hakları Saklıdır.</Text>
          <Text style={styles.footerLink}>www.consultohukuk.com</Text>
        </View>

      </Page>
    </Document>
  );
};

export default KararPDFDocument;