import type { App } from "obsidian";
import { attempt, say } from "../notice.ts";
import type { Row } from "../registry/index.ts";
import { GanglionPicker, isReachable, unreachable } from "./picker.ts";
import type { Ganglions } from "./store.ts";

function openRow(store: Ganglions, row: Row): void {
  if (!isReachable(row)) {
    say(unreachable(row));
    return;
  }
  void attempt(() => store.open(row));
}

export async function openGanglion(app: App, store: Ganglions): Promise<void> {
  const rows = await store.rows();
  if (rows.length === 0) {
    throw new Error("no ganglion tracked yet: run Register ganglion");
  }
  new GanglionPicker(app, rows, (row) => openRow(store, row)).open();
}
