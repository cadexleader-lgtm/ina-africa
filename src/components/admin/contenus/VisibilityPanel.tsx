"use client";

import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import type { ActionResult } from "@/server/errors";

import { ListAnnouncer } from "./ListAnnouncer";
import { DeleteButton, ToggleButton } from "./RowActions";
import { Panel, VisibilityBadge } from "./ui";

export const PUBLISH_LABELS = {
  on: "Publier",
  off: "Retirer du site",
  doneOn: "Publié",
  doneOff: "Retiré du site",
  badgeOn: "Publié",
  badgeOff: "Non publié",
};

export const ACTIVE_LABELS = {
  on: "Activer",
  off: "Désactiver",
  doneOn: "Activé",
  doneOff: "Désactivé",
  badgeOn: "Actif (visible)",
  badgeOff: "Inactif (masqué)",
};

/**
 * Panneau « Visibilité » d'une page d'édition : état, bouton Publier /
 * Retirer (ou Activer / Désactiver), lien vers la page publique, suppression.
 */
export function VisibilityPanel({
  name,
  on,
  toggle,
  labels = PUBLISH_LABELS,
  publicHref,
  remove,
  deleteWarning,
  listHref,
  note,
}: {
  name: string;
  on: boolean;
  toggle: (next: boolean) => Promise<ActionResult<unknown>>;
  labels?: typeof PUBLISH_LABELS;
  publicHref?: string | null;
  remove: () => Promise<ActionResult<unknown>>;
  deleteWarning?: string;
  /** Liste où revenir après la suppression. */
  listHref: string;
  note?: string;
}) {
  const router = useRouter();
  return (
    <Panel title="Visibilité sur le site">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-small text-muted">État :</span>
        <VisibilityBadge on={on} labels={{ on: labels.badgeOn, off: labels.badgeOff }} />
      </div>
      {note && <p className="text-small text-muted">{note}</p>}
      <ListAnnouncer />
      <div className="flex flex-wrap items-center gap-2">
        <ToggleButton on={on} name={name} action={toggle} labels={labels} />
        {on && publicHref && (
          <LinkButton href={publicHref} external variant="link" size="sm" iconLeft={<ExternalLink />}>
            Voir sur le site
          </LinkButton>
        )}
      </div>
      <div className="border-t border-line pt-3">
        <DeleteButton name={name} action={remove} warning={deleteWarning} onDeleted={() => router.push(`${listHref}?etat=supprime`)} />
      </div>
    </Panel>
  );
}
