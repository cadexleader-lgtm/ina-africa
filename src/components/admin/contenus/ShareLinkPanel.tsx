import { Link2 } from "lucide-react";

import { CopyLinkButton } from "@/components/site/CopyLinkButton";

import { Panel } from "./ui";

/** Lien public à partager (appel aux dons actif), avec un bouton de copie. */
export function ShareLinkPanel({ url }: { url: string }) {
  return (
    <Panel title="Lien à partager">
      <p className="text-small break-all text-ink">{url}</p>
      <div>
        <CopyLinkButton url={url} icon={<Link2 />} />
      </div>
    </Panel>
  );
}
