import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/cn";

export type AlertTone = "info" | "success" | "error" | "warning";

const TONES: Record<AlertTone, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: "border-link/30 bg-info-50", icon: "text-link", Icon: Info },
  success: { box: "border-success/30 bg-success-50", icon: "text-success", Icon: CircleCheck },
  error: { box: "border-danger/30 bg-danger-50", icon: "text-danger", Icon: CircleAlert },
  warning: { box: "border-gold bg-gold-50", icon: "text-brand", Icon: TriangleAlert },
};

type AlertProps = {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  /**
   * Rôle ARIA. Par défaut : `alert` pour une erreur (annoncée tout de suite),
   * `status` pour les autres. `none` pour un message affiché dès le chargement
   * de la page (pas d'annonce).
   */
  role?: "alert" | "status" | "none";
  /** Action éventuelle (lien, bouton) sous le texte. */
  action?: ReactNode;
  className?: string;
};

/** Message d'information, de succès, d'erreur ou d'avertissement. Le texte porte le sens, pas seulement la couleur. */
export function Alert({ tone = "info", title, children, role, action, className }: AlertProps) {
  const { box, icon, Icon } = TONES[tone];
  const ariaRole = role ?? (tone === "error" ? "alert" : "status");
  return (
    <div
      role={ariaRole === "none" ? undefined : ariaRole}
      className={cn("flex gap-3 rounded-card border p-4 text-ink sm:p-5", box, className)}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", icon)} />
      <div className="flex min-w-0 flex-col gap-1">
        {title && <p className="font-semibold text-brand">{title}</p>}
        {children && <div className="text-body [&_a]:text-link-strong [&_a]:underline">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
