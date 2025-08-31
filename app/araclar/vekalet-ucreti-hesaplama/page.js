// app/araclar/vekalet-ucreti/page.js
"use client";

import { useMemo, useState } from "react";

/* ——— Yardımcılar ——— */
const digitsOnly = (s = "") => String(s).replace(/\D/g, "");
const fmtThousandsTR = (d = "") => String(d).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const fmtInput = (v = "") => fmtThousandsTR(digitsOnly(v));
const parseTR = (v) => {
  if (v == null) return 0;
  const s = String(v).replace(/\./g, "");
  const n = Number(s);
  return isFinite(n) ? n : 0;
};
const tl = (n) => (isFinite(n) ? n.toLocaleString("tr-TR") + " TL" : "—");

/* ——— AAÜT 2024–2025 veri seti ———
   Kaynak: TBB 2024–2025 AAÜT (03.10.2024 RG) ve baro duyuruları.
   Not: Oranlar yıldan yıla değişebilir; gerekirse aşağıdaki tabloları güncelle.
   (nispi dilimler: ilk 400k %16, sonraki 400k %15, 800k %14, 1.2m %11, 1.6m %8, 2m %5, 2.4m %3, 2.8m %2, üstü %1)
*/
const NISPI_STEPS_2025 = [
  { upTo: 400_000, rate: 0.16 },
  { upTo: 400_000, rate: 0.15 },
  { upTo: 800_000, rate: 0.14 },
  { upTo: 1_200_000, rate: 0.11 },
  { upTo: 1_600_000, rate: 0.08 },
  { upTo: 2_000_000, rate: 0.05 },
  { upTo: 2_400_000, rate: 0.03 },
  { upTo: 2_800_000, rate: 0.02 },
  { upTo: Infinity, rate: 0.01 },
];

/* Maktû örnek kalemler (pratikte bu liste genişletilir) */
const MAKTU_2025 = {
  // Sık kullanılanlar (gerekirse artır)
  "sulh-hukuk": 13_500,           // Sulh Hukuk Mahkemeleri (2025 örnek)
  "asliye": 30_000,               // Asliye Mahkemeleri (2025 örnek)
  "tuketici": 30_000,             // Tüketici Mahkemeleri (yakın değer; kontrol edilebilir)
  "icra-mahkemesi": 13_500,       // İcra Mahkemeleri
  "idare-durusmasiz": 30_000,     // İdare/Vergi (duruşmasız)
  "idare-durusmali": 37_000,      // İdare/Vergi (duruşmalı) — tahmini/örnek, güncellenebilir
  "fikri-sinai": 45_000,          // FSHHM — örnek
  "sulh-ceza-infaz": 13_500,      // Sulh Ceza / İnfaz Hâkimliği — örnek
  // İcra takipleri (maktu asgari ücrete tabi alt sınır)
  "icra-takip": 13_500,
};

const ASLIYE_MAKTU = MAKTU_2025["asliye"] ?? 0; // para davaları için referans maktû eşik (meblağ altındaysa meblağ kadar)

/* Nispi vekâlet ücreti hesaplaması (AAÜT 2024–2025) */
function calcNispi(value) {
  let rem = Math.max(0, value);
  let total = 0;
  for (const step of NISPI_STEPS_2025) {
    const use = Math.min(rem, step.upTo);
    if (use <= 0) break;
    total += use * step.rate;
    rem -= use;
  }
  return Math.round(total);
}

const CATEGORIES = [
  { id: "para", label: "Konusu Para Olan Davalar (nispi)" },
  { id: "icra-takip", label: "İcra Takipleri (nispi özel)" },
  { id: "icra-mahkemesi", label: "İcra Mahkemeleri (maktû)" },
  { id: "sulh-hukuk", label: "Sulh Hukuk Mahkemeleri (maktû)" },
  { id: "sulh-ceza-infaz", label: "Sulh Ceza / İnfaz Hâkimlikleri (maktû)" },
  { id: "asliye", label: "Asliye Mahkemeleri (maktû)" },
  { id: "tuketici", label: "Tüketici Mahkemeleri (maktû)" },
  { id: "fikri-sinai", label: "Fikri ve Sınai Haklar Mahkemeleri (maktû)" },
  { id: "idare-durusmali", label: "İdare & Vergi Mahkemeleri — Duruşmalı (maktû)" },
  { id: "idare-durusmasiz", label: "İdare & Vergi Mahkemeleri — Duruşmasız (maktû)" },
];

