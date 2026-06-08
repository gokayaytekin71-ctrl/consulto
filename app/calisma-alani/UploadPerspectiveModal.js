"use client";

export default function UploadPerspectiveModal({ vm }) {
  const {
    uploadPendingFilesWithPerspective,
    pendingUploadFiles,
    isPartyRepresentative, setIsPartyRepresentative,
    representedParty, setRepresentedParty,
    setUploadPerspectiveError,
    isUploadingFiles,
    shouldAnalyzeFile, setShouldAnalyzeFile,
    uploadPerspectiveError,
    resetUploadPerspectiveState,
  } = vm;

  return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <form
            onSubmit={uploadPendingFilesWithPerspective}
            className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]"
          >
            <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">
                Dosya Yükleme Perspektifi
              </div>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                Belgeyi hangi taraf açısından analiz edelim?
              </h2>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                Bu bilgi zorunludur. AI; risk, savunma, delil ve strateji başlıklarını seçtiğiniz perspektife göre önceliklendirir.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Seçilen dosyalar
                </div>
                <div className="mt-2 max-h-24 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
                  {pendingUploadFiles.map((file) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="truncate text-xs font-bold text-slate-700">
                      • {file.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-black text-slate-900">
                  Bu belgede taraf vekili misiniz? <span className="text-red-500">*</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPartyRepresentative(true);
                      setUploadPerspectiveError("");
                    }}
                    disabled={isUploadingFiles}
                    className={`rounded-xl px-4 py-3 text-xs font-black transition-all disabled:opacity-50 ${
                      isPartyRepresentative === true
                        ? "bg-blue-700 text-white shadow-sm"
                        : "bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-800"
                    }`}
                  >
                    Evet
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPartyRepresentative(false);
                      setRepresentedParty("");
                      setUploadPerspectiveError("");
                    }}
                    disabled={isUploadingFiles}
                    className={`rounded-xl px-4 py-3 text-xs font-black transition-all disabled:opacity-50 ${
                      isPartyRepresentative === false
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Hayır
                  </button>
                </div>
              </div>

              {isPartyRepresentative === true && (
                <div>
                  <label className="mb-1.5 block text-sm font-black text-slate-900">
                    Hangi tarafın vekilisiniz? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={representedParty}
                    onChange={(e) => {
                      setRepresentedParty(e.target.value);
                      setUploadPerspectiveError("");
                    }}
                    disabled={isUploadingFiles}
                    placeholder="Örn. Davacı, Davalı, Sanık, Müşteki, Alacaklı..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:opacity-50"
                    autoFocus
                  />
                </div>
              )}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
  <div className="flex items-start justify-between gap-3">
    <div>
      <div className="text-sm font-black text-slate-950">
        Dosya analizi yapılsın mı?
      </div>
      <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">
        AI dosyayı özetler, riskleri ve delilleri çıkarır. Bu işlem 1 token kullanır.
      </div>
    </div>

    <div className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-blue-700 shadow-sm">
      1 Token
    </div>
  </div>

  <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-inner">
    <button
      type="button"
      onClick={() => setShouldAnalyzeFile(true)}
      disabled={isUploadingFiles}
      className={`rounded-xl px-3 py-2 text-xs font-black transition-all disabled:opacity-50 ${
        shouldAnalyzeFile
          ? "bg-blue-700 text-white shadow-sm"
          : "text-slate-500 hover:bg-blue-50 hover:text-blue-800"
      }`}
    >
      Evet, analiz et
    </button>

    <button
      type="button"
      onClick={() => setShouldAnalyzeFile(false)}
      disabled={isUploadingFiles}
      className={`rounded-xl px-3 py-2 text-xs font-black transition-all disabled:opacity-50 ${
        !shouldAnalyzeFile
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      Hayır, sadece kaydet
    </button>
  </div>
</div>

              {uploadPerspectiveError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                  {uploadPerspectiveError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={resetUploadPerspectiveState}
                disabled={isUploadingFiles}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={
                  isUploadingFiles ||
                  isPartyRepresentative === null ||
                  (isPartyRepresentative === true && !representedParty.trim())
                }
                className="rounded-2xl bg-blue-700 px-5 py-2.5 text-xs font-black text-white shadow-[0_8px_22px_rgba(37,99,235,0.28)] transition-all hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {isUploadingFiles ? "Yükleniyor..." : shouldAnalyzeFile ? "Yükle ve Analiz Et" : "Sadece Kaydet"}
              </button>
            </div>
          </form>
        </div>
  );
}
