"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Archive, ExternalLink, Send, Undo2, Upload, MessageSquareWarning } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button, LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/format";
import { EMPTY_DOC, type RichTextDoc } from "@/lib/validation/rich-text";
import {
  archiveArticle,
  createArticle,
  deleteArticle,
  publishArticle,
  rejectArticle,
  submitArticleForReview,
  unpublishArticle,
  updateArticle,
} from "@/server/actions/admin/articles";
import type { AdminArticle, AdminCategory } from "@/server/data/admin/types";
import type { ActionResult } from "@/server/errors";
import type { AppRole } from "@/server/auth/roles";

import { RichTextField } from "../../editor/RichTextField";
import { richTextProblems } from "../../editor/rich-text-filter";
import { ImageField } from "../../media/ImageField";
import { ContentForm } from "../ContentForm";
import { FieldGroup, SelectField, TextAreaField, TextField, TitleSlugFields } from "../fields";
import { fieldError, unmatchedErrors } from "../form-utils";
import { ARTICLE_STATUS_LABELS, ARTICLE_STATUS_TONES } from "../labels";
import { DeleteButton } from "../RowActions";
import { Panel, StatusBadge } from "../ui";
import { useActionForm, useFormValues } from "../useActionForm";
import { FormFeedback } from "../FormFeedback";

type ArticleValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: RichTextDoc;
  coverImagePath: string;
  coverImageAlt: string;
  categoryId: string;
  seoTitle: string;
  seoDescription: string;
};

const FIELD_KEYS = ["title", "slug", "excerpt", "content", "coverImagePath", "coverImageAlt", "categoryId", "seoTitle", "seoDescription", "id"];

function initialValues(article: AdminArticle | null): ArticleValues {
  return {
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    content: article?.content ?? EMPTY_DOC,
    coverImagePath: article?.coverImagePath ?? "",
    coverImageAlt: article?.coverImageAlt ?? "",
    categoryId: article?.categoryId ?? "",
    seoTitle: article?.seoTitle ?? "",
    seoDescription: article?.seoDescription ?? "",
  };
}

/**
 * Création / modification d'un article + circuit de publication.
 * Un éditeur ne voit que les actions qu'il peut faire (soumettre, supprimer
 * SES brouillons) ; un article publié ou archivé n'est modifiable que par un
 * administrateur (la base le refuse de toute façon).
 */
