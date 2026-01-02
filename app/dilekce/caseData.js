export const CASE_TYPES = {
  "": { label: "Seçiniz...", fields: [] },
  cevap: {
    label: "Cevap Dilekçesi (Karşı Tarafa Cevap)",
    fields: [
      { id: "gelen_dava_dilekcesi", label: "Gelen Dava Dilekçesi (Metin)", type: "textarea", required: true, placeholder: "Davacının dava dilekçesini buraya yapıştırın (metin/Markdown)" }
    ],
  },
  kira: {
    label: "Kira (Tahliye / Alacak)",
    fields: [
      { id: "tasinmaz_adresi", label: "Taşınmaz Adresi", type: "textarea", required: true, placeholder: "İl / İlçe / Mahalle / Cadde / No / Daire ..." },
      { id: "sozlesme_tarihi", label: "Kira Sözleşmesi Tarihi", type: "date", required: false },
      { id: "aylik_kira_bedeli", label: "Aylık Kira Bedeli (TL)", type: "number", step: "0.01", required: false },
      { id: "kira_turu", label: "Kira Türü", type: "select", required: false, options: [{ value: "konut", label: "Konut" }, { value: "isyeri", label: "İşyeri" }] },
      { id: "artis_orani", label: "Artış Oranı / Şekli", type: "text", required: false },
      { id: "odemeler", label: "Ödeme Geçmişi / Eksik Ödemeler", type: "textarea", required: false, placeholder: "Ay ay yapılan/eksik ödemeler..." },
      { id: "ihtar_tarihi", label: "İhtar/İhbar Tarihi", type: "date", required: false },
      { id: "ihtarname_icerigi", label: "İhtarname İçeriği", type: "textarea", required: false, placeholder: "Tahliye talep edildi mi..." },
      { id: "tahliye_sebebi", label: "Tahliye Sebebi", type: "select", required: false, options: [{ value: "odeme_yapilmamasi", label: "Ödeme Yapılmaması (TBK 315)" }, { value: "ihtiyac", label: "İhtiyaç Nedeni (TBK 350)" }, { value: "yeniden_insa", label: "Yeniden İnşa / İmar (TBK 350)" }, { value: "iki_hakli_ihtar", label: "İki Haklı İhtar" }, { value: "surenin_sona_ermesi", label: "Sürenin Sona Ermesi" }, { value: "temerrut", label: "Temerrüt" }, { value: "tahliye_taahutu", label: "Tahliye Taahüdü" }, { value: "diger", label: "Diğer" }] },
      { id: "ek_bilgiler", label: "Diğer Önemli Hususlar", type: "textarea", required: false, placeholder: "Örn: Depozito, teslim-tesellüm, ayıplar, komşu şikayetleri, vb." },
    ],
  },
  kira_tespiti: {
    label: "Kira Tespit Davası",
    fields: [
      { id: "tasinmaz_adresi", label: "Taşınmaz Adresi", type: "textarea", required: true, placeholder: "İl / İlçe / Mahalle / Cadde / No / Daire ..." },
      { id: "mevcut_kira", label: "Mevcut Kira (TL)", type: "number", step: "0.01", required: true },
      { id: "emsal_kira", label: "Emsal Kira (TL)", type: "number", step: "0.01", required: false },
      { id: "sozlesme_tarihi", label: "Sözleşme Tarihi", type: "date", required: false },
      { id: "yeni_donem_basi", label: "Yeni Dönem Başlangıcı", type: "date", required: false },
    ],
  },
  bosanma: {
    label: "Aile (Boşanma / Nafaka / Velayet / Mal Rejiminin Tasfiyesi)",
    fields: [
      { id: "es_ad_soyad", label: "Davalı Eş Adı Soyadı", type: "text", required: true },
      { id: "evlilik_tarihi", label: "Evlilik Tarihi", type: "date", required: false },
      { id: "cocuk_bilgileri", label: "Çocuk Bilgileri", type: "textarea", required: false, placeholder: "Ad-soyad / doğum tarihi / özel durumlar..." },
      { id: "nafaka_talebi", label: "Nafaka Talebi", type: "select", required: false, options: [{ value: "yoksulluk", label: "Yoksulluk Nafakası" }, { value: "tedbir", label: "Tedbir Nafakası" }, { value: "istirak", label: "İştirak Nafakası" }, { value: "artirim", label: "Nafaka Artırımı" }, { value: "yok", label: "Yok" }] },
      { id: "siddet_ve_vakialar", label: "Vakıalar / Şiddet İddiaları", type: "textarea", required: false, placeholder: "Kronolojik vakıa özeti, sağlık raporları, koruma kararları vb." },
      { id: "mal_rejimi", label: "Mal Rejimi / Tazmin Talepleri", type: "textarea", required: false, placeholder: "Katkı payı, değer artış payı, ziynet, maddi-manevi tazminat talepleri..." },
    ],
  },
  iscilik: {
    label: "İşçilik Alacakları",
    fields: [
      { id: "isveren_unvan", label: "İşveren Unvan/Adı", type: "text", required: true },
      { id: "isyeri_adresi", label: "İşyeri Adresi", type: "textarea", required: false },
      { id: "pozisyon", label: "Görev/Unvan", type: "text", required: false },
      { id: "ise_giris", label: "İşe Giriş Tarihi", type: "date", required: true },
      { id: "is_cikis", label: "İşten Ayrılış Tarihi", type: "date", required: false },
      { id: "brut_ucret", label: "Brüt Ücret (TL)", type: "number", step: "0.01", required: true },
      { id: "odeme_sekli", label: "Ücret Ödeme Şekli", type: "select", required: false, options: [{ value: "banka", label: "Banka" }, { value: "elden ödeme", label: "Elden Ödeme" }] },
      { id: "hafta_tatili", label: "Hafta Tatili", type: "textarea", required: false, placeholder: "Çalışılan Hafta Sonları, Kaç Saat Çalışıldığı..." },
      { id: "fazla_mesai", label: "Fazla Mesai Alacağı", type: "textarea", required: false, placeholder: "Mesaiye Kalınan Gün, Saat..." },
      { id: "ubgt_alacagi", label: "UBGT Alacağı", type: "textarea", required: false, placeholder: "Çalışılan Bayramlar, Resmi Tatiller..." },
      { id: "yillik_izin", label: "Yıllık İzin Alacağı", type: "text", required: false, placeholder: "Kullanılmayan İzinler" },
      { id: "is_akit_feshi", label: "Fesih Şekli ve Sebebi", type: "textarea", required: false, placeholder: "Haklı nedenle fesih iddiası, çıkış kodu, ihtarname vb." },
    ],
  },
  trafik_tazminat: {
    label: "Trafik Kazası (Maddi/Manevi Tazminat)",
    fields: [
      { id: "kaza_tarihi", label: "Kaza Tarihi", type: "date", required: true },
      { id: "kaza_yeri", label: "Kaza Yeri", type: "text", required: true },
      { id: "davaci_plaka", label: "Davacı Araç Plakası", type: "text", required: false },
      { id: "davalı_plaka", label: "Davalı Araç Plakası", type: "text", required: false },
      { id: "polis_tutanagi", label: "Polis/Jandarma Tutanak No", type: "text", required: false },
      { id: "sigorta_sirketi", label: "Sigorta Şirketi", type: "text", required: false },
      { id: "hasar_bedeli", label: "Hasar/Masraf Bedelleri (TL)", type: "number", step: "0.01", required: false },
      { id: "maluliyet_orani", label: "Maluliyet/İş Gücü Kaybı (%)", type: "number", step: "0.01", required: false },
    ],
  },
  tapu_iptal_tescil: {
    label: "Tapu İptali ve Tescil",
    fields: [
      { id: "il_ilce", label: "İl / İlçe", type: "text", required: true },
      { id: "ada", label: "Ada", type: "text", required: false },
      { id: "parsel", label: "Parsel", type: "text", required: false },
      { id: "nitelik", label: "Taşınmaz Niteliği", type: "text", required: false },
      { id: "sebep", label: "Sebep", type: "select", required: true, options: [{ value: "muris_muvazaasi", label: "Muris Muvazaası" }, { value: "vekalet_kotuye", label: "Vekaletin Kötüye Kullanılması" }, { value: "sahtecilik", label: "Belgede Sahtecilik" }, { value: "ehliyetsizlik", label: "Ehliyetsizlik" }, { value: "satis_vaadi", label: "Satış Vaadi" }, { value: "diger", label: "Diğer" }] },
      { id: "islem_tarihleri", label: "İşlem/Tapu Tarihleri", type: "textarea", required: false },
      { id: "muris_malik_bilgi", label: "Muris/Malik Bilgileri", type: "textarea", required: false },
    ],
  },
  izale_i_suyu: {
    label: "Ortaklığın Giderilmesi (İzale-i Şuyu)",
    fields: [
      { id: "tasinmaz_bilgileri", label: "Taşınmaz Bilgileri", type: "textarea", required: true },
      { id: "paydaslar", label: "Paydaşlar ve Pay Oranları", type: "textarea", required: true },
      { id: "aynen_taksim_mumkun", label: "Aynen Taksim Mümkün mü?", type: "select", required: false, options: [{ value: "evet", label: "Evet" }, { value: "hayir", label: "Hayır (Satış Yoluyla)" }] },
      { id: "kullanim_durumu", label: "Fiili Kullanım / İntifa", type: "textarea", required: false },
    ],
  },
  ecrimisil: {
    label: "Ecrimisil (İşgal Tazminatı)",
    fields: [
      { id: "tasinmaz_bilgileri", label: "Taşınmaz Bilgileri", type: "textarea", required: true },
      { id: "kullanim_baslangic", label: "Kullanım Başlangıcı", type: "date", required: true },
      { id: "kullanim_bitis", label: "Kullanım Bitişi", type: "date", required: false },
      { id: "emsal_kira", label: "Emsal Kira (TL)", type: "number", step: "0.01", required: false },
      { id: "yasaya_aykiri_nitelik", label: "Yasaya Aykırı Kullanım Niteliği", type: "textarea", required: false },
    ],
  },
  kamulastirmasiz_el_atma: {
    label: "Kamulaştırmasız El Atma",
    fields: [
      { id: "idare_adi", label: "İdare Adı", type: "text", required: true },
      { id: "tasinmaz_bilgileri", label: "Taşınmaz Bilgileri (Ada/Parsel)", type: "textarea", required: true },
      { id: "el_atma_tarihi", label: "El Atma Tarihi", type: "date", required: false },
      { id: "el_atma_sekli", label: "El Atma Şekli", type: "select", required: false, options: [{ value: "fiili", label: "Fiili Yol" }, { value: "hukuki", label: "Hukuki El Atma (İmar vb.)" }] },
      { id: "bedel_tespiti_emsal", label: "Bedel Tespiti / Emsaller", type: "textarea", required: false },
    ],
  },
  menfi_tespit: {
    label: "Menfi Tespit (Borcun Bulunmadığının Tespiti)",
    fields: [
      { id: "alacakli_unvan", label: "Alacaklı Unvan/Adı", type: "text", required: true },
      { id: "borclu_unvan", label: "Borçlu Unvan/Adı", type: "text", required: false },
      { id: "takip_dosyasi_no", label: "İcra Dosyası No", type: "text", required: false },
      { id: "icra_mudurlugu", label: "İcra Dairesi/Müdürlüğü", type: "text", required: false },
      { id: "borcun_sebebi", label: "Borcun Dayanağı", type: "textarea", required: true },
      { id: "ihtiyati_tedbir", label: "İhtiyati Tedbir Talebi", type: "select", required: false, options: [{ value: "evet", label: "Evet" }, { value: "hayir", label: "Hayır" }] },
    ],
  },
  itirazin_iptali: {
    label: "İtirazın İptali",
    fields: [
      { id: "icra_dosyasi_no", label: "İcra Dosyası No", type: "text", required: true },
      { id: "alacak_tutari", label: "Alacak Tutarı (TL)", type: "number", step: "0.01", required: true },
      { id: "alacak_kalemi", label: "Alacak Kalemleri", type: "textarea", required: false },
      { id: "sozlesme_turu", label: "Sözleşme/İlişki Türü", type: "text", required: false },
      { id: "faiz_talebi", label: "Faiz Talebi", type: "text", required: false },
      { id: "takip_tarihi", label: "Takip Tarihi", type: "date", required: false },
    ],
  },
  diger: {
    label: "Diğer (Listede Olmayan Dava)",
    fields: [
      { id: "diger_dava_turu", label: "Dava Türü", type: "text", required: true },
    ],
  },
  tespit_davasi: {
    label: "Tespit Davası",
    fields: [
      { id: "tespit_konusu", label: "Tespit Konusu", type: "text", required: true },
      { id: "hukuki_yarar", label: "Hukuki Yarar Gerekçesi", type: "textarea", required: true, placeholder: "Neden tespit hükmüne ihtiyaç var?" },
      { id: "delil_durumu", label: "Delil Durumu", type: "textarea", required: false },
    ],
  },
  tuketici: {
    label: "Tüketici Hukuku",
    fields: [
      { id: "alt_tur", label: "Alt Tür", type: "select", required: true, options: [{ value: "ayipli_mal_hizmet", label: "Ayıplı Mal/Hizmet – İade/Ayıp Oranı" }, { value: "mesafeli_satis", label: "Mesafeli Satış / Cayma Hakkı" }, { value: "abonelik_feshi_cezai_sart", label: "Abonelik Feshi / Cezai Şart (internet/enerji/telefon)" }, { value: "konut_on_odemeli_teslim_gecikme", label: "Konut Ön Ödemeli Satış / Teslimde Gecikme" }] },
      { id: "satici_unvan", label: "Satıcı/Servis Unvanı", type: "text", required: true },
      { id: "urun_hizmet", label: "Ürün/Hizmet", type: "text", required: true },
      { id: "bedel", label: "Bedel (TL)", type: "number", step: "0.01", required: false },
      { id: "fatura_tarihi", label: "Fatura/Alış Tarihi", type: "date", required: false },
      { id: "surec", label: "Başvuru/Servis Süreci", type: "textarea", required: false },
      { id: "ayip_orani", label: "Ayıp Oranı / Eksiklik", type: "text", required: false },
      { id: "cayma_hakki_kullanimi", label: "Cayma Hakkı Kullanımı", type: "textarea", required: false },
      { id: "abonelik_sozlesme_tarihi", label: "Abonelik Sözleşme Tarihi", type: "date", required: false },
      { id: "cezai_sart_miktari", label: "Cezai Şart Miktarı", type: "number", step: "0.01", required: false },
      { id: "teslim_tarihi_beklenen", label: "Beklenen Teslim Tarihi", type: "date", required: false },
    ],
  },
  nafaka_artirimi: {
    label: "Nafaka Artırımı/İndirimi",
    fields: [
      { id: "karar_bilgisi", label: "Önceki Karar/Protokol Bilgisi", type: "textarea", required: true },
      { id: "mevcut_nafaka", label: "Mevcut Nafaka (TL)", type: "number", step: "0.01", required: true },
      { id: "talep_edilen_nafaka", label: "Talep Edilen Nafaka (TL)", type: "number", step: "0.01", required: false },
      { id: "gelir_gider", label: "Gelir-Gider ve Koşul Değişikliği", type: "textarea", required: false, placeholder: "Tarafların gelir-gider değişikliği, ihtiyaçlar..." },
    ],
  },
  is_kazasi: {
    label: "İş Kazası / Meslek Hastalığı (Tazminat)",
    fields: [
      { id: "kaza_tarihi", label: "Olay Tarihi", type: "date", required: true },
      { id: "kaza_yeri", label: "Olay Yeri", type: "text", required: false },
      { id: "isveren_unvan", label: "İşveren", type: "text", required: true },
      { id: "kusur_durumu", label: "Kusur / İhmal İddiaları", type: "textarea", required: false },
      { id: "maluliyet_orani", label: "Maluliyet Oranı (%)", type: "number", step: "0.01", required: false },
      { id: "saglik_raporlari", label: "Sağlık Raporları / Tedavi", type: "textarea", required: false },
      { id: "maddi_manevi_talep", label: "Talep (Maddi/Manevi)", type: "textarea", required: true },
    ],
  },
  malpraktis: {
    label: "Hekim Hatası (Malpraktis)",
    fields: [
      { id: "saglik_kurumu", label: "Sağlık Kurumu / Hekim", type: "text", required: true },
      { id: "mudehale_tarihi", label: "Müdahale / Tedavi Tarihi", type: "date", required: false },
      { id: "aydinlatilmis_riza", label: "Aydınlatılmış Rıza Durumu", type: "textarea", required: false },
      { id: "hata_aciklamasi", label: "Hata / İhmal Açıklaması", type: "textarea", required: true },
      { id: "bilirkisi_raporu", label: "Rapor / Şikayet / İnceleme", type: "textarea", required: false },
      { id: "tazminat_talebi", label: "Talep (Maddi/Manevi)", type: "textarea", required: true },
    ],
  },
  sozlesmeye_aykirilik: {
    label: "Sözleşmeye Aykırılık (Satış/Eser/Vekâlet)",
    fields: [
      { id: "sozlesme_turu", label: "Sözleşme Türü", type: "select", required: true, options: [{ value: "satis", label: "Satış" }, { value: "eser", label: "Eser" }, { value: "vekalet", label: "Vekâlet" }] },
      { id: "sozlesme_tarihi", label: "Sözleşme Tarihi", type: "date", required: false },
      { id: "bedel", label: "Bedel (TL)", type: "number", step: "0.01", required: false },
      { id: "ayip_iddialari", label: "Ayıp / Aykırılık", type: "textarea", required: true },
      { id: "ifa_durumu", label: "İfa / Teslim Durumu", type: "textarea", required: false },
      { id: "ihtarlar", label: "İhtarlar / Yazışmalar", type: "textarea", required: false },
      { id: "tazminat_talebi", label: "Talep (Bedel/İndirim/İfa/İptal)", type: "textarea", required: true },
    ],
  },
  manevi_tazminat: {
    label: "Manevi Tazminat (Kişilik Haklarına Saldırı)",
    fields: [
      { id: "saldiri_turu", label: "Saldırı Türü", type: "select", required: true, options: [{ value: "hakaret", label: "Hakaret / İftira" }, { value: "haksiz_yayin", label: "Haksız Yayın" }, { value: "kisisel_veri", label: "Kişisel Verilerin İhlali" }, { value: "diger", label: "Diğer" }] },
      { id: "olay_ozet", label: "Olay Özeti", type: "textarea", required: true },
      { id: "deliller", label: "Deliller (Link/Dosya Açıklaması)", type: "textarea", required: false },
      { id: "manevi_talep", label: "Manevi Tazminat Talebi", type: "text", required: false },
    ],
  },
  veraset_ilami: {
    label: "Çekişmesiz: Veraset İlamı",
    fields: [
      { id: "muris_adi", label: "Muris Adı Soyadı", type: "text", required: true },
      { id: "olum_tarihi", label: "Ölüm Tarihi", type: "date", required: false },
      { id: "nufus_kaydi", label: "Nüfus Kayıt Bilgileri", type: "textarea", required: false },
      { id: "mirasci_listesi", label: "Bilinen Mirasçılar", type: "textarea", required: false },
    ],
  },
  isim_yas_tashihi: {
    label: "Çekişmesiz: İsim/Yaş Tashihi",
    fields: [
      { id: "duzeltilecek_bilgi", label: "Düzeltilecek Bilgi", type: "text", required: true },
      { id: "gerekce", label: "Gerekçe", type: "textarea", required: true },
      { id: "deliller", label: "Deliller", type: "textarea", required: false },
    ],
  },
  vesayet_kayyim: {
    label: "Çekişmesiz: Vesayet / Kayyım",
    fields: [
      { id: "kisi_bilgisi", label: "Vesayet Altına Alınacak Kişi", type: "text", required: true },
      { id: "gerekceler", label: "Gerekçeler / Sağlık Raporu", type: "textarea", required: false },
      { id: "talep", label: "Talep", type: "textarea", required: true },
    ],
  },
  delil_tespiti: {
    label: "Çekişmesiz: Delil Tespiti",
    fields: [
      { id: "tespit_konusu", label: "Tespit Konusu", type: "text", required: true },
      { id: "aciliyet", label: "Acil/Acil Değil", type: "select", required: false, options: [{ value: "acil", label: "Acil" }, { value: "normal", label: "Normal" }] },
      { id: "gerekce", label: "Gerekçe", type: "textarea", required: true },
    ],
  },
  erisim_engeli_5651: {
    label: "Çekişmesiz: Erişim Engeli / İçerik Kaldırma (5651)",
    fields: [
      { id: "url", label: "URL/Platform", type: "text", required: true },
      { id: "icerik_turu", label: "İçerik Türü", type: "select", required: false, options: [{ value: "haber", label: "Haber" }, { value: "sosyal_medya", label: "Sosyal Medya" }, { value: "forum", label: "Forum" }, { value: "diger", label: "Diğer" }] },
      { id: "ihlaller", label: "İhlal Edildiği İddia Edilen Haklar", type: "textarea", required: true },
      { id: "aciliyet", label: "Acil/Acil Değil", type: "select", required: false, options: [{ value: "acil", label: "Acil" }, { value: "normal", label: "Normal" }] },
    ],
  },
  kat_karsiligi_insaat: {
    label: "Kat Karşılığı İnşaat Sözleşmesi",
    fields: [
      { id: "arsa_sahibi", label: "Arsa Sahibi", type: "text", required: true },
      { id: "yuklenici", label: "Yüklenici", type: "text", required: true },
      { id: "sozlesme_tarihi", label: "Sözleşme Tarihi", type: "date", required: false },
      { id: "arsa_pay_orani", label: "Arsa Payı / Bağımsız Bölüm", type: "text", required: false },
      { id: "teslim_suresi", label: "Teslim Süresi / Tarihi", type: "text", required: false },
      { id: "iskan_durumu", label: "İskan / Ruhsat", type: "text", required: false },
      { id: "eksiklikler", label: "Eksiklik / Ayıplar", type: "textarea", required: false },
      { id: "cezai_sart", label: "Cezai Şart / Gecikme", type: "text", required: false },
    ],
  },
};