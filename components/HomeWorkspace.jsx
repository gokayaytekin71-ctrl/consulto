"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";

/* =============================================================================
   DEMO VERİLERİ
   ============================================================================= */
const DEMO_FILE = {
  id: "demo-file-1",
  name: "iddianame.pdf",
  type: "PDF",
  size: "847 KB",
  aiSummary: "İddianame, Ali Veli dahil 13 şüpheli hakkında; kamu ihalesi sürecinde rekabetin engellendiği, yaklaşık maliyetin gerçeğe aykırı belirlendiği, teklif ve kabul işlemlerinin usule aykırı yürütüldüğü iddialarına dayalı olarak ihaleye fesat karıştırma, edimin ifasına fesat karıştırma ve görevi kötüye kullanma suçlamalarını içermektedir.",
  detailedSummary: "Belge; belediye tarafından yürütülen mal ve hizmet alımı süreçlerinde ihale hazırlık işlemleri, yaklaşık maliyet tespiti, teknik şartname düzenlemeleri, tekliflerin değerlendirilmesi, komisyon kararlarının imzalanması ve işin kabulüne ilişkin belgeler üzerinden kamu zararı ve hileli işlem iddialarını değerlendirmektedir. İddianamede, özellikle ihale komisyonu üyelerinin fiili katkısı, kastı, görev alanı ve karar alma sürecindeki etkisi tartışma konusu yapılmıştır.",
  documentType: "İddianame",
  legalKeywords: [
    "ihaleye fesat karıştırma",
    "edimin ifasına fesat karıştırma",
    "görevi kötüye kullanma",
    "kamu zararı",
    "ihale komisyonu sorumluluğu",
    "kast ve iştirak iradesi",
    "yaklaşık maliyet",
    "şüpheden sanık yararlanır ilkesi",
  ],
  keyFacts: [
    "Soruşturma kapsamında Ali Veli dahil 13 şüpheli hakkında değerlendirme yapılmıştır.",
    "Ali Veli'nin ihale komisyonu üyesi sıfatıyla bazı karar ve tutanaklarda imzasının bulunduğu belirtilmiştir.",
    "İddialar, yaklaşık maliyetin hazırlanması, tekliflerin alınması, rekabet koşulları ve kabul işlemleri üzerinde yoğunlaşmaktadır.",
    "Müvekkilin teknik şartname hazırlığına, yaklaşık maliyet hesabına ve yüklenici seçim sürecine fiilen katılıp katılmadığı ayrıca değerlendirilmelidir.",
    "Bilirkişi raporunda kamu zararına elverişli işlem bulunduğu ileri sürülmekle birlikte, kişisel kusur ve illiyet bağı yönünden ayrıştırma yapılması gerekmektedir.",
  ],
  risks: [
    "Komisyon kararlarında imzanın bulunması, savcılık tarafından ihale sürecine iştirak göstergesi olarak yorumlanabilir.",
    "Bilirkişi raporunda kamu zararı ve usulsüzlük tespiti yapılmış olması, mahkeme nezdinde aleyhe değerlendirme riski doğurabilir.",
    "Şüphelilerin toplu biçimde hareket ettiği iddiası, iştirak iradesinin somutlaştırılmadan geniş yorumlanmasına yol açabilir.",
    "Görev tanımı, imza yetkisi ve fiili karar alma süreci dosya içeriğinden net biçimde ayrıştırılmazsa kişisel sorumluluk alanı belirsiz kalabilir.",
  ],
  defenseIssues: [
    "Müvekkilin yalnızca komisyon üyesi sıfatıyla imza atmasının, tek başına kast ve iştirak iradesini ispatlamaya yeterli olmadığı vurgulanmalıdır.",
    "Yaklaşık maliyet, teknik şartname ve kabul işlemlerinde müvekkilin fiili hazırlık, yönlendirme veya menfaat temini rolünün bulunmadığı somut belgelerle ortaya konulmalıdır.",
    "Her sanığın sorumluluğunun şahsiliği ilkesi gereği, toplu isnat yerine Ali Veli bakımından ayrı ve kişiselleştirilmiş değerlendirme yapılması talep edilmelidir.",
    "Bilirkişi raporundaki tespitlerin ceza sorumluluğu için yeterli olup olmadığı; kast, illiyet bağı ve hukuka aykırı menfaat unsurları yönünden tartışılmalıdır.",
  ],
};

const DEMO_WORKSPACES = [
  { id: "ws-1", title: "İhale Fesat Dosyası", subtitle: "Ceza savunması ve delil değerlendirmesi", status: "Aktif" },
  { id: "ws-2", title: "Ankara Tahliye Dosyası", subtitle: "Kira alacağı ve tahliye stratejisi", status: "Beklemede" },
];

const DEMO_DECISIONS = [
  {
    id: "5_Ceza_Dairesi__2021-15352E_2022-11260K",
    court: "Yargıtay 5. Ceza Dairesi",
    code: "2021/15352 E. 2022/11260 K.",
    url: "https://consultohukuk.com/kararlar/5-Ceza-Dairesi__2021-15352E_2022-11260K/",
    tag: "İhale komisyonu üyesinin cezai sorumluluğu – imzanın tek başına yeterli olup olmadığı",
    used_part: "İhale komisyonunda görev alan kişinin cezai sorumluluğu, yalnızca belgelerde imzasının bulunmasına indirgenemez. Sanığın ihale sürecindeki fiili katkısı, karar alma mekanizmasına etkisi, hileli işleme bilerek iştirak edip etmediği ve kastının somut delillerle ortaya konulması gerekir.",
    relevance: "Ali Veli bakımından dosyada yalnızca komisyon kararlarında imza bulunduğu, ancak yaklaşık maliyetin hazırlanması ve teknik değerlendirme sürecine fiilen katılımının açıkça gösterilemediği savunulabileceğinden karar doğrudan önem taşır.",
  },
  {
    id: "Ceza_Genel_Kurulu__2018-412E_2021-96K",
    court: "Yargıtay Ceza Genel Kurulu",
    code: "2018/412 E. 2021/96 K.",
    url: "https://consultohukuk.com/kararlar/Ceza-Genel-Kurulu__2018-412E_2020-335K/",
    tag: "Kastın şahsiliği, iştirak iradesi ve toplu isnadın sınırları",
    used_part: "İştirak halinde işlendiği ileri sürülen suçlarda her sanığın kastı, fiile katkısı ve suçun icrasındaki rolü ayrı ayrı değerlendirilmelidir. Ortak hareket etme iradesi soyut kabul veya varsayıma değil, somut ve denetlenebilir delillere dayanmalıdır.",
    relevance: "İddianamede 13 şüphelinin aynı hukuki değerlendirme içinde ele alınması, Ali Veli yönünden kişiselleştirilmiş kusur ve kast incelemesi yapılmadığı itirazına dayanak oluşturabilir.",
  },
];

const DEMO_STATUTES = [
  {
    id: "tck-235",
    name: "Türk Ceza Kanunu",
    article: "m. 235",
    note: "İhaleye fesat karıştırma",
    content: "(1) Kamu kurum veya kuruluşları adına yapılan mal veya hizmet alım veya satımlarına ya da kiralamalara ilişkin ihalelere fesat karıştıran kişi, üç yıldan yedi yıla kadar hapis cezası ile cezalandırılır.\n\n(2) Aşağıdaki hâllerde ihaleye fesat karıştırılmış sayılır:\n\na) Hileli davranışlarla; ihaleye katılma yeterliğine veya koşullarına sahip olan kişilerin ihaleye veya ihale sürecindeki işlemlere katılmalarını engellemek, ihaleye katılma yeterliğine veya koşullarına sahip olmayan kişilerin ihaleye katılmasını sağlamak.\n\nb) Tekliflerle ilgili olup da ihale mevzuatına veya şartnamelere göre gizli tutulması gereken bilgilere başkalarının ulaşmasını sağlamak.\n\nc) Cebir veya tehdit kullanmak suretiyle ya da hukuka aykırı diğer davranışlarla, ihaleye katılma yeterliğine sahip olan kişilerin ihaleye katılmalarını engellemek.",
  },
  {
    id: "tck-236",
    name: "Türk Ceza Kanunu",
    article: "m. 236",
    note: "Edimin ifasına fesat karıştırma",
    content: "(1) Kamu kurum veya kuruluşları, kamu kurumu niteliğindeki meslek kuruluşları, bunların iştirakiyle kurulmuş şirketler ve bunların bünyesinde faaliyet icra eden vakıflar, kamu yararına çalışan dernekler ya da kooperatifler adına yapılan mal veya hizmet alım veya satımlarına veya kiralamalara ilişkin sözleşmelerin ifasına fesat karıştıran kişi, üç yıldan yedi yıla kadar hapis cezası ile cezalandırılır.\n\n(2) Aşağıdaki fiillerin hileli olarak yapılması hâlinde, edimin ifasına fesat karıştırılmış sayılır:\n\na) İhale kararında veya sözleşmede evsafı belirtilen maldan başka bir malın teslim veya kabul edilmesi.\n\nb) İhale kararında veya sözleşmede belirtilen miktardan eksik malın teslim veya kabul edilmesi.\n\nc) Edimin ihale kararında veya sözleşmede belirtilen sürede ifa edilmemesine rağmen, süresinde ifa edilmiş gibi kabul edilmesi.",
  },
  {
    id: "tck-40",
    name: "Türk Ceza Kanunu",
    article: "m. 40",
    note: "Bağlılık kuralı ve şahsi sorumluluk",
    content: "(1) Suça iştirak için kasten ve hukuka aykırı işlenmiş bir fiilin varlığı yeterlidir. Suçun işlenişine iştirak eden her kişi, diğerinin cezalandırılmasını önleyen kişisel nedenler göz önünde bulundurulmaksızın kendi kusurlu fiiline göre cezalandırılır.\n\n(2) Özgü suçlarda, ancak özel faillik niteliğini taşıyan kişi fail olabilir. Bu suçların işlenişine iştirak eden diğer kişiler ise azmettiren veya yardım eden olarak sorumlu tutulur.\n\n(3) Suça iştirakten dolayı sorumlu tutulabilmek için ilgili suçun en azından teşebbüs aşamasına varmış olması gerekir.",
  },
];

