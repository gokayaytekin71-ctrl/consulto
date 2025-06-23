// Proje yolunuz: /app/bot/page.js

"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "@/components/Sidebar";

export default function BotChatPage() {
  const { data: session } = useSession();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!session) return;
    fetch("/api/chats")
      .then(res => { if (!res.ok) { return { chats: [] }; } return res.json(); })
      .then(data => {
        const stored = data.chats || [];
        if (stored.length === 0) { handleNewChat(); } 
        else {
          setChats(stored);
          setActiveChatId(stored[0]?.id || null);
        }
      })
      .catch(error => { console.error("Sohbet verisi işlenirken hata:", error); handleNewChat(); });
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

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: crypto.randomUUID(), sender: "user", text: input };
    const loadId = crypto.randomUUID();
    const loadingMsg = { id: loadId, sender: "bot", text: "Analiziniz hazırlanıyor..." };

    setChats(prevChats =>
      prevChats.map(c =>
        c.id === activeChatId
          ? { ...c, messages: [...c.messages, userMsg, loadingMsg] }
          : c
      )
    );
    
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sorgu: userMsg.text }),
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
              citations.push({
                number: currentNumber,
                fileName: fileName,
              });
              
              // --- DEĞİŞİKLİK BURADA: Numara artık doğrudan karara link veriyor ---
              const linkPlaceholder = ` **[[${currentNumber}]](${'/kararlar/' + fileName})**`;
              analysisText = analysisText.replace(searchRegex, linkPlaceholder);

              citationCounter++;
            }
          }
        });
      }
      
      let botReply = analysisText;

      // Metin içi atıfların listesini de ekleyelim, bu hala kullanışlı.
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
    } catch (err) { /* ... Hata işleme ... */ } 
    finally { setIsLoading(false); }
  };

  const handleNewChat = () => { /* ... */ };
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  
 return (
    <div className="flex h-screen w-full bg-slate-100 text-gray-800">
        <Sidebar chats={chats} activeChatId={activeChatId} onNewChat={handleNewChat} onSelectChat={setActiveChatId} />
        <main className="flex flex-col flex-1 bg-white shadow-xl">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(m => (
                    <div key={m.id} className={`flex w-full ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {/* --- TASARIM DEĞİŞİKLİĞİ BURADA --- */}
                        <div
                          className={`px-4 py-3 rounded-lg ${
                            m.sender === "bot"
                              ? "bg-slate-100 w-full" // Bot mesajları artık tam genişlikte
                              : "bg-blue-600 text-white max-w-prose" // Kullanıcı mesajları dar kalıyor
                          }`}
                        >
                            <div className="chat-bot-response">
                               <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            <div className="border-t p-4 bg-white">
                <form onSubmit={handleSend} className="flex items-center space-x-3">
                    <textarea rows={2} className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 resize-none" value={input} onChange={e => setInput(e.target.value)} disabled={isLoading} placeholder="Mesajınızı yazın..." />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400" disabled={isLoading}>
                        {isLoading ? "..." : "Gönder"}
                    </button>
                </form>
            </div>
        </main>
    </div>
  );
}