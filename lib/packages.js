// lib/packages.js
export const PACKAGES = {
  1: { tokens: 5,     price: 150,  name: "Başlangıç Paketi",           shopierUrl: "https://www.shopier.com/consulto/47980955" },
  2: { tokens: 25,    price: 500,  name: "Profesyonel Paket",          shopierUrl: "https://www.shopier.com/consulto/47981026" },
  3: { tokens: 50,    price: 1,  name: "Uzman Paket",          shopierUrl: "https://www.shopier.com/consulto/47981130" },
  4: { tokens: 99999, price: 2700, name: "Sınırsız Paket – 3 Aylık",  shopierUrl: "https://www.shopier.com/consulto/47981156" },
  5: { tokens: 99999, price: 4750, name: "Sınırsız Paket – 6 Aylık",  shopierUrl: "https://www.shopier.com/consulto/47981237" },
  6: { tokens: 99999, price: 7000, name: "Sınırsız Paket – 1 Yıllık", shopierUrl: "https://www.shopier.com/consulto/47981254" },
};

// Webhook'tan gelen ürün adını pakete eşlemek için
export function findPackageByName(productName) {
  return Object.values(PACKAGES).find(
    (p) => p.name.trim().toLowerCase() === String(productName).trim().toLowerCase()
  );
}