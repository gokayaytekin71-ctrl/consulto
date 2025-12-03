"use client";

import { useState, useEffect } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";

// --- YARDIMCI FONKSİYONLAR ---
const formatDateKey = (date) => date.toISOString().split("T")[0];
const daysOfWeek = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// --- İKONLAR ---
function IconChevronLeft({ className = "w-4 h-4" }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
}
function IconChevronRight({ className = "w-4 h-4" }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
}
function IconCheck({ className = "w-4 h-4" }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>;
}
function IconGavel({ className = "w-4 h-4" }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 13l-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="M16 16l6-6"/><path d="M8 8l6-6"/><path d="M9 7l8 8"/><path d="M21 11l-8-8"/></svg>;
}
function IconTrash({ className = "w-4 h-4" }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
}
function IconEdit({ className = "w-4 h-4" }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
}
function IconPlus({ className = "w-4 h-4" }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}

export default function GorevlerimHaftalikTakvim() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState({});
  const [hearings, setHearings] = useState({});
  const [newTask, setNewTask] = useState("");
  const [newHearing, setNewHearing] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // --- DATA FETCH & HANDLERS ---
  useEffect(() => {
    const fetchData = async () => {
      const [tasksRes, hearingsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/hearings"),
      ]);

      let tasksData = [], hearingsData = [];
      if (tasksRes.ok) {
        const text = await tasksRes.text();
        if (text) tasksData = JSON.parse(text);
      }
      if (hearingsRes.ok) {
        const text = await hearingsRes.text();
        if (text) hearingsData = JSON.parse(text);
      }

      const groupedTasks = {};
      tasksData.forEach(t => {
        const key = formatDateKey(new Date(t.date));
        if (!groupedTasks[key]) groupedTasks[key] = [];
        groupedTasks[key].push(t.content);
      });

      const groupedHearings = {};
      hearingsData.forEach(h => {
        const key = formatDateKey(new Date(h.date));
        if (!groupedHearings[key]) groupedHearings[key] = [];
        groupedHearings[key].push(h.content);
      });

      setTasks(groupedTasks);
      setHearings(groupedHearings);
      setHydrated(true);
    };
    fetchData();
  }, []);

  const handleEdit = async (type, index) => {
    const key = formatDateKey(selectedDate);
    const list = type === "task" ? tasks[key] : hearings[key];
    const oldContent = list[index];
    const newContent = prompt("Düzenle:", oldContent);
    if (!newContent || newContent.trim() === "" || newContent === oldContent) return;

    const endpoint = type === "task" ? "/api/tasks" : "/api/hearings";
    await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, oldContent, newContent }),
    });

    const updater = (prev) => {
      const updated = [...(prev[key] || [])];
      updated[index] = newContent;
      return { ...prev, [key]: updated };
    };
    type === "task" ? setTasks(updater) : setHearings(updater);
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    const key = formatDateKey(selectedDate);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, content: newTask }),
    });
    setTasks((prev) => ({ ...prev, [key]: [...(prev[key] || []), newTask] }));
    setNewTask("");
  };

  const handleAddHearing = async () => {
    if (!newHearing.trim()) return;
    const key = formatDateKey(selectedDate);
    await fetch("/api/hearings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, content: newHearing }),
    });
    setHearings((prev) => ({ ...prev, [key]: [...(prev[key] || []), newHearing] }));
    setNewHearing("");
  };

  const handleDelete = async (type, index) => {
    const key = formatDateKey(selectedDate);
    const list = type === "task" ? tasks[key] || [] : hearings[key] || [];
    const itemToDelete = list[index];
    const endpoint = type === "task" ? "/api/tasks" : "/api/hearings";

    await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, content: itemToDelete }),
    });

    const updater = (prev) => {
      const updated = [...(prev[key] || [])];
      updated.splice(index, 1);
      return { ...prev, [key]: updated };
    };
    type === "task" ? setTasks(updater) : setHearings(updater);
  };

  // --- DATE LOGIC ---
  const startOfWeek = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(new Date(date).setDate(diff));
  };
  const weekStart = startOfWeek(new Date(currentDate));
  const weekDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const isToday = (date) => {
    const now = new Date();
    return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };
  const isSelected = (date) => {
    return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
  };

  if (!hydrated) return <LoadingOverlay />;

  const selectedKey = formatDateKey(selectedDate);
  const selectedTasks = tasks[selectedKey] || [];
  const selectedHearings = hearings[selectedKey] || [];

  return (
    <div className="relative min-h-screen text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px]" />
         <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-lg">
          <button 
            onClick={() => { const d = new Date(currentDate); d.setDate(currentDate.getDate() - 14); setCurrentDate(d); }}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-white/5 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all text-xs font-bold text-slate-300 uppercase tracking-wide"
          >
            <IconChevronLeft className="text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            <span>Önceki</span>
          </button>

          <div className="text-center">
             <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 tracking-tight">
               Takvim ve Ajanda
             </h2>
             <p className="text-xs text-slate-500 font-mono mt-1">
               {weekDates[0].toLocaleDateString('tr-TR')} — {weekDates[13].toLocaleDateString('tr-TR')}
             </p>
          </div>

          <button 
            onClick={() => { const d = new Date(currentDate); d.setDate(currentDate.getDate() + 14); setCurrentDate(d); }}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-white/5 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all text-xs font-bold text-slate-300 uppercase tracking-wide"
          >
            <span>Sonraki</span>
            <IconChevronRight className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* --- CALENDAR GRID --- */}
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {weekDates.map((date, i) => {
            const key = formatDateKey(date);
            const taskCount = tasks[key]?.length || 0;
            const hearingCount = hearings[key]?.length || 0;
            const selected = isSelected(date);
            const today = isToday(date);

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`
                  relative flex flex-col items-center justify-center p-2 md:p-3 rounded-xl border transition-all duration-300 group
                  ${selected 
                    ? "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] scale-105 z-10" 
                    : "bg-slate-900/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10"
                  }
                  ${today ? "ring-1 ring-amber-400/50" : ""}
                `}
              >
                {/* Today Badge */}
                {today && (
                  <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-bold rounded shadow-sm">
                    BUGÜN
                  </span>
                )}

                <span className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${selected ? "text-cyan-300" : "text-slate-500"}`}>
                  {daysOfWeek[i % 7]}
                </span>
                <span className={`text-lg md:text-xl font-black ${selected ? "text-white" : "text-slate-300"}`}>
                  {date.getDate()}
                </span>
                
                {/* Dots Indicators */}
                <div className="flex gap-1 mt-2 h-1.5">
                  {taskCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" title={`${taskCount} Görev`}></span>}
                  {hearingCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_5px_rgba(251,146,60,0.8)]" title={`${hearingCount} Duruşma`}></span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* --- DETAILS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: ADD & MANAGE (2 cols wide) */}
          <div className="lg:col-span-2 space-y-6">
             
             {/* Selected Date Header */}
             <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 font-bold border border-white/10">
                   {selectedDate.getDate()}
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white">
                     {selectedDate.toLocaleDateString("tr-TR", { month: 'long', weekday: 'long', year: 'numeric' })}
                   </h3>
                   <p className="text-xs text-slate-400">Günlük Plan Yönetimi</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TASKS COLUMN */}
                <div className="bg-slate-900/30 rounded-2xl border border-white/5 p-5 flex flex-col h-full">
                   <div className="flex items-center gap-2 mb-4 text-emerald-400">
                      <IconCheck />
                      <span className="font-bold text-sm tracking-wide">GÖREVLER</span>
                   </div>
                   
                   {/* Input Area */}
                   <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Yeni görev..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        className="flex-1 bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                      />
                      <button onClick={handleAddTask} className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg shadow-emerald-900/20">
                         <IconPlus />
                      </button>
                   </div>

                   {/* List */}
                   <ul className="space-y-2 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                      {selectedTasks.length === 0 && <p className="text-xs text-slate-600 text-center py-4">Henüz görev yok.</p>}
                      {selectedTasks.map((t, i) => (
                        <li key={i} className="group flex items-start justify-between gap-2 p-3 bg-emerald-900/10 border border-emerald-500/10 rounded-xl hover:bg-emerald-900/20 hover:border-emerald-500/20 transition-all">
                           <span className="text-sm text-emerald-100/90 leading-snug break-words">{t}</span>
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit("task", i)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded"><IconEdit className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete("task", i)} className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded"><IconTrash className="w-3.5 h-3.5" /></button>
                           </div>
                        </li>
                      ))}
                   </ul>
                </div>

                {/* HEARINGS COLUMN */}
                <div className="bg-slate-900/30 rounded-2xl border border-white/5 p-5 flex flex-col h-full">
                   <div className="flex items-center gap-2 mb-4 text-orange-400">
                      <IconGavel />
                      <span className="font-bold text-sm tracking-wide">DURUŞMALAR</span>
                   </div>
                   
                   {/* Input Area */}
                   <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Duruşma ekle..."
                        value={newHearing}
                        onChange={(e) => setNewHearing(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddHearing()}
                        className="flex-1 bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                      />
                      <button onClick={handleAddHearing} className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors shadow-lg shadow-orange-900/20">
                         <IconPlus />
                      </button>
                   </div>

                   {/* List */}
                   <ul className="space-y-2 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                      {selectedHearings.length === 0 && <p className="text-xs text-slate-600 text-center py-4">Duruşma kaydı yok.</p>}
                      {selectedHearings.map((h, i) => (
                        <li key={i} className="group flex items-start justify-between gap-2 p-3 bg-orange-900/10 border border-orange-500/10 rounded-xl hover:bg-orange-900/20 hover:border-orange-500/20 transition-all">
                           <span className="text-sm text-orange-100/90 leading-snug break-words">{h}</span>
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit("hearing", i)} className="p-1.5 text-orange-400 hover:bg-orange-500/20 rounded"><IconEdit className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete("hearing", i)} className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded"><IconTrash className="w-3.5 h-3.5" /></button>
                           </div>
                        </li>
                      ))}
                   </ul>
                </div>

             </div>
          </div>

          {/* RIGHT: UPCOMING FEED (1 col wide) */}
          <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 backdrop-blur-sm h-fit">
             <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 border-b border-white/5 pb-3">
               Yaklaşan Program
             </h3>
             
             <div className="relative border-l border-slate-800 ml-2 space-y-6">
                {weekDates.slice(0, 7).map((date, idx) => { // Sadece ilk haftayı özetleyelim ki çok uzamasın
                   const key = formatDateKey(date);
                   const dayTasks = tasks[key] || [];
                   const dayHearings = hearings[key] || [];
                   
                   if (dayTasks.length === 0 && dayHearings.length === 0) return null;

                   return (
                      <div key={idx} className="relative pl-6">
                         <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-700 border-2 border-slate-950"></span>
                         
                         <p className="text-xs font-bold text-slate-500 mb-2">
                            {date.toLocaleDateString("tr-TR", { weekday: 'long', day: 'numeric', month: 'short' })}
                         </p>
                         
                         <div className="space-y-2">
                            {dayTasks.map((t, k) => (
                               <div key={`t-${k}`} className="flex items-start gap-2 text-xs text-emerald-200/80 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                                  <IconCheck className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" />
                                  <span>{t}</span>
                               </div>
                            ))}
                            {dayHearings.map((h, k) => (
                               <div key={`h-${k}`} className="flex items-start gap-2 text-xs text-orange-200/80 bg-orange-500/5 p-2 rounded border border-orange-500/10">
                                  <IconGavel className="w-3 h-3 mt-0.5 shrink-0 text-orange-500" />
                                  <span>{h}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   );
                })}
                {/* Eğer hiç kayıt yoksa */}
                <p className="text-xs text-slate-600 italic pl-6">Bu hafta için planlanmış başka kayıt görünmüyor.</p>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}