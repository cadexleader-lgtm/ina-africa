import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ChevronDown, CircleAlert } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Champs de formulaire accessibles, utilisables dans les composants serveur
 * ET client (aucun hook) :
 *  - le libellé est relié au champ (htmlFor/id) ;
 *  - l'aide et l'erreur sont reliées par aria-describedby ;
 *  - aria-invalid est posé en cas d'erreur ;
 *  - le message d'erreur est un texte (pas seulement une couleur).
 *
 * Exemple :
 *   <FormField id="email" label="Adresse email" hint="Nous ne la partageons pas." error={errors.email} required>
 *     {(field) => <Input type="email" name="email" autoComplete="email" {...field} />}
 *   </FormField>
 */

export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
};

type FormFieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  /** Message d'erreur (affiché sous le champ, lu par les lecteurs d'écran). */
  error?: string | null;
  required?: boolean;
  /** Masquer visuellement le libellé (il reste lu). À éviter sauf champ de recherche explicite. */
  hideLabel?: boolean;
  className?: string;
  children: (field: FieldControlProps) => ReactNode;
};

const REQUIRED_MARK = (
  <span className="text-danger" aria-hidden="true">
    {" "}
    *
  </span>
);

export function FormField({ id, label, hint, error, required = false, hideLabel = false, className, children }: FormFieldProps) {
  const hintId = hint ? `${id}-aide` : undefined;
  const errorId = error ? `${id}-erreur` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className={cn("text-small font-semibold text-brand", hideLabel && "sr-only")}>
        {label}
        {required && REQUIRED_MARK}
      </label>
      {hint && (
        <p id={hintId} className="-mt-1 text-small text-muted">
          {hint}
        </p>
      )}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, required })}
      {error && <FieldError id={`${id}-erreur`}>{error}</FieldError>}
    </div>
  );
}

/** Message d'erreur d'un champ. */
export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-small font-medium text-danger">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

const CONTROL =
  "w-full rounded-field border border-line-strong bg-white px-4 text-body text-ink " +
  "placeholder:text-muted transition-[border-color,box-shadow] duration-(--duration-fast) " +
  "hover:border-brand focus-visible:border-link focus-visible:outline-2 focus-visible:outline-offset-0 " +
  "aria-invalid:border-danger aria-invalid:bg-danger-50/40 " +
  "disabled:cursor-not-allowed disabled:bg-ivory disabled:text-muted";

/** Classes d'un champ texte, pour un élément personnalisé. */
export const controlClasses = CONTROL;

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(CONTROL, "h-12", className)} {...props} />;
}

export function Textarea({ className, rows = 5, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea rows={rows} className={cn(CONTROL, "min-h-32 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentPropsWithoutRef<"select">) {
  return (
    <div className="relative">
      <select className={cn(CONTROL, "h-12 cursor-pointer appearance-none pr-11", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-brand"
      />
    </div>
  );
}

type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "id"> & {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
};

/**
 * Case à cocher avec son libellé à droite (consentement, choix multiples).
 * Utilise la case native (accessible), colorée aux couleurs du site.
 */
export function Checkbox({ id, label, hint, error, required, className, ...props }: CheckboxProps) {
  const hintId = hint ? `${id}-aide` : undefined;
  const errorId = error ? `${id}-erreur` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          required={required}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-brand aria-invalid:outline-2 aria-invalid:outline-offset-2 aria-invalid:outline-danger"
          {...props}
        />
        <label htmlFor={id} className="cursor-pointer text-body leading-snug text-ink">
          {label}
          {required && REQUIRED_MARK}
        </label>
      </div>
      {hint && (
        <p id={hintId} className="pl-8 text-small text-muted">
          {hint}
        </p>
      )}
      {error && (
        <div className="pl-8">
          <FieldError id={`${id}-erreur`}>{error}</FieldError>
        </div>
      )}
    </div>
  );
}