export default function VekaletUcreti() {
  const [cat, setCat] = useState("para");
  const [val, setVal] = useState("");   // dava/iş değeri (TL)

  /* Hesap */
  const requiresValue = cat === "para" || cat === "icra-takip";
  const V = parseTR(val);

  const applied = useMemo(() => {
    if (cat === "para") {
      // Konusu para olan davalar:
      // - 30.000 TL'ye kadar: meblağ kadar
      // - 30.000 TL üstünde: %16'sı 30.000 TL'yi geçiyorsa nispi; geçmiyorsa 30.000 TL
      if (V > 0 && V <= ASLIYE_MAKTU) return V;
      const sixteenPct = Math.round(V * 0.16);
      if (sixteenPct > ASLIYE_MAKTU) return calcNispi(V);
      return ASLIYE_MAKTU;
    }
    if (cat === "icra-takip") {
      // İcra takipleri (nispi özel):
      // - 6.000 TL'ye kadar: meblağ kadar
      // - 6.000 TL ve üstü: %16'sı 6.000 TL'den az ise 6.000 TL, fazlaysa normal nispi
      if (V <= 6000) return V;
      const sixteenPct = Math.round(V * 0.16);
      if (sixteenPct < 6000) return 6000;
      return calcNispi(V);
    }
    // Diğerleri maktû
    const m = MAKTU_2025[cat];
    return isFinite(m) ? m : 0;
  }, [cat, V]);

  const total = applied;

  /* Nispi kırılımı (gösterim için) */
  const breakdown = useMemo(() => {
    const rows = [];
    if (cat === "para" && V > ASLIYE_MAKTU && Math.round(V*0.16) > ASLIYE_MAKTU) {
      let rem = V;
      for (const s of NISPI_STEPS_2025) {
        if (rem <= 0) break;
        const use = Math.min(rem, s.upTo);
        const tutar = Math.round(use * s.rate);
        rows.push({ dilim: use, oran: s.rate, tutar });
        rem -= use;
      }
    } else if (cat === "icra-takip" && V > 6000 && V * 0.16 >= 6000) {
      let rem = V;
      for (const s of NISPI_STEPS_2025) {
        if (rem <= 0) break;
        const use = Math.min(rem, s.upTo);
        const tutar = Math.round(use * s.rate);
        rows.push({ dilim: use, oran: s.rate, tutar });
        rem -= use;
      }
    }
    return rows;
  }, [cat, V]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-1">Vekâlet Ücreti Hesaplama</h1>
      <div className="text-xs text-slate-400 mb-4">
        AAÜT 2024–2025 nispi dilimleri ve maktû kalemleri esas alınmıştır. Tarife yıllık güncellenir;
        rakamlar mevzuat değişikliklerine göre kolayca güncellenebilir.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Sol: Girdiler */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="font-medium mb-2">Parametreler</div>

          <label className="block text-sm mb-1">Kategori</label>
          <select value={cat} onChange={(e)=>setCat(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 mb-3">
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>

          {requiresValue && (
            <>
              <label className="block text-sm mb-1">{cat === "icra-takip" ? "Takip Konusu Meblağ (TL)" : "Dava/İş Değeri (TL)"}</label>
              <input value={val} onChange={(e)=>setVal(fmtInput(e.target.value))} inputMode="numeric"
                     placeholder={cat === "icra-takip" ? "örn. 4.000" : "örn. 1.250.000"}
                     className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 mb-2"/>
              {cat === "para" ? (
                <div className="text-xs text-slate-400">
                  Konusu para olan davalarda: <strong>30.000 TL'ye kadar</strong> <em>meblağ kadar</em>. 30.000 TL üstünde <em>%16'sı 30.000 TL'yi geçiyorsa nispi</em>, geçmiyorsa <strong>30.000 TL</strong> uygulanır.
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  İcra takiplerinde: <strong>6.000 TL</strong>'ye kadar <em>meblağ kadar</em>. 6.000 TL ve üstünde <em>%16'sı 6.000 TL'den az ise 6.000 TL</em>, fazlaysa <em>nispi dilimler</em> uygulanır.
                </div>
              )}
            </>
          )}
        </div>

        {/* Sağ: Sonuç */}
        <div className="rounded-xl border border-emerald-600/60 bg-emerald-900/15 p-4">
          <div className="text-sm uppercase tracking-wide text-emerald-300 mb-2">Sonuç</div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">AAÜT Vekâlet Ücreti (temel)</div>
              <div className="text-2xl font-bold">{tl(applied)}</div>
              {(cat === "para" && V > 0 && V <= ASLIYE_MAKTU) && (
                <div className="text-xs text-slate-400">Not: Değer Asliye maktû altında olduğundan <em>meblağ kadar</em> uygulandı.</div>
              )}
              {(cat === "para" && V > ASLIYE_MAKTU && Math.round(V*0.16) <= ASLIYE_MAKTU) && (
                <div className="text-xs text-slate-400">Not: %16'sı 30.000 TL'yi geçmediğinden <strong>30.000 TL</strong> uygulandı.</div>
              )}
              {(cat === "icra-takip" && V > 0 && V <= 6000) && (
                <div className="text-xs text-slate-400">Not: İcra — 6.000 TL'ye kadar <em>meblağ kadar</em>.</div>
              )}
              {(cat === "icra-takip" && V > 6000 && (V * 0.16) < 6000) && (
                <div className="text-xs text-slate-400">Not: İcra — %16'sı 6.000 TL'den az olduğundan <strong>6.000 TL</strong> uygulandı.</div>
              )}
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">Toplam</div>
              <div className="text-2xl font-bold">{tl(total)}</div>
            </div>

            {((cat === "para" && V > ASLIYE_MAKTU && Math.round(V*0.16) > ASLIYE_MAKTU) || (cat === "icra-takip" && V > 6000 && V * 0.16 >= 6000)) && breakdown.length > 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
                <div className="text-sm text-slate-300 mb-1">Nispi Kırılım</div>
                <div className="text-xs grid gap-1">
                  {breakdown.map((r, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {r.dilim.toLocaleString("tr-TR")} TL × {(r.oran*100).toFixed(0)}%
                      </span>
                      <span className="font-medium">{tl(r.tutar)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!requiresValue && (
              <div className="text-xs text-slate-400">
                Bu kalem **maktû** ücrete tabidir. Rakamlar AAÜT 2024–2025’e göre örneklenmiştir; tereddütte
                güncel Tarife metnini kontrol ediniz.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}