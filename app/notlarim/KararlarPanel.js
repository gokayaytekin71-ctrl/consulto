"use client";

import { useState } from "react";
import NotlarimPanel from "./NotlarimPanel";

function extractSlug(url = "") {
  const m = url.trim().match(/\/kararlar\/([^?#\s]+)/);
  return m ? m[1] : null;
}

function FieldBlock({ label, value, bg, text, border }) {
  const [open, setOpen] = useState(false);
  if (!value) return null;
  const isLong = value.length > 160;
  return (
    <div className={`rounded-xl border ${border} ${bg} px-3 py-2`}>
      <div className={`mb-1 text-[9px] font-black uppercase tracking-[0.15em] ${text}`}>{label}</div>
      <p className={`text-[11px] font-medium leading-5 text-slate-700 ${!open && isLong ? "line-clamp-3" : ""}`}>{value}</p>
      {isLong && (
        <button type="button" onClick={() => setOpen(p => !p)} className={`mt-1 text-[10px] font-black ${text} hover:underline`}>
          {open ? "Küçült" : "Devamını gör"}
        </button>
      )}
    </div>
  );
}

function DecisionCard({ decision, onDelete }) {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-violet-200 hover:shadow-md">
      <div className="absolute left-0 top-0 h-full w-1 bg-violet-100 transition-colors group-hover:bg-violet-500" />

      <div className="p-4 pl-5">
        {/* Başlık + sil */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-black text-slate-900 leading-snug">{decision.title}</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {decision.court && (
                <span className="rounded-lg bg-violet-50 px-2 py-0.5 text-[10px] font-black text-violet-700">{decision.court}</span>
              )}
              {decision.date && (
                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{decision.date}</span>
              )}
              {decision.fromLink && (
                <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">Sistemden</span>
              )}
            </div>
          </div>
          <button type="button" onClick={onDelete}
            className="shrink-0 rounded-lg bg-slate-50 px-2 py-1 text-[9px] font-black text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
          >
            Sil
          </button>
        </div>

        {/* Kişisel not */}
        {decision.personalNote && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="mb-1 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Notum</div>
            <p className="text-[11px] font-medium leading-5 text-slate-700">{decision.personalNote}</p>
          </div>
        )}

        {/* Renkli analiz alanları */}
        {(decision.uyusmazlik || decision.gerekce || decision.sonuc) && (
          <div className="mt-3 space-y-2">
            <FieldBlock label="Uyuşmazlık" value={decision.uyusmazlik} bg="bg-rose-50" text="text-rose-700" border="border-rose-200" />
            <FieldBlock label="Gerekçe" value={decision.gerekce} bg="bg-amber-50" text="text-amber-700" border="border-amber-200" />
            <FieldBlock label="Sonuç" value={decision.sonuc} bg="bg-emerald-50" text="text-emerald-700" border="border-emerald-200" />
          </div>
        )}

        {/* Alt aksiyonlar */}
        <div className="mt-3 flex items-center gap-2">
          {decision.aiSummary && (
            <button type="button" onClick={() => setAiOpen(p => !p)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-black transition-all ${
                aiOpen ? "bg-violet-700 text-white" : "border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              AI Özet
            </button>
          )}
          {decision.sourceUrl && (
            <a href={decision.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-violet-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Karara git
            </a>
          )}
        </div>

        {/* AI özet paneli */}
        {aiOpen && decision.aiSummary && (
          <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-violet-700">AI Özeti</span>
              <span className="rounded-full bg-violet-200 px-1.5 py-0.5 text-[8px] font-black text-violet-800">AI</span>
            </div>
            <p className="text-[11px] font-medium leading-5 text-violet-900">{decision.aiSummary}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ManualForm({ form, setForm, onAdd, onCancel }) {
  return (
    <div className="shrink-0 rounded-2xl border-2 border-violet-200 bg-violet-50/60 p-4 space-y-2">
      <div className="text-[11px] font-black uppercase tracking-wide text-violet-800">Karar Ekle</div>
      <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
        placeholder="Karar no / başlık *"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400"
      />
      <div className="grid grid-cols-2 gap-2">
        <input value={form.court} onChange={e => setForm(p => ({ ...p, court: e.target.value }))}
          placeholder="Mahkeme" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400"
        />
        <input value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
          placeholder="Tarih" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400"
        />
      </div>
      <textarea value={form.personalNote} onChange={e => setForm(p => ({ ...p, personalNote: e.target.value }))}
        placeholder="Kişisel notunuz..." rows={2}
        className="custom-scrollbar w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400"
      />
      <textarea value={form.uyusmazlik} onChange={e => setForm(p => ({ ...p, uyusmazlik: e.target.value }))}
        placeholder="Uyuşmazlık konusu..." rows={2}
        className="custom-scrollbar w-full resize-none rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100 placeholder:text-rose-300"
      />
      <textarea value={form.gerekce} onChange={e => setForm(p => ({ ...p, gerekce: e.target.value }))}
        placeholder="Gerekçe..." rows={2}
        className="custom-scrollbar w-full resize-none rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100 placeholder:text-amber-300"
      />
      <textarea value={form.sonuc} onChange={e => setForm(p => ({ ...p, sonuc: e.target.value }))}
        placeholder="Sonuç..." rows={2}
        className="custom-scrollbar w-full resize-none rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 placeholder:text-emerald-300"
      />
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onAdd} disabled={!form.title.trim()}
          className="flex-1 rounded-xl bg-violet-700 py-2 text-[11px] font-black text-white hover:bg-violet-800 disabled:opacity-40 transition-all"
        >Kaydet</button>
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-[11px] font-black text-slate-500 hover:bg-slate-50 transition-all"
        >İptal</button>
      </div>
    </div>
  );
}

function LinkForm({ onAdd, onCancel }) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | found | error
  const [fetched, setFetched] = useState(null);
  const [personalNote, setPersonalNote] = useState("");
  const [uyusmazlik, setUyusmazlik] = useState("");
  const [gerekce, setGerekce] = useState("");
  const [sonuc, setSonuc] = useState("");

  async function doFetch(rawUrl) {
    const slug = extractSlug(rawUrl);
    if (!slug) { setStatus("error"); return; }
    setStatus("loading"); setFetched(null);
    try {
      const res = await fetch(`/api/kararlar/summary?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) { setStatus("error"); return; }
      const data = await res.json();
      if (data.error) { setStatus("error"); return; }
      const sourceUrl = rawUrl.trim().startsWith("http") ? rawUrl.trim() : `https://consultohukuk.com/kararlar/${slug}`;
      setFetched({ title: data.code || slug, court: data.type || "", aiSummary: data.aiSummary || "", sourceUrl });
      setStatus("found");
    } catch { setStatus("error"); }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData?.getData("text") ?? "";
    if (pasted && extractSlug(pasted)) setTimeout(() => doFetch(pasted), 50);
  }

  function handleSave() {
    onAdd({ title: fetched.title, court: fetched.court, date: "", aiSummary: fetched.aiSummary, sourceUrl: fetched.sourceUrl, fromLink: true, personalNote, uyusmazlik, gerekce, sonuc });
  }

  return (
    <div className="shrink-0 rounded-2xl border-2 border-violet-200 bg-violet-50/60 p-4 space-y-2">
      <div className="text-[11px] font-black uppercase tracking-wide text-violet-800">Linkle Karar Ekle</div>

      <div className="flex gap-2">
        <input value={url} onChange={e => setUrl(e.target.value)} onPaste={handlePaste}
          placeholder="https://consultohukuk.com/kararlar/…"
          className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400"
        />
        <button type="button" onClick={() => doFetch(url)} disabled={!url.trim() || status === "loading"}
          className="shrink-0 rounded-xl bg-violet-700 px-3 py-2 text-[11px] font-black text-white hover:bg-violet-800 disabled:opacity-40 transition-all"
        >
          {status === "loading" ? (
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : "Çek"}
        </button>
      </div>

      {status === "error" && (
        <p className="text-[10px] font-bold text-red-600">Karar bulunamadı. Geçerli bir karar linki yapıştırın.</p>
      )}

      {status === "found" && fetched && (
        <div className="space-y-2 pt-1">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="text-[9px] font-black uppercase tracking-wide text-emerald-700 mb-1">Bulundu</div>
            <div className="text-[12px] font-black text-slate-900">{fetched.title}</div>
            {fetched.court && <div className="text-[10px] font-bold text-slate-500 mt-0.5">{fetched.court}</div>}
          </div>

          <textarea value={personalNote} onChange={e => setPersonalNote(e.target.value)}
            placeholder="Kişisel notunuz..." rows={2}
            className="custom-scrollbar w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400"
          />
          <textarea value={uyusmazlik} onChange={e => setUyusmazlik(e.target.value)}
            placeholder="Uyuşmazlık konusu..." rows={2}
            className="custom-scrollbar w-full resize-none rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100 placeholder:text-rose-300"
          />
          <textarea value={gerekce} onChange={e => setGerekce(e.target.value)}
            placeholder="Gerekçe..." rows={2}
            className="custom-scrollbar w-full resize-none rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100 placeholder:text-amber-300"
          />
          <textarea value={sonuc} onChange={e => setSonuc(e.target.value)}
            placeholder="Sonuç..." rows={2}
            className="custom-scrollbar w-full resize-none rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-[12px] font-medium text-slate-900 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 placeholder:text-emerald-300"
          />

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleSave}
              className="flex-1 rounded-xl bg-violet-700 py-2 text-[11px] font-black text-white hover:bg-violet-800 transition-all"
            >Kaydet</button>
            <button type="button" onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-[11px] font-black text-slate-500 hover:bg-slate-50 transition-all"
            >İptal</button>
          </div>
        </div>
      )}

      {status !== "found" && (
        <div className="flex justify-end pt-1">
          <button type="button" onClick={onCancel} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">İptal</button>
        </div>
      )}
    </div>
  );
}

export default function KararlarPanel({ vm }) {
  const { activeDecisions: decisions, showDecisionForm, setShowDecisionForm, decisionForm, setDecisionForm, handleAddDecision, handleAddDecisionDirect, handleDeleteDecision, setExpandedPanel } = vm;
  const [mode, setMode] = useState("manual");

  const emptyForm = { title: "", court: "", date: "", uyusmazlik: "", gerekce: "", sonuc: "", personalNote: "", aiSummary: "", sourceUrl: "", fromLink: false };

  function openForm(m) { setMode(m); setShowDecisionForm(true); }
  function closeForm() { setShowDecisionForm(false); setDecisionForm(emptyForm); }
  function addFromLink(data) { handleAddDecisionDirect(data); closeForm(); }

  const addButtons = (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => openForm("link")}
        className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-black text-violet-700 hover:bg-violet-100 hover:-translate-y-0.5 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Karar Ekle
      </button>
      <button type="button" onClick={() => setExpandedPanel("kararlar")}
        className="rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-[10px] font-black text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      >
        Büyüt
      </button>
    </div>
  );

  return (
    <NotlarimPanel id="kararlar" title="Yargıtay Kararları" subtitle={`${decisions.length} karar kayıtlı`} actions={!showDecisionForm && addButtons}>
      <div className="flex h-full min-h-0 flex-col">
        {/* Form — scroll dışında, sabit */}
        {showDecisionForm && (
          <div className="custom-scrollbar shrink-0 overflow-y-auto px-4 pt-4 pb-2 max-h-[70%]">
            {mode === "manual" && (
              <ManualForm form={decisionForm} setForm={setDecisionForm} onAdd={handleAddDecision} onCancel={closeForm} />
            )}
            {mode === "link" && (
              <LinkForm onAdd={addFromLink} onCancel={closeForm} />
            )}
          </div>
        )}

        {/* Kart listesi — form kapalıyken görünür */}
        {!showDecisionForm && (
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
            {decisions.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
                <span className="mb-2 text-2xl opacity-40">⚖️</span>
                <div className="text-xs font-bold text-slate-500">Henüz kaydedilen karar yok</div>
                <button type="button" onClick={() => openForm("link")}
                  className="mt-3 rounded-xl bg-violet-700 px-4 py-2 text-[11px] font-black text-white hover:bg-violet-800"
                >Karar Ekle</button>
              </div>
            ) : (
              decisions.map(d => (
                <DecisionCard key={d.id} decision={d} onDelete={() => handleDeleteDecision(d.id)} />
              ))
            )}
          </div>
        )}
      </div>
    </NotlarimPanel>
  );
}
