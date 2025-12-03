"use client";
import { useState } from "react";

const PACKAGES = [
  { id: 1, tokens: 10, price: 100, name: "Başlangıç Paketi" },
  { id: 2, tokens: 50, price: 400, name: "Profesyonel Paket" },
  { id: 3, tokens: 100, price: 700, name: "Uzman Paket" },
];

export default function TokenPurchase() {
  const [loading, setLoading] = useState(false);

  const handleBuy = async (packageId) => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      if (!res.ok) {
        alert("Ödeme başlatılamadı. Giriş yaptığınızdan emin olun.");
        setLoading(false);
        return;
      }

      const html = await res.text();
      // Shopier'e yönlendir
      document.open();
      document.write(html);
      document.close();
      
    } catch (error) {
      console.error(error);
      alert("Hata oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 p-4">
      {PACKAGES.map((pkg) => (
        <div 
          key={pkg.id} 
          className="relative bg-[#0f172a] border border-slate-700 rounded-xl p-6 flex flex-col items-center text-center shadow-lg hover:border-cyan-500/50 transition-all group"
        >
          {pkg.id === 2 && (
            <div className="absolute -top-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
              EN POPÜLER
            </div>
          )}
          
          <h3 className="text-slate-300 font-bold text-lg mb-2">{pkg.name}</h3>
          <div className="text-3xl font-bold text-white mb-1">
            {pkg.tokens} <span className="text-sm text-cyan-400 font-normal">Token</span>
          </div>
          <div className="text-slate-400 text-sm mb-6">
            ₺{pkg.price}
          </div>

          <button
            onClick={() => handleBuy(pkg.id)}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-slate-800 text-white font-medium border border-slate-600 group-hover:bg-cyan-600 group-hover:border-cyan-500 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50"
          >
            {loading ? "Yönlendiriliyor..." : "Satın Al"}
          </button>
        </div>
      ))}
    </div>
  );
}