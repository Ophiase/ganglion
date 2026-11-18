// node --test: one case per state, and what counts as a candidate.
import assert from "node:assert/strict";
import { test } from "node:test";
import { candidatesOf, type Probe, rowsOf, stateOf } from "../src/registry/index.ts";

test("a confirmed, resolving entry is ready, ganglion.yaml or not", () => {
  assert.equal(stateOf("ganglion", true), "ready");
  assert.equal(stateOf("other", true), "ready");
});

test("nothing in external/ is absent, confirmed or not", () => {
  assert.equal(stateOf("none", true), "absent");
  assert.equal(stateOf("none", false), "absent");
});

test("a confirmed dead link is broken", () => {
  assert.equal(stateOf("dangling", true), "broken");
});

test("an entry the register does not name is unconfirmed", () => {
  assert.equal(stateOf("ganglion", false), "unconfirmed");
  assert.equal(stateOf("dangling", false), "unconfirmed");
});

test("rows follow the vault, sources kept", () => {
  const probes = new Map<string, Probe>([["a", "ganglion"]]);
  const rows = rowsOf([{ name: "a", source: "s" }, { name: "b" }], ["a"], probes);
  assert.deepEqual(rows, [
    { name: "a", source: "s", state: "ready" },
    { name: "b", state: "absent" },
  ]);
});

const ENTRIES = new Map<string, Probe>([
  ["z", "ganglion"],
  ["b", "other"],
  ["a", "ganglion"],
  ["tracked", "ganglion"],
  [".git", "other"],
  ["dead", "dangling"],
]);

const nameOf = ({ name }: { name: string }) => name;

test("candidates: visible, untracked, resolving; ganglions first", () => {
  const candidates = candidatesOf(ENTRIES, [{ name: "tracked" }]);
  assert.deepEqual(candidates.map(nameOf), ["a", "z", "b"]);
});
