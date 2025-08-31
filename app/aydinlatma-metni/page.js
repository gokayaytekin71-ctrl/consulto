

// app/aydinlatma-metni/page.js — Consülto KVKK Aydınlatma Metni (basic, yönlendirmesiz, dark uyumlu)

export const metadata = {
  title: "Aydınlatma Metni — Consülto",
  description:
    "Consülto’nun KVKK kapsamındaki aydınlatma metni: veri toplama yöntemleri, amaçlar, aktarım, saklama, haklar ve çerezler.",
};

export default function AydinlatmaMetniPage() {
  return (
    <main className="min-h-[60vh] text-slate-100">
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Kişisel Verilerin İşlenmesine Yönelik Aydınlatma Metni
        </h1>
        <p className="mt-3 text-slate-300 text-sm sm:text-base">
          Bu Aydınlatma Metni; 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca
          <strong> Consülto </strong> tarafından <em>Veri Sorumlusu</em> sıfatıyla gerçekleştirilen kişisel veri
          işleme faaliyetlerine ilişkin olarak; kişisel verilerin toplanma yöntemleri ve hukuki sebepleri,
          işleme amaçları, aktarım, saklama süreleri ve KVKK’nın 11. maddesi kapsamındaki haklarınız hakkında
          bilgi vermek amacıyla hazırlanmıştır.
        </p>
      </section>

      {/* Tanımlar */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">Tanımlar</h2>
          <p className="mt-2 text-sm text-slate-300">
            <strong>Kişisel Veri</strong>; kimliği belirli veya belirlenebilir gerçek kişiye ilişkin her türlü bilgi;
            <strong> Özel Nitelikli Kişisel Veri</strong> ise ırk, etnik köken, siyasi düşünce, din, mezhep,
            dernek/vakıf/ sendika üyeliği, sağlık ve cinsel hayata ilişkin veriler ile biyometrik ve genetik
            verileri ifade eder.
          </p>
        </div>
      </section>

      {/* Toplama Yöntemleri ve Hukuki Sebepler */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">1) Kişisel Verilerin Toplanma Yöntemleri ve Hukuki Sebepler</h2>
          <p className="mt-2 text-sm text-slate-300">
            Verileriniz; web sitemizdeki formlar (üyelik/başvuru/iletişim), destek yazışmaları (e‑posta),
            bildirim/etkinlik süreçleri, sosyal medya hesaplarımız, çağrı merkezi/iletişim kanalları,
            hukuki araçlarımızın kullanımı ve <strong>çerez</strong> teknolojileri aracılığıyla otomatik veya otomatik
            olmayan yollarla; sözlü, yazılı ya da elektronik ortamda toplanabilir.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-300 list-disc pl-5">
            <li>
              <strong>KVKK m.5/2 ve m.6/3</strong> kapsamındaki hallerde (kanuni yükümlülüklerin yerine getirilmesi,
              sözleşmenin kurulması/ifası, bir hakkın tesisi/kullanılması/korunması, meşru menfaat ve fiili
              imkânsızlık durumları) açık rıza aranmaksızın.
            </li>
            <li>
              <strong>KVKK m.5/1 ve m.6/2</strong> kapsamında ise açık rızanız alınarak (pazarlama, kişiselleştirme,
              kampanya/ileti gönderimleri gibi).
            </li>
          </ul>
        </div>
      </section>

      {/* İşleme Amaçları */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">2) Kişisel Verilerin İşlenme Amaçları</h2>
          <h3 className="mt-2 font-medium text-white">A) Açık rıza aranmayan haller (KVKK m.5/2, m.6/3)</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-300 list-disc pl-5">
            <li>Kanuni yükümlülüklerin yerine getirilmesi (muhasebe/vergisel yükümlülükler vb.).</li>
            <li>Sözleşmenin kurulması ve ifası; ürün/hizmet sunumu ve destek süreçleri.</li>
            <li>Olası uyuşmazlıklarda delil oluşturma ve hakların tesisi/kullanılması/korunması.</li>
            <li>Güvenlik, hizmet kalitesi ve süreç iyileştirme amacıyla <em>meşru menfaat</em> kapsamında.</li>
            <li>Alenileştirilmiş verilerin, alenileştirme amacıyla sınırlı şekilde işlenmesi.</li>
          </ul>
          <h3 className="mt-4 font-medium text-white">B) Açık rıza ile gerçekleştirilen faaliyetler (KVKK m.5/1, m.6/2)</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-300 list-disc pl-5">
            <li>Kampanya, duyuru, bülten ve ticari ileti gönderimleri.</li>
            <li>Ürün/hizmet önerileri, kişiselleştirme, hedefleme ve yeniden hedefleme çalışmaları.</li>
            <li>Etkinlik/davet yönetimi ve bilgilendirmeler.</li>
            <li>Yeni ürün/hizmet geliştirme ve memnuniyet/anket süreçleri.</li>
          </ul>
        </div>
      </section>

      {/* Saklama Süresi */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">3) Saklama Süresi</h2>
          <p className="mt-2 text-sm text-slate-300">
            Kişisel veriler, ilgili mevzuatta öngörülen süreler veya işleme amaçları için gerekli makul süre boyunca
            saklanır; amacın ortadan kalkması hâlinde KVKK ve ikincil düzenlemelere uygun olarak silinir, yok edilir
            veya anonim hâle getirilir.
          </p>
        </div>
      </section>

      {/* Aktarım */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">4) Üçüncü Kişilere ve/veya Yurtdışına Aktarım</h2>
          <p className="mt-2 text-sm text-slate-300">
            KVKK ve ilgili mevzuatın izin verdiği ölçüde; bilişim altyapısı (barındırma, bulut, güvenlik),
            bakım/destek, danışmanlık, bankacılık/ödeme, denetim ve hukuk hizmetleri aldığımız tedarikçilerimize,
            iş ortaklarımıza ve grup şirketlerimize; ayrıca kanunen yetkili kamu kurum ve kuruluşlarına aktarım
            yapılabilir. Pazarlama amaçlı aktarım faaliyetleri ise yalnızca açık rızanız mevcutsa yürütülür.
          </p>
        </div>
      </section>

      {/* Haklar ve Başvuru */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">5) KVKK m.11 Kapsamındaki Haklarınız</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-300 list-disc pl-5">
            <li>Verilerinizin işlenip işlenmediğini öğrenme,</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
            <li>İşleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme,</li>
            <li>Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
            <li>KVKK ve ilgili mevzuat uyarınca silinmesini/yok edilmesini isteme,</li>
            <li>Yapılan işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
            <li>Münhasıran otomatik sistemlerle analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
            <li>Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde tazminat talep etme.</li>
          </ul>
          <p className="mt-3 text-sm text-slate-300">
            Başvurularınızı, sistemimizde kayıtlı e‑posta adresinizden <strong>info@consulto.com.tr</strong> adresine
            iletebilirsiniz. Başvurular en geç 30 gün içinde sonuçlandırılır; ek maliyet doğması halinde Kurul
            tarifesi uygulanabilir.
          </p>
        </div>
      </section>

      {/* Çerezler */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2 pb-16">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">6) Çerezler Hakkında Bilgilendirme</h2>
          <p className="mt-2 text-sm text-slate-300">
            Web sitemizde zorunlu, performans ve tercihe yönelik çerezler kullanabiliriz. Çerezler çoğunlukla
            anonim istatistik üretir; açık rızanız bulunan hallerde kişiselleştirme ve pazarlama amacıyla da
            işlenebilir. Tarayıcı ayarlarınız üzerinden çerez kullanımını yönetebilir, mevcut çerezleri silebilir veya
            engelleyebilirsiniz. Çerezlerin kapatılması bazı hizmetlerin kısıtlanmasına yol açabilir.
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Ziyaret istatistikleri için Google Analytics benzeri analiz hizmetleri kullanılabilir. Bu hizmetlere ilişkin
            gizlilik ve çerez politikalarına ait bilgilendirmeler ilgili sağlayıcıların web sitelerinde yer almaktadır.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Not: Bu metin genel çerçeve niteliğindedir. Güncel sürüm ve uygulama esasları için Consülto tarafından
            yayımlanan duyurular esas alınır.
          </p>
        </div>
      </section>
    </main>
  );
}