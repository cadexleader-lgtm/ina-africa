"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Pencil, Plus, Tags } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { createCategory, deleteCategory, reorderCategories, updateCategory } from "@/server/actions/admin/articles";
import type { AdminCategory } from "@/server/data/admin/types";

import { FormFeedback } from "../FormFeedback";
import { TextAreaField, TitleSlugFields } from "../fields";
import { fieldError, unmatchedErrors } from "../form-utils";
import { ListAnnouncer } from "../ListAnnouncer";
import { announce, DeleteButton, MoveButtons } from "../RowActions";
import { DataTable } from "../ui";
import { useActionForm, useFormValues } from "../useActionForm";

/** Catégories du blog : liste ordonnée, création et modification dans une fenêtre. */
export function CategoryManager({ categories }: { categories: AdminCategory[] }) {
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const ids = categories.map((category) => category.id);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Button iconLeft={<Plus />} onClick={() => setEditing("new")}>
          Nouvelle catégorie
        </Button>
      </div>
      <ListAnnouncer />
      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          surface="white"
          title="Aucune catégorie"
          description="Les catégories rangent les articles (ex. Éducation, Santé). Elles sont facultatives."
        />
      ) : (
        <DataTable
          caption="Catégories des articles, dans l'ordre d'affichage"
          rows={categories}
          rowKey={(category) => category.id}
          columns={[
            { header: "Nom", cell: (category) => <span className="font-semibold text-brand">{category.name}</span> },
            { header: "Adresse", cell: (category) => <span className="text-small text-muted">{category.slug}</span>, hideOnMobile: true },
            {
              header: "Description",
              cell: (category) => <span className="text-small">{category.description ?? "—"}</span>,
              hideOnMobile: true,
            },
            {
              header: "Ordre",
              cell: (category, index) => <MoveButtons ids={ids} index={index} name={category.name} action={reorderCategories} />,
            },
            {
              header: <span className="sr-only">Actions</span>,
              cell: (category) => (
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="ghost" iconLeft={<Pencil />} onClick={() => setEditing(category)} aria-label={`Modifier : ${category.name}`}>
                    Modifier
                  </Button>
                  <DeleteButton
                    name={category.name}
                    action={() => deleteCategory({ id: category.id })}
                    warning="Les articles de cette catégorie sont conservés, sans catégorie."
                  />
                </div>
              ),
            },
          ]}
        />
      )}
      {editing && (
        <CategoryDialog
          category={editing === "new" ? null : editing}
          nextOrder={categories.length + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function CategoryDialog({ category, nextOrder, onClose }: { category: AdminCategory | null; nextOrder: number; onClose: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { pending, errors, feedback, feedbackRef, run } = useActionForm(formRef);
  const { values, patch, set } = useFormValues({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
  });

  function submit() {
    const input = { ...values, displayOrder: category?.displayOrder ?? nextOrder };
    run(() => (category ? updateCategory({ id: category.id, ...input }) : createCategory(input)), {
      onSuccess: () => {
        announce(category ? `Catégorie enregistrée : ${values.name}` : `Catégorie créée : ${values.name}`);
        onClose();
        router.refresh();
      },
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? "Modifier la catégorie" : "Nouvelle catégorie"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="categorie-formulaire" loading={pending} loadingLabel="Enregistrement…">
            Enregistrer
          </Button>
        </>
      }
    >
      <form
        id="categorie-formulaire"
        ref={formRef}
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <FormFeedback feedback={feedback} feedbackRef={feedbackRef} extra={unmatchedErrors(errors, ["name", "slug", "description"])} />
        <TitleSlugFields
          idPrefix="categorie"
          title={values.name}
          slug={values.slug}
          titleLabel="Nom de la catégorie"
          titleMax={80}
          titleError={fieldError(errors, "name")}
          slugError={fieldError(errors, "slug")}
          locked={category !== null}
          publicPrefix="/actualites?categorie="
          onChange={(next) => patch({ name: next.title, slug: next.slug })}
        />
        <TextAreaField
          id="categorie-description"
          label="Description (facultative)"
          max={500}
          rows={3}
          value={values.description}
          error={fieldError(errors, "description")}
          onChange={(value) => set("description", value)}
        />
      </form>
    </Modal>
  );
}
