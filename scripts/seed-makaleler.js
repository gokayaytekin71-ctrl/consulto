// scripts/seed-makaleler.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// rawData bloğunuzu buraya yapıştırın:
const rawData = `
title,doi,link
"Hukuk Eğitiminde ""Hukuk Etiği""",10.33629/auhfd.1437311,https://doi.org/10.33629/auhfd.1437311
Hukuk Felsefesi Açısından Doğal Hukuk ve İstihsan,10.5281/zenodo.4028313,https://doi.org/10.5281/zenodo.4028313
Karşılaştırmalı Hukuk Araştırmalarında Yöntem,10.33433/maruhad.983705,https://doi.org/10.33433/maruhad.983705
Hukuk Üzerine,10.17828/yalovasosbil.359838,https://doi.org/10.17828/yalovasosbil.359838
Hukuk Devriminin Nedenleri,10.37879/belleten.1988.1003,https://doi.org/10.37879/belleten.1988.1003
"HUKUK KLİNİKLERİ: BEKLENTİLER, UYGULAMALAR VE KKTC HUKUK FAKÜLTELERİ AÇISINDAN OLANAKLAR",10.34246/ahbvuhfd.609106,https://doi.org/10.34246/ahbvuhfd.609106
Bilim ve Hukuk,10.33433/maruhad.607133,https://doi.org/10.33433/maruhad.607133
Hukuk Felsefesine Neden İhtiyacımız Var?,10.29224/insanveinsan.518261,https://doi.org/10.29224/insanveinsan.518261
"ESKİ HUKUK SİSTEMİNDEN YENİ HUKUK SİSTEMİNE GEÇİŞ SÜRECİ, NEDENLERİ VE TÜRK HUKUK DEVRİMİ",10.30561/sinopusd.478384,https://doi.org/10.30561/sinopusd.478384
Hukuk Felsefesi Öğretiminde Edebiyat Eserleri,10.33629/auhfd.1512700,https://doi.org/10.33629/auhfd.1512700
Bâbil Hukuk Kuralları ve Yahudilik,10.17050/kafkasilahiyat.865799,https://doi.org/10.17050/kafkasilahiyat.865799
HUKUK DEVLETİ VE TERÖR,10.1501/SBFder,https://doi.org/10.1501/SBFder
NIETZSCHE’NİN HUKUK ANLAYIŞI ÜZERİNE BİR İNCELEME,10.54704/akdhfd.1283311,https://doi.org/10.54704/akdhfd.1283311
KAMU HUKUKU – ÖZEL HUKUK AYRIMININ GEÇERSİZLİĞİ,10.32957/hacettepehdf.1384211,https://doi.org/10.32957/hacettepehdf.1384211
Hukuk Kültürü Suç Ve Kentsel Yağma,10.18493/kmusekad.95109,https://doi.org/10.18493/kmusekad.95109
Devletlerin İnsancıl Hukuk Kurallarının İhlâli Nedeniyle Sorumluluğu,10.15337/SUH.2017.1,https://doi.org/10.15337/SUH.2017.1
EKONOMİ VE HUKUK YAKLAŞIMI: COASE TEORİSİ,10.53881/hiad.1545454,https://doi.org/10.53881/hiad.1545454
"MERHAMET VE HUKUK ARASINDA: ""REİS BEY""",10.20493/birtop.905073,https://doi.org/10.20493/birtop.905073
BRIAN TAMANAHA: HUKUK TEORİLERİNİN “KAYIP KOLU” IŞIĞINDA HUKUK KAVRAMINI YENİDEN DÜŞÜNMEK,10.52273/sduhfd.906036,https://doi.org/10.52273/sduhfd.906036
Greko-Baktriya ve Eski Türk Hukuk Belgeleri,10.24155/tdk.2024.237,https://doi.org/10.24155/tdk.2024.237
Milletlerarası Ticari Tahkimde Tahkime Elverişliliğe Uygulanacak Hukuk,10.33433/maruhad.777630,https://doi.org/10.33433/maruhad.777630
Hukuk-Ahlak İlişkisi Bağlamında Türk Hukukunda Kumar,10.15337/suhfd.857934,https://doi.org/10.15337/suhfd.857934
Bağdat Hukuk Mektebi,10.54600/igdirsosbilder.1308337,https://doi.org/10.54600/igdirsosbilder.1308337
HUKUK TEORİLERİNİ BİRER “NAYA” OLARAK GÖRMEK Jainizmin Üç Önemli Öğretisi İle Hukuk Teorisini Bir Araya Getirmek,10.33717/deuhfd.1375533,https://doi.org/10.33717/deuhfd.1375533
MODERN TOPLUMDA HUKUK DEVLETİ: SİYASAL MEŞRULAŞTIRMA ARACI,10.33717/deuhfd.897869,https://doi.org/10.33717/deuhfd.897869
Evrensel Hukuk İlkeleri Bağlamında Franz Kafka’nın Dava’sı,10.31465/eeder.1516410,https://doi.org/10.31465/eeder.1516410
"İslam Hukuk Felsefesi: Kaynaklar, Yöntemler, Amaçlar, Allâl el-Fâsî",10.17335/sakaifd.261089,https://doi.org/10.17335/sakaifd.261089
HUKUK TEORİLERİNDE YARGI VE HUKUK UYGULAYICISI FETİŞİZMİ,10.33717/deuhfd.644280,https://doi.org/10.33717/deuhfd.644280
İKTİSAT VE HUKUK İLİŞKİSİ ÇERÇEVESİNDE GREV HAKKI VE ENGELLEMELERİNİN DEĞERLENDİRİLMESİ,10.53881/hiad.1310555,https://doi.org/10.53881/hiad.1310555
Hukuk Mukayesesi,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Sinema ve Hukuk Bir Tür Olarak Hukuk Filmleri,10.21492/inuhfd.239989,https://doi.org/10.21492/inuhfd.239989
SUMER TOPLUMUNDA HUKUK,10.30794/pausbed.1559457,https://doi.org/10.30794/pausbed.1559457
Hacettepe HFD,10.32957/hacettepehdf.947172,https://doi.org/10.32957/hacettepehdf.947172
/ Trans,10.30517/cihannuma.441646,https://doi.org/10.30517/cihannuma.441646
KİTAP İNCELEMESİ HUKUK DEVLETİNİN SONU OLAĞANÜSTÜ HALDEN DİKTATÖRLÜĞE TERÖRLE MÜCADELE,10.32957/hacettepehdf.871113,https://doi.org/10.32957/hacettepehdf.871113
MARKSİZM VE HUKUK BAĞLAMINDA PAŠUKANİS VE META/ÖZNE İLİŞKİSİ,10.38004/sobad.567182,https://doi.org/10.38004/sobad.567182
HUKUKU GÖRSELLEŞTİRMEK: HUKUK TASARIMI,10.47136/asbuhfd.1267562,https://doi.org/10.47136/asbuhfd.1267562
HUKUK KAVRAMININ ANALİZİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
ORTAOKULLARDA OKUTULAN “HUKUK VE ADALET” DERSİNİN ÖĞRENCİLER ÜZERİNDE HUKUKA YÖNELİK DUYUŞSAL EĞİLİMLER ALGISINA ETKİSİ,10.21085/jemsos.30742,https://doi.org/10.21085/jemsos.30742
ULUSLARARASI HUKUK AÇISINDAN MÜTAREKE KAVRAMI VE MONDROS MÜTAREKESİ,10.33692/avrasyad.1133034,https://doi.org/10.33692/avrasyad.1133034
Milletlerarası Tahkimde Esasa Uygulanacak Hukuk,10.15337/SUH.2017.25,https://doi.org/10.15337/SUH.2017.25
İLETİŞİM SÜRECİ VE ORTAK ANLAM ORTAMI OLARAK HUKUK,10.33717/deuhfd.998163,https://doi.org/10.33717/deuhfd.998163
Hukuk politika ilişkisi bakımından eleştirel Hukuk Çalışmaları hareketi,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
İNSAN HAKLARI TEMELLİ HUKUK KLİNİĞİ MODELİ: YASAMA KLİNİĞİ UYGULAMASI,10.32957/hacettepehdf.679592,https://doi.org/10.32957/hacettepehdf.679592
Disiplinlerarası bir çalışma alanı olarak edebiyat ve hukuk ilişkisi,10.30767/diledeara.1533445,https://doi.org/10.30767/diledeara.1533445
BİR ULUSLARARASI HUKUK SORUNU OLARAK YABANCI KAMU HUKUKUNUN UYGULANMASI,10.18221/bujss.42415,https://doi.org/10.18221/bujss.42415
M,10.37879/ttkbelleten.1169516,https://doi.org/10.37879/ttkbelleten.1169516
Marksizm’in Uluslararası Hukuk Yaklaşımı,10.37093/ijsi.972298,https://doi.org/10.37093/ijsi.972298
MODERN YARGILAMA SÜREÇLERİ BAKIMINDAN HUKUK VE OYUN İLİŞKİSİNE BİR BAKIŞ,10.15337/suhfd.1515340,https://doi.org/10.15337/suhfd.1515340
"Türkiye’de Hukuk Eğitimi, Mevzuat ve Uygulamada Toplumsal Cinsiyete Duyarlılık",10.33433/maruhad.1016933,https://doi.org/10.33433/maruhad.1016933
Osmanlı’nın Son Yüzyılında Hukuk Düşüncesinin Dönüşümü ve Dönemin Başlıca Tartışma Konuları,10.15337/suhfd.428157,https://doi.org/10.15337/suhfd.428157
"MEMLÜKLERDE MEZÂLİM MAHKEMELERİ, HUKUK VE ADLİYE TEŞKİLÂTI",10.30622/tarr.344872,https://doi.org/10.30622/tarr.344872
Türkiye’nin Dış Politika Krizlerinde Ahdi Hukuk: Kıbrıs ve Nahçıvan Krizleri,10.12995/bilig.526759,https://doi.org/10.12995/bilig.526759
ÇOCUK HAKLARI BİLDİRİSİ VE TÜRK HUKUK SİSTEMİ,10.1501/Egifak,https://doi.org/10.1501/Egifak
"BİLGİ, İKTİDAR VE HUKUK",10.21492/inuhfd.290615,https://doi.org/10.21492/inuhfd.290615
Uygurlarda Hukuk ve Maliye Istılahları,10.18345/tm.82991,https://doi.org/10.18345/tm.82991
Uluslararası Hukuk Politikaları,10.32739/uskudarsbd.1.1.2,https://doi.org/10.32739/uskudarsbd.1.1.2
Osmanlı’da Fıkıh ve Hukuk,10.17335/sakaifd.337314,https://doi.org/10.17335/sakaifd.337314
Özel Hukuk Sözleşmelerinin Anonim Şirketlerde Kanuni Temsilcilerin Vergisel Sorumluluğuna Etkisi,10.59399/cuhad.1167425,https://doi.org/10.59399/cuhad.1167425
ULUSLARARASI HUKUK ANLAŞMALARININ GEÇİCİ UYGULANMASI,10.18771/mdergi.757312,https://doi.org/10.18771/mdergi.757312
TÜRKİYE’DE KAMU DENETÇİLİĞİ KURUMU İLE HUKUK DEVLETİ İLKESİ ARASINDAKİ İLİŞKİ,10.38004/sobad.1185918,https://doi.org/10.38004/sobad.1185918
Yargıtay 15,10.15337/SUHFD.2017.173,https://doi.org/10.15337/SUHFD.2017.173
YAPAY ZEKÂNIN VERDİĞİ ZARARDAN DOĞAN SÖZLEŞME DIŞI SORUMLULUĞA UYGULANACAK HUKUK,10.18771/mdergi.757376,https://doi.org/10.18771/mdergi.757376
KARŞILAŞTIRMALI HUKUK PERSPEKTİFİNDEN BABALIK KARİNESİ,10.57083/adaletdergisi.1285740,https://doi.org/10.57083/adaletdergisi.1285740
ESKİ UYGUR HUKUK VESİKALARINDA AD + (YARDIMCI) FİİLDEN OLUŞAN BİRLEŞİK FİİLLER,10.7884/teke.5628,https://doi.org/10.7884/teke.5628
Educational Administrators’ Education in Law,10.1501/Egifak,https://doi.org/10.1501/Egifak
TÜRK HUKUK SİSTEMİNDE ÇOCUK İSTİSMARI VE İHMALİ,10.1501/Egifak,https://doi.org/10.1501/Egifak
ESKİ UYGUR HUKUK BELGELERİNDE GEÇEN ONLUK YÜZLÜK SÖZCÜKLERİ ÜZERİNE,10.21563/sutad.855781,https://doi.org/10.21563/sutad.855781
Kant’ta Barışın Hukuk Zemininde Kurgulanması,10.22466/acusbd.263586,https://doi.org/10.22466/acusbd.263586
HUKUK VE KALKINMA İLİŞKİSİ AÇISINDAN ARAÇSALLAŞTIRILMIŞ YASAMA FAALİYETİ,10.33717/deuhfd.1276247,https://doi.org/10.33717/deuhfd.1276247
Hukuk Devleti İlkesi Bağlamında Takdir Yetkisi ve Yerindelik Denetimi İlişkisi,10.15337/suhfd.364591,https://doi.org/10.15337/suhfd.364591
Silahlandırılmış Yapay Zekâ Otonom Silah Sistemleri ve Uluslararası Hukuk,10.52273/sduhfd.1459877,https://doi.org/10.52273/sduhfd.1459877
TÜRK HUKUK TARİHİ AÇISINDAN İSLÂM HUKUKUNDA KIYMETLİ EVRAK,10.57083/adaletdergisi.1391697,https://doi.org/10.57083/adaletdergisi.1391697
Sivil İtaatsizlik ve Hukuk,10.36484/liberal.884264,https://doi.org/10.36484/liberal.884264
BOLU LİVASINDA KURULAN MÜDAFAA-I HUKÛK CEMİYETLERİ VE FAALİYETLERİ,10.1501/Tite,https://doi.org/10.1501/Tite
Hukuk Devleti Kavramı,10.1501/SBFder,https://doi.org/10.1501/SBFder
YAPAY ZEKÂNIN HUKUK SİSTEMİNDE KULLANILMASI,10.55009/bilisimhukukudergisi.1476857,https://doi.org/10.55009/bilisimhukukudergisi.1476857
HUKUK İLMİ VE SOSYOLOJİ I HUKUK KAVAİDÎ VE HUKUK ÎLMl,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
HEGEL’İN ULUSLARARASI HUKUK FELSEFESİ,10.37093/ijsi.837729,https://doi.org/10.37093/ijsi.837729
Hukuk Sosyolojisindeki Temel Yaklaşımlar,10.21492/inuhfd.239823,https://doi.org/10.21492/inuhfd.239823
Ceza Verilmesine Yer Olmadığı Kararının Medeni Hukuk Yargılamasına Etkisi,10.5281/zenodo.4958417,https://doi.org/10.5281/zenodo.4958417
Marksizm ve Hukuk,10.1501/SBFder,https://doi.org/10.1501/SBFder
"""Demokrasi-Hukuk-Otorite""",10.1501/SBFder,https://doi.org/10.1501/SBFder
Hukuk Tekniğinin Kudreti,10.1501/SBFder,https://doi.org/10.1501/SBFder
BENİM HUKUK FELSEFEM,10.1501/SBFder,https://doi.org/10.1501/SBFder
Sosyal Bilgilerde Hukuk Okuryazarlığı: Sistematik Literatür Taraması,10.48067/ijal.1182756,https://doi.org/10.48067/ijal.1182756
Düstûr I,10.29000/rumelide.1346214,https://doi.org/10.29000/rumelide.1346214
Yapay Zekada Hukuk İhlalleri,10.51404/metazihin.1269258,https://doi.org/10.51404/metazihin.1269258
İdarenin Esnek Hukuk İşlemlerinin Yargısal Denetime Konu Edilmesi: Fransız Hukuku Odaklı İnceleme,10.33433/maruhad.502912,https://doi.org/10.33433/maruhad.502912
TÜKETİCİ HAKLARI VE ESNAF DENETİMİ -HUKUK TARİHİMİZDEN ÖRNEKLER-,10.21054/deuifd.1051886,https://doi.org/10.21054/deuifd.1051886
TÜRK HUKUK TARÎHtNDE AZINLIKLAR,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
HUKUK SOSYOLOJİSİNİN KURURUCULARI,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
THE PRIVATE/PUBLIC LAW DIVIDE IN DIGITAL LAW,10.55009/bilisimhukukudergisi.1289617,https://doi.org/10.55009/bilisimhukukudergisi.1289617
ÇOCUK HAKLARI BEYANNAMESİ İLKELERİNİN TÜRK HUKUK SİSTEMİNE ETKİSİ,10.1501/Egifak,https://doi.org/10.1501/Egifak
Foucault’nun İktidar Sorunsallaştırmasında Hukuk ve Haklar,10.18026/cbayarsos.1339116,https://doi.org/10.18026/cbayarsos.1339116
Karşılaştırmalı Hukukta ve Türk Hukukunda hukuk eğitimi ve hukuk kliniği,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
HUKUK DEVLETİ İLKESİ IŞIĞINDA İDARENİN DENETİMİ VE KAMU DENETÇİLİĞİ KURUMU,10.32002/ombudsmanakademik.438220,https://doi.org/10.32002/ombudsmanakademik.438220
Cumhuriyette Hukuk İnkılabı,10.37879/ttkbelleten.1428488,https://doi.org/10.37879/ttkbelleten.1428488
SAVCILARIN HUKUK DAVALARINDAKI GÖREVLERİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Hukuk Eğitiminde Reform,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
İSVİÇRE’DE HUKUK ÖĞRETİMİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Hukuk Felsefesi Konferansları,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Olay bilimleri ve Hukuk,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Kadınlar Dünyâsı Çerçevesinde Hukûk-ı Nisvân’ın Alımlanmasına Bakış,10.51533/insanbilimleri.1594855,https://doi.org/10.51533/insanbilimleri.1594855
Hukukun Öncü Kadınları: Türkiye’de Kadınların Hukuk Mesleğine Girişi Üzerine Bir İnceleme,10.46655/federgi.579165,https://doi.org/10.46655/federgi.579165
Ronald Dworkin’in Uluslararası Hukuk Teorisi,10.33432/ybuhukuk.1425641,https://doi.org/10.33432/ybuhukuk.1425641
Uluslararası Hukuk – Ulusal Hukuk İlişkileriThe Relationships between the National Law and the International Law,10.19168/jyu.54311,https://doi.org/10.19168/jyu.54311
"İSAM Konuşmaları: Osmanlı Düşüncesi, Ahlâk, Hukuk, Felsefe, Kelâm",10.18589/oa.582827,https://doi.org/10.18589/oa.582827
İNSAN TİCARETİYLE MÜCADELE VE ULUSLARARASI HUKUK: KUZEY KIBRIS TÜRK CUMHURİYETİ ÖRNEĞİNİ DE İÇEREN BİR İNCELEME,10.33717/deuhfd.800893,https://doi.org/10.33717/deuhfd.800893
İSLAM HUKUKU YASAMA FAALİYETİ BAĞLAMINDA HUKUK-I AİLE KARARNAMESİ’NİN DEĞERLENDİRİLMESİ,10.47136/asbuhfd.1038558,https://doi.org/10.47136/asbuhfd.1038558
Yumuşak Hukuk Tartışmaları Çerçevesinde BM İş Dünyası ve İnsan Hakları Rehber İlkeleri’nin Değerlendirilmesi,10.33433/maruhad.994733,https://doi.org/10.33433/maruhad.994733
Yurt Dışına Götürülen İşçilerin İş Sözleşmelerine Uygulanacak Hukuk Konusuna İnterdisipliner Bir Yaklaşım,10.33629/auhfd.1458156,https://doi.org/10.33629/auhfd.1458156
ADALET VE HUKUK DEVLETİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
HUKUK SOSYOLOJİSİNİN MÜBEŞŞIRLERİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Hukuk Ortamında Hibrit Tehdit Uygulamaları: Çatışma Aracı Olarak Hukuk Uygulamalarının Bir Tipolojisi,10.17752/guvenlikstrtj.1258155,https://doi.org/10.17752/guvenlikstrtj.1258155
İSLAM HUKUK TARİHİNDE SELEFİ SÖYLEM HANBELİ MEZHEBİ,10.17335/suifd.93845,https://doi.org/10.17335/suifd.93845
STRATEJİK DAVALAMA VE İNSAN HAKLARI SAVUNUCULUĞU İÇİN BİR MODEL OLARAK HUKUK KLİNİĞİ EĞiTİMİ,10.30915/abd.931372,https://doi.org/10.30915/abd.931372
TÜRK HUKUK TARÎHtNDE AZINLIKLAR,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
JAPONYA’DA HUKUK DEVLETİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
MUKAYESELİ HUKUK TARİHÎ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
MAHKEME İÇTİHATLARI (Hususi hukuk),10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Kavram Bilimleri ve Hukuk,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
"Cinsellik, Şiddet ve Hukuk: Feminist Yazılar Üzerine",10.1501/Fe0001,https://doi.org/10.1501/Fe0001
Hukukun Ekolojisi: Doğa ve Toplumla Uyumlu Bir Hukuk Sistemine Doğru,10.1501/SBFder,https://doi.org/10.1501/SBFder
"Toplumsal Cinsiyet, Savaş ve Hukuk: Kongo Demokratik Cumhuriyeti’nde Cinsel Şiddet Suçları",10.46655/federgi.946936,https://doi.org/10.46655/federgi.946936
Fıkıh ve Hukuk Terimleri ve Kavramları Üzerine,10.34246/ahbvuhfd.1402461,https://doi.org/10.34246/ahbvuhfd.1402461
Anarko-Bireyci Bir Doğal Hukuk Yorumu: Lysander Spooner ve Hukuk Teorisi,10.26650/mecmua.2023.81.2.0007,https://doi.org/10.26650/mecmua.2023.81.2.0007
İslam Hukukunun Uygulanacak Hukuk Olarak Seçilmesi ve İngiliz Yüksek Mahkemesinin Shamil Bank of Bahrain v,10.33433/maruhad.928937,https://doi.org/10.33433/maruhad.928937
Aksanlı Sinemanın İzleklerinden Hukuk Mücadelesi ve Adalet Arayışına Keskin Bir Manevra: Paramparça Filmi Üzerine Alımlama Çalışması,10.31123/akil.780445,https://doi.org/10.31123/akil.780445
ESKİ HUKUK SİSTEMLERİNDE KÖLELİK,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
İNGİLİZ HUKUK SİSTEMİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Türkiye’de Öğrenim Gören Sosyal Bilgiler Öğretmen Adaylarının Hukuk Okuryazarlık Düzeylerinin Belirlenmesi,10.31592/aeusbed.834389,https://doi.org/10.31592/aeusbed.834389
Milletlerarası Ticari Sözleşmelerde Hukuk Seçimine Dair Lahey İlkeleri Uyarınca Örtülü Hukuk Seçimi,10.56701/shd.1190810,https://doi.org/10.56701/shd.1190810
HUKUK MAHKEMESİ KARARLARININ İDARE MAHKEMESİNDE GÖRÜLEN UYUŞMAZLIKLARA ETKİSİ HAKKINDA BİR İNCELEME,10.57083/adaletdergisi.1484034,https://doi.org/10.57083/adaletdergisi.1484034
ULUSLARARASI HUKUK SAVAŞ HALİNDE: TRUMP YÖNETİMİNİN ULUSLARARASI HUKUK YAKLAŞIMI ÜZERİNE BİR İNCELEME,10.21492/inuhfd.795535,https://doi.org/10.21492/inuhfd.795535
MEKTEB-İ HUKUK’TA TANZİMAT FERMANI’NI ANLATMAK: KEMALPAŞAZÂDE SAİD’İN HUKUK-I SİYASİYE-İ OSMANİYE DERS KİTABI,10.35239/tariharastirmalari.722573,https://doi.org/10.35239/tariharastirmalari.722573
UFCED,10.55036/ufced.1477008,https://doi.org/10.55036/ufced.1477008
KAHRAMANMARAŞ DEPREMLERİ ARDINDAN YAŞANAN OHAL VE OHAL CBK’LERİNİN HUKUK DEVLETİ İLKESİ ÇERÇEVESİNDE BİR ANALİZİ,10.56524/msydergi.1541832,https://doi.org/10.56524/msydergi.1541832
TÜRK ÖZEL HUKUK YARGI SİSTEMİNDE YEMİN MÜESSESESİ,10.20978/ijlp.72265,https://doi.org/10.20978/ijlp.72265
Jeremy Waldron ve Prosedürel Hukuk Devleti Anlayışı,10.26650/mecmua.2021.79.4.0006,https://doi.org/10.26650/mecmua.2021.79.4.0006
The Mobility of Legal Education in the Tanzimat Period and Mekteb-i Hukuk-ı Şahane,10.53047/josse.1339957,https://doi.org/10.53047/josse.1339957
HUKUK VE MUHASEBE AÇISINDAN TEMİNAT MEKTUPLARI,10.14783/maruoneri.680740,https://doi.org/10.14783/maruoneri.680740
MİLLETLERARASI TİCARİ SÖZLEŞMELERDE HUKUK SEÇİMİNE İLİŞKİN GENEL İŞLEM ŞARTLARININ ÇATIŞMASI VE LAHEY İLKELERİ,10.18771/mdergi.437316,https://doi.org/10.18771/mdergi.437316
HEGEL’İN HUKUK FELSEFESİNDE ÖZGÜRLÜK VE KODİFİKASYON,10.54049/taad.1683771,https://doi.org/10.54049/taad.1683771
FÂRÂBÎ’DE HUKUK FELSEFESİNİN TEMELLERİ,10.61304/did.383205,https://doi.org/10.61304/did.383205
HİPPİAS’IN DOĞAL HUKUK FİKRİNDEN KANT’IN EBEDİ BARIŞ FİKRİNE,10.52122/nisantasisbd.1275379,https://doi.org/10.52122/nisantasisbd.1275379
MARTTİ KOSKENNİEMİ’NİN ULUSLARARASI HUKUK TEORİSİNİN ANALİZİ,10.58375/sde.1475522,https://doi.org/10.58375/sde.1475522
Hukuk Devleti İlkesi ve Âdil Yargılanma Hakkı Çerçevesinde Kamu İhale İşlemlerinde İdarî Başvuru Yolları,10.15337/SUH.2017.21,https://doi.org/10.15337/SUH.2017.21
Memur ve Hukuk Danışmanı Olarak Franz Kafka,10.29110/soylemdergi.1487769,https://doi.org/10.29110/soylemdergi.1487769
Türk Ticaret Kanunu Kapsamında Hâkimiyet Sözleşmesinden Doğan Sorumluluğa Uygulanacak Hukuk ve Türk Mahkemelerinin Milletlerarası Yetkisi,10.33433/maruhad.1221986,https://doi.org/10.33433/maruhad.1221986
AVRUPA BİRLİĞİ VE TÜRK HUKUKU DÜZENLEMELERİNDE TAŞIMA İŞLERİ KOMİSYONCULUĞU SÖZLEŞMESİNE UYGULANACAK HUKUK,10.32957/hacettepehdf.1126895,https://doi.org/10.32957/hacettepehdf.1126895
FLORANSA AVRUPA ÜNİVERSİTE ENSTİTÜSÜ AVRUPA HUKUK AKADEMİSİ,10.29228/mjes.391,https://doi.org/10.29228/mjes.391
Murray N,10.33433/maruhad.1553979,https://doi.org/10.33433/maruhad.1553979
Hukuk Alanındaki Hizmetlerde Kullanılan Teknolojik Olanaklar (Legaltech) ve Avukatlık Mesleğine Olası Etkileri,10.33629/auhfd.1475078,https://doi.org/10.33629/auhfd.1475078
DOĞAL AFETLER VE ULUSLARARASI HUKUK: AFET DURUMUNDA KİŞİLERİN KORUNMASINA İLİŞKİN TASLAK MADDELER VE İNSAN HAKLARI,10.30915/abd.1380914,https://doi.org/10.30915/abd.1380914
Küresel Vergi Yönetimi: Yeni Ortak Hukuk,10.25272/j.2147-7035.2017.5.5.04,https://doi.org/10.25272/j.2147-7035.2017.5.5.04
Yurt Dışı Hizmet Akitlerinde Uygulanacak Hukuk,10.26650/ppil.2023.43.1280362,https://doi.org/10.26650/ppil.2023.43.1280362
Uluslararası Hukuk Kaynakları Çerçevesinde İş Hukukunda Cinsiyet Ayrımcılığı,10.33629/auhfd.1165650,https://doi.org/10.33629/auhfd.1165650
Theories of Interpretation: Islamic Law v,10.33432/ybuhukuk.1370362,https://doi.org/10.33432/ybuhukuk.1370362
Çocuk Emeği Kullanımından Kaynaklanan Sosyal Hukuk Sorunları,10.26650/jspc.2021.81.907130,https://doi.org/10.26650/jspc.2021.81.907130
Medyada Filistin İşgali ve Uluslararası İnsancıl Hukuk,10.37679/trta.1401913,https://doi.org/10.37679/trta.1401913
Natural law perspective underlying The Republic of Türkiye,10.31795/baunsobed.1351433,https://doi.org/10.31795/baunsobed.1351433
HUKUK DİLİNDE HARP ESİRLERİ,10.1501/Tite,https://doi.org/10.1501/Tite
Demir A,10.1501/SBFder,https://doi.org/10.1501/SBFder
Hukuk ve Siyaset ; Tarafsızlık,10.1501/SBFder,https://doi.org/10.1501/SBFder
"HUKUK VE RİTÜEL: TARİHSEL, TOPLUMSAL VE POLİTİK PERSPEKTİFLERDEN HUKUKUN RİTÜEL VE SEMBOLLER ÜZERİNDEN ANLAMLANDIRILMASI",10.32957/hacettepehdf.1558376,https://doi.org/10.32957/hacettepehdf.1558376
"Avrupa Bütünleşmesi Sürecinde: Hukuk, Devlet Ve Egemenlik Tartışmaları",10.17828/yasbed.02813,https://doi.org/10.17828/yasbed.02813
ULUSLARARASI CEZA MAHKEMESİ VE UYGULANABİLİR HUKUK,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Eski Uygur Türkçesi Hukuk Belgeleri,10.26650/TUDED2023-1273603,https://doi.org/10.26650/TUDED2023-1273603
ANAYASA VE ÖZEL HUKUK İLİŞKİLERİ BAĞLAMINDA TİCARİ NİTELİKLİ MÜLKİYET HAKKININ KORUNMASI,10.54704/akdhfd.1094249,https://doi.org/10.54704/akdhfd.1094249
Türkiye ve Kuzey Makedonya Cumhuriyeti’nde Hukuk Uyuşmazlıklarında Arabuluculuk Kurumunun Avrupa Birliği Politikaları Bağlamında Karşılaştırılması,10.59831/ihuhfd.2024.25,https://doi.org/10.59831/ihuhfd.2024.25
SOSYAL GÜVENLİK HUKUKUNDA İŞ KAZASI KAVRAMI: KITA AVRUPASI VE ANGLOSAKSON HUKUK İSTEMLERİNDEN BİRER ÖRNEK İLE TÜRK HUKUKU KARŞILAŞTIRMASI,10.21441/sguz.2017.52,https://doi.org/10.21441/sguz.2017.52
TÜRK JANDARMA TEŞKİLATI’NDA HUKUK EĞİTİMİNİN TARİHSEL GELİŞİMİ,10.33419/aamd.1301721,https://doi.org/10.33419/aamd.1301721
ADİL YARGILANMA HAKKI VE HUKUK DEVLETİ IŞIĞINDA “ŞİDDETE UĞRAMIŞ KADIN SENDROMU” ÜZERİNE BİR İNCELEME,10.54704/akdhfd.1059882,https://doi.org/10.54704/akdhfd.1059882
YABANCILIK UNSURU TAŞIYAN İŞ SÖZLEŞMELERİNE UYGULANACAK HUKUK,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Deniz Seviyesinin Yükselmesinin Uluslararası Hukuk Bakımından Etkileri ve BM Uluslararası Hukuk Komisyonunun Çalışmaları,10.15337/suhfd.1263123,https://doi.org/10.15337/suhfd.1263123
AUTONOMOUS WEAPON SYSTEMS UNDER INTERNATIONAL LAW,10.28956/gbd.1078155,https://doi.org/10.28956/gbd.1078155
CAS TEMYİZ YARGILAMASINDA UYGULANACAK HUKUK,10.54049/taad.1418499,https://doi.org/10.54049/taad.1418499
YAPISALCILIK-HUKUK İLİŞKİLERİ ÜZERİNE DENEME,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
MUKAYESELİ HUKUK I,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Feminist İdeoloji Ve Söylem Karşısında Hukuk,10.56493/nkusbmyo.1061269,https://doi.org/10.56493/nkusbmyo.1061269
TARİHSEL BAKIŞ AÇISIYLA KIBRIS TÜRK HUKUK SİSTEMİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Student Participation in Education in Law Faculties: A Comparative Study,10.26466/opusjsr.1633930,https://doi.org/10.26466/opusjsr.1633930
UYGUR HUKUK VESİKALARI ÜZERİNE TÜRKÇE LİTERATÜRÜN HUKUKİ TAHLİLİ,10.57083/adaletdergisi.1217783,https://doi.org/10.57083/adaletdergisi.1217783
"Sınıf Egemenliği, Hukuk ve Sovyet Hukuku",10.54699/andhd.1460051,https://doi.org/10.54699/andhd.1460051
Uzay Hukuku ve Uluslararası İnsancıl Hukuk İlişkisi,10.26650/mecmua.2020.78.4.0012,https://doi.org/10.26650/mecmua.2020.78.4.0012
YABANCILIK UNSURU İÇEREN RESMÎ VASİYETNAMELERE UYGULANACAK HUKUK,10.54049/taad.1055696,https://doi.org/10.54049/taad.1055696
"Tabiî Hukuk mu, Yoksa Sezgiye dayanan Müsbet Hukuk mu?",10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Orman Mühendisliğinde hukuk bilgisinin meslek hayatına etkisi,10.53516/ajfr.1011904,https://doi.org/10.53516/ajfr.1011904
HUKUK TARİHİ AÇISINDAN KALEBEND DEFTERLERİ,10.54049/taad.1231761,https://doi.org/10.54049/taad.1231761
Muhammed Hamidullah ve İslâm Hukuk İlmine Katkıları,10.47145/dinbil.1200607,https://doi.org/10.47145/dinbil.1200607
Mâtürîdî’de Ahlaki Mükellefiyet ve Tabiî Hukuk,10.18317/kaderdergi.1468241,https://doi.org/10.18317/kaderdergi.1468241
SÜREKLİLİK VEYA ULUSLARARASI HUKUK KİŞİLİĞİNİN KİMLİĞİ,10.55773/tda.1126073,https://doi.org/10.55773/tda.1126073
"""Marksizm ve Hukuk"" Yazın İncelemesi",10.1501/SBFder,https://doi.org/10.1501/SBFder
Demokratik Hukuk Devleti ve Anayasa,10.1501/SBFder,https://doi.org/10.1501/SBFder
2018 ORTAOKUL ÖĞRETİM PROGRAMLARININ HUKUK OKURYAZARLIĞI AÇISINDAN İNCELENMESİ,10.29299/kefad.2019.20.02.012,https://doi.org/10.29299/kefad.2019.20.02.012
YABANCI UNSURLU INFLUENCER SÖZLEŞMESİNE UYGULANACAK HUKUK,10.33717/deuhfd.1495704,https://doi.org/10.33717/deuhfd.1495704
Osmanlı hukuk sisteminde adli yardım kurumu,10.1501/OTAM,https://doi.org/10.1501/OTAM
"ZERDÜŞTÇÜLÜK, ZERDÜŞT VE HUKUK (AVESTA)",10.1501/Hukfak,https://doi.org/10.1501/Hukfak
HUKUK SOSYOLOJİSİ AÇISINDAN İBNİ HALDUN,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
HUKUK SOSYOLOJİSİNİN KONUSU VE PROBLEMLERİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Ahlak ve hukuk arasında sıkışan kürtaj,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
"Uluslararası Hukuk, Sömürgecilik ve İlksel Birikim",10.47899/ijss.1573464,https://doi.org/10.47899/ijss.1573464
"TÜRKİYE’DE HUKUK EĞİTİMİ: ÇÖZÜM ARAYIŞLARI, SORUNLAR VE ÖNERİLER",10.26791/sarkiat.879188,https://doi.org/10.26791/sarkiat.879188
Uluslararası Hukuk ve İnsan Hakları Açısından Keşmir’in Hindistan’dan ‘Ayrılma Hakkı’,10.52539/mad.790035,https://doi.org/10.52539/mad.790035
2018 ORTAOKUL ÖĞRETİM PROGRAMLARININ HUKUK OKURYAZARLIĞI AÇISINDAN İNCELENMESİ,10.29299/kefad.2019.20.02.012,https://doi.org/10.29299/kefad.2019.20.02.012
ATATÜRK’ÜN HUKUK VE LAİKLİK ANLAYIŞI,10.1501/SBFder,https://doi.org/10.1501/SBFder
Hukuk Patolojisi Müzesi ; Türeci Hadisesi,10.1501/SBFder,https://doi.org/10.1501/SBFder
ARTHUR SCHOPENHAUER’IN HUKUK VE CEZA ADALETİ ANLAYIŞI,10.21492/inuhfd.868992,https://doi.org/10.21492/inuhfd.868992
TABİİ HUKUK DOKTİRİNİN EPİSTEMOLOJİK TAHLİLİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
DEMOKRATİK SOSYAL HUKUK DEVLETİNDE VERGİLENDİRME,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
HUKUK ÖĞRETİMİ BAKIMINDAN ROMA HUKUKU,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Tabii hukuk ve hukukî pozitivizm,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Genel Hukuk Teorisi ve Maksizm,10.1501/SBFder,https://doi.org/10.1501/SBFder
Hukuk Sosyolojisi ve Türkiye’deki Geleceği,10.1501/SBFder,https://doi.org/10.1501/SBFder
Milletlerarası Hukuk Komisyonunun Çalışmaları,10.1501/SBFder,https://doi.org/10.1501/SBFder
Türkiye’de Hukuk Devleti Anlayışı,10.1501/SBFder,https://doi.org/10.1501/SBFder
HUKUK EĞİTİMİNDEKİ SON GELİŞMELER VE KARŞILAŞTIRMALI HUKUKUN HUKUK EĞİTİMİNDEKİ ROLÜ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Hukuk Savaşımının Kavramsal Çerçevesi ve Uygulamaları Üzerine Bir İnceleme,10.17752/guvenlikstrtj.1394945,https://doi.org/10.17752/guvenlikstrtj.1394945
SOSYALİSr AVRUPA ÜLKELERİNDE HUKUK YARGILAMASI,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Hukuk Usulünde ALEYHE BOZMA YASAĞI,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
DİFERANSIEL VE JENETİK HUKUK SOSYOLOJİSİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Temyiz Mahkemesi İkinci Hukuk Dairesi,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
SİSTEMATİK HUKUK SOSYOLOJİSİ (HUKUKUN MÎKROSOSYOLOJISİ),10.1501/Hukfak,https://doi.org/10.1501/Hukfak
İNGİLİZ HUKUK SİSTEMİNDE MAZNUNUN MEVKİİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Kelsen’in Hukuk ve Devlet Teorisi,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
HUKUK BİR BİLİM KOLU MUDUR ?,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Anayasacılığın Uluslararası Hukuk Bakımından Uygulanabilirliğinde Dikkate Alınması Gereken Bazı Temel Hususlar,10.33433/maruhad.445576,https://doi.org/10.33433/maruhad.445576
LİBERALİZMİN TEMELLERİ: FAYDACILIK VE DOĞAL HUKUK ÜZERİNE BİR İNCELEME,10.47525/ulasbid.841979,https://doi.org/10.47525/ulasbid.841979
Yabancılık Unsuru İçeren Vasiyetnamelerin Şekline Uygulanacak Hukuk,10.15337/suhfd.1103406,https://doi.org/10.15337/suhfd.1103406
İslam Hukuk Tarihini İbn Haldûn Üzerinden Okumak: İbn Haldûn’un Modern Dönem İslam Hukuk Tarihi Yazıcılığına Etkileri,10.37879/belleten.2012.741,https://doi.org/10.37879/belleten.2012.741
HUKUK DEVLETİ İDEALİNE FELSEFİ BİR BAKIŞ,10.33432/ybuhukuk.590676,https://doi.org/10.33432/ybuhukuk.590676
İslam Hukuku Perspektifiyle Tabiî Hukuk Yaklaşımının Analizi,10.52637/kiid.1182397,https://doi.org/10.52637/kiid.1182397
Osmanlı Devleti’nde Uluslararası Hukuk Anlayışının Kurumsallaşması: Bâbıâli Hukuk Müşavirliği (İstişare Odası),10.54614/JTRI.2022.4562,https://doi.org/10.54614/JTRI.2022.4562
Dil Üzerinden Hukuk ve İdeoloji İlişkisinin Bir Değerlendirilmesi,10.20981/kaygi.941367,https://doi.org/10.20981/kaygi.941367
Osmanli Devletinde Tanzimat Sonrası Aile Hukuku Alanındaki Gelışmeler ve Hukuk-ı Aıle Kararnamesi,10.14395/jdiv158,https://doi.org/10.14395/jdiv158
Entegrasyon Birliklerinde Hukuk Sistemlerinin Karşılaştırılması: Yönleri ve Yöntemleri,10.46868/atdd.2024.710,https://doi.org/10.46868/atdd.2024.710
Ahlaksız Hukuk ve Dinsiz Ahlak Mümkün Müdür?: Felsefi Bir Yaklaşım,10.29288/ilted.882188,https://doi.org/10.29288/ilted.882188
YASAMA VE HUKUK BİLİMİ KONUSUNDAKİ TARİH ÜSTÜ GÖREV HAKKINDA,10.54049/taad.1183563,https://doi.org/10.54049/taad.1183563
I,10.1501/Tarar,https://doi.org/10.1501/Tarar
EGEMENLİK VE İNSANCIL MÜDAHALE: ÇELİŞKİLİ BİR KURAM OLARAK ULUSLARARASI HUKUK,10.28956/gbd.842997,https://doi.org/10.28956/gbd.842997
"SÜNNİ HUKUK DÜŞÜNCESİNDE TÜMEVARIMSAL DESTEKLEME, ZANNİLİK ve KATİLİK",10.17335/suifd.43487,https://doi.org/10.17335/suifd.43487
Sosyal bilgiler öğretmen adaylarının hukuk okuryazarlığı becerilerini geliştirmek: Bir eylem araştırması,10.29000/rumelide.1221524,https://doi.org/10.29000/rumelide.1221524
A Descriptive Analysis on Quasi-Legal Language in Lease Contracts,10.16985/mtad.752825,https://doi.org/10.16985/mtad.752825
SOSYAL BİLGİLER ÖĞRETMEN ADAYLARININ HUKUK OKURYAZARLIĞINA İLİŞKİN ALGILARI,10.19171/uefad.609049,https://doi.org/10.19171/uefad.609049
MODERN BİR HUKUK DEVLETİNİN GEREĞİ OLARAK İDARENİN SORUMLULUĞU,10.54969/abuijss.1108904,https://doi.org/10.54969/abuijss.1108904
Avrupa İnsan Hakları Mahkemesi’nin Hassan v,10.33433/maruhad.687263,https://doi.org/10.33433/maruhad.687263
Eleştirel Uluslararası Hukuk Bağlamında Çin’in Arktik Politikalarının Analizi,10.25294/auiibfd.632961,https://doi.org/10.25294/auiibfd.632961
Hukuk Fakültesi Dersi Olarak Muhasebe Bilim Dalının Gerekliliği,10.34137/jilses.480406,https://doi.org/10.34137/jilses.480406
Hukuk Fakültesi Öğrencilerinin Muhasebe Meslek Mensubu Olabilme Farkındalığı: Anadolu Üniversitesi Hukuk Fakültesi Örneği,10.25095/mufad.396717,https://doi.org/10.25095/mufad.396717
HUKUK VE EKONOMİ DİSİPLİNLERİ İLİŞKİSİNDE GÜVENİLİR TAAHHÜDÜN ÖNEMİ,10.53881/hiad.1090679,https://doi.org/10.53881/hiad.1090679
Eugen Ehrlich Sosyolojisinde Yaşayan Hukuk Kavramı,10.51702/esoguifd.1380652,https://doi.org/10.51702/esoguifd.1380652
Hukuk Öğretimine Yönelik Teorik-Pratik Sınıf (TEOPS) Sistemi Model Önerisi,10.33710/sduijes.394643,https://doi.org/10.33710/sduijes.394643
Hukuk Mahkemesinin Hükmünde “Türk Milleti Adına” İbaresinin Eksikliği,10.15337/SUHFD.2017.68,https://doi.org/10.15337/SUHFD.2017.68
ULUSLARARASI HUKUKTA AFET DURUMUNDA UYGULANACAK HUKUK KURALLARI İLE İLGİLİ STANDARTLARI BELİRLEME ÇALIŞMALARI BAĞLAMINDA “ULUSLARARASI AFET HUKUKU PROJESİ”,10.30915/abd.1380913,https://doi.org/10.30915/abd.1380913
İnsancıl Hukuk Kuralları Çerçevesinde Duvar İnşasından Günümüze İsrail’in İşgal Altındaki Filistin Topraklarındaki Hukuk Dışı Yerleşimleri,10.33629/auhfd.1613997,https://doi.org/10.33629/auhfd.1613997
OSMANLI HUKUK UYGULAMASINDA KADININ ÇOCUĞU ÜZERİNDEKİ VELAYET VE VESAYET HAKKI,10.54704/akdhfd.1080296,https://doi.org/10.54704/akdhfd.1080296
ERMENİSTAN’IN KOLEKTİF GÜVENLİK ANTLAŞMASI ÖRGÜTÜ’NÜ (KGAÖ) II,10.33717/deuhfd.1375542,https://doi.org/10.33717/deuhfd.1375542
SAİD HALİM PAŞA’DA HUKUK VE TOPLUM İLİŞKİSİ,10.47136/asbuhfd.1190229,https://doi.org/10.47136/asbuhfd.1190229
BOŞANMA VE AYRILIĞA UYGULANACAK HUKUK KONUSUNDAKİ AVRUPA KONSEYİ ROMA III TÜZÜĞÜ KAPSAMINDA HUKUK SEÇİMİ,10.29228/mjes.15,https://doi.org/10.29228/mjes.15
Kamu Hukuku-Özel Hukuk Ayrımı ve İslamî Cezalar,10.1501/Ilhfak,https://doi.org/10.1501/Ilhfak
Deniz Yoluyla Taşımalarda Yük Sigortalarına Uygulanacak Hukuk ve Sigorta Sözleşmesinde Yer Alan Hukuk Seçiminin Sigortalı Açısından Bağlayıcılığı Sorunu,10.54699/andhd.1386220,https://doi.org/10.54699/andhd.1386220
Yargı Kararları Işığında Yabancı Unsurlu İş Sözleşmelerine Uygulanacak Hukuk,10.56701/shd.1571582,https://doi.org/10.56701/shd.1571582
Development of Three Dimensional Virtual Court for Legal Education,10.17569/tojqi.288854,https://doi.org/10.17569/tojqi.288854
"Topal, Şevket",10.18505/cuifd.85654,https://doi.org/10.18505/cuifd.85654
Şüpheli Alacak Kavramının Muhasebe ve Hukuk Açısından Değerlendirilmesi,10.33203/mfy.1347416,https://doi.org/10.33203/mfy.1347416
"OSMANLI DEVLETİ’NDE HUKUKUN KÖKENİ: ÖRFÎ HUKUK, KANUNNAME VE ŞER’ KAVRAMI",10.30561/sinopusd.1275865,https://doi.org/10.30561/sinopusd.1275865
Uygur Hukuk Belgelerinde Geçen Şazın Ayguçı Ünvanı Üzerine,10.37999/udekad.1517031,https://doi.org/10.37999/udekad.1517031
Hukuk ve İktisat Yaklaşımında Bir İktisatçı: Ronald H,10.18657/yonveek.605913,https://doi.org/10.18657/yonveek.605913
BEDELSİZ TERK UYGULAMASININ ÖZEL HUKUK BAKIŞ AÇISIYLA DEĞERLENDİRİLMESİ,10.54704/akdhfd.1167890,https://doi.org/10.54704/akdhfd.1167890
OSMANLI HUKUK EĞİTİMİNDE HUKUKA GİRİŞ DERSİ VE DERS KİTAPLARI,10.47136/asbuhfd.1563733,https://doi.org/10.47136/asbuhfd.1563733
G,10.59933/tauhfd.1503867,https://doi.org/10.59933/tauhfd.1503867
LAW REFORM IN PUBLIC ADMINISTRATION WITHIN THE FRAMEWORK OF THE RULE OF LAW AND INTERNATIONAL LAW: THE CASE OF TURKEY,10.33416/baybem.1162895,https://doi.org/10.33416/baybem.1162895
İdare Hukuku ve Özel Hukuk Arasında Yarışma mı Uzlaşma mı?,10.21492/inuhfd.239838,https://doi.org/10.21492/inuhfd.239838
HAKARETİN SUÇ OLMAKTAN ÇIKARILMASI VE İKAME YAPTIRIM ÖNERİSİ: ÖZEL HUKUK CEZASI,10.54049/taad.1231883,https://doi.org/10.54049/taad.1231883
HUKUKUN İKİ BEDENİ: DOĞAL VE POZİTİF HUKUK DİKOTOMİSİNDE ARİSTOTELES’İN YERİ,10.53844/flsf.1135004,https://doi.org/10.53844/flsf.1135004
Yabancı Unsurlu Alacağın Devri İşlemine Uygulanacak Hukuk,10.26650/ppil.2019.39.2.0014,https://doi.org/10.26650/ppil.2019.39.2.0014
Emsal Hukuk Dokümanlarının Otomatik Belirlenmesi,10.29130/dubited.1012386,https://doi.org/10.29130/dubited.1012386
Modern Toplumda Hukuk KültürüCulture of Law in Modern Societies,10.19168/jyu.90457,https://doi.org/10.19168/jyu.90457
"Türk-İslam Sentezcilerinde Hukuk, Ahlak ve Din İlişkisi",10.26466/opus.848373,https://doi.org/10.26466/opus.848373
Birden Üçe: Medeni Hukuk Sistemini Yayma Üçten Bire: Bir Medeni Hukuk Sistemi Oluşturma,10.26650/ihid.644415,https://doi.org/10.26650/ihid.644415
ALTERNATİF UYUŞMAZLIK ÇÖZÜMÜ ALANINDA HUKUK POLİTİKASI BELGESİ,10.47136/asbuhfd.863720,https://doi.org/10.47136/asbuhfd.863720
Hukuk Alanında İş Gücü Dinamikleri: Uzun Erimli Arz-Talep Analizi,10.2399/yod.18.029,https://doi.org/10.2399/yod.18.029
HUKUK VE DEĞİŞKEN DOĞRULUK: TOULMIN İZİNDE BİR İNCELEME,10.33717/deuhfd.1375606,https://doi.org/10.33717/deuhfd.1375606
KARŞILAŞTIRMALI HUKUK ÇERÇEVESİNDE HACİZLİ MALIN ELEKTRONİK ORTAMDA PARAYA ÇEVRİLMESİNE BAKIŞ,10.57083/adaletdergisi.1384404,https://doi.org/10.57083/adaletdergisi.1384404
BİR ULUSLARARASI HUKUK MÜESSESESİ OLARAK ULUSLARARASI ÖRGÜTLER ARASINDA ARDILLIK,10.33717/deuhfd.1089378,https://doi.org/10.33717/deuhfd.1089378
Hans-Hermann Hoppe’nın Argümantasyon Etiği ve Özel Hukuk Toplumu,10.21547/jss.1419733,https://doi.org/10.21547/jss.1419733
YAZARIN HAKLARINDAN METNİN HAKLARINA: YAPIT OLARAK HUKUK VE YORUMU,10.33629/auhfd.1221422,https://doi.org/10.33629/auhfd.1221422
ULUSLARARASI HUKUK UYARINCA ABLUKANIN HUKUKİ ÇERÇEVESİNİN BELİRLENMESİ,10.54049/taad.1683739,https://doi.org/10.54049/taad.1683739
Atatürk’ün Hukuk Alanında Getirdikleri,10.33419/aamd.702832,https://doi.org/10.33419/aamd.702832
MACHIAVELLI’S CONCEPTUALIZATION OF HEGEMONY AND POWER IN RELATION WITH INTERNATIONAL LEGAL THOUGHT,10.54842/ustich.1311125,https://doi.org/10.54842/ustich.1311125
"Özne, Hukuk ve Hak",10.34246/ahbvuhfd.1423032,https://doi.org/10.34246/ahbvuhfd.1423032
İslam Hukuk Tarihinde Fukahânın Mezhep Değiştirmesi,10.52886/ilak.1522942,https://doi.org/10.52886/ilak.1522942
CRİMİNAL DİZİSİNDEKİ HUKUK TERİMLERİNİN SESLENDİRME VE ALT YAZI ÇEVİRİLERİNE YÖNELİK TERİMBİLİM ODAKLI SORGULAMALAR,10.20304/humanitas.1510750,https://doi.org/10.20304/humanitas.1510750
Hukuk Öğrencisinin Pratik Çalışma -ya da Sınav- Olayının Hukuki Çözüm Metoduna Hakim On İki Metodolojik Temel İlke,10.33433/maruhad.932194,https://doi.org/10.33433/maruhad.932194
Mediation as an alternative remedy in Turkish legal system,10.24289/ijsser.279020,https://doi.org/10.24289/ijsser.279020
Acquisitive Prescription/Adverse Possession: Turkish and Chinese Legal Systems,10.33432/ybuhukuk.1575128,https://doi.org/10.33432/ybuhukuk.1575128
TASARIMLARA İLİŞKİN YABANCI UNSURLU UYUŞMAZLIKLARDA UYGULANACAK HUKUK,10.55027/tfm.1388648,https://doi.org/10.55027/tfm.1388648
CHICAGO SÖZLEŞMELERİNİN ULUSLARARASI HUKUK AÇISINDAN DEĞERLENDİRİLMESİ,10.21492/inuhfd.291297,https://doi.org/10.21492/inuhfd.291297
Hukuk Çevirisinde Duygusal Zekânın Önemi ve Karar Mekanizmasına Etkisi,10.29110/soylemdergi.1186587,https://doi.org/10.29110/soylemdergi.1186587
"İslâm Hukuk Felsefesi: Kaynaklar, Yöntemler Araçlar",10.14395/jdiv373,https://doi.org/10.14395/jdiv373
Uluslararası Hukuk Komisyonunun Değişimi: İşlevsel ve Yapısal Denge Arayışı,10.26650/ppil.2023.43.1266596,https://doi.org/10.26650/ppil.2023.43.1266596
Celal Nuri’nin Aile Hukukuna Dair Görüşlerinin Hukuk-ı Aile Kararnamesi’ne Yansımaları,10.15337/suhfd.646402,https://doi.org/10.15337/suhfd.646402
TÜRK HUKUK TARİHİNDE KANUN-I MUVAKKAT KAVRAMI VE UYGULAMASI,10.33629/auhfd.1061340,https://doi.org/10.33629/auhfd.1061340
Özel Hukuk Cezası Kavramı ve Ceza Hukukunun Genel İlkelerinin Özel Hukuk Cezalarına Uygulanabilirliği,10.33433/maruhad.1354636,https://doi.org/10.33433/maruhad.1354636
HUKUK YARGILAMASINDA TARAF VEKİLİ AVUKATIN TANIKLIĞI,10.51562/nkuhukuk.2021213,https://doi.org/10.51562/nkuhukuk.2021213
Müttefik Güç Harekatı İnsani Müdahalelerin Bir İstisnası mıdır? NATO’nun Kosova’ya Yönelik Harekatının Uluslararası Hukuk ve Askeri Bakış Açılarından Değerlendirilmesi,10.17134/sbd.84605,https://doi.org/10.17134/sbd.84605
XVI,10.54614/JTRI.2022.4613,https://doi.org/10.54614/JTRI.2022.4613
Tıbbi Malpraktis Olguları Hakkında Mezuniyet Öncesi Tıp ve Hukuk Fakültesi Öğrencilerinin Görüşlerinin Değerlendirilmesi,10.61970/adlitip.1362131,https://doi.org/10.61970/adlitip.1362131
"Sumer, Babil ve Assur’lularda Hukuk, Kanun ve Adalet Kavramları ve Bunlarla İlgili Terimler",10.37879/ttkbelleten.1170995,https://doi.org/10.37879/ttkbelleten.1170995
Ortaokul Hukuk ve Adalet Dersi Öğretim Programına İlişkin Öğretmen Görüşlerinin Belirlenmesi,10.24106/kefdergi.2928,https://doi.org/10.24106/kefdergi.2928
Bir Örfî Hukuk Düzenlemesi Olarak Mecelle’nin Kavâid-i Külliyesi ve Hukukun Genel İlkeleri,10.47130/bitlissos.1240184,https://doi.org/10.47130/bitlissos.1240184
Avrupa Birliği ikincil hukuk tasarruflarının çevirisinde Almanca-Türkçe çözümlemeli çeviri yöntemi,10.29000/rumelide.1253020,https://doi.org/10.29000/rumelide.1253020
GEORGES GURVITCH’İN HUKUK SOSYOLOJİSİ ALANINDA TÜRKİYE’YE ETKİSİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
ROMA KLASİK HUKUK DÖNEMİ’NDE MAL REJİMİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
MAHKEME İÇTİHATLARI TEMYİZ HUKUK UMUM HEYETİ KARARI,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
12 Mart Dönemi’nde Hukuk: Tanıklık Edebiyatı Bağlamında Bir İnceleme,10.34246/ahbvuhfd.1403099,https://doi.org/10.34246/ahbvuhfd.1403099
"The Impacts of the Contemporary Sunnah Approach on Politics, Law and Education in Modern Egypt",10.52886/ilak.1215993,https://doi.org/10.52886/ilak.1215993
Uluslararası Hukuk Kuramı Açısından Global İdare Hukuku -Bir Girizgah-,10.21492/inuhfd.239896,https://doi.org/10.21492/inuhfd.239896
John Locke’da Mülkiyet Hakkının Sınırları: Doğal Hukuk Temelinde Bir Değerlendirme,10.18491/bijop.28692,https://doi.org/10.18491/bijop.28692
HUKUK İLE MUHASEBENİN KESİŞME NOKTASI: ADLİ MUHASEBE,10.18092/ijeas.80090,https://doi.org/10.18092/ijeas.80090
İslâm Hukuk Düşüncesinde Özel Mülkiyet Anlayışı,10.15370/muifd.94056,https://doi.org/10.15370/muifd.94056
Hukuk çevreleri ayrımında Alman Hukuku’nun yeri ve temel özellikleri,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Stoa Düşüncesinde Doğal Hukuk ile Kozmopolis Kavramları ve Yansımaları,10.58733/imhfd.1627119,https://doi.org/10.58733/imhfd.1627119
"ULUSAL BAĞLAMDA YUMUŞAK HUKUK: TANIM, GEÇERLİLİK VE ETKİNLİK SORUNLARI",10.30915/abd.1535446,https://doi.org/10.30915/abd.1535446
BIR KULTUR URUNU OLARAK HUKUK DÜZENİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
DÖRDÜNCÜ TÜRK - İSVİÇRE HUKUK HAFTASI HAKKINDA RAPOR,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
SOSYAL DEVLET YOLUNDA HUKUK YAPISI DEĞİŞMELERİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
HUKUK SOSYOLOJİSİNİN MÜBESSİRİ OLARAK C S,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
HUKUK SOSYOLOJİSİNİN KURUCULARI VE BUGÜNKÜ CEREYANLAR,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
VERGİ HUKUKU VE DİĞER HUKUK BRANŞLARİLE MÜNASEBETİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Tabii Hukuk Anlayışının Klasik ve Modern Dönem Görünümleri Üzerine Bir Karşılaştırma,10.32957/hacettepehdf.1038961,https://doi.org/10.32957/hacettepehdf.1038961
UYGUR HUKUKUNDA FAİZ –UYGUR HUKUK VESİKALARINA GÖRE–,10.47136/asbuhfd.1270231,https://doi.org/10.47136/asbuhfd.1270231
FELSEFİ ANLATILARIN HUKUK EĞİTİMİNDEKİ YERİ - PLATON’UN MAĞARA ALEGORİSİ ÖRNEĞİ,10.21492/inuhfd.1478019,https://doi.org/10.21492/inuhfd.1478019
SAĞLIKÇILARA YÖNELİK ULUSLARARASI HUKUK EĞİTİMİNİN GEREKLİLİĞİ: UKRAYNA- RUSYA SAVAŞI ÜZERİNDEN BİR DEĞERLENDİRME,10.52273/sduhfd.1214503,https://doi.org/10.52273/sduhfd.1214503
HUKUKİ ÇOĞULLUK OLGUSUNUN HUKUK DEVLETİ İLKESİ BAKIMINDAN DEĞERLENDİRİLMESİ,10.21492/inuhfd.1114249,https://doi.org/10.21492/inuhfd.1114249
Modern Hukuk Karşısında Örfi Hukukun Varlığını Sürdürme Nedenleri Üzerine Sosyolojik Bir Araştırma: Şanlıurfa Örneği,10.33709/ictimaiyat.1317175,https://doi.org/10.33709/ictimaiyat.1317175
FIGHTING THE CLIMATE CRISIS WITHIN THE LAW (JUDICIAL) AXIS,10.46849/guiibd.1193379,https://doi.org/10.46849/guiibd.1193379
Uluslararası Hukuk ve AB Hukuku Boyutuyla Kişisel Verilerin Yurt Dışına Aktarılması,10.33433/maruhad.665460,https://doi.org/10.33433/maruhad.665460
"İBN TEYMİYYE’NİN SİYASET, HUKUK VE İKTİSAT TEORİSİ",10.11611/JMER37,https://doi.org/10.11611/JMER37
ALMANYA FEDERAL CUMHURİYETİ’NDE HUKUK MESLEKLERİNE GİRİŞ ŞART VE USULLERİ,10.54049/taad.1009175,https://doi.org/10.54049/taad.1009175
Türk Hukuk Mevzuatında Sivil İnsansız Hava Araçları Hukukunun Güncel Durumu,10.51534/tiha.898558,https://doi.org/10.51534/tiha.898558
BİR OSMANLI DEVLET ADAMININ PERSPEKTİFİNDEN İNSAN HAKLARI: MÜNİF PAŞA’NIN DOĞAL HUKUK YAKLAŞIMI,10.33171/dtcfjournal.2022.62.2.1,https://doi.org/10.33171/dtcfjournal.2022.62.2.1
İmamî Şiî Hukuk Sisteminde Humus/Beştebir,10.5281/zenodo.3343527,https://doi.org/10.5281/zenodo.3343527
"L, Karadeniz Ö",10.1501/Hukfak,https://doi.org/10.1501/Hukfak
İKİ FARKLI NOKTAl NAZARDAN HUKUK DEVLETİ,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Geleneksel Tıbba Etik ve Hukuk Yönü ile Bakış,10.34084/bshr.555783,https://doi.org/10.34084/bshr.555783
Türkiye’de Uluslararası İlişkiler Disiplininin Uzak Tarihi: Hukuk-ı Düvel (1859-1945),10.33458/uidergisi.552667,https://doi.org/10.33458/uidergisi.552667
Güvenlik Siyasetini Aşmak: İstisna ve Hukuk İlişkisi Üzerine Bir Tartışma,10.1501/SBFder,https://doi.org/10.1501/SBFder
"İnsancıl Müdahalenin Kurucu Felsefi Dayanakları Üzerine Bir İnceleme: Doğal Hukuk, Kant ve Deontoloji",10.37093/ijsi.1136538,https://doi.org/10.37093/ijsi.1136538
Milletlerarası Taşıyıcı Annelik Sonucu Doğan Çocuğun Soybağına Uygulanacak Hukuk,10.26650/ppil.2023.44.1.1424263,https://doi.org/10.26650/ppil.2023.44.1.1424263
MUKAYESELİ HUKUK İLE İLGİLİ İKİ KONGRE,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
"İSVİÇRE FREİBURG KANTONU, YENİ HUKUK YARGILAMA KANUNU",10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Hukuk Muhakemeleri Usulünde afakî hüsnüniyet esası,10.1501/Hukfak,https://doi.org/10.1501/Hukfak
Hukuk Uygarlaştırıcı Olabilir Mi? Bentham’ın Uluslararası Hukuka Dair Düşünceleri Üzerine Bir Analiz,10.33432/ybuhukuk.1482102,https://doi.org/10.33432/ybuhukuk.1482102
HUKUK DEVLETİ VE KOPENHAG KRİTERLERİ AÇISINDAN TÜRKİYE,10.29228/mjes.228,https://doi.org/10.29228/mjes.228
Milletlerarası Hukuk ve Sosyal Felsefe Kongresi (Eylül 1959),10.1501/SBFder,https://doi.org/10.1501/SBFder
Yüksek Öğretimde Hukuk ve Siyasi İlimlerin Değeri,10.1501/SBFder,https://doi.org/10.1501/SBFder
`;

