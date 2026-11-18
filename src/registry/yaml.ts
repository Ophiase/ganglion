// A parsed YAML value read without trusting its shape, and scalars written so
// that YAML reads them back as they were.

const PLAIN = /^[A-Za-z_](?:[\w .-]*[\w.-])?$/;
const KEYWORD = /^(?:true|false|null|yes|no|on|off|y|n)$/i;

function isMapping(data: unknown): data is Readonly<Record<string, unknown>> {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}

export function field(data: unknown, key: string): unknown {
  return isMapping(data) ? data[key] : undefined;
}

/** A scalar as trimmed text; `null` for a list, a mapping, or nothing. */
export function text(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return null;
}

export function scalar(value: string): string {
  const plain = PLAIN.test(value) && !KEYWORD.test(value);
  return plain ? value : JSON.stringify(value);
}

export function byText(left: string, right: string): number {
  return left.localeCompare(right);
}
