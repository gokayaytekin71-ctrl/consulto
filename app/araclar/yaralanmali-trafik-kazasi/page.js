// app/araclar/yaralanmali-trafik-kazasi/page.jsx
"use client";

import { useMemo, useState, useEffect } from "react";
import trh2010 from "../../../veri/trh2010.json";

/* ──────────────────────────────────────────────────────────────────────────
   YARALANMALI TRAFİK KAZASI TAZMİNATI HESAPLAMA (Yaklaşık Aktüerya)
   - Gelir: Aylık net (TL)
   - Kayıp: Gelir × (1 − Kusur) × Maluliyet
   - Sağkalım: Gompertz–Makeham ~ TRH2010 uyumlu parametrik yaklaşım
   - Anüite faktörü (Genel Şart äx): ä_x(n) = Σ_{t=0..n-1} v^t · S(x→x+t),  v = 1/(1+r)
   - Aktif / Pasif dönem ayrı toplanır
   - Sonuç: (Yıllık kayıp) × (a_x_aktif + a_x_pasif)

   İleri kullanım:
   - lifeTableOverride: Yaş→sağkalım (l_x) haritasını (cinsiyete göre) JSON ile ver,
     aşağıdaki Gompertz yerine resmi tabloyu kullanır.
   - Resmi JSON formatı: { male: { "0": 100000, "1": 99900, ... }, female: {...} }

   Uyarı:
   - Mahkeme/aktüerya raporları ile birebir eşitlik garanti edilmez. Bu araç karar destek amaçlıdır.
   ────────────────────────────────────────────────────────────────────────── */

