// lib/packages.js
export const PACKAGES = {
  1: { tokens: 5,     price: 150,  name: "5 Token Paketi",           shopierUrl: "https://www.shopier.com/XXXXX1" },
  2: { tokens: 25,    price: 500,  name: "25 Token Paketi",          shopierUrl: "https://www.shopier.com/XXXXX2" },
  3: { tokens: 50,    price: 850,  name: "50 Token Paketi",          shopierUrl: "https://www.shopier.com/XXXXX3" },
  4: { tokens: 99999, price: 3600, name: "3 Aylik Sinirsiz Erisim",  shopierUrl: "https://www.shopier.com/XXXXX4" },
  5: { tokens: 99999, price: 6000, name: "6 Aylik Sinirsiz Erisim",  shopierUrl: "https://www.shopier.com/XXXXX5" },
  6: { tokens: 99999, price: 9500, name: "1 Yillik Sinirsiz Erisim", shopierUrl: "https://www.shopier.com/XXXXX6" },
};

// Webhook'tan gelen ürün adını pakete eşlemek için
export function findPackageByName(productName) {
  return Object.values(PACKAGES).find(
    (p) => p.name.trim().toLowerCase() === String(productName).trim().toLowerCase()
  );
}