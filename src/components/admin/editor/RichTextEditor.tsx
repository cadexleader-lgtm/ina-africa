"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { NodeSelection } from "@tiptap/pm/state";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import {
  Bold,
  Film,
  Heading2,
  Heading3,
  Heading4,
  ImageIcon,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import type { RichTextDoc } from "@/lib/validation/rich-text";

import { TextField } from "../contenus/fields";
import type { PublicMediaFolder } from "../contenus/labels";
import { ImageField } from "../media/ImageField";
import {
  checkVideoUrl,
  nextToolbarIndex,
  normalizeLinkInput,
  readableShortcut,
  starterKitOptions,
  TOOLBAR_GROUPS,
  type ToolbarCommand,
} from "./editor-config";
import { MediaImage, VideoEmbedNode } from "./extensions";
import { EditorPlaceholder } from "./EditorPlaceholder";
import { toClosedDoc } from "./rich-text-filter";

const ICONS: Record<ToolbarCommand, LucideIcon> = {
  paragraph: Pilcrow,
  heading2: Heading2,
  heading3: Heading3,
  heading4: Heading4,
  bold: Bold,
  italic: Italic,
  underline: UnderlineIcon,
  bulletList: List,
  orderedList: ListOrdered,
  blockquote: Quote,
  link: Link2,
  unlink: Link2Off,
  image: ImageIcon,
  video: Film,
  horizontalRule: Minus,
  undo: Undo2,
  redo: Redo2,
};

const ALL_ITEMS = TOOLBAR_GROUPS.flatMap((group) => group.items);

/** Groupes de la barre d'outils, chaque bouton avec sa position dans la barre. */
const INDEXED_GROUPS = TOOLBAR_GROUPS.map((group, groupIndex) => {
  const offset = TOOLBAR_GROUPS.slice(0, groupIndex).reduce((total, previous) => total + previous.items.length, 0);
  return { label: group.label, items: group.items.map((item, index) => ({ ...item, index: offset + index })) };
});

/** Mise en forme du texte dans l'éditeur (jetons du design system uniquement). */
const CONTENT_CLASSES = cn(
  "min-h-64 max-h-[70vh] overflow-y-auto px-4 py-3 text-body text-ink focus:outline-none",
  "[&_p]:my-3 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-h3 [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-h4 [&_h4]:mt-4 [&_h4]:mb-1 [&_h4]:text-body [&_h4]:font-bold",
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li_p]:my-1",
  "[&_blockquote]:my-4 [&_blockquote]:border-l-[3px] [&_blockquote]:border-gold [&_blockquote]:pl-5 [&_blockquote]:font-semibold [&_blockquote]:text-brand",
  "[&_a]:text-link [&_a]:underline [&_u]:underline [&_strong]:font-semibold [&_hr]:my-5 [&_hr]:border-line",
  "[&_figure]:my-4 [&_figure]:max-w-md [&_figure_img]:rounded-card [&_figure_img]:bg-ivory [&_figcaption]:mt-2 [&_figcaption]:text-small [&_figcaption]:text-muted",
  "[&_[data-video-url]]:my-4 [&_[data-video-url]]:flex [&_[data-video-url]]:flex-col [&_[data-video-url]]:gap-1 [&_[data-video-url]]:rounded-card [&_[data-video-url]]:border [&_[data-video-url]]:border-line [&_[data-video-url]]:bg-ivory [&_[data-video-url]]:p-4 [&_[data-video-url]_span]:text-small [&_[data-video-url]_span]:break-all [&_[data-video-url]_span]:text-muted",
  "[&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-offset-2 [&_.ProseMirror-selectednode]:outline-link",
);

type ToolbarState = Record<ToolbarCommand, { active: boolean; disabled: boolean }>;

