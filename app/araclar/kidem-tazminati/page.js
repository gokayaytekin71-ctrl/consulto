// app/araclar/kidem-tazminati/page.jsx
"use client";

import { useMemo, useState } from "react";

// yardımcılar (TL alanları için . otomatik)
function digitsOnly(s = "") { return String(s).replace(/\D/g, ""); }
function fmtThousandsTR(d = "") { return String(d).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function fmtInput(v = "") { return fmtThousandsTR(digitsOnly(v)); }
function parseTR(v) { if (v == null) return 0; const s = String(v).replace(/\./g, "").replace(",", "."); const n = Number(s); return isFinite(n) ? n : 0; }

function diffDays(aStr, bStr) {
  if (!aStr || !bStr) return 0;
  const a = new Date(aStr + "T00:00:00");
  const b = new Date(bStr + "T00:00:00");
  const ms = b - a;
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export default function KidemTazminati() {
  // tarihler
  const [start, setStart] = useState(""); // işe giriş
  const [end, setEnd] = useState("");     // işten çıkış

  // brütler
  const [gross, setGross] = useState("");       // aylık brüt maaş
  const [yemek, setYemek] = useState("");       // düzenli yemek (brüt/ay)
  const [yol, setYol] = useState("");           // düzenli yol (brüt/ay)
  const [diger, setDiger] = useState("");       // diğer düzenli (brüt/ay)

  // tavan ve vergi
  const CAP_MONTHLY = 53919.68; // Kıdem tazminatı tavanı (aylık) — sabit
  const STAMP_PCT = 0.759;     // Damga vergisi % — sabit

  // süre
  const totalDays = useMemo(() => diffDays(start, end), [start, end]);
  const years = useMemo(() => Math.floor(totalDays / 365), [totalDays]);
  const remDays = useMemo(() => totalDays % 365, [totalDays]);

  // baz brüt (aylık)
  const baseMonthly = useMemo(() => {
    return parseTR(gross) + parseTR(yemek) + parseTR(yol) + parseTR(diger);
  }, [gross, yemek, yol, diger]);

  // tavan uygulanacak mı?
  const unitYear = useMemo(() => {
    return Math.min(baseMonthly, CAP_MONTHLY);
  }, [baseMonthly]);

  // brüt kıdem (yıl + oransal gün)
  const severanceGross = useMemo(() => {
    const dayPart = unitYear * (remDays / 365);
    return Math.max(0, unitYear * years + dayPart);
  }, [unitYear, years, remDays]);

  // damga vergisi
  const stampRate = STAMP_PCT;

  const severanceNet = useMemo(() => {
    return Math.round(severanceGross * (1 - stampRate / 100));
  }, [severanceGross, stampRate]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-1">Kıdem Tazminatı Hesaplama</h1>
      <div className="text-xs text-slate-400 mb-4">
        Her tam yıl için <strong>30 günlük brüt ücret</strong> esas alınır; ay/günler orantılı eklenir. Düzenli yan ödemeler (yemek, yol, ikramiye vb.) brüte dahil edilebilir.
      </div>
      <div className="text-xs text-slate-400 mb-4">Tavan (aylık): <strong>{CAP_MONTHLY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</strong> · Damga Vergisi: <strong>%{String(STAMP_PCT).replace(".", ",")}</strong> (sabit)</div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Tarihler */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="font-medium mb-2">Çalışma Süresi</div>
          <label className="block text-sm mb-1">İşe Giriş Tarihi</label>
          <input type="date" value={start} onChange={e=>setStart(e.target.value)}
                 className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 mb-2" />
          <label className="block text-sm mb-1">İşten Çıkış Tarihi</label>
          <input type="date" value={end} onChange={e=>setEnd(e.target.value)}
                 className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
          <div className="text-xs text-slate-400 mt-2">
            Süre: <strong>{years}</strong> yıl, <strong>{remDays}</strong> gün ({totalDays} gün)
          </div>
        </div>

        {/* Brütler */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="font-medium mb-2">Aylık Brüt Ödemeler</div>
          <label className="block text-sm mb-1">Brüt Maaş (TL)</label>
          <input value={gross} onChange={e=>setGross(fmtInput(e.target.value))} inputMode="numeric" placeholder="örn. 30.000"
                 className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 mb-2" />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs mb-1">Yemek</label>
              <input value={yemek} onChange={e=>setYemek(fmtInput(e.target.value))} inputMode="numeric" placeholder="0"
                     className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs mb-1">Yol</label>
              <input value={yol} onChange={e=>setYol(fmtInput(e.target.value))} inputMode="numeric" placeholder="0"
                     className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs mb-1">Diğer</label>
              <input value={diger} onChange={e=>setDiger(fmtInput(e.target.value))} inputMode="numeric" placeholder="0"
                     className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Baz brüt (aylık): <strong>{parseTR(baseMonthly.toFixed(0)).toLocaleString("tr-TR")} TL</strong>
          </div>
        </div>

        {/* Sonuç */}
        <div className="md:col-span-2 p-5 rounded-xl border border-emerald-600/60 bg-emerald-900/15">
          <div className="text-sm uppercase tracking-wide text-emerald-300 mb-1">Kıdem Tazminatı</div>
          <div className="text-3xl font-bold">{parseTR(severanceNet.toFixed(0)).toLocaleString("tr-TR")} TL</div>

          <div className="grid gap-2 md:grid-cols-3 mt-4 text-sm">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div>Yıl × Birim: <strong>{years}</strong> × <strong>{parseTR(unitYear.toFixed(0)).toLocaleString("tr-TR")} TL</strong></div>
              <div>Artık gün: <strong>{remDays}</strong> gün</div>
              <div>Günlük birim: <strong>{parseTR((unitYear/365).toFixed(2)).toLocaleString("tr-TR")}</strong></div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div>Artık gün tutarı: <strong>{parseTR((unitYear * remDays / 365).toFixed(0)).toLocaleString("tr-TR")} TL</strong></div>
              <div>Brüt toplam: <strong>{parseTR(severanceGross.toFixed(0)).toLocaleString("tr-TR")} TL</strong></div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div>Damga vergisi: <strong>%{String(STAMP_PCT).replace(".", ",")}</strong></div>
              <div>Net ödenecek: <strong>{parseTR(severanceNet.toFixed(0)).toLocaleString("tr-TR")} TL</strong></div>
            </div>
          </div>

          <div className="text-xs text-slate-400 mt-3 leading-relaxed">
            Formül: (Yıl × 30 günlük brüt) + (Gün/365 × 30 günlük brüt). Tavan uygulanıyorsa birim, tavanla sınırlandırılır.
          </div>
        </div>
      </div>
    </div>
  );
}