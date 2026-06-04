

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const MIN_ACTIVITY_INTERVAL_MS = 60 * 1000; // Aynı sayfada en fazla dakikada 1 aktiflik kaydı

export default function ActivityTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const lastActivityAtRef = useRef(0);
  const lastPathRef = useRef(null);

  async function sendActivity(type, path) {
    try {
      await fetch("/api/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          path,
        }),
        keepalive: true,
      });
    } catch (error) {
      // Kullanıcı deneyimini bozmamak için sessiz geç.
      console.error("ACTIVITY_TRACKER_ERROR", error);
    }
  }

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id || !pathname) return;

    const now = Date.now();
    const pathChanged = lastPathRef.current !== pathname;

    if (pathChanged) {
      lastPathRef.current = pathname;
      lastActivityAtRef.current = now;
      sendActivity("PAGE_VIEW", pathname);
      return;
    }

    if (now - lastActivityAtRef.current > MIN_ACTIVITY_INTERVAL_MS) {
      lastActivityAtRef.current = now;
      sendActivity("ACTIVE", pathname);
    }
  }, [pathname, session?.user?.id, status]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityAtRef.current < MIN_ACTIVITY_INTERVAL_MS) return;

      lastActivityAtRef.current = now;
      sendActivity("ACTIVE", window.location.pathname);
    };

    const events = ["click", "keydown", "scroll", "mousemove", "touchstart"];
    events.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
    };
  }, [session?.user?.id, status]);

  return null;
}