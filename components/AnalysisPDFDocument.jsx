import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Fontları 'public/fonts' klasöründen yüklüyoruz.
// Next.js'de public klasöründeki dosyalara '/' ile erişilir.
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 400 }, // Normal
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 700 },    // Kalın
    { src: '/fonts/Roboto-Italic.ttf', fontStyle: 'italic' }, // İtalik (Alıntılar için)
  ],
});

// 2. STİLLER
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto', // Artık Türkçe destekli Roboto kullanıyoruz
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
    backgroundColor: '#ffffff',
  },
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 15,
  },
  headerTitleBlock: {
    flexDirection: 'column',
    width: '60%',
  },
  mainTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 24,
    color: '#0f172a',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  logoBlock: {
    alignItems: 'flex-end',
    width: '40%',
    paddingBottom: 4,
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
  // INFO KUTUSU
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
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  metaLabel: {
    width: 95,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  metaValue: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 1.4,
  },
  // İÇERİK STİLLERİ
  content: {
    fontSize: 10,
    lineHeight: 1.8,
    color: '#1e293b',
    textAlign: 'justify',
  },
  paragraph: {
    marginBottom: 10,
  },
  // BAŞLIK STİLİ
  headingRow: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 15,
    marginBottom: 6,
    textTransform: 'none',
  },
  // ALINTI (BLOCKQUOTE) STİLİ
  blockquote: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderLeftWidth: 3,
    borderLeftColor: '#06b6d4',
    fontStyle: 'italic', // İtalik font burada devreye girer
    color: '#475569',
    borderRadius: 2,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  // FİLİGRAN
  watermarkContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: -1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  watermarkTextBig: {
    fontSize: 110,
    fontWeight: '900',
    color: '#cbd5e1',
    opacity: 0.12,
    transform: 'rotate(-45deg)',
    textAlign: 'center',
    width: 800,
  },
  // FOOTER
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

// ZENGİN METİN İŞLEYİCİSİ
const RichText = ({ text }) => {
  if (!text) return null;

  // Link temizliği
  let cleanText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleanText = cleanText.replace(/\[(.*?)\]/g, '$1');

  // Kalın metinleri işle (**bold**)
  const parts = cleanText.split(/(\*\*[^*]+\*\*)/g);

  return (
    <Text>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          return (
            <Text key={i} style={styles.boldText}>
              {content}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
};

const Watermark = () => (
  <View style={styles.watermarkContainer} fixed>
    <Text style={styles.watermarkTextBig}>CONSÜLTO</Text>
  </View>
);

const AnalysisPDFDocument = ({ subject, content, date }) => {
  const rawText = content || "İçerik hazırlanıyor...";
  const paragraphs = rawText.split(/\n\s*\n/);

  const safeSubject = subject || "Analiz Konusu Belirtilmemiş";
  const safeDate = date ? new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('tr-TR');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Watermark />

        {/* HEADER */}
        <View style={styles.header} fixed>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.mainTitle}>HUKUKİ ANALİZ RAPORU</Text>
            <Text style={styles.subTitle}>ANALİZ</Text>
          </View>
          <View style={styles.logoBlock}>
            <Text style={styles.brandName}>CONSÜLTO HUKUK</Text>
            <Text style={styles.brandSub}>Yapay Zeka Destekli Hukuk Asistanı</Text>
          </View>
        </View>

        {/* BİLGİ KUTUSU */}
        <View style={styles.metaBox}>
            <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>ANALİZ KONUSU:</Text>
                <Text style={styles.metaValue}>{safeSubject}</Text>
            </View>
            <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>ANALİZ TÜRÜ:</Text>
                <Text style={styles.metaValue}>YAPAY ZEKA DESTEKLİ HUKUKİ GÖRÜŞ</Text>
            </View>
            <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>TARİH:</Text>
                <Text style={styles.metaValue}>{safeDate}</Text>
            </View>
        </View>

        {/* ANA METİN */}
        <View style={styles.content}>
          {paragraphs.map((para, index) => {
             const trimmed = para.trim();
             if (!trimmed) return null;

             // 1. BAŞLIK KONTROLÜ (##)
             if (trimmed.startsWith('#')) {
                 let cleanHeader = trimmed.replace(/^#+\s*/, '');
                 cleanHeader = cleanHeader.replace(/\*\*/g, ''); 
                 return (
                    <Text 
                        key={index} 
                        style={styles.headingRow} 
                        minPresenceAhead={50} // Başlık sayfa sonuna gelirse atlat
                    >
                        {cleanHeader}
                    </Text>
                 );
             }

             // 2. ALINTI KONTROLÜ (>)
             if (trimmed.startsWith('>')) {
                 const cleanQuote = trimmed.replace(/^>\s*/, '');
                 return (
                    <View key={index} style={styles.blockquote} wrap={false}>
                        <RichText text={cleanQuote} />
                    </View>
                 );
             }

             // 3. NORMAL PARAGRAF
             return (
               <View key={index} style={styles.paragraph}>
                 <RichText text={trimmed} />
               </View>
             );
          })}
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
            <Text style={styles.footerText}>Bu rapor yapay zeka tarafından oluşturulmuştur, hukuki tavsiye niteliği taşımaz.</Text>
            <Text style={styles.footerLink}>www.consultohukuk.com</Text>
        </View>
      </Page>
    </Document>
  );
};

export default AnalysisPDFDocument;