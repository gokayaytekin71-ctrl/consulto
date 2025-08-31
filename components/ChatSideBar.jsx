"use client";
import React from "react";
import { FiPlus, FiSearch, FiMessageSquare } from "react-icons/fi";

export default function ChatSideBar({
  chats = [],
  activeChatId,
  onNewChat,
  onSelectChat,
  onSearch,
}) {
  return (
    <aside className="w-72 bg-[#0f1a2b] text-white p-4 border-r border-cyan-500 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Analizler</h2>
        <button
          onClick={onNewChat}
          className="text-cyan-400 p-2 hover:bg-[#22303a] rounded transition"
          title="Yeni Analiz"
        >
          <FiPlus size={20} />
        </button>
      </div>
      {/* Search */}
      <div className="relative mb-4">
        <FiSearch className="absolute top-3 left-3 text-gray-400" />
        <input
          type="text"
          placeholder="Ara..."
          onChange={(e) => onSearch?.(e.target.value)}
          className="w-full pl-10 pr-3 py-2 bg-[#1f2a3a] rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
      {/* List */}
      <ul className="flex-1 overflow-y-auto space-y-2">
        {chats.map((chat) => (
          <li key={chat.id}>
            <button
              onClick={() => onSelectChat(chat.id)}
              className={`w-full flex items-center space-x-2 p-2 rounded-lg transition ${
                chat.id === activeChatId
                  ? "bg-cyan-500 text-white"
                  : "hover:bg-[#22303a] text-gray-200"
              }`}
            >
              <FiMessageSquare className="text-lg" />
              <span className="truncate">{chat.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}