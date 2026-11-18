// Where a relative markdown link lands, from the note that writes it.
import { dirname, isAbsolute, relative, resolve } from "node:path";

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** The link's path: no `#heading` or `#^block`, percent-decoding undone. */
export function linkpathOf(linktext: string): string {
  const [path = ""] = linktext.split("#");
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/**
 * The absolute path `linktext`, written in the vault note `source`, points
 * to, when it lands outside the folder `vault`; null for any other link.
 */
export function outsideTarget(vault: string, source: string, linktext: string): string | null {
  const linkpath = linkpathOf(linktext);
  if (linkpath === "" || SCHEME.test(linkpath) || isAbsolute(linkpath)) {
    return null;
  }
  const target = resolve(vault, dirname(source), linkpath);
  const fromVault = relative(vault, target);
  const inside = !(fromVault.startsWith("..") || isAbsolute(fromVault));
  return inside ? null : target;
}
