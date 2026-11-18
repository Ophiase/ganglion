// Ganglion: open the relative links that leave the vault, index nothing; and,
// on demand, the ganglions the vault tracks. ◉
import {
  type App,
  type Editor,
  FileSystemAdapter,
  type MarkdownFileInfo,
  Menu,
  type MenuItem,
  Plugin,
} from "obsidian";
import { Ganglions, openGanglion, registerGanglion } from "./commands/index.ts";
import { insertFromGanglion } from "./insert/index.ts";
import { wrapLinks } from "./links/index.ts";
import { attempt } from "./notice.ts";

interface Command {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly run: (app: App, store: Ganglions) => unknown;
}

interface InsertContext {
  readonly store: Ganglions;
  readonly view: MarkdownFileInfo;
}

const COMMANDS: readonly Command[] = [
  { id: "open-ganglion", name: "Open ganglion", icon: "brain-circuit", run: openGanglion },
  {
    id: "register-ganglion",
    name: "Register ganglion",
    icon: "folder-plus",
    run: registerGanglion,
  },
];

export default class Ganglion extends Plugin {
  override onload() {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) {
      return;
    }
    const vault = adapter.getBasePath();
    const store = new Ganglions(this.app, vault);
    wrapLinks(this, vault);
    this.registerCommands(store);
    this.registerInsert(store);
    this.addRibbonIcon("brain-circuit", "Ganglions", (event) => this.showMenu(event, store));
  }

  private registerInsert(store: Ganglions) {
    this.addCommand({
      id: "insert-from-ganglion",
      name: "Insert from ganglion",
      icon: "link",
      editorCallback: (editor, view) => this.insert(store, editor, view),
    });
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) =>
        this.fillEditorMenu(menu, editor, { store, view }),
      ),
    );
  }

  private fillEditorMenu(menu: Menu, editor: Editor, context: InsertContext) {
    menu.addItem((item) => this.insertItem(item, editor, context));
  }

  private insertItem(item: MenuItem, editor: Editor, { store, view }: InsertContext) {
    item
      .setTitle("Insert from ganglion")
      .setIcon("link")
      .onClick(() => this.insert(store, editor, view));
  }

  private insert(store: Ganglions, editor: Editor, view: MarkdownFileInfo) {
    const note = view.file?.path ?? "";
    return attempt(() => insertFromGanglion({ app: this.app, store, editor, note }));
  }

  private run(command: Command, store: Ganglions) {
    return attempt(() => command.run(this.app, store));
  }

  private registerCommands(store: Ganglions) {
    for (const command of COMMANDS) {
      const { id, name, icon } = command;
      this.addCommand({ id, name, icon, callback: () => this.run(command, store) });
    }
  }

  private showMenu(event: MouseEvent, store: Ganglions) {
    const menu = new Menu();
    for (const command of COMMANDS) {
      menu.addItem((item) => this.menuItem(item, command, store));
    }
    menu.showAtMouseEvent(event);
  }

  private menuItem(item: MenuItem, command: Command, store: Ganglions) {
    item
      .setTitle(command.name)
      .setIcon(command.icon)
      .onClick(() => this.run(command, store));
  }
}
