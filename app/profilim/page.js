import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Kullanıcıya ait favori sayısı ve kayıt tarihini çeken fonksiyon
async function getUserData(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        favoriteKararlar: true,
        favoriteMevzuatlar: true,
        favoriteMakaleler: true,
      },
    });
    const favoriKararlarCount = user?.favoriteKararlar.length ?? 0;
    const favoriMevzuatlarCount = user?.favoriteMevzuatlar.length ?? 0;
    const favoriMakalelerCount = user?.favoriteMakaleler.length ?? 0;
    return {
      favoriKararlarCount,
      favoriMevzuatlarCount,
      favoriMakalelerCount,
      registrationDate: user?.createdAt ?? new Date(),
    };
  } catch (error) {
    console.error("Profil verileri çekilirken hata:", error);
    return {
      favoriKararlarCount: 0,
      favoriMevzuatlarCount: 0,
      favoriMakalelerCount: 0,
      registrationDate: new Date(),
    };
  }
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  let userId = session?.user?.id;
  if (!userId && session?.user?.email) {
    const userRecord = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = userRecord?.id;
  }
  if (!userId) {
    redirect("/");
  }

  const { favoriKararlarCount, favoriMevzuatlarCount, favoriMakalelerCount, registrationDate } = await getUserData(userId);

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-[#002c4b] via-[#003a66] to-[#2e8f0]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <main className="space-y-12">
          {/* Hero Bölgesi */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-md">
            <div className="relative">
              <Image
                src={session.user.image || "/default-avatar.png"}
                alt="Avatar"
                width={128}
                height={128}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
              />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">
                {session.user.name}
              </h1>
              <p className="text-gray-200 mt-1">{session.user.email}</p>
            </div>
          </div>

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8 mb-12">
            {/* Favori Kararlar */}
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-md">
              <p className="text-gray-200 text-sm">Favori Kararlarım</p>
              <p className="text-2xl font-bold text-white mt-2">
                {favoriKararlarCount}
              </p>
            </div>
            {/* Favori Makaleler */}
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-md">
              <p className="text-gray-200 text-sm">Favori Makalelerim</p>
              <p className="text-2xl font-bold text-white mt-2">
                {favoriMakalelerCount}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}