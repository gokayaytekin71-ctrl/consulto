"use client";

export default function ReloadButton() {
  return (
    <button
      onClick={() => location.reload()}
      className="rounded-xl bg-blue-500/20 border border-blue-400/30 px-5 py-2 text-white hover:bg-blue-500/30 transition"
    >
      Sayfayı Yenile
    </button>
  );
}