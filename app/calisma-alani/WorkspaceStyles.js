"use client";

// Çalışma Alanı sayfasına özel global stiller (scrollbar, shimmer, header gizleme).
export default function WorkspaceStyles() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
        body.calisma-global-header-hidden [data-global-header="true"] {
          display: none !important;
        }

        body.calisma-global-header-hidden {
          padding-top: 0 !important;
        }

        body.calisma-global-header-hidden > main,
        body.calisma-global-header-hidden #__next > main,
        body.calisma-global-header-hidden [data-app-main="true"] {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.3);
          border-radius: 20px;
        }
          .shimmer-text {
  background: linear-gradient(
    90deg,
    rgba(100, 116, 139, 0.45) 0%,
    rgba(100, 116, 139, 0.45) 35%,
    rgba(15, 23, 42, 0.95) 50%,
    rgba(100, 116, 139, 0.45) 65%,
    rgba(100, 116, 139, 0.45) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: shimmer-slide 3.5s linear infinite;
}

@keyframes shimmer-slide {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Düşünme/yükleme metninin sonundaki yumuşak üç nokta */
.thinking-ellipsis {
  display: inline-block;
  margin-left: 1px;
  letter-spacing: 1px;
}
.thinking-ellipsis > span {
  display: inline-block;
  opacity: 0.15;
  animation: thinking-dot 1.4s infinite ease-in-out both;
}
.thinking-ellipsis > span:nth-child(1) { animation-delay: 0s; }
.thinking-ellipsis > span:nth-child(2) { animation-delay: 0.2s; }
.thinking-ellipsis > span:nth-child(3) { animation-delay: 0.4s; }

@keyframes thinking-dot {
  0%, 60%, 100% { opacity: 0.15; transform: translateY(0); }
  30% { opacity: 0.9; transform: translateY(-1px); }
}

@media (prefers-reduced-motion: reduce) {
  .thinking-ellipsis > span {
    animation: none;
    opacity: 0.6;
  }
}
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.5);
        }
      `}} />
  );
}