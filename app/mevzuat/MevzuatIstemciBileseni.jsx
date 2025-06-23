"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
// LÜTFEN BU YOLU KONTROL EDİP GEREKİRSE DÜZELTİN:
import FavoriteButton from "@/components/FavoriteButton"; // Örnek: proje kökünde components klasörü varsa

// Referans numaralarını temizlemek için yardımcı fonksiyon
function temizleReferanslari(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\[\d+\]/g, '').trim();
}

// --- YARDIMCI FONKSİYONLAR ---
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const ordinalMap = {
  "BİRİNCİ": 1, "İKİNCİ": 2, "ÜÇÜNCÜ": 3, "DÖRDÜNCÜ": 4, "BEŞİNCİ": 5,
  "ALTINCI": 6, "YEDİNCİ": 7, "SEKİZİNCİ": 8, "DOKUZUNCU": 9, "ONUNCU": 10,
  "ONBİRİNCİ": 11, "ONİKİNCİ": 12, "ONÜÇÜNCÜ": 13, "ONDÖRDÜNCÜ": 14, "ONBEŞİNCİ": 15,
  "ONALTINCI": 16, "ONYEDİNCİ": 17, "ONSEKİZİNCİ": 18, "ONDOKUZUNCU": 19, "YİRMİNCİ": 20,
};

function sortNavigationKeys(keys) {
  if (!Array.isArray(keys)) { return []; }
  const getSortValues = (keyStr) => {
    if (typeof keyStr !== 'string') { return { typeClass: 99, ordinal: Infinity, num: NaN, original: String(keyStr) }; }
    const keyUpper = keyStr.toUpperCase();
    if (keyUpper === "MADDELER") return { typeClass: 0, ordinal: -1, num: NaN, original: keyStr };
    let typeClass = 8; let ordinal = Infinity; let num = NaN;
    const parts = keyUpper.split(" ");
    if (parts.length > 0 && ordinalMap[parts[0]] !== undefined) {
      ordinal = ordinalMap[parts[0]];
      if (parts.includes("KİTAP")) typeClass = 1;
      else if (parts.includes("KISIM")) typeClass = 2;
      else if (parts.includes("BÖLÜM")) typeClass = 3;
      else if (parts.includes("AYIRIM")) typeClass = 4;
      else typeClass = 5; 
    } else {
      if (keyUpper.startsWith("EK ")) { typeClass = 6; num = parseInt(keyStr.substring(3), 10); }
      else if (keyUpper.startsWith("GEÇİCİ ")) { typeClass = 7; num = parseInt(keyStr.substring(8), 10); }
      else { const match = keyStr.match(/^(\d+)/); if (match) { typeClass = 5; num = parseInt(match[0], 10); } }
      ordinal = isNaN(num) ? Infinity : num;
    }
    return { typeClass, ordinal, num: isNaN(num) ? Infinity : num, original: keyStr };
  };
  try {
    return [...keys].sort((a, b) => {
      const itemA = getSortValues(a); const itemB = getSortValues(b);
      if (itemA.typeClass !== itemB.typeClass) return itemA.typeClass - itemB.typeClass;
      if (itemA.ordinal !== itemB.ordinal) return itemA.ordinal - itemB.ordinal;
      if (!isNaN(itemA.num) && !isNaN(itemB.num) && itemA.num !== itemB.num) return itemA.num - itemB.num;
      return itemA.original.localeCompare(itemB.original, 'tr', { sensitivity: 'base' });
    });
  } catch (error) {
    console.error("sortNavigationKeys HATASI:", error);
    return Array.isArray(keys) ? [...keys] : [];
  }
}

// --- FAVORİLER İÇİN ÖZEL HOOK ---
function useUserFavoriteMevzuatlar() {
    const { data: session, status } = useSession();
    const [favoriteMevzuatlar, setFavoriteMevzuatlar] = useState([]);
    const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            setIsLoadingFavorites(true);
            fetch('/api/favorites/mevzuat')
                .then(res => {
                    if (!res.ok) throw new Error("Favoriler çekilemedi: " + res.statusText);
                    return res.json();
                })
                .then(data => {
                    if (Array.isArray(data)) setFavoriteMevzuatlar(data);
                    else setFavoriteMevzuatlar([]);
                })
                .catch(error => {
                    console.error("Favori mevzuatları çekerken hata:", error);
                    setFavoriteMevzuatlar([]);
                })
                .finally(() => setIsLoadingFavorites(false));
        } else if (status === "unauthenticated") {
            setFavoriteMevzuatlar([]);
            setIsLoadingFavorites(false);
        } else if (status === "loading") {
            setIsLoadingFavorites(true); 
        }
    }, [session, status]);

    const isMaddeFavorited = (mevzuatKey, maddeNo) => {
      if (isLoadingFavorites || status !== "authenticated") return false;
      return favoriteMevzuatlar.some(fav => fav.mevzuatKey === mevzuatKey && fav.maddeNo === (maddeNo || null));
    };
    
    return { favoriteMevzuatlar, isLoadingFavorites, isMaddeFavorited };
}