const DEMO_USER_QUESTION = "Sanık Ali Veli'nin müdafiiyim. İddianame ve mevcut deliller kapsamında müvekkil lehine ve aleyhine olan hususları savunma stratejisiyle birlikte değerlendirir misin?";

const DEMO_AI_ANSWER = `### **Dosya Kapsamında İlk Değerlendirme**

Ali Veli, iddianamede ihale komisyonu üyesi sıfatıyla yer almaktadır. Müvekkilin bazı komisyon kararlarında imzası bulunmakla birlikte, teknik şartnamenin hazırlanması, yaklaşık maliyetin belirlenmesi, tekliflerin yönlendirilmesi veya kabul işlemlerinin fiilen organize edilmesi aşamalarına doğrudan katıldığına ilişkin tespitlerin ayrıca somutlaştırılması gerekir.

### **Müvekkil Lehine Değerlendirilebilecek Hususlar**

- Komisyon kararlarında imza bulunması, tek başına **ihaleye fesat karıştırma** veya **edimin ifasına fesat karıştırma** suçları bakımından kastın varlığını göstermeye yeterli değildir. Nitekim [**Yargıtay 5. Ceza Dairesi'nin 2021/15352 E., 2022/11260 K. sayılı kararında**](https://consultohukuk.com/kararlar/5-Ceza-Dairesi__2021-15352E_2022-11260K/) bu husus şu şekilde vurgulanmıştır:

> "İhale komisyonunda görev alan kişinin cezai sorumluluğu, yalnızca belgelerde imzasının bulunmasına indirgenemez. Sanığın ihale sürecindeki fiili katkısı, karar alma mekanizmasına etkisi, hileli işleme bilerek iştirak edip etmediği ve kastının somut delillerle ortaya konulması gerekir."
- Ceza sorumluluğu şahsidir. Bu nedenle 13 şüpheli hakkında ortak anlatım kurulması, Ali Veli yönünden kişiselleştirilmiş kusur değerlendirmesinin eksik bırakıldığı itirazına konu edilebilir.
- Müvekkilin teknik şartname, yaklaşık maliyet ve kabul işlemlerindeki fiili rolü açıkça ortaya konulamıyorsa, isnat edilen eylem ile müvekkil arasında illiyet bağı zayıflar.
- Bilirkişi raporunda usulsüzlük veya kamu zararı ihtimali tartışılsa dahi, bu tespitlerin ayrıca **kast**, **bilerek iştirak** ve **hukuka aykırı menfaat** unsurlarıyla desteklenmesi gerekir.

### **Müvekkil Aleyhine Değerlendirilebilecek Hususlar**

- Müvekkilin ihale komisyonu üyesi olması ve karar/tutanaklarda imzasının bulunması, savcılık tarafından sürece katılım ve onay iradesi olarak ileri sürülebilir.
- Bilirkişi raporunda yaklaşık maliyet, teklif süreci veya kabul işlemleri bakımından usulsüzlük tespiti yapılmışsa, bu durum mahkeme nezdinde aleyhe kanaat oluşturabilir.
- Aynı ihale sürecinde birden fazla şüphelinin benzer yönde hareket ettiği iddiası, iştirak iradesi bakımından savcılık tarafından geniş yorumlanabilir.

### **Savunma Stratejisi**

Savunma hattı; imzanın şekli/kurumsal niteliği, görev alanının sınırları, teknik süreçlere fiili katılımın bulunmaması, kastın somut delillerle ispatlanamaması ve her sanık yönünden ayrı değerlendirme yapılması gerekliliği üzerine kurulmalıdır. Bu kapsamda [**Yargıtay 5. Ceza Dairesi'nin 2021/15352 E., 2022/11260 K. sayılı kararındaki**](https://consultohukuk.com/kararlar/5-Ceza-Dairesi__2021-15352E_2022-11260K/) "cezai sorumluluğun yalnızca belgelerde imza bulunmasına indirgenemeyeceği" yönündeki kabul, Ali Veli bakımından savunmanın merkezine alınmalıdır. Özellikle bilirkişi raporunun ceza sorumluluğu için yeterli olup olmadığı; kast, illiyet bağı ve kişisel kusur yönlerinden ayrıntılı şekilde tartışılmalıdır.`;

const TEXT_TO_SELECT = "Bu kapsamda Yargıtay 5. Ceza Dairesi'nin 2021/15352 E., 2022/11260 K. sayılı kararındaki \"cezai sorumluluğun yalnızca belgelerde imza bulunmasına indirgenemeyeceği\" yönündeki kabul, Ali Veli bakımından savunmanın merkezine alınmalıdır.";

const WORKSPACE_MODES = [
  { id: "general_analysis",        label: "Genel Analiz",        desc: "Dosyayı geniş açıdan analiz eder." },
  { id: "file_strategy",           label: "Dosya Stratejisi",    desc: "Güçlü/zayıf yön ve yol haritası." },
  { id: "contradiction_detection", label: "Çelişki Bul",         desc: "Belge ve beyanlardaki tutarsızlıklar." },
  { id: "evidence_analysis",       label: "Delil Analizi",       desc: "Delillerin ispat gücünü değerlendirir." },
  { id: "document_summary",        label: "Özetle",              desc: "Sade ve kronolojik özet." },
  { id: "petition_draft",          label: "Dilekçe Taslağı",     desc: "Dosya bağlamına göre taslak üretir." },
];

/* =============================================================================
   TUR ADIMLARI – 13 adımlık tam senaryo
   ============================================================================= */
const TOUR_STEPS = [
  // 0 – Karşılama
  {
    target: "center",
    title: "Consülto Çalışma Alanı'na hoş geldiniz",
    description: "Dosyanızı yükledikten sonra Consülto'nun nasıl çalıştığını 13 adımda göstereceğiz. Her adımda 'Sonraki' butonuna tıklayarak ilerleyin.",
    badge: "Tanıtım Turu",
  },
  // 1 – Çalışma alanı pill
  {
    target: "[data-tour='workspace-pill']",
    title: "Çalışma alanları",
    description: "Her dava, dosya veya çalışma için ayrı bir çalışma alanı oluşturursunuz. Mesajlar, kararlar, mevzuat ve notlar bu alanda birlikte yaşar.",
    placement: "bottom-left",
  },
  // 2 – Dosya pill (modal AÇIK DEĞİL)
  {
    target: "[data-tour='file-pill']",
    title: "Yüklediğiniz dosya",
    description: "İddianame buraya yüklenmiş ve AI tarafından analiz edilmiş. Üzerine tıklayınca detaylı profil açılır. Şimdi birlikte açalım.",
    placement: "bottom",
  },
  // 3 – Dosya modal AÇIK
  {
    target: "[data-tour='file-pill']",
    title: "AI dosya analizi",
    description: "İşte yapay zekanın çıkardığı profil: belge türü, temel vakıalar, hukuki anahtar kelimeler, riskler ve savunma noktaları. Bu detaylar tüm sorularınıza otomatik olarak eşlik eder.",
    placement: "left",
    action: "openFileSummary",
  },
  // 4 – Panel toggles
  {
    target: "[data-tour='panel-toggles']",
    title: "Panel kontrolü",
    description: "Kararlar, Mevzuat ve Notlar panellerini istediğiniz zaman gösterip gizleyebilirsiniz. Çalışmanıza göre arayüzü daraltın veya genişletin.",
    placement: "bottom-right",
  },
  // 5 – Mode menu
  {
    target: "[data-tour='mode-menu-anchor']",
    title: "Altı farklı çalışma modu",
    description: "Genel analiz, dosya stratejisi, çelişki bulma, delil analizi, özet ve dilekçe taslağı… Her mod farklı bir uzmanlık alanıdır.",
    placement: "left",
    action: "openModeMenu",
  },
  // 6 – Soru sor (typewriter + animasyonlu cursor + submit)
  {
    target: "[data-tour='send-btn']",
    title: "Sorunuzu sorun",
    description: "Soruyu yazıp Sor butonuna basın. AI hem dosyanızı hem ilgili Yargıtay kararlarını kullanarak yanıt üretir. Şimdi sizin için bir soru yazıp gönderiyoruz.",
    placement: "right",
    action: "typeAndSubmit",
  },
  // 7 – Chat stream
  {
    target: "[data-tour='chat-body']",
    title: "Yanıt canlı olarak akıyor",
    description: "Cevap stream halinde gelir. Aynı anda sağda ilgili Yargıtay kararları ve kanun maddeleri otomatik olarak yerleşir. Yanıtın tamamlanmasını bekleyin.",
    placement: "top",
  },
  // 8 – Kararlar (animasyonlu cursor ile Kaydet)
  {
    target: "[data-tour='decisions-panel']",
    title: "Otomatik Yargıtay kararları",
    description: "İlgili kararlar somut olayla bağlantısı açıklanarak listelenir. Faydalı bulduklarınızı çalışma alanınıza kaydedebilirsiniz. Şimdi bir kararı kaydediyoruz.",
    placement: "left",
    action: "saveOneDecision",
  },
  // 9 – Mevzuat
  {
    target: "[data-tour='statutes-panel']",
    title: "Tespit edilen mevzuat",
    description: "Cevaba esas alınan kanun maddeleri burada listelenir. Tek tıkla maddenin tam metnine ulaşabilirsiniz — deneyebilirsiniz.",
    placement: "left",
  },
  // 10 – Metin seç + nota ekle (gerçek seçim + animasyonlu cursor)
  {
    target: "[data-tour='chat-body']",
    title: "Metin seçip nota dönüştürün",
    description: "Cevaptaki önemli bir cümleyi fareyle seçin; çıkan menüden 'Notlara Ekle' butonuna basın. İşte gösteriyoruz:",
    placement: "top",
    action: "selectAndSaveNote",
  },
  // 11 – Notlar
  {
    target: "[data-tour='notes-panel']",
    title: "Strateji notlarınız",
    description: "AI cevaplarından, seçili metinlerden veya manuel olarak eklediğiniz notlar burada toplanır. Dosya bittiğinde bir savunma haritanız olur.",
    placement: "left",
  },
  // 12 – CTA
  {
    target: "[data-tour='cta-btn']",
    title: "Hazır mısınız?",
    description: "Şimdi kendi dosyanız üzerinde Consülto'yu deneyin. Her zaman buradan turu tekrar başlatabilirsiniz.",
    placement: "top",
    badge: "Tur Tamamlandı",
  },
];

