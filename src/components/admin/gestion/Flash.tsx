"use client";

import { useEffect, useState } from "react";

import { LiveStatus } from "./LiveStatus";

/**
 * Message de confirmation affiché après une redirection (ex. ?supprimee=1).
 * La zone est d'abord vide puis remplie après l'affichage : le message est
 * ainsi annoncé par les lecteurs d'écran, même après une navigation.
 */
export function Flash({ text, tone = "success" }: { text: string; tone?: "success" | "error" }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(true), 50);
    return () => window.clearTimeout(timer);
  }, []);
  return <LiveStatus message={shown ? { tone, text } : null} />;
}
