"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Paiement en attente : relit le statut sur le serveur toutes les 8 s (au plus 15 fois). */
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      router.refresh();
      if (count >= 15) window.clearInterval(timer);
    }, 8_000);
    return () => window.clearInterval(timer);
  }, [router]);
  return null;
}