/* =============================================================================
   YARDIMCILAR
   ============================================================================= */
function simulateStream(text, onDelta, onDone, delayMs, chunkSize) {
  let i = 0; let alive = true;
  function tick() {
    if (!alive) return;
    if (i >= text.length) { onDone(); return; }
    onDelta(text.slice(i, i + chunkSize));
    i += chunkSize;
    setTimeout(tick, delayMs);
  }
  setTimeout(tick, delayMs);
  return () => { alive = false; };
}

function renderInline(text, isUser) {
  return String(text || "")
    .split(/(\[\*\*[^\]]+\*\*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g)
    .map((part, i) => {
      const boldLinkMatch = part.match(/^\[\*\*([^\]]+)\*\*\]\(([^)]+)\)$/);
      if (boldLinkMatch) {
        return (
          <a
            key={i}
            href={boldLinkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isUser
                ? "font-black text-white underline underline-offset-2"
                : "font-black text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900 hover:decoration-blue-600"
            }
          >
            {boldLinkMatch[1]}
          </a>
        );
      }

      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isUser
                ? "font-bold text-white underline underline-offset-2"
                : "font-bold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900 hover:decoration-blue-600"
            }
          >
            {linkMatch[1]}
          </a>
        );
      }

      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={i}
            className={isUser ? "font-black text-white" : "font-black text-slate-950"}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }

      return <span key={i}>{part}</span>;
    });
}

function RichText({ text, isUser }) {
  const lines = String(text || "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().split("\n");
  return (
    <div className={isUser ? "space-y-1 text-[12px] leading-6" : "space-y-2 text-[12px] leading-6 text-slate-800"}>
      {lines.map((line, i) => {
        const c = line.trim();
        if (!c) return <div key={i} className="h-1" />;
        if (/^###\s/.test(c))
          return <h4 key={i} className={isUser ? "text-sm font-black text-white" : "mt-2 text-sm font-black text-blue-900"}>{renderInline(c.replace(/^###\s+/, ""), isUser)}</h4>;
        if (/^[-•]\s/.test(c))
          return (
            <div key={i} className={isUser ? "flex gap-2 text-white" : "flex gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-700"}>
              <span className={isUser ? "text-white" : "text-blue-700"}>•</span>
              <span>{renderInline(c.replace(/^[-•]\s+/, ""), isUser)}</span>
            </div>
          );
        return <p key={i} className={isUser ? "text-white" : "text-slate-800"}>{renderInline(c, isUser)}</p>;
      })}
    </div>
  );
}

/* =============================================================================
   ANİMASYONLU MOUSE CURSOR
   ============================================================================= */
function AnimatedCursor({ visible, x, y, pressing }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", left: x, top: y, zIndex: 100000, pointerEvents: "none",
      transform: "translate(-4px, -2px)",
      transition: "left 0.85s cubic-bezier(0.22,1,0.36,1), top 0.85s cubic-bezier(0.22,1,0.36,1), opacity 0.25s",
      filter: pressing ? "drop-shadow(0 4px 12px rgba(59,130,246,0.5))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
    }}>
      <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
        <path
          d="M5 3L5 22L10 17.5L13.5 25L16 24L12.5 17L20 17L5 3Z"
          fill={pressing ? "#3b82f6" : "#0f172a"}
          stroke="white" strokeWidth="2" strokeLinejoin="round"
        />
      </svg>
      {pressing && (
        <div style={{
          position: "absolute", top: -6, left: -6, width: 40, height: 40,
          borderRadius: "50%", border: "3px solid #3b82f6",
          animation: "cursorRipple 0.6s ease-out",
        }} />
      )}
    </div>
  );
}

/* =============================================================================
   TUR — SPOTLIGHT
   ============================================================================= */
function TourSpotlight({ selector }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!selector || selector === "center") { setRect(null); return; }
    function update() {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
    }
    update();
    const iv = setInterval(update, 150);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      clearInterval(iv);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [selector]);

  if (!rect) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
        borderRadius: 18,
        border: "2px solid #3b82f6",
        boxShadow: "0 0 0 4px rgba(59,130,246,0.18), 0 0 32px rgba(59,130,246,0.45)",
        pointerEvents: "none",
        zIndex: 99997,
        animation: "tourPulse 1.6s ease-in-out infinite",
        transition: "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease",
      }}
    />
  );
}

/* =============================================================================
   TUR — TOOLTIP
   ============================================================================= */
