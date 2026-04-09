"use client";

import { useEffect } from "react";

export default function GoogleAdsPaketConversion() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "conversion", {
        send_to: "AW-18028288601/mny3CK7Jr5gcENm0x5RD",
        transaction_id: "",
      });
    }
  }, []);

  return null;
}