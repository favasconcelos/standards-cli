# CODE_STANDARDS.md

Global personal standards, loaded in every OpenCode session.
Repo-specific values (hosts, paths, thresholds) belong in that repo's `AGENTS.md`.

Rule: every bullet states a portable idea. Concrete tools from the current
stack appear only as `e.g.` examples, never as mandates. Tech-specific items
live only in their section; shared items bubble up to Common (or JavaScript
for all JS-derived stacks).

## 1. Common (all languages)

### Communication

- Short and concise. Facts and problem-solving over prose.
- Direct, objective technical info. No superlatives, praise, or emotional validation.
- No emojis unless explicitly asked.
- When referencing code, use `file_path:line_number`.
- Never generate or guess URLs. Only use URLs from user messages, local files, or verified fetches.
- If findings contradict a previous claim, state the discrepancy.
- After investigating multiple hypotheses, list each hypothesis and its outcome.

### File naming & layout

- Kebab-case files, suffixed by role (e.g. a page, a section, a service, a route).
- One exported unit per file; cohesive primitives may share one file.
- Tests mirror source paths with a test suffix.
- One-off scripts live apart from buildable source.
- Shared helpers go in one shared location; feature-only helpers stay next to
  the feature. Never export helpers from component or route files.
- Prefer editing an existing file over creating a new one. No scratch docs.

### Setup, env, verification, git

- One example-env file is the source of truth — never duplicate its values in docs.
- Local dev works without real secrets (mock or seed data where supported).
- Evidence before synthesis: inspect files yourself before claiming.
- Verify by execution: run code, tests, typecheck, sanity-check outputs.
- One-off computations go in executed code, not mental math.
- Always run the repo's lint before finishing; fix all issues. Also run
  typecheck and tests when code changed. Re-read edited regions after
  preservation-constrained edits.
- Never commit secrets.
- Small focused changes; no unrelated reformats; follow existing conventions.
- Worktree must be free of unintended files before finishing.
- Destructive ops (force push, DB resets, prod deploys) only on explicit confirmation.

## 2. JavaScript (JS + TS, all runtimes)

- One linter/formatter per repo, shared via a base config that packages extend
  (e.g. Biome; no competing formatters).
- Enforce a single import order: stdlib, then external, then path alias,
  then relative; type-only imports last.
- Named exports only in app code; no default exports
  (third-party defaults are fine).
- One path alias for source imports; relative imports only for same-directory siblings.
- Concise, purposeful comments. No chain-of-thought in code.
- JSDoc on every exported function.
- Library packaging goes through a single bundler (e.g. tsdown).
- Serialize dates as ISO strings at storage boundaries; rich date objects inside logic.

## 3. TypeScript (extends JavaScript)

- Strict mode. No `any`; use `unknown` then narrow with guards.
- Explicit return types on exported functions; locals may infer.
- Type-only imports use the type-only form.
- Environment keys are typed (typos are type errors). Access env only through
  typed helpers with fallbacks, never raw process lookups.
- Schemas and validation go through a single schema library (e.g. zod).

## 4. Runtime (extends JavaScript; e.g. Bun)

- One runtime per repo; one lockfile per app; a root script cascades installs.
- Root scripts delegate to workspaces (dev per app, single build entry,
  sequential test / typecheck / lint across apps).
- Pin supply-chain and test-preload behavior in runtime config.
- CLIs are built with a single command framework (e.g. commander).
- Tests never touch prod data: test setup redirects storage to temp files.

## 5. React (extends JavaScript + TypeScript)

- Build, dev, and preview through a single frontend bundler (e.g. Vite).
- Functional components only. Class components are banned; the error boundary
  is the sole documented exception.