// --- NAVIGATION KOMPONENTİ ---
function Navigation({ 
    displayName, 
    content, 
    selected, 
    onSelectMadde,
    anaMevzuatKey,
    isMaddeFavorited,
    isLoadingFavorites
}) {
  const [open, setOpen] = useState({ baslangic: true, kitap: {}, kisim: {}, bolum: {}, ayrim: {} });
  const { data: session, status: navStatus } = useSession();

  const Item = ({ type, label, active, onClick, hasChildren, isOpen, children }) => {
    const base = "cursor-pointer transition-colors group";
    const indentClasses = { kitap: "py-2 text-lg font-bold", kisim: "py-2 text-base font-semibold", bolum: "py-1 pl-8 text-sm", ayrim: "py-1 pl-10 text-sm italic", madde: "py-1 text-sm pl-12" };
    const indent = indentClasses[type] || "py-1 pl-4 text-sm";
    const activeStyles = active ? "bg-[#004365] text-white font-semibold shadow-inner" : "text-[#F5F5DC] hover:bg-[#003052] hover:text-white";
    
    return ( 
      <div className={classNames(base, indent, activeStyles, "flex items-center justify-between px-3 py-1.5")}>
        <div onClick={onClick} className="flex-grow mr-2 truncate">
          {hasChildren ? (
            <div className="flex justify-between items-center">
              <span>{label}</span>
              <span className="text-xs opacity-80 group-hover:opacity-100">{isOpen ? "▾" : "▸"}</span>
            </div>
          ) : (label)}
        </div>
        {children && navStatus === "authenticated" && !isLoadingFavorites && (
             <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {children}
             </div>
        )}
      </div> 
    );
  };

  const renderHiyerarsikMaddeler = (maddelerObj, path) => {
    return renderMaddeler(maddelerObj, { ...path, mevzuatKey: anaMevzuatKey });
  };

  const renderMaddeler = (maddelerObj, path) => {
    if (!maddelerObj || typeof maddelerObj !== 'object' || Object.keys(maddelerObj).length === 0) return null;
    const sortedMaddeKeys = sortNavigationKeys(Object.keys(maddelerObj));
    
    return sortedMaddeKeys.map((maddeKey) => {
      const maddeVal = maddelerObj[maddeKey];
      if (!maddeVal || typeof maddeVal.metin === 'undefined') { return null; }
      const currentMevzuatKeyForMadde = path.mevzuatKey || anaMevzuatKey;
      const uniqueKey = `madde-${currentMevzuatKeyForMadde}-${path.kitap || 'nk'}-${path.kisim || 'ns'}-${path.bolum || 'nb'}-${path.ayrim || 'na'}-${path.baslangic ? 'bas-' : ''}${maddeKey}`;
      const temizlenmisMaddeBasligi = temizleReferanslari(maddeVal.baslik);

      return (
        <Item 
            key={uniqueKey} 
            type="madde" 
            active={selected?.mevzuatKey === currentMevzuatKeyForMadde && selected?.baslangic === path.baslangic && selected?.kitap === path.kitap && selected?.kisim === path.kisim && selected?.bolum === path.bolum && selected?.ayrim === path.ayrim && selected?.madde === maddeKey } 
            onClick={() => onSelectMadde({ ...path, madde: maddeKey, maddeVal, mevzuatKey: currentMevzuatKeyForMadde })} 
            label={ <span> Madde {maddeKey} {temizlenmisMaddeBasligi && <span className="ml-2 text-xs text-[#B0BEC5] font-normal italic">{temizlenmisMaddeBasligi}</span>} </span> }
        >
            {typeof FavoriteButton === 'function' && ( // Guard against undefined FavoriteButton
              <FavoriteButton
                  itemId={currentMevzuatKeyForMadde}
                  itemType="mevzuat"
                  mevzuatMaddeNo={maddeKey}
                  initialIsFavorited={isMaddeFavorited(currentMevzuatKeyForMadde, maddeKey)}
              />
            )}
        </Item>
      );
    });
  };
  
  const renderHiyerarsi = (key, value, type, currentPath) => {
    if (!value || typeof value !== 'object') return null;
    const { kitap, kisim, bolum } = currentPath;
    const uniqueKeyPart = `${anaMevzuatKey}-${kitap || 'nk'}-${kisim || 'ns'}-${bolum || 'nb'}-${key}`;
    const stateKey = type === 'kitap' ? 'kitap' : type === 'kisim' ? 'kisim' : type === 'bolum' ? 'bolum' : 'ayrim';
    const isOpen = open[stateKey] && open[stateKey][uniqueKeyPart];

    let hasDirectMaddeler = value.maddeler && typeof value.maddeler === 'object' && Object.keys(value.maddeler).length > 0;
    let hasChildren = hasDirectMaddeler;
    let childRenderer = null;
    const newPath = { ...currentPath, [type]: key, mevzuatKey: anaMevzuatKey };

    if (type === 'kitap') {
        hasChildren = hasChildren || (value.kisimlar && Object.keys(value.kisimlar).length > 0);
        childRenderer = () => value.kisimlar && sortNavigationKeys(Object.keys(value.kisimlar)).map(kisimKey => renderHiyerarsi(kisimKey, value.kisimlar[kisimKey], 'kisim', newPath));
    } else if (type === 'kisim') {
        hasChildren = hasChildren || (value.bolumler && Object.keys(value.bolumler).length > 0);
        childRenderer = () => value.bolumler && sortNavigationKeys(Object.keys(value.bolumler)).map(bolumKey => renderHiyerarsi(bolumKey, value.bolumler[bolumKey], 'bolum', newPath));
    } else if (type === 'bolum') {
        hasChildren = hasChildren || (value.ayrimlar && Object.keys(value.ayrimlar).length > 0);
        childRenderer = () => value.ayrimlar && sortNavigationKeys(Object.keys(value.ayrimlar)).map(ayrimKey => renderHiyerarsi(ayrimKey, value.ayrimlar[ayrimKey], 'ayrim', newPath));
    }
    
    const temizlenmisHiyerarsiKey = temizleReferanslari(key);
    const temizlenmisHiyerarsiBaslik = temizleReferanslari(value.baslik);

    return (
        <div key={`${type}-${uniqueKeyPart}`}>
            <Item 
                type={type} 
                label={temizlenmisHiyerarsiKey}
                active={isOpen && !hasChildren && selected?.[type] === key && selected?.kitap === kitap && selected?.kisim === kisim && selected?.bolum === bolum && selected?.mevzuatKey === anaMevzuatKey}
                onClick={() => setOpen(prev => ({ ...prev, [stateKey]: { ...prev[stateKey], [uniqueKeyPart]: !isOpen } }))}
                hasChildren={hasChildren} 
                isOpen={isOpen}
            />
            {temizlenmisHiyerarsiBaslik && ( <div className={`pl-${type==='kitap' ? 7 : type==='kisim' ? 7 : type==='bolum' ? 9 : 11} pr-6 pt-0 pb-1 text-xs text-[#CFD8DC] italic -mt-1`}>{temizlenmisHiyerarsiBaslik}</div> )}
            {isOpen && (
                <div className={`ml-2 font-${type==='kitap' ? 'sans' : 'serif'}`}>
                    {childRenderer && childRenderer()}
                    {hasDirectMaddeler && renderHiyerarsikMaddeler(value.maddeler, newPath)}
                </div>
            )}
        </div>
    );
  };

  const finalNavigationItems = [];
  try {
    if (content && typeof content === 'object' && Object.keys(content).length > 0) {
      const allTopKeysUnsorted = Object.keys(content);
      const baslangicMaddelerKey = "maddeler";

      if (allTopKeysUnsorted.includes(baslangicMaddelerKey)) {
        const topValue = content[baslangicMaddelerKey];
        if (typeof topValue === 'object' && topValue !== null && Object.keys(topValue).length > 0) {
          const baslangicLabel = "BAŞLANGIÇ HÜKÜMLERİ";
          finalNavigationItems.push(
            <div key="baslangic-maddeler-container">
              <Item type="kisim" label={baslangicLabel} onClick={() => setOpen(prev => ({ ...prev, baslangic: !prev.baslangic }))} hasChildren={true} isOpen={open.baslangic} active={false} />
              {open.baslangic && (
                <div className="ml-2 font-serif">
                  {renderHiyerarsikMaddeler(topValue, { baslangic: true, mevzuatKey: anaMevzuatKey })}
                </div>
              )}
            </div>
          );
        }
      }

      const otherTopKeysSorted = sortNavigationKeys(allTopKeysUnsorted.filter(key => key !== baslangicMaddelerKey));
      otherTopKeysSorted.forEach((topKey) => {
        const topValue = content[topKey];
        if(!topValue || typeof topValue !== 'object') return;
        
        let type = '';
        if (topValue.kisimlar || (topValue.baslik && topKey.toUpperCase().includes("KİTAP")) || (topKey.toUpperCase().includes("KİTAP") && topValue.maddeler) ) type = 'kitap';
        else if (topValue.bolumler || (topValue.baslik && topKey.toUpperCase().includes("KISIM")) || (topValue.maddeler && !topValue.kisimlar && !topValue.bolumler && !topValue.ayrimlar && !topKey.toUpperCase().includes("KİTAP")) ) type = 'kisim';
        else if (topValue.ayrimlar || (topValue.baslik && topKey.toUpperCase().includes("BÖLÜM")) || (topValue.maddeler && !topValue.kisimlar && !topValue.bolumler && !topValue.ayrimlar && !topKey.toUpperCase().includes("KISIM"))) type = 'bolum';
        else if (topValue.maddeler || (topValue.baslik && topKey.toUpperCase().includes("AYIRIM"))) type = 'ayrim';
        else if (topValue.maddeler && Object.keys(topValue.maddeler).length > 0 && !type) {
            type = 'bolum'; 
        }

        if (type) {
            finalNavigationItems.push(renderHiyerarsi(topKey, topValue, type, { mevzuatKey: anaMevzuatKey }));
        } else if (Object.keys(topValue).length > 0) { 
            console.warn(`Navigation: '${topKey}' için bilinen bir hiyerarşi tipi (kitap, kısım, bölüm, ayırım) bulunamadı. Alt öğeler:`, Object.keys(topValue));
             if (topValue.maddeler && typeof topValue.maddeler === 'object' && Object.keys(topValue.maddeler).length > 0) {
                finalNavigationItems.push(
                    <div key={`${topKey}-direct-maddeler`}>
                         <Item type="bolum" label={temizleReferanslari(topKey)} onClick={() => {}} hasChildren={true} isOpen={true} active={false} />
                         <div className="ml-2 font-serif">
                            {renderHiyerarsikMaddeler(topValue.maddeler, { [topKey]: true, mevzuatKey: anaMevzuatKey })}
                         </div>
                    </div>
                );
            }
        }
      });
    }
  } catch (e) { 
      console.error("Navigation render edilirken genel bir HATA oluştu:", e); 
      finalNavigationItems.push(<p key="error" className="px-6 text-red-400 italic">Navigasyon yüklenirken bir sorun oluştu.</p>); 
  }

  return ( 
    <aside className="w-96 bg-gradient-to-b from-[#001f3f] to-[#004365] text-[#F5F5DC] h-screen flex flex-col shadow-lg">
        <div className="px-6 py-5 border-b border-[#00253a]">
            <h1 className="text-2xl font-bold">{temizleReferanslari(displayName)}</h1>
        </div>
        <nav className="mt-4 font-sans flex-grow overflow-y-auto">
            {finalNavigationItems.length > 0 ? finalNavigationItems : <p className="px-6 text-sm text-gray-400 italic"> (Navigasyon için içerik bulunamadı) </p>}
        </nav>
    </aside>
  );
}

