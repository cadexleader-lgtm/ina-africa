"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Send, ShieldOff, Trash2, UserCog } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/FormField";
import { changeMemberRole, deleteMemberAccount, inviteMember, revokeMemberAccess } from "@/server/actions/admin/accounts";
import { ROLE_LABELS, type AppRole } from "@/server/auth/roles";

import { ConfirmDialog, toOutcome } from "./ConfirmDialog";
import { LiveStatus, type LiveMessage } from "./LiveStatus";

/** Ce que permet chaque rôle (affiché à l'invitation et au changement de rôle). */
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  editor: "Écrit des articles et les soumet à la relecture, ajoute des photos à la médiathèque.",
  admin:
    "Publie et gère tout le contenu du site, les dons, les demandes et la lettre d'information. Double authentification obligatoire.",
  super_admin:
    "Comme un administrateur, et gère en plus les comptes et les rôles. Double authentification obligatoire.",
};

const ROLES: AppRole[] = ["editor", "admin", "super_admin"];

// ---------------------------------------------------------------------------
// Invitation
// ---------------------------------------------------------------------------

/** Invitation d'un nouveau membre : il reçoit un email pour choisir son mot de passe. */
export function InviteMemberForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<AppRole>("editor");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [message, setMessage] = useState<LiveMessage>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setMessage(null);
    try {
      const result = await inviteMember({ email: data.get("email"), fullName: data.get("fullName"), role });
      if (result.ok) {
        setErrors({});
        formRef.current?.reset();
        setRole("editor");
        setMessage({
          tone: "success",
          text: `Invitation envoyée à ${result.data.email} (${ROLE_LABELS[role]}). La personne doit suivre le lien reçu pour choisir son mot de passe.`,
        });
        router.refresh();
      } else {
        const fieldErrors = result.error.fieldErrors ?? {};
        setErrors(fieldErrors);
        setMessage({ tone: "error", text: result.error.message });
        window.setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      }
    } catch {
      setMessage({ tone: "error", text: "L'invitation n'a pas pu être envoyée. Réessayez dans un instant." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <FormField id="invitation-nom" label="Nom" error={errors.fullName?.[0]} required>
          {(field) => <Input {...field} name="fullName" maxLength={120} autoComplete="off" />}
        </FormField>
        <FormField id="invitation-email" label="Adresse email" error={errors.email?.[0]} required>
          {(field) => <Input {...field} name="email" type="email" autoComplete="off" spellCheck={false} />}
        </FormField>
      </div>
      <FormField id="invitation-role" label="Rôle" hint={ROLE_DESCRIPTIONS[role]} error={errors.role?.[0]} required>
        {(field) => (
          <Select {...field} name="role" value={role} onChange={(event) => setRole(event.currentTarget.value as AppRole)}>
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </Select>
        )}
      </FormField>
      <div className="flex flex-col items-start gap-3">
        <Button type="submit" loading={pending} loadingLabel="Envoi de l'invitation…" iconLeft={<Send />}>
          Envoyer l&apos;invitation
        </Button>
        <LiveStatus message={message} />
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Actions sur un membre
// ---------------------------------------------------------------------------

type Member = { userId: string; fullName: string; email: string; role: AppRole | null };

type Pending = "role" | "revoke" | "delete" | null;

/**
 * Changer le rôle, retirer l'accès (le compte reste, sans aucun droit),
 * supprimer le compte. Toujours avec confirmation. Personne ne modifie son
 * propre accès (le serveur le refuse aussi) ; la base refuse de retirer le
 * dernier super administrateur, le message est affiché tel quel.
 */
export function MemberActions({ member }: { member: Member }) {
  const router = useRouter();
  const [role, setRole] = useState<AppRole>(member.role ?? "editor");
  const [dialog, setDialog] = useState<Pending>(null);
  const [message, setMessage] = useState<LiveMessage>(null);
  const selectId = `role-${member.userId}`;
  const roleUnchanged = member.role === role;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-56 flex-col gap-2">
          <label htmlFor={selectId} className="text-small font-semibold text-brand">
            {member.role ? "Changer le rôle" : "Donner un rôle"}
            <span className="sr-only"> de {member.fullName}</span>
          </label>
          <Select id={selectId} value={role} onChange={(event) => setRole(event.currentTarget.value as AppRole)}>
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="secondary" size="sm" iconLeft={<UserCog />} disabled={roleUnchanged} onClick={() => setDialog("role")}>
          Appliquer<span className="sr-only"> le rôle {ROLE_LABELS[role]} à {member.fullName}</span>
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        {member.role && (
          <Button variant="ghost" size="sm" iconLeft={<ShieldOff />} onClick={() => setDialog("revoke")}>
            Retirer l&apos;accès<span className="sr-only"> de {member.fullName}</span>
          </Button>
        )}
        <Button variant="ghost" size="sm" iconLeft={<Trash2 />} onClick={() => setDialog("delete")}>
          Supprimer le compte<span className="sr-only"> de {member.fullName}</span>
        </Button>
      </div>
      <LiveStatus message={message} />

      <ConfirmDialog
        open={dialog === "role"}
        onClose={() => setDialog(null)}
        title={`Donner le rôle « ${ROLE_LABELS[role]} » ?`}
        description={
          <div className="flex flex-col gap-2">
            <p>
              {member.fullName} ({member.email}) aura le rôle {ROLE_LABELS[role]}
              {member.role ? ` au lieu de ${ROLE_LABELS[member.role]}` : ""}.
            </p>
            <p className="text-small text-muted">{ROLE_DESCRIPTIONS[role]}</p>
          </div>
        }
        confirmLabel="Confirmer le rôle"
        pendingLabel="Enregistrement…"
        onConfirm={async () => {
          const result = await changeMemberRole({ userId: member.userId, role });
          if (result.ok) {
            setMessage({ tone: "success", text: `${member.fullName} a maintenant le rôle ${ROLE_LABELS[role]}.` });
            router.refresh();
          }
          return toOutcome(result);
        }}
      />

      <ConfirmDialog
        open={dialog === "revoke"}
        onClose={() => setDialog(null)}
        title="Retirer l'accès à l'administration ?"
        description={
          <p>
            {member.fullName} ne pourra plus rien voir ni modifier dans l&apos;administration. Son compte est conservé :
            vous pourrez lui redonner un rôle plus tard.
          </p>
        }
        confirmLabel="Retirer l'accès"
        pendingLabel="Retrait…"
        onConfirm={async () => {
          const result = await revokeMemberAccess({ userId: member.userId });
          if (result.ok) {
            setMessage({ tone: "success", text: `L'accès de ${member.fullName} a été retiré.` });
            router.refresh();
          }
          return toOutcome(result);
        }}
      />

      <ConfirmDialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        title="Supprimer définitivement ce compte ?"
        description={
          <div className="flex flex-col gap-2">
            <p>
              Le compte de {member.fullName} ({member.email}) sera supprimé : la personne ne pourra plus se connecter.
              Les contenus qu&apos;elle a écrits restent sur le site.
            </p>
            <Alert tone="warning" role="none">
              Cette suppression est définitive. Pour suspendre l&apos;accès sans supprimer le compte, utilisez plutôt
              « Retirer l&apos;accès ».
            </Alert>
          </div>
        }
        confirmLabel="Supprimer le compte"
        pendingLabel="Suppression…"
        onConfirm={async () => {
          const result = await deleteMemberAccount({ userId: member.userId });
          if (result.ok) router.replace("/admin/comptes?supprime=1");
          return toOutcome(result);
        }}
      />
    </div>
  );
}
