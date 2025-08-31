// app/araclar/destekten-yoksun-kalma/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import trh2010 from "../../../veri/trh2010.json";

/* ──────────────────────────────────────────────────────────────────────────
   DESTEKten YOKSUN KALMA TAZMİNATI (Genel Şart Ek-3 uyumlu, özet yaklaşım)
   - Sağkalım: TRH2010 (JSON varsa) veya Gompertz–Makeham (parametrik)
   - İskonto: reel %1,65 (sabit)
   - Destek aktif/pasif: 18–65 / 65–72 (üst sınır: desteğin beklenen yaşam süresi)
   - Pasif gelir: AGİ hariç net asgari (sabit)
   - Paylar: Destek 2, Eş 2, Çocuk 1, Anne 1, Baba 1  (biri çıkınca ebeveyne 2)
   - Eş için yeniden evlenme: tabloya göre; velayetindeki her çocuk için −5 puan
   - Çocuk desteği: 22 yaş; lisans/lisansüstü ise 25 yaş
   - PV hesabı: yıllık tutar × Σ v^t · S_destek(t) · F(t)  (F=pay oranı)
   Uyarı: Bu araç karar destek amaçlıdır; raporlarla birebir eşitlik garanti edilmez.
   ────────────────────────────────────────────────────────────────────────── */

const RATE_FIXED = 1.65;          // Reel iskonto % (sabit)
const PASSIVE_NET_MIN = 22104.67; // Pasif baz gelir: AGİ hariç net asgari (TL)

function digitsOnly(s = "") { return String(s).replace(/\D/g, ""); }
function fmtThousandsTR(d = "") { return String(d).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function fmtInput(v = "") { return fmtThousandsTR(digitsOnly(v)); }
function parseTR(v) { if (v == null) return 0; const s = String(v).replace(/\./g, "").replace(",", "."); const n = Number(s); return isFinite(n) ? n : 0; }
function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }

/** Parametrik sağkalım — TRH2010’a yakın Gompertz–Makeham */
function survivalGM(age, t, sex = "male") {
  const p = sex === "female" ? { A: 0.00030, B: 0.000045, c: 1.085 } : { A: 0.00045, B: 0.000055, c: 1.088 };
  const lnC = Math.log(p.c);
  const expo = -p.A * t - (p.B / lnC) * (Math.pow(p.c, age + t) - Math.pow(p.c, age));
  return Math.exp(expo);
}

/** l_x tablosundan S(x→x+t) üretir (yıl içi t için alt sınır yaklaşımı) */
function survivalFromLifeTable(lxMap, age, t) {
  const la = lxMap?.[String(Math.floor(age))];
  const lat = lxMap?.[String(Math.floor(age + t))];
  if (la == null || lat == null) return null;
  if (la <= 0) return 0;
  return lat / la;
}

/** Beklenen kalan yaşam (yıl) — e_x ≈ Σ_{t=1..T} S(x→x+t) */
function expectedYears({ age, sex, lifeTable }) {
  const maxT = Math.max(0, 99 - Math.floor(age));
  let e = 0;
  for (let t = 1; t <= maxT; t++) {
    let S = lifeTable ? survivalFromLifeTable(lifeTable, age, t) : null;
    if (S == null) S = survivalGM(age, t, sex);
    e += S;
  }
  return e; // yıl
}

/** PV seri — Σ v^t · S_destek(t) · weight(tGlobal) (t: 0..years-1) */
function pvSeries({ age, years, rate, sex, lifeTable, weight }) {
  const r = Math.max(0, Number(rate || 0) / 100);
  const v = 1 / (1 + r);
  let sum = 0;
  for (let t = 0; t < years; t++) {
    let S = lifeTable ? survivalFromLifeTable(lifeTable, age, t) : null;
    if (S == null) S = survivalGM(age, t, sex);
    const w = weight ? weight(t) : 1;
    sum += Math.pow(v, t) * S * w;
  }
  return sum;
}

/** Eş için yeniden evlenme olasılığı (çocuk başına −5 puan) */
function remarriageProb({ age, sex, custodyKids }) {
  const a = Number(age || 0);
  const childAdj = 0.05 * clamp(Number(custodyKids || 0), 0, 10);
  const table = sex === "male"
    ? [ [17,20,0.90], [21,25,0.70], [26,30,0.48], [31,35,0.30], [36,40,0.15], [41,50,0.04], [51,55,0.02] ]
    : [ [17,20,0.52], [21,25,0.40], [26,30,0.27], [31,35,0.17], [36,40,0.09], [41,50,0.02], [51,55,0.01] ];
  let base = 0;
  for (const [lo, hi, p] of table) if (a >= lo && a <= hi) { base = p; break; }
  const p = clamp(base - childAdj, 0, 1);
  return p; // olasılık
}

