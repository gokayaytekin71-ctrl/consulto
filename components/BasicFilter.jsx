"use client";
import { useRef, useState, useEffect } from "react";
import LoadingOverlay from "./LoadingOverlay";
import { createPortal } from "react-dom";

const IconInfo = ({ className = "w-4 h-4" }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="9" /><path d="M12 10v6" /><path d="M12 7h.01" /></svg>;
const IconChevronDown = ({ className = "w-4 h-4" }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9l6 6 6-6" /></svg>;

const inputClass = "w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#0f2a4a] focus:ring-1 focus:ring-[#0f2a4a]/15 transition-all";
const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

const organOptions = [
  { label: "Tümü", value: "" },
  { label: "Yargıtay Hukuk Genel Kurulu", value: "Hukuk Genel Kurulu" },
  { label: "Yargıtay Ceza Genel Kurulu", value: "Ceza Genel Kurulu" },
  { label: "Yargıtay 1. Hukuk Dairesi",  value: "1. Hukuk Dairesi" },
  { label: "Yargıtay 2. Hukuk Dairesi",  value: "2. Hukuk Dairesi" },
  { label: "Yargıtay 3. Hukuk Dairesi",  value: "3. Hukuk Dairesi" },
  { label: "Yargıtay 4. Hukuk Dairesi",  value: "4. Hukuk Dairesi" },
  { label: "Yargıtay 5. Hukuk Dairesi",  value: "5. Hukuk Dairesi" },
  { label: "Yargıtay 6. Hukuk Dairesi",  value: "6. Hukuk Dairesi" },
  { label: "Yargıtay 7. Hukuk Dairesi",  value: "7. Hukuk Dairesi" },
  { label: "Yargıtay 8. Hukuk Dairesi",  value: "8. Hukuk Dairesi" },
  { label: "Yargıtay 9. Hukuk Dairesi",  value: "9. Hukuk Dairesi" },
  { label: "Yargıtay 10. Hukuk Dairesi", value: "10. Hukuk Dairesi" },
  { label: "Yargıtay 11. Hukuk Dairesi", value: "11. Hukuk Dairesi" },
  { label: "Yargıtay 12. Hukuk Dairesi", value: "12. Hukuk Dairesi" },
  { label: "Yargıtay 13. Hukuk Dairesi", value: "13. Hukuk Dairesi" },
  { label: "Yargıtay 14. Hukuk Dairesi", value: "14. Hukuk Dairesi" },
  { label: "Yargıtay 15. Hukuk Dairesi", value: "15. Hukuk Dairesi" },
  { label: "Yargıtay 16. Hukuk Dairesi", value: "16. Hukuk Dairesi" },
  { label: "Yargıtay 17. Hukuk Dairesi", value: "17. Hukuk Dairesi" },
  { label: "Yargıtay 18. Hukuk Dairesi", value: "18. Hukuk Dairesi" },
  { label: "Yargıtay 19. Hukuk Dairesi", value: "19. Hukuk Dairesi" },
  { label: "Yargıtay 20. Hukuk Dairesi", value: "20. Hukuk Dairesi" },
  { label: "Yargıtay 21. Hukuk Dairesi", value: "21. Hukuk Dairesi" },
  { label: "Yargıtay 22. Hukuk Dairesi", value: "22. Hukuk Dairesi" },
  { label: "Yargıtay 23. Hukuk Dairesi", value: "23. Hukuk Dairesi" },
  { label: "Yargıtay 1. Ceza Dairesi",  value: "1. Ceza Dairesi" },
  { label: "Yargıtay 2. Ceza Dairesi",  value: "2. Ceza Dairesi" },
  { label: "Yargıtay 3. Ceza Dairesi",  value: "3. Ceza Dairesi" },
  { label: "Yargıtay 4. Ceza Dairesi",  value: "4. Ceza Dairesi" },
  { label: "Yargıtay 5. Ceza Dairesi",  value: "5. Ceza Dairesi" },
  { label: "Yargıtay 6. Ceza Dairesi",  value: "6. Ceza Dairesi" },
  { label: "Yargıtay 7. Ceza Dairesi",  value: "7. Ceza Dairesi" },
  { label: "Yargıtay 8. Ceza Dairesi",  value: "8. Ceza Dairesi" },
  { label: "Yargıtay 9. Ceza Dairesi",  value: "9. Ceza Dairesi" },
  { label: "Yargıtay 10. Ceza Dairesi", value: "10. Ceza Dairesi" },
  { label: "Yargıtay 11. Ceza Dairesi", value: "11. Ceza Dairesi" },
  { label: "Yargıtay 12. Ceza Dairesi", value: "12. Ceza Dairesi" },
  { label: "Yargıtay 13. Ceza Dairesi", value: "13. Ceza Dairesi" },
  { label: "Yargıtay 14. Ceza Dairesi", value: "14. Ceza Dairesi" },
  { label: "Yargıtay 15. Ceza Dairesi", value: "15. Ceza Dairesi" },
  { label: "Yargıtay 16. Ceza Dairesi", value: "16. Ceza Dairesi" },
  { label: "Yargıtay 17. Ceza Dairesi", value: "17. Ceza Dairesi" },
  { label: "Yargıtay 18. Ceza Dairesi", value: "18. Ceza Dairesi" },
  { label: "Yargıtay 19. Ceza Dairesi", value: "19. Ceza Dairesi" },
  { label: "Yargıtay 20. Ceza Dairesi", value: "20. Ceza Dairesi" },
  { label: "Yargıtay 21. Ceza Dairesi", value: "21. Ceza Dairesi" },
  { label: "Yargıtay 22. Ceza Dairesi", value: "22. Ceza Dairesi" },
  { label: "Yargıtay 23. Ceza Dairesi", value: "23. Ceza Dairesi" },
];

export default function BasicFilter({ defaultParams = {} }) {
  const kwRef = useRef(null);
  const aiqRef = useRef(null);
  const qRef = useRef(null);
  const infoBtnRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [tipPos, setTipPos] = useState({ top: 0, left: 0 });

  function openTips() {
    const btn = infoBtnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const width = Math.min(420, window.innerWidth - 24);
      let left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      let top = rect.bottom + 12;
      if (top + 340 > window.innerHeight) top = rect.top - 340 - 12;
      setTipPos({ top, left });
    }
    setShowTips(true);
  }

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setShowTips(false); }
    function onResize() { if (showTips) openTips(); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [showTips]);

  return (
    <>
      {loading && <LoadingOverlay />}
      <form action="/kararlar" method="GET" className="flex flex-col gap-4" noValidate onSubmit={() => setLoading(true)}>

        {/* Aranan kelime (sayfa hero'su ile aynı parametre — birlikte kullanılabilir) */}
        <div>
          <label className={labelClass}>Aranan Kelime / İçerik</label>
          <input
            ref={qRef}
            type="text"
            name="q"
            defaultValue={defaultParams.q || ""}
            placeholder="örn. muris muvazaası"
            onChange={() => {
              try { if (kwRef.current) kwRef.current.value = ""; if (aiqRef.current) aiqRef.current.value = ""; } catch {}
            }}
            className={inputClass}
          />
        </div>

        {/* Daire */}
        <div>
          <label className={labelClass}>Yargıtay Dairesi</label>
          <div className="relative">
            <select name="organ" defaultValue={defaultParams.organ || ""} className={`${inputClass} cursor-pointer appearance-none`}>
              {organOptions.map(({ label, value }) => (
                <option key={label || "blank"} value={value} className="bg-white text-slate-700">
                  {label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IconChevronDown className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Esas & Karar No — alt alta; dar kenar çubuğunda rakamlar kesilmesin */}
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Esas No</label>
            <div className="grid grid-cols-[minmax(86px,1fr)_auto_minmax(86px,1fr)] items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                name="esasYili"
                placeholder="Yıl"
                defaultValue={defaultParams.esasYili || ""}
                className={`${inputClass} min-w-0 px-2 text-center tracking-wide`}
              />
              <span className="shrink-0 text-center text-slate-400">/</span>
              <input
                type="text"
                inputMode="numeric"
                name="esasNo"
                placeholder="Esas"
                defaultValue={defaultParams.esasNo || ""}
                className={`${inputClass} min-w-0 px-2 text-center tracking-wide`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Karar No</label>
            <div className="grid grid-cols-[minmax(86px,1fr)_auto_minmax(86px,1fr)] items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                name="kararYili"
                placeholder="Yıl"
                defaultValue={defaultParams.kararYili || ""}
                className={`${inputClass} min-w-0 px-2 text-center tracking-wide`}
              />
              <span className="shrink-0 text-center text-slate-400">/</span>
              <input
                type="text"
                inputMode="numeric"
                name="kararNo"
                placeholder="Karar"
                defaultValue={defaultParams.kararNo || ""}
                className={`${inputClass} min-w-0 px-2 text-center tracking-wide`}
              />
            </div>
          </div>
        </div>

        {/* Metin filtreleri */}
        <div className="space-y-3 border-t border-slate-200 pt-3">
          <div>
            <label className={labelClass}>Özet İçinde Ara</label>
            <input ref={aiqRef} type="text" name="aiq" placeholder="örn. iş kazası" defaultValue={defaultParams.aiq || ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Kelime Öbeği</label>
            <input type="text" name="phrase" placeholder="örn. mutlak muvazaa" defaultValue={defaultParams.phrase || ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Anahtar Kelime</label>
            <input ref={kwRef} type="text" name="kw" placeholder="örn. kira" defaultValue={defaultParams.kw || ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Hariç Tut</label>
            <input type="text" name="qnot" placeholder="örn. ihbar" defaultValue={defaultParams.qnot || ""} className={inputClass} />
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex gap-2 border-t border-slate-200 pt-3">
          <button type="submit" className="flex-1 rounded-lg bg-[#0f2a4a] py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#163a63]">
            Filtrele
          </button>
          <a href="/kararlar" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold uppercase text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#0f2a4a]">
            Sıfırla
          </a>
        </div>

        {/* İpucu tetikleyici */}
        <div className="flex items-center justify-end">
          <button ref={infoBtnRef} type="button" onClick={openTips} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#0f2a4a] transition-colors hover:text-[#163a63]">
            Arama İpuçları <IconInfo className="h-3 w-3" />
          </button>
        </div>
      </form>

      {/* İPUCU MODALI */}
      {showTips && createPortal(
        <>
          <div className="fixed inset-0 z-[9998] bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowTips(false)} />
          <div
            className="fixed z-[9999] w-[400px] max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            style={{ top: tipPos.top, left: tipPos.left }}
          >
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f2a4a]/5 text-[#0f2a4a]">
                <IconInfo className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide text-[#0f2a4a]">Arama İpuçları</h3>
                <p className="text-[11px] text-slate-500">Filtreleri birlikte veya ayrı ayrı kullanabilirsiniz.</p>
              </div>
            </div>

            <ul className="space-y-4 text-xs leading-relaxed text-slate-600">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#0f2a4a]" />
                <div>
                  <p className="font-semibold text-[#0f2a4a]">Anahtar Kelime</p>
                  <p className="text-slate-500">Kararın anahtar kelimeleri alanında arama yapar.</p>
                  <p className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-[#0f2a4a]">Örnek: kira, muris muvazaası</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                <div>
                  <p className="font-semibold text-[#0f2a4a]">Tam Eşleşme</p>
                  <p className="text-slate-500">Yazdığınız ifade karar metninde birebir aranır.</p>
                  <p className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-[#0f2a4a]">Örnek: &quot;mutlak muvazaa&quot;</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                <div>
                  <p className="font-semibold text-[#0f2a4a]">Hariç Tut</p>
                  <p className="text-slate-500">Belirttiğiniz kelimeleri içeren kararlar sonuçlardan çıkarılır.</p>
                  <p className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-[#0f2a4a]">Örnek: ihbar, kusur</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <p className="font-semibold text-[#0f2a4a]">Özet İçinde Ara</p>
                  <p className="text-slate-500">Yalnızca yapay zekâ karar özetleri içinde arama yapar.</p>
                  <p className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-[#0f2a4a]">Örnek: iş kazası, hizmet tespiti</p>
                </div>
              </li>
            </ul>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <button onClick={() => setShowTips(false)} className="w-full rounded-lg bg-[#0f2a4a] py-2.5 text-xs font-bold tracking-wide text-white transition-colors hover:bg-[#163a63]">
                Anladım
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