function readToolbarState(editor: Editor): ToolbarState {
  const isImage = editor.state.selection instanceof NodeSelection && editor.state.selection.node.type.name === "image";
  const isVideo = editor.state.selection instanceof NodeSelection && editor.state.selection.node.type.name === "video";
  const can = editor.can();
  return {
    paragraph: { active: editor.isActive("paragraph"), disabled: false },
    heading2: { active: editor.isActive("heading", { level: 2 }), disabled: false },
    heading3: { active: editor.isActive("heading", { level: 3 }), disabled: false },
    heading4: { active: editor.isActive("heading", { level: 4 }), disabled: false },
    bold: { active: editor.isActive("bold"), disabled: !can.toggleBold() },
    italic: { active: editor.isActive("italic"), disabled: !can.toggleItalic() },
    underline: { active: editor.isActive("underline"), disabled: !can.toggleUnderline() },
    bulletList: { active: editor.isActive("bulletList"), disabled: false },
    orderedList: { active: editor.isActive("orderedList"), disabled: false },
    blockquote: { active: editor.isActive("blockquote"), disabled: false },
    link: { active: editor.isActive("link"), disabled: isImage || isVideo },
    unlink: { active: false, disabled: !editor.isActive("link") },
    image: { active: isImage, disabled: false },
    video: { active: isVideo, disabled: false },
    horizontalRule: { active: false, disabled: false },
    undo: { active: false, disabled: !can.undo() },
    redo: { active: false, disabled: !can.redo() },
  };
}

type Dialog = "link" | "image" | "video" | null;

export type RichTextEditorProps = {
  id: string;
  /** Identifiant du libellé visible (aria-labelledby). */
  labelId: string;
  describedBy?: string;
  invalid?: boolean;
  value: RichTextDoc | null;
  onChange: (doc: RichTextDoc) => void;
  /** Dossier de la médiathèque pour les photos envoyées depuis l'éditeur. */
  folder: PublicMediaFolder;
};

/**
 * Éditeur de texte riche (Tiptap), limité à la liste fermée du site.
 * Barre d'outils accessible : un seul arrêt de tabulation, flèches pour
 * passer d'un bouton à l'autre, état des boutons annoncé (aria-pressed).
 */
