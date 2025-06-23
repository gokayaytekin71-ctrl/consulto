
import { useState } from "react";

export default function YuklePage() {
  const [dosyaMetni, setDosyaMetni] = useState("");
  const [jsonCikti, setJsonCikti] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const dosyaOku = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setDosyaMetni(event.target.result);
    };
    reader.readAsText(file);
  };

  const ozetle = async () => {
    if (!dosyaMetni) return;
    setIsLoading(true);

    const response = await fetch("/api/ozet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metin: dosyaMetni })
    });

    const data = await response.json();

    // Örnek regex ile esas/karar no çıkartalım
    const esasKarar = dosyaMetni.match(/(\d{4})\/(\d+)\s*E\..*?(\d{4})\/(\d+)\s*K\./);
    const esas = esasKarar ? `${esasKarar[1]}/${esasKarar[2]}` : "Bilinmiyor";
    const karar = esasKarar ? `${esasKarar[3]}/${esasKarar[4]}` : "Bilinmiyor";

    const json = {
      id: String(Date.now()),
      esas,
      karar,
      tarih: "Tarih ekle",
      metin: dosyaMetni.slice(0, 1000) + "...",
      ozet: data.yanit,
      ictihat: "AI ile ayrıştırılabilir.",
      kanunlar: [],
      benzer: []
    };

    setJsonCikti(json);
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <section className="bg-white p-6 rounded shadow max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-[#1B3A57]">Karar Yükle ve AI ile Özetle</h1>

        <input type="file" accept=".txt" onChange={dosyaOku} className="w-full" />

        <button
          onClick={ozetle}
          disabled={isLoading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
        >
          {isLoading ? "Yükleniyor..." : "AI ile Özetle"}
        </button>

        {jsonCikti && (
          <pre className="bg-gray-800 text-green-200 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(jsonCikti, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}