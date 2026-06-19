// app/profilim/layout.jsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import { FiUser, FiStar, FiFileText, FiEdit, FiCalendar } from "react-icons/fi";

const profileItems = [
  { href: "/profilim", icon: <FiUser />, label: "Profil Sayfası" },
  { href: "/profilim/favori-kararlar", icon: <FiStar />, label: "Favori Kararlar" },
  { href: "/profilim/favori-makaleler", icon: <FiFileText />, label: "Favori Makaleler" },
  { href: "/profilim/notlarim", icon: <FiEdit />, label: "Notlarım" },
  { href: "/profilim/gorevlerim", icon: <FiCalendar />, label: "Görevlerim" },
];

export default async function ProfileLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin?callbackUrl=/profilim");
  }

  return (
    // Zemin Rengi: Zifiri karanlık yerine Slate-900 (#0f172a) kullanıldı. Daha yumuşak.
    <main className="flex h-screen overflow-hidden bg-[#0f172a] text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* --- GLOBAL BACKGROUND FX (Sayfayı canlandıran ışıklar) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Sol Üst: Hafif İndigo */}
        <div className="absolute top-[-10%] left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[130px] animate-pulse" />
        {/* Sağ Alt: Hafif Cyan */}
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-cyan-600/10 rounded-full blur-[130px]" />
        {/* Orta: Çok hafif Mavi */}
        <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[90px]" />
        
        {/* Hafif Noise Dokusu (Kalite hissi için) */}
      </div>

      {/* --- SIDEBAR WRAPPER --- */}
      {/* Sidebar'ın arkasına hafif bir cam efekti ve sınır çizgisi */}
      <aside className="hidden md:block h-full relative z-20 shrink-0 border-r border-white/5 bg-[#0f172a]/60 backdrop-blur-2xl">
        <Sidebar items={profileItems} session={session} />
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <section className="flex-1 relative z-10 h-full overflow-y-auto scroll-smooth custom-scrollbar">
        {/* İçerik alanına hafif bir gradient ekleyerek düz renkten kurtarıyoruz */}
        <div className="min-h-full bg-gradient-to-br from-transparent via-[#1e293b]/20 to-transparent">
            
            {/* Üstte hafif gölge (Scroll yapınca estetik durması için) */}
            <div className="sticky top-0 z-10 h-6 bg-gradient-to-b from-[#0f172a] to-transparent pointer-events-none"></div>
            
            <div className="px-4 pb-12 md:px-8 lg:px-10">
              {children}
            </div>
        </div>
      </section>

    </main>
  );
}
