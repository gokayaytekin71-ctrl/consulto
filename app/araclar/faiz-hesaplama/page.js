// app/araclar/faiz-hesaplama/page.js
"use client";

import { useMemo, useState } from "react";

/* Yardımcılar */
const dayMs = 24 * 60 * 60 * 1000;
const digitsOnly = (s = "") => String(s).replace(/\D/g, "");
const fmtThousandsTR = (d = "") => String(d).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const fmtInput = (v = "") => fmtThousandsTR(digitsOnly(v));
const parseTR = (v) => {
  if (v == null) return 0;
  const s = String(v).replace(/\./g, "");
  const n = Number(s);
  return isFinite(n) ? n : 0;
};
const parsePct = (v) => {
  if (v == null || v === "") return NaN;
  const s = String(v).replace(",", ".").replace(/[^0-9.]/g, "");
  const n = Number(s);
  return isFinite(n) ? n : NaN;
};
const tl = (n) => (isFinite(n) ? n.toLocaleString("tr-TR") + " TL" : "—");
const d0 = (s) => { const d = new Date(s + "T00:00:00"); d.setHours(0,0,0,0); return d; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const fmtTRDate = (d) => {
  if (!d || isNaN(+d)) return "—";
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
};

/**
 * Oran Tablosu (verdiğin liste normalize edilmiştir)
 * from/to dahil (to null ise açık uçlu)
 * legal = Kanuni; default = Sözleşme yoksa temerrüt; commercial = Ticari temerrüt
 */
const RATE_TABLE = [
  { from: "2002-07-01", to: "2003-06-30", legal: 55,   default: 55,   commercial: 64 },
  { from: "2003-07-01", to: "2003-12-31", legal: 50,   default: 50,   commercial: 57 },
  { from: "2004-01-01", to: "2004-06-30", legal: 43,   default: 43,   commercial: 48 },
  { from: "2004-07-01", to: "2005-04-30", legal: 38,   default: 38,   commercial: 42 },
  { from: "2005-05-01", to: "2005-06-30", legal: 12,   default: 12,   commercial: 42 },
  { from: "2005-07-01", to: "2005-12-31", legal: 12,   default: 12,   commercial: 30 },
  { from: "2006-01-01", to: "2006-12-31", legal: 9,    default: 9,    commercial: 25 },
  { from: "2007-01-01", to: "2007-12-31", legal: 9,    default: 9,    commercial: 29 },
  { from: "2008-01-01", to: "2009-06-30", legal: 9,    default: 9,    commercial: 27 },
  { from: "2009-07-01", to: "2009-12-31", legal: 9,    default: 9,    commercial: 19 },
  { from: "2010-01-01", to: "2010-12-31", legal: 9,    default: 9,    commercial: 16 },
  { from: "2011-01-01", to: "2011-12-31", legal: 9,    default: 9,    commercial: 15 },
  { from: "2012-01-01", to: "2012-12-31", legal: 9,    default: 9,    commercial: 17.75 },
  { from: "2013-01-01", to: "2013-12-31", legal: 9,    default: 9,    commercial: 13.75 },
  { from: "2014-01-01", to: "2014-12-31", legal: 9,    default: 9,    commercial: 11.75 },
  { from: "2015-01-01", to: "2016-12-31", legal: 9,    default: 9,    commercial: 10.50 },
  { from: "2017-01-01", to: "2018-06-30", legal: 9,    default: 9,    commercial: 9.75 },
  { from: "2018-07-01", to: "2018-12-31", legal: 9,    default: 9,    commercial: 19.50 },
  { from: "2019-01-01", to: "2019-12-31", legal: 9,    default: 9,    commercial: 19.50 },
  { from: "2020-01-01", to: "2020-12-31", legal: 9,    default: 9,    commercial: 13.75 },
  { from: "2021-01-01", to: "2021-12-31", legal: 9,    default: 9,    commercial: 16.75 },
  { from: "2022-01-01", to: "2022-12-31", legal: 9,    default: 9,    commercial: 15.75 },
  { from: "2023-01-01", to: "2023-06-30", legal: 9,    default: 9,    commercial: 10.75 },
  { from: "2023-07-01", to: "2024-05-31", legal: 9,    default: 9,    commercial: 16.75 },
  { from: "2024-06-01", to: null,         legal: 24,   default: 24,   commercial: 53.25 },
].map(row => ({
  ...row,
  fromD: d0(row.from),
  toD: row.to ? d0(row.to) : null, // null = açık uçlu
}));

/** Verilen tarih aralığını tablo dönemlerine bölüp hesaplar (ACT/365, basit faiz) */
function computeInterest({ principal, startDate, endDate, includeEnd, kind, customRate }) {
  const s = d0(startDate);
  const e = d0(endDate);
  const eExcl = includeEnd ? addDays(e, 1) : e; // bitiş günü dahilse +1gün

  // Özel oran seçildiyse tabloyu kullanma; tek oranla hesapla
  if (kind === "custom") {
    const days = Math.max(0, Math.floor((eExcl - s) / dayMs));
    const annual = Number(customRate) || 0;
    const interest = principal * (annual / 100) * (days / 365);
    return {
      totalDays: days,
      totalInt: Math.round(interest),
      parts: [{ from: new Date(s), to: addDays(new Date(eExcl), -1), days, annual, interest }],
      avgAnnual: annual,
    };
  }

  const earliest = RATE_TABLE[0].fromD;
  if (s < earliest) {
    // Hesap dışına taşan kısmı kes (2002-07-01 öncesi yok)
    s.setTime(earliest.getTime());
  }

  let totalDays = 0;
  let totalInt = 0;
  const parts = [];

  for (const row of RATE_TABLE) {
    const periodStart = row.fromD;
    const periodEndExcl = addDays(row.toD ?? eExcl, row.toD ? 1 : 0); // to dahil → +1 gün; açık uç: eExcl'e kadar
    const segStart = s > periodStart ? s : periodStart;
    const segEnd = eExcl < periodEndExcl ? eExcl : periodEndExcl;

    const days = Math.max(0, Math.floor((segEnd - segStart) / dayMs));
    if (days <= 0) continue;

    const annual = kind === "legal" ? row.legal : kind === "default" ? row.default : row.commercial;
    const interest = principal * (annual / 100) * (days / 365);

    totalDays += days;
    totalInt += interest;

    parts.push({
      from: new Date(segStart),
      to: addDays(new Date(segEnd), -1), // kullanıcıya dahil aralık olarak göster
      days,
      annual,
      interest,
    });

    // optimize: eExcl bu dönemin sonundan önceyse artık ilerlemeyelim
    if (segEnd.getTime() === eExcl.getTime()) break;
  }

  const avgAnnual = totalDays > 0 ? (totalInt / principal) * (365 / (totalDays)) * 100 : 0;

  return { totalDays, totalInt: Math.round(totalInt), parts, avgAnnual };
}

export default function FaizHesaplama() {
  const [kind, setKind] = useState("legal"); // legal | default | commercial
  const [amount, setAmount] = useState("");
  const [start, setStart] = useState(""); // YYYY-MM-DD
  const [end, setEnd] = useState("");     // YYYY-MM-DD
  const [includeEnd, setIncludeEnd] = useState(false);
  const [customRate, setCustomRate] = useState(""); // %

  const principal = parseTR(amount);

  const result = useMemo(() => {
    if (!principal || !start || !end) return null;
    const cr = parsePct(customRate);
    if (kind === "custom" && !(cr > 0)) return null;
    try {
      return computeInterest({
        principal,
        startDate: start,
        endDate: end,
        includeEnd,
        kind,
        customRate: cr,
      });
    } catch {
      return null;
    }
  }, [principal, start, end, includeEnd, kind, customRate]);

  const totalWithPrincipal = result ? principal + result.totalInt : principal;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-1">Faiz Hesaplama</h1>
      <div className="text-xs text-slate-400 mb-4">
        Oranlar, verdiğin dönem tablosuna göre normalize edilmiştir. Basit faiz (ACT/365) uygulanır.
        "Özel Oran (%)" seçilirse tablo yerine tek oran kullanılır; tüm dönem boyunca aynı oranla hesaplanır.
        Bitiş günü dahil/haricini anahtarla kontrol edebilirsin.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Girdiler */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="font-medium mb-2">Parametreler</div>

          <label className="block text-sm mb-1">Faiz Türü</label>
          <select value={kind} onChange={e=>setKind(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 mb-2">
            <option value="legal">Kanunî Faiz Oranı</option>
            <option value="default">Sözleşmeyle Tespit Edilmemişse Temerrüt</option>
            <option value="commercial">Ticarî İşlerde Temerrüt</option>
            <option value="custom">Özel Oran (%)</option>
          </select>
          {kind === "custom" && (
            <div className="mb-3">
              <label className="block text-sm mb-1">Özel Oran (%)</label>
              <input value={customRate}
                     onChange={(e)=>setCustomRate(e.target.value.replace(/[^0-9.,]/g, ""))}
                     placeholder="örn. 18,5"
                     className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
              <div className="text-xs text-slate-400 mt-1">Yıllık basit faiz oranı; tüm dönem boyunca tek oran olarak uygulanır.</div>
            </div>
          )}

          <label className="block text-sm mb-1">Ana Para (TL)</label>
          <input value={amount} onChange={e=>setAmount(fmtInput(e.target.value))} inputMode="numeric"
                 placeholder="örn. 250.000"
                 className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 mb-3" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Başlangıç</label>
              <input type="date" value={start} onChange={e=>setStart(e.target.value)}
                     className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Bitiş</label>
              <input type="date" value={end} onChange={e=>setEnd(e.target.value)}
                     className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <input id="incl" type="checkbox" checked={includeEnd} onChange={()=>setIncludeEnd(v=>!v)} />
            <label htmlFor="incl">Bitiş günü **dahil** olsun</label>
          </div>

          <div className="text-xs text-slate-400 mt-2">
            01.07.2002’den önceki tarihler tablo dışında kabul edilip kırpılır. 01.06.2024’ten sonrası için güncel
            oran: Kanunî/Temerrüt %24, Ticarî Temerrüt %53.25.
          </div>
        </div>

        {/* Sonuçlar */}
        <div className="rounded-xl border border-emerald-600/60 bg-emerald-900/15 p-4">
          <div className="text-sm uppercase tracking-wide text-emerald-300 mb-2">Sonuç</div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">Toplam Gün</div>
              <div className="text-xl font-semibold">{result ? result.totalDays.toLocaleString("tr-TR") : "—"}</div>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">Toplam Faiz</div>
              <div className="text-2xl font-bold">{result ? tl(result.totalInt) : "—"}</div>
              {result && (
                <div className="text-xs text-slate-400 mt-1">
                  Ağırlıklı ortalama yıllık oran ≈ {result.avgAnnual.toFixed(2)}%
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">Ana Para + Faiz</div>
              <div className="text-2xl font-bold">{tl(totalWithPrincipal)}</div>
            </div>

            {result && result.parts.length > 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
                <div className="text-sm text-slate-300 mb-1">Dönem Kırılımı</div>
                <div className="text-xs grid gap-2">
                  {result.parts.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 border-b border-slate-700/50 pb-1">
                      <div className="flex-1">
                        <div>{fmtTRDate(p.from)} – {fmtTRDate(p.to)} <span className="opacity-70">({p.days} gün)</span></div>
                        <div className="opacity-70">Oran: {p.annual.toString().replace(".", ",")}%</div>
                      </div>
                      <div className="font-medium">{tl(Math.round(p.interest))}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!result && (
              <div className="text-xs text-slate-400">
                Lütfen **faiz türü**, **ana para**, **başlangıç** ve **bitiş** tarihlerini giriniz.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}