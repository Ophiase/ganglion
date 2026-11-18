// Every click on a link, in any view, reaches `openLinkText`: a link that
// leaves the vault opens here, any other stays Obsidian's.
import type { App, Plugin, Workspace } from "obsidian";
import { say } from "../notice.ts";
import { exists, openOutside } from "./open.ts";
import { linkpathOf, outsideTarget } from "./resolve.ts";

type OpenLinkText = Workspace["openLinkText"];

/** An external note's own links are Obsidian's to resolve. */
function isVaultNote(app: App, source: string): boolean {
  const note = app.vault.getFileByPath(source);
  return note !== null && !("getRealPath" in note);
}

async function openTarget(target: string, linktext: string): Promise<void> {
  if (!(await exists(target))) {
    say(`nothing at ${linkpathOf(linktext)}`);
    return;
  }
  await openOutside(target);
}

function wrapped(app: App, vault: string, native: OpenLinkText): OpenLinkText {
  const workspace = app.workspace;
  return (linktext, source, ...rest) => {
    const outside = isVaultNote(app, source) ? outsideTarget(vault, source, linktext) : null;
    if (outside === null) {
      return native.call(workspace, linktext, source, ...rest);
    }
    return openTarget(outside, linktext);
  };
}

export function wrapLinks(plugin: Plugin, vault: string): void {
  const workspace = plugin.app.workspace;
  const native = workspace.openLinkText;
  workspace.openLinkText = wrapped(plugin.app, vault, native);
  plugin.register(() => {
    workspace.openLinkText = native;
  });
}
