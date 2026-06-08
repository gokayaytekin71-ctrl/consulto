"use client";

import RichMessageText from "./RichMessageText";

export default function ExpandableNoteText({
  text,
  expanded,
  onToggle,
  maxLength = 200,
  className = "",
  buttonClassName = "",
}) {
  const value = String(text || "");
  const shouldCollapse = value.length > maxLength;
  const visibleText = shouldCollapse && !expanded ? `${value.slice(0, maxLength).trim()}...` : value;

  return (
    <div>
      <div className={className}>
        <RichMessageText text={visibleText} isUser={false} autoLink />
      </div>

      {shouldCollapse && (
        <button type="button" onClick={onToggle} className={buttonClassName}>
          {expanded ? "Daha az göster" : "Devamını gör"}
        </button>
      )}
    </div>
  );
}
