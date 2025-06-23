// app/profilim/layout.jsx
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

export default async function ProfileLayout({ children }) {
  // Sunucu tarafında oturum kontrolü
  const session = await getServerSession(authOptions);
  if (!session) {
    // Giriş yoksa profile altına erişimi engelle
    redirect("/auth/signin?callbackUrl=/profilim");
  }

  return (
    <main className="flex min-h-screen bg-[#001f3f] text-gray-100">
      {/* Yan Menü */}
      <aside className="w-72 bg-[#0f1a2b] text-white p-6 border-r border-gray-800 shadow-xl">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-700">
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt="Profil Resmi"
              width={60}
              height={60}
              className="rounded-full border-2 border-orange-500"
            />
          )}
          <div className="flex-1">
            <h2 className="font-bold text-lg truncate">
              {session.user.name}
            </h2>
            <p className="text-sm truncate text-gray-300">
              {session.user.email}
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <Link href="/profilim" className="nav-link">
            Profil Sayfası
          </Link>
          <Link href="/profilim/favori-kararlar" className="nav-link">
            Favori Kararlar
          </Link>
          <Link href="/profilim/favori-mevzuat" className="nav-link">
            Favori Mevzuat
          </Link>
          <Link href="/profilim/favori-makaleler" className="nav-link">
            Favori Makaleler
          </Link>
          <Link href="/profilim/yazilarim" className="nav-link">
            Yazılarım
          </Link>
          <Link href="/profilim/notlarim" className="nav-link">
            Notlarım
          </Link>
          <Link href="/profilim/dilekcelerim" className="nav-link">
            Dilekçelerim
          </Link>
          <Link href="/profilim/gorevlerim" className="nav-link">
            Görevlerim
          </Link>
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-700">
          <SignOutButton />
        </div>
      </aside>

      {/* Ana İçerik */}
      <section className="flex-1 p-8 bg-gradient-to-br from-[#002c4b] via-[#003a66] to-[#e2e8f0]">
        {children}
      </section>
    </main>
  );
}