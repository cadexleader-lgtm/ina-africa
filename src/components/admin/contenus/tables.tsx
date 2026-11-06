"use client";

import { Pencil } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { formatFcfa } from "@/lib/money";
import { TEAM_GROUP_LABELS } from "@/lib/team";
import { deleteCampaign, setCampaignActive } from "@/server/actions/admin/campaigns";
import {
  deleteActionArea,
  deleteGalleryItem,
  deletePartner,
  deleteProject,
  deleteTeamMember,
  reorderActionAreas,
  reorderGalleryItems,
  reorderPartners,
  reorderTeamMembers,
  setActionAreaActive,
  setGalleryItemPublished,
  setPartnerActive,
  setProjectPublished,
  setTeamMemberActive,
} from "@/server/actions/admin/content";
import type {
  AdminActionArea,
  AdminArticleListItem,
  AdminCampaignListItem,
  AdminGalleryItem,
  AdminPartner,
  AdminProjectListItem,
  AdminTeamMember,
} from "@/server/data/admin/types";

import { MediaThumb } from "../media/MediaThumb";
import { ARTICLE_STATUS_LABELS, ARTICLE_STATUS_TONES, PARTNER_KIND_LABELS, PROJECT_STATUS_LABELS } from "./labels";
import { DeleteButton, MoveButtons, ToggleButton } from "./RowActions";
import { DataTable, RowLink, StatusBadge, VisibilityBadge } from "./ui";
import { ACTIVE_LABELS, PUBLISH_LABELS } from "./VisibilityPanel";

/*
 * Tableaux des listes de contenus (composants client : les boutons de
 * chaque ligne appellent les Server Actions existantes).
 */

