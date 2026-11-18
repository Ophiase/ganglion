# Ganglion

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![Kanon](https://img.shields.io/badge/%3C%3E-Kanon-blueviolet.svg)](.agents/kanon.md)
[![Ganglion](https://img.shields.io/badge/%E2%97%89-Ganglion-16a34a.svg)](ganglion/README.md)
[![Obsidian](https://img.shields.io/badge/Obsidian-plugin-483699.svg?logo=obsidian&logoColor=white)](manifest.json)

A small standard for a project's knowledge folder that reads fine on any
forge and plugs into an Obsidian-style vault without being vault content.

The standard is its own first ganglion: read
[ganglion/README.md](./ganglion/README.md).

## The plugin

Obsidian refuses a relative link that leaves the vault. The Ganglion plugin
opens it instead:

```markdown
[my-project](../external/my-project/README.md)
```

- resolved from the note's folder, as on GitHub and in VS Code
- a `.md` opens in Obsidian (1.14+); any other file in the system's app
- a missing target: a notice, nothing created
- every other link: Obsidian's own behaviour
- desktop only; no settings, no network, nothing indexed

Two commands keep track of the ganglions a vault knows, through an
optional `ganglions.yaml` at its root:
[Registry](./ganglion/ganglion-registry.md).

- **Open ganglion**: the tracked ganglions, their state here, their door
- **Register ganglion**: from `external/`, or a folder on disk linked
  into it
- **Insert from ganglion**: a link to its door, its notes as a tree, or one
  note found by fuzzy search, at the cursor

The other ways to open an external note, and why this one is recommended:
[Opening from Obsidian](./ganglion/ganglion-external.md#opening-from-obsidian).

## Ganglion

This project's notes plug into an Obsidian vault:
[ganglion/](ganglion/README.md).

```sh
export OBSIDIAN_VAULT=<vault>
just ganglion install
```

## Install

From the sources, into the vault `OBSIDIAN_VAULT` names:

```sh
cp .envrc.example .envrc    # set OBSIDIAN_VAULT, then direnv allow
just setup
just install-plugin
```

## License

[Apache 2.0](LICENSE)
