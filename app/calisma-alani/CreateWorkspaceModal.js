"use client";

export default function CreateWorkspaceModal({ vm }) {
  const {
    handleCreateWorkspaceSubmit,
    setIsCreateWorkspaceModalOpen,
    newWorkspaceName, setNewWorkspaceName,
    workspaceError,
  } = vm;

  return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 border-b border-slate-200 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10">
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-slate-900">Yeni Çalışma Alanı</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Dosyalarınızı, kararları ve AI sohbetlerinizi bu alan altında organize edin.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateWorkspaceSubmit} className="p-6">
              <div className="mb-6">
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                  Çalışma Adı
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Örn: Ankara Tahliye Dosyası"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateWorkspaceModalOpen(false)}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-black text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!newWorkspaceName.trim()}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:shadow-none"
                >
                  Oluştur
                </button>
              </div>

              {workspaceError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                  {workspaceError}
                </div>
              )}
            </form>
          </div>
        </div>
  );
}
