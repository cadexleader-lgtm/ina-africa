"use client";

import { usePathname } from "next/navigation";

import type { NavItem } from "@/content/fr/site";
import { NavLinks } from "@/components/site/NavLinks";

/** Navigation de l'en-tête avec le lien actif (lit l'adresse : à placer sous <Suspense>). */
export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return <NavLinks items={items} pathname={pathname} layout="bar" />;
}
