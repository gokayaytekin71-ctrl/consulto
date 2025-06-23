// components/ChatBotUI.jsx
"use client";
import { useState } from "react";
import ChatWidgetButton from "./ChatWidgetButton";
import ChatWindow from "./ChatWidgetWindow";

export default function ChatBotUI() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ChatWidgetButton onClick={() => setIsOpen(!isOpen)} />
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
    </>
  );
}