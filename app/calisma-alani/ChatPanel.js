"use client";

import { WORKSPACE_MODES } from "./workspace-utils";
import WorkspacePanel from "./WorkspacePanel";
import RichMessageText from "./RichMessageText";

export default function ChatPanel({ vm }) {
  const {
    setActivePanel,
    modeMenuRef,
    isModeMenuOpen, setIsModeMenuOpen,
    activeWorkspaceId,
    isLoadingWorkspaceDetail,
    activeWorkspaceMode,
    workspaceMode, setWorkspaceMode,
    chatScrollRef,
    handleChatTextSelection,
    handleChatScroll,
    isAtChatBottom,
    scrollChatToBottom,
    messages,
    selectedChatText,
    selectedTextActionRef,
    addBotTextToNotes,
    clearSelectedChatText,
    chatMessagesEndRef,
    handleSubmit,
    input, setInput,
    activeWorkspace,
    deepThinkingEnabled, setDeepThinkingEnabled,
    forceCaseSearchEnabled, setForceCaseSearchEnabled,
    tokenBalance,
    currentMessageTokenCost,
    isLoadingTokenBalance,
  } = vm;

  return (
    <WorkspacePanel
      id="chat"
      title="Çalışma Alanı"
      subtitle="Soru-cevap alanı"
      setActivePanel={setActivePanel}
      actions={
        <div ref={modeMenuRef} className="relative flex min-w-0 flex-1 items-center justify-end px-2">
          <button
            type="button"
            onClick={() => setIsModeMenuOpen((prev) => !prev)}
            disabled={!activeWorkspaceId || isLoadingWorkspaceDetail}
            className="group flex max-w-[220px] shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md disabled:opacity-40 sm:max-w-[260px]"
            title={`Mod: ${activeWorkspaceMode.label}`}
          >
            <span className="hidden shrink-0 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 sm:inline">
              Mod
            </span>
            <span className="min-w-0 truncate text-xs font-black text-slate-900">
              {activeWorkspaceMode.label}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
              className={`shrink-0 text-slate-400 transition-transform ${isModeMenuOpen ? "rotate-180 text-blue-600" : "group-hover:text-blue-700"}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isModeMenuOpen && (
            <div className="absolute right-2 top-full z-50 mt-2 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_55px_rgba(15,23,42,0.14)]">
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Çalışma Modu Seç
              </div>
              <div className="space-y-1">
                {WORKSPACE_MODES.map((mode) => {
                  const active = mode.id === workspaceMode;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setWorkspaceMode(mode.id);
                        setIsModeMenuOpen(false);
                      }}
                      disabled={!activeWorkspaceId || isLoadingWorkspaceDetail}
                      className={`flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition-all disabled:opacity-40 ${
                        active
                          ? "bg-blue-50 text-blue-950"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-black">
                          {mode.label}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[10px] font-medium leading-4 text-slate-500">
                          {mode.helper}
                        </span>
                      </span>
                      {active && (
                        <span className="mt-0.5 shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white">
                          Aktif
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      }
    >
   <div className="relative flex h-full min-h-0 flex-col">
     <div
  ref={chatScrollRef}
  onScroll={handleChatScroll}
  onMouseUp={handleChatTextSelection}
  onTouchEnd={handleChatTextSelection}
  className="flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar"
>
       {isLoadingWorkspaceDetail ? (
         <div className="flex h-full min-h-[220px] items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
           <div>
             <div className="mb-2 text-2xl opacity-50">⏳</div>
             <div className="text-xs font-bold text-slate-500">Çalışma alanı yükleniyor...</div>
           </div>
         </div>
       ) : messages.map((message) => {
         const isUser = message.role === "user";
         const isThinkingMessage =
          !isUser &&
          Boolean(message.sources?.loading) &&
          !String(message.text || "").trim();
         return (
           <div key={message.id} className="flex w-full">
             <div className={[
                 isUser
            ? "ml-auto max-w-[78%] rounded-3xl px-5 py-4 text-[12px] leading-6 shadow-sm border"
            : isThinkingMessage
              ? "mr-auto w-full rounded-3xl px-5 py-4 text-[12px] leading-6 shadow-sm border"
              : "mr-auto w-full rounded-3xl px-5 py-4 text-[12px] leading-6 shadow-sm border",
                 isUser
                   ? "border-blue-800 bg-gradient-to-br from-blue-800 to-blue-950 text-white"
                   : "border-slate-200 bg-white text-slate-800",
               ].join(" ")}>
{isThinkingMessage ? (
  <div className="flex items-center gap-3">
    <span className="flex shrink-0 items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.24s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.12s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
    </span>
    <span className="shimmer-text font-bold italic">
      {message.sources?.forceCaseSearch
        ? `${message.sources?.workspaceModeLabel || "Genel Analiz"} modunda yeni karar araması yapılıyor`
        : `${message.sources?.workspaceModeLabel || "Genel Analiz"} modunda cevap hazırlanıyor`}
      <span className="thinking-ellipsis" aria-hidden="true">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </span>
  </div>
) : (
                 <RichMessageText text={message.text} isUser={isUser} autoLink={!isUser} />
               )}
               {!isUser && !isThinkingMessage && (
                 <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                   <button
                     onClick={() => addBotTextToNotes(message.text)}
                     className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                   >
                     Notlara Ekle
                   </button>
                 </div>
               )}
             </div>
           </div>
         );
       })}
       <div ref={chatMessagesEndRef} className="h-1" />
       {selectedChatText && (
  <div className="sticky bottom-2 z-20 flex justify-center">
    <div ref={selectedTextActionRef} className="flex max-w-[92%] items-center gap-2 rounded-2xl border border-blue-100 bg-white/95 px-3 py-2 shadow-[0_12px_35px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div className="min-w-0 truncate text-[11px] font-semibold text-slate-500">
        Seçildi: {selectedChatText.slice(0, 80)}{selectedChatText.length > 80 ? "..." : ""}
      </div>

      <button
        type="button"
        onClick={() => {
          addBotTextToNotes(selectedChatText);
          clearSelectedChatText();
        }}
        className="shrink-0 rounded-xl bg-blue-600 px-3 py-1.5 text-[10px] font-black text-white transition-all hover:bg-blue-700"
      >
        Notlara Ekle
      </button>

      <button
        type="button"
        onClick={clearSelectedChatText}
        className="shrink-0 rounded-xl bg-slate-100 px-2.5 py-1.5 text-[10px] font-black text-slate-500 transition-all hover:bg-slate-200"
      >
        Kapat
      </button>
    </div>
  </div>
)}

       {!isAtChatBottom && (
         <div className="pointer-events-none sticky bottom-3 z-30 flex justify-center">
           <button
             type="button"
             onClick={() => scrollChatToBottom("smooth")}
             title="En alta in"
             aria-label="En alttaki mesaja in"
             className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.18)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
             </svg>
           </button>
         </div>
       )}

     </div>

                  <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 bg-white p-2.5 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10">
                    <div className="relative rounded-2xl border-2 border-slate-100 bg-slate-50 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`${activeWorkspace.title} kapsamında ${activeWorkspaceMode.label} için sorunuzu yazın...`}
                        className="min-h-[58px] w-full resize-none rounded-2xl bg-transparent px-4 pb-3 pt-3 text-[13px] font-medium leading-5 outline-none placeholder:text-slate-400 custom-scrollbar md:pb-12"
                      />

                      <div className="flex flex-wrap items-center justify-end gap-2 px-2 pb-2 md:absolute md:bottom-2 md:right-2 md:px-0 md:pb-0">
                        <button
                          type="button"
                          onClick={() => setDeepThinkingEnabled((prev) => !prev)}
                          className={`rounded-xl border px-3.5 py-2 text-[11px] font-black shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:shadow-none ${
                            deepThinkingEnabled
                              ? "border-purple-700 bg-purple-700 text-white"
                              : "border-purple-200 bg-white text-purple-800 hover:bg-purple-50"
                          }`}
                          disabled={!activeWorkspaceId || isLoadingWorkspaceDetail}
                          title={deepThinkingEnabled ? "Cevap ana modelle üretilecek" : "Cevap hızlı modelle üretilecek"}
                        >
                          {deepThinkingEnabled ? "✓ Daha Uzun Düşün" : "Daha Uzun Düşün"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setForceCaseSearchEnabled((prev) => !prev)}
                          className={`rounded-xl border px-3.5 py-2 text-[11px] font-black shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:shadow-none ${
                            forceCaseSearchEnabled
                              ? "border-blue-700 bg-blue-700 text-white"
                              : "border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
                          }`}
                          disabled={!activeWorkspaceId || isLoadingWorkspaceDetail}
                        >
                          {forceCaseSearchEnabled ? "✓ Karar Aranacak" : "Yeni Karar Ara"}
                        </button>

                        <button
                          type="submit"
                          className="rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-black text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:shadow-none"
                          disabled={
                            !input.trim() ||
                            !activeWorkspaceId ||
                            isLoadingWorkspaceDetail ||
                            isLoadingTokenBalance ||
                            (Number.isFinite(Number(tokenBalance)) && Number(tokenBalance) < currentMessageTokenCost)
                          }
                        >
                          {Number.isFinite(Number(tokenBalance)) && Number(tokenBalance) < currentMessageTokenCost ? "Token Yok" : "Sor"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1 text-[10px] font-bold text-slate-400">
                      <span>İlk 3 mesaj 1 token, sonraki mesajlar 2 token. Bu mesaj: {currentMessageTokenCost} token.</span>
                      {Number.isFinite(Number(tokenBalance)) && (
                        <span className={Number(tokenBalance) < currentMessageTokenCost ? "text-red-600" : "text-emerald-600"}>
                          Kalan token: {tokenBalance}
                        </span>
                      )}
                    </div>
                  </form>
                </div>
    </WorkspacePanel>
  );
}