export default function RichTextEditor({ id, labelId, describedBy, invalid, value, onChange, folder }: RichTextEditorProps) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const toolbarId = useId();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure(starterKitOptions()), MediaImage, VideoEmbedNode],
    content: value ?? { type: "doc", content: [] },
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelId,
        ...(describedBy ? { "aria-describedby": `${describedBy} ${toolbarId}-aide` } : { "aria-describedby": `${toolbarId}-aide` }),
        ...(invalid ? { "aria-invalid": "true" } : {}),
        class: CONTENT_CLASSES,
      },
    },
    onUpdate: ({ editor: current }) => onChange(toClosedDoc(current.getJSON())),
  });

  const state = useEditorState({ editor, selector: ({ editor: current }) => (current ? readToolbarState(current) : null) });

  if (!editor || !state) {
    return <EditorPlaceholder />;
  }

  function run(command: ToolbarCommand) {
    if (!editor) return;
    const chain = editor.chain().focus();
    switch (command) {
      case "paragraph":
        chain.setParagraph().run();
        break;
      case "heading2":
        chain.toggleHeading({ level: 2 }).run();
        break;
      case "heading3":
        chain.toggleHeading({ level: 3 }).run();
        break;
      case "heading4":
        chain.toggleHeading({ level: 4 }).run();
        break;
      case "bold":
        chain.toggleBold().run();
        break;
      case "italic":
        chain.toggleItalic().run();
        break;
      case "underline":
        chain.toggleUnderline().run();
        break;
      case "bulletList":
        chain.toggleBulletList().run();
        break;
      case "orderedList":
        chain.toggleOrderedList().run();
        break;
      case "blockquote":
        chain.toggleBlockquote().run();
        break;
      case "horizontalRule":
        chain.setHorizontalRule().run();
        break;
      case "unlink":
        chain.extendMarkRange("link").unsetLink().run();
        break;
      case "undo":
        chain.undo().run();
        break;
      case "redo":
        chain.redo().run();
        break;
      case "link":
      case "image":
      case "video":
        setDialog(command);
        break;
    }
  }

  function onToolbarKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = nextToolbarIndex(focusIndex, event.key, ALL_ITEMS.length);
    if (next === null) return;
    event.preventDefault();
    setFocusIndex(next);
    buttonsRef.current[next]?.focus();
  }

  const closeDialog = () => {
    setDialog(null);
    editor.commands.focus();
  };

  return (
    <div className={cn("overflow-hidden rounded-field border bg-white", invalid ? "border-danger" : "border-line-strong")}>
      <div
        role="toolbar"
        aria-label="Mise en forme du texte"
        aria-controls={id}
        onKeyDown={onToolbarKeyDown}
        className="flex flex-wrap gap-x-3 gap-y-1 border-b border-line bg-ivory p-1.5"
      >
        {INDEXED_GROUPS.map((group) => (
          <div key={group.label} role="group" aria-label={group.label} className="flex flex-wrap gap-0.5">
            {group.items.map((item) => {
              const index = item.index;
              const Icon = ICONS[item.command];
              const itemState = state[item.command];
              const title = item.shortcut ? `${item.label} (${readableShortcut(item.shortcut)})` : item.label;
              return (
                <button
                  key={item.command}
                  ref={(element) => {
                    buttonsRef.current[index] = element;
                  }}
                  type="button"
                  tabIndex={index === focusIndex ? 0 : -1}
                  aria-pressed={item.toggle ? itemState.active : undefined}
                  aria-disabled={itemState.disabled || undefined}
                  aria-keyshortcuts={item.shortcut}
                  aria-label={item.label}
                  title={title}
                  onFocus={() => setFocusIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (!itemState.disabled) run(item.command);
                  }}
                  className={cn(
                    "inline-flex size-10 items-center justify-center rounded-field text-brand transition-colors duration-(--duration-fast) hover:bg-brand-50",
                    itemState.active && "bg-brand text-white hover:bg-brand-strong",
                    itemState.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                  )}
                >
                  <Icon aria-hidden="true" className="size-4.5" />
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p id={`${toolbarId}-aide`} className="sr-only">
        Barre d&apos;outils au-dessus du texte : Maj+Tab depuis le texte, puis les flèches pour choisir un bouton.
      </p>
      <EditorContent editor={editor} />

      {dialog === "link" && <LinkDialog editor={editor} onClose={closeDialog} />}
      {dialog === "image" && <ImageDialog editor={editor} folder={folder} onClose={closeDialog} />}
      {dialog === "video" && <VideoDialog editor={editor} onClose={closeDialog} />}
    </div>
  );
}


/** Entrée dans un champ d'une fenêtre : valide la fenêtre, jamais le formulaire de la page. */
function enterSubmits(submit: () => void) {
  return (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.defaultPrevented && event.target instanceof HTMLInputElement && event.target.type !== "file") {
      event.preventDefault();
      submit();
    }
  };
}

function LinkDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const current = (editor.getAttributes("link").href as string | undefined) ?? "";
  const emptySelection = editor.state.selection.empty && !editor.isActive("link");
  const [href, setHref] = useState(current);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  function submit() {
    const check = normalizeLinkInput(href);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    if (emptySelection && !text.trim()) {
      setTextError("Indiquez le texte affiché pour ce lien.");
      return;
    }
    if (emptySelection) {
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: text.trim(), marks: [{ type: "link", attrs: { href: check.href } }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: check.href }).run();
    }
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={current ? "Modifier le lien" : "Ajouter un lien"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit}>Enregistrer le lien</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5" onKeyDown={enterSubmits(submit)}>
        <TextField
          id="editeur-lien-adresse"
          label="Adresse du lien"
          hint="Site web en https://… ou adresse email (ex. contact@exemple.org)."
          type="url"
          required
          value={href}
          error={error}
          onChange={(next) => {
            setHref(next);
            setError(null);
          }}
        />
        {emptySelection && (
          <TextField
            id="editeur-lien-texte"
            label="Texte du lien"
            hint="Le texte cliquable : décrivez la destination (évitez « cliquez ici »)."
            required
            value={text}
            error={textError}
            onChange={(next) => {
              setText(next);
              setTextError(null);
            }}
          />
        )}
      </div>
    </Modal>
  );
}

function ImageDialog({ editor, folder, onClose }: { editor: Editor; folder: PublicMediaFolder; onClose: () => void }) {
  const selection = editor.state.selection;
  const selected = selection instanceof NodeSelection && selection.node.type.name === "image" ? selection.node : null;
  const [path, setPath] = useState<string>(selected ? String(selected.attrs.path ?? "") : "");
  const [alt, setAlt] = useState<string>(selected ? String(selected.attrs.alt ?? "") : "");
  const [caption, setCaption] = useState<string>(selected ? String(selected.attrs.caption ?? "") : "");
  const [errors, setErrors] = useState<{ path?: string; alt?: string }>({});

  function submit() {
    const next: { path?: string; alt?: string } = {};
    if (!path) next.path = "Envoyez une photo ou choisissez-en une dans la médiathèque.";
    if (path && !alt.trim()) next.alt = "Ajoutez un texte alternatif qui décrit l'image.";
    setErrors(next);
    if (next.path || next.alt) return;
    const attrs = { path, alt: alt.trim(), caption: caption.trim() };
    if (selected) editor.chain().focus().updateAttributes("image", attrs).run();
    else editor.chain().focus().insertContent({ type: "image", attrs }).run();
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={selected ? "Modifier l'image" : "Insérer une image"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit}>{selected ? "Enregistrer l'image" : "Insérer l'image"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5" onKeyDown={enterSubmits(submit)}>
        <ImageField
          label="Image"
          folder={folder}
          path={path}
          alt={alt}
          pathError={errors.path}
          altError={errors.alt}
          onChange={(value) => {
            setPath(value.path);
            setAlt(value.alt);
            setErrors({});
          }}
        />
        <TextField
          id="editeur-image-legende"
          label="Légende (facultative)"
          hint="Affichée sous l'image, ex. le lieu et la date."
          max={300}
          value={caption}
          onChange={setCaption}
        />
      </div>
    </Modal>
  );
}

function VideoDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const selection = editor.state.selection;
  const selected = selection instanceof NodeSelection && selection.node.type.name === "video" ? selection.node : null;
  const [url, setUrl] = useState<string>(selected ? String(selected.attrs.url ?? "") : "");
  const [title, setTitle] = useState<string>(selected ? String(selected.attrs.title ?? "") : "");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const check = checkVideoUrl(url);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    const attrs = { provider: check.provider, url: check.url, title: title.trim() };
    if (selected) editor.chain().focus().updateAttributes("video", attrs).run();
    else editor.chain().focus().insertContent({ type: "video", attrs }).run();
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={selected ? "Modifier la vidéo" : "Insérer une vidéo"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit}>{selected ? "Enregistrer la vidéo" : "Insérer la vidéo"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5" onKeyDown={enterSubmits(submit)}>
        <TextField
          id="editeur-video-adresse"
          label="Adresse de la vidéo"
          hint="Lien de partage YouTube ou Facebook (https://…)."
          type="url"
          required
          value={url}
          error={error}
          onChange={(next) => {
            setUrl(next);
            setError(null);
          }}
        />
        <TextField
          id="editeur-video-titre"
          label="Titre de la vidéo (facultatif)"
          hint="Lu aux personnes malvoyantes avant la lecture."
          max={200}
          value={title}
          onChange={setTitle}
        />
      </div>
    </Modal>
  );
}
