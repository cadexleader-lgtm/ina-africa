"use client";

import { deleteCampaign, setCampaignActive } from "@/server/actions/admin/campaigns";
import {
  deleteActionArea,
  deleteGalleryItem,
  deletePartner,
  deleteProject,
  deleteTeamMember,
  setActionAreaActive,
  setGalleryItemPublished,
  setPartnerActive,
  setProjectPublished,
  setTeamMemberActive,
} from "@/server/actions/admin/content";

import { ACTIVE_LABELS, VisibilityPanel } from "./VisibilityPanel";

/*
 * Panneaux « Visibilité » des pages d'édition (une fonction par type de
 * contenu : les actions sont liées à l'identifiant dans le navigateur).
 */

export function ProjectVisibility({ id, slug, title, published }: { id: string; slug: string; title: string; published: boolean }) {
  return (
    <VisibilityPanel
      name={title}
      on={published}
      toggle={(next) => setProjectPublished({ id, published: next })}
      publicHref={`/projets/${slug}`}
      remove={() => deleteProject({ id })}
      deleteWarning="Les photos de la galerie liées à ce projet sont conservées, sans projet."
      listHref="/admin/projets"
      note="Un résumé ou une description est nécessaire pour publier."
    />
  );
}

export function AreaVisibility({ id, slug, title, active }: { id: string; slug: string; title: string; active: boolean }) {
  return (
    <VisibilityPanel
      name={title}
      on={active}
      labels={ACTIVE_LABELS}
      toggle={(next) => setActionAreaActive({ id, active: next })}
      publicHref={`/domaines/${slug}`}
      remove={() => deleteActionArea({ id })}
      deleteWarning="Les projets de ce domaine sont conservés, sans domaine."
      listHref="/admin/domaines"
    />
  );
}

export function GalleryVisibility({ id, name, published }: { id: string; name: string; published: boolean }) {
  return (
    <VisibilityPanel
      name={name}
      on={published}
      toggle={(next) => setGalleryItemPublished({ id, published: next })}
      publicHref="/galerie"
      remove={() => deleteGalleryItem({ id })}
      deleteWarning="La photo reste dans la médiathèque."
      listHref="/admin/galerie"
    />
  );
}

export function PartnerVisibility({ id, name, active }: { id: string; name: string; active: boolean }) {
  return (
    <VisibilityPanel
      name={name}
      on={active}
      labels={ACTIVE_LABELS}
      toggle={(next) => setPartnerActive({ id, active: next })}
      publicHref="/"
      remove={() => deletePartner({ id })}
      listHref="/admin/partenaires"
      note="Les partenaires actifs apparaissent dans le bandeau de la page d'accueil."
    />
  );
}

export function TeamVisibility({ id, name, active }: { id: string; name: string; active: boolean }) {
  return (
    <VisibilityPanel
      name={name}
      on={active}
      labels={ACTIVE_LABELS}
      toggle={(next) => setTeamMemberActive({ id, active: next })}
      publicHref="/a-propos"
      remove={() => deleteTeamMember({ id })}
      listHref="/admin/equipe"
    />
  );
}

export function CampaignVisibility({ id, slug, title, active }: { id: string; slug: string; title: string; active: boolean }) {
  return (
    <VisibilityPanel
      name={title}
      on={active}
      labels={ACTIVE_LABELS}
      toggle={(next) => setCampaignActive({ id, active: next })}
      publicHref={`/faire-un-don/${slug}`}
      remove={() => deleteCampaign({ id })}
      deleteWarning="Un appel qui a déjà reçu des dons ne peut pas être supprimé : désactivez-le plutôt."
      listHref="/admin/appels-aux-dons"
      note="Un résumé ou un texte est nécessaire pour activer l'appel. Une fois actif, son lien peut être partagé."
    />
  );
}
