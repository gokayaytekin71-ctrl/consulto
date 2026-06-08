"use client";

import { autoLinkDecisionsInText } from "./workspace-utils";

export default function RichMessageText({ text, isUser, autoLink = false }) {
  const preparedText = autoLink ? autoLinkDecisionsInText(text) : String(text || "");
  const normalizedText = preparedText
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n")
    .trim();

  const lines = normalizedText.split("\n");

  function renderInline(value) {
    const parts = String(value || "").split(
      /(\[[^\]]+\]\([^)]+\)|\*\*[\s\S]+?\*\*)/g
    );

    return parts.map((part, index) => {
      // Link
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const href = linkMatch[2];
        const isDecisionLink = href.startsWith("/kararlar/");
        return (
          <a
            key={index}
            href={href}
            target={isDecisionLink ? "_blank" : undefined}
            rel={isDecisionLink ? "noreferrer" : undefined}
            className={isUser ? "font-black underline decoration-white/60 underline-offset-4" : "font-black text-blue-800 underline decoration-blue-300 underline-offset-4 hover:text-blue-950"}
          >
            {renderInline(linkMatch[1])}
          </a>
        );
      }

      // Bold (**...**) — önce kontrol edilmeli
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={index} className={isUser ? "font-black text-white" : "font-black text-slate-950"}>
            {renderInline(part.slice(2, -2))}
          </strong>
        );
      }

      return <span key={index}>{part.replace(/\*/g, "")}</span>;
    });
  }

  return (
    <div className={isUser ? "space-y-2 text-[12px] leading-6 not-italic" : "space-y-3 text-[12px] leading-6 text-slate-800 not-italic"}>
      {lines.map((line, index) => {
        const clean = line.trim();

        if (!clean) {
          return <div key={index} className="h-1" />;
        }

        if (/^####\s+/.test(clean)) {
          return (
            <h5 key={index} className={isUser ? "text-[12px] font-black text-white not-italic" : "mt-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-[12px] font-black leading-5 text-blue-950 not-italic"}>
              {renderInline(clean.replace(/^####\s+/, ""))}
            </h5>
          );
        }

        if (/^###\s+/.test(clean)) {
          return (
            <h4 key={index} className={isUser ? "text-sm font-black text-white not-italic" : "mt-3 text-sm font-black uppercase tracking-wide text-blue-900 not-italic"}>
              {renderInline(clean.replace(/^###\s+/, ""))}
            </h4>
          );
        }

        if (/^##\s+/.test(clean)) {
          return (
            <h3 key={index} className={isUser ? "text-sm font-black text-white not-italic" : "mt-3 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-black tracking-tight text-slate-950 not-italic"}>
              {renderInline(clean.replace(/^##\s+/, ""))}
            </h3>
          );
        }

        if (/^#\s+/.test(clean)) {
          return (
            <h2 key={index} className={isUser ? "text-base font-black text-white not-italic" : "mt-3 text-[12px] font-black tracking-tight text-slate-950 not-italic"}>
              {renderInline(clean.replace(/^#\s+/, ""))}
            </h2>
          );
        }

        if (clean.startsWith(">")) {
          return (
            <blockquote key={index} className="rounded-2xl border-l-4 border-blue-500 bg-blue-50/70 px-4 py-3 text-sm font-semibold leading-7 text-slate-800 shadow-sm not-italic">
              {renderInline(clean.replace(/^>\s?/, ""))}
            </blockquote>
          );
        }

        if (/^[-•]\s+/.test(clean)) {
          return (
            <div key={index} className={isUser ? "flex gap-2 text-white" : "flex gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-700"}>
              <span className={isUser ? "mt-0.5 text-white" : "mt-0.5 text-blue-700"}>•</span>
              <span>{renderInline(clean.replace(/^[-•]\s+/, ""))}</span>
            </div>
          );
        }

        if (/^\d+[.)]\s+/.test(clean)) {
          const number = clean.match(/^\d+/)?.[0];
          return (
            <div key={index} className={isUser ? "flex gap-2 text-white" : "flex gap-3 rounded-xl bg-slate-50 px-3 py-2 text-slate-700"}>
              <span className={isUser ? "font-black text-white" : "font-black text-blue-800"}>{number}.</span>
              <span>{renderInline(clean.replace(/^\d+[.)]\s+/, ""))}</span>
            </div>
          );
        }

        return (
          <p key={index} className={isUser ? "text-white not-italic" : "text-slate-800 not-italic"}>
            {renderInline(clean)}
          </p>
        );
      })}
    </div>
  );
}
