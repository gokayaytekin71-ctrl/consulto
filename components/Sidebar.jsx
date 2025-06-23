

"use client";

import React from "react";

export default function Sidebar({ chats, activeChatId, onNewChat, onSelectChat }) {
  return (
    <aside className="w-64 bg-gradient-to-b from-[#001f3f] to-[#004365] text-white p-6 flex flex-col shadow-lg">
      <div className="mb-4">
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Ara"
            className="w-full pl-10 pr-4 py-2 rounded-md bg-[#2b2b25] text-gray-300 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <nav className="space-y-2 text-sm flex-1 overflow-y-auto">
        <button
          onClick={onNewChat}
          className="w-full text-left px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
        >
          + Yeni Sohbet
        </button>
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-gray-300 mb-2">Sohbetler</p>
          <ul className="space-y-1">
            {chats.map((chat) => (
              <li
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`px-3 py-2 rounded text-sm cursor-pointer ${
                  chat.id === activeChatId
                    ? "bg-gray-700 text-white"
                    : "hover:bg-gray-600 text-gray-300"
                }`}
              >
                {chat.title}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
);
}