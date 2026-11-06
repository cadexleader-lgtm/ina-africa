"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ImageOff } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { browsePublicMedia, type PickerMedia } from "@/server/actions/admin/media-library";

import { MediaThumb } from "./MediaThumb";

/**
 * Fenêtre « Choisir dans la médiathèque » : photos déjà envoyées, des plus
 * récentes aux plus anciennes (24 par page, « Afficher plus »). Chaque photo
 * est un bouton nommé par son texte alternatif (ou son nom de fichier).
 */
export function MediaPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (media: PickerMedia) => void;
}) {
  const [items, setItems] = useState<PickerMedia[]>([]);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = useCallback((target: number) => {
    // Aucun changement d'état avant la réponse (appelé à l'ouverture de la fenêtre).
    startTransition(async () => {
      try {
        const result = await browsePublicMedia({ page: target });
        if (!result.ok) {
          setError(result.error.message);
          return;
        }
        setError(null);
        setItems((current) => (target === 1 ? result.data.items : [...current, ...result.data.items]));
        setPage(result.data.page);
        setPageCount(result.data.pageCount);
        setLoaded(true);
      } catch {
        setError("La médiathèque ne peut pas être affichée pour le moment. Réessayez.");
      }
    });
  }, []);

  useEffect(() => {
    if (open) load(1);
  }, [open, load]);

  return (
    <Modal open={open} onClose={onClose} title="Choisir dans la médiathèque" description="Photos déjà envoyées, des plus récentes aux plus anciennes." size="xl">
      <div className="flex flex-col gap-5">
        <div role="status" aria-live="polite" className="sr-only">
          {pending ? "Chargement des photos…" : loaded ? `${items.length} photo${items.length > 1 ? "s" : ""} affichée${items.length > 1 ? "s" : ""}.` : ""}
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        {loaded && items.length === 0 && (
          <EmptyState
            icon={ImageOff}
            title="La médiathèque est vide"
            description="Envoyez d'abord une photo avec le bouton « Envoyer une photo »."
          />
        )}
        {items.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  className="group flex w-full flex-col overflow-hidden rounded-card border border-line bg-white text-left transition-colors duration-(--duration-fast) hover:border-brand"
                >
                  <span className="block aspect-[4/3] w-full">
                    <MediaThumb path={item.path} alt="" />
                  </span>
                  <span className="line-clamp-2 p-2 text-small text-ink">
                    {item.altText || <span className="text-muted">{item.fileName} (sans description)</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {page < pageCount && loaded && (
          <div className="flex justify-center">
            <Button variant="secondary" loading={pending} onClick={() => load(page + 1)}>
              Afficher plus de photos
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
