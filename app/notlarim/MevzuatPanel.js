"use client";

import { useState } from "react";
import NotlarimPanel from "./NotlarimPanel";

function StatuteCard({ statute, onDelete }) {
  const [open, setOpen] = useState(false);
  const articleText = statute.article?.trim() ?? "";
  const noteText = statute.note?.trim() ?? "";
  const isLong = articleText.length > 90 || noteText.length > 420;
  const previewStyle = open || !isLong ? undefined : { maxHeight: "9.5rem", overflow: "hidden" };
  const articlePreviewStyle = open || !isLong ? undefined : { maxHeight: "3rem", overflow: "hidden" };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
      <div className="absolute left-0 top-0 h-full w-1 bg-indigo-100 transition-colors group-hover:bg-indigo-500" />

      <div className="pl-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-black text-slate-900 leading-snug">{statute.name}</div>
            {statute.article && (
              <div
                className="mt-1 inline-block max-w-full rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black leading-4 text-indigo-700"
                style={articlePreviewStyle}
              >
                {statute.article}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 rounded-lg bg-slate-50 px-2 py-1 text-[9px] font-black text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
          >
            Sil
          </button>
        </div>

        {noteText && (
          <p
            className="mt-2 whitespace-pre-wrap break-words text-[11px] font-medium leading-5 text-slate-600"
            style={previewStyle}
          >
            {statute.note}
          </p>
        )}

        {isLong && (
          <button
            type="button"
            onClick={() => setOpen(prev => !prev)}
            className="mt-2 inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-black text-indigo-700 transition-colors hover:bg-indigo-50 hover:text-indigo-900"
            aria-expanded={open}
          >
            {open ? "Daralt" : "Devamını gör"}
          </button>
        )}
      </div>
    </div>
  );
}

function AddStatuteForm({ form, setForm, onAdd, onCancel }) {
  return (
    <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/60 p-4">
      <div className="mb-3 text-[11px] font-black uppercase tracking-wide text-indigo-800">
        Mevzuat Ekle
      </div>
      <div className="space-y-2">
        <input
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="Kanun / yönetmelik adı *"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
        />
        <input
          value={form.article}
          onChange={e => setForm(p => ({ ...p, article: e.target.value }))}
          placeholder="Madde / bent (isteğe bağlı)"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
        />
        <textarea
          value={form.note}
          onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
          placeholder="Kişisel not / açıklama (isteğe bağlı)"
          rows={3}
          className="custom-scrollbar w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onAdd}
          disabled={!form.name.trim()}
          className="flex-1 rounded-xl bg-indigo-700 py-2 text-[11px] font-black text-white shadow-sm transition-all hover:bg-indigo-800 hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
        >
          Kaydet
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-[11px] font-black text-slate-500 transition-all hover:bg-slate-50"
        >
          İptal
        </button>
      </div>
    </div>
  );
}

export default function MevzuatPanel({ vm }) {
  const {
    activeStatutes: statutes,
    showStatuteForm, setShowStatuteForm,
    statuteForm, setStatuteForm,
    handleAddStatute, handleDeleteStatute,
    setExpandedPanel,
  } = vm;

  const addButton = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setShowStatuteForm(true)}
        className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-black text-indigo-700 transition-all hover:bg-indigo-100 hover:-translate-y-0.5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Ekle
      </button>
      <button
        type="button"
        onClick={() => setExpandedPanel("mevzuat")}
        className="rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-[10px] font-black text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      >
        Büyüt
      </button>
    </div>
  );

  return (
    <NotlarimPanel
      id="mevzuat"
      title="Mevzuat"
      subtitle="Kaydettiğiniz kanun ve maddeler"
      actions={!showStatuteForm && addButton}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50/50">
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {showStatuteForm && (
              <AddStatuteForm
                form={statuteForm}
                setForm={setStatuteForm}
                onAdd={handleAddStatute}
                onCancel={() => {
                  setShowStatuteForm(false);
                  setStatuteForm({ name: "", article: "", note: "" });
                }}
              />
            )}

            {statutes.length === 0 && !showStatuteForm ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
                <span className="mb-2 text-2xl opacity-40">📚</span>
                <div className="text-xs font-bold text-slate-500">Henüz kaydedilen mevzuat yok</div>
                <button
                  type="button"
                  onClick={() => setShowStatuteForm(true)}
                  className="mt-3 rounded-xl bg-indigo-700 px-4 py-2 text-[11px] font-black text-white hover:bg-indigo-800"
                >
                  İlk Mevzuatı Ekle
                </button>
              </div>
            ) : (
              statutes.map(s => (
                <StatuteCard key={s.id} statute={s} onDelete={() => handleDeleteStatute(s.id)} />
              ))
            )}
          </div>
        </div>
      </div>
    </NotlarimPanel>
  );
}
