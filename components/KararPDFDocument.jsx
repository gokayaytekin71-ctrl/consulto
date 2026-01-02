import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// NOTE: react-pdf requires absolute URLs for fonts
const SITE_URL = 'https://www.consultohukuk.com';

// 1. FONT KAYDI
Font.register({
  family: 'Roboto',
  fonts: [
    { src: `${SITE_URL}/fonts/Roboto-Regular.ttf`, fontWeight: 400 },
    { src: `${SITE_URL}/fonts/Roboto-Bold.ttf`, fontWeight: 700 },
  ],
});

// 2. STİLLER
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
    backgroundColor: '#ffffff',
  },
  // --- HEADER ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end', // 'center' yerine 'flex-end' yaptık, böylece metin uzasa bile hizalama bozulmaz
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 60, // Alt sınıra kaymaması için boşluğu 15'ten 20'ye çıkardık
  },
  headerTitleBlock: {
    flexDirection: 'column',
    width: '65%', // Başlık alanı biraz daha genişletildi
  },
  mainTitle: {
    fontSize: 12, // Hiyerarşi için biraz küçültüldü
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase', // T.C. YARGITAY KARARI her zaman büyük
  },
  subTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    lineHeight: 1.2, // Çok uzun daire isimleri alt satıra geçerse birbirine girmesin
  },
  logoBlock: {
    alignItems: 'flex-end',
    width: '35%',
    paddingBottom: 2, // Logoyu çizgiye görsel olarak hizalamak için ufak ayar
  },
  brandName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  brandSub: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'right', // Alt açıklama sağa yaslı olsun
  },
  // --- INFO KUTUSU ---
  metaBox: {
    backgroundColor: '#f8fafc', // Biraz daha açık gri
    borderLeftWidth: 4,
    borderLeftColor: '#0f172a',
    padding: 12,
    marginBottom: 25,
    borderRadius: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start', // Metin uzarsa etiket yukarıda kalsın
  },
  metaLabel: {
    width: 90, // Etiket genişliği sabitlendi
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
  // --- İÇERİK ---
  content: {
    textAlign: 'justify',
    fontSize: 10,
    lineHeight: 1.8,
    color: '#1e293b',
  },
  // --- ARKA PLAN FİLİGRAN ---
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
  // --- FOOTER ---
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

const Watermark = () => (
  <View style={styles.watermarkContainer} fixed>
    <Text style={styles.watermarkTextBig}>CONSÜLTO</Text>
  </View>
);

const KararPDFDocument = ({ karar }) => {
  // --- METİN TEMİZLEME MANTIĞI ---
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

  // --- DÜZELTME BURADA YAPILDI ---
  // .toUpperCase() yerine .toLocaleUpperCase('tr-TR') kullanıldı.
  // Bu sayede "i" harfi "I" değil "İ" olur.
  const safeType = karar?.type 
    ? String(karar.type).toLocaleUpperCase('tr-TR') 
    : 'KARAR';
    
  const safeCode = karar?.code || 'Dosya No Belirtilmemiş';
  
  // Tarihi güvenli hale getirelim (Hata almamak için)
  const today = new Date().toLocaleDateString('tr-TR');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <Watermark />

        {/* HEADER */}
        <View style={styles.header} fixed>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.mainTitle}>T.C. YARGITAY KARARI</Text>
            {/* safeType artık Türkçe karakterleri destekliyor */}
            <Text style={styles.subTitle}>{safeType}</Text>
          </View>
          <View style={styles.logoBlock}>
            <Text style={styles.brandName}>CONSÜLTO HUKUK</Text>
            <Text style={styles.brandSub}>Yapay Zeka Destekli Hukuk Asistanı</Text>
          </View>
        </View>

        {/* BİLGİ KUTUSU */}
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

        {/* ANA METİN */}
        <View style={styles.content}>
          <Text>{safeContent}</Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
            <Text style={styles.footerText}>Consülto. Tüm Hakları Saklıdır.</Text>
            <Text style={styles.footerLink}>www.consultohukuk.com</Text>
        </View>

      </Page>
    </Document>
  );
};

export default KararPDFDocument;