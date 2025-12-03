// /app/profilim/page.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link"; // Link eklendi
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// --- YARDIMCILAR ---
function getSafeImageSrc(val) {
  if (typeof val === "string") {
    const v = val.trim();
    if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/")) {
      return v;
    }
  }
  return "https://ui-avatars.com/api/?background=334155&color=fff&name=User";
}

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
    return {
      favoriKararlarCount: user?.favoriteKararlar.length ?? 0,
      favoriMevzuatlarCount: user?.favoriteMevzuatlar.length ?? 0,
      favoriMakalelerCount: user?.favoriteMakaleler.length ?? 0,
      registrationDate: user?.createdAt,
      email: user?.email ?? "",
      name: user?.name ?? "Kullanıcı",
      image: user?.image ?? null,
      id: user?.id ?? userId,
      role: user?.role || "Standart",
      tokenBalance: user?.tokenBalance ?? 0, // YENİ: Token Bakiyesi
    };
  } catch (error) {
    return {
      favoriKararlarCount: 0, favoriMevzuatlarCount: 0, favoriMakalelerCount: 0,
      registrationDate: new Date(), email: "", name: "Hata", image: null, id: userId, role: "Error",
      tokenBalance: 0
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

  // Sadece kullanıcı verisini çekiyoruz, artık kota hesaplaması yok
  const userInfo = await getUserData(userId);

  const avatarSrc = getSafeImageSrc(userInfo.image ?? session?.user?.image);
  
  const joinDate = userInfo.registrationDate 
    ? new Date(userInfo.registrationDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : "-";

  return (
    // ZEMİN: Slate-900 (Koyu ama siyah değil, yumuşak lacivert-gri)
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans py-10 px-4 md:px-8">
      
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- 1. HERO KARTI (Mat ve Modern) --- */}
        <section className="rounded-2xl bg-[#1e293b] border border-slate-700/50 p-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-8">
            
            {/* Avatar */}
            <div className="relative shrink-0">
               <div className="h-28 w-28 rounded-full p-1 bg-slate-800 ring-2 ring-slate-600 overflow-hidden">
                 <Image
                   src={avatarSrc}
                   alt={userInfo.name}
                   fill
                   className="object-cover rounded-full"
                 />
               </div>
            </div>

            {/* Bilgiler */}
            <div className="text-center md:text-left flex-1 space-y-2">
               <div>
                 <h1 className="text-3xl font-bold text-white tracking-tight">{userInfo.name}</h1>
                 <p className="text-slate-400 font-medium">{userInfo.email}</p>
               </div>
               
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                 <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#002a5c] text-blue-100 text-xs font-semibold border border-blue-900">
                    {userInfo.role === "admin" ? "Yönetici" : "Üye"}
                 </span>
                 <span className="inline-flex items-center px-3 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">
                    Kayıt: {joinDate}
                 </span>
                
               </div>
            </div>
          </div>
        </section>

        {/* --- 2. TOKEN CÜZDANI (YENİ BÖLÜM) --- */}
        <section className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 rounded-xl border border-cyan-500/20 shadow-lg overflow-hidden">
           <div className="px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
              
              <div className="flex items-center gap-4">
                 <div className="h-16 w-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-white">Token Bakiyesi</h2>
                    <p className="text-sm text-slate-400">Analiz ve dilekçe oluşturmak için kullanılır.</p>
                 </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6">
                 <div className="text-center md:text-right">
                    <span className="block text-4xl font-mono font-bold text-white tracking-tight">
                       {userInfo.tokenBalance}
                    </span>
                    <span className="text-xs text-cyan-400 font-bold tracking-widest uppercase">MEVCUT KREDİ</span>
                 </div>
                 
                 <Link 
                    href="/paketler-ucretler" 
                    className="group relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-bold text-white rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-900/30 transition-all duration-300"
                 >
                    <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                    <span className="relative flex items-center gap-2">
                       Token Yükle 
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </span>
                 </Link>
              </div>

           </div>
        </section>

        {/* --- 3. İSTATİSTİK KARTLARI --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           
           {/* Kart 1 */}
           <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-700/50 shadow-md hover:border-blue-500/30 transition-colors group">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wide group-hover:text-slate-300 transition-colors">Favori Kararlar</p>
                    <p className="text-3xl font-bold text-white mt-2">{userInfo.favoriKararlarCount}</p>
                 </div>
                 <div className="p-3 rounded-lg bg-slate-800 text-blue-400 group-hover:bg-blue-500/10 group-hover:text-blue-300 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                 </div>
              </div>
           </div>

           {/* Kart 2 */}
           <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-700/50 shadow-md hover:border-amber-500/30 transition-colors group">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wide group-hover:text-slate-300 transition-colors">Favori Makaleler</p>
                    <p className="text-3xl font-bold text-white mt-2">{userInfo.favoriMakalelerCount}</p>
                 </div>
                 <div className="p-3 rounded-lg bg-slate-800 text-amber-400 group-hover:bg-amber-500/10 group-hover:text-amber-300 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}