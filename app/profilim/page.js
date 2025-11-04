import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { getActivePlanForUser, getOrCreateUsageWeek, currentWeekKey } from "@/lib/quota";

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

// Kullanıcının haftalık analiz/dilekçe kotasını ve kullanımını getir
async function getQuotaData(userId) {
  const weekKey = currentWeekKey();
  const [{ limits, planCode }, usage] = await Promise.all([
    getActivePlanForUser(userId),
    getOrCreateUsageWeek(userId, weekKey),
  ]);

  const analysisLimit = limits?.analysisPerWeek ?? 0;
  const dilekceLimit = limits?.dilekcePerWeek ?? 0;
  const analysisUsed = usage?.analysisUsed ?? 0;
  const dilekceUsed = usage?.dilekceUsed ?? 0;

  return {
    planCode: planCode || "NONE",
    weekKey,
    analysis: {
      used: analysisUsed,
      limit: analysisLimit,
      remaining: Math.max(0, analysisLimit - analysisUsed),
    },
    dilekce: {
      used: dilekceUsed,
      limit: dilekceLimit,
      remaining: Math.max(0, dilekceLimit - dilekceUsed),
    },
  };
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

  const avatarSrc = getSafeImageSrc(session?.user?.image);

  const quota = await getQuotaData(userId);

  const { favoriKararlarCount, favoriMevzuatlarCount, favoriMakalelerCount, registrationDate } = await getUserData(userId);

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
                {session?.user?.name || "Kullanıcı"}
              </h1>
              <p className="text-gray-200 mt-1">{session?.user?.email || ""}</p>
            </div>
          </div>

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 mb-12">
            {/* Favori Kararlar */}
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-md">
              <p className="text-gray-200 text-sm">Favori Kararlar</p>
              <p className="text-2xl font-bold text-white mt-2">{favoriKararlarCount}</p>
            </div>

            {/* Favori Makaleler */}
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-md">
              <p className="text-gray-200 text-sm">Favori Makaleler</p>
              <p className="text-2xl font-bold text-white mt-2">{favoriMakalelerCount}</p>
            </div>

            {/* Analiz Hakkı */}
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-md">
              <p className="text-gray-200 text-sm">Yaptırılan Analiz </p>
              <p className="text-2xl font-bold text-white mt-2">
                {quota.analysis.used} 
              </p>
              <p className="text-xs text-gray-200 mt-2">
                Kalan Hak: <span className="font-semibold text-white">{quota.analysis.remaining}</span>
              </p>
            </div>

            {/* Dilekçe Hakkı */}
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-md">
              <p className="text-gray-200 text-sm">Yazdırılan Dilekçe </p>
              <p className="text-2xl font-bold text-white mt-2">
                {quota.dilekce.used} 
              </p>
              <p className="text-xs text-gray-200 mt-2">
                Kalan Hak: <span className="font-semibold text-white">{quota.dilekce.remaining}</span>
              </p>
            </div>

            {/* Plan Bilgisi */}
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-md lg:col-span-2">
              <p className="text-gray-200 text-sm">Plan</p>
              <p className="text-xl font-semibold text-white mt-1">{quota.planCode}</p>
              <p className="text-xs text-gray-200 mt-2">Hafta: {quota.weekKey}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}