// app/kvkk-politikasi/page.js — Consülto KVKK Politikası (basic, yönlendirmesiz, dark uyumlu)

export const metadata = {
  title: "KVKK Politikası — Consülto",
  description:
    "Consülto’nun KVKK Politikası: amaç, kapsam, ilkeler, veri kategorileri, işleme amaçları, saklama, aktarım, güvenlik, başvuru ve güncelleme.",
};

export default function KvkkPolitikasiPage() {
  return (
    <main className="min-h-[60vh] text-slate-100">
      {/* Başlık ve kısa özet */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">KVKK Politikası</h1>
        <p className="mt-3 text-slate-300 text-sm sm:text-base">
          Bu politika; 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) ve ikincil düzenlemeler çerçevesinde
          <strong> Consülto </strong> tarafından yürütülen kişisel veri işleme faaliyetlerinin <em>amaç</em>, <em>kapsam</em>,
          <em>ilkeler</em> ve <em>yönetim esaslarını</em> ortaya koyar. Politika; aydınlatma metinlerimizi tamamlar niteliktedir
          ve şirket içi süreçlerin uyumlu, ölçülü ve şeffaf şekilde yürütülmesini hedefler.
        </p>
      </section>

      {/* Amaç ve kapsam */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">1) Amaç ve Kapsam</h2>
          <p className="mt-2 text-sm text-slate-300">
            Politika; müşteriler, ziyaretçiler, tedarikçiler, iş ortakları ve çalışan adayları dâhil olmak üzere
            Consülto nezdinde işlenen tüm kişisel verileri ve bu verilere ilişkin süreçleri kapsar. Özel nitelikli
            kişisel veriler, KVKK ve ikincil mevzuattaki ek koruma tedbirleri gözetilerek işlenir.
          </p>
        </div>
      </section>

      {/* İlkeler */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">2) Temel İlkeler</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-300 list-disc pl-5">
            <li><strong>Hukuka ve dürüstlük kurallarına uygunluk:</strong> İşleme faaliyetleri mevzuatla uyumludur.</li>
            <li><strong>Doğruluk ve güncellik:</strong> Gerektiğinde güncelleme mekanizmaları işletilir.</li>
            <li><strong>Belirli, açık ve meşru amaç:</strong> İşleme amaçları önceden belirlenir ve duyurulur.</li>
            <li><strong>İşlendikleri amaçla bağlantılı, sınırlı ve ölçülü olma:</strong> Veri minimizasyonu esastır.</li>
            <li><strong>İlgili mevzuatta öngörülen veya amaç için gerekli süre kadar muhafaza:</strong> Süre sonunda silme/yok etme/anonimleştirme uygulanır.</li>
            <li><strong>Şeffaflık ve hesap verebilirlik:</strong> Süreçler kayıt altındadır; denetime açıktır.</li>
          </ul>
        </div>
      </section>

      {/* Roller ve sorumluluklar */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">3) Roller ve Sorumluluklar</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-300 list-disc pl-5">
            <li><strong>Veri Sorumlusu:</strong> Consülto; politika ve prosedürlerden, uygun teknik ve idari tedbirlerin alınmasından sorumludur.</li>
            <li><strong>İşleyen/Tedarikçiler:</strong> Sözleşmelerde belirtilen şartlar ve veri güvenliği hükümlerine uygun davranır.</li>
            <li><strong>Çalışanlar:</strong> Gizlilik taahhüdü ile hareket eder, ihlallerde derhal bildirim yükümlülüğüne sahiptir.</li>
          </ul>
        </div>
      </section>

      {/* Veri kategorileri ve amaçlar */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">4) Veri Kategorileri ve İşleme Amaçları</h2>
          <p className="mt-2 text-sm text-slate-300">İşlenen başlıca veri kategorileri ve örnek amaçlar aşağıdadır:</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ul className="space-y-1 text-sm text-slate-300 list-disc pl-5">
              <li>Kimlik ve iletişim bilgileri — üyelik/iletişim, sözleşme süreçleri, destek.</li>
              <li>Hukuki işlem/işlem güvenliği — talep/şikâyet yönetimi, güvenlik ve denetim.</li>
              <li>Finans/ticari bilgiler — faturalama, tahsilat, muhasebe.</li>
            </ul>
            <ul className="space-y-1 text-sm text-slate-300 list-disc pl-5">
              <li>Kullanım ve log verileri — hizmetin iyileştirilmesi, performans ve güvenlik.</li>
              <li>Pazarlama tercihleri — açık rıza ile bülten/kampanya iletişimi.</li>
              <li>Özel nitelikli veriler — yalnızca kanuni istisna veya açık rıza ile ve ek tedbirlerle.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Saklama ve imha */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">5) Saklama, Silme, Yok Etme ve Anonimleştirme</h2>
          <p className="mt-2 text-sm text-slate-300">
            Veriler; ilgili mevzuatta öngörülen veya işleme amaçları için gerekli süre kadar saklanır. Süre dolduğunda
            periyodik imha prosedürleri işletilerek silme, yok etme veya anonimleştirme yapılır. Süreçler kayıt
            altındadır.
          </p>
        </div>
      </section>

      {/* Aktarım */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">6) Üçüncü Kişilere ve Yurtdışına Aktarım</h2>
          <p className="mt-2 text-sm text-slate-300">
            KVKK’nın 8 ve 9. maddeleri uyarınca; hizmet sağlayıcılarımız, iş ortaklarımız, danışmanlarımız ve kanunen
            yetkili kurumlar ile paylaşım gerekebilir. Yurtdışı aktarım; Kurul kararları ve ilgili mevzuat çerçevesinde,
            yeterli korumanın bulunduğu ülkelere veya taahhüt/izin mekanizmalarıyla gerçekleştirilir.
          </p>
        </div>
      </section>

      {/* Güvenlik tedbirleri */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">7) Teknik ve İdari Tedbirler</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-300 list-disc pl-5">
            <li>Yetki matrisi, erişim kontrolleri ve kayıt yönetimi.</li>
            <li>Şifreleme, ağ ve uygulama güvenliği, yedekleme ve felaket kurtarma.</li>
            <li>Güvenlik duvarı/WAF, güncel yazılım ve zafiyet yönetimi.</li>
            <li>Personel gizlilik taahhütleri, rol tabanlı eğitim ve farkındalık.</li>
            <li>Tedarikçi sözleşmeleri, veri işleyen güvenlik hükümleri ve denetimler.</li>
          </ul>
        </div>
      </section>

      {/* Başvurular ve haklar */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">8) İlgili Kişi Başvuruları ve Haklar</h2>
          <p className="mt-2 text-sm text-slate-300">
            KVKK m.11 kapsamındaki haklarınızı kullanmak için, sistemimizde kayıtlı e‑posta adresinizden
            <strong> info@consulto.com.tr</strong> adresine taleplerinizi iletebilirsiniz. Başvurular mevzuata uygun
            şekilde en geç 30 gün içinde sonuçlandırılır; ek maliyet doğması halinde Kurul tarifesi uygulanabilir.
          </p>
        </div>
      </section>

      {/* Politika yönetimi */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-2 pb-16">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">9) Politikanın Yürürlüğü ve Güncellenmesi</h2>
          <p className="mt-2 text-sm text-slate-300">
            Bu politika, yayımlandığı tarihte yürürlüğe girer. Operasyonel ve mevzuata ilişkin ihtiyaçlar doğrultusunda
            güncellenebilir. Güncel sürüm Consülto tarafından yayımlanan duyurular esas alınarak uygulanır.
          </p>
          <p className="mt-3 text-xs text-slate-400">Yürürlük tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
        </div>
      </section>
    </main>
  );
}
