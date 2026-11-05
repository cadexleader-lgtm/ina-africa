"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/** Démonstration du dialogue (page /styleguide uniquement). */
export function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Ouvrir un dialogue
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Exemple de dialogue"
        description="Échap, le bouton Fermer ou un clic sur le fond le ferment."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => setOpen(false)}>Confirmer</Button>
          </>
        }
      >
        <p>Exemple de contenu de dialogue. Le focus reste dans le dialogue tant qu&apos;il est ouvert.</p>
      </Modal>
    </>
  );
}
