// /app/profilim/page.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { checkQuotaReadOnly } from "@/lib/quota";

export const dynamic = "force-dynamic";

// Güvenli avatar kaynağı üret (next/image hatalarını önler)
function getSafeImageSrc(val) {
  if (typeof val === "string") {
    const v = val.trim();
    if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/")) {
      return v;
    }
  }
  return "/default-avatar.png";
}

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
      email: user?.email ?? "",
      name: user?.name ?? "Kullanıcı",
      image: user?.image ?? null,
      id: user?.id ?? userId,
    };
  } catch (error) {
    console.error("Profil verileri çekilirken hata:", error);
    return {
      favoriKararlarCount: 0,
      favoriMevzuatlarCount: 0,
      favoriMakalelerCount: 0,
      registrationDate: new Date(),
      email: "",
      name: "Kullanıcı",
      image: null,
      id: userId,
    };
  }
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  // Session'daki id yoksa email'den DB id'sini bul
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

  // Kullanıcı + read-only quota snapshot (upsert YOK)
  const [userInfo, analysisQ, dilekceQ] = await Promise.all([
    getUserData(userId),
    checkQuotaReadOnly(userId, "analysis"),
    checkQuotaReadOnly(userId, "dilekce"),
  ]);

  const avatarSrc = getSafeImageSrc(userInfo.image ?? session?.user?.image);

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-[#002c4b] via-[#003a66] to-[#2e8f0]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <main className="space-y-12">
          {/* Hero Bölgesi */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-md">
            <div className="relative">
              <Image
                src={avatarSrc}
                alt="Avatar"
                width={128}
                height={128}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
              />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">
                {userInfo.name}
              </h1>
              <p className="text-gray-200 mt-1">{userInfo.email}</p>
            </div>
          </div>

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
            {/* Favori Kararlar */}
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-md">
              <p className="text-gray-200 text-sm">Favori Kararlarım</p>
              <p className="text-2xl font-bold text-white mt-2">
                {userInfo.favoriKararlarCount}
              </p>
            </div>

            {/* Favori Makaleler */}
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-md">
              <p className="text-gray-200 text-sm">Favori Makalelerim</p>
              <p className="text-2xl font-bold text-white mt-2">
                {userInfo.favoriMakalelerCount}
              </p>
            </div>

      
          </div>

          {/* Kota Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Analiz Kotası */}
            <div className="bg-white/10 border border-white/10 p-6 rounded-xl shadow-md">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl text-white font-semibold">Analiz Kotası</h2>
                <span className="text-xs text-gray-300">
                  Hafta: {analysisQ.weekKey} • Plan: {analysisQ.planCode}
                </span>
              </div>
              <div className="mt-3 text-gray-200">
                <p>Kullanılan: <span className="font-semibold">{analysisQ.usage?.analysisUsed ?? 0}</span></p>
                <p>Toplam Hak: <span className="font-semibold">{analysisQ.limit ?? 0}</span></p>
                <p>Kalan: <span className="font-semibold">{analysisQ.remaining ?? 0}</span></p>
              </div>
            </div>

            {/* Dilekçe Kotası */}
            <div className="bg-white/10 border border-white/10 p-6 rounded-xl shadow-md">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl text-white font-semibold">Dilekçe Kotası</h2>
                <span className="text-xs text-gray-300">
                  Hafta: {dilekceQ.weekKey} • Plan: {dilekceQ.planCode}
                </span>
              </div>
              <div className="mt-3 text-gray-200">
                <p>Kullanılan: <span className="font-semibold">{dilekceQ.usage?.dilekceUsed ?? 0}</span></p>
                <p>Toplam Hak: <span className="font-semibold">{dilekceQ.limit ?? 0}</span></p>
                <p>Kalan: <span className="font-semibold">{dilekceQ.remaining ?? 0}</span></p>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}