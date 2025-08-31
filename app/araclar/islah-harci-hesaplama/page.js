// app/araclar/islah-harci/page.js
"use client";

import { useMemo, useState } from "react";

/* Yardımcılar */
const digitsOnly = (s = "") => String(s).replace(/\D/g, "");
const fmtThousandsTR = (d = "") => String(d).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const fmtInput = (v = "") => fmtThousandsTR(digitsOnly(v));
const parseTR = (v) => {
  if (v == null || v === "") return 0;
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

/* Varsayılan oranlar (2024–2025 pratiği) */
const DEFAULT_BINDE = 68.31; // Nispi karar-ilam harcı (binde)
const DEFAULT_PESHIN = 25;   // Peşin oran (yüzde %25 = 1/4)

export default function IslahHarci() {
  const [caseType, setCaseType] = useState("general"); // "general" | "death"
  const [mode, setMode] = useState("fromto"); // fromto | delta
  const [ilk, setIlk] = useState("");         // İlk dava değeri (TL)
  const [yeni, setYeni] = useState("");       // Islah sonrası değer (TL)
  const [delta, setDelta] = useState("");     // Artış tutarı (TL) - alternatif giriş

  // Gelişmiş: oranlar
  const [binde, setBinde] = useState(String(DEFAULT_BINDE).replace(".", ","));
  const [pesinPct, setPesinPct] = useState(String(DEFAULT_PESHIN).replace(".", ","));

  const artıs = useMemo(() => {
    if (mode === "delta") return parseTR(delta);
    const vIlk = parseTR(ilk);
    const vYeni = parseTR(yeni);
    return Math.max(0, vYeni - vIlk);
  }, [mode, ilk, yeni, delta]);

  const oranBinde = parsePct(binde);
  const oranPesinBase = parsePct(pesinPct);
  const oranPesinEff = caseType === "death" ? 5 : oranPesinBase; // Ölüm/cismanî: %5 (1/20)

  const efektifYillikYuzde = isFinite(oranBinde) && isFinite(oranPesinEff)
    ? (oranBinde / 10) * (oranPesinEff / 100)
    : NaN;

  const islahHarci = useMemo(() => {
    if (!(artıs > 0) || !(oranBinde > 0) || !(oranPesinEff > 0)) return 0;
    // Artış × (binde / 1000) × (peşin %)
    const tutar = artıs * (oranBinde / 1000) * (oranPesinEff / 100);
    return Math.round(tutar);
  }, [artıs, oranBinde, oranPesinEff, caseType]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-1">Islah Harcı Hesaplama</h1>
      <div className="text-xs text-slate-400 mb-4">
        Islah harcı; <em>artış tutarı</em> üzerinden, nispi karar‑ilam harcının peşin kısmı esas alınarak hesaplanır.
        Genel davalarda peşin <strong>%25</strong> (1/4), <strong>ölüm/cismanî zarar</strong> davalarında <strong>%5</strong> (1/20) uygulanır.
        Varsayılan binde <strong>68,31</strong>. (2024–2025)
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Girdiler */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="font-medium mb-3">Parametreler</div>
          <div className="mb-3 text-sm">
            <div className="font-medium mb-1">Dava Türü</div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="ctype" value="general"
                       checked={caseType==="general"} onChange={()=>setCaseType("general")} />
                <span>Genel tazminat (peşin %25)</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="ctype" value="death"
                       checked={caseType==="death"} onChange={()=>setCaseType("death")} />
                <span>Ölüm / Cismanî zarar (peşin %5 — HK m.28/a)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mb-3 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="mode" value="fromto"
                     checked={mode==="fromto"} onChange={()=>setMode("fromto")} />
              <span>İlk değer → Islah sonrası değer</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="mode" value="delta"
                     checked={mode==="delta"} onChange={()=>setMode("delta")} />
              <span>Sadece artış tutarı</span>
            </label>
          </div>

          {mode === "fromto" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">İlk Dava Değeri (TL)</label>
                <input value={ilk} onChange={(e)=>setIlk(fmtInput(e.target.value))}
                       inputMode="numeric" placeholder="örn. 50.000"
                       className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Islah Sonrası Değer (TL)</label>
                <input value={yeni} onChange={(e)=>setYeni(fmtInput(e.target.value))}
                       inputMode="numeric" placeholder="örn. 125.000"
                       className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm mb-1">Artış Tutarı (TL)</label>
              <input value={delta} onChange={(e)=>setDelta(fmtInput(e.target.value))}
                     inputMode="numeric" placeholder="örn. 75.000"
                     className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
            </div>
          )}

          <details className="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            <summary className="cursor-pointer text-sm select-none">Gelişmiş: Oranları düzenle</summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-sm mb-1">Nispi Karar-İlam Harcı (binde)</label>
                <input value={binde}
                       onChange={(e)=>setBinde(e.target.value.replace(/[^0-9.,]/g,""))}
                       placeholder="68,31"
                       className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Peşin Oran (%)</label>
                <input
                  value={caseType === "death" ? "5" : pesinPct}
                  disabled={caseType === "death"}
                  onChange={(e)=>setPesinPct(e.target.value.replace(/[^0-9.,]/g,""))}
                  placeholder="25"
                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2" />
                <div className="text-xs text-slate-400 mt-1">
                  {caseType === "death"
                    ? "Ölüm/cismanî zarar istisnası gereği peşin oran %5 (1/20) olarak sabitlenir."
                    : "Genel davalarda varsayılan %25 (1/4). Gerekirse değiştirilebilir."}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Efektif yıllık yüzdelik ≈ {isFinite(efektifYillikYuzde) ? efektifYillikYuzde.toFixed(6).replace(".", ",") : "—"}%
              {" "} (ör. 68,31 binde ve %25 → ≈ 0,170775%)
            </div>
          </details>
        </div>

        {/* Sonuçlar */}
        <div className="rounded-xl border border-emerald-600/60 bg-emerald-900/15 p-4">
          <div className="text-sm uppercase tracking-wide text-emerald-300 mb-2">Sonuç</div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">Artış Tutarı</div>
              <div className="text-2xl font-bold">{tl(artıs)}</div>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">Islah Harcı</div>
              <div className="text-2xl font-bold">{tl(islahHarci)}</div>
              <div className="text-xs text-slate-400 mt-1">
                Formül: Artış × (binde {isFinite(oranBinde)? String(oranBinde).replace(".", ","): "—"} / 1000) × (%{isFinite(oranPesinEff)? String(oranPesinEff).replace(".", ","): "—"}).
              </div>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="text-sm text-slate-300">Açıklama</div>
              <div className="text-xs text-slate-400">
                Islah harcı; ıslah edilen kısım için **peşin nispi karar-ilam harcının** tamamlanmasıdır. Harç yatırılmazsa ıslah
                hukuki sonuç doğurmaz (mahkemece verilen sürede tamamlanmadıkça). 
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}