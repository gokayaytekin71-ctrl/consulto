import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function FavoriteMevzuatPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }
  const favorites = await prisma.favoriteMevzuat.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const enriched = await Promise.all(
    favorites.map(async (fav) => {
      // Fetch the related statute record
      const statute = await prisma.mevzuat.findUnique({
        where: { key: fav.mevzuatKey },
      });

      // The content field is a plain string containing the full statute text
      let text = "";
      let articleTitle = "";
      if (statute?.content) {
        try {
          const contentJson = JSON.parse(statute.content);
          // Navigate into books -> sections -> articles
          let found = "";
          // contentJson might have top-level keys; search all nested objects for matching maddeNo
          function search(obj) {
            for (const [k, v] of Object.entries(obj)) {
              if (k === String(fav.maddeNo) && v?.metin) {
                found = v.metin;
                articleTitle = v.baslik || "";
                return true;
              }
              if (v && typeof v === "object") {
                if (search(v)) return true;
              }
            }
            return false;
          }
          search(contentJson);
          text = found;
        } catch (e) {
          console.error("JSON parse error", e);
          text = "";
        }
      }

      return {
        ...fav,
        name: statute?.name || fav.mevzuatKey,
        articleTitle,
        text,
      };
    })
  );

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-semibold text-white mb-6 border-l-4 border-orange-500 pl-3">
        Favori Kanun Maddeleriniz
      </h1>
      {enriched.length === 0 ? (
        <p className="text-white opacity-70 mb-6">
          Henüz favorilerinize kanun maddesi eklemediniz.
        </p>
      ) : (
        <ul>
          {enriched.map((fav) => (
            <li key={fav.id} className="bg-[#1f2a3a] rounded-xl p-6 mb-6 border-l-4 border-cyan-500 shadow-md">
              <div className="flex items-baseline space-x-4 mb-4">
                <h3 className="text-lg font-semibold text-cyan-400">{fav.name}</h3>
                {fav.articleTitle && (
                  <h2 className="text-xl font-bold text-white">{fav.articleTitle}</h2>
                )}
              </div>
              <p className="text-gray-300 mt-2">{fav.text}</p>
              <div className="mt-4 text-right">
                <Link
                  href={`/mevzuat/${encodeURIComponent(fav.mevzuatKey)}`}
                  className="inline-block text-sm text-cyan-400 font-medium hover:underline"
                >
                  Mevzuata git →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}