async function main() {
  const lines = rawData.trim().split(/\r?\n/);

  for (const line of lines) {
    // 1) Link kısmını ayırıyoruz
    const linkSep = ',https://doi.org/';
    const li = line.indexOf(linkSep);
    if (li === -1) {
      console.warn('Link bulunamadı, atlandı:', line);
      continue;
    }

    // left = "başlık,doi"
    const left = line.slice(0, li);
    // link = "https://doi.org/..."
    const link = 'https://doi.org/' + line.slice(li + linkSep.length);

    // 2) DOI’yı ve başlığı ayıklıyoruz
    const lastComma = left.lastIndexOf(',');
    if (lastComma === -1) {
      console.warn('Virgülden ayrılmadı, atlandı:', line);
      continue;
    }

    let title = left.slice(0, lastComma).trim();
    let doi   = left.slice(lastComma + 1).trim();

    // Başlık içindeki çift tırnak escape’lerini düzelt
    title = title.replace(/""/g, '"').replace(/^"|"$/g, '');

    // 3) Veritabanına upsert
    try {
      await prisma.makale.upsert({
        where: { doi },
        update: { baslik: title },
        create: { doi, baslik: title },
      });
      console.log(`✔ Upserted ${doi}`);
    } catch (e) {
      console.error(`‼ Hata ${doi}:`, e);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });