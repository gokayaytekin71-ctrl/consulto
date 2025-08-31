// app/profilim/layout.jsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import { FiUser, FiStar, FiBookOpen, FiFileText, FiEdit, FiCalendar } from "react-icons/fi";

const profileItems = [
  { href: "/profilim", icon: <FiUser />, label: "Profil Sayfası" },
  { href: "/profilim/favori-kararlar", icon: <FiStar />, label: "Favori Kararlar" },
  { href: "/profilim/favori-mevzuat", icon: <FiBookOpen />, label: "Favori Mevzuat" },
  { href: "/profilim/favori-makaleler", icon: <FiFileText />, label: "Favori Makaleler" },
  { href: "/profilim/notlarim", icon: <FiEdit />, label: "Notlarım" },
  { href: "/profilim/gorevlerim", icon: <FiCalendar />, label: "Görevlerim" },
];

export default async function ProfileLayout({ children }) {
  // Sunucu tarafında oturum kontrolü
  const session = await getServerSession(authOptions);
  if (!session) {
    // Giriş yoksa profile altına erişimi engelle
    redirect("/auth/signin?callbackUrl=/profilim");
  }

  return (
    <main className="flex min-h-screen bg-[#001f3f] text-gray-100">
      <Sidebar items={profileItems} session={session} />
      <section className="flex-1 p-8 bg-gradient-to-br from-[#002c4b] via-[#003a66] to-[#e2e8f0]">
        {children}
      </section>
    </main>
  );
}