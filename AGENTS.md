# AGENTS.md

Guidance for AI coding agents working on this repository.
Global personal standards load from `~/.config/opencode/CODE_STANDARDS.md` — follow those.
Repo-specific notes only below.

## Project

`@favasconcelos/standards-cli` — installs shared coding standards on a machine and wires
them into every installed AI harness (opencode, pi, Codex, Claude Code, Copilot).

## Setup

**Runtime**: Node ≥ 20 via `.node-version`. Package manager is npm (`package-lock.json`,
`save-exact=true`, `ignore-scripts=true`, `min-release-age=7` — see `.npmrc`).

```sh
npm install
npm run dev         # tsup --watch
```

## Commands

| Command             | Purpose                               |
| ------------------- | ------------------------------------- |
| `npm run build`     | Bundle `src/cli.ts` → `dist/cli.js`   |
| `npm run typecheck` | `tsc --noEmit`                        |
| `npm run lint`      | `biome check .`                       |
| `npm test`          | `vitest run` (`test/` mirrors `src/`) |

Run `npm run lint` before finishing a task. Fix all reported issues.

## Conventions

- CLI framework is commander (`src/program.ts` owns the command tree via `buildProgram()`,
  actions wrapped so `StandardsError` prints without a stack trace). Schemas are zod
  (`src/config/schema.ts`). Interactive setup uses `@clack/prompts`.
- Config lives in `~/.config/standards-cli/config.json`, state in
  `~/.local/state/standards-cli/`. Env overrides: `STANDARDS_CLI_CONFIG_DIR`,
  `STANDARDS_CLI_STATE_DIR`.
- Canonical standards file: `~/.local/share/standards-cli/CODE_STANDARDS.md`.
  The published artifact is `templates/CODE_STANDARDS.md` — keep them in sync:
  promote content changes here first, then `standards sync` on your machine.
- New harness: implement `Harness` (`src/harnesses/types.ts`) in `src/harnesses/`
  and register it in `src/harnesses/index.ts`.
- Harness wiring is symlink-only by default: the CLI creates the pointer file each harness
  already reads. Real files found at a pointer path are backed up
  (`<path>.bak-<timestamp>`), never deleted. Exception: a harness that cannot read the
  pointer on its own declares `configWiring` (`src/harnesses/types.ts`); today only opencode
  (`src/harnesses/opencode-config.ts` appends to `instructions` via `jsonc-parser`, preserving
  comments, backing up first, refusing to edit unparsable configs).
- Never print secrets. Destructive ops only on explicit confirmation.
