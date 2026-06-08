"use client";

export default function DeleteWorkspaceModal({ vm }) {
  const {
    workspaceDeleteTarget,
    isDeletingWorkspace,
    closeDeleteWorkspaceModal,
    confirmDeleteWorkspace,
  } = vm;

  return (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.65)]">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12V16.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>

      <div className="text-xs font-black uppercase tracking-[0.22em] text-red-500">
        Çalışma alanını sil
      </div>

      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        Emin misiniz?
      </h2>

      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        <span className="font-black text-slate-950">
          {workspaceDeleteTarget.title}
        </span>{" "}
        adlı çalışma alanı silinecek. Bu işlem geri alınamaz.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={closeDeleteWorkspaceModal}
          disabled={isDeletingWorkspace}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          Vazgeç
        </button>

        <button
          type="button"
          onClick={confirmDeleteWorkspace}
          disabled={isDeletingWorkspace}
          className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700 disabled:opacity-70"
        >
          {isDeletingWorkspace && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {isDeletingWorkspace ? "Siliniyor" : "Evet, Sil"}
        </button>
      </div>
    </div>
  </div>
  );
}
