// Writing into external/, on the person's action only: the register, and a
// link to a folder they picked.
import { lstat, mkdir, realpath, stat, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { REGISTER } from "./paths.ts";
import { succeeds } from "./probe.ts";

export async function writeRegister(external: string, text: string): Promise<void> {
  await mkdir(external, { recursive: true });
  await writeFile(join(external, REGISTER), text, "utf8");
}

async function linksTo(link: string, target: string): Promise<boolean> {
  if (!(await succeeds(stat(link)))) {
    return false;
  }
  const linked = await realpath(link);
  const wanted = await realpath(target);
  return linked === wanted;
}

/** Link `target` into external/ as `name`; an entry already there is kept. */
export async function linkInto(external: string, name: string, target: string): Promise<void> {
  const link = join(external, name);
  const taken = await succeeds(lstat(link));
  if (taken && !(await linksTo(link, target))) {
    throw new Error(`external/${name} already exists`);
  }
  if (taken) {
    return;
  }
  await mkdir(external, { recursive: true });
  const real = await realpath(target);
  await symlink(real, link, "dir");
}
