/**
 * Instances de l'ONG auxquelles appartient un membre de l'équipe
 * (colonne team_members.team_group, migrations 20261106110000_team_groups et
 * 20261120090000_team_group_communication).
 * L'ordre ci-dessous est l'ordre d'affichage sur le site.
 */
export const TEAM_GROUPS = [
  {
    value: "conseil_administration",
    label: "Conseil d'administration",
    description: "Il dirige l'ONG et conduit ses actions.",
  },
  {
    value: "conseil_surveillance",
    label: "Conseil de surveillance",
    description: "Contrôle, suivi et bonne gouvernance, sans intervenir dans la gestion quotidienne.",
  },
  {
    value: "conseil_communication",
    label: "Conseil de communication",
    description:
      "Il veille à faire connaître l'ONG, à valoriser ses actions et à renforcer son image, sa notoriété et sa crédibilité auprès du public et des partenaires.",
  },
  {
    value: "adjoints",
    label: "Adjoints aux membres de l'administration",
    description: "Ils assistent les responsables dans leurs actions et missions.",
  },
  {
    value: "conseillers",
    label: "Conseillers",
    description: "Ils apportent à l'ONG un appui technique et stratégique.",
  },
] as const;

export type TeamGroup = (typeof TEAM_GROUPS)[number]["value"];

export const TEAM_GROUP_VALUES = TEAM_GROUPS.map((group) => group.value) as [TeamGroup, ...TeamGroup[]];

export const TEAM_GROUP_LABELS = Object.fromEntries(TEAM_GROUPS.map((group) => [group.value, group.label])) as Record<
  TeamGroup,
  string
>;

export const DEFAULT_TEAM_GROUP: TeamGroup = "conseil_administration";

export function isTeamGroup(value: unknown): value is TeamGroup {
  return typeof value === "string" && (TEAM_GROUP_VALUES as string[]).includes(value);
}
