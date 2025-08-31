// Updated file content begins here
"use client";
import { useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Araç Değer Kaybı — Detaylı Hesap (Yalnızca A Kodu: Otomobil)
// Formül: DK = PiyasaDeğeri × R × K × H × G
//  - R: Rayiç Değer Katsayısı (A kodu için piyasa bandına göre)
//  - K: Kullanılmışlık Katsayısı (km bandına göre)
//  - H: Hasar Etki Katsayısı = (HK + T) / 100
//       • HK: Parça bazlı (P + O + Y) toplamı
//       • T: ((Hasar Tutarı / Piyasa Değeri) × 100) × 0.10
//  - G: Genel Katsayı = 1 + (G2 + G3). (Taksi / ticari çarpanları uygulanmaz)
//       • G2 = SBM kayıt sayısı başına −0.03 (en çok −0.15)
//       • G3 = K bandı alt sınırına ≤ 1000 km yakınsa +0.05
// Not: Bu sayfa yalnızca A kodu (Otomobil) içindir.
// ─────────────────────────────────────────────────────────────────────────────

function formatTL(x) {
  const n = Number(x);
  if (!isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}

// TR number helpers: format thousand separators while typing & parse back
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

// R katsayısı (A kodu) — piyasa değer bandına göre
// Eşikler (TRY): [0, 50k, 100k, 200k, 300k, 400k, 500k, 750k+]
// Katsayılar:   [0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00]
const R_BANDS_A = [
  { min: 0,       max: 49_999,   r: 0.65 },
  { min: 50_000,  max: 99_999,   r: 0.70 },
  { min: 100_000, max: 199_999,  r: 0.75 },
  { min: 200_000, max: 299_999,  r: 0.80 },
  { min: 300_000, max: 399_999,  r: 0.85 },
  { min: 400_000, max: 499_999,  r: 0.90 },
  { min: 500_000, max: 749_999,  r: 0.95 },
  { min: 750_000, max: Infinity, r: 1.00 },
];

function getR_A(market) {
  const mv = parseTR(market);
  const band = R_BANDS_A.find(b => mv >= b.min && mv <= b.max);
  return band ? band.r : 0;
}

// K katsayısı (A kodu) — km bandına göre
// Eşikler (km): [0–19,999]=1.00; 20–49,999=0.95; 50–99,999=0.90;
//               100–149,999=0.85; 150–199,999=0.80; 200–299,999=0.75; 300k+=0.70
const K_BANDS_A = [
  { min: 0,       max: 19_999,   k: 1.00 },
  { min: 20_000,  max: 49_999,   k: 0.95 },
  { min: 50_000,  max: 99_999,   k: 0.90 },
  { min: 100_000, max: 149_999,  k: 0.85 },
  { min: 150_000, max: 199_999,  k: 0.80 },
  { min: 200_000, max: 299_999,  k: 0.75 },
  { min: 300_000, max: Infinity, k: 0.70 },
];

function getK_A(km) {
  const v = parseTR(km);
  const band = K_BANDS_A.find(b => v >= b.min && v <= b.max);
  return { k: band ? band.k : 0, lower: band ? band.min : 0 };
}

// Parça katsayı haritaları
const O_MAP = { hafif: 0.50, orta: 1.00, yuksek: 1.50 }; // Onarım
const Y_MAP = { yok: 0.00, lokal: 0.25, tam: 0.50 };     // Boya

const DEFAULT_PARTS = [
  "Ön Tampon","Arka Tampon","Ön Tampon Demiri","Arka Tampon Demiri",
  "Ön Panel Üst","Ön Panel Alt","Radyatör Paneli","Ön Panel",
  "Arka Panel Üst","Arka Panel Alt","Arka Panel",
  "Ön Kaput","Bagaj Kapağı","Tavan",
  "Ön Çamurluk","Arka Çamurluk",
  "Ön Kapı","Arka Kapı",
  "Marşpiyel",
  "Şasi Ucu","Arka Şasi Ucu",
  "A Sütunu","B Sütunu","C Sütunu",
  "Davlumbaz Ön","Davlumbaz Arka",
  "Taban Sacı","Şanzıman Tüneli",
  "Ön Kule/Tablan","Arka Kule/Tablan",
  "Şasi Longitudinal","Ön Travers","Arka Çapraz Travers",
  "Kapı İç Sacı","Çamurluk İç Sacı",
  "Ön Panel Bağlantı Braketi","Tampon Bağlantı Braketi (Ön)","Tampon Bağlantı Braketi (Arka)",
  "Ön Panel Yan Parça","Radyatör Bağlantı Traversi",
  "Arka Havuz (Bagaj Havuzu)","Arka Yan Panel",
  "Yakıt Kapağı Bölgesi","Ön Cam Çerçevesi","Arka Cam Çerçevesi",
  "Kapı Eşiği","Direk Ayağı","Kanat Ucu","Ayak Sacı"
];

const SIDED_PARTS = new Set([
  "Ön Çamurluk","Arka Çamurluk","Ön Kapı","Arka Kapı","Marşpiyel",
  "Şasi Ucu","Arka Şasi Ucu","A Sütunu","B Sütunu","C Sütunu",
  "Davlumbaz Ön","Davlumbaz Arka","Kapı İç Sacı","Çamurluk İç Sacı",
  "Arka Yan Panel","Kanat Ucu","Ayak Sacı"
]);
function isSidedName(name="") { return SIDED_PARTS.has((name||"").trim()); }

function suggestLevelFromRatio(partPrice, laborPrice) {
  const p = parseTR(partPrice);
  const l = parseTR(laborPrice);
  if (!isFinite(p) || !isFinite(l) || l <= 0) return "yuksek";
  const ratio = (p / l) * 100;
  if (ratio <= 15) return "hafif";
  if (ratio <= 30) return "orta";
  return "yuksek";
}
function computeLevel(it) {
  if (it.op !== "onarim") return "orta";
  if (!it.hasLaborDoc) return "yuksek";
  return suggestLevelFromRatio(it.partPrice, it.laborPrice);
}

export default function AracDegerKaybiDetayli() {
  // Girdiler
  const [market, setMarket] = useState("");           // Piyasa değeri (TL) — formatted
  const [km, setKm] = useState("");                   // Kilometre — formatted
  const [damage, setDamage] = useState("");           // Hasar tutarı (TL) — formatted
  const [sbmCount, setSbmCount] = useState("");       // Geçmiş hasar kayıt sayısı — formatted

  // Parça listesi
  const [parts, setParts] = useState([]);

  const addPart = () => setParts(p => [
    ...p,
    {
      name: "",
      op: "onarim",
      hasLaborDoc: false,
      partPrice: "",
      laborPrice: "",
      paint: "lokal",
      sideLeft: false,
      sideRight: false,
    }
  ]);
  const updatePart = (idx, patch) => {
    setParts(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removePart = (idx) => setParts(prev => prev.filter((_, i) => i !== idx));

  // Hesaplamalar
  const r = useMemo(() => getR_A(market), [market]);
  const { k, lower: kLower } = useMemo(() => getK_A(km), [km]);

  // HK = Σ (P + O + Y) × çarpan (sol/sağ)
  const hk = useMemo(() => {
    return parts.reduce((sum, it) => {
      const times = isSidedName(it.name)
        ? Math.max(1, (it.sideLeft ? 1 : 0) + (it.sideRight ? 1 : 0))
        : 1;
      const p = it.op === "degisim" ? 1.00 : 0.00;
      const o = it.op === "onarim" ? (O_MAP[computeLevel(it)] ?? 0) : 0.00;
      const y = Y_MAP[it.paint] ?? 0.00;
      return sum + (p + o + y) * times;
    }, 0);
  }, [parts]);

  // T = ((hasar/piyasa)*100) * 0.10
  const t = useMemo(() => {
    const mv = parseTR(market);
    const d = parseTR(damage);
    if (mv <= 0 || d <= 0) return 0;
    return ((d / mv) * 100) * 0.10;
  }, [market, damage]);

  // H = (HK + T) / 100 (0..1 aralığına sıkıştır)
  const h = useMemo(() => {
    const raw = (hk + t) / 100;
    if (!isFinite(raw)) return 0;
    return Math.max(0, Math.min(1, raw));
  }, [hk, t]);

  // G = 1 + (G2 + G3).
  const g2 = useMemo(() => {
    const n = Math.max(0, Math.min(5, parseTR(sbmCount || 0)));
    return -0.03 * n; // en çok −0.15
  }, [sbmCount]);

  const g3 = useMemo(() => {
    const v = parseTR(km);
    if (v <= 0) return 0;
    // Aktif km bandının alt sınırına yakınlık (≤ 1000 km)
    return v - kLower <= 1000 ? 0.05 : 0.0;
  }, [km, kLower]);

  const g = useMemo(() => 1 + g2 + g3, [g2, g3]);

  // DK = market * r * k * h * g
  const dk = useMemo(() => {
    const mv = parseTR(market);
    const val = mv * r * k * h * g;
    if (!isFinite(val)) return 0;
    return Math.max(0, Math.round(val));
  }, [market, r, k, h, g]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">Araç Değer Kaybı Hesaplama Botu</h1>
        <p className="text-sm text-slate-300 mb-6">
         Bu hesaplama aracı yalnızca <strong>Otomobil</strong> içindir.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <label className="block text-sm mb-1">Piyasa Değeri (TL)</label>
            <input
              value={market}
              onChange={(e) => setMarket(fmtInput(e.target.value))}
              inputMode="numeric"
              placeholder="Örn: 950.000"
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
            />
           
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <label className="block text-sm mb-1">Kilometre</label>
            <input
              value={km}
              onChange={(e) => setKm(fmtInput(e.target.value))}
              inputMode="numeric"
              placeholder="Örn: 42.000"
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
            />
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <label className="block text-sm mb-1">Hasar Tutarı (TL)</label>
            <input
              value={damage}
              onChange={(e) => setDamage(fmtInput(e.target.value))}
              inputMode="numeric"
              placeholder="Örn: 35.000"
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
            />
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <label className="block text-sm mb-1">Geçmiş Hasar Kayıt Sayısı</label>
            <input
              value={sbmCount}
              onChange={(e) => setSbmCount(fmtInput(e.target.value))}
              inputMode="numeric"
              placeholder="0"
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
            />
          </div>
        </div>

        {/* Parça Listesi */}
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Hasarlı Parçalar</h2>
            <button
              onClick={addPart}
              className="px-3 py-1.5 text-sm rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              + Parça Ekle
            </button>
          </div>

          <div className="space-y-3">
            {parts.map((it, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border border-slate-700 p-3">
                {/* 1. Satır: Parça + Sol/Sağ + Boya + Sil */}
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={it.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      const sided = isSidedName(v);
                      updatePart(idx, {
                        name: v,
                        ...(sided ? {} : { sideLeft: false, sideRight: false })
                      });
                    }}
                    className="min-w-[220px] flex-none rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
                  >
                    <option value="">Parça seçin</option>
                    {DEFAULT_PARTS.map(pn => (
                      <option key={pn} value={pn}>{pn}</option>
                    ))}
                  </select>

                  {isSidedName(it.name) && (
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          className="accent-cyan-500"
                          checked={!!it.sideLeft}
                          onChange={(e) => updatePart(idx, { sideLeft: e.target.checked })}
                        />
                        Sol
                      </label>
                      <label className="inline-flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          className="accent-cyan-500"
                          checked={!!it.sideRight}
                          onChange={(e) => updatePart(idx, { sideRight: e.target.checked })}
                        />
                        Sağ
                      </label>
                    </div>
                  )}

                  {/* Boya seçimi 1. satırda */}
                  <select
                    value={it.paint}
                    onChange={(e) => updatePart(idx, { paint: e.target.value })}
                    className="rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
                  >
                    <option value="yok">Boya Yok</option>
                    <option value="lokal">Boya (Lokal)</option>
                    <option value="tam">Boya (Tam)</option>
                  </select>

                  <button
                    onClick={() => removePart(idx)}
                    className="ml-auto px-2 py-1 text-xs rounded-md border border-slate-600 hover:bg-slate-700"
                  >
                    Sil
                  </button>
                </div>

                {/* 2. Satır: Onarım/Değişim + (onarım ise) İşçilik Ücreti Ödeme Belgesi Var/Yok ve TL alanları */}
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={it.op}
                    onChange={(e) => updatePart(idx, { op: e.target.value })}
                    className="rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
                  >
                    <option value="degisim">Değişim</option>
                    <option value="onarim">Onarım</option>
                  </select>

                  {it.op === "onarim" && (
                    <>
                      <select
                        value={it.hasLaborDoc ? "var" : "yok"}
                        onChange={(e) => {
                          const has = e.target.value === "var";
                          updatePart(idx, {
                            hasLaborDoc: has,
                            ...(has ? {} : { partPrice: "", laborPrice: "" })
                          });
                        }}
                        className="rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
                        title="İşçilik Ücreti Ödeme Belgesi"
                      >
                        <option value="yok">İşçilik Ücreti Ödeme Belgesi: Yok</option>
                        <option value="var">İşçilik Ücreti Ödeme Belgesi: Var</option>
                      </select>

                      {it.hasLaborDoc && (
                        <>
                          <input
                            value={it.partPrice ?? ""}
                            onChange={(e) => {
                              const val = fmtInput(e.target.value);
                              updatePart(idx, { partPrice: val });
                            }}
                            inputMode="numeric"
                            placeholder="Parça bedeli (TL)"
                            className="w-[180px] rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-right"
                            aria-label="Parça bedeli (KDV hariç)"
                            title="Parça bedeli (KDV hariç)"
                          />
                          <input
                            value={it.laborPrice ?? ""}
                            onChange={(e) => {
                              const val = fmtInput(e.target.value);
                              updatePart(idx, { laborPrice: val });
                            }}
                            inputMode="numeric"
                            placeholder="İşçilik bedeli (TL)"
                            className="w-[180px] rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-right"
                            aria-label="İşçilik bedeli (KDV hariç)"
                            title="İşçilik bedeli (KDV hariç)"
                          />
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Özet satırı */}
                <div className="text-xs text-slate-400">
                  {(() => {
                    const p = it.op === "degisim" ? 1.0 : 0.0;
                    const o = it.op === "onarim" ? (O_MAP[computeLevel(it)] ?? 0) : 0.0;
                    const y = Y_MAP[it.paint] ?? 0.0;
                    const times = isSidedName(it.name)
                      ? Math.max(1, (it.sideLeft ? 1 : 0) + (it.sideRight ? 1 : 0))
                      : 1;
                    return `P:${p.toFixed(2)} · O:${o.toFixed(2)} · Y:${y.toFixed(2)}${times > 1 ? " ×" + times : ""}`;
                  })()}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-sm">
            HK (toplam) = <span className="font-semibold">{hk.toFixed(2)}</span>
          </div>
        </div>

        {/* Sonuçlar */}
        <div className="mt-6 p-5 rounded-xl border border-cyan-600 bg-cyan-900/20">
          <div className="text-sm uppercase tracking-wide text-cyan-300 mb-1">Sonuç</div>
          <div className="text-3xl font-bold">{formatTL(dk)}</div>
          <div className="grid gap-2 md:grid-cols-2 mt-4 text-sm">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div>R (Rayiç Katsayısı): <strong>{r.toFixed(2)}</strong></div>
              <div>K (Kullanılmışlık Katsayısı): <strong>{k.toFixed(2)}</strong></div>
              <div>H = (HK + T)/100: <strong>{h.toFixed(3)}</strong></div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div>HK (Parça Toplam Katsayı): <strong>{hk.toFixed(2)}</strong></div>
              <div>T (Hasar Tutarı Katsayısı): <strong>{t.toFixed(2)}</strong></div>
              <div>G = 1 + (G2 + G3): <strong>{g.toFixed(2)}</strong> (G2:{g2.toFixed(2)}, G3:{g3.toFixed(2)})</div>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-3">
            Not: Bu hesaplama aracı yalnızca <strong>Otomobil (A kodu)</strong> için yapılandırılmıştır. Taksi/ticari ve diğer araçlar için doğru sonuçlar vermez.
          </div>
        </div>
      </div>
    </div>
  );
}