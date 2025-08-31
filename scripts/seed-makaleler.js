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
ULUSLARARASI CEZA MAHKEMESİ VE UYGULANABİLİR HUKUK,10.1501/Hukfak_0000000289,https://doi.org/10.1501/Hukfak_0000000289
DOĞAL AFETLER VE ULUSLARARASI HUKUK: AFET DURUMUNDA KİŞİLERİN KORUNMASINA İLİŞKİN TASLAK MADDELER VE İNSAN HAKLARI,10.30915/abd.1380914,https://doi.org/10.30915/abd.1380914
İslâm Hukuk Metodolojisinde İstishâb,10.17120/omuifd.34634,https://doi.org/10.17120/omuifd.34634
ADİL YARGILANMA HAKKI VE HUKUK DEVLETİ IŞIĞINDA “ŞİDDETE UĞRAMIŞ KADIN SENDROMU” ÜZERİNE BİR İNCELEME,10.54704/akdhfd.1059882,https://doi.org/10.54704/akdhfd.1059882
Muhammed Hamidullah ve İslâm Hukuk İlmine Katkıları,10.47145/dinbil.1200607,https://doi.org/10.47145/dinbil.1200607
MODERN HUKUK SİSTEMLERİNDE AİLE ARABULUCULUĞU,10.47136/asbuhfd.1372099,https://doi.org/10.47136/asbuhfd.1372099
KADRO HAREKETİNİN HUKUK ANLAYIŞI: İKTİSADİ DEVLETÇİLİK VE ÖZGÜRLÜK GERİLİMİNDE BİR İNCELEME,10.57083/adaletdergisi.1391690,https://doi.org/10.57083/adaletdergisi.1391690
Papa Francis’in Kilise Hukuk Metninde Yaptığı Değişiklikler,10.17131/milel.1288162,https://doi.org/10.17131/milel.1288162
Uluslararası Hukuk ve Türk Hukuku Açısından Göçmen Kaçakçılığı Suçunda “Maddi Menfaat Elde Etme Amacı” Kavramı,10.33433/maruhad.1077588,https://doi.org/10.33433/maruhad.1077588
İMAR PLANINDA UMUMİ HİZMETE1 AYRILAN TAŞINMAZIN TAHSİSİNE “ÖZEL” İFADESİNİN EKLENMESİNE DAİR BİR ÖZEL HUKUK İNCELEMESİ,10.32957/hacettepehdf.1084624,https://doi.org/10.32957/hacettepehdf.1084624
Mâtürîdî’de Ahlaki Mükellefiyet ve Tabiî Hukuk,10.18317/kaderdergi.1468241,https://doi.org/10.18317/kaderdergi.1468241
Ronald Dworkin’in Uluslararası Hukuk Teorisi,10.33432/ybuhukuk.1425641,https://doi.org/10.33432/ybuhukuk.1425641
İDARÎ FİİLLERLE HUSUSİ HUKUK FİİLLERİNİN BENZERLİĞİN DEN DOĞAN TEŞHİS HATÂSI VE BUNDAN HASIL OLAN NETİCELER,10.1501/Hukfak_0000001287,https://doi.org/10.1501/Hukfak_0000001287
Profesör ZEKÎ MESTJD ALSAN’ın Veda Dersi MİLLETLERARASI HAYATTA BİR HUKUK NİZAMININ TESİSİ PROBLEMİ,10.1501/Hukfak_0000001282,https://doi.org/10.1501/Hukfak_0000001282
"ÇEVRE KÎRLENMESİNtN OLUŞMASINDAN SONRAKİ AŞAMADA MEDENt HUKUK, CEZA HUKUKU ve İDARE HUKUKU ÇÖZÜMLERİNE GENEL BİR BAKIŞ",10.1501/Hukfak_0000000737,https://doi.org/10.1501/Hukfak_0000000737
"ROMA’DA ARKAİK VE CUMHURİYET DÖNEMLERİNDE,ANAYASAL-POLİTİK DENGELER-HUKUKSAL GELİŞİM, HUKUKÇULARIN HUKUK YAŞAMINDAKİ ROLLERİ",10.1501/Hukfak_0000000724,https://doi.org/10.1501/Hukfak_0000000724
İSVİÇRE FEDERAL MAHKEMESİ H,10.1501/Hukfak_0000001370,https://doi.org/10.1501/Hukfak_0000001370
Osmanlı’nın Son Yüzyılında Hukuk Düşüncesinin Dönüşümü ve Dönemin Başlıca Tartışma Konuları,10.15337/suhfd.428157,https://doi.org/10.15337/suhfd.428157
AİLE İÇİ ŞİDDETİN ÇOCUK ÜZERİNDEKİ ETKİSİ KONUSUNDA SOSYAL HİZMET VE HUKUK FAKÜLTESİ ÖĞRENCİLERİNİN GÖRÜŞLERİNİN İNCELENMESİ,10.17218/hititsosbil.280831,https://doi.org/10.17218/hititsosbil.280831
İNSAN TİCARETİYLE MÜCADELE VE ULUSLARARASI HUKUK: KUZEY KIBRIS TÜRK CUMHURİYETİ ÖRNEĞİNİ DE İÇEREN BİR İNCELEME,10.33717/deuhfd.800893,https://doi.org/10.33717/deuhfd.800893
Uzay Hukuku ve Uluslararası İnsancıl Hukuk İlişkisi,10.26650/mecmua.2020.78.4.0012,https://doi.org/10.26650/mecmua.2020.78.4.0012
ULUSLARARASI HUKUK PERSPEKTİFİNDEN 2011 SONRASI DÖNEMDE LİBYA’DA DE FACTO REJİM VE YENİ HÜKÜMETİN TANINMASI SORUNU,10.18771/mdergi.848437,https://doi.org/10.18771/mdergi.848437
Çocuk Emeği Kullanımından Kaynaklanan Sosyal Hukuk Sorunları,10.26650/jspc.2021.81.907130,https://doi.org/10.26650/jspc.2021.81.907130
HUKUK MUHAKEMELERİ KANUNU KAPSAMINDA HAKEM KARARLARININ İPTALİ SEBEPLERİ VE HÂKİMİN KARARA MÜDAHALESİ,10.34246/ahbvuhfd.933992,https://doi.org/10.34246/ahbvuhfd.933992
KAHRAMANMARAŞ DEPREMLERİ ARDINDAN YAŞANAN OHAL VE OHAL CBK’LERİNİN HUKUK DEVLETİ İLKESİ ÇERÇEVESİNDE BİR ANALİZİ,10.56524/msydergi.1541832,https://doi.org/10.56524/msydergi.1541832
TANZİMAT DÖNEMİ HUKUK MUHAKEMESİNDE İSTİNAFI MÜMKÜN KARARLAR: CERİDE-İ MEHÂKİM’DE YAYIMLANMIŞ KARARLAR KAPSAMINDA BİR İNCELEME,10.57083/adaletdergisi.1285806,https://doi.org/10.57083/adaletdergisi.1285806
HUKUK MAHKEMESİ KARARLARININ İDARE MAHKEMESİNDE GÖRÜLEN UYUŞMAZLIKLARA ETKİSİ HAKKINDA BİR İNCELEME,10.57083/adaletdergisi.1484034,https://doi.org/10.57083/adaletdergisi.1484034
YABANCILIK UNSURU TAŞIYAN İŞ SÖZLEŞMELERİNE UYGULANACAK HUKUK,10.1501/Hukfak_0000001608,https://doi.org/10.1501/Hukfak_0000001608
Yumuşak Hukuk Tartışmaları Çerçevesinde BM İş Dünyası ve İnsan Hakları Rehber İlkeleri’nin Değerlendirilmesi,10.33433/maruhad.994733,https://doi.org/10.33433/maruhad.994733
Hukuk Muhakemeleri Kanunu’nda Öngörülen Gider Avansının Uygulanması ile İlgili Ortaya Çıkan Bazı Meseleler ve Bunların Değerlendirilmesi,10.15337/SUHFD.2017.70,https://doi.org/10.15337/SUHFD.2017.70
ULUSLARARASI HUKUK AÇISINDAN ULUSLARARASI İNSANİ YARDIM ÇAĞRISININ HUKUKİ NİTELİĞİ VE 6 ŞUBAT DEPREMİ,10.30915/abd.1380930,https://doi.org/10.30915/abd.1380930
YENİ DÜZENLEME ÇALIŞMALARINDA ELEKTRONİK AKİTLERİN KURULUŞU ve CLICK-WRAP YAZILIM LİSANSI SÖZLEŞMELERİNDE HUKUK SEÇİMİ KAYDI,10.1501/Hukfak_0000000575,https://doi.org/10.1501/Hukfak_0000000575
1876 ANAYASASFNIN HUKUK DEVLETİ UNSURLARI AÇISINDAN OSMANLI DEVLET ANLAYIŞINA GETİRDİĞİ YENİLİKLER,10.1501/Hukfak_0000000480,https://doi.org/10.1501/Hukfak_0000000480
KURAL BİLİMLERİ,10.1501/Hukfak_0000000098,https://doi.org/10.1501/Hukfak_0000000098
ALMAN HUKUK USULÜNDE SES ALMA CİHAZLARI İLE TESBİT EDİLEN SESLERİN İSPAT VASİTASİ OLARAK KULLANILMAS,10.1501/Hukfak_0000001456,https://doi.org/10.1501/Hukfak_0000001456
"PMS, Bas E",10.1501/Hukfak_0000001719,https://doi.org/10.1501/Hukfak_0000001719
Klasik Osmanlı Düzeninde Hukuk Üzerine Bazı Düşünceler,10.1501/OTAM_0000000405,https://doi.org/10.1501/OTAM_0000000405
Hukuk Muhakemeleri Kanuna Göre Ön İnceleme,10.21492/inuhfd.239783,https://doi.org/10.21492/inuhfd.239783
Hukuk Yargılamasında Dava Sebebi Üzerine Bir İnceleme,10.21492/inuhfd.239822,https://doi.org/10.21492/inuhfd.239822
Bir Toplumun Dinile§mesi: Suudi Arabistan’ da Süregelen Dini Hukuk Uygulaması,10.15370/muifd.21326,https://doi.org/10.15370/muifd.21326
Küresel Vergi Yönetimi: Yeni Ortak Hukuk,10.25272/j.2147-7035.2017.5.5.04,https://doi.org/10.25272/j.2147-7035.2017.5.5.04
Tabii Hukuk Anlayışının Klasik ve Modern Dönem Görünümleri Üzerine Bir Karşılaştırma,10.32957/hacettepehdf.1038961,https://doi.org/10.32957/hacettepehdf.1038961
I,10.1501/Tarar_0000000352,https://doi.org/10.1501/Tarar_0000000352
"HUKUK VE RİTÜEL: TARİHSEL, TOPLUMSAL VE POLİTİK PERSPEKTİFLERDEN HUKUKUN RİTÜEL VE SEMBOLLER ÜZERİNDEN ANLAMLANDIRILMASI",10.32957/hacettepehdf.1558376,https://doi.org/10.32957/hacettepehdf.1558376
"Uluslararası Hukuk, Sömürgecilik ve İlksel Birikim",10.47899/ijss.1573464,https://doi.org/10.47899/ijss.1573464
ULUSLARARASI HUKUK BAKIMINDAN KUDÜS,10.15337/suhfd.1487811,https://doi.org/10.15337/suhfd.1487811
"Sınıf Egemenliği, Hukuk ve Sovyet Hukuku",10.54699/andhd.1460051,https://doi.org/10.54699/andhd.1460051
Karşılaştırmalı Hukuk Sistemlerinde Ceninin Hayat Hakkı,10.60002/ebyuhfd.1377850,https://doi.org/10.60002/ebyuhfd.1377850
TÜRK JANDARMA TEŞKİLATI’NDA HUKUK EĞİTİMİNİN TARİHSEL GELİŞİMİ,10.33419/aamd.1301721,https://doi.org/10.33419/aamd.1301721
Uluslararası Hukuk Açısından Kosova Uzman Daireleri,10.30915/abd.464095,https://doi.org/10.30915/abd.464095
TANZİMAT REFORMLARININ HUKUK SİSTEMİNDEKİ İLK ÖRNEĞİ: 1840 CEZA KANÛNUNUN KASTAMONU MUHASSILLIK MECLİSİNDE TATBİKİ,10.18513/egetid.1442382,https://doi.org/10.18513/egetid.1442382
"LİBERAL NÖTRLÜK, FARKLILIKLAR VE HUKUK",10.51562/nkuhukuk.2024514,https://doi.org/10.51562/nkuhukuk.2024514
Memur ve Hukuk Danışmanı Olarak Franz Kafka,10.29110/soylemdergi.1487769,https://doi.org/10.29110/soylemdergi.1487769
Foucault’nun İktidar Sorunsallaştırmasında Hukuk ve Haklar,10.18026/cbayarsos.1339116,https://doi.org/10.18026/cbayarsos.1339116
ULUSLARARASI HUKUK ÇERÇEVESİNDE KÖYLÜ VE KIRSAL ALANDA ÇALIŞAN DİĞER KİŞİLERİN TOHUM HAKKI,10.54704/akdhfd.1169998,https://doi.org/10.54704/akdhfd.1169998
Hukuk Alanındaki Hizmetlerde Kullanılan Teknolojik Olanaklar (Legaltech) ve Avukatlık Mesleğine Olası Etkileri,10.33629/auhfd.1475078,https://doi.org/10.33629/auhfd.1475078
FIGHTING THE CLIMATE CRISIS WITHIN THE LAW (JUDICIAL) AXIS,10.46849/guiibd.1193379,https://doi.org/10.46849/guiibd.1193379
Medyada Filistin İşgali ve Uluslararası İnsancıl Hukuk,10.37679/trta.1401913,https://doi.org/10.37679/trta.1401913
ANAYASA VE ÖZEL HUKUK İLİŞKİLERİ BAĞLAMINDA TİCARİ NİTELİKLİ MÜLKİYET HAKKININ KORUNMASI,10.54704/akdhfd.1094249,https://doi.org/10.54704/akdhfd.1094249
İcap Nöbetinde Geçen Sürenin Çalışma Süresinden Sayılması - Yargıtay 9,10.54752/ct.1060817,https://doi.org/10.54752/ct.1060817
Murray N,10.33433/maruhad.1553979,https://doi.org/10.33433/maruhad.1553979
İslam Hukuk Düşüncesinde Parça-Bütün İlişkisi,10.17120/omuifd.1183078,https://doi.org/10.17120/omuifd.1183078
CAS TEMYİZ YARGILAMASINDA UYGULANACAK HUKUK,10.54049/taad.1418499,https://doi.org/10.54049/taad.1418499
YABANCI UNSURLU INFLUENCER SÖZLEŞMESİNE UYGULANACAK HUKUK,10.33717/deuhfd.1495704,https://doi.org/10.33717/deuhfd.1495704
Değişim Stratejisi Açısından Hukuk ve İslam Hukuku,10.17120/omuifd.59406,https://doi.org/10.17120/omuifd.59406
Türkiye ve Kuzey Makedonya Cumhuriyeti’nde Hukuk Uyuşmazlıklarında Arabuluculuk Kurumunun Avrupa Birliği Politikaları Bağlamında Karşılaştırılması,10.59831/ihuhfd.2024.25,https://doi.org/10.59831/ihuhfd.2024.25
Anayasacılığın Uluslararası Hukuk Bakımından Uygulanabilirliğinde Dikkate Alınması Gereken Bazı Temel Hususlar,10.33433/maruhad.445576,https://doi.org/10.33433/maruhad.445576
MARTTİ KOSKENNİEMİ’NİN ULUSLARARASI HUKUK TEORİSİNİN ANALİZİ,10.58375/sde.1475522,https://doi.org/10.58375/sde.1475522
KUZEY KIBRIS TÜRK CUMHURİYETİ’NİN (KKTC) TÜRK DEVLETLERİ TEŞKİLATI’NDAKİ GÖZLEMCİ ÜYE STATÜSÜNÜN ULUSLARARASI HUKUK AÇISINDAN İNCELENMESİ,10.33629/auhfd.1470893,https://doi.org/10.33629/auhfd.1470893
"İBN TEYMİYYE’NİN SİYASET, HUKUK VE İKTİSAT TEORİSİ",10.11611/JMER37,https://doi.org/10.11611/JMER37
Hukuk Devleti İlkesi ve Âdil Yargılanma Hakkı Çerçevesinde Kamu İhale İşlemlerinde İdarî Başvuru Yolları,10.15337/SUH.2017.21,https://doi.org/10.15337/SUH.2017.21
Nişanın Bozulmasının Hukukî ve Dinî/Ahlâkî Neticeleri (İslâm Hukuku ve Modern Hukuk Arasında bir Mukayese),10.15370/muifd.88438,https://doi.org/10.15370/muifd.88438
AVRUPA BİRLİĞİ SÜRECİ: ULUS DEVLETTEN ULUSÜSTÜ DEVLETE GEÇİŞTE HUKUK DEVLETİNİN DEĞİŞEN İÇERİĞİ,10.1501/Hukfak_0000000367,https://doi.org/10.1501/Hukfak_0000000367
TÜRK HUKUK TARİHİ AÇISINDAN KUL SİSTEMİ,10.33432/ybuhukuk.585799,https://doi.org/10.33432/ybuhukuk.585799
Uluslararası Hukuk ve AB Hukuku Boyutuyla Kişisel Verilerin Yurt Dışına Aktarılması,10.33433/maruhad.665460,https://doi.org/10.33433/maruhad.665460
27 Mayıs 1960 Tarihinde Yürürlükte Olan Ceza Mevzuatımız ve Evrensel Hukuk Bağlamında Yassıada Yargılamaları,10.33433/maruhad.1031191,https://doi.org/10.33433/maruhad.1031191
AUTONOMOUS WEAPON SYSTEMS UNDER INTERNATIONAL LAW,10.28956/gbd.1078155,https://doi.org/10.28956/gbd.1078155
Mobbing terimi ve Türk hukuk düzeninde incelenmesi,10.1501/Hukfak_0000001835,https://doi.org/10.1501/Hukfak_0000001835
Milletlerarası Özel Hukuk ve Usul Hukuku Hakkında Kanun (MÖHUK)’daki boşluk: Ada uygulanacak hukuk,10.1501/Hukfak_0000001897,https://doi.org/10.1501/Hukfak_0000001897
Müttefik Güç Harekatı İnsani Müdahalelerin Bir İstisnası mıdır? NATO’nun Kosova’ya Yönelik Harekatının Uluslararası Hukuk ve Askeri Bakış Açılarından Değerlendirilmesi,10.17134/sbd.84605,https://doi.org/10.17134/sbd.84605
İslâm Hukuk Düşüncesi ve Bulanık Mantık Üzerine Bir Değerlendirme,10.26650/iuitd.2023.1266987,https://doi.org/10.26650/iuitd.2023.1266987
ULUSLARARASI HUKUK BAĞLAMINDA ÇİN’İN DOĞU TÜRKİSTAN UYGULAMALARININ ANALİZİ,10.47257/busad.1004876,https://doi.org/10.47257/busad.1004876
HUKUK VE EKONOMİ DİSİPLİNLERİ İLİŞKİSİNDE GÜVENİLİR TAAHHÜDÜN ÖNEMİ,10.53881/hiad.1090679,https://doi.org/10.53881/hiad.1090679
Orman Mühendisliğinde hukuk bilgisinin meslek hayatına etkisi,10.53516/ajfr.1011904,https://doi.org/10.53516/ajfr.1011904
Yabancı Unsurlu Alacağın Devri İşlemine Uygulanacak Hukuk,10.26650/ppil.2019.39.2.0014,https://doi.org/10.26650/ppil.2019.39.2.0014
YASAMA VE HUKUK BİLİMİ KONUSUNDAKİ TARİH ÜSTÜ GÖREV HAKKINDA,10.54049/taad.1183563,https://doi.org/10.54049/taad.1183563
Kamu Hukuku-Özel Hukuk Ayrımı ve İslamî Cezalar,10.1501/Ilhfak_0000001465,https://doi.org/10.1501/Ilhfak_0000001465
"VALİDEBAĞ KORUSUNUN İMARA AÇILMASININ TOPLUM-DOĞA İLİŞKİSİ, ÇEVRE ETİĞİ YAKLAŞIMLARI, HUKUK DEVLETİ VE KATILIMCI ÇEVRE POLİTİKASI AÇISINDAN DEĞERLENDİRİLMESİ",10.1501/sbeder_0000000101,https://doi.org/10.1501/sbeder_0000000101
HUKUK DEVLETİ İDEALİNE FELSEFİ BİR BAKIŞ,10.33432/ybuhukuk.590676,https://doi.org/10.33432/ybuhukuk.590676
İslam Hukukunun Uygulanacak Hukuk Olarak Seçilmesi ve İngiliz Yüksek Mahkemesinin Shamil Bank of Bahrain v,10.33433/maruhad.928937,https://doi.org/10.33433/maruhad.928937
RUSYA FEDERASYONU YARGI ÖRGÜTÜ VE TÜRKİYE RUSYA ARASINDA HUKUK ALANINDA ADLÎ (HUKUKİ VE TİCARİ) İŞBİRLİĞİ ANLAŞMASI ÇALIŞMASINA YÖNELİK BİR ARAŞTIRMA,10.52273/sduhfd.960350,https://doi.org/10.52273/sduhfd.960350
Yargıtay 4,10.15337/suhfd.562782,https://doi.org/10.15337/suhfd.562782
A COMPARATIVE LEGAL ANALYSIS OF THE RIGHT TO ADEQUATE AND QUALITY EDUCATION,10.59162/tihek.1373729,https://doi.org/10.59162/tihek.1373729
UYGUR HUKUK VESİKALARI ÜZERİNE TÜRKÇE LİTERATÜRÜN HUKUKİ TAHLİLİ,10.57083/adaletdergisi.1217783,https://doi.org/10.57083/adaletdergisi.1217783
ANAYASACILIĞIN ULUSLARARASI HUKUK İLE ETKİLEŞİMİ: ANAYASALAŞMANIN KAVRAMSAL BOYUTLARI,10.30915/abd.1559094,https://doi.org/10.30915/abd.1559094
MEDENÎ KANUNUN KABULÜNDEN ÖNCE TÜRK AİLE HUKUKUNA İLİŞKİN DÜZENLEMELER VE ÖZELLİKLE 1917 TARİHLİ HUKUK—İ AİLE KARARNAMESİ,10.1501/Hukfak_0000000911,https://doi.org/10.1501/Hukfak_0000000911
Uluslararası hukuk açısından güvenlik kavramının teorik temelleri,10.1501/Hukfak_0000001824,https://doi.org/10.1501/Hukfak_0000001824
Student Participation in Education in Law Faculties: A Comparative Study,10.26466/opusjsr.1633930,https://doi.org/10.26466/opusjsr.1633930
Mukayeseli Hukuk Bağlamında Hukuk Mahkemesi Kararlarının Ceza Mahkemesine Etkisi Türkiye – Azerbaycan Örneği,10.54614/JSSI.2022.997834,https://doi.org/10.54614/JSSI.2022.997834
"Erken Dönem İslam Hukuk Tarihindeki Hukuk Ekollerinin Oluşumunda Coğrafya, Kültür ve Sosyal Şartların Etkisi",10.17828/yalovasosbil.333954,https://doi.org/10.17828/yalovasosbil.333954
"Tanzimat Sonrası Hukuk Metinlerinde Çevre Bilincinin Arka-planı Olarak ""Av Yasak ve Sınırlılıkları"" Üzerine Bazı Düşünceler",10.1501/OTAM_0000000365,https://doi.org/10.1501/OTAM_0000000365
DİJİTAL VARLIKLARIN TEMİNAT OLARAK KULLANILMASI HAKKINDA AVRUPA HUKUK ENSTİTÜSÜ İLKELERİNİN MİLLETLERARASI ÖZEL HUKUK KAPSAMINDA DEĞERLENDİRİLMESİ,10.21492/inuhfd.1618917,https://doi.org/10.21492/inuhfd.1618917
Deniz Yoluyla Taşımalarda Yük Sigortalarına Uygulanacak Hukuk ve Sigorta Sözleşmesinde Yer Alan Hukuk Seçiminin Sigortalı Açısından Bağlayıcılığı Sorunu,10.54699/andhd.1386220,https://doi.org/10.54699/andhd.1386220
Osmanlı Devleti’nde Uluslararası Hukuk Anlayışının Kurumsallaşması: Bâbıâli Hukuk Müşavirliği (İstişare Odası),10.54614/JTRI.2022.4562,https://doi.org/10.54614/JTRI.2022.4562
New Weapons and Old Law: Can International Humanitarian Law Treaties Deal Adequately with Modern Technologies?,10.51524/uhusbad.940298,https://doi.org/10.51524/uhusbad.940298
SİYASÎ İLİMLER VE HUKUK MİLLETLERARASI ADALET DİVANININ İNGİLİZ - İRAN PETROL ŞİRKETİ UYUŞMAZLIĞI HAKKINDA VERDİĞİ 22 TEMMUZ 1952 TARİHLİ KARARI,10.1501/SBFder_0000000027,https://doi.org/10.1501/SBFder_0000000027
Vasiyetname Yoluyla Tanıma: Bir Özel Hukuk Tasarrufunun Yorumu,10.30915/abd.1159020,https://doi.org/10.30915/abd.1159020
ULUSLARARASI HUKUKTA AFET DURUMUNDA UYGULANACAK HUKUK KURALLARI İLE İLGİLİ STANDARTLARI BELİRLEME ÇALIŞMALARI BAĞLAMINDA “ULUSLARARASI AFET HUKUKU PROJESİ”,10.30915/abd.1380913,https://doi.org/10.30915/abd.1380913
SOSYAL GÜVENLİK HUKUKUNDA İŞ KAZASI KAVRAMI: KITA AVRUPASI VE ANGLOSAKSON HUKUK İSTEMLERİNDEN BİRER ÖRNEK İLE TÜRK HUKUKU KARŞILAŞTIRMASI,10.21441/sguz.2017.52,https://doi.org/10.21441/sguz.2017.52
Jeremy Waldron ve Prosedürel Hukuk Devleti Anlayışı,10.26650/mecmua.2021.79.4.0006,https://doi.org/10.26650/mecmua.2021.79.4.0006
OKULLARDA AKRAN ZORBALIĞININ ÖZEL HUKUK AÇISINDAN DEĞERLENDİRİLMESİ,10.34246/ahbvuhfd.1172511,https://doi.org/10.34246/ahbvuhfd.1172511
SAİD HALİM PAŞA’DA HUKUK VE TOPLUM İLİŞKİSİ,10.47136/asbuhfd.1190229,https://doi.org/10.47136/asbuhfd.1190229
Uygur Hukuk Belgelerinde Geçen Şazın Ayguçı Ünvanı Üzerine,10.37999/udekad.1517031,https://doi.org/10.37999/udekad.1517031
MODERN BİR HUKUK DEVLETİNİN GEREĞİ OLARAK İDARENİN SORUMLULUĞU,10.54969/abuijss.1108904,https://doi.org/10.54969/abuijss.1108904
5 KASIM 1956 da ANKARA HUKUK FAKÜLTESİ KONFERANS SALONUNDA YAPILAN TÖRENDE REKTÖR PROF,10.1501/Hukfak_0000001270,https://doi.org/10.1501/Hukfak_0000001270
Hukuk Fakültesi Dersi Olarak Muhasebe Bilim Dalının Gerekliliği,10.34137/jilses.480406,https://doi.org/10.34137/jilses.480406
Development of Three Dimensional Virtual Court for Legal Education,10.17569/tojqi.288854,https://doi.org/10.17569/tojqi.288854
ALTERNATİF UYUŞMAZLIK ÇÖZÜMÜ ALANINDA HUKUK POLİTİKASI BELGESİ,10.47136/asbuhfd.863720,https://doi.org/10.47136/asbuhfd.863720
Ahlaksız Hukuk ve Dinsiz Ahlak Mümkün Müdür?: Felsefi Bir Yaklaşım,10.29288/ilted.882188,https://doi.org/10.29288/ilted.882188
"MUKAYESELİ HUKUK AÇISINDAN FİLM DENETİM SİSTEMLERİ VE 3257 SAYILI SİNEMA, VİDEO ve MÜZİK ESERLERİ KANUNUNUN GETİRDİĞİ SİSTEM",10.18094/si.49951,https://doi.org/10.18094/si.49951
ESKİ UYGURCA HUKUK BELGELERİNDE BUDİZM’İ YANSITAN BAZI UNSURLAR ÜZERİNE,10.30563/turklad.1564486,https://doi.org/10.30563/turklad.1564486
İsviçre Federal Mahkemesi 1,10.1501/Hukfak_0000001893,https://doi.org/10.1501/Hukfak_0000001893
Siyasi İlimler ve Hukuk II : Türkiye’de Devlet Hayatında Askeri Mahiyetin ve Tesirin Seyrine Bir Bakış,10.1501/SBFder_0000000838,https://doi.org/10.1501/SBFder_0000000838
BOŞANMA VE AYRILIĞA UYGULANACAK HUKUK KONUSUNDAKİ AVRUPA KONSEYİ ROMA III TÜZÜĞÜ KAPSAMINDA HUKUK SEÇİMİ,10.29228/mjes.15,https://doi.org/10.29228/mjes.15
Hukuk Fakültesi Öğrencilerinin Muhasebe Meslek Mensubu Olabilme Farkındalığı: Anadolu Üniversitesi Hukuk Fakültesi Örneği,10.25095/mufad.396717,https://doi.org/10.25095/mufad.396717
Özel Hukuk Cezası Kavramı ve Ceza Hukukunun Genel İlkelerinin Özel Hukuk Cezalarına Uygulanabilirliği,10.33433/maruhad.1354636,https://doi.org/10.33433/maruhad.1354636
Osmanli Devletinde Tanzimat Sonrası Aile Hukuku Alanındaki Gelışmeler ve Hukuk-ı Aıle Kararnamesi,10.14395/jdiv158,https://doi.org/10.14395/jdiv158
LAW REFORM IN PUBLIC ADMINISTRATION WITHIN THE FRAMEWORK OF THE RULE OF LAW AND INTERNATIONAL LAW: THE CASE OF TURKEY,10.33416/baybem.1162895,https://doi.org/10.33416/baybem.1162895
HUKUKİ GERÇEKLİK - SOSYAL GERÇEKLİK Hukuk ile sosyoloji arasındaki bağıntılar ve hukukun sosyal hayatta ki rolü üzerinde bir deneme,10.1501/Hukfak_0000001040,https://doi.org/10.1501/Hukfak_0000001040
Hukuk Fakültesi Dekanı ve Devletler Hukuku Profesörü Zeki Mesut Alsan’m Ankara Üniversitesinin ilk öğretim yılını açış dersi,10.1501/Hukfak_0000000085,https://doi.org/10.1501/Hukfak_0000000085
Eleştirel Uluslararası Hukuk Bağlamında Çin’in Arktik Politikalarının Analizi,10.25294/auiibfd.632961,https://doi.org/10.25294/auiibfd.632961
SOSYAL BİLGİLER ÖĞRETMEN ADAYLARININ HUKUK OKURYAZARLIĞINA İLİŞKİN ALGILARI,10.19171/uefad.609049,https://doi.org/10.19171/uefad.609049
İslam Hukuk Tarihinde Fukahânın Mezhep Değiştirmesi,10.52886/ilak.1522942,https://doi.org/10.52886/ilak.1522942
OSMANLI HUKUK EĞİTİMİNDE HUKUKA GİRİŞ DERSİ VE DERS KİTAPLARI,10.47136/asbuhfd.1563733,https://doi.org/10.47136/asbuhfd.1563733
TÜRK HUKUK TARİHİNDE KANUN-I MUVAKKAT KAVRAMI VE UYGULAMASI,10.33629/auhfd.1061340,https://doi.org/10.33629/auhfd.1061340
MİLLETLERARASI ÖZEL HUKUK VE USUL HUKUKU HAKKINDA KANUN KAPSAMINDA TENFİZ DİLEKÇESİNE EKLENECEK BELGELERDE ONAY GEREKLİLİĞİNE İLİŞKİN DEĞERLENDİRME,10.15337/suhfd.1370650,https://doi.org/10.15337/suhfd.1370650
Uluslararası Hukuk Süjesi Olarak Türkiye’deki Süryani Toplumu,10.16947/fsmia.1136435,https://doi.org/10.16947/fsmia.1136435
Eleştirel Irk Kuramı ve Irkın Hukuk Tarafından Belirlenmesi,10.33432/ybuhukuk.1274595,https://doi.org/10.33432/ybuhukuk.1274595
EGEMENLİK VE İNSANCIL MÜDAHALE: ÇELİŞKİLİ BİR KURAM OLARAK ULUSLARARASI HUKUK,10.28956/gbd.842997,https://doi.org/10.28956/gbd.842997
LİBERALİZMİN TEMELLERİ: FAYDACILIK VE DOĞAL HUKUK ÜZERİNE BİR İNCELEME,10.47525/ulasbid.841979,https://doi.org/10.47525/ulasbid.841979
G,10.59933/tauhfd.1503867,https://doi.org/10.59933/tauhfd.1503867
"TÜRKİYE’DE HUKUK EĞİTİMİ: ÇÖZÜM ARAYIŞLARI, SORUNLAR VE ÖNERİLER",10.26791/sarkiat.879188,https://doi.org/10.26791/sarkiat.879188
Kişilik Hakkının Sosyal Medya Kullanıcıları Tarafından İhlâli Hâlinde Ortaya Çıkacak Cezaî Sorumluluğa Medenî Hukuk Bağlamında Bir Bakış,10.15337/suhfd.327503,https://doi.org/10.15337/suhfd.327503
ANKARA 16,10.1501/Hukfak_0000000663,https://doi.org/10.1501/Hukfak_0000000663
İslam Hukuk Tarihini İbn Haldûn Üzerinden Okumak: İbn Haldûn’un Modern Dönem İslam Hukuk Tarihi Yazıcılığına Etkileri,10.37879/belleten.2012.741,https://doi.org/10.37879/belleten.2012.741
Yapay Zekânın Hukuk Alanındaki Uygulamaları ve Hukuk Alanında Kullanılmasının Olası Sonuçları,10.56701/shd.1566441,https://doi.org/10.56701/shd.1566441
İnsancıl Hukuk Kuralları Çerçevesinde Duvar İnşasından Günümüze İsrail’in İşgal Altındaki Filistin Topraklarındaki Hukuk Dışı Yerleşimleri,10.33629/auhfd.1613997,https://doi.org/10.33629/auhfd.1613997
Devlet-i Osmaniyyede Musademe-i Hukuk ve Roma Hukuku,10.1501/Hukfak_0000001686,https://doi.org/10.1501/Hukfak_0000001686
2018 ORTAOKUL ÖĞRETİM PROGRAMLARININ HUKUK OKURYAZARLIĞI AÇISINDAN İNCELENMESİ,10.29299/kefad.2019.20.02.012,https://doi.org/10.29299/kefad.2019.20.02.012
HASILATA BAĞLI İŞLERDE SÖZLEŞMESEL İLİŞKİ VE FAZLA ÇALIŞMA OLGUSU Yargıtay Hukuk Genel Kurulu’nun 02,10.33717/deuhfd.1036303,https://doi.org/10.33717/deuhfd.1036303
Hukuk ve İktisat Yaklaşımında Bir İktisatçı: Ronald H,10.18657/yonveek.605913,https://doi.org/10.18657/yonveek.605913
A Descriptive Analysis on Quasi-Legal Language in Lease Contracts,10.16985/mtad.752825,https://doi.org/10.16985/mtad.752825
"Kant Düşüncesinde Hukuk, Devlet ve İnsan Haklarının Felsefi Temelleri",10.54699/andhd.1586964,https://doi.org/10.54699/andhd.1586964
Hans-Hermann Hoppe’nın Argümantasyon Etiği ve Özel Hukuk Toplumu,10.21547/jss.1419733,https://doi.org/10.21547/jss.1419733
İslam Hukuku Perspektifiyle Tabiî Hukuk Yaklaşımının Analizi,10.52637/kiid.1182397,https://doi.org/10.52637/kiid.1182397
Entegrasyon Birliklerinde Hukuk Sistemlerinin Karşılaştırılması: Yönleri ve Yöntemleri,10.46868/atdd.2024.710,https://doi.org/10.46868/atdd.2024.710
"Köy Postası Dergisinde Hukuk, Sağlık ve Eğitim (1944-1950)",10.24186/vakanuvis.1397878,https://doi.org/10.24186/vakanuvis.1397878
Genel Hafta Tatilinin Özel Hukuk Sürelerine Etkileri Çerçevesinde Lozan Barış Antlaşması’nın 43 ve 45’inci Maddelerinin Arka Planı Üzerine Düşünceler,10.33629/auhfd.1595209,https://doi.org/10.33629/auhfd.1595209
Eugen Ehrlich Sosyolojisinde Yaşayan Hukuk Kavramı,10.51702/esoguifd.1380652,https://doi.org/10.51702/esoguifd.1380652
UYGUR HUKUKUNDA FAİZ –UYGUR HUKUK VESİKALARINA GÖRE–,10.47136/asbuhfd.1270231,https://doi.org/10.47136/asbuhfd.1270231
ERMENİSTAN’IN KOLEKTİF GÜVENLİK ANTLAŞMASI ÖRGÜTÜ’NÜ (KGAÖ) II,10.33717/deuhfd.1375542,https://doi.org/10.33717/deuhfd.1375542
Hukuk Savaşımının Kavramsal Çerçevesi ve Uygulamaları Üzerine Bir İnceleme,10.17752/guvenlikstrtj.1394945,https://doi.org/10.17752/guvenlikstrtj.1394945
Hukuk sistemlerinde personel çizelgeleme problemi: Kamulaştırma davaları örneği,10.17341/gazimmfd.894627,https://doi.org/10.17341/gazimmfd.894627
İdare Hukuku ve Özel Hukuk Arasında Yarışma mı Uzlaşma mı?,10.21492/inuhfd.239838,https://doi.org/10.21492/inuhfd.239838
Medeni Hukuk Bakımından Tıbbi Müdahaleye Hastanın Rızası,10.21492/inuhfd.239945,https://doi.org/10.21492/inuhfd.239945
Mediation as an alternative remedy in Turkish legal system,10.24289/ijsser.279020,https://doi.org/10.24289/ijsser.279020
"Türk-İslam Sentezcilerinde Hukuk, Ahlak ve Din İlişkisi",10.26466/opus.848373,https://doi.org/10.26466/opus.848373
Sualtında İcra Edilen Sismik Araştırmalardan Kaynaklanan Kirlilik ve Uluslararası Hukuk,10.26650/siyasal.2020.29.1.0076,https://doi.org/10.26650/siyasal.2020.29.1.0076
Avrupa İnsan Hakları Mahkemesi’nin Hassan v,10.33433/maruhad.687263,https://doi.org/10.33433/maruhad.687263
Dil Üzerinden Hukuk ve İdeoloji İlişkisinin Bir Değerlendirilmesi,10.20981/kaygi.941367,https://doi.org/10.20981/kaygi.941367
Hukuk Öğrencisinin Pratik Çalışma -ya da Sınav- Olayının Hukuki Çözüm Metoduna Hakim On İki Metodolojik Temel İlke,10.33433/maruhad.932194,https://doi.org/10.33433/maruhad.932194
2018 ORTAOKUL ÖĞRETİM PROGRAMLARININ HUKUK OKURYAZARLIĞI AÇISINDAN İNCELENMESİ,10.29299/kefad.2019.20.02.012,https://doi.org/10.29299/kefad.2019.20.02.012
ABŪ HANĪFA AND THE LEGAL LOGIC OF 2ND/8TH CENTURY IRAQ,10.61304/did.811535,https://doi.org/10.61304/did.811535
Uluslararası Hukuk Açısından Yemen’e Yönelik Davetle Müdahalenin Değerlendirilmesi,10.15337/suhfd.833214,https://doi.org/10.15337/suhfd.833214
ULUSLARARASI HUKUK UYARINCA ABLUKANIN HUKUKİ ÇERÇEVESİNİN BELİRLENMESİ,10.54049/taad.1683739,https://doi.org/10.54049/taad.1683739
John Locke’da Mülkiyet Hakkının Sınırları: Doğal Hukuk Temelinde Bir Değerlendirme,10.18491/bijop.28692,https://doi.org/10.18491/bijop.28692
Milletlerarası Taşıyıcı Annelik Sonucu Doğan Çocuğun Soybağına Uygulanacak Hukuk,10.26650/ppil.2023.44.1.1424263,https://doi.org/10.26650/ppil.2023.44.1.1424263
Kovid-19 Pandemisi:Uluslararası Hukuk Açısından Dünya Sağlık Örgütü’ne İlişkin Bir Değerlendirme,10.33630/ausbf.856704,https://doi.org/10.33630/ausbf.856704
ANAYA SOYBAĞININ REDDİ DAVASI AÇMA HAKKI TANINMASI: OLMASI GEREKEN HUKUK BAKIMINDAN ÖNERİLER,10.54049/taad.1466874,https://doi.org/10.54049/taad.1466874
12 Mart Dönemi’nde Hukuk: Tanıklık Edebiyatı Bağlamında Bir İnceleme,10.34246/ahbvuhfd.1403099,https://doi.org/10.34246/ahbvuhfd.1403099
Kuzey Kıbrıs Türk Cumhuriyeti Yüksek Mahkemesi kararlarında hukuk devleti ilkesi,10.1501/Hukfak_0000001823,https://doi.org/10.1501/Hukfak_0000001823
“HUKUK MUHAKEMELERİ KANUNU İLE BAZI KANUNLARDA DEĞİŞİKLİK YAPILMASI HAKKINDA KANUN” İLE İDDİA VE SAVUNMANIN GENİŞLETİLMESİ VE DEĞİŞTİRİLMESİ YASAĞI HAKKINDAKİ DEĞİŞİKLİĞİN ÖN İNCELEMEYE ETKİSİ,10.52273/sduhfd.1078360,https://doi.org/10.52273/sduhfd.1078360
XVI,10.54614/JTRI.2022.4613,https://doi.org/10.54614/JTRI.2022.4613
Özgürlük ve Hukuk: Anayasacılığın Yitik Kavramları Üzerine Bir İnceleme,10.58733/imhfd.1357938,https://doi.org/10.58733/imhfd.1357938
HUKUK USULÜNE DAİR LA HAYE SÖZLEŞMESİ KAPSAMINDA YABANCI TÜZEL KİŞİLERİN TEMİNAT YÜKÜMLÜLÜĞÜNDEN MUAFİYETİ,10.21492/inuhfd.358545,https://doi.org/10.21492/inuhfd.358545
HÂKİMLERİN VE BİLİRKİŞİLERİN HUKUKÎ SORUMLULUĞUNA İLİŞKİN VERİLEN MAHKEME KARARLARI İÇİN UYGULANACAK KANUN YOLUNA BAŞVURU SINIRI ÜZERİNE BİR HUKUK GENEL KURULU KARARININ DÜŞÜNDÜRDÜKLERİ,10.32957/hacettepehdf.596332,https://doi.org/10.32957/hacettepehdf.596332
Türk Hukuk Mevzuatında Sivil İnsansız Hava Araçları Hukukunun Güncel Durumu,10.51534/tiha.898558,https://doi.org/10.51534/tiha.898558
Sokağa Çıkma Yasağına İlişkin Emirnameler: KKTC’de Salgın Hastalıkla Mücadelede Olağan Hukuk ile Olağanüstü Tedbirler,10.26650/mecmua.2021.79.2.0007,https://doi.org/10.26650/mecmua.2021.79.2.0007
COVID-19 Salgını ve Bulaşıcı Hastalıkların Yarattığı Küresel Krizlerle Mücadelede Uluslararası Hukuk,10.26650/mecmua.2020.78.2.0020,https://doi.org/10.26650/mecmua.2020.78.2.0020
Celal Nuri’nin Aile Hukukuna Dair Görüşlerinin Hukuk-ı Aile Kararnamesi’ne Yansımaları,10.15337/suhfd.646402,https://doi.org/10.15337/suhfd.646402
Türkiye’de Uluslararası İlişkiler Disiplininin Uzak Tarihi: Hukuk-ı Düvel (1859-1945),10.33458/uidergisi.552667,https://doi.org/10.33458/uidergisi.552667
Uluslararası ve Ulusüstü Hukuk Bağlamında Ulusal İnsan Hakları Kurumlarının Tarihsel Gelişimi,10.60002/ebyuhfd.1428257,https://doi.org/10.60002/ebyuhfd.1428257
Tıbbi Malpraktis Olguları Hakkında Mezuniyet Öncesi Tıp ve Hukuk Fakültesi Öğrencilerinin Görüşlerinin Değerlendirilmesi,10.61970/adlitip.1362131,https://doi.org/10.61970/adlitip.1362131
Stoa Düşüncesinde Doğal Hukuk ile Kozmopolis Kavramları ve Yansımaları,10.58733/imhfd.1627119,https://doi.org/10.58733/imhfd.1627119
Yabancılık Unsuru Bulunan Mirasın Paylaşılmasına Dair Sözleşmelerin Esasına Uygulanacak Hukuk,10.58733/imhfd.1545343,https://doi.org/10.58733/imhfd.1545343
el-Mâturîdî’de Hukuk Normlarının Geçersizlik Sebebi Olarak Metrûkiyet,10.14395/hid.1428114,https://doi.org/10.14395/hid.1428114
Hukuk Alanında İş Gücü Dinamikleri: Uzun Erimli Arz-Talep Analizi,10.2399/yod.18.029,https://doi.org/10.2399/yod.18.029
Uluslararası Hukuk Bakımından Bir Uluslararası Örgüt Olarak Türk Devletleri Teşkilatı,10.17752/guvenlikstrtj.1112918,https://doi.org/10.17752/guvenlikstrtj.1112918
"İnsancıl Müdahalenin Kurucu Felsefi Dayanakları Üzerine Bir İnceleme: Doğal Hukuk, Kant ve Deontoloji",10.37093/ijsi.1136538,https://doi.org/10.37093/ijsi.1136538
Güvenlik Siyasetini Aşmak: İstisna ve Hukuk İlişkisi Üzerine Bir Tartışma,10.1501/SBFder_0000002312,https://doi.org/10.1501/SBFder_0000002312
Ulusal ve Uluslararası Hukuk Açısından Türkiye’de Din Eğitiminin Yasal Dayanakları,10.17120/omuifd.80069,https://doi.org/10.17120/omuifd.80069
Hukuk Devleti Bağlamında Türkiye’de Olağanüstü Hal Rejiminin Sınırları,10.30915/abd.1114504,https://doi.org/10.30915/abd.1114504
Hukuk Öğretimine Yönelik Teorik-Pratik Sınıf (TEOPS) Sistemi Model Önerisi,10.33710/sduijes.394643,https://doi.org/10.33710/sduijes.394643
HUKUK YAZININDA ATIF SİSTEMİNİN STANDARTLAŞMASI: BİR FIRSAT VE ÖNERİ OLARAK TÜHAS,10.30915/abd.1437265,https://doi.org/10.30915/abd.1437265
Uluslararası Hukukun Zorlu Sınavı: Siber Uzay ve Uluslararası Hukuk Arasındaki İlişki,10.53451/ijps.1531144,https://doi.org/10.53451/ijps.1531144
Uluslararası Hukuk Açısından Uluslararası Antlaşmalardan Çekilme Yetkisine ve Usulüne İlişkin Tartışmalar,10.26650/ppil.2023.43.2.1366123,https://doi.org/10.26650/ppil.2023.43.2.1366123
Vergi Suçlarıyla Mücadelede On Küresel İlke: Türk Hukuk Sistemi Açısından Bir Değerlendirme,10.37093/ijsi.1511752,https://doi.org/10.37093/ijsi.1511752
EXTRATERRITORIAL APPLICATION OF EU COMPETITION LAW: THE NEW STANDARDBEARER OF LEGAL IMPERIALISM?,10.32450/aacd.1050057,https://doi.org/10.32450/aacd.1050057
Türkiye’de Hukuk ve Siyaset İlişkisi Ekseninde Cumhurbaşkanlığı Kararnameleri,10.17541/optimum.1314110,https://doi.org/10.17541/optimum.1314110
Uluslararası Hukuk Sujelerine Uygulanan Yaptırımların Sınırları ve Etkileri,10.33629/auhfd.1324376,https://doi.org/10.33629/auhfd.1324376
Bir Örfî Hukuk Düzenlemesi Olarak Mecelle’nin Kavâid-i Külliyesi ve Hukukun Genel İlkeleri,10.47130/bitlissos.1240184,https://doi.org/10.47130/bitlissos.1240184
Uzay Hukuku Bağlamında “İnsanlık” ve Uluslararası Hukuk Kişiliği Meselesi,10.15337/suhfd.1057105,https://doi.org/10.15337/suhfd.1057105
HUKUKUN İKİ BEDENİ: DOĞAL VE POZİTİF HUKUK DİKOTOMİSİNDE ARİSTOTELES’İN YERİ,10.53844/flsf.1135004,https://doi.org/10.53844/flsf.1135004
BORÇLANMAYA DAYALI KİTLE FONLAMASININ FİNANSMAN HUKUKU VE MALİ HUKUK AÇISINDAN DEĞERLENDİRİLMESİ,10.21492/inuhfd.1365953,https://doi.org/10.21492/inuhfd.1365953
"Suç, Hukuk ve Liberalizm: Halide Edib’in Polisiye Eserlerinde Fert ve Cemiyet Hürriyeti",10.26650/iuturkiyat.1378618,https://doi.org/10.26650/iuturkiyat.1378618
ABD’NİN 2003 IRAK MÜDAHALESİNİN ULUSLARARASI HUKUK AÇISINDAN DEĞERLENDİRİLMESİ,10.52791/aksarayiibd.1406780,https://doi.org/10.52791/aksarayiibd.1406780
BİR OSMANLI DEVLET ADAMININ PERSPEKTİFİNDEN İNSAN HAKLARI: MÜNİF PAŞA’NIN DOĞAL HUKUK YAKLAŞIMI,10.33171/dtcfjournal.2022.62.2.1,https://doi.org/10.33171/dtcfjournal.2022.62.2.1
Çivi Yazılı Hukuk Metinlerinin Işığında Ataerkil Düzenin İnşası,10.26650/iukad.2024.1490608,https://doi.org/10.26650/iukad.2024.1490608
İslam Hukuk Metodolojisinde Nasların Mubahlığa Delalet Etme Yolları,10.35415/sirnakifd.538443,https://doi.org/10.35415/sirnakifd.538443
Hak Merkezli Yenilikçi Hukuk Düşüncesi Çerçevesinde İnsanlık Anayasası Kavramı,10.25272/j.2147-7035.2017.5.3.14,https://doi.org/10.25272/j.2147-7035.2017.5.3.14
The Crime of Migrant Smuggling in Turkish Legal System in The Light of Recent Developments,10.32957/hacettepehdf.481140,https://doi.org/10.32957/hacettepehdf.481140
İSTİKLAL HARBİNDE ANTALYA VE HAVALİSİNDE KURULAN MÜDAFAA-İ HUKUK CEMİYETİ VE FAALİYETLERİ,10.20860/ijoses.46045,https://doi.org/10.20860/ijoses.46045
YARGITAY HUKUK GENEL KURULU’NUN HÂKİMİN BİLİRKİŞİ RAPORUYLA BAĞLI OLUP OLMADIĞI HAKKINDA VERMİŞ OLDUĞU 24,10.1501/Hukfak_0000001641,https://doi.org/10.1501/Hukfak_0000001641
AC,10.1501/Hukfak_0000001632,https://doi.org/10.1501/Hukfak_0000001632
Osmanlı Hukuk Tarihinde Öncü Bir İsim: Timurtaşi Üzerine Biyografik Bir İnceleme,10.28949/bilimname.522126,https://doi.org/10.28949/bilimname.522126
Bir Osmanlı Hukuk Adamı Ilgınlı Şeyhülislam Hasan Fehmi Efendi,10.15337/suhfd.351358,https://doi.org/10.15337/suhfd.351358
Uluslararası Hukuk Kuramı Açısından Global İdare Hukuku -Bir Girizgah-,10.21492/inuhfd.239896,https://doi.org/10.21492/inuhfd.239896
Tahkimin Rus ve Türk Hukuk Sistemlerinde Hâkimler ve Hakemler Açısından Karşılaştırılması,10.15337/suhfd.674687,https://doi.org/10.15337/suhfd.674687
MUKAYESELİ HUKUK BAĞLAMINDA İHALEYE FESAT KARIŞTIRMA SUÇU (TCK Md,10.61349/iesbad.1423682,https://doi.org/10.61349/iesbad.1423682
Medenî Hukuk Açısından Sosyal Sebeplerle (Sosyal Endikasyonla) Üreme Hücresinin Dondurulup Saklanması,10.30915/abd.546254,https://doi.org/10.30915/abd.546254
"ULUSAL BAĞLAMDA YUMUŞAK HUKUK: TANIM, GEÇERLİLİK VE ETKİNLİK SORUNLARI",10.30915/abd.1535446,https://doi.org/10.30915/abd.1535446
CRİMİNAL DİZİSİNDEKİ HUKUK TERİMLERİNİN SESLENDİRME VE ALT YAZI ÇEVİRİLERİNE YÖNELİK TERİMBİLİM ODAKLI SORGULAMALAR,10.20304/humanitas.1510750,https://doi.org/10.20304/humanitas.1510750
"Zeyd bin Ali : Hayatı, Eserleri ve İslâm Hukuk Düşüncesindeki Yeri [Zayd b",10.12730/13091719.2010.11.10,https://doi.org/10.12730/13091719.2010.11.10
TÜRK HUKUKUNDA YABANCI UNSURLU CAN SİGORTA SÖZLEŞMELERİNE UYGULANACAK HUKUK,10.54049/taad.1683948,https://doi.org/10.54049/taad.1683948
The Refugee in Law and Practice: In the Face of Western States’ Pushback Policies,10.26650/ppil.2022.42.1.927100,https://doi.org/10.26650/ppil.2022.42.1.927100
Rusça Hukuk Diline Girmiş İslâm Hukuku Terimlerinin Kavramsal Çerçevesi,10.37697/eskiyeni.1466165,https://doi.org/10.37697/eskiyeni.1466165
İzmir Müdafaa-İ Hukuk-I Osmaniye Cemiyeti (Aralık 1918-Mart 1920),10.33419/aamd.703222,https://doi.org/10.33419/aamd.703222
ÖZEL HUKUK DAVALARINA ETKİLERİ BAKIMINDAN TÜRK TİCARET KANUNUNDA DÜZENLENEN HAKSIZ REKABET SUÇLARI,10.54831/vanyyuiibfd.1119574,https://doi.org/10.54831/vanyyuiibfd.1119574
Olağanüstü Hal Çerçevesinde Hukuk ve Siyaset İlişkisi: ABD’nin Teröre Karşı Savaşı ve İstisna Halinin Mekânsal Temsilleri Olarak Guantanamo ve Ebu Gureyb,10.54627/gcd.938336,https://doi.org/10.54627/gcd.938336
"ULUSLARARASI HUKUK, AVRUPA BİRLİĞİ HUKUKU VE TÜRK HUKUKUNDA İLTİCA TALEPLERİNİN KAYIT ALTINA ALINMASI",10.54049/taad.1055783,https://doi.org/10.54049/taad.1055783
HAKARETİN SUÇ OLMAKTAN ÇIKARILMASI VE İKAME YAPTIRIM ÖNERİSİ: ÖZEL HUKUK CEZASI,10.54049/taad.1231883,https://doi.org/10.54049/taad.1231883
Thomas Hobbes’un On Dokuz Doğa Yasasının Hukuk Devleti İlkesi Bağlamında Değerlendirilmesi,10.33432/ybuhukuk.1417006,https://doi.org/10.33432/ybuhukuk.1417006
İslam Hukuk Metodolojisinde Debûsî ve Gazzâlî’nin Şer‘î Hükümlerin Delillerine Bakış Açıları,10.32955/neu.ilaf.2020.6.1.03,https://doi.org/10.32955/neu.ilaf.2020.6.1.03
Uluslararası Hukuk Ekseninde Devletlerin İleri Sürdüğü “Viral Egemenlik” İddiasının Değerlendirilmesi,10.26650/mecmua.2021.79.4.0010,https://doi.org/10.26650/mecmua.2021.79.4.0010
Uluslararası İlişkiler ve Uluslararası Hukuk Perpektifinden Şehirlerin Artan Önemi,10.51290/dpusbe.1023760,https://doi.org/10.51290/dpusbe.1023760
Web of Science Penceresinden Türkiye Adresli Hukuk Yayınlarına Genel Bakış,10.32329/uad.886187,https://doi.org/10.32329/uad.886187
FELSEFİ ANLATILARIN HUKUK EĞİTİMİNDEKİ YERİ - PLATON’UN MAĞARA ALEGORİSİ ÖRNEĞİ,10.21492/inuhfd.1478019,https://doi.org/10.21492/inuhfd.1478019
Avrupa Birliği ikincil hukuk tasarruflarının çevirisinde Almanca-Türkçe çözümlemeli çeviri yöntemi,10.29000/rumelide.1253020,https://doi.org/10.29000/rumelide.1253020
14 Mart 1978 tarihli Temsile Uygulanacak Hukuk Hakkında La Haye Konvansiyonu,10.1501/Hukfak_0000001723,https://doi.org/10.1501/Hukfak_0000001723
AVRUPA TOPLULUĞUNUN LA HAYE MİLLETLERARASI ÖZEL HUKUK KONFERANSINA ÜYELİĞİ,10.1501/Hukfak_0000001523,https://doi.org/10.1501/Hukfak_0000001523
ULUSLARARASI HUKUK AÇISINDAN ÖZEL ASKERÎ ŞİRKETLER VE ŞİRKET ÇALIŞANLARININ STATÜSÜ,10.1501/Hukfak_0000001648,https://doi.org/10.1501/Hukfak_0000001648
SAYIN O,10.1501/Hukfak_0000001380,https://doi.org/10.1501/Hukfak_0000001380
The Rise of Transnational Democracy and Its Effect on the International Legal Order,10.17550/akademikincelemeler.313810,https://doi.org/10.17550/akademikincelemeler.313810
‘Koruma Sorumluluğu’ ve Libya Örneği Bağlamında Türkiye’nin Uluslararası Hukuk Yaklaşımı,10.15337/suhfd.760799,https://doi.org/10.15337/suhfd.760799
TÜRK HUKUK SİSTEMİNDE KONKORDATO UYGULAMASININ İSLAM HUKUKU VE EKONOMİSİ AÇISINDAN DEĞERLENDİRİLMESİ,10.29029/busbed.823718,https://doi.org/10.29029/busbed.823718
Vahyin Nüzûl Sürecinde Hitabın “Ötekisi” (Tanım- Tutum- Hukuk),10.15869/itobiad.739001,https://doi.org/10.15869/itobiad.739001
"Siyaset, Hukuk ve Cinsel Suçlar: Assange Olayı ve Hukukçu Feminizmin Eleştirisi",10.1501/Fe0001_0000000059,https://doi.org/10.1501/Fe0001_0000000059
Bir Siyaset ve Hukuk Etiği Sorunu Olarak 1982 Anayasasının ‘İktidar Prangası’,10.29224/insanveinsan.280021,https://doi.org/10.29224/insanveinsan.280021
İslâm Hukuk Düşüncesinde İktidarın Kötüye Kullanımını Önleyici İlkeler ve Kurumlar,10.51450/ilmiyat.903880,https://doi.org/10.51450/ilmiyat.903880
Hukuk Devleti ve Kamu Düzeni İlişkisinde Güvenlik Politikalarının Oluşumu,10.36484/liberal.1400587,https://doi.org/10.36484/liberal.1400587
Hukuk Muhakemeleri Kanunu’nun 9,10.56701/shd.1124285,https://doi.org/10.56701/shd.1124285
Bir Hukuk Terimi Olarak Müşterek Lafız ve Fürû-i Fıkha Tesiri,10.69576/ihya.1432231,https://doi.org/10.69576/ihya.1432231
TANZİMAT SONRASI OSMANLI HUKUK SİSTEMİNDE HAPİSHANE KOŞULLARI AÇISINDAN MAHKÛM HAKLARI (1839-1920),10.57083/adaletdergisi.1217771,https://doi.org/10.57083/adaletdergisi.1217771
SAVAŞ TUTSAKLARININ KAMUOYUNDA DİJİTAL GÖSTERİME SUNULMASINDAN DOĞAN İNSANCIL HUKUK SORUNLARI,10.54049/taad.1683728,https://doi.org/10.54049/taad.1683728
ALMANYA FEDERAL CUMHURİYETİ’NDE HUKUK MESLEKLERİNE GİRİŞ ŞART VE USULLERİ,10.54049/taad.1009175,https://doi.org/10.54049/taad.1009175
"İslam Hukuk Sisteminde Şerîat, Kanun ve Yasa (casag) Kavramlarının Etkileşim ve Dönüşümü",10.21547/jss.1576010,https://doi.org/10.21547/jss.1576010
Hukuk Çevirisinde Duygusal Zekânın Önemi ve Karar Mekanizmasına Etkisi,10.29110/soylemdergi.1186587,https://doi.org/10.29110/soylemdergi.1186587
MİLLETLERARASI ÖZEL HUKUKTA ŞİRKETLERİN MERKEZ DEĞİŞİKLİĞİ VE UYGULANACAK HUKUK,10.21492/inuhfd.1550367,https://doi.org/10.21492/inuhfd.1550367
1917 Tarihli Osmanlı Hukūk-ı Âile Kararnâmesi’ne Yöneltilen Eleştiriler,10.32950/rteuifd.558920,https://doi.org/10.32950/rteuifd.558920
Hukuk çevreleri ayrımında Alman Hukuku’nun yeri ve temel özellikleri,10.1501/Hukfak_0000001825,https://doi.org/10.1501/Hukfak_0000001825
Svalbard Takımadası ve Çevresindeki Deniz Alanlarına Yönelik Uluslararası Hukuk Düzenlemelerinin İrdelenmesi,10.25294/auiibfd.632921,https://doi.org/10.25294/auiibfd.632921
Ceza Mahkemesi Kararlarının Hukuk Mahkemesi Kararlarına Etkisi TBK m,10.21492/inuhfd.239938,https://doi.org/10.21492/inuhfd.239938
İslâm Hukuk Tarihinde Yaşamayan Sünnî Mezhepler ve Fuat Sezgin’in Tasnifi,10.16947/fsmia.667360,https://doi.org/10.16947/fsmia.667360
"The Position, Structure and Characteristics of Air Law in The Legal Order",10.30518/jav.348984,https://doi.org/10.30518/jav.348984
Osmanlı Hukuk Sisteminde Yetimlerin Himayesi ve Maddi Haklarının Korunması -Kurumsal Süreç-,10.5281/zenodo.4604902,https://doi.org/10.5281/zenodo.4604902
Uluslararası Hukuk Açısından Ekonomik Yaptırımlar ve ABD’nin Tek Taraflı Yaptırımlarının Kısa Bir Değerlendirilmesi,10.26650/mecmua.2020.78.4.0011,https://doi.org/10.26650/mecmua.2020.78.4.0011
Hukuk Devleti Eksiklikleri Nedeniyle Polonya’ya Karşı Yürütülen Yaptırım Mekanizmasının Doğurduğu Etkiler,10.32957/hacettepehdf.935268,https://doi.org/10.32957/hacettepehdf.935268
19,10.33432/ybuhukuk.735388,https://doi.org/10.33432/ybuhukuk.735388
HUKUKİ ÇOĞULLUK OLGUSUNUN HUKUK DEVLETİ İLKESİ BAKIMINDAN DEĞERLENDİRİLMESİ,10.21492/inuhfd.1114249,https://doi.org/10.21492/inuhfd.1114249
TÜRKİYE’NİN II,10.21547/jss.1226105,https://doi.org/10.21547/jss.1226105
ULUSLARARASI HUKUK METİNLERİNDE GÖÇ OLGUSU VE SIĞINMACILIK ÜZERİNE BİR ARAŞTIRMA,10.14520/adyusbd.1541804,https://doi.org/10.14520/adyusbd.1541804
SAVAŞ ESİRLERİ KONUSUNDA İSLAM HUKUKU KURALLARI İLE ULUSLARARASI İNSANCIL HUKUK KURALLARININ KARŞILAŞTIRILMASI,10.54704/akdhfd.1446652,https://doi.org/10.54704/akdhfd.1446652
Özel Hukuk Kişileri Arasında İdari Sözleşme Yapılabilmesi Olasılığına İlişkin Bir Değerlendirme,10.34246/ahbvuhfd.1312777,https://doi.org/10.34246/ahbvuhfd.1312777
Yargı Kararları Işığında Yabancı Unsurlu İş Sözleşmelerine Uygulanacak Hukuk,10.56701/shd.1571582,https://doi.org/10.56701/shd.1571582
Ataerkil Döngü İçerisindeki Türk Aile Hukuku Alanında Feminist Hukuk Düzenlemeleri,10.54699/andhd.1232553,https://doi.org/10.54699/andhd.1232553
Klasik Dönem Osmanlı Hukuk Sisteminde Yargının Denetimi ve Mehayif Teftişi,10.59054/hed.1501655,https://doi.org/10.59054/hed.1501655
TOPLUMSAL DEĞİŞİMİN HUKUK ÜZERİNE ETKİSİNİ KARL RENNER’İN GÖRÜŞLERİ ÇERÇEVESİNDE AÇIKLAMAK,10.21492/inuhfd.1206471,https://doi.org/10.21492/inuhfd.1206471
"The Impacts of the Contemporary Sunnah Approach on Politics, Law and Education in Modern Egypt",10.52886/ilak.1215993,https://doi.org/10.52886/ilak.1215993
SAĞLIKÇILARA YÖNELİK ULUSLARARASI HUKUK EĞİTİMİNİN GEREKLİLİĞİ: UKRAYNA- RUSYA SAVAŞI ÜZERİNDEN BİR DEĞERLENDİRME,10.52273/sduhfd.1214503,https://doi.org/10.52273/sduhfd.1214503
Revenge Tragedy Revisited: Women and Law in Nina Raine’s Consent,10.29110/soylemdergi.1487991,https://doi.org/10.29110/soylemdergi.1487991
Uluslararası Hukuk Çerçevesinde İsrail-Filistin Çatışması: Devlet Dışı Aktörler ve Meşru Müdafaa,10.20979/ueyd.1469204,https://doi.org/10.20979/ueyd.1469204
Uluslararası Hukuk Belgeleri Işığında Türk Borçlar Hukukunda Çıkar Çatışması,10.53804/izlek.1245603,https://doi.org/10.53804/izlek.1245603
Uluslararası Hukuk Komisyonunun Değişimi: İşlevsel ve Yapısal Denge Arayışı,10.26650/ppil.2023.43.1266596,https://doi.org/10.26650/ppil.2023.43.1266596
Die Historischen und Philosophischen Grundpfeiler Der Zivilrechtsrezeption in Der Republik Türkei und Ihre Wesentliche Bedeutung,/neuhfd.1408504,https://doi.org//neuhfd.1408504
"Doğal Hukuku Yeniden Ziyaret (Kitap Değerlendirmesi: John Finnis, Doğal Hukuk ve Doğal Haklar)",10.1501/Hukfak_0000001795,https://doi.org/10.1501/Hukfak_0000001795
Does the Rise of Naturalism Mean the End of Conceptual Analysis in the Methodology of Jurisprudence?,10.60002/ebyuhfd.1583466,https://doi.org/10.60002/ebyuhfd.1583466
İmam Şâfiî’nin Hukuk Düşüncesindeki Re’y Nosyonuna Dair Epistemolojik Bir İnceleme,10.51447/uluid.1363264,https://doi.org/10.51447/uluid.1363264
Devletlerarası Hukuk Bağlamında Hz,10.5281/zenodo.7444219,https://doi.org/10.5281/zenodo.7444219
UYGUR HUKUKUNDA ŞUF’A (ÖNALIM) HAKKI –UYGUR HUKUK VESİKALARINA GÖRE–,10.34246/ahbvuhfd.1269963,https://doi.org/10.34246/ahbvuhfd.1269963
İhbarcılık Kavramının Karşılaştırmalı Hukuk Işığında Türk Şirketler Hukuku Kapsamında Değerlendirilmesi,10.26650/mecmua.2023.81.3.0001,https://doi.org/10.26650/mecmua.2023.81.3.0001
Sosyal bilgiler öğretmen adaylarının hukuk okuryazarlığı becerilerini geliştirmek: Bir eylem araştırması,10.29000/rumelide.1221524,https://doi.org/10.29000/rumelide.1221524
ULUSLARARASI İNSANCIL HUKUK İNSANSIZ HAVA ARAÇLARININ KULLANILDIĞI OPERASYONLARDA ŞEFFAFLIK YÜKÜMLÜLÜĞÜ YARATIR MI?,10.17755/esosder.1162592,https://doi.org/10.17755/esosder.1162592
METAVERSE’ÜN HUKUK SİSTEMLERİ ÜZERİNDEKİ MUHTEMEL ETKİLERİ VE GLOBAL METAVERSE PAZARI,10.54860/beyder.1203513,https://doi.org/10.54860/beyder.1203513
MACHIAVELLI’S CONCEPTUALIZATION OF HEGEMONY AND POWER IN RELATION WITH INTERNATIONAL LEGAL THOUGHT,10.54842/ustich.1311125,https://doi.org/10.54842/ustich.1311125
Hukuk ve Uygulamada İnsanca Sığınma Üzerine Dünyadan ve Türkiye’den Notlar,10.33433/maruhad.1533643,https://doi.org/10.33433/maruhad.1533643
Uluslararası Hukuk Açısından Libya’daki İstikrar Arayışları ve Demokrasi Deneyimi,10.55024/buyasambid.1166806,https://doi.org/10.55024/buyasambid.1166806
ULUSLARARASI HUKUK BAKIMINDAN KIBRIS SORUNU: 1959 – 1960 ANDLAŞMALARININ HUKUKİ GEÇERLİLİĞİ,10.54704/akdhfd.1487650,https://doi.org/10.54704/akdhfd.1487650
Uluslararası Hukuk Açısından Tahıl Koridoru Andlaşması’nın Kısa Bir Analizi,10.30915/abd.1161930,https://doi.org/10.30915/abd.1161930
William Whewell ve John Stuart Mill’de Ahlâk-Hukuk İlişkisi,10.18505/cuid.852271,https://doi.org/10.18505/cuid.852271
Ortaokul Öğretmenlerinin Hukuk ve Adalet Ders Kitabına Yönelik Görüşlerinin İncelenmesi,10.30703/cije.1184695,https://doi.org/10.30703/cije.1184695
İslâm Hukuk Metodolojisinde Hâs Lafız ve Füru‘-u Fıkha Tesiri,10.33931/dergiabant.1426702,https://doi.org/10.33931/dergiabant.1426702
The Deposition of DefterdĠr AĤmed Pasha and the Rule of Law in Seventeenth-Century Egypt,10.18589/oa.582783,https://doi.org/10.18589/oa.582783
Rethinking State-Law Relations Through the Kelsen-Schmitt Debate: A Critical Introduction,10.37880/cumuiibf.1334339,https://doi.org/10.37880/cumuiibf.1334339
İŞ HUKUKU BAKIMINDAN MOBBING: TÜRK HUKUKU VE KARŞILAŞTIRMALI HUKUK BAĞLAMINDA BİR DEĞERLENDİRME,10.15337/suhfd.1594248,https://doi.org/10.15337/suhfd.1594248
ÖZEL HUKUK SORUNLARININ ÇÖZÜMÜNDE ROMA HUKUKUNA DAYANAN TEMELLERDEN UZAKLAŞILMASININ SONUÇLARI,10.33629/auhfd.848712,https://doi.org/10.33629/auhfd.848712
Hukuk Uygarlaştırıcı Olabilir Mi? Bentham’ın Uluslararası Hukuka Dair Düşünceleri Üzerine Bir Analiz,10.33432/ybuhukuk.1482102,https://doi.org/10.33432/ybuhukuk.1482102
Yükümlülük Kavramının Anavatanı: H,10.56701/shd.1496697,https://doi.org/10.56701/shd.1496697
Legal review in terms of international law of the agreements aiming to prevent vessel-made sea pollution,10.24289/ijsser.279005,https://doi.org/10.24289/ijsser.279005
Kur’an Hükümlerinin Hukuk Sosyolojisi Açısından Değerlendirilmesi -Boşanma Örneği-,10.37697/eskiyeni.425300,https://doi.org/10.37697/eskiyeni.425300
Memlükler’den Osmanlılar’a Geçişte Mısır’da Adlî Teşkilât ve Hukuk (922-931/1517-1525),10.26570/isad.347710,https://doi.org/10.26570/isad.347710
Ortaokul Hukuk ve Adalet Dersi Öğretim Programına İlişkin Öğretmen Görüşlerinin Belirlenmesi,10.24106/kefdergi.2928,https://doi.org/10.24106/kefdergi.2928
HUKUK SOSYOLOJİSİ DER RECHTSWISSENSCHAFTLICHE POSITIVISMÜS - WISSENSCHAFTLICHE METHODE UND POLITISCHE ENTSCHEIDUNG Prof,10.1501/Hukfak_0000000948,https://doi.org/10.1501/Hukfak_0000000948
Uluslararası hukuk bölünüyor mu? Uluslararası hukukun genişlemesi ve farklılaşmasından kaynaklanan zorluklar,10.1501/Hukfak_0000001653,https://doi.org/10.1501/Hukfak_0000001653
AKİT DIŞI BORÇ İLİŞKİLERİNE UYGULANACAK HUKUK HAKKINDAKİ AVRUPA TOPLULUĞU TÜZÜĞÜ (ROMA II),10.1501/Hukfak_0000000275,https://doi.org/10.1501/Hukfak_0000000275
Brüksel 1Bis Tüzüğü İle Avrupa Birliği Genel Veri Koruma Tüzüğü Çerçevesinde Kişisel Verilerin İhlaline İlişkin Özel Hukuk Uyuşmazlıklarında Milletlerarası Yetki Kuralları,10.32957/hacettepehdf.551973,https://doi.org/10.32957/hacettepehdf.551973
FEMİNİST DÜŞÜNCE VE FEMİNİST HUKUK İÇİN RADİKAL BİR KILAVUZ: CATHARINE A,10.33717/deuhfd.642020,https://doi.org/10.33717/deuhfd.642020
ULUSLARARASI DÜZENLEMELER VE İÇ HUKUK ÇERÇEVESİNDE UNUTULMA HAKKI KAPSAMINDA ERİŞİMİN ENGELLENMESİ,10.58820/eruhfd.1683067,https://doi.org/10.58820/eruhfd.1683067
Türk Hukuk Sisteminde Gömülü Sigorta: Alman Modeliyle Mukayeseli Yaklaşım,10.59399/cuhad.1701336,https://doi.org/10.59399/cuhad.1701336
16,10.5281/zenodo.7513168,https://doi.org/10.5281/zenodo.7513168
"HUKUK-İKTİDAR İLİŞKİSİ ÜZERİNE TARİHSEL VE KURAMSAL BİR SORUŞTURMA: CARL SCHMİTT, WALTER BENJAMİN VE GİORGİO AGAMBEN’DE HUKUK-İKTİDAR İLİŞKİSİ",10.53844/flsf.991407,https://doi.org/10.53844/flsf.991407
Amerika’nın İkinci Irak Mücadlesinin Uluslararası Hukuk ve Türkiye’nin Bu Savaşa Katılımının Türk Anayasa Hukuku Açısından Bir Değerlendirilmesi ya da Haklı Savaşın Haksızlığı Üzerine,10.1501/SBFder_0000001560,https://doi.org/10.1501/SBFder_0000001560
Sovereignty-Political Power Distinction as the Theoretical Basis of the Concept of the State of Law -A Comparative Study in the Context of Islamic and Western Legal Thought-,/neuhfd.1433008,https://doi.org//neuhfd.1433008
"Kişi Hakları Kavramının ve Teorisinin Tarihte Kuruluşu : I - Işıklar Felsefesi Amerikan ve Fransız Beyannameleri : I - ""Doğal Hukuk""tan ""Kişisel Haklar""a",10.1501/SBFder_0000001203,https://doi.org/10.1501/SBFder_0000001203
17,10.1501/Hukfak_0000001872,https://doi.org/10.1501/Hukfak_0000001872
"Marka Hukukunda İhtiyati Tedbirlerin 6100 Sayılı Hukuk Muhakemeleri Kanunu Işığında DeğerlendirilmesiThe Consideration of Provisional Injunctions in Trademark Law in the Light of ode of Civil Procedure, No",10.19168/jyu.11717,https://doi.org/10.19168/jyu.11717
HUKUK DAİRESİ’NİN 27 AĞUSTOS 2020 TARİHLİ KARARI: ÖLEN KİŞİNİN KULLANICI HESABINA MİRASÇILARIN TAM ERİŞİM HAKKI VE SOSYAL AĞ SAĞLAYICISININ BUNA İLİŞKİN SORUMLULUĞU,10.33432/ybuhukuk.809179,https://doi.org/10.33432/ybuhukuk.809179
2023 Tarihli Yargıtay Hukuk Genel Kurulu Kararı Işığında Yurt Dışı Hizmet Akdine Uygulanacak Hukuk,10.58733/imhfd.1545345,https://doi.org/10.58733/imhfd.1545345
İş İlişkisinin Tespitinde Takım Kılavuzu ve Alt İşverenlik Ayrımı (Yargıtay Hukuk Genel Kurulu ve 22,10.52273/sduhfd.1541006,https://doi.org/10.52273/sduhfd.1541006
NEL NODDİNGS’İN İHTİMAM ETİĞİ PERSPEKTİFİNDEN HUKUK FAKÜLTELERİNDE GRUP ÇALIŞMALARI: ANKARA ÜNİVERSİTESİ HUKUK FAKÜLTESİ ‘HUKUKA FELSEFEYLE BAKMAK’ GRUBU ÖRNEĞİ,10.33629/auhfd.984131,https://doi.org/10.33629/auhfd.984131
Mukayeseli Hukuk ve Uluslararası Hukuk Persfektifinden İdarî Yargıda Sürelerin Kısaltılması Açısından Kanun Yollarında (Temyiz-İstinaf) Filtreleme ve Bazı Modeller,10.15337/suhfd.1299064,https://doi.org/10.15337/suhfd.1299064
Uluslararası Hukuk Komisyonunun ‘Silahlı Çatışmaların Andlaşmalara Etkisi Hakkındaki Taslak Maddeler’i Üzerine Betimsel Bir İnceleme,10.30915/abd.463735,https://doi.org/10.30915/abd.463735
CUMHURİYETİN İLK YILLARINDA BİR CASUSLUK SUÇLAMASI ÖRNEĞİ: BAYRAKTAR OĞULLARI’NDAN GEMLİKLİ MEHMET TALAT ACUN’UN HUKUK MÜCADELESİ,10.30692/sisad.1342012,https://doi.org/10.30692/sisad.1342012
HUKUK MUHAKEMELERİ KANUNU TASARISI’NIN 1 İLÂ 122,10.1501/Hukfak_0000001539,https://doi.org/10.1501/Hukfak_0000001539
Hanefî Hukuk Düşüncesinde Ayn-Deyn Ayrımı ve Hukukî Düzenlemelere Etkisi -İş ve İstisnâ’ Akdi Örneği-,10.47424/tasavvur.1080677,https://doi.org/10.47424/tasavvur.1080677
HUKUKUN ARAÇSALLAŞTIRILMASI YOLUYLA HUKUK DEVLETİ İLKESİNDE AŞINMA: AVRUPA KONSEYİ ÜLKELERİNDEN DENEYİMLER,10.33629/auhfd.1080812,https://doi.org/10.33629/auhfd.1080812
HANNA ARENDTS KONZEPT DER HEIMAT UND SEINER VERMITTLUNG IM DEMOKRATISCHEN RECHTSSTAAT,10.54704/akdhfd.1189749,https://doi.org/10.54704/akdhfd.1189749
"Savaş ve Barış Ahlâkı: Dinî Metinler, Uluslararası Hukuk ve Sivil Toplum Örgütleri Zemininde Bir Yaklaşım",10.30523/mutefekkir.1405315,https://doi.org/10.30523/mutefekkir.1405315
2017 Anayasa Değişikliklerinin Siyasi İktidarın Hukuk Devleti İlkesi Aracılığıyla Sınırlandırılması Bağlamında Değerlendirilmesi,10.52273/sduhfd.1462848,https://doi.org/10.52273/sduhfd.1462848
POST-WITHDRAWAL LEGAL IMPLICATIONS OF INTERNATIONAL AGREEMENTS CONCLUDED WITHIN THE FRAMEWORK OF THE EU LEGAL ORDER FOR THE WITHDRAWING MEMBER STATE,10.32450/aacd.770858,https://doi.org/10.32450/aacd.770858
İzmir Bakırçay Üniversitesi Hukuk Fakültesi Eğitimine Katkı Sağlamak Amacıyla Stajyer Avukat Eğitimi Veren Avukatlara Yapılan Anket Sonuçlarının Analizi,10.15337/suhfd.773084,https://doi.org/10.15337/suhfd.773084
TUNUSLU HAYREDDİN PAŞA’NIN OSMANLI DEVLETİ’NDE REFORM ÖNERİLERİ: HUKUK DEVLETİ BAĞLAMINDA BİR İNCELEME,10.25272/j.2149-8539.2019.5.3.3,https://doi.org/10.25272/j.2149-8539.2019.5.3.3
"KÖLELİK, ZORLA ÇALIŞTIRMA VE BENZER UYGULAMALARA İLİŞKİN YASAĞIN ULUSLARARASI HUKUK VE AİHM İÇTİHATLARI ÇERÇEVESİNDE GELİŞİMİ",10.33432/ybuhukuk.553022,https://doi.org/10.33432/ybuhukuk.553022
Hukuk ve İdare Mahkemeleri Kararları Işığında Bilgi İletişim Teknolojileri ve E-Devlet’e İlişkin Hukuki Düzenlemeler,10.34232/pjess.461901,https://doi.org/10.34232/pjess.461901
GÜRÜLTÜ KİRLİLİĞİ KAVRAMI VE GÜRÜLTÜ KİRLİLİĞİNE SEBEP OLANLARIN ÖZEL HUKUK BAĞLAMINDA SORUMLULUĞUNUN BELİRLENMESİ,10.52273/sduhfd.1008888,https://doi.org/10.52273/sduhfd.1008888
İslâm Hukuk Usûlünde Bir Tahsis Yöntemi Olarak Gâye Delili (Gâye Edatları Özelinde Bir İnceleme),10.59777/ihad.1245780,https://doi.org/10.59777/ihad.1245780
"İslâm Hukuk Düşüncesinde Örfün Yeri, İşlevi ve Güncel Fıkhî Meselelere Etkisi",10.70971/akademikus.1566358,https://doi.org/10.70971/akademikus.1566358
Mimarlık ve Hukuk İlişkisi Bağlamında Ankara Adliyesi Balgat Ek Hizmet Binası Üzerine Notlar,10.30915/abd.769374,https://doi.org/10.30915/abd.769374
ANTALYA BÖLGE ADLİYE MAHKEMESİ 6,10.55009/bilisimhukukudergisi.1212033,https://doi.org/10.55009/bilisimhukukudergisi.1212033
AB İÇİ VE DIŞI YATIRIM ANLAŞMALARINDA DÜZENLENEN UYUŞMAZLIK ÇÖZÜM MEKANİZMALARININ AB HUKUK DÜZENİNİN ÖZERKLİĞİNE UYGUNLUĞU,10.32450/aacd.1327035,https://doi.org/10.32450/aacd.1327035
Rusya’nın Deniz Hukuku Bağlamında Azak Denizi ve Kerç Boğazı’nda Ukrayna’ya Karşı Uluslararası Hukuk İhlalleri,10.56701/shd.1111849,https://doi.org/10.56701/shd.1111849
HUKUK DEVLETİNİN KANUN DEVLETİNE ANAYASAL DEVLETİN ANAYASALI DEVLETE EVİRİLMESİ,10.33629/auhfd.718219,https://doi.org/10.33629/auhfd.718219
Hukuk Disiplininde Yüksek Lisans Yapan Öğrencilerin Akademik Çalışmalarda Zorlanmalarının Yapısal Nedenleri ve Sonuçları Üzerine Bir Değerlendirme,10.59399/cuhad.1645233,https://doi.org/10.59399/cuhad.1645233
Büyük Doğu Japonya Depremi Sonrası Japon Mevzuatında Görülen Eksikliklerin Düzeltilmesi Bağlamında Deprem ve Hukuk,10.33433/maruhad.983394,https://doi.org/10.33433/maruhad.983394
"Bibliometric Analysis of the Turkish Doctoral Dissertations: A Case Study of Economy, Law, Psychology, Political Science, and International Relations Disciplines",10.2399/yod.21.820951,https://doi.org/10.2399/yod.21.820951
Проблемы Юридической Лингвистики Государственного Языка При Переводе на Русский Язык в Республике Казахстан,10.5281/zenodo.13337660,https://doi.org/10.5281/zenodo.13337660
Uluslararası Hukuk Bağlamında Amerika Birleşik Devletleri Başkanı’nın Dış Politika ve Savaş Yetkileri,10.26650/ppil.2022.42.1.1017565,https://doi.org/10.26650/ppil.2022.42.1.1017565
Milletlerarası Hukuk Açısından Dünden Bugüne Taliban ve Taliban’ın Hükümet Olarak Tanınıp Tanınmayacağı Meselesi,10.26650/ppil.2022.42.1.1030645,https://doi.org/10.26650/ppil.2022.42.1.1030645
Modern Hukuk Karşısında Örfi Hukukun Varlığını Sürdürme Nedenleri Üzerine Sosyolojik Bir Araştırma: Şanlıurfa Örneği,10.33709/ictimaiyat.1317175,https://doi.org/10.33709/ictimaiyat.1317175
"MİRASÇININ MİRASBIRAKANI ARAYIP SORMAMASI, MİRASBIRAKANA İLGİ GÖSTERMEMESİ, ANNE VE BABASINA HABER VERMEDEN ONLARIN TANIMADIĞI BİRİYLE EVLENMESİ MİRASÇILIKTAN ÇIKARMA SEBEBİ OLABİLİR Mİ? YARGITAY 3",10.33629/auhfd.1211683,https://doi.org/10.33629/auhfd.1211683
YAPAY ZEKA SİSTEMLERİNİN SİBER SUÇLARLA MÜCADELEDEKİ ROLÜ: BİLİŞİM VE ULUSLARARASI HUKUK İNCELEMESİ,10.34246/ahbvuhfd.1306712,https://doi.org/10.34246/ahbvuhfd.1306712
YOKSULLUK NAFAKASINDA SÜRE SORUNUNUN ANAYASAL VE MEDENİ HUKUK BOYUTUYLA TARTIŞILMASI VE BİR ÖNERİ OLARAK BOŞANMA TAZMİNATI,10.47136/asbuhfd.1059706,https://doi.org/10.47136/asbuhfd.1059706
ANAYASA MAHKEMESİNİN KADIN HAKLARINA DAİR KARARLARINDAKİ DEĞİŞİMİN PIERRE BOURDIEU’NUN HUKUK TEORİSİ ÇERÇEVESİNDE DEĞERLENDİRİLMESİ,10.33432/ybuhukuk.1098987,https://doi.org/10.33432/ybuhukuk.1098987
TARAFLARIN İFA YERİ ANLAŞMASI YAPARAK HUKUK MUHAKEMELERİ KANUNU’NUN YETKİ SÖZLEŞMESİNE İLİŞKİN HÜKÜMLERİNİ DOLANMALARI,10.34246/ahbvuhfd.1202508,https://doi.org/10.34246/ahbvuhfd.1202508
Makâsıd Teorisinin İslam Hukuk Felsefesine Evrilmesi Süreci: Muhammed Mustafavî’nin Fıkhu’l-felsefe Eseri Örneğinde Bir İnceleme,10.35415/sirnakifd.1442646,https://doi.org/10.35415/sirnakifd.1442646
GÜVENLİ BÖLGELERİN ULUSLARARASI HUKUK AÇISINDAN DEĞERLENDİRİLMESİ VE TÜRKİYE’NİN SURİYE’DE TESİS ETTİĞİ GÜVENLİ BÖLGE UYGULAMALARI,10.17755/esosder.1392971,https://doi.org/10.17755/esosder.1392971
5718 SAYILI MÖHUK ÇERÇEVESİNDE TELİF HAKKINA İLİŞKİN SÖZLEŞMENİN ESASINA UYGULANACAK HUKUK,10.55027/tfm.1050385,https://doi.org/10.55027/tfm.1050385
FİKİR VE SANAT ESERLERİ KANUNU’NDAKİ DEĞİŞİKLİKLERİN HAK SAHİPLERİNE ETKİSİ: YARGITAY HUKUK GENEL KURULU’NUN 01,10.55027/tfm.1459631,https://doi.org/10.55027/tfm.1459631
Uluslararası Hukuk Çerçevesinden Arktik Güvenliği Politikalarının Analizi: Rusya ve ABD Örneği,10.17134/khosbd.405686,https://doi.org/10.17134/khosbd.405686
التشهير الاعلامي حقيقته وإثاره دارسة مقارنة بين الشريعة الإسلامية والقانون,10.30523/mutefekkir.130219,https://doi.org/10.30523/mutefekkir.130219
Law Students’ perceptions about online instruction of professional foreign language course during Covid-19 pandemic,10.47806/ijesacademic.848417,https://doi.org/10.47806/ijesacademic.848417
TRAFİK KAZALARI NEDENİYLE İLERİ SÜRÜLEN DESTEKTEN YOKSUN KALMA TALEPLERİNE İLİŞKİN YARGITAY HUKUK GENEL KURULU’NUN 15,10.19168/jyu.89981,https://doi.org/10.19168/jyu.89981
Türk Hukuk Sisteminde Ölçülülük İlkesini Konu Edinen Başat Kurallar (Osmanlı’dan Günümüze Tarihsel Bir Değerlendirme),10.17233/sosyoekonomi.2019.04.11,https://doi.org/10.17233/sosyoekonomi.2019.04.11
"Halim M‘, Mohamad Ali N",10.26650/di.2024.35.1562636,https://doi.org/10.26650/di.2024.35.1562636
The effect of metaconceptual teaching activities on 7th grade students’ understandings of and attitudes towards law related concepts,10.19128/turje.657698,https://doi.org/10.19128/turje.657698
H,10.56701/shd.1581851,https://doi.org/10.56701/shd.1581851
"İslam Hukuk Mantığı ve Felsefesi, yazar Ahmet Aydın (Ankara Kitabe Yayınları, 2023), 128 Sayfa, ISBN 9786259951058",10.51575/atebe.1566319,https://doi.org/10.51575/atebe.1566319
BİR SAVAŞ STRATEJİSİ OLARAK CİNSEL ŞİDDETİN FEMİNİST TEORİ VE ULUSLARARASI HUKUK AÇISINDAN DEĞERLENDİRİLMESİ,10.54842/ustich.1176248,https://doi.org/10.54842/ustich.1176248
Uluslararası İnsancıl Hukukun İnsandışılaştırılması: Otonom Silah Sistemlerinin Uluslararası İnsancıl Hukuk Üzerindeki Potansiyel Etkisi Üzerine Bir Analiz,10.54627/gcd.1112457,https://doi.org/10.54627/gcd.1112457
SICAK SAVAŞTAN HUKUK SAVAŞINA: BİR MORAL ÜSTÜNLÜK MÜCADELESİ OLARAK AZERBAYCAN’IN VE ERMENİSTAN’IN ULUSLARARASI HUKUKTAKİ GİRİŞİMLERİ,10.54842/ustich.1176671,https://doi.org/10.54842/ustich.1176671
Uluslararası Hukuk Açısından Dağlık Karabağ Sorunu ve İkinci Dağlık Karabağ Savaşı’nı Sona Erdiren Ateşkes Andlaşması,10.26650/mecmua.2022.80.3.0010,https://doi.org/10.26650/mecmua.2022.80.3.0010
"A Comparative Legal, Economic and Structural Analysis of Challenging Shareholders’ Resolutions Under Turkish and English Legal Systems",10.33432/ybuhukuk.1267056,https://doi.org/10.33432/ybuhukuk.1267056
ULUSLARARASI HUKUK KAPSAMINDA ÇİN’İN UYGUR VE DİĞER TÜRKÎ MÜSLÜMANLARA YÖNELİK İNSAN HAKLARI İHLALLERİNİN SOYKIRIM BAĞLAMINDA İNCELENMESİ,10.34246/ahbvuhfd.1253888,https://doi.org/10.34246/ahbvuhfd.1253888
MAHREM ALANDA SİVİL HUKUK İNŞASI: MAHMUT ESAT BOZKURT’UN MEDENİ KANUN GEREKÇESİ VE EUGEN HUBER KAYNAKÇASI,10.33431/belgi.1308842,https://doi.org/10.33431/belgi.1308842
İslam Hukuk Felsefesi Açısından Toplumsal Değişim Karşısında Kadının Dönüşüm Meselesi -1-,10.30622/tarr.1343814,https://doi.org/10.30622/tarr.1343814
Analyzing the Implementation of Shufʻah ’Preemption Rights’ in the Legal System of Bangladesh within the Framework of Islamic Law,10.20486/imad.1351411,https://doi.org/10.20486/imad.1351411
HUKUK VE İKTİSAT YAKLAŞIMINDAN KURUMSAL İKTİSAT VE ANAYASAL İKTİSAT: FARKLILIKLAR VE BENZERLİKLER ÜZERİNE BİR İNCELEME,10.17755/esosder.677303,https://doi.org/10.17755/esosder.677303
Muallimhâne-i Nüvvâb: Osmanlı Devleti’nde Medreseden Farklı Yeni Hukuk Eğitiminin Öncüsü,10.26650/iuitd.2024.1292651,https://doi.org/10.26650/iuitd.2024.1292651
UNCONSTITUTIONALITY OF CONSTITUTIONAL SHARIA AND CADI COURTS IN NIGERIA AND THE GAMBIA: DISCRIMINATORY TOOLS IN THE LEGAL PROFESSION,10.51562/nkuhukuk.2021222,https://doi.org/10.51562/nkuhukuk.2021222
GİRESUN MİLLETVEKİLİ HAKKI TARIK US’UN HAYATI İLE EĞİTİM VE HUKUK ÜZERİNE TBMM’DEKİ KONUŞMALARI,10.46955/ankuayd.1028381,https://doi.org/10.46955/ankuayd.1028381
Franz L,10.34086/rteusbe.1456287,https://doi.org/10.34086/rteusbe.1456287
18,10.15869/itobiad.328010,https://doi.org/10.15869/itobiad.328010
ANGLOSAKSON VE KITA AVRUPASI HUKUK SİSTEMLERİNDE İDARENİN YARGISAL DENETİMİNİN ORTAYA ÇIKIŞI VE GELİŞİMİ,10.33432/ybuhukuk.537636,https://doi.org/10.33432/ybuhukuk.537636
AVRUPA BİRLİĞİ HUKUK SİSTEMİNDE İKİ TARAFLI KARMA ANLAŞMALAR VE AVRUPA BİRLİĞİ ADALET DİVANI’NIN YARGILAMA YETKİSİ,10.29228/mjes.62,https://doi.org/10.29228/mjes.62
19,10.33629/auhfd.848678,https://doi.org/10.33629/auhfd.848678
Mukayeseli Hukuk ve Yargı Kararları Işığında Elektronik Tebligatın Yapılmış Sayıldığı Tarih,10.15337/suhfd.930262,https://doi.org/10.15337/suhfd.930262
XVI,10.15370/maruifd.679198,https://doi.org/10.15370/maruifd.679198
FIKIH USÛLÜNÜN MEDENÎ KANUNUN YORUMLANMASINA KATKISI -ALİ HİMMET BERKİ’NİN HUKUK MANTIĞI VE TEFSİR İSİMLİ ESERİ ÖRNEĞİNDE-,10.61304/did.902342,https://doi.org/10.61304/did.902342
Rusya’nın Ukrayna İşgali İçin İleri Sürdüğü Gerekçelerin Uluslararası Hukuk Bağlamında Değerlendirmesi,10.56701/shd.1273814,https://doi.org/10.56701/shd.1273814
7251 Sayılı Kanun’la Yapılan Değişikliklerden Sonra İlk Derece Hukuk Mahkemelerinde Tanık Listesinin Sunulma Zamanına İlişkin Uygulamanın Değerlendirilmesi,10.33432/ybuhukuk.1573261,https://doi.org/10.33432/ybuhukuk.1573261
Uluslararası Hukuk Perspektifinden Kadına Karşı Şiddetin Önlenmesi Konusundaki Bölgesel ve Küresel Düzenlemeler ile Yeni Çareler,10.58733/imhfd.1267374,https://doi.org/10.58733/imhfd.1267374
Access to Justice and Human Rights: A Comparative Study of Islamic Jurisprudence and Secular Legal Systems,10.12658/M0766,https://doi.org/10.12658/M0766
Hanefî Hukuk Düşüncesinde Bâtıl veya Fâsid Satım Akdinden Sonra Gerçekleşen Teâtînin Hukuki Mahiyeti,10.47424/tasavvur.1166263,https://doi.org/10.47424/tasavvur.1166263
ŞERH VE BEYAN AYIRIMINDA YAŞANAN ZORLUĞUN OLMASI GEREKEN HUKUK BAKIMINDAN AŞILMASINA DAİR DÜŞÜNCELER,10.58820/eruhfd.1683206,https://doi.org/10.58820/eruhfd.1683206
Redesigning the Turkish Civil Litigation System in the Light of Online Dispute Resolution (ODR),10.60002/ebyuhfd.1563474,https://doi.org/10.60002/ebyuhfd.1563474
Türk Borçlar Kanunu ve Hukuk Muhakemeleri Kanunu’nun imza atamayanlarla ilgili yeni düzenlemesine eleştirel bir bakış,10.1501/Hukfak_0000001657,https://doi.org/10.1501/Hukfak_0000001657
Turgut Özal Üniversitesi Hukuk Fakültesi Anayasa Taslağının İnsan ve Devlet Kavramına Temel Yaklaşımı,10.21492/inuhfd.239847,https://doi.org/10.21492/inuhfd.239847
Res in Commercio veRes Extra Commercium: Roma Hukukçularının Yansımaları ve Modern Hukuk Kategorileri,10.21492/inuhfd.239913,https://doi.org/10.21492/inuhfd.239913
İran’ın Basra Körfeziâni Bloke İhtimali ve Hürmüz Boğazıândan Geçişlerin Uluslararası Hukuk Açısından Analizi,10.17134/sbd.83660,https://doi.org/10.17134/sbd.83660
ULUSLARARASI DOĞAL GAZ ALIM VE SATIM SÖZLEŞMELERİNİN DEĞİŞEN ŞARTLARA GÖRE UYARLANMASI VE UYGULANACAK HUKUK,10.33629/auhfd.760512,https://doi.org/10.33629/auhfd.760512
STRATEJİK DÜŞÜNCE VE POZİTİF HUKUK BAĞLAMINDA REKABET ZEKÂSININ BİLGİ KAYNAKLARI: OTOMOTİV VE İLETİŞİM ENDÜSTRİLERİNDE KARŞILAŞTIRMALI BİR ARAŞTIRMA,10.17130/ijmeb.823042,https://doi.org/10.17130/ijmeb.823042
"The Use of Social Networks and the Need for Social Approval of People in the Fields of Law, Medicine, and Academia in Turkey",10.26650/CONNECTIST2020-0049,https://doi.org/10.26650/CONNECTIST2020-0049
BEDELSİZ SENEDİ KULLANMA SUÇU ÖZELİNDE HUKUK MAHKEMESİ KARARLARININ CEZA MAHKEMESİ KARARLARINA ETKİSİ,10.33432/ybuhukuk.902094,https://doi.org/10.33432/ybuhukuk.902094
Hanefî Hukuk Düşüncesinde Taayyün Olgusu ve Hukukî Düzenlemelere Etkisi: Fâiz Teorisi ve Şirket Akdi Örneği,10.33460/beuifd.1069128,https://doi.org/10.33460/beuifd.1069128
TÜRKİYE İŞ KURUMU TARAFINDAN HAZIRLANAN YURT DIŞI HİZMET AKİTLERİNDEKİ HUKUK SEÇİMİNE DAİR KAYITLARIN GEÇERLİLİĞİ,10.33432/ybuhukuk.1105528,https://doi.org/10.33432/ybuhukuk.1105528
ULUSLARARASI TİCARETTE TEKNİK DÜZENLEMELER BAĞLAMINDA ULUSLARARASI STANDARTLARIN DTÖ YARGILAMASINDA UYGULANACAK HUKUK STATÜSÜ,10.32957/hacettepehdf.1091007,https://doi.org/10.32957/hacettepehdf.1091007
Hukuk ve Sosyolojinin Kesişiminde Ziya Gökalp: İçtimâi Usûl-i Fıkıh Önerisinin Analizi,10.32709/akusosbil.1570776,https://doi.org/10.32709/akusosbil.1570776
7 Ekim 2023 sonrası İsrail işgalinin Gazze sağlık sistemine etkilerinin biyoetik ve uluslararası hukuk açısından değerlendirilmesi,10.21673/anadoluklin.1575156,https://doi.org/10.21673/anadoluklin.1575156
TEREKE BORCUNUN BİR KISMINI ÖDEDİKTEN SONRA MİRASÇININ HÜKMİ RET KARİNESİNDEN YARARLANIP YARARLANAMAYACAĞI MESELESİ VE KONUYA İLİŞKİN YARGITAY HUKUK GENEL KURULUNUN 20,10.54704/akdhfd.1371445,https://doi.org/10.54704/akdhfd.1371445
Reklam ve Çocuk: Uluslararası Hukuk ile Türk Hukukunda Çocuklara Yönelik Reklam Düzenlemelerine İlişkin Değerlendirmeler,10.54699/andhd.1575513,https://doi.org/10.54699/andhd.1575513
PLATFORM ÇALIŞANLARININ HAKLARININ KORUNMASI: TÜRK İŞ HUKUKU VE KARŞILAŞTIRMALI HUKUK BAĞLAMINDA BİR DEĞERLENDİRME,10.21492/inuhfd.1593363,https://doi.org/10.21492/inuhfd.1593363
مقارنة بين الشريعة الإسلامية والقانون الوضعي في مجال اللجوء السياسي,10.55918/islammedeniyetidergisi.1508094,https://doi.org/10.55918/islammedeniyetidergisi.1508094
Mart 2022 Tarihli Fransız Milletlerarası Özel Hukuk Kanunu Tasarısının Genel Hükümlerine Dair Bazı Tespitler,10.56701/shd.1553444,https://doi.org/10.56701/shd.1553444
"ULUSLARARASI HUKUK BAĞLAMINDA FİLİSTİN-İSRAİL ANLAŞMAZLIĞI, BİRLEŞMİŞ MİLLETLER VE ULUSLARARASI TOPLUMUN ROLÜ",10.58702/teyd.1557234,https://doi.org/10.58702/teyd.1557234
A Case Study of Cyanide Gold Mining: The İliç Landslide Analysis from the Perspective of Ecocide and International Law,10.59886/tsbder.1594498,https://doi.org/10.59886/tsbder.1594498
Ürdün Ahvâl-i Şahsiyye Kanununun Osmanlı Hukuk-ı Âile Kararnamesinden Aldığı Madde ve Hükümler,10.26570/isad.1270564,https://doi.org/10.26570/isad.1270564
AN ASSESSMENT OF THE ACCEPTANCE OF MEANINGFUL HUMAN CONTROL AS A NORM OF INTERNATIONAL LAW IN ARMED CONFLICTS USING ARTIFICIAL INTELLIGENCE,10.30915/abd.1143722,https://doi.org/10.30915/abd.1143722
Yargıtay Tarafından Hukuk Uyuşmazlıklarında Verilen “Dosyanın Mahalline İadesi” Kararı,10.56701/shd.1189967,https://doi.org/10.56701/shd.1189967
Hz,10.53336/rumeli.1434110,https://doi.org/10.53336/rumeli.1434110
Klâsik Dönem Osmanlı Hukuk Sisteminde Vakıfların Teftişi ve Evkâf-ı Haremeyn Müfettişliği,10.16971/vakiflar.1505619,https://doi.org/10.16971/vakiflar.1505619
BÖLGE ADLİYE MAHKEMELERİ HUKUK DAİRELERİNİN 2016-2022 YILLARINDAKİ ETKİNLİĞİNİN ANALİZİ VE DEĞERLENDİRİLMESİ,10.54049/taad.1572903,https://doi.org/10.54049/taad.1572903
A Mediator Between Sharia and State Law: Aḥmad al-Khamlīshī’s Legal Thinking and Contribution to Reforms,10.18505/cuid.1340204,https://doi.org/10.18505/cuid.1340204
19,10.5152/JTRI.2024.23244,https://doi.org/10.5152/JTRI.2024.23244
AB Genel Mahkemesi’nin 14 Aralık 2022 Tarihli PKK Kararı’nın Uluslararası Hukuk ve AB Hukuku Perspektifinden Değerlendirilmesi,10.52273/sduhfd.1375949,https://doi.org/10.52273/sduhfd.1375949
Doğu Akdeniz Sorunu Çerçevesinde Avrupa Birliği’nin Türkiye’ye Karşı Aldığı Önlemlerin Uluslararası Hukuk Bakımından Değerlendirilmesi,10.33629/auhfd.1378396,https://doi.org/10.33629/auhfd.1378396
YABANCI UNSURLU ÖZEL HUKUK UYUŞMAZLIKLARINDA YABANCI HUKUKUN İÇERİĞİ HAKKINDA BİLGİ EDİNİLMESİNDE BİLİRKİŞİNİN ROLÜ,10.54049/taad.1140168,https://doi.org/10.54049/taad.1140168
ULUSLARARASI HUKUK AÇISINDAN KUZEY KIBRIS TÜRK CUMHURİYETİ VATANDAŞI OLAN SPORCULARIN ULUSLARARASI MÜSABAKALARA KATILIMI,10.21492/inuhfd.1343905,https://doi.org/10.21492/inuhfd.1343905
IJOUS,10.46614/ijous.1412697,https://doi.org/10.46614/ijous.1412697
HUKUK MUHAKEMELERİ KANUNU’NDA DÜZENLENEN İÇ TAHKİM (HMK M,10.30915/abd.1555949,https://doi.org/10.30915/abd.1555949
Legal and Regulatory Frameworks For Sharī’a Governance Practices in the Islamic Banking Industry of Bangladesh,10.47502/mizan.1332588,https://doi.org/10.47502/mizan.1332588
ULUSLARARASI SUÇLARA YÖNELİK KRİMİNOLOJİK YAKLAŞIMLARIN ULUSLARARASI HUKUK KAPSAMINDA DEĞERLENDİRİLMESİ,10.59909/khm.1347204,https://doi.org/10.59909/khm.1347204
Expecting the Same Results From Dissimilar Legal Texts: An Assessment of Association Agreements of Türkiye and Greece,10.32450/aacd.1344921,https://doi.org/10.32450/aacd.1344921
Is Islamic Legal Literature a Manifestation of Politics? : An Analysis within the Scope of the Narrative Change in Legal Discourse on Istitāba,10.48139/aybukulliye.1357760,https://doi.org/10.48139/aybukulliye.1357760
BEY‘ Bİ’L-VEFÂ’NIN (GERİ ALIM ŞARTIYLA SATIŞIN) MENŞEİ ÜZERİNE BİR KATKI -UYGUR HUKUK VESİKALARINDA BEY‘ Bİ’L-VEFÂ TATBİKATI-,10.52273/sduhfd.1187551,https://doi.org/10.52273/sduhfd.1187551
"Kitleleri ve Şahısları Yönlendirmenin Hukuk Dışı Pratik Bir Aygıtı Olarak ""Linç Kültürü"": Antik Roma (Cumhuriyet Dönemi) Örneği",10.33469/oannes.1107702,https://doi.org/10.33469/oannes.1107702
COMPARISON OF OTTOMAN FAMILY LAW DECREE (HAK) AND ISLAMIC FAMILY LAW IN NIGERIA IN THE FRAMEWORK OF DIVORCE,10.54132/akaf.1207735,https://doi.org/10.54132/akaf.1207735
OSMANLI TAŞRASINDA BİR MEMURUN HUKUK MÜCADELESİ: YABANABAD REJİ MEMURU ZEKERİYA SIRRI EFENDİ DAVASI,10.21550/sosbilder.1239752,https://doi.org/10.21550/sosbilder.1239752
Mirastan Yoksunluk Sebebi Olarak Mirasbırakanın Öldürülmesinin Medeni Hukuk ve İslam Hukuku Açısından İncelenmesi,10.26650/mecmua.2023.81.3.0005,https://doi.org/10.26650/mecmua.2023.81.3.0005
NFT’LEŞTİRİLMİŞ ESERLERDEN KAYNAKLANAN MALİ HAK İHLALLERİNE İLİŞKİN UYUŞMAZLIKLARDA FİKRİ VE SINAİ HAKLAR HUKUK MAHKEMESİ Mİ GÖREVLİDİR?,10.15337/suhfd.1480834,https://doi.org/10.15337/suhfd.1480834
DENİZ HUKUKU REJİMİ ÜZERİNE KUZEY KIBRIS TÜRK CUMHURİYETİ VE GÜNEY KIBRIS RUM YÖNETİMİ’NİN İÇ HUKUK UYGULAMALARI VE ÇIKTILARI,10.35705/bs.751586,https://doi.org/10.35705/bs.751586
İslâm Hukuk Usûlünde Kıyasa Yöneltilen Bir İtiraz Türü: Fesâdü’l-Vaz‘ (Hatalı Kurgulama),10.51575/atebe.1260632,https://doi.org/10.51575/atebe.1260632
Otonom Silah Sistemlerinin ve Doğabilecek Sorumluluk Meselesinin Uluslararası İnsancıl Hukuk Bağlamında Değerlendirilmesi,10.54699/andhd.1386667,https://doi.org/10.54699/andhd.1386667
ULUSLARARASI HUKUK ÇERÇEVESİNDE KANAL İSTANBUL’DAN OLASI GEÇİŞ REJİMLERİ VE MONTRÖ BOĞAZLAR SÖZLEŞMESİ AÇISINDAN TAŞIDIĞI RİSKLER,10.30915/abd.1168580,https://doi.org/10.30915/abd.1168580
İNSAN HAKLARI VE HUKUK BAĞLAMINDA ADALET SİSTEMİNİN SOSYAL BOYUTU: ADLİ SOSYAL HİZMET,10.30520/tjsosci.1051514,https://doi.org/10.30520/tjsosci.1051514
İKİNCİ KARABAĞ SAVAŞI’NDA ERMENİLERİN SİVİLLERE YÖNELİK SALDIRILARININ ULUSLARARASI İNSANCIL HUKUK AÇISINDAN DEĞERLENDİRİLMESİ,10.46849/guiibd.869018,https://doi.org/10.46849/guiibd.869018
KIRGIZ HALKININ ÖRFÎ HUKUK KODİFİKASYONU DENEMESİ OLARAK “ERECELER” VE İSLAM HUKUKU AÇISINDAN ANALİZİ,10.53718/gttad.1099716,https://doi.org/10.53718/gttad.1099716
SHD,10.56701/shd.1400722,https://doi.org/10.56701/shd.1400722
Osmanlı Hukûk-ı Âile Kararnâmesi’nde Hanefî Mezhebinin Görüşü Dışında Kanunlaştırılan Fıkhî Görüşler Ve Analizi,10.34085/buifd.881500,https://doi.org/10.34085/buifd.881500
İslam Hukukunda ve Osmanlı uygulamasında koca şiddetine karşı kadının başvurabileceği hukuk yolları,10.1501/Hukfak_0000001811,https://doi.org/10.1501/Hukfak_0000001811
Karadeniz’de deniz alanı sınırlandırması davası (Romanya/Ukrayna) ve uluslararası hukuk açısından etkileri,10.1501/Hukfak_0000001750,https://doi.org/10.1501/Hukfak_0000001750
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