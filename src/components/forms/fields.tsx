"use client";

import type { ReactNode } from "react";

import { FormField, Input, Textarea } from "@/components/ui/FormField";
import type { FieldHelpers } from "@/components/forms/PublicForm";
import { FORM_TEXT } from "@/content/fr/forms";
import { LIMITS } from "@/lib/validation/forms";

/** Libellé d'un champ facultatif : « Profession (facultatif) ». */
export function optionalLabel(label: ReactNode): ReactNode {
  return (
    <>
      {label} <span className="font-normal text-muted">({FORM_TEXT.common.optional})</span>
    </>
  );
}

type LineFieldProps = {
  field: FieldHelpers;
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  maxLength: number;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  className?: string;
};

/** Champ d'une ligne relié à son libellé, son aide et son erreur. */
export function LineField({
  field,
  name,
  label,
  hint,
  required = false,
  maxLength,
  type = "text",
  autoComplete,
  inputMode,
  className,
}: LineFieldProps) {
  return (
    <FormField
      id={field.id(name)}
      label={required ? label : optionalLabel(label)}
      hint={hint}
      error={field.error(name)}
      required={required}
      className={className}
    >
      {(control) => (
        <Input
          name={name}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          defaultValue={field.value(name)}
          {...control}
        />
      )}
    </FormField>
  );
}

type TextFieldProps = {
  field: FieldHelpers;
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  maxLength: number;
  rows?: number;
  className?: string;
};

/** Texte long. */
export function TextAreaField({ field, name, label, hint, required = false, maxLength, rows = 5, className }: TextFieldProps) {
  return (
    <FormField
      id={field.id(name)}
      label={required ? label : optionalLabel(label)}
      hint={hint}
      error={field.error(name)}
      required={required}
      className={className}
    >
      {(control) => <Textarea name={name} rows={rows} maxLength={maxLength} defaultValue={field.value(name)} {...control} />}
    </FormField>
  );
}

export function NameField({ field, label = FORM_TEXT.fields.fullName }: { field: FieldHelpers; label?: string }) {
  return <LineField field={field} name="fullName" label={label} required maxLength={LIMITS.fullName.max} autoComplete="name" />;
}

export function EmailField({ field, hint, label = FORM_TEXT.fields.email }: { field: FieldHelpers; hint?: string; label?: string }) {
  return (
    <LineField
      field={field}
      name="email"
      type="email"
      inputMode="email"
      label={label}
      hint={hint}
      required
      maxLength={LIMITS.email}
      autoComplete="email"
    />
  );
}

export function PhoneField({
  field,
  required = false,
  label = FORM_TEXT.fields.phone,
}: {
  field: FieldHelpers;
  required?: boolean;
  label?: string;
}) {
  return (
    <LineField
      field={field}
      name="phone"
      type="tel"
      inputMode="tel"
      label={label}
      hint={FORM_TEXT.fields.phoneHint}
      required={required}
      maxLength={LIMITS.phone.max}
      autoComplete="tel"
    />
  );
}
