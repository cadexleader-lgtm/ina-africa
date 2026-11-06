import { describe, expect, it } from "vitest";

import { isTeamGroup, TEAM_GROUPS } from "@/lib/team";
import { teamMemberInputSchema } from "@/lib/validation/admin/content";

const base = { fullName: "DJOSSOU Wilfried", position: "Président", displayOrder: 10 };

describe("instances de l'équipe", () => {
  it("connaît les trois instances, dans l'ordre d'affichage", () => {
    expect(TEAM_GROUPS.map((group) => group.value)).toEqual(["conseil_administration", "conseil_surveillance", "adjoints"]);
    expect(isTeamGroup("conseil_surveillance")).toBe(true);
    expect(isTeamGroup("bureau")).toBe(false);
  });

  it("range un membre au conseil d'administration par défaut", () => {
    const parsed = teamMemberInputSchema.safeParse(base);
    expect(parsed.success && parsed.data.teamGroup).toBe("conseil_administration");
  });

  it("accepte une instance connue et refuse une instance inconnue", () => {
    expect(teamMemberInputSchema.safeParse({ ...base, teamGroup: "adjoints" }).success).toBe(true);
    expect(teamMemberInputSchema.safeParse({ ...base, teamGroup: "bureau" }).success).toBe(false);
  });
});
