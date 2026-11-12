"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Expand } from "lucide-react";

import { MediaViewer } from "@/components/pages/gallery/MediaViewer";
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/media";
import type { GalleryItem, TeamMember } from "@/lib/types/content";

/**
 * Portraits de l'équipe en grand : un clic sur une photo ouvre la visionneuse
 * de la galerie (plein écran, précédent / suivant entre les membres, Échap
 * pour fermer, focus rendu à la photo d'origine).
 * Sans JavaScript, la photo est un simple lien vers l'image en grand.
 */

type Ctx = { open: (memberId: string, opener: HTMLElement) => void };
const TeamViewerContext = createContext<Ctx | null>(null);

export function TeamPhotoProvider({ members, children }: { members: TeamMember[]; children: ReactNode }) {
  const items = useMemo<GalleryItem[]>(
    () =>
      members
        .filter((member) => member.photo)
        .map((member) => ({
          id: member.id,
          type: "photo",
          image: member.photo!,
          caption: `${member.fullName} — ${member.position}`,
          takenOn: null,
        })),
    [members],
  );
  const [index, setIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const open = useCallback(
    (memberId: string, element: HTMLElement) => {
      const found = items.findIndex((item) => item.id === memberId);
      if (found < 0) return;
      opener.current = element;
      setIndex(found);
    },
    [items],
  );

  // Retour du focus sur la photo d'origine après la fermeture.
  useEffect(() => {
    if (index === null && opener.current) {
      opener.current.focus();
      opener.current = null;
    }
  }, [index]);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <TeamViewerContext.Provider value={value}>
      {children}
      <MediaViewer items={items} index={index} onChange={setIndex} onClose={close} />
    </TeamViewerContext.Provider>
  );
}

/** Photo cliquable d'un membre (lien vers l'image en grand sans JavaScript). */
export function TeamPhotoButton({ member, className, children }: { member: TeamMember; className?: string; children: ReactNode }) {
  const context = useContext(TeamViewerContext);
  if (!member.photo) return <div className={className}>{children}</div>;
  return (
    <a
      href={mediaUrl(member.photo.path)}
      onClick={(event) => {
        if (!context || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        context.open(member.id, event.currentTarget);
      }}
      className={cn("group/photo relative block cursor-zoom-in", className)}
    >
      {children}
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center rounded-full bg-brand/0 text-white opacity-0 transition-[opacity,background-color] duration-(--duration-fast) group-hover/photo:bg-brand/45 group-hover/photo:opacity-100 group-focus-visible/photo:bg-brand/45 group-focus-visible/photo:opacity-100"
      >
        <Expand className="size-5" />
      </span>
      <span className="sr-only">Agrandir la photo de {member.fullName}</span>
    </a>
  );
}
