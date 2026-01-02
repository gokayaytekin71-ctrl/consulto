"use client";
import { useRef, useState, useEffect } from "react";
import LoadingOverlay from "./LoadingOverlay";
import { createPortal } from "react-dom";

// --- İKONLAR ---
const IconInfo = ({ className = "w-4 h-4" }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="9" /><path d="M12 10v6" /><path d="M12 7h.01" /></svg>;
const IconSearch = ({ className = "w-4 h-4" }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>;
const IconChevronDown = ({ className = "w-4 h-4" }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9l6 6 6-6" /></svg>;

// --- STYLES ---
// Analiz sayfası stiline uygun Input (Koyu zemin, ince border, cyan focus)
const inputClass = "w-full bg-[#020617] border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all";
const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

const organOptions = [
  { label: "Tümü", value: "" },
  { label: "Yargıtay HGK", value: "Hukuk Genel Kurulu" },
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
];

export default function BasicFilter({ defaultParams = {} }) {
  const kwRef = useRef(null);
  const aiqRef = useRef(null);
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
      <form action="/kararlar" method="GET" className="flex flex-col gap-5" noValidate onSubmit={() => setLoading(true)}>
        
        {/* --- 1. HERO INPUT (Ana Arama) --- */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-600 group-focus-within:text-cyan-500 transition-colors">
            <IconSearch className="w-4 h-4" />
          </div>
          <input
            type="text"
            name="q"
            defaultValue={defaultParams.q || ""}
            placeholder="Karar İçeriğinde Ara..."
            onChange={() => {
              try { if (kwRef.current) kwRef.current.value = ""; if (aiqRef.current) aiqRef.current.value = ""; } catch {}
            }}
            className={`${inputClass} pl-9 pr-14 h-11 shadow-inner`}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold tracking-wider transition-colors shadow-lg shadow-cyan-900/20"
          >
            ARA
          </button>
        </div>

        {/* --- 2. DETAYLI FİLTRELEME (Accordion) --- */}
        <details className="group/details overflow-hidden rounded-xl border border-slate-800 bg-[#020617]/50 transition-all duration-300 open:bg-[#020617]">
          <summary className="flex items-center justify-between p-3 cursor-pointer select-none text-slate-400 hover:text-white transition-colors">
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_#6366f1]"></span>
               <span className="text-xs font-semibold tracking-wide">Detaylı Arama</span>
            </div>
            <span className="transform transition-transform duration-300 group-open/details:rotate-180 text-slate-600 group-hover:text-slate-400">
              <IconChevronDown />
            </span>
          </summary>

          <div className="px-3 pb-4 pt-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
            
            {/* Daire Seçimi */}
            <div>
              <label className={labelClass}>Yargıtay Dairesi</label>
              <div className="relative">
                <select name="organ" defaultValue={defaultParams.organ || ""} className={`${inputClass} appearance-none cursor-pointer`}>
                  {organOptions.map(({ label, value }) => (
                    <option key={label || "blank"} value={value} className="bg-[#020617] text-slate-300">
                      {label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                   <IconChevronDown className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Esas & Karar No */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Esas</label>
                <div className="flex items-center gap-1">
                  <input type="text" name="esasYili" placeholder="Yıl" defaultValue={defaultParams.esasYili || ""} className={`${inputClass} text-center`} />
                  <span className="text-slate-600">/</span>
                  <input type="text" name="esasNo" placeholder="No" defaultValue={defaultParams.esasNo || ""} className={`${inputClass} text-center`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Karar</label>
                <div className="flex items-center gap-1">
                  <input type="text" name="kararYili" placeholder="Yıl" defaultValue={defaultParams.kararYili || ""} className={`${inputClass} text-center`} />
                  <span className="text-slate-600">/</span>
                  <input type="text" name="kararNo" placeholder="No" defaultValue={defaultParams.kararNo || ""} className={`${inputClass} text-center`} />
                </div>
              </div>
            </div>

            {/* Metin Filtreleri */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
               <div>
                  <label className={labelClass}>Özet İçinde Ara</label>
                  <input ref={aiqRef} type="text" name="aiq" placeholder="örn. iş kazası" defaultValue={defaultParams.aiq || ""} className={inputClass} />
               </div>
               <div>
                  <label className={labelClass}>Kelime Öbeği</label>
                  <input type="text" name="phrase" placeholder="örn. mutlak muvazaa" defaultValue={defaultParams.phrase || ""} className={inputClass} />
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Anahtar Kelime</label>
                    <input ref={kwRef} type="text" name="kw" placeholder="örn. kira" defaultValue={defaultParams.kw || ""} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Hariç Tut</label>
                    <input type="text" name="qnot" placeholder="örn. ihbar" defaultValue={defaultParams.qnot || ""} className={inputClass} />
                  </div>
               </div>
            </div>

            {/* Butonlar */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button type="submit" className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-900/20 transition-all">
                Filtrele
              </button>
              <a href="/kararlar" className="px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold uppercase transition-colors">
                Sıfırla
              </a>
            </div>
          </div>
        </details>

        {/* --- 3. KISAYOLLAR & İPUCU --- */}
        <div className="space-y-3">
           <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hızlı Erişim</span>
              <button ref={infoBtnRef} type="button" onClick={openTips} className="flex items-center gap-1 text-[10px] font-bold text-cyan-500 hover:text-cyan-400 transition-colors uppercase tracking-wide">
                İpuçları <IconInfo className="w-3 h-3" />
              </button>
           </div>
           
           <nav className="space-y-1">
             {[
               { id: "#featured", label: "Editörün Seçimi", color: "bg-amber-500 shadow-[0_0_6px_#f59e0b]" },
               { id: "#new", label: "Son Eklenenler", color: "bg-emerald-500 shadow-[0_0_6px_#10b981]" },
               { id: "#ibk", label: "İçtihadı Birleştirme", color: "bg-indigo-500 shadow-[0_0_6px_#6366f1]" }
             ].map((item) => (
               <a
                 key={item.id}
                 href={item.id}
                 onClick={(e) => { e.preventDefault(); const el = document.querySelector(item.id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                 className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-[#1e293b] hover:text-cyan-400 transition-all border border-transparent hover:border-slate-800"
               >
                 <div className="flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.color}`}></span>
                    <span>{item.label}</span>
                 </div>
                 <svg className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
               </a>
             ))}
           </nav>
        </div>
      </form>

      {/* --- İPUCU MODALI --- */}
      {showTips && createPortal(
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]" onClick={() => setShowTips(false)} />
          <div
            className="fixed w-[400px] max-w-[90vw] bg-[#0f172a] border border-slate-700 rounded-2xl p-5 shadow-2xl z-[9999] animate-in zoom-in-95 duration-200"
            style={{ top: tipPos.top, left: tipPos.left }}
          >
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <IconInfo className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Arama İpuçları
                </h3>
                <p className="text-[11px] text-slate-400">
                  Daha isabetli sonuçlar için aşağıdaki filtreleri birlikte veya ayrı ayrı kullanabilirsiniz.
                </p>
              </div>
            </div>

            <ul className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
                <div>
                  <p className="font-semibold text-slate-100">Anahtar Kelime</p>
                  <p className="text-slate-400">
                    Kararın anahtar kelimeleri alanında arama yapar.
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-cyan-300">
                    Örnek: kira, muris muvazaası
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
                <div>
                  <p className="font-semibold text-slate-100">Tam Eşleşme</p>
                  <p className="text-slate-400">
                    Yazdığınız ifade karar metninde birebir aranır.
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-indigo-300">
                    Örnek: &quot;mutlak muvazaa&quot;
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
                <div>
                  <p className="font-semibold text-slate-100">Hariç Tut</p>
                  <p className="text-slate-400">
                    Belirttiğiniz kelimeleri içeren kararlar sonuçlardan çıkarılır.
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-rose-300">
                    Örnek: ihbar, kusur
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                <div>
                  <p className="font-semibold text-slate-100">Özet İçinde Ara</p>
                  <p className="text-slate-400">
                    Yalnızca yapay zekâ karar özetleri içinde arama yapar.
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-emerald-300">
                    Örnek: iş kazası, hizmet tespiti
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-5 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowTips(false)}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold tracking-wide transition-colors shadow-md shadow-cyan-900/20"
              >
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