- Props are explicitly typed with clear optionals, destructured in the signature.
- Route modules export only the route component plus an error boundary
  (matches the router's lazy contract).
- All hooks live in one hooks location and follow the `use-*` naming;
  data hooks are query wrappers. Never export hooks from component files.
- Styling and component-system details live in §§8–11 (design system,
  Tailwind, CSS escapes, UI components).
- Single data-fetching layer (e.g. TanStack Query): components never fetch
  directly, only through domain hooks. Forward cancellation signals.
  Query keys are centralized as hierarchical factories with staleness constants.
  Mutations invalidate their domain root.
- One shared page shell owns title, loading, and error states. Routes with
  trivial combined state pass through; independently-fetching sections own
  their own loading state.
- Component tests use jsdom with explicit imports, cleanup, and a pinned clock.
  Each data test gets an isolated query client with refetch and retry off.
  Stub the network per test and restore afterwards. Assert rendered states,
  variants, and behavior — not implementation details.

## 6. Backend framework (extends runtime + TypeScript; e.g. ElysiaJS)

- One module per domain: thin routes, pure logic in services, background jobs
  mirroring the same domains. Global cross-cutting code (env, errors, logger)
  lives in core; shared request plugins live in one plugin location.
- Every route carries API-doc metadata (summary plus tags).
- Validate all inputs at the boundary with the shared schema library (e.g. zod);
  framework-native schemas are acceptable only where the framework requires them.
- Alias colliding module names on import instead of renaming exports.
- Services throw typed errors; routes map them to status codes with a uniform
  error body. Missing resources map to 404.
- Password-gated areas use a token-extraction plus guard helper; 401 on failure.
- Background collectors are failure-isolated: they never throw, they log and
  continue, they degrade per source, and they skip unavailable dependencies.
- Schedules come from named constants through one shared job wrapper.
- Route tests run in-process over synthetic HTTP requests and assert status
  plus body. Fakes inject through optional dependency overrides.

## 7. Embedded storage (extends backend; e.g. SQLite)

- One data-access layer used by all app code; no ad-hoc raw statements.
  At most one documented exception for aggregate rollups.
- One schema file is the source of truth, applied by an init command after
  schema changes. Table names are centralized.
- Fixed column-type conventions: text timestamps, integer units, real aggregates.
- Tiered retention: fine-grained recent rows roll into coarser aggregates,
  then prune resolved records past the retention window.
- One connection object with debug query logging; storage path from config.
- Test isolation: wipe tables between tests, create and drop scratch tables
  around suites, save and restore any env mutated by logic tests.

## 8. Design system (extends UI)

- One token file owns the visual language: radius, height scale, borders,
  fills, text, placeholder, focus, and label styles. Every control consumes
  tokens — no hardcoded values in components.
- One radius for controls, panels, and dropdowns. One height scale
  (e.g. `xs`/`sm`/`md`/`lg`, default `md`) so toolbar rows align.
- Fixed border/fill roles: one border tone for controls, one for panels/cards;
  input-like controls share one fill while buttons carry their own.
- One focus treatment everywhere (e.g. accent border, no default outline).
- Variants come from a variant helper with explicit defaults
  (e.g. accent/danger/ghost/primary/secondary/warning × sizes).
- One icon library for the whole app, sized via prop.
- Dark-theme (or light-theme) token consistency is enforced in tests:
  assert the rendered classes/variants, not just behavior.

## 9. Tailwind (extends styling; e.g. v4)

- Utility classes are the default styling mechanism. One stylesheet entry
  contains only the framework import; no framework config file unless the
  version requires it.
- Conditional classes merge through a single helper combining a joiner with a
  conflict-resolver (e.g. a `cn`-style `twMerge(clsx(...))` helper).
  Never hand-concatenate conflicting utilities.
- Sizes flow from the design-system tokens, not inline values.
- Third-party components that Tailwind cannot reach are the only reason for
  hand-written CSS (see §10). Everything else stays in utilities.

## 10. CSS and CSS Modules (extends styling)

- No CSS Modules unless the repo already uses them. Plain CSS exists only as a
  scoped override layer for third-party libraries.
- Override files are scoped to one panel class (e.g. `.date-picker-panel …`)
  so they cannot leak; they theme library variables plus minimal structural
  rules (hover, focus-visible, selected, disabled, dropdowns, headers).
- Each override file opens with a comment stating what it tunes, what base
  stylesheet it sits on, and why utilities cannot do the job
  (e.g. layered vs. unlayered cascade conflicts).
- Prefer library variables over selectors; selectors only for states the
  library does not expose as variables.

## 11. UI components (extends React)

- One shared primitives location (e.g. button, icon-button, select,
  text-field, switch, loader, error displays, section headers, gates/locks).
- Every shared control is built from design-system tokens so border, radius,
  and height stay uniform; field-like controls share one size-variant helper.
- Primitives accept a `className` passthrough merged last so callers can
  extend without forking.
- Feature views compose primitives plus domain sections and leaves
  (e.g. page → cards/history sections → per-metric cards); leaves stay small.
- Gated areas (admin, password tabs) compose a gate plus a lock inside the
  page shell rather than branching inside content components.

## 12. Mocks (extends testing)

- Backend: mock at the data-source boundary. Each collector exposes a mock
  generator next to the real reader behind one environment flag; the flag
  selects mock data, never a second code path through services or routes.
  Scans that make no sense against fake data are skipped with a log line.
  Seed scripts provide mock history plus domain fixtures; dev compose enables
  the flag so local dev needs no secrets. The flag is never enabled in prod.
- Frontend: no mock server. Tests stub the network per test
  (e.g. stub global fetch, resolve canned payloads, assert the request URL)
  and restore afterwards. No committed fixture servers unless the repo has one.
- Contract rule: mock payloads satisfy the same shared types the real API
  returns, so type drift breaks tests, not production.

## 13. Workflow (all stacks)

1. Plan — restate the goal, the files involved, and how to verify. Keep it short.
2. Branch — one focused branch per change, from a clean tree.
3. Code — smallest diff that does the job; follow §§1–12; no unrelated reformats.
4. Validate locally — lint first, then typecheck, then tests, then the app
   (dev servers / in-process route drives / targeted checks). Fix everything
   before proposing a merge. Confirm no unintended files.
5. Create PR — small, with what changed, why, and how it was verified.
6. Review — address every comment or push back with evidence; re-validate
   after changes.
7. Merge — only with checks green and explicit approval; destructive or
   production operations only on explicit user confirmation.
