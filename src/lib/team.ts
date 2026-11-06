/**
 * Instances de l'ONG auxquelles appartient un membre de l'équipe
 * (colonne team_members.team_group, migration 20261106110000_team_groups).
 * L'ordre ci-dessous est l'ordre d'affichage sur le site.
 */
export const TEAM_GROUPS = [
  { value: "conseil_administration", label: "Conseil d'administration" },
  { value: "conseil_surveillance", label: "Conseil de surveillance" },
  { value: "adjoints", label: "Adjoints aux membres de l'administration" },
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