function TourTooltip({ step, index, total, onNext, onPrev, onSkip, onFinish }) {
  const [pos, setPos] = useState(null);
  const tooltipRef = useRef(null);

  // Step değiştiğinde target'i merkezleyerek scroll et
  useEffect(() => {
    if (!step || step.target === "center") return;
    const t = setTimeout(() => {
      const el = document.querySelector(step.target);
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 80);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    function recompute() {
      if (!step) return;
      if (step.target === "center") { setPos({ centered: true }); return; }
      const el = document.querySelector(step.target);
      if (!el) { setPos(null); return; }
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const TW = 360;
      const TH = tooltipRef.current?.getBoundingClientRect().height || 220;
      const GAP = 18;

      let top = 0, left = 0, arrow = "top";
      const placement = step.placement || "bottom";

      switch (placement) {
        case "top":
          top = r.top - TH - GAP;
          left = r.left + r.width / 2 - TW / 2;
          arrow = "bottom";
          break;
        case "bottom":
          top = r.bottom + GAP;
          left = r.left + r.width / 2 - TW / 2;
          arrow = "top";
          break;
        case "left":
          top = r.top + r.height / 2 - TH / 2;
          left = r.left - TW - GAP;
          arrow = "right";
          break;
        case "right":
          top = r.top + r.height / 2 - TH / 2;
          left = r.right + GAP;
          arrow = "left";
          break;
        case "bottom-left":
          top = r.bottom + GAP; left = r.left; arrow = "top-left";
          break;
        case "bottom-right":
          top = r.bottom + GAP; left = r.right - TW; arrow = "top-right";
          break;
        case "top-left":
          top = r.top - TH - GAP; left = r.left; arrow = "bottom-left";
          break;
        case "top-right":
          top = r.top - TH - GAP; left = r.right - TW; arrow = "bottom-right";
          break;
        default:
          top = r.bottom + GAP;
          left = r.left + r.width / 2 - TW / 2;
          arrow = "top";
      }

      left = Math.max(12, Math.min(left, vw - TW - 12));
      top = Math.max(12, Math.min(top, vh - TH - 12));

      setPos({ top, left, width: TW, arrow });
    }
    recompute();
    const iv = setInterval(recompute, 150);
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      clearInterval(iv);
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [step]);

  if (!step || !pos) return null;
  const isLast = index === total - 1;

  if (pos.centered) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99998, pointerEvents: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div ref={tooltipRef} style={{
          pointerEvents: "auto",
          width: 400, maxWidth: "calc(100vw - 32px)",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white", borderRadius: 22, padding: "26px 26px 22px",
          boxShadow: "0 28px 70px rgba(0,0,0,0.45)",
          animation: "tooltipFadeIn 0.3s ease",
        }}>
          {step.badge && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 10, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "#fbbf24", marginBottom: 14, padding: "4px 10px", background: "rgba(251,191,36,0.1)", borderRadius: 999, border: "1px solid rgba(251,191,36,0.25)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", animation: "tourDot 1.4s infinite" }} />
              {step.badge}
            </div>
          )}
          <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.3, marginBottom: 10 }}>{step.title}</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: "#cbd5e1", marginBottom: 20 }}>{step.description}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} style={{
                  width: i === index ? 20 : 5, height: 5, borderRadius: 3,
                  background: i === index ? "#3b82f6" : i < index ? "#64748b" : "#334155",
                  transition: "all 0.3s",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {!isLast && (
                <button onClick={onSkip} style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                  color: "#94a3b8", fontSize: 11, fontWeight: 800, padding: "9px 16px",
                  borderRadius: 10, cursor: "pointer",
                }}>Atla</button>
              )}
              <button onClick={isLast ? onFinish : onNext} style={{
                background: "#3b82f6", border: "none", color: "white",
                fontSize: 12, fontWeight: 900, padding: "9px 18px",
                borderRadius: 10, cursor: "pointer", boxShadow: "0 4px 12px rgba(59,130,246,0.4)",
                animation: "tourHintPulse 1.8s ease-in-out infinite",
              }}>{isLast ? "Bitir" : "Başlayalım →"}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const arrowStyle = { position: "absolute", width: 0, height: 0 };
  const arrowSize = 8;
  const arrowColor = "#0f172a";
  let arrowProps = {};
  switch (pos.arrow) {
    case "top":
    case "top-left":
    case "top-right":
      arrowProps = {
        top: -arrowSize,
        left: pos.arrow === "top" ? "50%" : pos.arrow === "top-left" ? 24 : "auto",
        right: pos.arrow === "top-right" ? 24 : "auto",
        transform: pos.arrow === "top" ? "translateX(-50%)" : "none",
        borderLeft: `${arrowSize}px solid transparent`,
        borderRight: `${arrowSize}px solid transparent`,
        borderBottom: `${arrowSize}px solid ${arrowColor}`,
      };
      break;
    case "bottom":
    case "bottom-left":
    case "bottom-right":
      arrowProps = {
        bottom: -arrowSize,
        left: pos.arrow === "bottom" ? "50%" : pos.arrow === "bottom-left" ? 24 : "auto",
        right: pos.arrow === "bottom-right" ? 24 : "auto",
        transform: pos.arrow === "bottom" ? "translateX(-50%)" : "none",
        borderLeft: `${arrowSize}px solid transparent`,
        borderRight: `${arrowSize}px solid transparent`,
        borderTop: `${arrowSize}px solid ${arrowColor}`,
      };
      break;
    case "left":
      arrowProps = {
        left: -arrowSize, top: "50%", transform: "translateY(-50%)",
        borderTop: `${arrowSize}px solid transparent`,
        borderBottom: `${arrowSize}px solid transparent`,
        borderRight: `${arrowSize}px solid ${arrowColor}`,
      };
      break;
    case "right":
      arrowProps = {
        right: -arrowSize, top: "50%", transform: "translateY(-50%)",
        borderTop: `${arrowSize}px solid transparent`,
        borderBottom: `${arrowSize}px solid transparent`,
        borderLeft: `${arrowSize}px solid ${arrowColor}`,
      };
      break;
  }

  return (
    <div ref={tooltipRef} style={{
      position: "fixed", top: pos.top, left: pos.left, width: pos.width,
      zIndex: 99998, pointerEvents: "auto",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      color: "white", borderRadius: 14, padding: "16px 18px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
      animation: "tooltipFadeIn 0.25s ease",
      transition: "top 0.35s cubic-bezier(0.22,1,0.36,1), left 0.35s cubic-bezier(0.22,1,0.36,1)",
    }}>
      <div style={{ ...arrowStyle, ...arrowProps }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "#60a5fa" }}>
          Adım {index + 1} / {total}
        </span>
        <button onClick={onSkip} style={{
          background: "transparent", border: "none", color: "#64748b",
          fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1,
        }} title="Turu kapat">✕</button>
      </div>
      <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.3, marginBottom: 6 }}>{step.title}</div>
      <div style={{ fontSize: 12, lineHeight: 1.6, color: "#cbd5e1", marginBottom: 14 }}>{step.description}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              width: i === index ? 14 : 4, height: 4, borderRadius: 2,
              background: i === index ? "#3b82f6" : i < index ? "#475569" : "#1e293b",
              transition: "all 0.3s",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {index > 0 && (
            <button onClick={onPrev} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
              color: "#94a3b8", fontSize: 11, fontWeight: 800, padding: "6px 10px",
              borderRadius: 8, cursor: "pointer",
            }}>← Geri</button>
          )}
          <button onClick={isLast ? onFinish : onNext} style={{
            background: "#3b82f6", border: "none", color: "white",
            fontSize: 11, fontWeight: 900, padding: "6px 14px",
            borderRadius: 8, cursor: "pointer",
            animation: "tourHintPulse 1.8s ease-in-out infinite",
          }}>{isLast ? "Bitir ✓" : "Sonraki →"}</button>
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   KARAR KARTI
   ============================================================================= */
