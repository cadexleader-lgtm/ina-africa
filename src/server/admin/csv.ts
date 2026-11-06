import "server-only";

/*
 * Export CSV pour Excel (versions françaises) :
 *  - UTF-8 avec BOM (accents lisibles dans Excel) ;
 *  - séparateur « ; » (celui qu'attend Excel en français), fin de ligne CRLF ;
 *  - protection contre l'injection de formules : une cellule texte qui
 *    commence par = + - @ (ou tabulation / retour chariot) est préfixée
 *    d'une apostrophe, pour qu'Excel l'affiche comme du texte au lieu de
 *    l'exécuter (un nom de donateur « =HYPERLINK(...) » reste inoffensif).
 */

export type CsvCell = string | number | boolean | null | undefined;

export type CsvFile = { fileName: string; mimeType: string; content: string; rowCount: number };

const BOM = "﻿";
const SEPARATOR = ";";
const FORMULA_START = /^(\s*[=+\-@]|[\t\r])/;

/** Cellule sûre : neutralise les formules, échappe les guillemets et séparateurs. */
export function csvCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  let text: string;
  if (typeof value === "number") {
    // Les montants sont des entiers positifs : rien à neutraliser.
    text = Number.isFinite(value) ? String(value) : "";
  } else if (typeof value === "boolean") {
    text = value ? "oui" : "non";
  } else {
    text = value;
    if (FORMULA_START.test(text)) text = `'${text}`;
  }
  return /[";\r\n,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(SEPARATOR));
  return BOM + lines.join("\r\n") + "\r\n";
}

/** Nom de fichier daté : « dons-2026-11-06.csv ». */
export function csvFileName(prefix: string, now = new Date()): string {
  return `${prefix}-${now.toISOString().slice(0, 10)}.csv`;
}

export function csvFile(prefix: string, headers: string[], rows: CsvCell[][]): CsvFile {
  return {
    fileName: csvFileName(prefix),
    mimeType: "text/csv;charset=utf-8",
    content: toCsv(headers, rows),
    rowCount: rows.length,
  };
}