export default function DestektenYoksunKalma() {
  // Destek (vefat eden)
  const [dSex, setDSex] = useState("");           // male|female
  const [dAge, setDAge] = useState("");           // vefat anındaki yaş
  const [netMonthly, setNetMonthly] = useState("");// belgeli net aylık (aktif baz)
  const [fault, setFault] = useState("");         // % kusur

  // Eş
  const [hasSpouse, setHasSpouse] = useState(false);
  const [sSex, setSSex] = useState("");
  const [sAge, setSAge] = useState("");
  const [sCustody, setSCustody] = useState(""); // velayetindeki çocuk sayısı

  // Çocuklar
  const [kids, setKids] = useState([]); // [{age:"", uni:false}]
  const addKid = () => setKids((arr) => [...arr, { age: "", uni: false }]);
  const updateKid = (i, patch) => setKids(arr => arr.map((k, idx) => idx === i ? { ...k, ...patch } : k));
  const removeKid = (i) => setKids(arr => arr.filter((_, idx) => idx !== i));

  // Anne-Baba
  const [hasMother, setHasMother] = useState(false);
  const [mAge, setMAge] = useState("");
  const [hasFather, setHasFather] = useState(false);
  const [fAge, setFAge] = useState("");

  // TRH2010 life tables (bundled)
  const [life] = useState(trh2010 || null);
  const lifeMale = life?.male ?? null;
  const lifeFemale = life?.female ?? null;

  // Türetilen parametreler
  const dAgeNum = Number(dAge || 0);
  const r = RATE_FIXED;
  const kusur = clamp(Number(fault || 0), 0, 100) / 100;
  const activeMonthlyBase = parseTR(netMonthly);
  const passiveMonthlyBase = PASSIVE_NET_MIN;
  const activeAnnual = useMemo(() => Math.max(0, parseTR(netMonthly) * 12 * (1 - kusur)), [netMonthly, kusur]);
  const passiveAnnual = useMemo(() => Math.max(0, PASSIVE_NET_MIN * 12 * (1 - kusur)), [kusur]);

  // Desteğin beklenen yaşam süresi (üst limit)
  const eD = useMemo(() => {
    if (!dSex || !dAge) return 0;
    const lt = dSex === "male" ? lifeMale : lifeFemale;
    return expectedYears({ age: dAgeNum, sex: dSex || "male", lifeTable: lt });
  }, [dSex, dAgeNum, lifeMale, lifeFemale]);

  // Aktif/pasif yıl sayıları (üst sınır eD)
  const A = useMemo(() => {
    if (!dAge) return 0;
    const raw = Math.max(0, 65 - dAgeNum);
    return Math.floor(Math.min(raw, eD));
  }, [dAgeNum, eD]);

  const P = useMemo(() => {
    if (!dAge) return 0;
    const raw = Math.max(0, 72 - Math.max(65, dAgeNum));
    return Math.floor(Math.min(raw, Math.max(0, eD - A)));
  }, [dAgeNum, eD, A]);

  // Alıcıların süreliliği (n değerleri)
  const spouseN = useMemo(() => {
    if (!hasSpouse || !sSex || !sAge) return 0;
    const lt = sSex === "male" ? lifeMale : lifeFemale;
    const e = expectedYears({ age: Number(sAge || 0), sex: sSex, lifeTable: lt });
    return Math.floor(Math.min(e, eD || Infinity));
  }, [hasSpouse, sSex, sAge, lifeMale, lifeFemale, eD]);

  const motherN = useMemo(() => {
    if (!hasMother || !mAge) return 0;
    const e = expectedYears({ age: Number(mAge || 0), sex: "female", lifeTable: lifeFemale });
    return Math.floor(Math.min(e, eD || Infinity));
  }, [hasMother, mAge, lifeFemale, eD]);

  const fatherN = useMemo(() => {
    if (!hasFather || !fAge) return 0;
    const e = expectedYears({ age: Number(fAge || 0), sex: "male", lifeTable: lifeMale });
    return Math.floor(Math.min(e, eD || Infinity));
  }, [hasFather, fAge, lifeMale, eD]);

  const kidsN = useMemo(() => {
    return kids.map(k => {
      const age = Number(k.age || 0);
      const end = (k.uni ? 25 : 22);
      const n = Math.max(0, end - age); // yaş sınırı
      return Math.floor(Math.min(n, eD || Infinity));
    });
  }, [kids, eD]);

  // Eş yeniden evlenme olasılığı (sabit kesinti faktörü)
  const spouseWeight = useMemo(() => {
    if (!hasSpouse || !sSex || !sAge) return 0;
    const p = remarriageProb({ age: sAge, sex: sSex, custodyKids: Number(sCustody || 0) });
    return (1 - p); // 0..1
  }, [hasSpouse, sSex, sAge, sCustody]);

  // t anında pay oranı F(t)
  const F = useMemo(() => {
    return (t) => {
      // Eş
      const spShares = (hasSpouse && t < spouseN) ? 2 * spouseWeight : 0;

      // Çocuklar
      let childCount = 0;
      kidsN.forEach(n => { if (t < n) childCount += 1; });

      // Anne/Baba (biri çıkarsa diğer 2 pay)
      let parentShares = 0;
      const mAlive = (motherN > 0) && (t < motherN);
      const fAlive = (fatherN > 0) && (t < fatherN);
      if (mAlive && fAlive) parentShares = 2;          // 1+1
      else if (mAlive || fAlive) parentShares = 2;     // kalan 2 pay
      else parentShares = 0;

      const depShares = spShares + childCount + parentShares;
      const totalShares = 2 + depShares; // Destek 2 pay (kendi tüketimi)
      if (totalShares <= 0) return 0;
      return depShares / totalShares;
    };
  }, [hasSpouse, spouseN, spouseWeight, kidsN, motherN, fatherN]);

  // Zamana bağlı paylar — tek tek hak sahipleri için (spouse/children/mother/father)
  const sharesAt = useMemo(() => {
    return (t) => {
      const sp = (hasSpouse && t < spouseN) ? (2 * spouseWeight) : 0; // ağırlıklı eş payı
      const childActive = kidsN.map((n) => (t < n ? 1 : 0)); // her aktif çocuk 1 pay
      const childCount = childActive.reduce((a,b)=>a+b,0);

      const mAlive = (motherN > 0) && (t < motherN);
      const fAlive = (fatherN > 0) && (t < fatherN);
      let mother = 0, father = 0;
      if (mAlive && fAlive) { mother = 1; father = 1; }
      else if (mAlive) { mother = 2; }
      else if (fAlive) { father = 2; }

      const depShares = sp + childCount + mother + father;
      const denom = 2 + depShares; // Destek 2 pay — tüketim
      return { denom, sp, childActive, mother, father };
    };
  }, [hasSpouse, spouseN, spouseWeight, kidsN, motherN, fatherN]);

  // PV — Aktif ve Pasif ayrı, F(t) ile ağırlıklı
  const pvActiveFactor = useMemo(() => {
    if (!dSex || !dAge) return 0;
    const lt = dSex === "male" ? lifeMale : lifeFemale;
    return pvSeries({
      age: dAgeNum,
      years: A,
      rate: r,
      sex: dSex || "male",
      lifeTable: lt,
      weight: (t) => F(t)
    });
  }, [dSex, dAgeNum, A, r, lifeMale, lifeFemale, F]);

  const pvPassiveFactor = useMemo(() => {
    if (!dSex || !dAge) return 0;
    const lt = dSex === "male" ? lifeMale : lifeFemale;
    return pvSeries({
      age: dAgeNum,
      years: A + P,
      rate: r,
      sex: dSex || "male",
      lifeTable: lt,
      weight: (t) => (t < A ? 0 : F(t)) // sadece pasif dilim (t>=A)
    });
  }, [dSex, dAgeNum, A, P, r, lifeMale, lifeFemale, F]);

  // Hak sahiplerine göre PV faktörleri ve tutarlar
  const ltD = dSex === "male" ? lifeMale : lifeFemale;

  // Eş
  const pvAct_spouse = useMemo(() => {
    if (!hasSpouse || !dSex || !dAge) return 0;
    return pvSeries({
      age: dAgeNum,
      years: A,
      rate: r,
      sex: dSex || "male",
      lifeTable: ltD,
      weight: (t) => { const s = sharesAt(t); return s.sp / s.denom; }
    });
  }, [hasSpouse, dSex, dAgeNum, A, r, ltD, sharesAt]);

  const pvPas_spouse = useMemo(() => {
    if (!hasSpouse || !dSex || !dAge) return 0;
    return pvSeries({
      age: dAgeNum,
      years: A + P,
      rate: r,
      sex: dSex || "male",
      lifeTable: ltD,
      weight: (t) => { const s = sharesAt(t); return (t < A ? 0 : s.sp / s.denom); }
    });
  }, [hasSpouse, dSex, dAgeNum, A, P, r, ltD, sharesAt]);

  const amt_spouse = useMemo(() => {
    return Math.round(activeAnnual * pvAct_spouse + passiveAnnual * pvPas_spouse);
  }, [activeAnnual, passiveAnnual, pvAct_spouse, pvPas_spouse]);

  // Çocuklar (dizi)
  const pvAct_kids = useMemo(() => {
    return kidsN.map((_, idx) => {
      if (!dSex || !dAge) return 0;
      return pvSeries({
        age: dAgeNum,
        years: A,
        rate: r,
        sex: dSex || "male",
        lifeTable: ltD,
        weight: (t) => { const s = sharesAt(t); return (s.childActive[idx] || 0) / s.denom; }
      });
    });
  }, [kidsN, dSex, dAgeNum, A, r, ltD, sharesAt]);

  const pvPas_kids = useMemo(() => {
    return kidsN.map((_, idx) => {
      if (!dSex || !dAge) return 0;
      return pvSeries({
        age: dAgeNum,
        years: A + P,
        rate: r,
        sex: dSex || "male",
        lifeTable: ltD,
        weight: (t) => { const s = sharesAt(t); return (t < A ? 0 : (s.childActive[idx] || 0) / s.denom); }
      });
    });
  }, [kidsN, dSex, dAgeNum, A, P, r, ltD, sharesAt]);

  const amt_kids = useMemo(() => {
    return pvAct_kids.map((v, i) => Math.round(activeAnnual * v + passiveAnnual * pvPas_kids[i]));
  }, [pvAct_kids, pvPas_kids, activeAnnual, passiveAnnual]);

  // Anne
  const pvAct_mother = useMemo(() => {
    if (!hasMother || !dSex || !dAge) return 0;
    return pvSeries({
      age: dAgeNum,
      years: A,
      rate: r,
      sex: dSex || "male",
      lifeTable: ltD,
      weight: (t) => { const s = sharesAt(t); return s.mother / s.denom; }
    });
  }, [hasMother, dSex, dAgeNum, A, r, ltD, sharesAt]);

  const pvPas_mother = useMemo(() => {
    if (!hasMother || !dSex || !dAge) return 0;
    return pvSeries({
      age: dAgeNum,
      years: A + P,
      rate: r,
      sex: dSex || "male",
      lifeTable: ltD,
      weight: (t) => { const s = sharesAt(t); return (t < A ? 0 : s.mother / s.denom); }
    });
  }, [hasMother, dSex, dAgeNum, A, P, r, ltD, sharesAt]);

  const amt_mother = useMemo(() => Math.round(activeAnnual * pvAct_mother + passiveAnnual * pvPas_mother), [activeAnnual, passiveAnnual, pvAct_mother, pvPas_mother]);

  // Baba
  const pvAct_father = useMemo(() => {
    if (!hasFather || !dSex || !dAge) return 0;
    return pvSeries({
      age: dAgeNum,
      years: A,
      rate: r,
      sex: dSex || "male",
      lifeTable: ltD,
      weight: (t) => { const s = sharesAt(t); return s.father / s.denom; }
    });
  }, [hasFather, dSex, dAgeNum, A, r, ltD, sharesAt]);

  const pvPas_father = useMemo(() => {
    if (!hasFather || !dSex || !dAge) return 0;
    return pvSeries({
      age: dAgeNum,
      years: A + P,
      rate: r,
      sex: dSex || "male",
      lifeTable: ltD,
      weight: (t) => { const s = sharesAt(t); return (t < A ? 0 : s.father / s.denom); }
    });
  }, [hasFather, dSex, dAgeNum, A, P, r, ltD, sharesAt]);

  const amt_father = useMemo(() => Math.round(activeAnnual * pvAct_father + passiveAnnual * pvPas_father), [activeAnnual, passiveAnnual, pvAct_father, pvPas_father]);


  const pvActive = useMemo(() => Math.round(activeAnnual * pvActiveFactor), [activeAnnual, pvActiveFactor]);
  const pvPassive = useMemo(() => Math.round(passiveAnnual * pvPassiveFactor), [passiveAnnual, pvPassiveFactor]);

  const totalPV = useMemo(() => Math.max(0, pvActive + pvPassive), [pvActive, pvPassive]);

  // ───────────────────────────────────────────── UI
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-1">Destekten Yoksun Kalma Tazminatı Hesaplama Botu</h1>
      <div className="text-xs text-slate-400 mb-1">
        2918 sayılı KTK m.90 uyarınca hesaplama <b>TRH2010</b> yaşam tabloları (Ek-7) esas alınarak yapılır.
      </div>
      <div className="text-xs text-slate-400 mb-4">
        Reel iskonto: %1,65 (sabit) · Pasif baz gelir: {PASSIVE_NET_MIN.toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2})} TL
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Destek */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="font-medium mb-2">Destek (Vefat Eden)</div>
          <label className="block text-sm mb-1">Cinsiyet</label>
          <select value={dSex} onChange={e=>setDSex(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 mb-2">
            <option value="">Seçiniz</option>
            <option value="male">Erkek</option>
            <option value="female">Kadın</option>
          </select>

          <label className="block text-sm mb-1">Vefat Anındaki Yaş</label>
          <input value={dAge} onChange={e=>setDAge(digitsOnly(e.target.value))} inputMode="numeric" placeholder="örn. 40" className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 mb-2"/>

          <label className="block text-sm mb-1">Aylık Net Gelir (aktif baz)</label>
          <input value={netMonthly} onChange={e=>setNetMonthly(fmtInput(e.target.value))} inputMode="numeric" placeholder="örn. 30.000" className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 mb-2"/>

          <label className="block text-sm mb-1">Kusur Oranı (%)</label>
          <input value={fault} onChange={e=>setFault(digitsOnly(e.target.value))} inputMode="numeric" placeholder="örn. 0" className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"/>
          <div className="text-xs text-slate-400 mt-2">Pasif dönemde gelir otomatik olarak AGİ hariç net asgari kabul edilir.</div>
        </div>


        {/* Eş */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Eş</div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hasSpouse} onChange={(e)=>setHasSpouse(e.target.checked)} />
              Var
            </label>
          </div>
          {hasSpouse && (
            <div className="mt-2 space-y-2">
              <div>
                <label className="block text-sm mb-1">Cinsiyet</label>
                <select value={sSex} onChange={e=>setSSex(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2">
                  <option value="">Seçiniz</option>
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Yaş</label>
                <input value={sAge} onChange={e=>setSAge(digitsOnly(e.target.value))} inputMode="numeric" placeholder="örn. 35" className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"/>
              </div>
              <div>
                <label className="block text-sm mb-1">Velayetindeki Çocuk Sayısı</label>
                <input value={sCustody} onChange={e=>setSCustody(digitsOnly(e.target.value))} inputMode="numeric" placeholder="örn. 0" className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"/>
                <div className="text-xs text-slate-400 mt-1">Eş için yeniden evlenme olasılığı: çocuk başına −5 puan uygulanır.</div>
              </div>
            </div>
          )}
        </div>

        {/* Çocuklar */}
        <div className="md:col-span-2 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Çocuklar</div>
            <button onClick={addKid} className="px-3 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-800 text-sm">Çocuk Ekle</button>
          </div>
          {kids.length === 0 ? (
            <div className="text-sm text-slate-400">Kayıt yok</div>
          ) : (
            <div className="space-y-2">
              {kids.map((k, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center rounded-lg border border-slate-700 bg-slate-800 p-3">
                  <div>
                    <label className="block text-sm mb-1">Yaş</label>
                    <input value={k.age} onChange={e=>updateKid(i, {age: digitsOnly(e.target.value)})} inputMode="numeric" placeholder="örn. 10" className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"/>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm mt-6 md:mt-0">
                    <input type="checkbox" checked={k.uni} onChange={e=>updateKid(i, {uni: e.target.checked})}/>
                    Lisans / Lisansüstü (destek 25 yaşa kadar)
                  </label>
                  <button onClick={()=>removeKid(i)} className="justify-self-start md:justify-self-end px-3 py-1.5 rounded-lg border border-red-700 text-red-300 hover:bg-red-900/30 text-sm">Sil</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anne - Baba */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="font-medium mb-2">Anne</div>
          <label className="inline-flex items-center gap-2 text-sm mb-2">
            <input type="checkbox" checked={hasMother} onChange={e=>setHasMother(e.target.checked)} /> Var
          </label>
          {hasMother && (
            <div>
              <label className="block text-sm mb-1">Yaş</label>
              <input value={mAge} onChange={e=>setMAge(digitsOnly(e.target.value))} inputMode="numeric" placeholder="örn. 60" className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"/>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="font-medium mb-2">Baba</div>
          <label className="inline-flex items-center gap-2 text-sm mb-2">
            <input type="checkbox" checked={hasFather} onChange={e=>setHasFather(e.target.checked)} /> Var
          </label>
          {hasFather && (
            <div>
              <label className="block text-sm mb-1">Yaş</label>
              <input value={fAge} onChange={e=>setFAge(digitsOnly(e.target.value))} inputMode="numeric" placeholder="örn. 62" className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"/>
            </div>
          )}
        </div>

        {/* Sonuç */}
        <div className="md:col-span-2 p-5 rounded-xl border border-emerald-600/60 bg-emerald-900/15">
          <div className="text-sm uppercase tracking-wide text-emerald-300 mb-1">Yaklaşık Tazminat (DYKT)</div>
          <div className="text-3xl font-bold">{parseTR(totalPV.toFixed(0)).toLocaleString("tr-TR")} TL</div>

          <div className="grid gap-2 md:grid-cols-3 mt-4 text-sm">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div>Aktif Yıllık Tutar: <strong>{parseTR(activeAnnual.toFixed(0)).toLocaleString("tr-TR")} TL</strong></div>
              <div>Pasif Yıllık Tutar: <strong>{parseTR(passiveAnnual.toFixed(0)).toLocaleString("tr-TR")} TL</strong></div>
              <div>Aktif Yıl: <strong>{A}</strong> · Pasif Yıl: <strong>{P}</strong></div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div>PV (Aktif): <strong>{parseTR(pvActive.toFixed(0)).toLocaleString("tr-TR")} TL</strong></div>
              <div>PV (Pasif): <strong>{parseTR(pvPassive.toFixed(0)).toLocaleString("tr-TR")} TL</strong></div>
              <div>Eş Ağırlığı: <strong>{(spouseWeight*100).toFixed(0)}%</strong> {hasSpouse ? "" : "(eş yok)"}</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="font-medium mb-2">Hak Sahiplerine Göre Döküm</div>
              <ul className="space-y-1 text-sm">
                {hasSpouse && (
                  <li className="flex items-center justify-between">
                    <span>Eş</span>
                    <span className="font-semibold">{parseTR(amt_spouse.toFixed(0)).toLocaleString("tr-TR")} TL</span>
                  </li>
                )}
                {kids.length > 0 && amt_kids.map((amt, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>Çocuk {i+1}</span>
                    <span className="font-semibold">{parseTR(amt.toFixed(0)).toLocaleString("tr-TR")} TL</span>
                  </li>
                ))}
                {hasMother && (
                  <li className="flex items-center justify-between">
                    <span>Anne</span>
                    <span className="font-semibold">{parseTR(amt_mother.toFixed(0)).toLocaleString("tr-TR")} TL</span>
                  </li>
                )}
                {hasFather && (
                  <li className="flex items-center justify-between">
                    <span>Baba</span>
                    <span className="font-semibold">{parseTR(amt_father.toFixed(0)).toLocaleString("tr-TR")} TL</span>
                  </li>
                )}
                {(!hasSpouse && kids.length === 0 && !hasMother && !hasFather) && (
                  <li className="text-slate-400">Hak sahibi seçilmedi</li>
                )}
              </ul>
              <div className="text-xs text-slate-400 mt-2">Toplam, yukarıdaki PV ile yaklaşık eşleşir (küçük yuvarlama farkları olabilir).</div>
            </div>
          </div>

          <div className="text-xs text-slate-400 mt-3 leading-relaxed">
            Not: Üst süre limiti, desteğin vefat anındaki beklenen yaşam süresidir. Çocuklar 22/25 yaşa kadar desteklenir. Eş için yeniden
            evlenme olasılığı tabloları uygulanır; çocuk başına 5 puan indirim yapılır.
          </div>
        </div>
      </div>
    </div>
  );
}