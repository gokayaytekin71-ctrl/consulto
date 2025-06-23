// app/components/Header.jsx
"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import animationData from "../animations/Animation1.json";

// Burada boş yorum yerine, asıl SVG içeriğini koyuyoruz:
const UserCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Eğer giriş (signin) sayfasındaysak veya NextAuth API yönlendirmesi varsa, Header'ı gizle
  if (pathname.includes("/auth/signin") || pathname.includes("/api/auth/signin")) return null;

  const { data: session, status } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const authButtonsPlaceholder = (
    <div className="w-24 h-8 bg-slate-700 animate-pulse rounded-md"></div>
  );

  return (
    <header
      className="sticky top-0 z-50 relative
                 bg-gradient-to-b from-[#001f3f] to-[#004365]
                 text-[#F5F5DC] flex items-center justify-between
                 px-4 sm:px-6 py-1 shadow-md"
    >
      {isPending && <LoadingOverlay />}
      <div className="flex-none">
        <Link href="/">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={120}
            height={34}
            className="cursor-pointer hover:opacity-90 object-contain"
            style={{ cursor: "pointer" }}
          />
        </Link>
      </div>

      <div
        className="absolute left-1/2 top-1/2
                   transform -translate-x-1/2 -translate-y-1/2
                   w-16 h-16 pointer-events-none hidden md:block"
      >
        <Lottie animationData={animationData} loop autoPlay />
      </div>

      <nav className="flex-none flex items-center space-x-3 sm:space-x-4 text-sm sm:text-base">
        <Link
          href="/kararlar"
          onClick={(e) => {
            e.preventDefault();
            startTransition(() => {
              router.push("/kararlar");
            });
          }}
          className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7v2h20V7L12 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 9v10h16V9H4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9v10M12 9v10M16 9v10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 19h20" />
            </svg>
          </div>
          <span className="mt-0.5 text-xs text-white">Kararlar</span>
        </Link>
        <Link
          href="/mevzuat"
          onClick={(e) => {
            e.preventDefault();
            startTransition(() => {
              router.push("/mevzuat");
            });
          }}
          className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15M7.5 4.5h9a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 016 18v-12a1.5 1.5 0 011.5-1.5z" />
            </svg>
          </div>
          <span className="mt-0.5 text-xs text-white">Mevzuat</span>
        </Link>
        <Link
          href="/makaleler"
          onClick={(e) => {
            e.preventDefault();
            startTransition(() => {
              router.push("/makaleler");
            });
          }}
          className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M9 8h6M5 20h14a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <span className="mt-0.5 text-xs text-white">Makaleler</span>
        </Link>
        <Link
          href="/gazete"
          onClick={(e) => {
            e.preventDefault();
            startTransition(() => {
              router.push("/gazete");
            });
          }}
          className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 11h10M7 15h10M7 7h.01" />
            </svg>
          </div>
          <span className="mt-0.5 text-xs text-white">Gazete</span>
        </Link>

        {isMounted ? (
          status === "loading" ? (
            authButtonsPlaceholder
          ) : session ? (
            <>
              <button aria-label="Bildirimler" className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer">
                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <BellIcon className="w-6 h-6 text-white" />
                </div>
                <span className="mt-0.5 text-xs text-white">Bildirim</span>
              </button>
              <Link
                href="/profilim"
                onClick={(e) => {
                  e.preventDefault();
                  startTransition(() => {
                    router.push("/profilim");
                  });
                }}
                className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <UserCircleIcon className="w-6 h-6 text-white" />
                </div>
                <span className="mt-0.5 text-xs text-white">Profilim</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-red-600 px-4 py-2 rounded-md hover:bg-red-700 transition text-white font-semibold cursor-pointer"
              >
                Çıkış Yap
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: "/profilim" })}
              className="bg-orange-500 px-4 py-2 rounded-md hover:bg-orange-600 transition text-white font-semibold cursor-pointer"
            >
              Giriş
            </button>
          )
        ) : (
          authButtonsPlaceholder
        )}
      </nav>
    </header>
  );
}