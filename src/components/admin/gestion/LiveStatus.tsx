import { CircleAlert, CircleCheck } from "lucide-react";

import { cn } from "@/lib/cn";

export type LiveMessage = { tone: "success" | "error"; text: string } | null;

/**
 * Zone de message TOUJOURS présente dans la page (role="status") : un
 * message qui y apparaît après une action est annoncé par les lecteurs
 * d'écran, sans déplacer le focus.
 */
export function LiveStatus({ message, className }: { message: LiveMessage; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("empty:hidden", className)}>
      {message && (
        <p
          className={cn(
            "flex items-start gap-2 rounded-field border px-3 py-2 text-small font-medium",
            message.tone === "success" ? "border-success/30 bg-success-50 text-success" : "border-danger/30 bg-danger-50 text-danger",
          )}
        >
          {message.tone === "success" ? (
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </p>
      )}
    </div>
  );
}
