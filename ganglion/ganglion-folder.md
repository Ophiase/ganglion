---
up: "[Ganglion](./README.md)"
prev: "[External](./ganglion-external.md)"
next: "[Registry](./ganglion-registry.md)"
---

# Folder

```text
my-project/
├── code, AGENTS.md…
└── ganglion/              or docs/: any name
    ├── ganglion.yaml      the description
    ├── ganglion.just      the installer, `just ganglion install`
    ├── README.md          the door
    ├── potato.md          the notes
    ├── <topic>/           subfolders, if needed
    └── assets/            images, pdf
```

## `ganglion.yaml`

- **visible**: a colleague or an agent finds it and understands
- **versioned** like the rest: [this one](./ganglion.yaml)

```yaml
name: my-project
door: README.md
links: markdown
```

## Rules

- **Door**: `README.md`, every note reachable by links from it
- **Links**: relative markdown `[x](./topic/note.md)`, never `[[wikilink]]`
- **Direction**: inward only, never out to the vault
- **Relations**: in the body, or in frontmatter as quoted markdown links,
  like this note's
- **Attachments**: `![](./assets/x.png)`, never `![[x.png]]`
- **Badge**: on the root `README.md`, never in the folder: see below
- **`AGENTS.md`**: one line, so any agent follows the standard

```text
Notes in ganglion/ follow the Ganglion standard: relative markdown links
only, no wikilinks, no links out of the folder.
```

## Badge

Like the Kanon's sign: a visitor landing on the project learns, at once,
that it plugs into a vault and how.

- **Where**: the project's **root** `README.md`, the page the forge shows
  first, with the other badges under the title
- **Never** in `ganglion/README.md`: the badge is how a visitor finds the
  ganglion from outside
- **Link**: from the root to the door, `ganglion/README.md`, or the
  folder's own name (`docs/README.md`)

```markdown
[![Ganglion](https://img.shields.io/badge/%E2%97%89-Ganglion-16a34a.svg)](ganglion/README.md)
```

- **Below it**, a short section of the root `README.md`:

````markdown
## Ganglion

This project's notes plug into an Obsidian vault:
[ganglion/](ganglion/README.md).

```sh
export OBSIDIAN_VAULT=<vault>
just ganglion install
```
````

## One git

```mermaid
flowchart LR
    subgraph root["🧠 my-project: one git"]
        agent["🤖 agent"]
        code["code, AGENTS.md"]
        subgraph gang["ganglion/"]
            door["README.md: the door"]
            notes["notes, assets/"]
            yaml["ganglion.yaml"]
        end
    end
    agent -->|writes| notes
    code -.-|reads| yaml
    classDef exposed fill:#dcfce7,stroke:#16a34a
    class door,notes,yaml exposed
    style root fill:#f8fafc,stroke:#475569,stroke-width:2px
    style gang fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
```

- **By default**: `ganglion/` is a folder of the project, in its git
- **A second git**, only for a real need

| Need | Example |
| --- | --- |
| share one without the other | public code, private notes |
| two rhythms, two authors | the author in Obsidian, the agent on the code |
| sync differently | the ganglion across machines, not the code |