export function ArticleEditor({
  article,
  categories,
  role,
  userId,
}: {
  article: AdminArticle | null;
  categories: AdminCategory[];
  role: AppRole;
  userId: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { pending, errors, setErrors, feedback, setFeedback, feedbackRef, run } = useActionForm(formRef);
  const { values, set, patch, dirty, markSaved } = useFormValues(initialValues(article));
  const isAdmin = role === "admin" || role === "super_admin";
  const locked = article !== null && (article.status === "published" || article.status === "archived");
  const readOnly = locked && !isAdmin;

  function submit() {
    const problems = richTextProblems(values.content);
    if (problems.length) {
      setErrors({ content: problems });
      setFeedback({ tone: "error", message: "Certaines informations sont à corriger." });
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const snapshot = values;
    run(() => (article ? updateArticle({ id: article.id, ...snapshot }) : createArticle(snapshot)), {
      success: article ? "Article enregistré." : undefined,
      onSuccess: (data) => {
        markSaved(snapshot);
        if (!article) router.push(`/admin/articles/${data.id}?etat=cree`);
        else {
          patch({ slug: data.slug });
          router.refresh();
        }
      },
    });
  }

  const e = (key: string) => fieldError(errors, key);

  if (readOnly && article) {
    return (
      <div className="flex flex-col gap-6">
        <Alert tone="info" role="none" title="Article publié ou archivé">
          Seul un administrateur peut modifier un article publié ou archivé. Demandez-lui de le repasser en brouillon si
          une correction est nécessaire.
        </Alert>
        <ArticleWorkflow article={article} role={role} userId={userId} dirty={false} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row-reverse xl:items-start">
      {article && (
        <div className="xl:sticky xl:top-6 xl:w-80 xl:shrink-0">
          <ArticleWorkflow article={article} role={role} userId={userId} dirty={dirty} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <ContentForm
          formRef={formRef}
          onSubmit={submit}
          feedback={feedback}
          feedbackRef={feedbackRef}
          extraErrors={unmatchedErrors(errors, FIELD_KEYS)}
          pending={pending}
          dirty={dirty}
          submitLabel={article ? "Enregistrer" : "Créer le brouillon"}
        >
          <FieldGroup legend="Article">
            <TitleSlugFields
              idPrefix="article"
              title={values.title}
              slug={values.slug}
              titleLabel="Titre de l'article"
              titleMax={200}
              titleError={e("title")}
              slugError={e("slug")}
              locked={article !== null && article.status !== "draft"}
              publicPrefix="/actualites/"
              onChange={(next) => patch(next)}
            />
            <TextAreaField
              id="article-excerpt"
              label="Résumé"
              hint="Deux ou trois phrases affichées sur la liste des actualités et lors d'un partage."
              max={500}
              rows={3}
              value={values.excerpt}
              error={e("excerpt")}
              onChange={(value) => set("excerpt", value)}
            />
            <SelectField
              id="article-category"
              label="Catégorie"
              emptyLabel="Aucune catégorie"
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
              value={values.categoryId}
              error={e("categoryId")}
              onChange={(value) => set("categoryId", value)}
            />
            <RichTextField
              label="Texte de l'article"
              hint="Sous-titres, listes, liens, images de la médiathèque et vidéos YouTube ou Facebook."
              value={values.content}
              error={e("content")}
              folder="articles"
              onChange={(doc) => set("content", doc)}
            />
          </FieldGroup>

          <FieldGroup legend="Image de couverture" description="Affichée en haut de l'article et sur les cartes.">
            <ImageField
              label="Image de couverture"
              folder="articles"
              path={values.coverImagePath}
              alt={values.coverImageAlt}
              pathError={e("coverImagePath")}
              altError={e("coverImageAlt")}
              onChange={(value) => patch({ coverImagePath: value.path, coverImageAlt: value.alt })}
            />
          </FieldGroup>

          <SeoFields
            idPrefix="article"
            title={values.seoTitle}
            description={values.seoDescription}
            titleError={e("seoTitle")}
            descriptionError={e("seoDescription")}
            onChange={(next) => patch(next)}
          />
        </ContentForm>
      </div>
    </div>
  );
}

/** Référencement (Google) : titre et description facultatifs. */
export function SeoFields({
  idPrefix,
  title,
  description,
  titleError,
  descriptionError,
  onChange,
}: {
  idPrefix: string;
  title: string;
  description: string;
  titleError?: string | null;
  descriptionError?: string | null;
  onChange: (next: { seoTitle?: string; seoDescription?: string }) => void;
}) {
  return (
    <FieldGroup legend="Référencement (facultatif)" description="Pour Google et les partages. Laissés vides, le titre et le résumé sont utilisés.">
      <TextField
        id={`${idPrefix}-seo-title`}
        label="Titre pour Google"
        max={70}
        value={title}
        error={titleError}
        onChange={(value) => onChange({ seoTitle: value })}
      />
      <TextAreaField
        id={`${idPrefix}-seo-description`}
        label="Description pour Google"
        max={160}
        rows={2}
        value={description}
        error={descriptionError}
        onChange={(value) => onChange({ seoDescription: value })}
      />
    </FieldGroup>
  );
}

// ---------------------------------------------------------------------------
// Circuit de publication
// ---------------------------------------------------------------------------

type NoteDialog = "reject" | "unpublish" | null;

function ArticleWorkflow({
  article,
  role,
  userId,
  dirty,
}: {
  article: AdminArticle;
  role: AppRole;
  userId: string;
  dirty: boolean;
}) {
  const router = useRouter();
  const { pending, errors, feedback, feedbackRef, run } = useActionForm();
  const [noteDialog, setNoteDialog] = useState<NoteDialog>(null);
  const [note, setNote] = useState("");
  const isAdmin = role === "admin" || role === "super_admin";
  const status = article.status;
  const canDelete = isAdmin || (status === "draft" && article.authorId === userId);

  function act(action: () => Promise<ActionResult<unknown>>, success: string, after?: () => void) {
    run(action, {
      success,
      onSuccess: () => {
        after?.();
        router.refresh();
      },
    });
  }

  const disabled = pending || dirty;

  return (
    <Panel title="Publication">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-small text-muted">État :</span>
        <StatusBadge tone={ARTICLE_STATUS_TONES[status]}>{ARTICLE_STATUS_LABELS[status]}</StatusBadge>
      </div>
      <dl className="grid gap-1 text-small text-muted">
        {article.authorName && (
          <div>
            <dt className="inline">Auteur : </dt>
            <dd className="inline text-ink">{article.authorName}</dd>
          </div>
        )}
        {article.submittedAt && status === "in_review" && (
          <div>
            <dt className="inline">Soumis le : </dt>
            <dd className="inline text-ink">{formatDate(article.submittedAt)}</dd>
          </div>
        )}
        {article.publishedAt && (
          <div>
            <dt className="inline">Publié le : </dt>
            <dd className="inline text-ink">{formatDate(article.publishedAt)}</dd>
          </div>
        )}
      </dl>

      {article.reviewNote && status === "draft" && (
        <Alert tone="warning" role="none" title="Remarque de relecture">
          <p className="whitespace-pre-line">{article.reviewNote}</p>
        </Alert>
      )}

      <FormFeedback feedback={feedback} feedbackRef={feedbackRef} />
      {dirty && <p className="text-small text-muted">Enregistrez vos modifications avant de changer l&apos;état de l&apos;article.</p>}

      <div className="flex flex-col gap-2">
        {status === "draft" && (
          <Button
            variant={isAdmin ? "secondary" : "primary"}
            iconLeft={<Send />}
            disabled={disabled}
            onClick={() => act(() => submitArticleForReview({ id: article.id }), "Article soumis à la relecture.")}
          >
            Soumettre à la relecture
          </Button>
        )}
        {status === "in_review" && !isAdmin && (
          <p className="text-small text-muted">En attente de relecture par un administrateur.</p>
        )}
        {isAdmin && status !== "published" && (
          <Button
            iconLeft={<Upload />}
            disabled={disabled}
            onClick={() => act(() => publishArticle({ id: article.id }), "Article publié sur le site.")}
          >
            {status === "archived" ? "Publier à nouveau" : "Publier"}
          </Button>
        )}
        {isAdmin && status === "in_review" && (
          <Button variant="secondary" iconLeft={<MessageSquareWarning />} disabled={disabled} onClick={() => setNoteDialog("reject")}>
            Renvoyer à l&apos;auteur
          </Button>
        )}
        {isAdmin && (status === "published" || status === "archived") && (
          <Button variant="secondary" iconLeft={<Undo2 />} disabled={disabled} onClick={() => setNoteDialog("unpublish")}>
            Repasser en brouillon
          </Button>
        )}
        {isAdmin && status !== "archived" && (
          <Button
            variant="ghost"
            iconLeft={<Archive />}
            disabled={disabled}
            onClick={() => act(() => archiveArticle({ id: article.id }), "Article archivé : il n'est plus visible sur le site.")}
          >
            Archiver
          </Button>
        )}
        {status === "published" && (
          <LinkButton href={`/actualites/${article.slug}`} external variant="link" size="sm" iconLeft={<ExternalLink />}>
            Voir l&apos;article sur le site
          </LinkButton>
        )}
        {canDelete && (
          <div className="border-t border-line pt-3">
            <DeleteButton
              name={article.title}
              label="Supprimer l'article"
              action={() => deleteArticle({ id: article.id })}
              onDeleted={() => router.push("/admin/articles?etat=supprime")}
            />
          </div>
        )}
      </div>

      <Modal
        open={noteDialog !== null}
        onClose={() => setNoteDialog(null)}
        title={noteDialog === "reject" ? "Renvoyer l'article à son auteur" : "Repasser l'article en brouillon"}
        description={
          noteDialog === "reject"
            ? "L'article redevient un brouillon. Expliquez ce qu'il faut corriger."
            : "L'article ne sera plus visible sur le site. La remarque est facultative."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setNoteDialog(null)}>
              Annuler
            </Button>
            <Button
              loading={pending}
              onClick={() =>
                act(
                  () =>
                    noteDialog === "reject"
                      ? rejectArticle({ id: article.id, reviewNote: note })
                      : unpublishArticle({ id: article.id, reviewNote: note }),
                  noteDialog === "reject" ? "Article renvoyé à son auteur." : "Article repassé en brouillon.",
                  () => {
                    setNoteDialog(null);
                    setNote("");
                  },
                )
              }
            >
              {noteDialog === "reject" ? "Renvoyer" : "Repasser en brouillon"}
            </Button>
          </>
        }
      >
        <TextAreaField
          id="article-review-note"
          label={noteDialog === "reject" ? "Remarque pour l'auteur" : "Remarque (facultative)"}
          required={noteDialog === "reject"}
          max={2000}
          rows={4}
          value={note}
          error={fieldError(errors, "reviewNote")}
          onChange={setNote}
        />
      </Modal>
    </Panel>
  );
}
