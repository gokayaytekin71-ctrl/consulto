"use client";

import { MAX_WORKSPACE_FILE_SIZE_MB } from "./workspace-utils";

export default function DocumentSidebar({ vm, drawer = false, onClose }) {
  const {
    files,
    isUploadingFiles,
    activeWorkspaceId,
    handleFileSelect,
    editingFileNameId,
    editingFileNameValue,
    setEditingFileNameValue,
    savingFileNameId,
    handleUpdateFileName,
    setEditingFileNameId,
    setActiveFileSummary,
    setActiveFileDetailTab,
    handleDeleteFile,
  } = vm;

  const body = (
    <>
      {/* ÜST: marka + kapat */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Consülto</div>
            <div className="mt-0.5 text-[13px] font-black tracking-tight text-slate-900">Belgelerim</div>
          </div>
        </div>
        {drawer && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Kapat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* YÜKLEME: sürükle-bırak alanı */}
      <label
        className={`group mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-4 text-center transition-all ${
          activeWorkspaceId && !isUploadingFiles
            ? "cursor-pointer border-slate-200 hover:border-blue-400 hover:bg-blue-50/50"
            : "cursor-not-allowed border-slate-200 opacity-50"
        }`}
      >
        {isUploadingFiles ? (
          <div className="flex flex-col items-center gap-1.5">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <span className="text-[11px] font-bold text-slate-500">Yükleniyor...</span>
          </div>
        ) : (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="mt-1.5 text-[11px] font-black text-slate-700">Dosya ekle</span>
            <span className="text-[9px] font-bold text-slate-400">sürükle ya da seç · maks {MAX_WORKSPACE_FILE_SIZE_MB}MB</span>
          </>
        )}
        <input
          type="file"
          multiple
          disabled={!activeWorkspaceId || isUploadingFiles}
          className="hidden"
          onChange={handleFileSelect}
        />
      </label>

      {/* LİSTE BAŞLIĞI */}
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Dosyalar</span>
        <span className="h-px flex-1 bg-slate-100" />
        <span className="text-[10px] font-black text-slate-400">{files.length}</span>
      </div>

      {/* DOSYA SATIRLARI */}
      <div className="custom-scrollbar -mx-1 flex-1 space-y-0.5 overflow-y-auto px-1">
        {files.length === 0 ? (
          <div className="flex h-28 flex-col items-center justify-center gap-1.5 text-center">
            <span className="text-xl opacity-40">📭</span>
            <span className="text-[11px] font-bold text-slate-400">Henüz dosya yok</span>
          </div>
        ) : (
          files.map((file) => {
            const isEditing = editingFileNameId === file.id;
            const isSaving = savingFileNameId === file.id;
            const hasAnalysis = file.aiSummary || file.detailedSummary;

            return (
              <div
                key={file.id}
                className="group relative rounded-lg pl-2.5 pr-1.5 py-2 transition-colors hover:bg-slate-50"
              >
                {/* sol vurgu çubuğu (hover) */}
                <span className="absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-full bg-blue-500 transition-all duration-200 group-hover:h-6" />

                {isEditing ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleUpdateFileName(file);
                    }}
                    className="space-y-2"
                  >
                    <input
                      value={editingFileNameValue}
                      onChange={(event) => setEditingFileNameValue(event.target.value)}
                      autoFocus
                      disabled={isSaving}
                      className="w-full rounded-md border border-blue-300 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-900 outline-none ring-2 ring-blue-100 focus:border-blue-500 disabled:opacity-60"
                      placeholder="Dosya adı"
                    />
                    <div className="flex gap-1.5">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 rounded-md bg-blue-600 py-1.5 text-[10px] font-black text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {isSaving ? "..." : "Kaydet"}
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          setEditingFileNameId(null);
                          setEditingFileNameValue("");
                        }}
                        className="flex-1 rounded-md bg-slate-100 py-1.5 text-[10px] font-black text-slate-500 hover:bg-slate-200 disabled:opacity-60"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* üst satır: ikon + ad + meta */}
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        {file.url ? (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-[11.5px] font-bold leading-tight text-slate-800 hover:text-blue-700 hover:underline"
                            title={file.name}
                          >
                            {file.name}
                          </a>
                        ) : (
                          <div className="truncate text-[11.5px] font-bold leading-tight text-slate-800" title={file.name}>
                            {file.name}
                          </div>
                        )}
                        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          {file.type} · {file.size}
                        </div>
                      </div>
                    </div>

                    {/* aksiyonlar: hover'da açılan ikon şeridi */}
                    <div className="grid grid-cols-[1fr] overflow-hidden transition-all duration-200 ease-out [grid-template-rows:0fr] group-hover:[grid-template-rows:1fr]">
                      <div className="min-h-0">
                        <div className="mt-2 flex items-center gap-1">
                          {hasAnalysis && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveFileSummary(file);
                                setActiveFileDetailTab("analysis");
                              }}
                              title="Akıllı Analiz"
                              aria-label="Akıllı Analiz"
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFileSummary(file);
                              setActiveFileDetailTab("notes");
                            }}
                            title="Belge Notları"
                            aria-label="Belge Notları"
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3h7.5A2.25 2.25 0 0118 5.25v13.5A2.25 2.25 0 0115.75 21h-7.5A2.25 2.25 0 016 18.75V5.25A2.25 2.25 0 018.25 3z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25h6M9 12h6M9 15.75h4.5" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFileNameId(file.id);
                              setEditingFileNameValue(file.name || "");
                            }}
                            title="Yeniden adlandır"
                            aria-label="Yeniden adlandır"
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.875 4.5" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file)}
                            title="Sil"
                            aria-label="Sil"
                            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );

  // Mobil: soldan kayan çekmece
  if (drawer) {
    return (
      <div className="fixed inset-0 z-[200] xl:hidden">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={onClose}
        />
        <aside className="absolute inset-y-0 left-0 flex w-[78%] max-w-[250px] flex-col border-r border-slate-200 bg-white p-3 shadow-2xl animate-in slide-in-from-left duration-200">
          {body}
        </aside>
      </div>
    );
  }

  // Masaüstü: dar sabit sütun
  return (
    <aside className="relative z-20 hidden w-[190px] shrink-0 flex-col border-r border-slate-200 bg-white p-3 xl:flex">
      {body}
    </aside>
  );
}