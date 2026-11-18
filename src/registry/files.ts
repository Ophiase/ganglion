// The two registries: the vault's ganglions.yaml, what it tracks, and
// external/.ganglions.yaml, what this machine has confirmed.
import { byText, field, scalar, text } from "./yaml.ts";

/** A ganglion the vault tracks; `source` is shown, never fetched. */
export interface Tracked {
  readonly name: string;
  readonly source?: string;
}

export interface VaultFile {
  readonly external?: string;
  readonly ganglions: readonly Tracked[];
}

export const DEFAULT_EXTERNAL = "../external";

const VAULT_HEADER = "# Ganglions this vault tracks: see the Ganglion standard.";
const REGISTER_HEADER = "# Confirmed ganglions of this external/, one per line.";

/** One entry of external/: no separator, no dot entry, nothing above it. */
export function isEntryName(name: string): boolean {
  const hidden = name.startsWith(".");
  const nested = /[/\\]/.test(name);
  return name !== "" && !hidden && !nested;
}

function isValidName(name: string | null): name is string {
  return name !== null && isEntryName(name);
}

function items(data: unknown): readonly unknown[] {
  const list = field(data, "ganglions");
  return Array.isArray(list) ? list : [];
}

function trackedOfItem(item: unknown): Tracked | null {
  const named = typeof item === "object" ? field(item, "name") : item;
  const name = text(named);
  if (!isValidName(name)) {
    return null;
  }
  const source = text(field(item, "source"));
  return source ? { name, source } : { name };
}

function byName(left: Tracked, right: Tracked): number {
  return byText(left.name, right.name);
}

export function trackedOf(data: unknown): Tracked[] {
  const tracked = new Map<string, Tracked>();
  for (const item of items(data)) {
    const ganglion = trackedOfItem(item);
    if (ganglion !== null && !tracked.has(ganglion.name)) {
      tracked.set(ganglion.name, ganglion);
    }
  }
  return [...tracked.values()].sort(byName);
}

export function confirmedOf(data: unknown): string[] {
  const names = items(data).map(text);
  const valid = names.filter(isValidName);
  return [...new Set(valid)].sort(byText);
}

export function vaultFileOf(data: unknown): VaultFile {
  const external = text(field(data, "external"));
  const ganglions = trackedOf(data);
  return external ? { external, ganglions } : { ganglions };
}

function trackedLines({ name, source }: Tracked): string[] {
  const line = `  - name: ${scalar(name)}`;
  return source === undefined ? [line] : [line, `    source: ${scalar(source)}`];
}

function confirmedLine(name: string): string {
  return `  - ${scalar(name)}`;
}

function yamlFile(header: readonly string[], lines: readonly string[]): string {
  const list = lines.length === 0 ? ["ganglions: []"] : ["ganglions:", ...lines];
  const all = [...header, ...list];
  return `${all.join("\n")}\n`;
}

export function writeVault({ external, ganglions }: VaultFile): string {
  const moved = external !== undefined && external !== DEFAULT_EXTERNAL;
  const header = moved ? [VAULT_HEADER, `external: ${scalar(external)}`] : [VAULT_HEADER];
  const lines = trackedOf({ ganglions }).flatMap(trackedLines);
  return yamlFile(header, lines);
}

export function writeConfirmed(names: readonly string[]): string {
  const lines = confirmedOf({ ganglions: names }).map(confirmedLine);
  return yamlFile([REGISTER_HEADER], lines);
}
