"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

/* ─── küçük inline ikonlar (sadece gerekli yerlerde) ─── */
const IcoBell    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
const IcoUser    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoLogout  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcoPlus    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoChevron = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M6 9l6 6 6-6"/></svg>;
const IcoMenu    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/></svg>;
const IcoX       = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoDot     = ({ className = "" }) => <span className={`h-1.5 w-1.5 rounded-full ${className}`} />;

/* ─── nav tanımları ─── */
const NAV_MAIN = [
  { label: "Kararlar",      path: "/kararlar" },
  { label: "Dilekçe",       path: "/dilekce" },
  { label: "Çalışma Alanı", path: "/calisma-alani", badge: "Chat" },
  { label: "Analiz",        path: "/bot" },
  { label: "Blog",          path: "/blog", matchPrefix: true },
  { label: "Paketler",      path: "/paketler-ucretler" },
];

const NAV_MORE = [
  { label: "Akıllı Arama",  path: "/akilli-arama" },
  { label: "Bilgi Kartları", path: "/Flash-Cards" },
  { label: "Araçlar",       path: "/araclar" },
  { label: "Mevzuat",       path: "/mevzuat" },
  { label: "Makaleler",     path: "/makaleler" },
  { label: "Resmî Gazete",  path: "/gazete" },
];

/* ─── mini dropdown kapsayıcı ─── */
function Menu({ children, align = "left", className = "" }) {
  return (
    <div
      className={`absolute top-full mt-2.5 z-[10001] min-w-[200px] overflow-hidden rounded-xl
        border border-slate-700/60 bg-[#0d1e30]
        shadow-[0_24px_64px_-8px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04)]
        ${align === "right" ? "right-0" : "left-0"}
        ${className}`}
    >
      {children}
    </div>
  );
}

