import { describe, expect, it } from "vitest";

import { robotsWithAdmin } from "@/app/robots";
import { robotsRules } from "@/lib/seo/robots";

describe("robots.txt : administration interdite", () => {
  it("site en ligne : /admin et /auth interdits, le reste inchangé", () => {
    const robots = robotsWithAdmin(robotsRules(true));
    expect(robots.rules).toMatchObject({ userAgent: "*", allow: "/" });
    const rules = robots.rules as { disallow: string[] };
    expect(rules.disallow).toEqual(expect.arrayContaining(["/admin", "/auth", "/styleguide"]));
    expect(new Set(rules.disallow).size).toBe(rules.disallow.length);
    expect(robots.sitemap).toBeDefined();
  });

  it("site en construction : tout reste interdit", () => {
    expect(robotsWithAdmin(robotsRules(false))).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("gère plusieurs règles", () => {
    const robots = robotsWithAdmin({ rules: [{ userAgent: "a", allow: "/" }, { userAgent: "b", disallow: "/prive" }] });
    expect(robots.rules).toEqual([
      { userAgent: "a", allow: "/", disallow: ["/admin", "/auth"] },
      { userAgent: "b", disallow: ["/prive", "/admin", "/auth"] },
    ]);
  });
});