function DecisionCard({ decision, saved, onToggleSave, hint }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <a
              href={decision.url || `https://consultohukuk.com/kararlar/${decision.id}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-black text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-blue-900 hover:decoration-blue-600"
            >
              {decision.court}
            </a>
            <a
              href={decision.url || `https://consultohukuk.com/kararlar/${decision.id}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 underline decoration-blue-200 underline-offset-2 hover:bg-blue-100 hover:text-blue-900 hover:decoration-blue-600"
            >
              {decision.code}
            </a>
          </div>
          {saved && <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700">Kayıtlı</span>}
        </div>
        <div className="mt-2 flex items-start gap-1.5 text-[11px] font-medium text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="line-clamp-2">{decision.tag}</span>
        </div>
        {decision.used_part && (
          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-blue-800">Yararlanılan Kısım</div>
            <div className="mt-1 line-clamp-3 text-[11px] font-medium leading-5 text-slate-700">{decision.used_part}</div>
            <button onClick={() => setOpen(true)} className="mt-2 rounded-lg bg-white px-2.5 py-1 text-[10px] font-black text-blue-800 shadow-sm hover:bg-blue-100">Detay Gör</button>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={decision.url || `https://consultohukuk.com/kararlar/${decision.id}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center text-[11px] font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700"
          >
            Tam Karar Metni
          </a>
          <button
            data-tour={hint ? "decision-save-btn" : undefined}
            onClick={onToggleSave}
            className={`flex-1 rounded-xl px-2 py-2 text-center text-[11px] font-bold transition-all ${saved ? "bg-slate-800 text-white hover:bg-slate-900" : "border border-blue-100 bg-blue-50 text-blue-800 hover:bg-blue-100"} ${hint && !saved ? "tour-hint-btn" : ""} ${saved && hint ? "tour-saved-flash" : ""}`}>
            {saved ? "Kaydedildi ✓" : "Kaydet"}
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-800">Karar Detayı</div>
                  <h2 className="mt-2 text-lg font-black text-slate-950">{decision.court}</h2>
                  <div className="mt-2 inline-flex rounded-xl bg-blue-700 px-3 py-1 text-xs font-black text-white">{decision.code}</div>
                </div>
                <button onClick={() => setOpen(false)} className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Kapat</button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Konu Etiketi</div>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">{decision.tag}</p>
              </div>
              {decision.used_part && (
                <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-800">Yararlanılan Kısım</div>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">{decision.used_part}</p>
                </div>
              )}
              {decision.relevance && (
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Somut Olayla Bağlantı</div>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">{decision.relevance}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =============================================================================
   MEVZUAT KARTI (tıklanınca detay açar)
   ============================================================================= */
function StatuteCard({ statute }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all relative overflow-hidden cursor-pointer">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-100 group-hover:bg-blue-500 transition-colors" />
        <div className="flex justify-between items-start pl-2 gap-2">
          <div>
            <div className="text-xs font-black text-slate-900">{statute.name}</div>
            <div className="mt-1.5 text-[11px] font-medium text-slate-500">{statute.note}</div>
          </div>
          <div className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg shrink-0">{statute.article}</div>
        </div>
        <div className="mt-3 pl-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          Madde metnini gör
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-800">Kanun Maddesi</div>
                  <h2 className="mt-2 text-lg font-black text-slate-950">{statute.name}</h2>
                  <div className="mt-2 inline-flex rounded-xl bg-blue-700 px-3 py-1 text-xs font-black text-white">{statute.article}</div>
                  <div className="mt-2 text-xs font-bold text-slate-500">{statute.note}</div>
                </div>
                <button onClick={() => setOpen(false)} className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Kapat</button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Madde Metni</div>
                <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700">{statute.content || "Madde metni henüz eklenmedi."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =============================================================================
   DOSYA ÖZETİ MODALİ
   ============================================================================= */
function FileSummaryModal({ file, onClose }) {
  if (!file) return null;
  return (
    <div className="fixed inset-0 z-[99996] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-800">AI Dosya Özeti</div>
              <h2 className="mt-2 text-xl font-black text-slate-950">{file.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-xl bg-white px-3 py-1 text-xs font-bold text-blue-700 shadow-sm">{file.type}</span>
                {file.documentType && <span className="rounded-xl bg-blue-700 px-3 py-1 text-xs font-black text-white shadow-sm">{file.documentType}</span>}
              </div>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Kapat</button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-4">
          {file.aiSummary && <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5"><div className="text-[10px] font-black uppercase tracking-widest text-blue-800">Kısa Özet</div><p className="mt-3 text-sm font-semibold leading-7 text-slate-700">{file.aiSummary}</p></div>}
          {file.keyFacts?.length > 0 && <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Temel Vakıalar</div><div className="mt-3 space-y-2">{file.keyFacts.map((f) => <div key={f} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-700">{f}</div>)}</div></div>}
          {file.risks?.length > 0 && <div className="rounded-3xl border border-red-100 bg-red-50/60 p-5"><div className="text-[10px] font-black uppercase tracking-widest text-red-700">Riskler</div><div className="mt-3 space-y-2">{file.risks.map((r) => <div key={r} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700 shadow-sm">{r}</div>)}</div></div>}
          {file.defenseIssues?.length > 0 && <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5"><div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Savunma / Strateji Notları</div><div className="mt-3 space-y-2">{file.defenseIssues.map((d) => <div key={d} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700 shadow-sm">{d}</div>)}</div></div>}
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   ANA BİLEŞEN
   ============================================================================= */
export default function HomeWorkspace() {
  const [messages, setMessages] = useState([{
    id: "m1", role: "assistant",
    text: "Çalışma masası hazır. Bu alanda aynı dosya üzerinde birden fazla soru sorabilir, kararları kaydedebilir, not alabilir ve dosya ekleyebilirsiniz.",
  }]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("ws-1");
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState("file_strategy");
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [aiDecisions, setAiDecisions] = useState([]);
  const [savedDecisionIds, setSavedDecisionIds] = useState([]);
  const [decisionView, setDecisionView] = useState("ai");
  const [aiStatutes, setAiStatutes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [activeFileSummary, setActiveFileSummary] = useState(null);
  const [visiblePanels, setVisiblePanels] = useState({ decisions: true, statutes: true, notes: true });
  const [selectedChatText, setSelectedChatText] = useState("");

  // Tour
  const TOUR_STORAGE_KEY = "consulto-home-tour-seen";
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Animated cursor
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorX, setCursorX] = useState(0);
  const [cursorY, setCursorY] = useState(0);
  const [cursorPressing, setCursorPressing] = useState(false);

  const chatEndRef = useRef(null);
  const didMountChatScrollRef = useRef(false);
  const dropdownRef = useRef(null);
  const modeMenuRef = useRef(null);
  const selectedTextRef = useRef(null);
  const stopStreamRef = useRef(null);

  const activeWorkspace = useMemo(() => DEMO_WORKSPACES.find((w) => w.id === activeWorkspaceId) || DEMO_WORKSPACES[0], [activeWorkspaceId]);
  const activeMode = useMemo(() => WORKSPACE_MODES.find((m) => m.id === workspaceMode) || WORKSPACE_MODES[0], [workspaceMode]);
  const currentTourAction = useMemo(() => tourActive ? TOUR_STEPS[tourStep]?.action : null, [tourActive, tourStep]);

  useEffect(() => {
    function handleStartHomeTour() {
      let alreadySeen = false;

      try {
        alreadySeen = window.localStorage.getItem(TOUR_STORAGE_KEY) === "true";
      } catch {
        alreadySeen = false;
      }

      if (alreadySeen) return;

      setMessages([
        {
          id: "m1",
          role: "assistant",
          text: "Çalışma masası hazır. Bu alanda aynı dosya üzerinde birden fazla soru sorabilir, kararları kaydedebilir, not alabilir ve dosya ekleyebilirsiniz.",
        },
      ]);
      setInput("");
      setAiDecisions([]);
      setAiStatutes([]);
      setSavedDecisionIds([]);
      setNotes([]);
      setSelectedChatText("");
      clearRealSelection();
      setActiveFileSummary(null);
      setIsModeMenuOpen(false);
      setIsStreaming(false);
      setCursorVisible(false);
      setCursorPressing(false);
      setTourStep(0);
      setTourActive(true);
    }

    window.addEventListener("consulto:start-home-tour", handleStartHomeTour);

    return () => {
      window.removeEventListener("consulto:start-home-tour", handleStartHomeTour);
    };
  }, []);

  useEffect(() => {
    // Tarayıcı, kullanıcı sayfayı daha önce HomeWorkspace konumundayken kapattı/yenilediyse
    // aynı scroll pozisyonunu geri yükleyebilir. Ana sayfa ilk açıldığında bunu engelliyoruz.
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const isHomePage = window.location.pathname === "/";
    if (!isHomePage) return;

    if (window.location.hash === "#canli-demo") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    const scrollTopTimer = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 0);

    return () => window.clearTimeout(scrollTopTimer);
  }, []);

  useEffect(() => {
    // İlk sayfa yüklenişinde çalışırsa ana sayfayı otomatik olarak HomeWorkspace bölümüne indirir.
    // Bu yüzden sadece kullanıcı demo içinde mesaj gönderdikten / tur sırasında mesaj üretildikten sonra çalıştırıyoruz.
    if (!didMountChatScrollRef.current) {
      didMountChatScrollRef.current = true;
      return;
    }

    if (!tourActive && messages.length <= 1) return;

    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, tourActive]);

  useEffect(() => {
    function h(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !tourActive) setIsWorkspaceDropdownOpen(false);
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target) && !tourActive) setIsModeMenuOpen(false);
      if (selectedChatText && selectedTextRef.current && !selectedTextRef.current.contains(e.target) && !tourActive) setSelectedChatText("");
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [selectedChatText, tourActive]);

  function togglePanel(key) { setVisiblePanels((p) => ({ ...p, [key]: !p[key] })); }
  function toggleSaveDecision(id) { setSavedDecisionIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }
  function addNoteText(text, type = "AI Cevabı") {
    const clean = String(text || "").trim();
    if (!clean) return;
    setNotes((p) => [{ id: crypto.randomUUID(), type, text: clean, createdAt: new Date().toISOString() }, ...p]);
  }
  function handleAddManualNote() {
    const clean = newNoteText.trim();
    if (!clean) return;
    setNotes((p) => [{ id: crypto.randomUUID(), type: "Kullanıcı Notu", text: clean, createdAt: new Date().toISOString() }, ...p]);
    setNewNoteText("");
  }
  function deleteNote(id) { setNotes((p) => p.filter((n) => n.id !== id)); }

  // Cevap metnindeki TEXT_TO_SELECT cümlesini DOM'da gerçek olarak seçer (mavi highlight)
  function selectRealTextInChat(targetText) {
    const chatEl = document.querySelector("[data-tour='chat-body']");
    if (!chatEl || !window.getSelection) return false;
    const walker = document.createTreeWalker(chatEl, NodeFilter.SHOW_TEXT, null);
    // Hedef cümleyi normalize ederek metin düğümlerinde ararız.
    // Cümle birden çok <strong>/<span> içinde parçalı olabileceğinden,
    // birleşik düz metin üzerinde global offset hesaplarız.
    const nodes = [];
    let full = "";
    let n;
    while ((n = walker.nextNode())) {
      nodes.push({ node: n, start: full.length, end: full.length + n.textContent.length });
      full += n.textContent;
    }
    const norm = (s) => s.replace(/\s+/g, " ");
    const haystack = norm(full);
    const needle = norm(targetText);
    const idx = haystack.indexOf(needle);
    if (idx === -1) return false;

    // Normalize edilmiş offset'i ham offset'e geri eşlemek için
    // boşlukları sayarak yaklaşık konum buluruz.
    function rawOffsetFromNorm(normTarget) {
      let rawPos = 0, normPos = 0;
      while (rawPos < full.length && normPos < normTarget) {
        const ch = full[rawPos];
        if (/\s/.test(ch)) {
          // normalize ardışık boşlukları teke indirir
          while (rawPos < full.length && /\s/.test(full[rawPos])) rawPos++;
          normPos++; // tek boşluk
        } else {
          rawPos++; normPos++;
        }
      }
      return rawPos;
    }
    const rawStart = rawOffsetFromNorm(idx);
    const rawEnd = rawOffsetFromNorm(idx + needle.length);

    const startInfo = nodes.find((x) => rawStart >= x.start && rawStart < x.end) || nodes.find((x) => rawStart <= x.end);
    const endInfo = nodes.find((x) => rawEnd > x.start && rawEnd <= x.end) || nodes[nodes.length - 1];
    if (!startInfo || !endInfo) return false;

    try {
      const range = document.createRange();
      range.setStart(startInfo.node, Math.max(0, rawStart - startInfo.start));
      range.setEnd(endInfo.node, Math.min(endInfo.node.textContent.length, rawEnd - endInfo.start));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    } catch {
      return false;
    }
  }

  function clearRealSelection() {
    if (window.getSelection) {
      const sel = window.getSelection();
      sel?.removeAllRanges?.();
    }
  }

  function submitQuestion(question) {
    if (!question) return;
    setIsStreaming(true);
    setDecisionView("ai");
    const userMsg = { id: crypto.randomUUID(), role: "user", text: question };
    const botId = crypto.randomUUID();
    setMessages((p) => [...p, userMsg, { id: botId, role: "assistant", text: `${activeMode.label} modunda analiz hazırlanıyor...`, loading: true }]);
    setInput("");
    setTimeout(() => { setAiDecisions(DEMO_DECISIONS); setAiStatutes(DEMO_STATUTES); }, 700);
    setTimeout(() => {
      let streamed = "";
      setMessages((p) => p.map((m) => m.id === botId ? { ...m, text: "", loading: false } : m));
      const stop = simulateStream(DEMO_AI_ANSWER,
        (delta) => { streamed += delta; setMessages((p) => p.map((m) => m.id === botId ? { ...m, text: streamed } : m)); },
        () => { setIsStreaming(false); },
        14, 5);
      stopStreamRef.current = stop;
    }, 1000);
  }

  function handleSubmit(e) {
    e?.preventDefault?.();
    const clean = input.trim();
    if (!clean || isStreaming) return;
    submitQuestion(clean);
  }

  // Cursor'ı bir elemanın merkezine getiren yardımcı
  function moveCursorToSelector(selector, offset = { x: 0, y: 0 }) {
    const el = document.querySelector(selector);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    setCursorX(r.left + r.width / 2 + offset.x);
    setCursorY(r.top + r.height / 2 + offset.y);
    return true;
  }

  function scrollElementToCenter(selector) {
    const el = document.querySelector(selector);
    if (!el) return false;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    return true;
  }


  // Tur orchestration
  useEffect(() => {
    if (!tourActive) return;
    if (tourStep >= TOUR_STEPS.length) { setTourActive(false); return; }
    const step = TOUR_STEPS[tourStep];
    const cleanups = [];
    let stateCleanup = null;

    if (step.action === "openFileSummary") {
      setActiveFileSummary(DEMO_FILE);
      stateCleanup = () => setActiveFileSummary(null);
    }

    if (step.action === "openModeMenu") {
      cleanups.push(setTimeout(() => setIsModeMenuOpen(true), 200));
      stateCleanup = () => setIsModeMenuOpen(false);
    }

    // ADIM 6 — yaz + animasyonlu cursor ile Sor butonuna tıkla
    if (step.action === "typeAndSubmit") {
      setInput("");
      let delay = 200;
      for (let i = 0; i < DEMO_USER_QUESTION.length; i++) {
        const ch = DEMO_USER_QUESTION[i];
        cleanups.push(setTimeout(() => setInput((prev) => prev + ch), delay));
        delay += 24;
      }
      // Yazma bitti: cursor görünür ve Sor butonuna kayar
      const afterTyping = delay + 300;
      cleanups.push(setTimeout(() => {
        setCursorVisible(true);
        // başlangıç: input alanının solundan
        const inputEl = document.querySelector("form textarea");
        if (inputEl) {
          const r = inputEl.getBoundingClientRect();
          setCursorX(r.left + 40);
          setCursorY(r.top + r.height / 2);
        }
      }, afterTyping));
      cleanups.push(setTimeout(() => moveCursorToSelector("[data-tour='send-btn']"), afterTyping + 250));
      cleanups.push(setTimeout(() => setCursorPressing(true), afterTyping + 1100));
      cleanups.push(setTimeout(() => {
        setCursorPressing(false);
        submitQuestion(DEMO_USER_QUESTION);
      }, afterTyping + 1450));
      cleanups.push(setTimeout(() => setCursorVisible(false), afterTyping + 2000));
      stateCleanup = () => { setCursorVisible(false); setCursorPressing(false); };
    }

    // ADIM 8 — animasyonlu cursor ile ilk kararın Kaydet butonuna tıkla
    if (step.action === "saveOneDecision") {
      cleanups.push(setTimeout(() => {
        setCursorVisible(true);
        moveCursorToSelector("[data-tour='decisions-panel']", { x: 0, y: 40 });
      }, 700));

      // Karar kartının altındaki Kaydet butonu bazen panelin altına/Mevzuat sınırına denk geliyor.
      // Önce gerçek Kaydet butonunu görünür alanın merkezine alıyoruz.
      cleanups.push(setTimeout(() => {
        scrollElementToCenter("[data-tour='decision-save-btn']");
      }, 1150));

      cleanups.push(setTimeout(() => moveCursorToSelector("[data-tour='decision-save-btn']"), 1750));
      cleanups.push(setTimeout(() => setCursorPressing(true), 2650));
      cleanups.push(setTimeout(() => {
        setCursorPressing(false);
        setSavedDecisionIds([DEMO_DECISIONS[0].id]);
        // tıklamadan sonra cursor butonda kalsın ki "Kaydedildi ✓" konumu takip edilebilsin
        cleanups.push(setTimeout(() => moveCursorToSelector("[data-tour='decision-save-btn']"), 120));
      }, 3000));
      cleanups.push(setTimeout(() => setCursorVisible(false), 4550));
      stateCleanup = () => { setCursorVisible(false); setCursorPressing(false); };
    }

    // ADIM 10 — gerçek metin seçimi + seçim çubuğu + animasyonlu cursor ile Notlara Ekle
    if (step.action === "selectAndSaveNote") {
      // 1. Cevap metnini DOM'da gerçek olarak seç (mavi highlight)
      cleanups.push(setTimeout(() => {
        const ok = selectRealTextInChat(TEXT_TO_SELECT);
        // Highlight ister başarılı ister değil, seçim çubuğunu göster
        setSelectedChatText(TEXT_TO_SELECT);
      }, 600));
      // 2. Cursor görünür, sol alttan başlat
      cleanups.push(setTimeout(() => {
        setCursorVisible(true);
        const chatEl = document.querySelector("[data-tour='chat-body']");
        if (chatEl) {
          const r = chatEl.getBoundingClientRect();
          setCursorX(r.left + 60);
          setCursorY(r.top + r.height - 80);
        }
      }, 1100));
      // 3. Cursor "Notlara Ekle" butonuna kayar
      cleanups.push(setTimeout(() => moveCursorToSelector("[data-tour='note-add-btn']"), 1800));
      // 4. Cursor tıklar (pressing animasyonu)
      cleanups.push(setTimeout(() => setCursorPressing(true), 2900));
      // 5. Not eklenir, seçim temizlenir
      cleanups.push(setTimeout(() => {
        setCursorPressing(false);
        addNoteText(TEXT_TO_SELECT, "Seçili Metin");
        setSelectedChatText("");
        clearRealSelection();
      }, 3300));
      // 6. Cursor kaybolur
      cleanups.push(setTimeout(() => setCursorVisible(false), 3900));
      stateCleanup = () => {
        setSelectedChatText("");
        clearRealSelection();
        setCursorVisible(false);
        setCursorPressing(false);
      };
    }

    return () => {
      cleanups.forEach((c) => clearTimeout(c));
      if (stateCleanup) stateCleanup();
    };
  }, [tourStep, tourActive]); // eslint-disable-line react-hooks/exhaustive-deps

  function markTourSeen() {
    try {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {
      // localStorage kapalıysa sessiz geç
    }
  }

  function nextStep() {
    setTourStep((s) => Math.min(s + 1, TOUR_STEPS.length - 1));
  }

  function prevStep() {
    setTourStep((s) => Math.max(s - 1, 0));
  }

  function skipTour() {
    markTourSeen();
    setTourActive(false);
  }

  function finishTour() {
    markTourSeen();
    setTourActive(false);
  }

  function restartTour() {
    markTourSeen();
    setMessages([{ id: "m1", role: "assistant", text: "Çalışma masası hazır. Bu alanda aynı dosya üzerinde birden fazla soru sorabilir, kararları kaydedebilir, not alabilir ve dosya ekleyebilirsiniz." }]);
    setInput("");
    setAiDecisions([]);
    setAiStatutes([]);
    setSavedDecisionIds([]);
    setNotes([]);
    setSelectedChatText("");
    clearRealSelection();
    setActiveFileSummary(null);
    setIsModeMenuOpen(false);
    setIsStreaming(false);
    setCursorVisible(false);
    setCursorPressing(false);
    setTourStep(0);
    setTourActive(true);
  }

  const hasSidePanels = visiblePanels.decisions || visiblePanels.statutes || visiblePanels.notes;
  const chatColSpan = !hasSidePanels ? "xl:col-span-12"
    : visiblePanels.notes && (visiblePanels.decisions || visiblePanels.statutes) ? "xl:col-span-5"
    : "xl:col-span-8";

  return (
    <>
      {tourActive && (
        <>
          <TourSpotlight selector={TOUR_STEPS[tourStep]?.target} />
          <TourTooltip
            step={TOUR_STEPS[tourStep]}
            index={tourStep}
            total={TOUR_STEPS.length}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipTour}
            onFinish={finishTour}
          />
        </>
      )}

      <AnimatedCursor visible={cursorVisible} x={cursorX} y={cursorY} pressing={cursorPressing} />

      <section className="relative overflow-hidden py-20 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(191,138,77,0.20),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.18),transparent_30%)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* ================ HERO ================ */}
          <div className="relative mb-14">
            <div className="absolute -top-8 -right-8 w-64 h-64 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#0f172a 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }} />

            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end relative">
              <div>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2.5 rounded-full border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100/40 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-900 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                    </span>
                    Canlı Demo
                  </div>
                  <span className="text-slate-300 font-black">·</span>
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                    13 ADIMLIK TUR
                  </div>
                  <span className="text-slate-300 font-black">·</span>
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                    Bizi Keşfedin!
                  </div>
                </div>

                <h2 className="text-[2.5rem] font-black tracking-tight text-slate-950 sm:text-5xl lg:text-[3.75rem] leading-[1.02]">
                  Dosyanız bir{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 bg-clip-text text-transparent">
                      çalışma masasına
                    </span>
                    <span className="absolute -bottom-1 left-0 right-0 h-3 bg-amber-300/50 -z-0 rounded-sm" />
                  </span>
                  <br className="hidden sm:block" />
                  {" "}dönüşür.
                </h2>

                <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                  İddianame, dilekçe, bilirkişi raporu… Yüklediğiniz her belge AI tarafından profillenir; sorularınıza Yargıtay kararları ve mevzuat eşlik eder, notlarınız çalışma alanında toplanır.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { val: "13", label: "Tanıtım Adımı", color: "text-blue-700" },
                    { val: "6", label: "Çalışma Modu", color: "text-amber-700" },
                    { val: "AI", label: "Karar Önerisi", color: "text-emerald-700" },
                    { val: "∞", label: "Çalışma Alanı", color: "text-slate-900" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur px-4 py-3 shadow-sm">
                      <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-start gap-4 lg:items-end">
                <button
                  onClick={restartTour}
                  disabled={tourActive}
                  className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 px-6 py-5 text-left text-white shadow-[0_12px_30px_rgba(15,23,42,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.4)] disabled:opacity-60 disabled:cursor-not-allowed w-full lg:w-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tourActive ? "bg-emerald-400" : "bg-amber-400"} text-slate-950 transition-transform ${!tourActive && "group-hover:rotate-12"} shadow-lg`}>
                      {tourActive ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    </div>
                    <div>
                      <div className={`text-[10px] font-black uppercase tracking-[0.22em] ${tourActive ? "text-emerald-300" : "text-amber-300"}`}>
                        {tourActive ? "Tur sürüyor" : "Hazır mısınız?"}
                      </div>
                      <div className="mt-1 text-base font-black">
                        {tourActive ? "Adım takip ediliyor" : "Turu Tekrar İzle"}
                      </div>
                      {!tourActive && (
                        <div className="mt-0.5 text-[11px] font-medium text-slate-400">
                          ~2 dakika · Etkileşimli
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {tourActive && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 backdrop-blur px-4 py-2.5 text-xs font-bold text-emerald-800 lg:text-right">
                    Adım <span className="font-black">{tourStep + 1}</span> / {TOUR_STEPS.length}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* ================ /HERO ================ */}

          {/* WORKSPACE SHELL */}
          <div className="rounded-[2rem] border border-slate-200 bg-slate-100 shadow-[0_32px_80px_rgba(15,23,42,0.12)] overflow-hidden">

            {/* HEADER */}
            <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-2xl md:px-5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative" ref={dropdownRef} data-tour="workspace-pill">
                  <button
                    onClick={() => !tourActive && setIsWorkspaceDropdownOpen((p) => !p)}
                    className={`flex items-center justify-between gap-3 rounded-[1.2rem] border p-2 pl-3 pr-3.5 transition-all duration-200 ${isWorkspaceDropdownOpen ? "border-blue-200 bg-blue-50/80 ring-4 ring-blue-50 shadow-md" : "border-slate-200 bg-white shadow-sm hover:border-blue-200 hover:shadow-md"}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                      </div>
                      <div className="text-left">
                        <div className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Aktif Çalışma</div>
                        <div className="text-xs font-black text-slate-900">{activeWorkspace.title}</div>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" className={`text-slate-400 transition-transform duration-200 ${isWorkspaceDropdownOpen ? "rotate-180 text-blue-600" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>

                <div
                  data-tour="file-pill"
                  onClick={() => !tourActive && setActiveFileSummary(DEMO_FILE)}
                  className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#185FA5" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="text-xs font-black text-slate-700">iddianame.pdf</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700 border border-emerald-200">Analiz edildi</span>
                </div>
              </div>

              <div data-tour="panel-toggles" className="ml-3 hidden shrink-0 items-center rounded-[1.3rem] border border-slate-200 bg-white px-2 py-1.5 shadow-sm md:flex gap-1">
                {[
                  { key: "decisions", label: "Kararlar", dot: "bg-blue-600",   count: aiDecisions.length },
                  { key: "statutes",  label: "Mevzuat",  dot: "bg-indigo-600", count: aiStatutes.length },
                  { key: "notes",     label: "Notlar",   dot: "bg-emerald-600",count: notes.length },
                ].map(({ key, label, dot, count }, i) => (
                  <div key={key} className="flex items-center">
                    {i > 0 && <div className="mx-1 h-5 w-px bg-slate-200" />}
                    <button onClick={() => togglePanel(key)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all ${visiblePanels[key] ? "bg-slate-100 text-slate-950" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${visiblePanels[key] ? dot : "bg-slate-300"}`} />
                      {label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${visiblePanels[key] ? "bg-white text-slate-600" : "bg-slate-100 text-slate-400"}`}>{count}</span>
                    </button>
                  </div>
                ))}
              </div>
            </header>

            {/* CONTENT */}
            <div className="grid min-h-0 gap-3 overflow-hidden p-3 xl:grid-cols-12" style={{ height: "620px" }}>

              {/* CHAT */}
              <div className={`min-h-0 ${chatColSpan}`}>
                <div className="flex h-full min-h-[260px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Çalışma Alanı</h3>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">Soru-cevap alanı</p>
                      </div>
                      <div className="flex items-center gap-2" ref={modeMenuRef}>
                        <div className="relative" data-tour="mode-menu-anchor">
                          <button
                            data-tour="mode-btn"
                            onClick={() => !tourActive && setIsModeMenuOpen((p) => !p)}
                            disabled={isStreaming}
                            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm hover:border-blue-200 hover:bg-blue-50/40 disabled:opacity-40 transition-all">
                            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 hidden sm:inline">Mod</span>
                            <span className="text-xs font-black text-slate-900">{activeMode.label}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" className={`text-slate-400 transition-transform ${isModeMenuOpen ? "rotate-180 text-blue-600" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          {isModeMenuOpen && (
                            <div className={`absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_55px_rgba(15,23,42,0.14)] ${tourActive ? "z-[100001]" : "z-50"}`}
                              style={{ animation: "tooltipFadeIn 0.2s ease" }}>
                              <div className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Çalışma Modu Seç</div>
                              {WORKSPACE_MODES.map((mode) => (
                                <button key={mode.id} onClick={() => { setWorkspaceMode(mode.id); if (!tourActive) setIsModeMenuOpen(false); }}
                                  className={`flex w-full items-start justify-between gap-2 rounded-2xl px-3 py-2.5 text-left transition-all ${mode.id === workspaceMode ? "bg-blue-50 text-blue-950" : "text-slate-600 hover:bg-slate-50"}`}>
                                  <div className="min-w-0">
                                    <div className="text-xs font-black">{mode.label}</div>
                                    <div className="mt-0.5 text-[10px] font-medium text-slate-500 line-clamp-1">{mode.desc}</div>
                                  </div>
                                  {mode.id === workspaceMode && <span className="shrink-0 rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-black text-white">Aktif</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div data-tour="chat-body" className="flex-1 space-y-3 overflow-y-auto p-4 relative" style={{ scrollbarWidth: "thin" }}>
                      {messages.map((msg) => {
                        const isUser = msg.role === "user";
                        return (
                          <div key={msg.id} className="flex w-full">
                            <div className={[
                              isUser
                                ? "ml-auto max-w-[78%] rounded-3xl px-5 py-4 text-[12px] leading-6 shadow-sm border border-blue-800 bg-gradient-to-br from-blue-800 to-blue-950 text-white"
                                : "mr-auto w-full rounded-3xl px-5 py-4 text-[12px] leading-6 shadow-sm border border-slate-200 bg-white text-slate-800",
                            ].join(" ")}>
                              <RichText text={msg.text} isUser={isUser} />
                              {!isUser && !msg.loading && msg.id !== "m1" && (
                                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                                  <button onClick={() => addNoteText(msg.text)}
                                    className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                    Notlara Ekle
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} className="h-1" />

                      {selectedChatText && (
                        <div className="sticky bottom-2 z-20 flex justify-center">
                          <div ref={selectedTextRef}
                            className="flex max-w-[92%] items-center gap-2 rounded-2xl border-2 border-blue-300 bg-white/95 px-3 py-2 shadow-[0_8px_24px_rgba(59,130,246,0.25)] backdrop-blur-xl"
                            style={{ animation: "selectionPop 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Seçildi</span>
                            </div>
                            <div className="min-w-0 truncate text-[11px] font-semibold text-slate-600 max-w-[280px]">
                              {selectedChatText.slice(0, 55)}{selectedChatText.length > 55 ? "..." : ""}
                            </div>
                            <button
                              data-tour="note-add-btn"
                              onClick={() => { addNoteText(selectedChatText, "Seçili Metin"); setSelectedChatText(""); clearRealSelection(); }}
                              className={`shrink-0 rounded-xl bg-blue-600 px-3 py-1.5 text-[10px] font-black text-white hover:bg-blue-700 transition-all ${currentTourAction === "selectAndSaveNote" ? "tour-hint-btn" : ""}`}>
                              Notlara Ekle →
                            </button>
                            <button onClick={() => { setSelectedChatText(""); clearRealSelection(); }}
                              className="shrink-0 rounded-xl bg-slate-100 px-2.5 py-1.5 text-[10px] font-black text-slate-500 hover:bg-slate-200">
                              Kapat
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 bg-white p-2.5 z-10">
                      <div className="relative rounded-2xl border-2 border-slate-100 bg-slate-50 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]">
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                          placeholder={`${activeWorkspace.title} kapsamında sorunuzu yazın...`}
                          className="min-h-[52px] w-full resize-none rounded-2xl bg-transparent px-4 pb-12 pt-3 text-[13px] font-medium leading-5 outline-none placeholder:text-slate-400"
                          style={{ scrollbarWidth: "none" }}
                        />
                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                          <button type="button" disabled={isStreaming}
                            className="rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-black text-blue-800 shadow-sm hover:bg-blue-50 disabled:opacity-50">
                            Yeni Karar Ara
                          </button>
                          <button
                            data-tour="send-btn"
                            type="submit"
                            disabled={!input.trim() || isStreaming}
                            className={`rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-black text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none ${currentTourAction === "typeAndSubmit" && input.trim() && !isStreaming ? "tour-hint-btn" : ""}`}>
                            {isStreaming ? "..." : "Sor"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* KARARLAR & MEVZUAT */}
              {(visiblePanels.decisions || visiblePanels.statutes) && (
                <div className="min-h-0 xl:col-span-4 flex flex-col gap-3">
                  {visiblePanels.decisions && (
                    <div data-tour="decisions-panel" className="flex-1 flex h-full min-h-[260px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex-col">
                      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-white/50 px-4 py-3 backdrop-blur-md">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-widest text-blue-900">{decisionView === "ai" ? "Yapay Zeka Buldu" : "Kayıtlı Kararlar"}</div>
                          <div className="mt-0.5 text-[10px] font-bold text-slate-500">{decisionView === "ai" ? `${aiDecisions.length} öneri` : `${savedDecisionIds.length} kayıt`}</div>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          {["ai", "saved"].map((v) => (
                            <button key={v} onClick={() => setDecisionView(v)}
                              className={`rounded-lg px-3 py-1.5 text-[10px] font-black transition-all ${decisionView === v ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                              {v === "ai" ? "Öneriler" : "Kayıtlılar"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
                        {decisionView === "ai" ? (
                          aiDecisions.length ? aiDecisions.map((d, idx) => (
                            <DecisionCard
                              key={d.id}
                              decision={d}
                              saved={savedDecisionIds.includes(d.id)}
                              onToggleSave={() => toggleSaveDecision(d.id)}
                              hint={currentTourAction === "saveOneDecision" && idx === 0}
                            />
                          )) : (
                            <div className="flex flex-col items-center justify-center h-full rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
                              <span className="text-2xl mb-2 opacity-40">⚖️</span>
                              <div className="text-xs font-bold text-slate-500">Soru sorduktan sonra ilgili Yargıtay kararları burada görünür.</div>
                            </div>
                          )
                        ) : (
                          aiDecisions.filter((d) => savedDecisionIds.includes(d.id)).length ? (
                            aiDecisions.filter((d) => savedDecisionIds.includes(d.id)).map((d) => (
                              <DecisionCard key={d.id} decision={d} saved onToggleSave={() => toggleSaveDecision(d.id)} />
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
                              <span className="text-2xl mb-2 opacity-40">⚖️</span>
                              <div className="text-xs font-bold text-slate-500">Henüz kaydedilen karar yok.</div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {visiblePanels.statutes && (
                    <div data-tour="statutes-panel" className="flex-1 flex h-full min-h-[120px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex-col">
                      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-white/50 px-4 py-3">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900">Mevzuat</div>
                          <div className="mt-0.5 text-[10px] font-bold text-slate-500">Tespit edilen kanun maddeleri</div>
                        </div>
                      </div>
                      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
                        {aiStatutes.length ? aiStatutes.map((item) => (
                          <StatuteCard key={item.id} statute={item} />
                        )) : (
                          <div className="flex flex-col items-center justify-center h-full rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
                            <span className="text-2xl mb-2 opacity-40">📚</span>
                            <div className="text-xs font-bold text-slate-500">Henüz mevzuat tespit edilmedi.</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* NOTLAR */}
              {visiblePanels.notes && (
                <div data-tour="notes-panel" className={`min-h-0 ${(visiblePanels.decisions || visiblePanels.statutes) ? "xl:col-span-3" : "xl:col-span-4"}`}>
                  <div className="flex h-full min-h-[260px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex-col">
                    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Strateji & Notlar</h3>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">Dosya içi hatırlatmalar</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50" style={{ scrollbarWidth: "thin" }}>
                      {notes.length ? (
                        <div className="space-y-3">
                          {notes.map((note) => (
                            <div key={note.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                              style={{ animation: "fadeInUp 0.25s ease" }}>
                              <div className={`absolute inset-y-0 left-0 w-1 ${note.type === "Kullanıcı Notu" ? "bg-gradient-to-b from-blue-900 to-blue-500" : note.type === "Seçili Metin" ? "bg-gradient-to-b from-blue-500 to-cyan-400" : "bg-emerald-500"}`} />
                              <div className="pl-2">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest ${note.type === "Kullanıcı Notu" ? "bg-blue-50 text-blue-800" : note.type === "Seçili Metin" ? "bg-cyan-50 text-cyan-700" : "bg-emerald-50 text-emerald-700"}`}>{note.type}</span>
                                  <button onClick={() => deleteNote(note.id)}
                                    className="rounded-lg bg-slate-50 px-2 py-1 text-[9px] font-black text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600">
                                    Sil
                                  </button>
                                </div>
                                <p className="text-[11px] font-medium leading-5 text-slate-700">{note.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
                          <span className="text-2xl mb-2 opacity-40">📝</span>
                          <div className="text-xs font-bold text-slate-500">Henüz not yok</div>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 border-t border-slate-200 bg-white p-3 z-10">
                      <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-3 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]">
                        <textarea
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          placeholder="Yeni not ekle..."
                          className="min-h-[60px] w-full resize-none bg-transparent text-xs font-medium leading-5 text-slate-700 outline-none placeholder:text-slate-400"
                          style={{ scrollbarWidth: "none" }}
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">{newNoteText.trim().length} harf</span>
                          <button onClick={handleAddManualNote} disabled={!newNoteText.trim()}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-black text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-40 hover:-translate-y-0.5">
                            Ekle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white/80 px-6 py-4 sm:flex-row">
              <Link
                href="/calisma-alani"
                data-tour="cta-btn"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800">
                Çalışma alanı oluştur →
              </Link>
              <Link href="/paketler-ucretler"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50">
                Paketleri incele
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FileSummaryModal file={activeFileSummary} onClose={() => setActiveFileSummary(null)} />

      <style
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `
        /* Seçili metin highlight rengi (gerçek window.getSelection) */
        [data-tour=chat-body] ::selection { background: rgba(59,130,246,0.35); color: inherit; }
        [data-tour=chat-body] ::-moz-selection { background: rgba(59,130,246,0.35); color: inherit; }

        @keyframes tourPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(59,130,246,0.18), 0 0 32px rgba(59,130,246,0.45); }
          50% { box-shadow: 0 0 0 8px rgba(59,130,246,0.10), 0 0 48px rgba(59,130,246,0.6); }
        }
        @keyframes tourHintPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.55); transform: scale(1); }
          50% { box-shadow: 0 0 0 10px rgba(59,130,246,0); transform: scale(1.04); }
        }
        .tour-hint-btn {
          animation: tourHintPulse 1.4s ease-in-out infinite;
          position: relative;
          z-index: 1;
        }
        @keyframes savedFlash {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
          50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        .tour-saved-flash { animation: savedFlash 0.9s ease-out 2; }
        @keyframes tourDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.4); }
        }
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes selectionPop {
          0% { opacity: 0; transform: translateY(8px) scale(0.92); }
          60% { transform: translateY(-2px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cursorRipple {
          0% { opacity: 0.8; transform: scale(0.4); }
          100% { opacity: 0; transform: scale(1.5); }
        }
      `,
        }}
      />
    </>
  );
}