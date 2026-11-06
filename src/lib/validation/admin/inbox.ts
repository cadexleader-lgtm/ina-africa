import { z } from "zod";

import { idField, pageField } from "@/lib/validation/admin/common";

/*
 * Boîte de réception (« Nous rejoindre / Contact ») et newsletter.
 * Seul le STATUT d'une demande est modifiable (droit SQL update(status)) :
 * le contenu envoyé par la personne n'est jamais modifié.
 */

export const REQUEST_TYPES = ["contact", "volunteer", "membership", "sponsorship"] as const;
export const REQUEST_STATUSES = ["unread", "read", "processed", "archived"] as const;
export const SUBSCRIBER_STATUSES = ["pending", "subscribed", "unsubscribed"] as const;

export const requestStatusSchema = z.object({
  id: idField,
  status: z.enum(REQUEST_STATUSES, { error: "Choisissez un statut." }),
});

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((value) => (value === "" || value === null ? undefined : value), z.enum(values).optional().catch(undefined));

export const requestFiltersSchema = z.object({
  page: pageField,
  type: optionalEnum(REQUEST_TYPES),
  status: optionalEnum(REQUEST_STATUSES),
});

export type RequestFilters = z.output<typeof requestFiltersSchema>;

export const subscriberFiltersSchema = z.object({
  page: pageField,
  status: optionalEnum(SUBSCRIBER_STATUSES),
});

export type SubscriberFilters = z.output<typeof subscriberFiltersSchema>;
