import type { Metadata } from "next";

import { CategoryManager } from "@/components/admin/contenus/forms/CategoryManager";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminCategories } from "@/server/data/admin/articles";

export const instant = false;

export const metadata: Metadata = { title: "Catégories" };

export default async function CategoriesPage() {
  await requireAdminPage("admin");
  const categories = await listAdminCategories();
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Catégories des articles"
        description="Elles rangent les actualités du site. L'ordre ci-dessous est celui des onglets de la page Actualités."
      />
      <CategoryManager categories={categories} />
    </div>
  );
}
