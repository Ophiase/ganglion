// Opening a file outside the vault: a note in Obsidian, anything else in the
// system's app. Nothing here writes, lists or watches a file.
import { stat } from "node:fs/promises";
import { extname } from "node:path";
import { pathToFileURL } from "node:url";
import { shell } from "electron";

export async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * A `.md` goes through its file URL, which Obsidian 1.14+ opens when it
 * is the system's default markdown app; anything else opens in its own app.
 */
export async function openOutside(path: string): Promise<void> {
  if (extname(path).toLowerCase() === ".md") {
    await shell.openExternal(pathToFileURL(path).href);
    return;
  }
  await shell.openPath(path);
}
