"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession, signIn } from "next-auth/react";
import { StarIcon as SolidStarIcon } from "@heroicons/react/24/solid";
import { StarIcon as OutlineStarIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/outline"; // Yükleme ikonu için outline daha uygun olabilir

export default function FavoriteButton({
  itemId,                   // Karar ID'si veya Mevzuat Key'i
  itemType,                 // "karar" veya "mevzuat"
  initialIsFavorited,       // Sayfa yüklenirkenki favori durumu
  mevzuatMaddeNo = null,    // Sadece itemType="mevzuat" ise kullanılır
  className = "p-1.5 rounded-full text-yellow-500 hover:bg-yellow-500/10 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2", // Dışarıdan stil alabilmesi için
  iconSize = "h-6 w-6",      // İkon boyutunu prop olarak alalım
  onSuccess                  // onSuccess callback prop
}) {
  const { data: session, status } = useSession();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isPending, startTransition] = useTransition(); // İsteğe bağlı: Optimistic update için
  const [error, setError] = useState(null);

  // initialIsFavorited prop'u değiştiğinde state'i güncelle
  useEffect(() => {
    setIsFavorited(initialIsFavorited);
  }, [initialIsFavorited]);

  const handleToggleFavorite = async () => {
    if (status === "unauthenticated") {
      // Kullanıcı giriş yapmamışsa, giriş yapmaya yönlendir (opsiyonel)
      signIn("google"); // Veya genel signIn()
      return;
    }

    if (status === "loading" || isPending) {
      return; // Eğer oturum yükleniyorsa veya zaten bir işlem varsa bir şey yapma
    }

    const optimisticNewState = !isFavorited;
    
    startTransition(async () => {
      // Önce UI'ı anında güncelle (Optimistic Update)
      setIsFavorited(optimisticNewState);
      setError(null);

      const url =
        itemType === "mevzuat"
          ? "/api/favorites/mevzuat"
          : itemType === "makale"
          ? "/api/favorites/makale"
          : "/api/favorites/karar";
      
      const body =
        itemType === "mevzuat"
          ? { mevzuatKey: itemId, maddeNo: mevzuatMaddeNo }
          : itemType === "makale"
          ? { itemId }
          : { kararId: itemId };

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Bir hata oluştu.");
        }

        // API returns { added: true } or { removed: true }
        const newFavoritedState = data.hasOwnProperty("isFavorited")
          ? data.isFavorited
          : data.added
          ? true
          : data.removed
          ? false
          : optimisticNewState;
        setIsFavorited(newFavoritedState);
        if (typeof onSuccess === "function") {
          onSuccess({ isFavorited: newFavoritedState });
        }

      } catch (err) {
        console.error("Favori toggle API hatası:", err);
        setError(err.message);
        // Hata durumunda UI'ı eski haline geri döndür
        setIsFavorited(!optimisticNewState);
      }
    });
  };

  // Oturum yükleniyorsa veya kullanıcı giriş yapmamışsa (veya belirli bir durumda gizlemek istiyorsak)
  // null döndürmek yerine, butonu pasif (disabled) gösterebilir veya bir placeholder gösterebiliriz.
  // Senin kodundaki gibi null döndürmek de bir tercih. Şimdilik pasif yapalım.
  // if (status !== "authenticated") {
  //   return (
  //     <button className={`${className} cursor-not-allowed opacity-50`} title="Favorilere eklemek için giriş yapın" disabled>
  //       <OutlineHeartIcon className={iconSize} />
  //     </button>
  //   );
  // }
  // Senin kodundaki gibi null dönelim şimdilik, bu sayede buton hiç görünmez.
  if (status !== "authenticated" && !initialIsFavorited) return null; 
  // Eğer favorilerdeyse ve kullanıcı çıkış yapmışsa bile butonu gösterelim (kaldırabilsin diye değil, sadece UI tutarlılığı için veya login'e yönlendirmek için)
  // Bu kısım UX tercihine göre değişebilir. En basit hali:
  if (status === "loading") {
      return <div className={`${iconSize} ${className} bg-gray-200 rounded-full animate-pulse`} />;
  }


  const IconToRender = isFavorited ? SolidStarIcon : OutlineStarIcon;

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isPending || status !== "authenticated"}
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
      title={isFavorited ? "Favorilerden Kaldır" : "Favorilere Ekle"}
      aria-pressed={isFavorited}
    >
      {isPending ? (
        <ArrowPathIcon className={`${iconSize} animate-spin`} />
      ) : (
        <IconToRender className={iconSize} />
      )}
      {error && <p className="text-xs text-red-500 mt-1 absolute -bottom-4 whitespace-nowrap">{error}</p>}
    </button>
  );
}