function EditLink({ href, name }: { href: string; name: string }) {
  return (
    <LinkButton href={href} size="sm" variant="ghost" iconLeft={<Pencil />} aria-label={`Modifier : ${name}`}>
      Modifier
    </LinkButton>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1">{children}</div>;
}

// ---------------------------------------------------------------------------

export function ArticleTable({ articles }: { articles: AdminArticleListItem[] }) {
  return (
    <DataTable
      caption="Articles"
      rows={articles}
      rowKey={(article) => article.id}
      columns={[
        { header: "Titre", cell: (article) => <RowLink href={`/admin/articles/${article.id}`}>{article.title}</RowLink> },
        {
          header: "État",
          cell: (article) => <StatusBadge tone={ARTICLE_STATUS_TONES[article.status]}>{ARTICLE_STATUS_LABELS[article.status]}</StatusBadge>,
        },
        { header: "Catégorie", cell: (article) => article.category?.name ?? "—", hideOnMobile: true },
        { header: "Auteur", cell: (article) => article.author?.fullName ?? "—", hideOnMobile: true },
        {
          header: "Modifié le",
          cell: (article) => <span className="whitespace-nowrap text-small">{formatDate(article.updatedAt)}</span>,
          hideOnMobile: true,
        },
      ]}
    />
  );
}

export function ProjectTable({ projects }: { projects: AdminProjectListItem[] }) {
  return (
    <DataTable
      caption="Projets"
      rows={projects}
      rowKey={(project) => project.id}
      columns={[
        {
          header: "Titre",
          cell: (project) => (
            <span className="flex flex-col gap-1">
              <RowLink href={`/admin/projets/${project.id}`}>{project.title}</RowLink>
              {project.isFeatured && <span className="text-small text-muted">Mis en avant sur l&apos;accueil</span>}
            </span>
          ),
        },
        { header: "État", cell: (project) => PROJECT_STATUS_LABELS[project.status], hideOnMobile: true },
        { header: "Site", cell: (project) => <VisibilityBadge on={project.isPublished} /> },
        {
          header: "Modifié le",
          cell: (project) => <span className="whitespace-nowrap text-small">{formatDate(project.updatedAt)}</span>,
          hideOnMobile: true,
        },
        {
          header: <span className="sr-only">Actions</span>,
          cell: (project) => (
            <Actions>
              <ToggleButton
                on={project.isPublished}
                name={project.title}
                labels={PUBLISH_LABELS}
                action={(next) => setProjectPublished({ id: project.id, published: next })}
              />
              <EditLink href={`/admin/projets/${project.id}`} name={project.title} />
              <DeleteButton
                name={project.title}
                action={() => deleteProject({ id: project.id })}
                warning="Les photos de la galerie liées à ce projet sont conservées, sans projet."
              />
            </Actions>
          ),
        },
      ]}
    />
  );
}

export function AreaTable({ areas }: { areas: AdminActionArea[] }) {
  const ids = areas.map((area) => area.id);
  return (
    <DataTable
      caption="Domaines d'intervention, dans l'ordre d'affichage"
      rows={areas}
      rowKey={(area) => area.id}
      columns={[
        { header: "Domaine", cell: (area) => <RowLink href={`/admin/domaines/${area.id}`}>{area.title}</RowLink> },
        { header: "Site", cell: (area) => <VisibilityBadge on={area.isActive} labels={{ on: "Actif", off: "Inactif" }} /> },
        {
          header: "Texte",
          cell: (area) => (area.summary || area.description ? "Renseigné" : <span className="text-muted">À rédiger</span>),
          hideOnMobile: true,
        },
        { header: "Ordre", cell: (area, index) => <MoveButtons ids={ids} index={index} name={area.title} action={reorderActionAreas} /> },
        {
          header: <span className="sr-only">Actions</span>,
          cell: (area) => (
            <Actions>
              <ToggleButton
                on={area.isActive}
                name={area.title}
                labels={ACTIVE_LABELS}
                action={(next) => setActionAreaActive({ id: area.id, active: next })}
              />
              <EditLink href={`/admin/domaines/${area.id}`} name={area.title} />
              <DeleteButton
                name={area.title}
                action={() => deleteActionArea({ id: area.id })}
                warning="Les projets de ce domaine sont conservés, sans domaine."
              />
            </Actions>
          ),
        },
      ]}
    />
  );
}

export function GalleryTable({
  items,
  projectNames,
  reorderable,
}: {
  items: AdminGalleryItem[];
  projectNames: Record<string, string>;
  /** L'ordre ne se change que sur la liste COMPLÈTE (une seule page, sans filtre). */
  reorderable: boolean;
}) {
  const ids = items.map((item) => item.id);
  const nameOf = (item: AdminGalleryItem) =>
    item.caption || item.imageAlt || (item.itemType === "video" ? `Vidéo ${item.videoProvider === "facebook" ? "Facebook" : "YouTube"}` : "Photo");
  return (
    <DataTable
      caption="Éléments de la galerie, dans l'ordre d'affichage"
      rows={items}
      rowKey={(item) => item.id}
      rowHeader={1}
      columns={[
        {
          header: "Aperçu",
          cell: (item) => (
            <span className="block h-16 w-24 overflow-hidden rounded-field border border-line bg-ivory">
              {item.imagePath ? (
                <MediaThumb path={item.imagePath} alt="" />
              ) : (
                <span className="flex size-full items-center justify-center text-small text-muted">Vidéo</span>
              )}
            </span>
          ),
        },
        {
          header: "Élément",
          cell: (item) => (
            <span className="flex flex-col gap-1">
              <RowLink href={`/admin/galerie/${item.id}`}>{nameOf(item)}</RowLink>
              <span className="text-small text-muted">
                {item.itemType === "video" ? "Vidéo" : "Photo"}
                {item.takenOn ? ` · ${formatDate(item.takenOn)}` : ""}
                {item.projectId && projectNames[item.projectId] ? ` · ${projectNames[item.projectId]}` : ""}
              </span>
            </span>
          ),
        },
        { header: "Site", cell: (item) => <VisibilityBadge on={item.isPublished} /> },
        ...(reorderable
          ? [
              {
                header: "Ordre",
                cell: (item: AdminGalleryItem, index: number) => (
                  <MoveButtons ids={ids} index={index} name={nameOf(item)} action={reorderGalleryItems} />
                ),
              },
            ]
          : []),
        {
          header: <span className="sr-only">Actions</span>,
          cell: (item) => (
            <Actions>
              <ToggleButton
                on={item.isPublished}
                name={nameOf(item)}
                labels={PUBLISH_LABELS}
                action={(next) => setGalleryItemPublished({ id: item.id, published: next })}
              />
              <EditLink href={`/admin/galerie/${item.id}`} name={nameOf(item)} />
              <DeleteButton
                name={nameOf(item)}
                action={() => deleteGalleryItem({ id: item.id })}
                warning="La photo reste dans la médiathèque."
              />
            </Actions>
          ),
        },
      ]}
    />
  );
}

export function PartnerTable({ partners }: { partners: AdminPartner[] }) {
  const ids = partners.map((partner) => partner.id);
  return (
    <DataTable
      caption="Partenaires et sponsors, dans l'ordre d'affichage"
      rows={partners}
      rowKey={(partner) => partner.id}
      rowHeader={1}
      columns={[
        {
          header: "Logo",
          cell: (partner) => (
            <span className="block h-12 w-20 overflow-hidden rounded-field border border-line bg-white">
              {partner.logoPath ? (
                <MediaThumb path={partner.logoPath} alt="" fit="contain" />
              ) : (
                <span className="flex size-full items-center justify-center text-small text-muted">—</span>
              )}
            </span>
          ),
        },
        { header: "Nom", cell: (partner) => <RowLink href={`/admin/partenaires/${partner.id}`}>{partner.name}</RowLink> },
        { header: "Type", cell: (partner) => PARTNER_KIND_LABELS[partner.kind], hideOnMobile: true },
        { header: "Site", cell: (partner) => <VisibilityBadge on={partner.isActive} labels={{ on: "Actif", off: "Inactif" }} /> },
        { header: "Ordre", cell: (partner, index) => <MoveButtons ids={ids} index={index} name={partner.name} action={reorderPartners} /> },
        {
          header: <span className="sr-only">Actions</span>,
          cell: (partner) => (
            <Actions>
              <ToggleButton
                on={partner.isActive}
                name={partner.name}
                labels={ACTIVE_LABELS}
                action={(next) => setPartnerActive({ id: partner.id, active: next })}
              />
              <EditLink href={`/admin/partenaires/${partner.id}`} name={partner.name} />
              <DeleteButton name={partner.name} action={() => deletePartner({ id: partner.id })} />
            </Actions>
          ),
        },
      ]}
    />
  );
}

export function TeamTable({ members }: { members: AdminTeamMember[] }) {
  const ids = members.map((member) => member.id);
  return (
    <DataTable
      caption="Membres de l'équipe, par instance puis dans l'ordre d'affichage"
      rows={members}
      rowKey={(member) => member.id}
      rowHeader={1}
      columns={[
        {
          header: "Photo",
          cell: (member) => (
            <span className="block size-12 overflow-hidden rounded-full border border-line bg-ivory">
              {member.photoPath && <MediaThumb path={member.photoPath} alt="" />}
            </span>
          ),
        },
        { header: "Nom", cell: (member) => <RowLink href={`/admin/equipe/${member.id}`}>{member.fullName}</RowLink> },
        { header: "Fonction", cell: (member) => member.position, hideOnMobile: true },
        { header: "Instance", cell: (member) => TEAM_GROUP_LABELS[member.teamGroup], hideOnMobile: true },
        { header: "Site", cell: (member) => <VisibilityBadge on={member.isActive} labels={{ on: "Actif", off: "Inactif" }} /> },
        { header: "Ordre", cell: (member, index) => <MoveButtons ids={ids} index={index} name={member.fullName} action={reorderTeamMembers} /> },
        {
          header: <span className="sr-only">Actions</span>,
          cell: (member) => (
            <Actions>
              <ToggleButton
                on={member.isActive}
                name={member.fullName}
                labels={ACTIVE_LABELS}
                action={(next) => setTeamMemberActive({ id: member.id, active: next })}
              />
              <EditLink href={`/admin/equipe/${member.id}`} name={member.fullName} />
              <DeleteButton name={member.fullName} action={() => deleteTeamMember({ id: member.id })} />
            </Actions>
          ),
        },
      ]}
    />
  );
}

export function CampaignTable({ campaigns }: { campaigns: AdminCampaignListItem[] }) {
  return (
    <DataTable
      caption="Appels aux dons"
      rows={campaigns}
      rowKey={(campaign) => campaign.id}
      columns={[
        { header: "Titre", cell: (campaign) => <RowLink href={`/admin/appels-aux-dons/${campaign.id}`}>{campaign.title}</RowLink> },
        { header: "Site", cell: (campaign) => <VisibilityBadge on={campaign.isActive} labels={{ on: "Actif", off: "Inactif" }} /> },
        {
          header: "Objectif",
          cell: (campaign) => (campaign.goalAmount ? <span className="whitespace-nowrap">{formatFcfa(campaign.goalAmount)}</span> : "—"),
          hideOnMobile: true,
        },
        {
          header: "Dates",
          cell: (campaign) =>
            campaign.startsOn || campaign.endsOn ? (
              <span className="text-small">
                {campaign.startsOn ? `du ${formatDate(campaign.startsOn)}` : ""} {campaign.endsOn ? `au ${formatDate(campaign.endsOn)}` : ""}
              </span>
            ) : (
              "—"
            ),
          hideOnMobile: true,
        },
        {
          header: <span className="sr-only">Actions</span>,
          cell: (campaign) => (
            <Actions>
              <ToggleButton
                on={campaign.isActive}
                name={campaign.title}
                labels={ACTIVE_LABELS}
                action={(next) => setCampaignActive({ id: campaign.id, active: next })}
              />
              <EditLink href={`/admin/appels-aux-dons/${campaign.id}`} name={campaign.title} />
              <DeleteButton
                name={campaign.title}
                action={() => deleteCampaign({ id: campaign.id })}
                warning="Un appel qui a déjà reçu des dons ne peut pas être supprimé : désactivez-le plutôt."
              />
            </Actions>
          ),
        },
      ]}
    />
  );
}
