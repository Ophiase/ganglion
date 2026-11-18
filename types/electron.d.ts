// The parts of Electron the plugin uses; Obsidian provides the module on
// desktop, so it is never bundled (--external:electron). `remote` may be
// missing: the folder prompt then takes a typed path only.
declare module "electron" {
  export const shell: {
    openExternal(url: string): Promise<void>;
    openPath(path: string): Promise<string>;
  };
  export const remote:
    | {
        dialog: {
          showOpenDialog(options: {
            properties: string[];
          }): Promise<{ canceled: boolean; filePaths: string[] }>;
        };
      }
    | undefined;
}
