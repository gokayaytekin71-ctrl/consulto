"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

const FolderForm = ({ onNewFolder }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notlarim/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        onNewFolder(await res.json());
        setName("");
      }
    } catch {}
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <input
        className="flex-1 border rounded px-2 py-1"
        placeholder="Yeni klasör"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading}
        className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        Ekle
      </button>
    </form>
  );
};

const NoteForm = ({
  folders,
  currentFolderId,
  onNewNote,
  onUpdateNote,
  editingNote,
  closeForm,
}) => {
  const [title, setTitle] = useState(editingNote?.title || "");
  const [content, setContent] = useState(editingNote?.content || "");
  const [folderId, setFolderId] = useState(editingNote?.folderId || currentFolderId);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle("");
    setContent("");
    setFolderId(currentFolderId);
    closeForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    const url = editingNote ? `/api/notlarim/${editingNote.id}` : "/api/notlarim";
    const method = editingNote ? "PUT" : "POST";
    const body = { title, content, folderId: folderId || null };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        editingNote ? onUpdateNote(data) : onNewNote(data);
        reset();
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-[#002c4b] via-[#003a66] to-[#e2e8f0] p-6 rounded-xl shadow-lg mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg p-2 mb-2 bg-transparent text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003a66]"
          placeholder="Not başlığı..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 bg-transparent text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003a66]"
          rows={4}
          placeholder="Not içeriği..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex items-center gap-4">
          <select
            value={folderId || ""}
            onChange={(e) => setFolderId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-40 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-[#003a66]"
          >
            <option value="">Klasörsüz</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition"
          >
            {editingNote ? "Güncelle" : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-lg transition"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

const NoteCard = ({ note, onSelect, onEdit, onDelete }) => (
  <div className="border rounded p-4 shadow hover:shadow-lg cursor-pointer flex flex-col">
    <div className="flex justify-between items-start">
      <h3
        className="font-semibold text-lg flex-1 break-all pr-6"
        onClick={() => onSelect(note)}
      >
        {note.title || "(Başlıksız Not)"}
      </h3>
      <div className="flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(note);
          }}
          className="text-blue-600 text-sm"
        >
          Düzenle
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="text-red-600 text-sm"
        >
          Sil
        </button>
      </div>
    </div>
    <p className="text-gray-600 text-sm mt-2">
      {note.content.length > 60
        ? note.content.slice(0, 60) + "..."
        : note.content}
    </p>
    <p className="text-gray-400 text-xs mt-auto text-right">
      {new Date(note.createdAt).toLocaleDateString("tr-TR")}
    </p>
  </div>
);

export default function NotlarimPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("all"); // "" = Tüm Notlar
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editingDetail, setEditingDetail] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const fetchFolders = async () => {
    const res = await fetch("/api/notlarim/folders");
    if (res.ok) setFolders(await res.json());
  };

  const fetchNotes = async (folderId = "") => {
    setLoadingData(true);
    const url =
      folderId && folderId !== "all"
        ? `/api/notlarim?folderId=${folderId}`
        : "/api/notlarim";
    const res = await fetch(url);
    if (res.ok) setNotes(await res.json());
    setLoadingData(false);
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/auth/signin");
    else fetchFolders();
  }, [session, status, router]);

  useEffect(() => {
    if (session) fetchNotes(currentFolder);
  }, [currentFolder, session]);

  const handleFolderAdd = (f) => setFolders((prev) => [...prev, f]);
  const handleNoteAdd = (n) => {
    setNotes((prev) => [n, ...prev]);
    setShowForm(false);
  };
  const handleNoteUpdate = (n) =>
    setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
  const handleNoteDelete = async (id) => {
    await fetch(`/api/notlarim/${id}`, { method: "DELETE" });
    fetchNotes(currentFolder);
  };

  if (status === "loading" || !session || loadingData)
    return <LoadingOverlay />;

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-[#0f1a2b] text-white p-6 border-r border-gray-800 shadow-xl">
        <h2 className="text-2xl font-semibold mb-4">Klasörler</h2>
        <FolderForm onNewFolder={handleFolderAdd} />

        {/* Açılır klasör seçici */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-white">
            Klasör Seç
          </label>
          <select
            className="w-full bg-[#0f1a2b] border border-gray-600 text-white p-2 rounded"
            value={currentFolder}
            onChange={(e) => setCurrentFolder(e.target.value)}
          >
            <option value="all">Tüm Notlar</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Notlar</h3>
          <ul className="space-y-1 max-h-[60vh] overflow-auto">
            {notes.length > 0 ? (
              notes.map(note => (
                <li key={note.id}>
                  <button
                    onClick={() => { setSelectedNote(note); setEditingDetail(false); }}
                    className="w-full text-left px-2 py-1 rounded hover:bg-gray-700"
                  >
                    {note.title || "(Başlıksız Not)"}
                  </button>
                </li>
              ))
            ) : (
              <li className="text-gray-400">Not yok</li>
            )}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 bg-gradient-to-br from-[#002c4b] via-[#003a66] to-[#e2e8f0] text-gray-100 overflow-auto">
        {/* Not Detayı veya Düzenleme Formu */}
        {selectedNote ? (
          editingDetail ? (
            <NoteForm
              folders={folders}
              currentFolderId={currentFolder}
              onNewNote={handleNoteAdd}
              onUpdateNote={(n) => {
                handleNoteUpdate(n);
                setSelectedNote(n);
                setEditingDetail(false);
              }}
              editingNote={selectedNote}
              closeForm={() => setEditingDetail(false)}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="flex justify-between items-center bg-gradient-to-br from-[#0f1a2b] via-[#002c4b] to-[#003a66] text-white px-4 py-3 rounded-t-lg shadow-inner">
                <h2 className="text-lg font-semibold">
                  {selectedNote.title}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingDetail(true)}
                    className="text-sm px-3 py-1 border border-white bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => setSelectedNote(null)}
                    className="text-sm px-3 py-1 border border-white bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition"
                  >
                    Kapat
                  </button>
                </div>
              </div>
              <div className="p-4 text-gray-800">
                <p className="whitespace-pre-wrap">
                  {selectedNote.content}
                </p>
              </div>
            </div>
          )
        ) : (
          <p className="text-gray-400">
            Bir klasör seçin ya da Tüm Notlar’ı kullanın.
          </p>
        )}
      </main>
    </div>
  );
}