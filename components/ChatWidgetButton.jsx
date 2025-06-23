// components/ChatWidgetButton.jsx
"use client";

export default function ChatWidgetButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-xl z-50 animate-bounce"
      aria-label="Yapay Zeka Asistanı"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 8h10M7 12h6m-3 8a9 9 0 100-18 9 9 0 000 18z"
        />
      </svg>
    </button>
  );
}