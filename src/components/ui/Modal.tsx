"use client";

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";
import { T } from "@/content/fr/site";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * Pilote un <dialog> natif en mode modal (showModal) :
 *  - le reste de la page devient inerte (le navigateur s'en charge) ;
 *  - Échap ferme (événement `cancel`) ;
 *  - Tab / Maj+Tab restent DANS le dialogue (boucle) ;
 *  - le focus revient sur le bouton d'ouverture à la fermeture (natif) ;
 *  - un clic sur le fond ferme.
 * Utilisé par <Modal> et par le menu mobile :
 *   const ref = useRef<HTMLDialogElement>(null);
 *   const handlers = useModalDialog(ref, open, onClose);
 *   <dialog ref={ref} {...handlers}>…</dialog>
 */
export function useModalDialog(ref: RefObject<HTMLDialogElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [ref, open]);

  return {
    onCancel: (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      onClose();
    },
    // Fermé autrement (formulaire method="dialog"…) : l'état suit.
    onClose: () => {
      if (open) onClose();
    },
    onClick: (event: MouseEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget) onClose();
    },
    onKeyDown: trapTab,
  };
}

function trapTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.offsetParent !== null || element === document.activeElement,
  );
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Titre (obligatoire : nom accessible du dialogue). */
  title: ReactNode;
  /** Masquer visuellement le titre (il reste lu). Ex. visionneuse d'images. */
  hideTitle?: boolean;
  description?: ReactNode;
  children?: ReactNode;
  /** Boutons d'action en bas du dialogue. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeLabel?: string;
  className?: string;
};

const SIZES = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" } as const;

/**
 * Dialogue accessible sans bibliothèque (élément <dialog> natif).
 *
 *   const [open, setOpen] = useState(false);
 *   <Button onClick={() => setOpen(true)}>Ouvrir</Button>
 *   <Modal open={open} onClose={() => setOpen(false)} title="Titre">…</Modal>
 */
export function Modal({
  open,
  onClose,
  title,
  hideTitle = false,
  description,
  children,
  footer,
  size = "md",
  closeLabel = T.a11y.close,
  className,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const handlers = useModalDialog(ref, open, onClose);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      {...handlers}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-visible bg-transparent p-0",
        SIZES[size],
        "open:motion-safe:animate-[modal-in_var(--duration-base)_var(--ease-out)]",
      )}
    >
      <div
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-card bg-white text-ink shadow-overlay",
          className,
        )}
      >
        <div className={cn("flex items-start justify-between gap-4 px-6 pt-6", hideTitle && "absolute top-0 right-0 z-10 p-3")}>
          <div className={cn("min-w-0", hideTitle && "sr-only")}>
            <h2 id={titleId} className="text-h3">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mt-1 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-brand transition-colors duration-(--duration-fast) hover:bg-brand-50"
          >
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">{closeLabel}</span>
          </button>
        </div>
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 pb-6", !hideTitle && "pt-4", hideTitle && "pt-6")}>
          {children}
        </div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-ivory px-6 py-4">{footer}</div>
        )}
      </div>
    </dialog>
  );
}
