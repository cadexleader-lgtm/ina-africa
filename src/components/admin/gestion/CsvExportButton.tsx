"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { exportDonationsCsv } from "@/server/actions/admin/donations";
import { exportNewsletterCsv } from "@/server/actions/admin/inbox";

import { refocusWithin } from "./focus";
import { LiveStatus, type LiveMessage } from "./LiveStatus";
import { plural } from "./labels";

type ExportKind =
  | { kind: "donations"; filters: { channel?: string; status?: string; campaignId?: string } }
  | { kind: "newsletter" };

/** Fichier CSV reçu du serveur → téléchargement dans le navigateur (Blob), nom daté fourni par le serveur. */
export function saveCsv(file: { fileName: string; mimeType: string; content: string }) {
  const blob = new Blob([file.content], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  // Laisse le temps au navigateur de commencer le téléchargement.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Export CSV (Excel en français : « ; », UTF-8). Dons : selon les filtres
 * affichés ; newsletter : abonnés CONFIRMÉS seulement.
 */
export function CsvExportButton(props: ExportKind & { label?: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<LiveMessage>(null);
  const zone = useRef<HTMLDivElement>(null);

  async function run() {
    setPending(true);
    setMessage(null);
    try {
      const result =
        props.kind === "donations" ? await exportDonationsCsv(props.filters) : await exportNewsletterCsv();
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error.message });
        return;
      }
      if (result.data.rowCount === 0) {
        setMessage({ tone: "error", text: "Aucune ligne à exporter avec ces critères." });
        return;
      }
      saveCsv(result.data);
      const truncated = "truncated" in result.data && result.data.truncated;
      setMessage({
        tone: "success",
        text: truncated
          ? `Export incomplet : ${plural(result.data.rowCount, "ligne", "lignes")} (limite atteinte). Affinez les filtres pour tout exporter.`
          : `Fichier ${result.data.fileName} téléchargé (${plural(result.data.rowCount, "ligne", "lignes")}).`,
      });
    } catch {
      setMessage({ tone: "error", text: "L'export a échoué. Réessayez dans un instant." });
    } finally {
      setPending(false);
      refocusWithin(zone.current);
    }
  }

  return (
    <div ref={zone} className="flex flex-col items-start gap-2">
      <Button variant="secondary" onClick={run} loading={pending} loadingLabel="Préparation du fichier…" iconLeft={<Download />}>
        {props.label ?? "Exporter en CSV"}
      </Button>
      <LiveStatus message={message} className="max-w-sm" />
    </div>
  );
}
