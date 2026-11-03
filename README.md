# standards-cli

[![CI](https://img.shields.io/github/actions/workflow/status/favasconcelos/standards-cli/ci.yml?branch=main&label=CI)](https://github.com/favasconcelos/standards-cli/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@favasconcelos/standards-cli)](LICENSE)

Installs shared coding standards (`CODE_STANDARDS.md`) on a machine and wires them into
every installed AI harness — opencode, pi, Codex, Claude Code, Copilot — so you stop
repeating yourself in every session.

> These are my personal coding standards, distilled from my own projects. They reflect
> how I like code to be written — fork this repo and make them yours.

## Install

```sh
npm install -g @favasconcelos/standards-cli
standards init        # wizard: pick harnesses, install pointers
```

To run from source instead: `npm install && npm run build && npm link`.

## How it works

1. **Canonical copy** – the standards text ships with the package (`templates/CODE_STANDARDS.md`).
   `sync` copies it to `~/.local/share/standards-cli/CODE_STANDARDS.md` (backing up a
   hand-edited copy first, never deleting).
2. **Pointers first, minimal config edits only when required** – for each harness the CLI
   creates the file that harness already reads, as a symlink to the canonical copy. Updates
   therefore propagate atomically. The one exception is opencode, which only auto-loads
   `AGENTS.md`: the CLI also appends the pointer to `instructions` in the global
   `~/.config/opencode/opencode.json(c)` (comments preserved, previous file backed up,
   skipped when already present).

| Harness     | Pointer file                           | How the harness picks it up                                        |
| ----------- | -------------------------------------- | ------------------------------------------------------------------ |
| opencode    | `~/.config/opencode/CODE_STANDARDS.md` | `instructions` entry the CLI adds to the global `opencode.json(c)` |
| pi          | `~/.pi/agent/AGENTS.md`                | concatenated with repo `AGENTS.md` files at startup                |
| Codex       | `~/.codex/AGENTS.md`                   | global scope (32 KiB combined cap)                                 |
| Claude Code | `~/.claude/CLAUDE.md`                  | user-level memory                                                  |
| Copilot     | `~/.copilot/copilot-instructions.md`   | Copilot CLI user-level instructions, applied across repositories   |

Paths are the same on Linux, macOS, and Windows (`~` is the home directory on each).
On Windows, creating symlinks needs Developer Mode (Settings → Privacy & security →
For developers → Developer Mode) or an elevated prompt; otherwise `sync` fails with
guidance instead of leaving a half-written pointer.

## Commands

```
standards init                       interactive setup: pick harnesses, install pointers
standards sync                       refresh canonical copy + repair pointers
standards status                     show harness/link state + available updates
standards diff                       show template vs installed canonical differences
standards upgrade [--yes]            install the latest release, then re-sync
standards config get [key] | set <key> <value>
```

### Updates

Content updates ship with CLI releases. `status`, `sync`, and `upgrade` check the registry
at most once every 24 hours (marker in state dir, silent on failure/offline). `upgrade`
installs the latest release; run `sync` afterwards (offered automatically) to apply the
new standards text.

## Configuration

`~/.config/standards-cli/config.json` (state in `~/.local/state/standards-cli/`). Override
locations with `STANDARDS_CLI_CONFIG_DIR` / `STANDARDS_CLI_STATE_DIR`.

| Key                | Default |                                             |
| ------------------ | ------- | ------------------------------------------- |
| `harnesses`        | `[]`    | harness ids wired by `init`                 |
| `autoCheckUpdates` | `true`  | registry check in `status`/`sync`/`upgrade` |
| `lastUpdateCheck`  | `0`     | epoch ms of the last check (managed)        |

## Extending

- **New harness**: implement `Harness` (`src/harnesses/types.ts`) in `src/harnesses/` and
  register it in `src/harnesses/index.ts`. The CLI creates symlinks at the pointer path; only
  add `configWiring` when the harness cannot read the pointer on its own (see opencode).
  Config edits must be minimal, idempotent, comment-preserving and backed up first.

## Development

```sh
npm run dev         # rebuild on change
npm test            # vitest
npm run typecheck
npm run lint        # biome
```

## Releasing

Releases are published to npm from GitHub with [trusted publishing](https://docs.npmjs.com/trusted-publishers)
(no npm token). The workflow is `.github/workflows/release.yml`.

```sh
npm version patch|minor|major        # bumps package.json, commits, tags vX.Y.Z
git push --follow-tags
gh release create vX.Y.Z --generate-notes
```

Publishing the GitHub Release triggers the workflow, which checks that the tag matches
`package.json`, runs lint, typecheck, tests and build, then runs `npm publish --access public`
(`--access public` is required for the scoped name). Mark the release as a
pre-release to publish it under the `next` dist-tag instead of `latest`.
