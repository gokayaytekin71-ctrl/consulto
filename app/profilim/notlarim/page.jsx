"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";
import toast, { Toaster } from 'react-hot-toast';
import { FiMenu, FiX, FiFolder, FiClipboard } from 'react-icons/fi';
import { Tooltip } from 'react-tooltip';
import { useMediaQuery } from 'react-responsive';

const NoteForm = ({
  onNewNote,
  onUpdateNote,
  editingNote,
  closeForm,
}) => {
  const [title, setTitle] = useState(editingNote?.title || "");
  const [content, setContent] = useState(editingNote?.content || "");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle("");
    setContent("");
    closeForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    const url = editingNote ? `/api/notlarim/${editingNote.id}` : "/api/notlarim";
    const method = editingNote ? "PUT" : "POST";
    const body = { title, content, folderId: null };

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
        toast.success('Kaydedildi');
      }
    } catch {
      toast.error('Hata oluştu');
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#0f1a2b] p-6 rounded-lg shadow-md mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          className="w-full border border-cyan-500 bg-[#1f2a3a] text-white placeholder-gray-400 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="Not başlığı..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full border border-cyan-500 bg-[#1f2a3a] text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          rows={4}
          placeholder="Not içeriği..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium px-4 py-2 rounded-md disabled:opacity-50 transition"
          >
            {editingNote ? "Güncelle" : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="bg-gray-700 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-md transition"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

const NoteCard = ({ note, onSelect, onEdit, onDelete }) => (
  <div className="bg-[#1f2a3a] border border-gray-700 rounded-lg p-4 shadow-sm cursor-pointer flex flex-col transition-all hover:shadow-lg hover:bg-[#253445]">
    <div className="flex justify-between items-start">
      <h3
        className="font-medium text-lg flex-1 break-all pr-6"
        onClick={() => onSelect(note)}
      >
        {note.title || <><FiClipboard className="inline"/> <span data-tooltip-id="add-title" data-tooltip-content="Başlık ekle" className="underline">Başlıksız</span></>}
        <Tooltip id="add-title" />
      </h3>
      <div className="flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(note);
          }}
          className="text-blue-600 text-sm font-medium"
        >
          Düzenle
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="text-red-600 text-sm font-medium"
        >
          Sil
        </button>
      </div>
    </div>
    <p className="text-gray-300 text-sm mt-2">
      {note.content.length > 60
        ? note.content.slice(0, 60) + "..."
        : note.content}
    </p>
    <p className="text-gray-500 text-xs mt-auto text-right">
      {new Date(note.createdAt).toLocaleDateString("tr-TR")}
    </p>
  </div>
);

export default function NotlarimPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editingDetail, setEditingDetail] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const fetchNotes = async () => {
    setLoadingData(true);
    const url = "/api/notlarim";
    const res = await fetch(url);
    if (res.ok) setNotes(await res.json());
    setLoadingData(false);
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/auth/signin");
    else fetchNotes();
  }, [session, status, router]);

  const handleNoteAdd = (n) => {
    setNotes((prev) => [n, ...prev]);
    setShowForm(false);
  };
  const handleNoteUpdate = (n) =>
    setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
  const handleNoteDelete = async (id) => {
    await fetch(`/api/notlarim/${id}`, { method: "DELETE" });
    fetchNotes();
  };

  if (status === "loading" || !session || loadingData)
    return <LoadingOverlay />;

  const filteredNotes = notes
    .filter(n => {
      const title = n.title || "";
      const content = n.content || "";
      return title.toLowerCase().includes(searchTerm.toLowerCase())
        || content.toLowerCase().includes(searchTerm.toLowerCase());
    });

  const sidebarContent = (
    <>
      <h3 className="text-lg font-semibold mb-2 text-center">Notlar</h3>
      <ul className="space-y-1 max-h-[60vh] overflow-auto">
        {notes.map(note => (
          <li key={note.id} className="border-b border-cyan-500 last:border-none">
            <div
              onClick={() => { setSelectedNote(note); setEditingDetail(false); if (isMobile) setDrawerOpen(false); }}
              className="flex items-center justify-between p-3 bg-[#1f2a3a] rounded-none hover:bg-[#253445] transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <FiClipboard className="text-cyan-500" />
                <span className="text-white font-medium">{note.title || "(Başlıksız Not)"}</span>
              </div>
              <span className="text-gray-500 text-xs">
                {new Date(note.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>
          </li>
        ))}
        {notes.length === 0 && <li className="text-gray-400">Not yok</li>}
      </ul>
    </>
  );

  return (
    <>
      <Toaster />
      <div className="flex flex-col lg:flex-row h-full">
        {/* Sidebar */}
        {isMobile ? (
          <>
            <button onClick={() => setDrawerOpen(true)} className="p-2 fixed top-4 left-4 z-50">
              <FiMenu size={24} />
            </button>
            {drawerOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setDrawerOpen(false)}>
                <aside
                  className="absolute left-0 top-0 bottom-0 w-64 bg-[#0f1a2b] text-white p-6 border-r border-cyan-400 shadow-xl"
                  onClick={e => e.stopPropagation()}
                >
                  <button onClick={() => setDrawerOpen(false)} className="mb-4">
                    <FiX size={24} />
                  </button>
                  {sidebarContent}
                </aside>
              </div>
            )}
          </>
        ) : (
          <aside className="w-72 flex-shrink-0 bg-[#0f1a2b] text-white p-6 border-r border-cyan-400 shadow-xl">
            {sidebarContent}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 bg-[#0e1a2b] text-gray-100 overflow-auto">
          <div className="sticky top-0 bg-[#0f1a2b] text-white p-4 flex flex-col md:flex-row md:justify-end items-center z-10 border-b border-gray-700 shadow-sm">
            <input
              type="text"
              placeholder="Ara..."
              className="border border-cyan-500 bg-[#1f2a3a] text-white rounded-full px-4 py-2 flex-1 mb-2 md:mb-0 md:mr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="flex">
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full font-medium transition"
              >
                Yeni Not
              </button>
            </div>
          </div>

          {/* Removed Yeni Not button from here */}
          {showForm && (
            <NoteForm
              onNewNote={(n) => { handleNoteAdd(n); setShowForm(false); }}
              onUpdateNote={handleNoteUpdate}
              closeForm={() => setShowForm(false)}
            />
          )}
          {!showForm && (
            selectedNote ? (
              editingDetail ? (
                <NoteForm
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
                <div className="bg-[#1f2a3a] rounded-lg shadow-md border border-gray-700 overflow-hidden">
                  <div className="flex justify-between items-center bg-gradient-to-br from-teal-400 via-teal-600 to-blue-800 text-white px-4 py-3 rounded-t-lg shadow-inner">
                    <h2 className="text-lg font-semibold">
                      {selectedNote.title}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingDetail(true)}
                        className="text-sm px-3 py-1 border border-white bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition font-medium"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => setSelectedNote(null)}
                        className="text-sm px-3 py-1 border border-white bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition font-medium"
                      >
                        Kapat
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleNoteDelete(selectedNote.id); setSelectedNote(null); }}
                        className="text-sm px-3 py-1 border border-white bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition font-medium text-red-400"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                  <div className="p-4 text-gray-100">
                    <p className="whitespace-pre-wrap">
                      {selectedNote.content}
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="mt-8 text-center text-gray-400">
                Lütfen bir not seçiniz ya da yeni oluşturunuz.
              </div>
            )
          )}
        </main>
      </div>
    </>
  );
}