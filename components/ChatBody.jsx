

"use client";

import React, { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatBody({ messages, input, setInput, onSend, isLoading }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col relative min-h-0">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                msg.sender === "bot"
                  ? "bg-blue-100 text-blue-900 self-start"
                  : "bg-blue-600 text-white self-end"
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm">
            Henüz bir sohbet yok. Yeni bir sohbet başlatmak için soldaki "+ Yeni
            Sohbet" düğmesine tıklayın.
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>
      {onSend && (
        <form
          onSubmit={onSend}
          className="fixed bottom-0 left-64 right-0 bg-white border-t border-blue-200 p-4 flex items-center space-x-3 z-10"
        >
          <textarea
            rows={2}
            placeholder="Mesajınızı yazın..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-md border border-blue-300 px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            disabled={isLoading}
          >
            {isLoading ? "Gönderiliyor..." : "Gönder"}
          </button>
        </form>
      )}
    </div>
  );
}