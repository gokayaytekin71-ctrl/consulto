// Proje yolunuz: /components/ChatWidgetWindow.jsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatWidgetWindow({ onClose }) {
  const { data: session } = useSession();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!session) return;
    fetch("/api/chats")
      .then(res => {
        if (!res.ok) { console.error("Sohbetler çekilemedi, durum:", res.status); return { chats: [] }; }
        return res.json();
      })
      .then(data => {
        const stored = data.chats || [];
        if (stored.length === 0) { handleNew(); } 
        else {
          setChats(stored);
          setActiveChatId(stored[0]?.id || null);
        }
      })
      .catch(error => { console.error("Sohbet verisi işlenirken hata:", error); handleNew(); });
  }, [session]);

  useEffect(() => {
    if (!session || !activeChatId || chats.length === 0) return;
    fetch("/api/chats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chats }),
    });
  }, [chats, session, activeChatId]);

  const active = chats.find(c => c.id === activeChatId);
  const messages = active?.messages || [];

  const handleSubmit = async e => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMsg = { id: crypto.randomUUID(), sender: "user", text: input };
    const loadId = crypto.randomUUID();
    const loadingMsg = { id: loadId, sender: "bot", text: "Analiziniz hazırlanıyor..." };

    setChats(prevChats =>
      prevChats.map(c =>
        c.id === activeChatId ? { ...c, messages: [...c.messages, userMsg, loadingMsg] } : c
      )
    );
    
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sorgu: userMsg.text })
      });
      const data = await res.json();

      let analysisText = data.sonuc_ve_degerlendirme || "Analiz metni bulunamadı.";

      const citations = [];
      let citationCounter = 1;

      if (data.ilgili_kararlar && data.ilgili_kararlar.length > 0) {
        data.ilgili_kararlar.forEach(karar => {
          const fileName = karar.properties.orijinal_karar_id;
          if (!fileName) return;

          const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const searchRegex = new RegExp(escapedFileName.replace(/_/g, '(\\\\_|_)'), 'g');
          
          if (analysisText.match(searchRegex)) {
            if (!citations.some(c => c.fileName === fileName)) {
              const currentNumber = citationCounter;
              citations.push({ number: currentNumber, fileName: fileName });
              const linkPlaceholder = ` **[${currentNumber}]**`;
              analysisText = analysisText.replace(searchRegex, linkPlaceholder);
              citationCounter++;
            }
          }
        });
      }
      
      let botReply = analysisText;

      if (citations.length > 0) {
        botReply += "\n\n---\n\n### Metin İçi Atıflar\n\n";
        citations.forEach(citation => {
          botReply += `**[${citation.number}]**: [${citation.fileName}](/kararlar/${citation.fileName})\n`;
        });
      }

      const finalBotMsg = { id: crypto.randomUUID(), sender: "bot", text: botReply };
      setChats(prevChats =>
        prevChats.map(c =>
          c.id === activeChatId
            ? { ...c, messages: c.messages.filter(m => m.id !== loadId).concat(finalBotMsg) }
            : c
        )
      );

    } catch (err) {
      console.error("Yanıt işlenirken hata oluştu:", err);
      setChats(prevChats =>
        prevChats.map(c =>
          c.id === activeChatId
            ? { ...c, messages: c.messages.filter(m => m.id !== loadId).concat({ id: crypto.randomUUID(), sender: 'bot', text: 'Bir hata oluştu, yanıt işlenemedi.'}) }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    const id = crypto.randomUUID();
    const newChat = {
      id,
      title: `Yeni Sohbet`,
      messages: [{ id: crypto.randomUUID(), sender: "bot", text: "Merhaba! Size nasıl yardımcı olabilirim?" }],
    };
    setChats(prevChats => [newChat, ...prevChats]);
    setActiveChatId(id);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="flex flex-1 min-h-0">
          <Sidebar chats={chats} activeChatId={activeChatId} onNewChat={handleNew} onSelectChat={setActiveChatId} />
          <div className="flex-1 flex flex-col bg-gray-50">
            <header className="flex justify-between items-center p-4 border-b bg-white flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">KararAI Asistan</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-light">&times;</button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(m => (
                <div key={m.id} className={`flex w-full ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xl p-3 rounded-lg ${m.sender === "bot" ? "bg-white border" : "bg-blue-600 text-white"}`}>
                    <div className="chat-bot-response">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </main>
            <footer className="p-4 border-t bg-white flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                <textarea rows={2} placeholder="Hukuki sorunuzu buraya yazın..." className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 resize-none" value={input} onChange={e => setInput(e.target.value)} disabled={isLoading} />
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300" disabled={isLoading}>
                  {isLoading ? "..." : "Gönder"}
                </button>
              </form>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}