function MenuItem({ href, onClick, children, danger = false }) {
  const cls = `flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors duration-150
    ${danger ? "text-red-400 hover:bg-red-500/10 hover:text-red-300" : "text-slate-200 hover:bg-slate-800 hover:text-white"}`;
  if (href) return <Link href={href} onClick={onClick} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

/* ═══════════════════════════════════════════════════════════ */
export default function Header() {
  const pathname          = usePathname();
  const router            = useRouter();
  const [isPending, startTransition] = useTransition();

  if (pathname.includes("/auth/signin") || pathname.includes("/api/auth/signin")) return null;

  const { data: session, status } = useSession();

  const [isMounted,    setIsMounted]    = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [moreOpen,     setMoreOpen]     = useState(false);
  const [bellOpen,     setBellOpen]     = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);

  const [tokenBalance,           setTokenBalance]           = useState(null);
  const [isLoadingTokenBalance,  setIsLoadingTokenBalance]  = useState(false);
  const [notifications,          setNotifications]          = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const moreRef    = useRef(null);
  const bellRef    = useRef(null);
  const profileRef = useRef(null);

  /* mount */
  useEffect(() => setIsMounted(true), []);

  /* scroll */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* body lock */
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; }, [mobileOpen]);

  /* token balance */
  useEffect(() => {
    if (status !== "authenticated") return;
    const fetch_ = () =>
      fetch("/api/user/balance", { cache: "no-store" })
        .then(r => r.ok ? r.json() : null)
        .then(d => d && setTokenBalance(d.tokenBalance ?? 0))
        .catch(console.error);
    setIsLoadingTokenBalance(true);
    fetch_().finally(() => setIsLoadingTokenBalance(false));
    window.addEventListener("token-balance-updated", fetch_);
    return () => window.removeEventListener("token-balance-updated", fetch_);
  }, [status]);

  /* notifications */
  useEffect(() => {
    if (status !== "authenticated") return;
    setIsLoadingNotifications(true);
    Promise.all([fetch("/api/tasks"), fetch("/api/hearings")])
      .then(async ([tr, hr]) => {
        const tasks    = tr.ok ? await tr.json() : [];
        const hearings = hr.ok ? await hr.json() : [];
        const today    = new Date(); today.setHours(0, 0, 0, 0);
        return [...tasks.map(i => ({ ...i, type: "Görev" })), ...hearings.map(i => ({ ...i, type: "Duruşma" }))]
          .filter(i => new Date(i.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
      })
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setIsLoadingNotifications(false));
  }, [status]);

  /* click-outside */
  useEffect(() => {
    const h = (e) => {
      if (moreRef.current    && !moreRef.current.contains(e.target))    setMoreOpen(false);
      if (bellRef.current    && !bellRef.current.contains(e.target))    setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const go = (path) => {
    setMobileOpen(false);
    if (pathname !== path) startTransition(() => router.push(path));
  };

  const isActive = (item) =>
    item.matchPrefix ? pathname.startsWith(item.path) : pathname === item.path;

  /* ─── NAV LINK ─── */
  const NavLink = ({ item }) => {
    const active = isActive(item);
    return (
      <button
        type="button"
        onClick={() => go(item.path)}
        className={`relative px-3.5 py-2 text-sm font-medium tracking-[-0.01em] transition-colors duration-200
          ${active ? "text-white" : "text-slate-400 hover:text-slate-100"}`}
      >
        {item.label}
        {item.badge && (
          <span className="absolute -top-1.5 -right-0.5 rounded-full bg-blue-500 px-1.5 py-px text-[9px] font-bold text-white leading-none">
            {item.badge}
          </span>
        )}
        {active && (
          <span className="absolute inset-x-3 -bottom-px h-px rounded-full bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />
        )}
      </button>
    );
  };

  /* ═══════════════════════════════════════ RENDER ═══════════════════════════════════════ */
  return (
    <>
      {isPending && <LoadingOverlay />}

      {/* ──────────────────────────────────
          MOBİL DRAWER
         ────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[10000] md:hidden transition-opacity duration-300
          ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        {/* backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />

        {/* drawer panel */}
        <div
          className={`absolute inset-y-0 right-0 flex w-72 flex-col bg-[#08131f] transition-transform duration-300
            ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* drawer header */}
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <Image src="/images/logo.png" alt="Consülto" width={96} height={26} className="h-6 w-auto" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              <IcoX />
            </button>
          </div>

          {/* drawer nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Menü</p>
            {NAV_MAIN.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => go(item.path)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150
                  ${isActive(item) ? "bg-white/[0.07] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}
              >
                <span className="flex items-center gap-2">
                  {isActive(item) && <IcoDot className="bg-cyan-400" />}
                  {item.label}
                </span>
                {item.badge && (
                  <span className="rounded-full bg-blue-500/20 px-2 py-px text-[10px] font-semibold text-blue-400">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Diğer</p>
              {NAV_MORE.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* drawer footer */}
          {!session && (
            <div className="border-t border-white/[0.07] p-4">
              <button
                onClick={() => { setMobileOpen(false); signIn(undefined, { callbackUrl: "/profilim" }); }}
                className="w-full rounded-xl bg-white py-3 text-sm font-bold text-slate-900 transition-all hover:bg-slate-100 active:scale-[0.98]"
              >
                Giriş Yap
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────
          HEADER BAR
         ────────────────────────────────── */}
      <header
        data-global-header="true"
        className={`fixed inset-x-0 top-0 z-[9999] h-16 transition-all duration-300
          ${scrolled
            ? "border-b border-white/[0.07] bg-[#04111e]/95 shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl"
            : "bg-[#04111e]/50 backdrop-blur-xl"
          }`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* ── LOGO ── */}
          <Link href="/" className="flex-shrink-0 transition-opacity hover:opacity-80">
            <Image
              src="/images/logo.png"
              alt="Consülto"
              width={100}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>

          {/* ── DESKTOP NAV ── */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV_MAIN.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}

            {/* Daha fazla */}
            <div className="relative ml-1" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen(!moreOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors duration-200
                  ${moreOpen ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
              >
                Daha fazla
                <span className={`transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}>
                  <IcoChevron />
                </span>
              </button>
              {moreOpen && (
                <Menu>
                  <div className="py-1">
                    {NAV_MORE.map((item) => (
                      <MenuItem key={item.path} href={item.path} onClick={() => setMoreOpen(false)}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </div>
                </Menu>
              )}
            </div>
          </nav>

          {/* ── SAĞ: AKSIYONLAR ── */}
          <div className="flex flex-shrink-0 items-center gap-2">

            {/* ── AUTH ALANI ── sabit boyutlu kapsayıcı → layout shift yok */}
            <div className="flex items-center gap-2">

              {/* Yükleniyor skeleton — authenticated UI ile birebir aynı boyut */}
              {(!isMounted || status === "loading") && (
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-white/[0.05]" />
                  <div className="hidden sm:flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-3 bg-white/[0.03]">
                    <div className="h-8 w-8 rounded-full bg-white/[0.07]" />
                    <div className="h-2.5 w-14 rounded-full bg-white/[0.07]" />
                    <div className="h-3 w-3 opacity-30" />
                  </div>
                  <div className="sm:hidden h-8 w-8 rounded-full bg-white/[0.07]" />
                </div>
              )}

            {/* ---- oturum açık ---- */}
            {isMounted && status === "authenticated" && session && (
              <>
                {/* Bildirim zili */}
                <div className="relative" ref={bellRef}>
                  <button
                    type="button"
                    onClick={() => setBellOpen(!bellOpen)}
                    aria-label="Bildirimler"
                    className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white"
                  >
                    <IcoBell />
                    {notifications.length > 0 && (
                      <span className="absolute right-2 top-2 flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                      </span>
                    )}
                  </button>

                  {bellOpen && (
                    <Menu align="right" className="w-80">
                      <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3.5">
                        <span className="text-sm font-semibold text-white">Bildirimler</span>
                        <span className="rounded-full bg-slate-700/80 px-2 py-px text-[11px] text-slate-300">
                          {notifications.length}
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto py-1">
                        {isLoadingNotifications ? (
                          <p className="px-4 py-4 text-center text-sm text-slate-400">Yükleniyor…</p>
                        ) : notifications.length === 0 ? (
                          <p className="px-4 py-6 text-center text-sm text-slate-400">Her şey yolunda 🎉</p>
                        ) : (
                          notifications.slice(0, 5).map((item) => (
                            <Link
                              key={`${item.type}-${item.id}`}
                              href="/profilim/gorevlerim"
                              onClick={() => setBellOpen(false)}
                              className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-800"
                            >
                              <IcoDot className={`mt-1.5 flex-shrink-0 ${item.type === "Görev" ? "bg-emerald-400" : "bg-orange-400"}`} />
                              <div>
                                <p className="text-sm font-medium text-slate-100 line-clamp-1">{item.content}</p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {item.type} · {new Date(item.date).toLocaleDateString("tr-TR")}
                                </p>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                      <div className="border-t border-slate-700/60 px-4 py-3">
                        <Link
                          href="/profilim/gorevlerim"
                          onClick={() => setBellOpen(false)}
                          className="text-[12px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          Tüm ajandayı gör →
                        </Link>
                      </div>
                    </Menu>
                  )}
                </div>

                {/* Avatar + profil dropdown */}
                <div className="relative ml-1" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    aria-label="Profil"
                    className={`flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-3 transition-colors duration-150
                      ${profileOpen ? "bg-white/[0.08]" : "hover:bg-white/[0.07]"}`}
                  >
                    {/* avatar */}
                    <div className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-white/15">
                      {session.user?.image ? (
                        <Image src={session.user.image} alt="Profil" width={32} height={32} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                          <IcoUser />
                        </div>
                      )}
                    </div>
                    <span className="hidden text-sm font-medium text-slate-200 sm:block">
                      {session.user?.name?.split(" ")[0] ?? "Profil"}
                    </span>
                    <span className="text-slate-600"><IcoChevron /></span>
                  </button>

                  {profileOpen && (
                    <Menu align="right" className="w-64">
                      {/* kullanıcı bilgisi */}
                      <div className="border-b border-slate-700/60 px-4 py-4">
                        <p className="truncate text-sm font-semibold text-white">{session.user?.name ?? "Kullanıcı"}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">{session.user?.email}</p>
                      </div>

                      {/* token bakiye */}
                      <div className="border-b border-slate-700/60 px-4 py-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Bakiyem</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                          {isLoadingTokenBalance ? "…" : (tokenBalance ?? session?.user?.tokenBalance ?? 0)}
                          <span className="ml-1 text-sm font-normal text-slate-400">token</span>
                        </p>
                        <Link
                          href="/paketler-ucretler"
                          onClick={() => setProfileOpen(false)}
                          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-700/70 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-600 hover:text-white"
                        >
                          <IcoPlus /> Token Yükle
                        </Link>
                      </div>

                      {/* aksiyonlar */}
                      <div className="py-1">
                        <MenuItem href="/profilim" onClick={() => setProfileOpen(false)}>
                          <IcoUser /> Profilim &amp; Ayarlar
                        </MenuItem>
                        <MenuItem onClick={async () => { setProfileOpen(false); await signOut({ callbackUrl: "/cikis" }); }} danger>
                          <IcoLogout /> Çıkış Yap
                        </MenuItem>
                      </div>
                    </Menu>
                  )}
                </div>
              </>
            )}

            {/* ---- oturum kapalı ---- */}
            {isMounted && status !== "loading" && !session && (
              <button
                onClick={() => signIn(undefined, { callbackUrl: "/profilim" })}
                className="hidden rounded-lg bg-white px-4 py-1.5 text-[13px] font-semibold text-slate-900 transition-all hover:bg-slate-100 active:scale-95 sm:block"
              >
                Giriş Yap
              </button>
            )}

            </div>
            {/* ── AUTH ALANI sonu ── */}

            {/* Hamburger (mobile) */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Menüyü aç"
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
            >
              <IcoMenu />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
