"use client";

const formatDateKey = (date) => date.toISOString().split("T")[0];


import { useState, useEffect } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";

const daysOfWeek = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function GorevlerimHaftalikTakvim() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState({});
  const [hearings, setHearings] = useState({});
  const [newTask, setNewTask] = useState("");
  const [newHearing, setNewHearing] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const handleEdit = async (type, index) => {
    const key = formatDateKey(selectedDate);
    const list = type === "task" ? tasks[key] : hearings[key];
    const oldContent = list[index];

    const newContent = prompt("Yeni metni girin:", oldContent);
    if (!newContent || newContent.trim() === "" || newContent === oldContent) return;

    const endpoint = type === "task" ? "/api/tasks" : "/api/hearings";
    await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        oldContent,
        newContent,
      }),
    });

    const updater = (prev) => {
      const updated = [...(prev[key] || [])];
      updated[index] = newContent;
      return { ...prev, [key]: updated };
    };

    type === "task" ? setTasks(updater) : setHearings(updater);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [tasksRes, hearingsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/hearings"),
      ]);

      let tasksData = [];
      if (tasksRes.ok) {
        const text = await tasksRes.text();
        if (text) {
          tasksData = JSON.parse(text);
        }
      } else {
        console.error("Görev verisi alınamadı:", await tasksRes.text());
      }

      let hearingsData = [];
      if (hearingsRes.ok) {
        const text = await hearingsRes.text();
        if (text) {
          hearingsData = JSON.parse(text);
        }
      } else {
        console.error("Duruşma verisi alınamadı:", await hearingsRes.text());
      }

      const groupedTasks = {};
      for (const task of tasksData) {
        const key = formatDateKey(new Date(task.date));
        if (!groupedTasks[key]) groupedTasks[key] = [];
        groupedTasks[key].push(task.content);
      }

      const groupedHearings = {};
      for (const hearing of hearingsData) {
        const key = formatDateKey(new Date(hearing.date));
        if (!groupedHearings[key]) groupedHearings[key] = [];
        groupedHearings[key].push(hearing.content);
      }

      setTasks(groupedTasks);
      setHearings(groupedHearings);
      setHydrated(true);
    };

    fetchData();
  }, []);

  if (!hydrated) {
    return <LoadingOverlay />;
  }


  const startOfWeek = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const weekStart = startOfWeek(new Date(currentDate));
  const weekDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const isToday = (date) => {
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const isSelected = (date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleAddTask = async () => {
    const key = formatDateKey(selectedDate);

    if (!newTask.trim()) return;

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        content: newTask,
      }),
    });

    setTasks((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), newTask],
    }));
    setNewTask("");
  };

  const handleAddHearing = async () => {
    const key = formatDateKey(selectedDate);

    if (!newHearing.trim()) return;

    await fetch("/api/hearings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        content: newHearing,
      }),
    });

    setHearings((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), newHearing],
    }));
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

    if (type === "task") {
      setTasks((prev) => {
        const updated = [...(prev[key] || [])];
        updated.splice(index, 1);
        return { ...prev, [key]: updated };
      });
    } else {
      setHearings((prev) => {
        const updated = [...(prev[key] || [])];
        updated.splice(index, 1);
        return { ...prev, [key]: updated };
      });
    }
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 14);
    setCurrentDate(newDate);
  };

  const goToPrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 14);
    setCurrentDate(newDate);
  };

  const selectedKey = formatDateKey(selectedDate);
  const selectedTasks = tasks[selectedKey] || [];
  const selectedHearings = hearings[selectedKey] || [];

  const upcoming = weekDates.flatMap((date) => {
    const key = formatDateKey(date);
    const dateStr = date.toLocaleDateString("tr-TR");
    return [
      ...(tasks[key] || []).map((t) => ({ type: "Görev", date: dateStr, text: t })),
      ...(hearings[key] || []).map((h) => ({ type: "Duruşma", date: dateStr, text: h }))
    ];
  });

  return (
    <div className="p-6 text-white space-y-8">
      <div className="flex justify-between items-center mb-4">
        <button onClick={goToPrevWeek} className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">
          ⬅ 2 Hafta Geri
        </button>
        <h2 className="text-lg font-bold">2 Haftalık Takvim</h2>
        <button onClick={goToNextWeek} className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">
          Önü 2 Hafta ➡
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {weekDates.map((date, i) => {
          const key = formatDateKey(date);
          const taskCount = tasks[key]?.length || 0;
          const hearingCount = hearings[key]?.length || 0;

          return (
            <div key={i} className="relative">
              {isToday(date) && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xs font-bold">
                  Bugün
                  <div className="text-lg">⬇</div>
                </div>
              )}
              <button
                onClick={() => setSelectedDate(date)}
                className={`w-full py-4 rounded-xl transition-all ${
                  isSelected(date)
                    ? "bg-yellow-400 text-black font-bold"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <div className="text-sm">{daysOfWeek[i % 7]}</div>
                <div className="text-lg">
                  {date.getDate()}/{date.getMonth() + 1}
                </div>
                <div className="text-xs mt-2">
                  {taskCount > 0 && <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>}
                  {hearingCount > 0 && <span className="inline-block w-2 h-2 bg-orange-400 rounded-full"></span>}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white/10 p-4 rounded-xl">
        <h3 className="text-lg font-semibold mb-2">
          {selectedDate.toLocaleDateString("tr-TR")} Görev ve Duruşma Listesi
        </h3>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Görev ekle..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="flex-1 px-3 py-2 rounded bg-white/20 placeholder-white/50 text-white"
          />
          <button
            onClick={handleAddTask}
            className="w-32 h-12 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded transition"
          >
            + Görev
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Duruşma ekle..."
            value={newHearing}
            onChange={(e) => setNewHearing(e.target.value)}
            className="flex-1 px-3 py-2 rounded bg-white/20 placeholder-white/50 text-white"
          />
          <button
            onClick={handleAddHearing}
            className="w-32 h-12 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded transition"
          >
            + Duruşma
          </button>
        </div>

        <ul className="text-base space-y-1">
          {selectedTasks.map((t, i) => (
            <li key={`task-${i}`} className="text-green-300 flex justify-between items-center">
              ✅ {t}
              <div className="flex gap-3 items-center ml-4 text-sm font-semibold">
                <button onClick={() => handleDelete("task", i)} className="text-red-500 hover:text-red-600 transition duration-150">Sil</button>
                <button onClick={() => handleEdit("task", i)} className="text-blue-500 hover:text-blue-600 transition duration-150">Düzenle</button>
              </div>
            </li>
          ))}
          {selectedHearings.map((h, i) => (
            <li key={`hearing-${i}`} className="text-orange-300 flex justify-between items-center">
              ⚖️ {h}
              <div className="flex gap-3 items-center ml-4 text-sm font-semibold">
                <button onClick={() => handleDelete("hearing", i)} className="text-red-500 hover:text-red-600 transition duration-150">Sil</button>
                <button onClick={() => handleEdit("hearing", i)} className="text-blue-500 hover:text-blue-600 transition duration-150">Düzenle</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white/10 p-4 rounded-xl">
        <h3 className="text-lg font-semibold mb-2">Yaklaşan İşler & Duruşmalar</h3>
        <ul className="text-base space-y-1">
          {upcoming.map((item, idx) => (
            <li key={idx} className={item.type === "Görev" ? "text-green-200" : "text-orange-200"}>📅 {item.date} - {item.type}: {item.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}