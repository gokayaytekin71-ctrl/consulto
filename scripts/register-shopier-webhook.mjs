// scripts/register-shopier-webhook.mjs
// Çalıştır:  SHOPIER_PAT=xxx node scripts/register-shopier-webhook.mjs

const PAT = process.env.SHOPIER_PAT;

const res = await fetch("https://api.shopier.com/v1/webhooks", { // ⚠️ base URL'i referanstan doğrula
  method: "POST",
  headers: {
    Authorization: `Bearer ${PAT}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    event: "order.created", // ⚠️ event enum değerini referanstan doğrula (ödeme tamamlanma eventi)
    url: "https://www.consultohukuk.com/api/shopier/webhook",

  }),
});

const data = await res.json();
console.log(data);
// data.token => .env'e SHOPIER_WEBHOOK_TOKEN olarak yaz. BİR KEZ DÖNER.