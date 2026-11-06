"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";

type Message = { message: string; tone: "success" | "error" };

/**
 * Zone de statut d'une page de liste : affiche ET annonce aux lecteurs
 * d'écran le résultat des actions faites sur les lignes (évènement
 * « admin:annonce », voir RowActions.announce). Message initial possible
 * (ex. « Article supprimé » après un retour à la liste).
 */
export function ListAnnouncer({ initial }: { initial?: Message | null }) {
  const [current, setCurrent] = useState<Message | null>(initial ?? null);

  useEffect(() => {
    const onMessage = (event: Event) => setCurrent((event as CustomEvent<Message>).detail);
    window.addEventListener("admin:annonce", onMessage);
    return () => window.removeEventListener("admin:annonce", onMessage);
  }, []);

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true">
        {current?.tone === "success" && (
          <Alert tone="success" role="none">
            {current.message}
          </Alert>
        )}
      </div>
      <div role="alert" aria-atomic="true">
        {current?.tone === "error" && (
          <Alert tone="error" role="none">
            {current.message}
          </Alert>
        )}
      </div>
    </div>
  );
}