function digitsOnly(str = "") {
  return String(str).replace(/\D/g, "");
}
function formatThousandsTR(digits = "") {
  return String(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function fmtInput(value = "") {
  return formatThousandsTR(digitsOnly(value));
}
function parseTR(value) {
  if (value == null) return 0;
  const s = String(value).replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return isFinite(n) ? n : 0;
}
function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

/** Parametrik sağkalım — Gompertz–Makeham
 * μ(x) = A + B·c^x,  S(x→x+t) = exp(-A·t - (B/ln c)·(c^(x+t) - c^x))
 * Parametreler TRH2010'a tipik kalibrasyona yaklaştırılmıştır. */
function survivalGM(age, t, sex = "male") {
  // Daha uzun ömür (kadınlar) için biraz düşük baz risk:
  const params =
    sex === "female"
      ? { A: 0.00030, B: 0.000045, c: 1.085 }
      : { A: 0.00045, B: 0.000055, c: 1.088 };
  const { A, B, c } = params;
  const lnC = Math.log(c);
  const expo = -A * t - (B / lnC) * (Math.pow(c, age + t) - Math.pow(c, age));
  return Math.exp(expo);
}

/** Resmi tabloyu aşarsa: l_x dizisinden sağkalım oranı üretir. */
function survivalFromLifeTable(lxMap, age, t) {
  // lxMap: { "0": 100000, "1": 99900, ... } (aynı cinsiyet)
  const la = lxMap[String(Math.floor(age))];
  const lat = lxMap[String(Math.floor(age + t))];
  if (la == null || lat == null) return null;
  if (la <= 0) return 0;
  return lat / la;
}

/** Anüite faktörü (yıllık ödemeler, yıl sonunda) */
function annuityFactor({ age, years, rate, sex, lifeTableOverride }) {
  const r = Math.max(0, Number(rate || 0) / 100); // reel iskonto %
  const v = 1 / (1 + r);
  let a = 0;

  for (let t = 1; t <= years; t++) {
    // Önce override tablo var mı bak
    let S;
    if (lifeTableOverride) {
      S = survivalFromLifeTable(lifeTableOverride, age, t);
    }
    if (S == null) {
      S = survivalGM(age, t, sex);
    }
    a += Math.pow(v, t) * S;
  }
  return a;
}

/** Anüite faktörü — Dönem başı ödemeli (äx)
 * Genel Şart Madde 7/2 ve Madde 8 uyarınca: ödemeler dönem başında kabul edilir.
 * ä_x(n) = Σ_{t=0..n-1} v^t · S(x→x+t)
 */
function annuityDueFactor({ age, years, rate, sex, lifeTableOverride }) {
  const r = Math.max(0, Number(rate || 0) / 100);
  const v = 1 / (1 + r);
  let a = 0;
  for (let t = 0; t < years; t++) {
    let S;
    if (lifeTableOverride) {
      S = survivalFromLifeTable(lifeTableOverride, age, t);
    }
    if (S == null) {
      S = survivalGM(age, t, sex);
    }
    a += Math.pow(v, t) * S;
  }
  return a;
}

/** Aylık bazlı — Geçici iş göremezlik için dönem başı ödemeli anüite (aylık adım)
 * ä_x(M, aylık) = Σ_{m=0..M-1} v^{m/12} · S(x→x+m/12)
 */
function annuityDueFactorMonthly({ age, months, rate, sex, lifeTableOverride }) {
  const r = Math.max(0, Number(rate || 0) / 100);
  const v = 1 / (1 + r); // yıllık indirgeyici; aylık kuvveti v^{m/12}
  const M = Math.max(0, Math.floor(Number(months || 0)));
  let a = 0;
  for (let m = 0; m < M; m++) {
    const t = m / 12; // yıl cinsinden
    let S;
    if (lifeTableOverride) {
      S = survivalFromLifeTable(lifeTableOverride, age, t);
    }
    if (S == null) {
      S = survivalGM(age, t, sex);
    }
    a += Math.pow(v, t) * S;
  }
  return a;
}

export default function YaralanmaliTazminat() {
  const [sex, setSex] = useState(""); // male | female
  const [age, setAge] = useState("");
  const [disability, setDisability] = useState(""); // %
  const [fault, setFault] = useState(""); // %
  const [wage, setWage] = useState(""); // Aylık net TL
  const ACTIVE_END = 65; // sabit
  const PASSIVE_END = 72; // sabit
  const PASSIVE_NET_MIN = 22104.67; // Pasif baz: AGİ hariç net asgari (TL) — sabit
  const [under18Doc, setUnder18Doc] = useState(false);

  // Geçici iş göremezlik (ay)
  const [tempMonths, setTempMonths] = useState("");

  const RATE_FIXED = 1.65; // Reel iskonto % (sabit)

  // TRH2010 yaşam tabloları (bundled JSON)
  const lifeTables = trh2010 || null;
  const lifeMale = lifeTables?.male ?? null;
  const lifeFemale = lifeTables?.female ?? null;

  const malul = clamp(Number(disability || 0), 0, 100) / 100;
  const kusur = clamp(Number(fault || 0), 0, 100) / 100;

  const years = useMemo(() => {
    const y = Number(age || 0);
    const effAge = y + Math.max(0, Number(tempMonths || 0)) / 12; // geçici süre sonundaki yaş

    let activeYears = 0;
    if (effAge < 18) {
      // 18 yaş altı: belgeliyse aktif, değilse pasif
      if (under18Doc) {
        activeYears = Math.max(0, ACTIVE_END - effAge);
      } else {
        activeYears = 0;
      }
    } else if (effAge < ACTIVE_END) {
      activeYears = Math.max(0, ACTIVE_END - effAge);
    } else {
      activeYears = 0; // 65 sonrası pasif
    }
    const passiveYears = Math.max(0, PASSIVE_END - (effAge + activeYears));

    return {
      active: Math.floor(activeYears),
      passive: Math.floor(passiveYears),
      total: Math.floor(activeYears + passiveYears),
      current: y,
      effectiveAge: effAge,
    };
  }, [age, tempMonths, under18Doc]);

  const afActive = useMemo(
    () =>
      annuityDueFactor({
        age: years.effectiveAge,
        years: years.active,
        rate: RATE_FIXED,
        sex: (sex || "male"),
        lifeTableOverride: sex === "male" ? lifeMale : lifeFemale,
      }),
    [years, sex]
  );

  const afPassive = useMemo(
    () =>
      annuityDueFactor({
        age: years.effectiveAge + years.active,
        years: years.passive,
        rate: RATE_FIXED,
        sex: (sex || "male"),
        lifeTableOverride: sex === "male" ? lifeMale : lifeFemale,
      }),
    [years, sex]
  );

  const activeMonthlyLoss = useMemo(() => {
    const m = parseTR(wage);
    return Math.max(0, m * (1 - kusur) * malul);
  }, [wage, kusur, malul]);

  const passiveMonthlyLoss = useMemo(() => {
    const m = PASSIVE_NET_MIN; // sabit net asgari (AGİ hariç)
    return Math.max(0, m * (1 - kusur) * malul);
  }, [kusur, malul]);

  const annualActiveLoss = useMemo(() => activeMonthlyLoss * 12, [activeMonthlyLoss]);
  const annualPassiveLoss = useMemo(() => passiveMonthlyLoss * 12, [passiveMonthlyLoss]);

  // Geçici iş göremezlik: %100 maluliyet, aylık adım, geçici ay kadar
  const pvTemporary = useMemo(() => {
    const M = Math.max(0, Number(tempMonths || 0));
    if (M <= 0) return 0;
    const monthly = parseTR(wage) * (1 - kusur) * 1.0; // %100 maluliyet
    const aTemp = annuityDueFactorMonthly({
      age: Number(age || 0),
      months: M,
      rate: RATE_FIXED,
      sex: (sex || "male"),
      lifeTableOverride: sex === "male" ? lifeMale : lifeFemale,
    });
    const pv = monthly * aTemp;
    return isFinite(pv) ? Math.round(pv) : 0;
  }, [tempMonths, wage, kusur, sex, age, lifeMale, lifeFemale]);

  // Sürekli sakatlık kısmı (geçici süreden sonra başlar)
  const pvPermanent = useMemo(() => {
    const pv = annualActiveLoss * afActive + annualPassiveLoss * afPassive;
    return isFinite(pv) ? Math.round(pv) : 0;
  }, [annualActiveLoss, annualPassiveLoss, afActive, afPassive]);

  const result = useMemo(() => {
    return Math.max(0, pvTemporary + pvPermanent);
  }, [pvTemporary, pvPermanent]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-1">
        Yaralanmalı Trafik Kazası Tazminatı Hesaplama Botu
      </h1>
      <div className="text-xs text-slate-400 mb-2">Reel iskonto: %1,65 (kanuni sabit)</div>
      <div className="text-xs text-slate-400 mb-2">Net Asgari Ücret: {PASSIVE_NET_MIN.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL </div>
    

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <label className="block text-sm mb-1">Cinsiyet</label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
          >
            <option value="">Seçiniz</option>
            <option value="male">Erkek</option>
            <option value="female">Kadın</option>
          </select>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <label className="block text-sm mb-1">Yaş</label>
          <input
            value={age}
            onChange={(e) => setAge(digitsOnly(e.target.value))}
            inputMode="numeric"
            placeholder="örn. 30"
            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
          />
          {Number(age) > 0 && Number(age) < 18 && (
            <label className="mt-2 inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={under18Doc}
                onChange={(e) => setUnder18Doc(e.target.checked)}
              />
              Belgeli gelir var (aktif hesapla)
            </label>
          )}
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <label className="block text-sm mb-1">Maluliyet Oranı (%)</label>
          <input
            value={disability}
            onChange={(e) => setDisability(digitsOnly(e.target.value))}
            inputMode="numeric"
            placeholder="örn. 60"
            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
          />
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <label className="block text-sm mb-1">Kişisel Kusur Oranı (%)</label>
          <input
            value={fault}
            onChange={(e) => setFault(digitsOnly(e.target.value))}
            inputMode="numeric"
            placeholder="örn. 20"
            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
          />
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <label className="block text-sm mb-1">Aylık Net Gelir (TL)</label>
          <input
            value={wage}
            onChange={(e) => setWage(fmtInput(e.target.value))}
            inputMode="numeric"
            placeholder="örn. 30.000"
            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
          />
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <label className="block text-sm mb-1">Geçici İş Göremezlik Süresi (ay)</label>
          <input
            value={tempMonths}
            onChange={(e) => setTempMonths(digitsOnly(e.target.value))}
            inputMode="numeric"
            placeholder="örn. 0"
            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
          />
          <div className="text-xs text-slate-400 mt-2">Bu süre için maluliyet %100 varsayılır ve dönem başı (äx) aylık indirgeme uygulanır.</div>
        </div>


        {/* Sonuç Kartı */}
        <div className="md:col-span-2 p-5 rounded-xl border border-amber-600/60 bg-amber-900/15">
          <div className="text-sm uppercase tracking-wide text-amber-300 mb-1">
            Yaklaşık Tazminat
          </div>
          <div className="text-3xl font-bold">
            {parseTR(result.toFixed(0)).toLocaleString("tr-TR")} TL
          </div>

          <div className="grid gap-2 md:grid-cols-3 mt-4 text-sm">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div>
                Aktif Aylık Kaybı: {" "}
                <strong>
                  {parseTR(activeMonthlyLoss.toFixed(0)).toLocaleString("tr-TR")} TL
                </strong>
              </div>
              <div>
                Pasif Aylık Kaybı (Asgari): {" "}
                <strong>
                  {parseTR(passiveMonthlyLoss.toFixed(0)).toLocaleString("tr-TR")} TL
                </strong>
            
              </div>
              <div className="mt-2">
                Aktif Yıllık Kaybı: {" "}
                <strong>
                  {parseTR(annualActiveLoss.toFixed(0)).toLocaleString("tr-TR")} TL
                </strong>
              </div>
              <div>
                Pasif Yıllık Kaybı: {" "}
                <strong>
                  {parseTR(annualPassiveLoss.toFixed(0)).toLocaleString("tr-TR")} TL
                </strong>
              </div>
              <div className="mt-2">
                Geçici İG (ay / PV):
                <strong> {digitsOnly(tempMonths) || 0} ay / {parseTR(pvTemporary.toFixed(0)).toLocaleString("tr-TR")} TL</strong>
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div>
                Anüite (Aktif, äx): <strong>{afActive.toFixed(2)}</strong>
              </div>
              <div>
                Anüite (Pasif, äx): <strong>{afPassive.toFixed(2)}</strong>
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div>
                Maluliyet: <strong>{(malul * 100).toFixed(0)}%</strong>
              </div>
              <div>
                Kusur: <strong>{(kusur * 100).toFixed(0)}%</strong>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 mt-3 leading-relaxed">
            2918 sayılı Karayolları Trafik Kanununun 90 ıncı maddesi uyarınca, TRH2010 yaşam tabloları baz alınmıştır.
          </div>
        </div>
      </div>
    </div>
  );
}