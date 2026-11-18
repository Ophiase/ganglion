// What the vault tracks beside what external/ holds: the state of each
// ganglion, and the entries that could become one.
import { isEntryName, type Tracked } from "./files.ts";
import { byText } from "./yaml.ts";

/** An entry of external/, by name: a ganglion, anything else, a dead link. */
export type Probe = "ganglion" | "other" | "dangling" | "none";

export type State = "ready" | "absent" | "broken" | "unconfirmed";

export interface Row extends Tracked {
  readonly state: State;
}

export interface Candidate {
  readonly name: string;
  readonly manifest: boolean;
}

export type Probes = ReadonlyMap<string, Probe>;

export function stateOf(probe: Probe, confirmed: boolean): State {
  if (probe === "none") {
    return "absent";
  }
  if (!confirmed) {
    return "unconfirmed";
  }
  return probe === "dangling" ? "broken" : "ready";
}

function rowOf(ganglion: Tracked, here: ReadonlySet<string>, probes: Probes): Row {
  const probe = probes.get(ganglion.name) ?? "none";
  const confirmed = here.has(ganglion.name);
  return { ...ganglion, state: stateOf(probe, confirmed) };
}

export function rowsOf(
  tracked: readonly Tracked[],
  confirmed: readonly string[],
  probes: Probes,
): Row[] {
  const here = new Set(confirmed);
  return tracked.map((ganglion) => rowOf(ganglion, here, probes));
}

function resolves(probe: Probe): boolean {
  return probe === "ganglion" || probe === "other";
}

function ganglionsFirst(left: Candidate, right: Candidate): number {
  if (left.manifest === right.manifest) {
    return byText(left.name, right.name);
  }
  return left.manifest ? -1 : 1;
}

/** Entries of external/ the vault does not track yet, ganglions first. */
export function candidatesOf(probes: Probes, tracked: readonly Tracked[]): Candidate[] {
  const known = new Set(tracked.map(({ name }) => name));
  const candidates: Candidate[] = [];
  for (const [name, probe] of probes) {
    if (isEntryName(name) && !known.has(name) && resolves(probe)) {
      candidates.push({ name, manifest: probe === "ganglion" });
    }
  }
  return candidates.sort(ganglionsFirst);
}
