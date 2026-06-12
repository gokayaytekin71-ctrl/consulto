// scripts/shopier-webhooks.mjs
const PAT = process.env.SHOPIER_PAT;
const BASE = "https://api.shopier.com/v1";
const H = { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" };
const [, , cmd, arg] = process.argv;

if (!PAT) { console.error("SHOPIER_PAT yok"); process.exit(1); }

if (cmd === "delete") {
  const r = await fetch(`${BASE}/webhooks/${arg}`, { method: "DELETE", headers: H });
  console.log(r.status, await r.text());
} else if (cmd === "create") {
  const r = await fetch(`${BASE}/webhooks`, {
    method: "POST", headers: H,
    body: JSON.stringify({
      event: "order.created",
      url: "https://consultohukuk.com/api/shopier/webhook",
    }),
  });
  console.log(r.status, await r.text());
} else {
  const r = await fetch(`${BASE}/webhooks`, { headers: H });
  console.log(r.status, await r.text());
}