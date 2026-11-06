"use client";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";

/** Erreur inattendue dans l'espace d'administration (détail technique jamais affiché). */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      headingLevel="h1"
      title="Cette page ne peut pas être affichée pour le moment"
      action={<Button onClick={reset}>Réessayer</Button>}
    />
  );
}
