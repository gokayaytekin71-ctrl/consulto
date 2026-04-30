"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession, signIn } from "next-auth/react";
import { StarIcon as SolidStarIcon } from "@heroicons/react/24/solid";
import { StarIcon as OutlineStarIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function FavoriteButton({
  itemId,                   // Karar ID'si veya Mevzuat Key'i
  itemType,                 // "karar" veya "mevzuat"
  // initialIsFavorited prop'unu kaldırdık çünkü artık statik sayfadan gelmeyecek
  mevzuatMaddeNo = null,    
  className = "p-1.5 rounded-full text-yellow-500 hover:bg-yellow-500/10 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2",
  iconSize = "h-6 w-6",      
  onSuccess                  
}) {
  const { data: session, status } = useSession();
  const [isFavorited, setIsFavorited] = useState(false); // Varsayılan olarak false
  const [isLoadingInitialState, setIsLoadingInitialState] = useState(false); // İlk yükleme state'i
  const [isPending, startTransition] = useTransition(); 
  const [error, setError] = useState(null);

  // Component yüklendiğinde ve kullanıcı giriş yapmışsa favori durumunu kontrol et
  useEffect(() => {
    async function checkFavoriteStatus() {
      if (status !== "authenticated" || !itemId) return;

      setIsLoadingInitialState(true);
      try {
        // Not: Mevcut bir endpoint'in varsa onu kullanmalısın. 
        // Yoksa basit bir GET endpoint'i yazman gerekecek (Aşağıda detayını vereceğim).
        let checkUrl = "";
        if (itemType === "karar") {
            checkUrl = `/api/favorites/check?type=karar&id=${itemId}`;
        } else if (itemType === "mevzuat") {
            checkUrl = `/api/favorites/check?type=mevzuat&id=${itemId}&madde=${mevzuatMaddeNo || ""}`;
        } else if (itemType === "makale") {
            checkUrl = `/api/favorites/check?type=makale&id=${itemId}`;
        }

        const res = await fetch(checkUrl);
        if (res.ok) {
          const data = await res.json();
          // API'nin favori durumunu nasıl döndürdüğüne göre burayı uyarla
          setIsFavorited(!!data.isFavorited); 
        }
      } catch (err) {
        console.error("Favori durumu kontrol edilemedi:", err);
      } finally {
        setIsLoadingInitialState(false);
      }
    }

    checkFavoriteStatus();
  }, [itemId, itemType, mevzuatMaddeNo, status]);


  const handleToggleFavorite = async () => {
    if (status === "unauthenticated") {
      signIn("google"); 
      return;
    }

    if (status === "loading" || isPending || isLoadingInitialState) {
      return; 
    }

    const optimisticNewState = !isFavorited;
    
    startTransition(async () => {
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
        setIsFavorited(!optimisticNewState);
      }
    });
  };

  // Kullanıcı giriş yapmamışsa buton hiç görünmesin
  if (status !== "authenticated") return null; 

  // İlk durum API'den çekilirken veya genel oturum yüklenirken bir "Skeleton/Loading" durumu göster
  if (status === "loading" || isLoadingInitialState) {
      return (
        <div className={`flex items-center justify-center ${className}`} title="Favori durumu kontrol ediliyor...">
             <ArrowPathIcon className={`${iconSize} text-gray-500 animate-spin opacity-50`} />
        </div>
      );
  }

  const IconToRender = isFavorited ? SolidStarIcon : OutlineStarIcon;

  return (
    <div className="relative inline-flex flex-col items-center">
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
      </button>
      {/* Hata mesajı kapsayıcının dışına taşmasın diye ufak bir düzenleme */}
      {error && <p className="text-[10px] text-red-500 mt-1 absolute top-full whitespace-nowrap">{error}</p>}
    </div>
  );
}