"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";

import { Button, type ButtonVariant } from "@/components/ui/Button";
import { signOutAction } from "@/server/auth/actions";

import { AUTH_TEXT } from "./auth-texts";

function SubmitButton({ variant }: { variant: ButtonVariant }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size="sm"
      loading={pending}
      loadingLabel={AUTH_TEXT.common.signingOut}
      iconLeft={<LogOut />}
    >
      {AUTH_TEXT.common.signOut}
    </Button>
  );
}

/** Bouton de déconnexion (Server Action, fonctionne sans JavaScript). */
export function SignOutButton({ variant = "secondary" }: { variant?: ButtonVariant }) {
  return (
    <form action={signOutAction}>
      <SubmitButton variant={variant} />
    </form>
  );
}
