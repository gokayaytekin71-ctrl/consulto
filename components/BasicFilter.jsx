"use client";
import { useRef, useState, useEffect } from "react";


import LoadingOverlay from "./LoadingOverlay";
import { createPortal } from "react-dom";

function IconInfo({ className = "w-4 h-4" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7h.01" />
    </svg>
  );
}



const organOptions = [
  { label: "", value: "" },
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
    const margin = 12;
    const estHeight = 340; // estimated popover height
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const width = Math.min(560, window.innerWidth - 2 * margin);
      let left = Math.min(rect.left, window.innerWidth - width - margin);
      left = Math.max(margin, left);

      let top = rect.bottom + margin;
      if (top + estHeight > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - estHeight - margin);
      }
      setTipPos({ top, left });
    }
    setShowTips(true);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setShowTips(false);
    }
    function onResize() {
      if (showTips) openTips();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [showTips]);

  // Basit GET formu: butona basınca /kararlar?q=... gibi URL oluşur
  // Boş alanlar gelse bile backend bunları yok sayıyor ("" falsy).
  return (
    <>
      {loading && <LoadingOverlay />}
      <form
        action="/kararlar"
        method="GET"
        className="space-y-4"
        noValidate
        onSubmit={() => setLoading(true)}
      >
      {/* Hızlı satır */}
      <div className="flex gap-3">
        <input
          type="text"
          name="q"
          defaultValue={defaultParams.q || ""}
          placeholder="Genel Arama "
          onChange={() => {
            try {
              if (kwRef.current) kwRef.current.value = "";
              if (aiqRef.current) aiqRef.current.value = "";
            } catch {}
          }}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-blue-700/60 bg-blue-900/30 text-blue-100 placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          Ara
        </button>
      </div>

      {/* Detaylı arama */}
      <details className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/40">
        <summary className="cursor-pointer font-semibold text-blue-200">
          Detaylı Arama
        </summary>

        <div className="mt-4 space-y-4">
          {/* Organ seçimi (value = DB karşılığı) */}
          <div>
            <label className="block text-sm mb-2 text-blue-300">
              Yargıtay Karar Organları
            </label>
            <select
              name="organ"
              defaultValue={defaultParams.organ || ""}
              className="w-full px-3 py-2 rounded-lg border border-blue-700/60 bg-blue-900/30 text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {organOptions.map(({ label, value }) => (
                <option key={label || "blank"} value={value}>
                  {label || "Seçiniz…"}
                </option>
              ))}
            </select>
          </div>

          {/* Esas/Karar filtreleri */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm mb-1 text-blue-300">Esas Numarası</label>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  type="text"
                  name="esasYili"
                  inputMode="text"
                  defaultValue={defaultParams.esasYili || ""}
                  placeholder="Yıl"
                  className="w-full min-w-0 px-3 py-2 rounded-lg border border-blue-700/60 bg-blue-900/30 text-blue-100 placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-blue-300">/</span>
                <input
                  type="text"
                  name="esasNo"
                  inputMode="text"
                  defaultValue={defaultParams.esasNo || ""}
                  placeholder="No"
                  className="w-full min-w-0 px-3 py-2 rounded-lg border border-blue-700/60 bg-blue-900/30 text-blue-100 placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-blue-300">Karar Numarası</label>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  type="text"
                  name="kararYili"
                  inputMode="text"
                  defaultValue={defaultParams.kararYili || ""}
                  placeholder="Yıl"
                  className="w-full min-w-0 px-3 py-2 rounded-lg border border-blue-700/60 bg-blue-900/30 text-blue-100 placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-blue-300">/</span>
                <input
                  type="text"
                  name="kararNo"
                  inputMode="text"
                  defaultValue={defaultParams.kararNo || ""}
                  placeholder="No"
                  className="w-full min-w-0 px-3 py-2 rounded-lg border border-blue-700/60 bg-blue-900/30 text-blue-100 placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Alan sınırlı aramalar */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm mb-1 text-blue-300">Karar Özeti İçinde Arama</label>
              <input
                ref={aiqRef}
                type="text"
                name="aiq"
                inputMode="text"
                defaultValue={defaultParams.aiq || ""}
                placeholder="örn. iş kazası, muvazaa"
                className="w-full px-3 py-2 rounded-lg border border-blue-700/60 bg-blue-900/30 text-blue-100 placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-blue-300">Anahtar Kelimelerde Ara</label>
              <input
                ref={kwRef}
                type="text"
                name="kw"
                inputMode="text"
                defaultValue={defaultParams.kw || ""}
                placeholder="örn. tahliye davası"
                className="w-full px-3 py-2 rounded-lg border border-blue-700/60 bg-blue-900/30 text-blue-100 placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm mb-1 text-blue-300">Kelime Öbeği </label>
              <input
                type="text"
                name="phrase"
                inputMode="text"
                defaultValue={defaultParams.phrase || ""}
                placeholder="örn. mutlak muvazaa"
                className="w-full px-3 py-2 rounded-lg border border-blue-700/60 bg-blue-900/30 text-blue-100 placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-blue-300">Hariç Tut (Kararda Olmasın)</label>
              <input
                type="text"
                name="qnot"
                inputMode="text"
                defaultValue={defaultParams.qnot || ""}
                placeholder="örn. ihbar, kıdem"
                className="w-full px-3 py-2 rounded-lg border border-blue-700/60 bg-blue-900/30 text-blue-100 placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Uygula
            </button>
            <a
              href="/kararlar"
              className="px-4 py-2 rounded-lg border border-blue-700/60 text-blue-100 hover:bg-blue-700/20"
            >
              Sıfırla
            </a>
          </div>
        </div>
      </details>

      {/* İpucu (tıklayınca açılan sabit popover) */}
      <div className="relative">
        <div className="inline-flex items-center gap-2 text-blue-200 select-none">
          <span className="font-semibold">İpucu</span>
          <button
            ref={infoBtnRef}
            type="button"
            onClick={openTips}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white shadow focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-400"
            aria-label="Arama ipuçlarını göster"
            title="Arama ipuçlarını göster"
          >
            <IconInfo className="w-4 h-4" />
          </button>
        </div>

        {showTips && createPortal(
          <>
            {/* Opaque backdrop (very high z-index) */}
            <div
              className="fixed inset-0 bg-slate-950/70"
              style={{ zIndex: 2147483646 }}
              onClick={() => setShowTips(false)}
            />
            {/* Popover – always above everything */}
            <div
              className="fixed w-[min(92vw,560px)] max-w-[560px] bg-slate-900 border border-slate-700 rounded-lg p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-slate-200"
              style={{ top: tipPos.top, left: tipPos.left, zIndex: 2147483647 }}
              role="dialog"
              aria-label="Arama ipuçları"
            >
              <ul className="space-y-4 list-disc pl-5 text-sm leading-7">
                <li>
                  <span className="text-blue-100 font-semibold">Kelime Araması Yap</span> Karar metninde arama yapar. 
                   ( <span className="italic">Örneğin; ''kıdem tazminatı'' yazdığınızda içerisinde ''kıdem'' ve ''tazminat'' olan kararları çıkarır  </span>).
                </li>
                <li>
                  <span className="text-blue-100 font-semibold">Kelime Öbeği</span> yazdığınız kelime öbeğini <em>aynen</em> arar
                  (<span className="italic">Örneğin; ''kıdem tazminatı'' yazıldığında içerisinde direkt ''kıdem tazminatı'' olan kararları çıkarır  </span>).
                </li>
                <li>
                  <span className="text-blue-100 font-semibold">Hariç Tut</span> alanındaki terimler içerikten çıkarılır; birden fazla terimi
                  <span className="italic"> virgülle</span> ayırabilirsiniz (örn. <span className="italic">ihbar, fesih</span>).
                </li>
                <li>
                  <span className="text-blue-100 font-semibold">Karar Özeti İçinde Ara</span> yalnızca özet alanında, <span className="text-blue-100 font-semibold">Anahtar Kelimeler</span> ise yalnızca
                  <span className="italic"> anahtar kelimeler</span> alanında arama yapar.
                </li>
                <li>
                  <span className="text-blue-100 font-semibold">Esas/Karar</span> alanlarını <span className="font-mono">Yıl/No</span> şeklinde doldurabilirsiniz.
                </li>
              </ul>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTips(false)}
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  Kapat
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
      </div>

      {/* Bölümler navigasyonu */}
      <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-4">
        <h4 className="font-semibold text-blue-200 mb-3 flex items-center gap-2">
          Bölümler
          <span className="text-[11px] font-normal text-blue-300/80">Kısayollar</span>
        </h4>
        <nav className="mt-1 space-y-2">
          <a
            href="#featured"
            className="group flex items-center justify-start w-full px-3 py-2 rounded-lg border border-blue-700/50 bg-blue-900/30 hover:bg-blue-800/40 text-blue-100 transition-colors overflow-hidden max-w-full box-border"
            onClick={(e) => { e.preventDefault(); const el = document.querySelector('#featured'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
          >
            <span className="whitespace-normal break-words"> Nitelikli Kararlar</span>
          </a>

          <a
            href="#new"
            className="group flex items-center justify-start w-full px-3 py-2 rounded-lg border border-blue-700/50 bg-blue-900/30 hover:bg-blue-800/40 text-blue-100 transition-colors overflow-hidden max-w-full box-border"
            onClick={(e) => { e.preventDefault(); const el = document.querySelector('#new'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
          >
            <span className="whitespace-normal break-words">Yeni Kararlar</span>
          </a>

          <a
            href="#ibk"
            className="group flex items-center justify-start w-full px-3 py-2 rounded-lg border border-blue-700/50 bg-blue-900/30 hover:bg-blue-800/40 text-blue-100 transition-colors overflow-hidden max-w-full box-border"
            onClick={(e) => { e.preventDefault(); const el = document.querySelector('#ibk'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
          >
            <span className="whitespace-normal break-words">İçtihadı Birleştirme Kararları</span>
          </a>
        </nav>
      </div>
      </form>
    </>
  );
}

function LabeledInput({ name, label, placeholder, defaultValue }) {
  return (
    <div>
      <label className="block text-sm mb-1 text-blue-300">{label}</label>
      <input
        type="text"
        name={name}
        inputMode="text"
        defaultValue={defaultValue || ""}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-blue-700/60 bg-blue-900/30 text-blue-100 placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}