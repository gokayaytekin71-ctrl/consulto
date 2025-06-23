"use client";

// Bu komponent, özet metnini alıp belirli anahtar kelimeleri renklendirir.
export default function FormattedSummary({ summary }) {
  if (!summary) return null;

  // Renklendirmek istediğimiz anahtar kelimeler ve atanacak CSS sınıfları
  const keywords = {
    "Konu:": "text-blue-700 font-bold",
    "1) Konu:": "text-blue-700 font-bold",
    "HGK Gerekçesi ve Sonuç:": "text-indigo-700 font-bold",
     "2) HGK Gerekçesi ve Sonuç:": "text-indigo-700 font-bold",
    "HGK Gerekçesi:": "text-indigo-700 font-bold",
    "Sonuç:": "text-emerald-700 font-bold",
  };

  const lines = summary.split('\n').filter(line => line.trim() !== '');

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        let keywordFound = false;
        for (const keyword in keywords) {
          if (line.trim().startsWith(keyword)) {
            const restOfLine = line.trim().substring(keyword.length).trim();
            keywordFound = true;
            return (
              <p key={index} className="text-sm text-gray-700">
                <span className={keywords[keyword]}>{keyword}</span>
                <span className="text-gray-600"> {restOfLine}</span>
              </p>
            );
          }
        }

        // Eğer satır bir anahtar kelime ile başlamıyorsa, normal şekilde yazdır
        if (!keywordFound) {
          return (
            <p key={index} className="text-sm text-gray-600">
              {line}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}