// --- BREADCRUMBS KOMPONENTİ ---
function Breadcrumbs({ selected, displayName }) {
  if (!selected) return null;
  const pathItems = [];
  if (displayName) pathItems.push(temizleReferanslari(displayName));
  if (selected.baslangic) pathItems.push("Başlangıç Hükümleri");
  if (selected.kitap) pathItems.push(temizleReferanslari(selected.kitap));
  if (selected.kisim) pathItems.push(temizleReferanslari(selected.kisim));
  if (selected.bolum) pathItems.push(temizleReferanslari(selected.bolum));
  if (selected.ayrim) pathItems.push(temizleReferanslari(selected.ayrim));
  if (selected.madde) pathItems.push(`Madde ${selected.madde}`);

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-600">
      <ol className="flex items-center space-x-1 flex-wrap">
        <li>
          <Link href="/mevzuat" className="hover:underline text-blue-600">Mevzuatlar</Link>
        </li>
        {pathItems.map((item, index) => (
          <li key={index} className="flex items-center">
            <svg className="h-5 w-5 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
            </svg>
            {index === pathItems.length - 1 ? (
              <span className="font-semibold text-gray-800">{item}</span>
            ) : (
              <span>{item}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// --- ANA SAYFA KOMPONENTİ (Artık İstemci Bileşeni) ---
export default function MevzuatIstemciBileseni({ displayName, content: rawContent, anaMevzuatKey }) {
  const { favoriteMevzuatlar, isLoadingFavorites, isMaddeFavorited } = useUserFavoriteMevzuatlar();
  const { data: session, status: pageStatus } = useSession();

  const [selectedMadde, setSelectedMadde] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const content = useMemo(() => {
    if (rawContent && typeof rawContent.kanun_icerigi === 'object' && Object.keys(rawContent.kanun_icerigi).length > 0) {
      return rawContent.kanun_icerigi;
    }
    return rawContent || {};
  }, [rawContent]);


  useEffect(() => {
    if (!content || Object.keys(content).length === 0) { 
        if (rawContent && Object.keys(rawContent).length > 0) {
            console.warn(`[MevzuatIstemciBileseni] '${displayName}' (${anaMevzuatKey}) için 'content' işlenemedi veya beklenen yapıda değil. Ham içerik:`, rawContent);
        } else {
            console.warn(`[MevzuatIstemciBileseni] '${displayName}' (${anaMevzuatKey}) için 'content' BOŞ veya tanımsız.`); 
        }
    }
  }, [content, rawContent, displayName, anaMevzuatKey]);
  
  const allMaddeler = useMemo(() => {
    const list = [];
    if (!content || typeof content !== "object" || Object.keys(content).length === 0) return list;
    
    function findMaddelerRecursive(currentObject, currentPath) {
      if (!currentObject || typeof currentObject !== 'object') return;

      if (currentObject.maddeler && typeof currentObject.maddeler === 'object') {
        const sortedMaddeKeys = sortNavigationKeys(Object.keys(currentObject.maddeler));
        for (const maddeKey of sortedMaddeKeys) {
          const maddeVal = currentObject.maddeler[maddeKey];
          if (maddeVal && typeof maddeVal.metin !== 'undefined') {
            list.push({ ...currentPath, madde: maddeKey, maddeVal, mevzuatKey: anaMevzuatKey });
          }
        }
      }
      
      const childCollectionMap = { kisimlar: "kisim", bolumler: "bolum", ayrimlar: "ayrim" };
      const sortedStructuralKeys = sortNavigationKeys(Object.keys(currentObject));

      for (const childKey of sortedStructuralKeys) {
        if (childKey === "maddeler" || childKey === "baslik") continue;
        const collectionName = childCollectionMap[childKey];
        if (collectionName && currentObject[childKey] && typeof currentObject[childKey] === 'object') {
          const actualCollectionObject = currentObject[childKey];
          const sortedChildItemKeys = sortNavigationKeys(Object.keys(actualCollectionObject));
          for (const childItemKey of sortedChildItemKeys) {
            const childItemValue = actualCollectionObject[childItemKey];
            findMaddelerRecursive(childItemValue, { ...currentPath, [collectionName]: childItemKey, mevzuatKey: anaMevzuatKey });
          }
        }
      }
    }

    const allTopKeys = Object.keys(content);
    if (allTopKeys.includes("maddeler")) {
        const topValue = content["maddeler"];
        if (typeof topValue === 'object' && topValue !== null) {
            const sortedMaddeKeysInBaslangic = sortNavigationKeys(Object.keys(topValue));
            for (const maddeKey of sortedMaddeKeysInBaslangic) { 
                if (topValue[maddeKey] && typeof topValue[maddeKey].metin !== 'undefined') { 
                    list.push({ baslangic: true, madde: maddeKey, maddeVal: topValue[maddeKey], mevzuatKey: anaMevzuatKey }); 
                }
            }
        }
    }
    const otherTopKeysSorted = sortNavigationKeys(allTopKeys.filter(k => k !== "maddeler"));
    for (const topKey of otherTopKeysSorted) {
      const topValue = content[topKey];
      if(!topValue || typeof topValue !== 'object') continue;
      let initialPath = { mevzuatKey: anaMevzuatKey };
      if (topValue.kisimlar || (topValue.baslik && topKey.toUpperCase().includes("KİTAP")) || (topKey.toUpperCase().includes("KİTAP") && topValue.maddeler)) initialPath = { ...initialPath, kitap: topKey };
      else if (topValue.bolumler || (topValue.baslik && topKey.toUpperCase().includes("KISIM")) || (topValue.maddeler && !topValue.kisimlar)) initialPath = { ...initialPath, kisim: topKey };
      else if (topValue.ayrimlar || (topValue.baslik && topKey.toUpperCase().includes("BÖLÜM")) || (topValue.maddeler && !topValue.kisimlar && !topValue.bolumler)) initialPath = { ...initialPath, bolum: topKey };
      else if (topValue.maddeler || (topValue.baslik && topKey.toUpperCase().includes("AYIRIM"))) initialPath = { ...initialPath, ayrim: topKey };
      else if (typeof topValue.metin === 'string' && topKey !== "maddeler") { 
          // Bu durum için şimdilik bir işlem yapmıyoruz, findMaddelerRecursive çağrılmayacak
      }
      else if (topValue.maddeler && Object.keys(topValue.maddeler).length > 0 && !initialPath.kitap && !initialPath.kisim && !initialPath.bolum && !initialPath.ayrim) {
        findMaddelerRecursive(topValue, initialPath);
        continue;
      }
      else { continue; }
      findMaddelerRecursive(topValue, initialPath);
    }
    return list;
  }, [content, anaMevzuatKey]);

  const searchResults = useMemo(() => {
    if (searchTerm.trim() === "") return [];
    return allMaddeler.filter(item => 
      (item.maddeVal.baslik && temizleReferanslari(item.maddeVal.baslik).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (temizleReferanslari(item.maddeVal.metin).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (`madde ${item.madde}`.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, allMaddeler]);

  const subsequentMaddeler = useMemo(() => {
    if (!selectedMadde || !allMaddeler || allMaddeler.length === 0) return [];
    const selectedIndex = allMaddeler.findIndex(m => 
        m.madde === selectedMadde.madde && 
        m.baslangic === selectedMadde.baslangic &&
        m.kitap === selectedMadde.kitap && 
        m.kisim === selectedMadde.kisim && 
        m.bolum === selectedMadde.bolum && 
        m.ayrim === selectedMadde.ayrim &&
        m.mevzuatKey === selectedMadde.mevzuatKey 
    );
    if (selectedIndex === -1) return [];
    return allMaddeler.slice(selectedIndex + 1, selectedIndex + 11);
  }, [selectedMadde, allMaddeler]);

  useEffect(() => {
    if (selectedMadde && selectedMadde.madde) {
        const articleElement = document.getElementById(`madde-selected-${selectedMadde.madde}`);
        if (articleElement) {
            // articleElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
  }, [selectedMadde]);

  return (
    <main className="flex h-screen bg-[#F5F5DC]">
      <Navigation 
          displayName={displayName} 
          content={content}
          selected={selectedMadde} 
          onSelectMadde={(maddeData) => {
            const fullMaddeData = {...maddeData, mevzuatKey: maddeData.mevzuatKey || anaMevzuatKey };
            setSelectedMadde(fullMaddeData);
          }}
          anaMevzuatKey={anaMevzuatKey}
          isMaddeFavorited={isMaddeFavorited}
          isLoadingFavorites={isLoadingFavorites}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <Link href="/mevzuat" className="inline-block mb-6 text-sm text-[#002c58] hover:underline"> ← Tüm Mevzuatlar </Link>
        <Breadcrumbs selected={selectedMadde} displayName={displayName} />
        <div className="mb-6">
            <input 
                type="text" 
                placeholder="Madde içinde veya başlığında ara..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#004365] focus:border-transparent text-[#001f3f] placeholder-gray-500" 
            />
        </div>
        
        {searchTerm.trim() !== "" && searchResults.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#001f3f] relative pb-2 w-fit mb-4">
              Arama Sonuçları ({searchResults.length})
              <span className="absolute bottom-0 left-0 w-1/3 h-1 bg-orange-500 rounded-full"></span>
            </h2>
            <div className="space-y-3">
              {searchResults.map((res, index) => (
                <button 
                    key={`search-${res.mevzuatKey}-${res.madde}-${index}`} 
                    onClick={() => { setSelectedMadde(res); setSearchTerm(""); }} 
                    className="w-full flex items-center gap-3 bg-white rounded-md shadow-sm hover:shadow-lg focus:shadow-lg px-4 py-3 transition-shadow duration-150 focus:outline-none border border-gray-200 hover:border-[#004365] text-left"
                >
                  <span className="inline-block w-2.5 h-2.5 bg-[#004365] rounded-full flex-shrink-0" />
                  <span className="text-[#001f3f] font-medium">
                    Madde {res.madde} {res.maddeVal.baslik ? `: ${temizleReferanslari(res.maddeVal.baslik)}` : ""}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
        {searchTerm.trim() !== "" && searchResults.length === 0 && (
             <p className="px-6 py-4 text-gray-700 italic text-sm">
                Arama kriterlerinize uygun madde bulunamadı.
            </p>
        )}

        {selectedMadde && (
          <>
            <article id={`madde-selected-${selectedMadde.madde}`} className="bg-white p-6 md:p-8 rounded-lg shadow-lg border-l-4 border-orange-500">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-[#001f3f] relative pb-2 w-fit">
                  {temizleReferanslari(selectedMadde.maddeVal.baslik) || `Madde ${selectedMadde.madde}`}
                  <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-orange-500 rounded-full"></span>
                </h2>
                <div className="ml-4 flex-shrink-0">
                    {pageStatus === "authenticated" && !isLoadingFavorites && typeof FavoriteButton === 'function' && (
                        <FavoriteButton 
                            itemId={selectedMadde.mevzuatKey} 
                            itemType="mevzuat"
                            mevzuatMaddeNo={selectedMadde.madde}
                            initialIsFavorited={isMaddeFavorited(selectedMadde.mevzuatKey, selectedMadde.madde)}
                        />
                    )}
                </div>
              </div>
              <div className="prose prose-sm sm:prose-base max-w-none text-[#37474F] whitespace-pre-line leading-relaxed">
                {temizleReferanslari(selectedMadde.maddeVal.metin)}
              </div>
            </article>
            
            {subsequentMaddeler.length > 0 && (
              <div className="mt-12 space-y-8">
                <h3 className="text-xl font-semibold text-[#001f3f] relative pb-2 w-fit pt-6">
                  Devam Eden Maddeler ({subsequentMaddeler.length})
                  <span className="absolute bottom-0 left-0 w-1/3 h-1 bg-orange-500 rounded-full"></span>
                </h3>
                {subsequentMaddeler.map((subMadde, index) => (
                  <article key={`sub-${subMadde.mevzuatKey}-${subMadde.madde}-${index}`} className="bg-[#FAFBFB] p-4 md:p-6 rounded-md shadow border-l-4 border-gray-300 hover:shadow-md transition-shadow duration-150">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="text-lg font-semibold text-[#263238]">
                            {temizleReferanslari(subMadde.maddeVal.baslik) || `Madde ${subMadde.madde}`}
                            </h4>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                            {pageStatus === "authenticated" && !isLoadingFavorites && typeof FavoriteButton === 'function' && (
                                <FavoriteButton 
                                    itemId={subMadde.mevzuatKey} 
                                    itemType="mevzuat"
                                    mevzuatMaddeNo={subMadde.madde}
                                    initialIsFavorited={isMaddeFavorited(subMadde.mevzuatKey, subMadde.madde)}
                                />
                            )}
                        </div>
                    </div>
                    <div className="prose prose-xs sm:prose-sm max-w-none text-[#455A64] whitespace-pre-line leading-normal line-clamp-5 hover:line-clamp-none transition-all cursor-pointer"
                         onClick={(e) => { e.currentTarget.classList.toggle('line-clamp-5'); e.currentTarget.classList.toggle('line-clamp-none');}}
                         title="Tamamını görmek için tıklayın"
                    >
                      {temizleReferanslari(subMadde.maddeVal.metin)}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
        {!selectedMadde && searchTerm.trim() === "" && (
          <div className="text-center text-gray-600 pt-10 text-lg">
            <p>İçeriği görmek için lütfen sol menüden bir madde seçin veya arama yapın.</p>
          </div>
        )}
      </div>
    </main>
  );
}