// app/araclar/infaz-hesaplama/page.js
"use client";

import { useMemo, useState } from "react";

/* Yardımcılar */
function digitsOnly(s = "") { return String(s).replace(/\D/g, ""); }
function fmtThousandsTR(d = "") { return String(d).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function fmtInput(v = "") { return fmtThousandsTR(digitsOnly(v)); }
function parseTR(v) { if (v == null) return 0; const s = String(v).replace(/\./g, ""); const n = Number(s); return isFinite(n) ? n : 0; }

const DAY = 24 * 60 * 60 * 1000;
const DS_CHOICES = [
  { label: "1 yıl", months: 12 },
  { label: "2 yıl", months: 24 },
  { label: "3 yıl", months: 36 },
];

/* Takvimsel toplama – Y/A/G’yi tarih üstünden topla (ay = takvim ayı) */
function addYMD(baseDate, y=0, m=0, d=0) {
  const dt = new Date(baseDate);
  dt.setHours(0,0,0,0);
  dt.setFullYear(dt.getFullYear() + y);
  dt.setMonth(dt.getMonth() + m);
  dt.setDate(dt.getDate() + d);
  return dt;
}
function addDays(baseDate, days) {
  const dt = new Date(baseDate);
  dt.setHours(0,0,0,0);
  return new Date(dt.getTime() + days * DAY);
}
function diffInDays(a, b) {
  const A = new Date(a); A.setHours(0,0,0,0);
  const B = new Date(b); B.setHours(0,0,0,0);
  return Math.round((B - A) / DAY);
}
function formatTRDate(d) {
  if (!d || isNaN(+d)) return "—";
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = String(dt.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

// Yıl/Ay/Gün farkı hesaplama
function diffYMDParts(a, b) {
  if (!a || !b) return { y: 0, m: 0, d: 0 };
  const A = new Date(a); A.setHours(0,0,0,0);
  const B = new Date(b); B.setHours(0,0,0,0);
  let y = B.getFullYear() - A.getFullYear();
  let m = B.getMonth() - A.getMonth();
  let d = B.getDate() - A.getDate();
  if (d < 0) {
    const prevMonth = new Date(B.getFullYear(), B.getMonth(), 0).getDate();
    d += prevMonth; m -= 1;
  }
  if (m < 0) { m += 12; y -= 1; }
  return { y, m, d };
}
function fmtYMDParts(p) {
  const parts = [];
  if (p.y) parts.push(`${p.y} YIL`);
  if (p.m) parts.push(`${p.m} AY`);
  if (p.d) parts.push(`${p.d} gün`);
  return parts.length ? parts.join(" ") : "0 gün";
}

const OFFENSES = [
  { id: "adi", ratio: "1/2", label: "Adi Suçlar (Aşağıdaki suçlar dışındaki tüm suçlar)" },
  { id: "kasten_oldurme", ratio: "3/4", label: "Kasten Öldürme (TCK 81, 82, 83)" },
  { id: "agir_yaralama_yuzde", ratio: "2/3", label: "Neticesi Sebebiyle Ağırlaşmış Yaralama (Yüzde Sürekli Değişikliğe Sebebiyet Verme) (TCK 86, 87/2-d)" },
  { id: "akraba_yaralama_agir", ratio: "2/3", label: "Eşe/üstsoya-altsoya/kardeşe veya savunmasız kişiye karşı kasten yaralama ve neticesi sebebiyle ağırlaşmış yaralama (TCK 86/3-a-b, 87/1,2)" },
  { id: "iskence", ratio: "3/4", label: "İşkence ve Eziyet (TCK 94, 95, 96)" },
  { id: "cinsel_saldiri_basit", ratio: "2/3", label: "Basit Cinsel Saldırı (TCK 102/1)" },
  { id: "cinsel_saldiri_nitelikli", ratio: "3/4", label: "Nitelikli Cinsel Saldırı (TCK 102/2)" },
  { id: "cocuk_istismari", ratio: "3/4", label: "Çocuğun Cinsel İstismarı (TCK 103)" },
  { id: "resit_olmayan_cinsel_104_1", ratio: "2/3", label: "Reşit Olmayanla Cinsel İlişki (TCK 104/1)" },
  { id: "resit_olmayan_nitelikli_104_2", ratio: "3/4", label: "Reşit Olmayanla Cinsel İlişki Suçunun Nitelikli Hali (TCK 104/2)" },
  { id: "cinsel_taciz", ratio: "2/3", label: "Cinsel Taciz (TCK 105)" },
  { id: "teror_3713", ratio: "3/4", label: "Terör Suçu (3713 s. Kanun kapsamındaki suçlar)" },
  { id: "ozel_hayata_karsi", ratio: "2/3", label: "Özel Hayata Karşı Suçlar (TCK 132–138)" },
  { id: "uyusturucu_ticareti_188", ratio: "3/4", label: "Uyuşturucu Ticareti (TCK 188)" },
  { id: "orgut_220", ratio: "3/4", label: "Örgüt Suçları (TCK 220)" },
  { id: "devlet_guvenligi", ratio: "3/4", label: "Devletin Güvenliğine Karşı Suçlar (TCK 302–339)" },
  { id: "mit_2937", ratio: "3/4", label: "MİT Kanunu Kapsamındaki Suçlar (2937 s. Kanun)" },
];



export default function InfazHesaplama() {
  /* Girdiler */
  const [start, setStart] = useState("");                // Cezaevine giriş / infaza başlangıç
  const [offenseDate, setOffenseDate] = useState(""); // Suç tarihi
  const [birth, setBirth] = useState("");             // Doğum tarihi

  // Suç seçimi ve tekerrür
  const [offenseId, setOffenseId] = useState("adi"); // OFFENSES id
  const [offenseOpen, setOffenseOpen] = useState(false); // açılır/kapanır
  const [recidivism, setRecidivism] = useState(false);   // Tekerrüre esas sabıka kaydı

  const selectedOffense = useMemo(() => OFFENSES.find(o => o.id === offenseId) || OFFENSES[0], [offenseId]);

  // Mahsup kontrolü (yok/var + gün)
  const [hasMahsup, setHasMahsup] = useState(false);
  const [mahkup, setMahsup] = useState("");              // mahsup gün (tutukluluk vb.)

  // Özel durum (DS süresini etkileyen)
  const [special, setSpecial] = useState("none");        // none | child | severe

  const [type, setType] = useState("sureli");            // sureli | muebbet | agirmuebbet
  const [y, setY] = useState("");                        // ceza yıl
  const [m, setM] = useState("");                        // ceza ay
  const [d, setD] = useState("");                        // ceza gün
  const [dsMonths, setDsMonths] = useState(12);          // denetimli süresi (ay)

  /* Süreli ceza toplam gün – takvim üstünden */
  const totalDays = useMemo(() => {
    if (type !== "sureli" || !start) return 0;
    const s = new Date(start + "T00:00:00");
    const end = addYMD(s, Number(y||0), Number(m||0), Number(d||0));
    return Math.max(0, diffInDays(s, end));
  }, [type, start, y, m, d]);

  /* Müebbetler için kanuni süre (gün) */
  const lifeDays = useMemo(() => {
    if (type === "muebbet") {
      // 30 yıl
      const s = new Date(start || Date.now());
      const end = addYMD(s, 30, 0, 0);
      return diffInDays(s, end);
    }
    if (type === "agirmuebbet") {
      // 36 yıl
      const s = new Date(start || Date.now());
      const end = addYMD(s, 36, 0, 0);
      return diffInDays(s, end);
    }
    return 0;
  }, [type, start]);

  /* İnfaz oranı (süreli) */
  function bumpRatio(r){ if (r === "1/2") return "2/3"; if (r === "2/3") return "3/4"; return "3/4"; }
  const baseRatio = useMemo(() => selectedOffense.ratio, [selectedOffense]);
  const appliedRatio = useMemo(() => (recidivism ? bumpRatio(baseRatio) : baseRatio), [recidivism, baseRatio]);

  const frac = useMemo(() => {
    if (type !== "sureli") return null;
    const r = appliedRatio;
    if (r === "1/2") return 1/2;
    if (r === "2/3") return 2/3;
    if (r === "3/4") return 3/4;
    return 1/2;
  }, [type, appliedRatio]);

  /* Mahsup gün */
  const mahsupDays = useMemo(() => Math.max(0, parseTR(mahkup)), [mahkup]);

  /* Koşullu salıverilme için gerekli infaz gün sayısı */
  const neededForParole = useMemo(() => {
    if (!start) return 0;
    if (type === "sureli") return Math.max(0, Math.round(totalDays * frac));
    if (type === "muebbet") return Math.max(0, lifeDays);
    if (type === "agirmuebbet") return Math.max(0, lifeDays);
    return 0;
  }, [start, type, totalDays, frac, lifeDays]);

  /* Bihakkın tahliye (tam ceza) günü */
  const fullReleaseDate = useMemo(() => {
    if (!start) return null;
    const s = new Date(start + "T00:00:00");
    const total = type === "sureli" ? totalDays : lifeDays; // müebbetlerde “toplam” ceza gününü lifeDays üzerinden göster
    const need = Math.max(0, total - mahsupDays);
    return addDays(s, need);
  }, [start, type, totalDays, lifeDays, mahsupDays]);

  /* Koşullu salıverilme tarihi */
  const paroleDate = useMemo(() => {
    if (!start) return null;
    const s = new Date(start + "T00:00:00");
    const need = Math.max(0, neededForParole - mahsupDays);
    return addDays(s, need);
  }, [start, neededForParole, mahsupDays]);

  const dsEffMonths = useMemo(() => (special === "child" ? 24 : special === "severe" ? 36 : dsMonths), [special, dsMonths]);

  /* Denetimli serbestlik tarihi: koşulludan dsEffMonths ay geri */
  const dsDate = useMemo(() => {
    if (!paroleDate) return null;
    const back = addYMD(paroleDate, 0, -Number(dsEffMonths||0), 0);
    // Başlangıçtan önceye düşerse “girdi-çıktı”
    if (start) {
      const s = new Date(start + "T00:00:00");
      if (back < s) return s;
    }
    return back;
  }, [paroleDate, dsEffMonths, start]);

  /* Açıklayıcı etiketler */
  const ratioHint = (type === "sureli")
    ? (appliedRatio === "1/2" ? "Genel suçlar (5275 sonrası birçok suç)" :
       appliedRatio === "2/3" ? "Katalog/tekerrür bazı suçlar" :
       "Bazı katalog suçlar")
    : (type === "muebbet" ? "Müebbet: 30 yıl infaz" : "Ağırlaştırılmış müebbet: 36 yıl infaz");

  // Yatar (koşulluya kadar) ve DS'ye kadar yatar
  const yatarToParole = useMemo(() => {
    if (!start || !paroleDate) return null;
    return diffYMDParts(new Date(start + "T00:00:00"), paroleDate);
  }, [start, paroleDate]);

  const yatarToDS = useMemo(() => {
    if (!start || !dsDate) return null;
    // girdi-çıktı ise 0 göster
    const s = new Date(start + "T00:00:00");
    if (dsDate.getTime() === s.getTime()) return { y: 0, m: 0, d: 0 };
    return diffYMDParts(s, dsDate);
  }, [start, dsDate]);

  // Açık Ceza İnfaz Kurumu öngörüsü
  const openPrisonInfo = useMemo(() => {
    if (!start || type !== "sureli") return null;
    const totalY = Number(y||0) + Number(m||0)/12 + Number(d||0)/365;
    let closedMinDays = 0;
    let rule = "";
    if (totalY > 3 && totalY < 10) { closedMinDays = 30; rule = "3–10 yıl: 1 ay kapalıdan sonra (iyi hâl + KST ≤ 7 yıl)"; }
    else if (totalY >= 10) { closedMinDays = 90; rule = ">=10 yıl: 3 ay kapalı (mevzuat ve geçici hükümlere tabidir)"; }
    else { closedMinDays = 0; rule = "≤3 yıl: şartlara bağlı olarak doğrudan açık mümkün olabilir"; }
    const s = new Date(start + "T00:00:00");
    const candidate = addDays(s, closedMinDays);
    const untilParoleDays = paroleDate ? Math.max(0, diffInDays(candidate, paroleDate)) : null;
    const cond7y = untilParoleDays != null ? untilParoleDays <= 7 * 365 : null;
    return { rule, closedMinDays, candidate, cond7y };
  }, [start, type, y, m, d, paroleDate]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-1">İnfaz Hesaplama</h1>
      <div className="text-xs text-slate-400 mb-4">
        Koşullu salıverilme ve denetimli serbestlik tarihlerini takvim esaslı hesaplar.
        (Oranlar: genel olarak <strong>1/2</strong>; bazı suçlarda <strong>2/3</strong> veya <strong>3/4</strong>.
        Müebbet: <strong>30 yıl</strong>, ağırlaştırılmış müebbet: <strong>36 yıl</strong>.) 
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 mb-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Suç Tarihi</label>
            <input type="date" value={offenseDate} onChange={e=>setOffenseDate(e.target.value)}
                   className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Doğum Tarihi</label>
            <input type="date" value={birth} onChange={e=>setBirth(e.target.value)}
                   className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Ceza türü */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="font-medium mb-2">Ceza Bilgisi</div>

          <label className="block text-sm mb-1">Ceza Türü</label>
          <select value={type} onChange={e=>setType(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 mb-2">
            <option value="sureli">Süreli Hapis</option>
            <option value="muebbet">Müebbet</option>
            <option value="agirmuebbet">Ağırlaştırılmış Müebbet</option>
          </select>

          {type === "sureli" && (
            <>
              <label className="block text-sm mb-1">Toplam Ceza (Yıl / Ay / Gün)</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input value={y} onChange={e=>setY(digitsOnly(e.target.value))} inputMode="numeric" placeholder="Yıl"
                       className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"/>
                <input value={m} onChange={e=>setM(digitsOnly(e.target.value))} inputMode="numeric" placeholder="Ay"
                       className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"/>
                <input value={d} onChange={e=>setD(digitsOnly(e.target.value))} inputMode="numeric" placeholder="Gün"
                       className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"/>
              </div>

              <div className="mt-2 relative">
                <button type="button" onClick={()=>setOffenseOpen(v=>!v)}
                        className="w-full flex items-center justify-between rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 px-3 py-2">
                  <span className="text-sm">Suçu Seçiniz</span>
                  <span className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="line-clamp-1 max-w-[420px]">{selectedOffense.label}</span>
                    <span className="opacity-70">· Oran: {appliedRatio}</span>
                    <span className={`transition-transform ${offenseOpen ? 'rotate-90' : ''}`}>▸</span>
                  </span>
                </button>
                {offenseOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-2 rounded-lg border border-slate-600 bg-slate-900 shadow-xl">
                    <div className="max-h-72 overflow-auto p-2 space-y-2">
                      {OFFENSES.map(o => (
                        <label key={o.id} className="flex items-start gap-2 px-1 py-1 hover:bg-slate-800 rounded">
                          <input type="radio" name="offense" checked={offenseId === o.id} onChange={()=>{setOffenseId(o.id); setOffenseOpen(false);}} />
                          <span>{o.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-1">Uygulanan infaz oranı: <strong>{appliedRatio}</strong> — {ratioHint}</div>
              </div>

              <div className="mt-3">
                <label className="block text-sm mb-1">Tekerrüre Esas Sabıka Kaydı</label>
                <div className="flex items-center gap-4 text-sm">
                  <label className="inline-flex items-center gap-2"><input type="radio" name="recid" checked={!recidivism} onChange={()=>setRecidivism(false)} /> Yok</label>
                  <label className="inline-flex items-center gap-2"><input type="radio" name="recid" checked={recidivism} onChange={()=>setRecidivism(true)} /> Var</label>
                </div>
                <div className="text-xs text-slate-400 mt-1">Seçiliyse oran bir üst banda çıkar (örn. 1/2 → 2/3).</div>
              </div>
            </>
          )}

          {type !== "sureli" && (
            <div className="text-xs text-slate-400 mt-2">{ratioHint}</div>
          )}
        </div>

        {/* Tarihler & mahsup */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="font-medium mb-2">Tarih & Mahsup</div>

          <label className="block text-sm mb-1">İnfaza Başlangıç Tarihi</label>
          <input type="date" value={start} onChange={e=>setStart(e.target.value)}
                 className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 mb-2" />

          <label className="block text-sm mb-1">Mahsup (Tutukluluk/Hükümlülük Süresi)</label>
          <div className="flex items-center gap-4 mb-2 text-sm">
            <label className="inline-flex items-center gap-2"><input type="radio" name="mah" checked={!hasMahsup} onChange={()=>{setHasMahsup(false); setMahsup("");}} /> Yok</label>
            <label className="inline-flex items-center gap-2"><input type="radio" name="mah" checked={hasMahsup} onChange={()=>setHasMahsup(true)} /> Var</label>
            <input disabled={!hasMahsup} value={mahkup} onChange={e=>setMahsup(fmtInput(e.target.value))} inputMode="numeric" placeholder="gün"
                   className="w-32 rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 disabled:opacity-50" />
          </div>
          <div className="text-xs text-slate-400">Mahsup, hem koşullu hem bihakkın tarihten düşülür.</div>
        </div>

        {/* DS ve Sonuç */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="font-medium mb-2">Denetimli Serbestlik</div>
          <div className="text-sm rounded-lg border border-slate-600 bg-slate-900 px-3 py-2">
            DS Süresi: <strong>{(dsEffMonths/12).toFixed(0)} yıl</strong> (kural: 1 yıl; özel durum seçilirse otomatik güncellenir)
          </div>
          <div className="mt-3">
            <label className="block text-sm mb-1">Hükümlünün Varsa Özel Durumu</label>
            <div className="space-y-1 text-sm">
              <label className="flex items-start gap-2"><input type="radio" name="spc" checked={special === "none"} onChange={()=>setSpecial("none")} />
                <span>Yok</span>
              </label>
              <label className="flex items-start gap-2"><input type="radio" name="spc" checked={special === "child"} onChange={()=>setSpecial("child")} />
                <span>0–6 yaş aralığında çocuğu bulunan kadın hükümlü (DS: 2 yıl)</span>
              </label>
              <label className="flex items-start gap-2"><input type="radio" name="spc" checked={special === "severe"} onChange={()=>setSpecial("severe")} />
                <span>Ağır hastalık/engellilik/yaşlılık (Sağlık Kurulu/ATK raporu) — DS: 3 yıl</span>
              </label>
            </div>
            <div className="text-xs text-slate-400 mt-1">Seçili özel durumda DS süresi otomatik uygulanır.</div>
          </div>
        </div>

        {/* ÖZET */}
        <div className="rounded-xl border border-emerald-600/60 bg-emerald-900/15 p-4">
          <div className="text-sm uppercase tracking-wide text-emerald-300 mb-2">Sonuç</div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">YATAR (Koşulluya kadar)</div>
              <div className="text-xl font-semibold">{yatarToParole ? fmtYMDParts(yatarToParole) : "—"}</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">DS'ye kadar yatar</div>
              <div className="text-xl font-semibold">{yatarToDS ? fmtYMDParts(yatarToDS) : "—"}</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">Koşullu Salıverilme</div>
              <div className="text-2xl font-bold">{formatTRDate(paroleDate)}</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">Denetimli Serbestlik</div>
              <div className="text-2xl font-bold">
                {dsDate && start && dsDate.getTime() === new Date(start + "T00:00:00").getTime()
                  ? "Girdi-çıktı (DS)" : formatTRDate(dsDate)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">Bihakkın Tahliye</div>
              <div className="text-2xl font-bold">{formatTRDate(fullReleaseDate)}</div>
            </div>
          </div>

          {openPrisonInfo && (
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">Açık Ceza İnfaz Kurumu (öngörü)</div>
              <div className="text-sm mt-1">Kural: {openPrisonInfo.rule}</div>
              <div className="text-sm mt-1">Kapalıda asgari: <strong>{openPrisonInfo.closedMinDays}</strong> gün</div>
              <div className="text-sm">Uygun ise tahmini açık tarih: <strong>{formatTRDate(openPrisonInfo.candidate)}</strong></div>
              {openPrisonInfo.cond7y != null && (
                <div className="text-xs text-slate-400 mt-1">KST'ye 7 yıldan az kala şartı: <strong>{openPrisonInfo.cond7y ? "sağlanıyor" : "sağlanmıyor"}</strong></div>
              )}
            </div>
          )}

          <div className="text-xs text-slate-400 mt-3 leading-relaxed">
            Not: Bu araç, mevzuattaki oranları **genel çerçevede** uygular. Suç tipi/tekerrür/yaş/özel kanunlar ve disiplin/iyi hâl hususları
            koşullu/DS şartlarını etkileyebilir; kesin değerlendirme için **müddetname** esas alınır. Açık ceza değerlendirmesi öngörüdür; yönetmelik/iyi hâl ve güncel düzenlemelere tabi olabilir.
          </div>
        </div>
      </div>
    </div>
  );
}