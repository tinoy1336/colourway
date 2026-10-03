# AGENTS.md — colourway

Spec sheet for the palette format and its renderer. Read this before editing
anything in this tree, and update it in the same change as the code.

## What this repository owns

- `palette.schema.json` — the vocabulary: every group, every token, and the five
  value shapes. It ships inside the package and travels with the renderer that
  enforces it.
- `src/` — the renderer: colour arithmetic, the schema validator, the palette
  loader, the engine, the command, and the one place the package layout is written
  down.
- `bin/colourway` — the command a rendering step calls.
- `examples/` — an illustration, not a configuration: a complete palette, one
  worked template, and their committed golden output and record.
- `scripts/build-package.mjs` — writes the JavaScript a published package runs.
- `tests/` — the suite, plain `node --test`, no dependency of any kind.
- `docs/template-contract.md` — the contract a consuming repository writes
  against.

What it does not own, and must never contain: the palette a project actually
renders from (that file is that project's configuration, and the command resolves
it from the machine it runs on), a template for a particular consumer, a
consumer's destination path, a per-format conversion, or any generated file of
another project. A template lives in the tree it serves, beside the file it
produces, and that tree gates it with `--check`.

## Commands

```sh
bin/colourway --template <path> --out <path> --palette <path>            # render and write
bin/colourway --template <path> --out <path> --palette <path> --check     # compare; 1 on drift
bin/colourway --template <path> --out <path> --palette <path> --record <path> --check
bin/colourway --help

node --test tests/*.test.ts          # the whole suite, offline
node scripts/build-package.mjs       # write dist/ — the published artifact
npm pack --dry-run                   # what a publish would carry
```

Node 22.18 runs the TypeScript sources by stripping types: there is no build
step for development, no package manager and no lockfile, and an import must
carry its `.ts` extension. No syntax that needs transformation (enums,
namespaces, parameter properties) may appear in `src/`, `tests/` or `examples/`.

**The one exception is packing.** Node refuses to strip types from a file under a
`node_modules` path, so the sources cannot be the published artifact; `dist/` is
written at pack time from the same sources, with the same Node stripper. `dist/`
is generated, ignored by git, and never edited.

Regenerate the example golden after an intended change, then read the diff:

```sh
bin/colourway --template examples/palette-sheet.template.ts \
  --palette examples/palette.json \
  --out examples/golden/palette-sheet.md \
  --record examples/golden/palette-sheet.record.json \
  --revision example
```

## The palette a run reads

First match wins: `--palette`, then `$COLOURWAY_PALETTE`, then
`$XDG_CONFIG_HOME/colourway/palette.json` (falling back to
`~/.config/colourway/palette.json`). Only the last is checked before the render
starts: a path a caller named is reported by the loader that fails to read it.
A gate always names the palette explicitly.

## Adding or changing a token

The schema is this repository's; a palette is not. A token exists here once the
schema declares it, and a project's palette adopts it when that project chooses.

1. Add the token to `palette.schema.json` in the group it belongs to.
2. Update `examples/palette.json` so the example still satisfies the schema — a
   test asserts the two name the same tokens in both directions.
3. Use the value shape the value needs: `hex`, `hex` + `alpha`, `alpha`, `alias`,
   or `derive`.
4. If it is derived, write the formula in `derive`; a derived number with no
   formula is how a hand-tuned value hides among the derived ones.
5. If it is translucent, add its opaque stand-in to the example's `composites`.
6. If two tokens must hold the same value, make one an `alias` of the other so
   they cannot drift; never copy the number.
7. Regenerate the example golden and review the rendered diff.

Rules that decide the shape of a name:

- **Name the token for the job it does.** Never for its colour, its consumer or
  the file it lands in. `interaction.selection-text`, not `selection-note`;
  `accent.secondary`, not `accent-cyan`.
- **One purpose sentence per token**, distinct from every other token's: a test
  refuses a repeat, because a repeated purpose means two tokens are one decision.
- **Alpha decides the shape.** A carrier that cannot express opacity takes the
  token's `solid` value — the declared composite, or the token painted over
  `surface.base` — never a value picked by eye at the call site. `solid` is
  present exactly when the token carries a colour.
- **A frozen value is carried, never derived, averaged or normalised.** The
  per-surface opacities exist precisely because one opacity does not read the same
  through two surfaces.

## Rules for the renderer

- **The rule the guard enforces, exactly.** The palette's names and keys, the
  renderer and the example carry no consumer, product or toolkit name and no
  carrier format name. `tests/vocabulary.test.ts` scans every text file in the
  tree for both lists and for wording that describes a particular machine, its
  owner or the run that wrote a file. Two named exceptions, because the rule is
  about names and knowledge rather than about prose: the guard's own file holds
  the refused words, and prose may name the formats this repository's own
  artifacts are written in. The guard plants a consumer name in one file of every
  kind the walk accepts and requires it back as a violation, so trimming either
  list fails the suite.
- Colour helpers deal in colour models only. Formatting for a destination belongs
  to the template that owns that destination.
- The palette is validated against the bundled schema before anything renders, and
  an unknown token name is an error, never a blank value.
- The palettes and tokens handed to a template are frozen.
- Exit codes are a contract: `0` current, `1` drift, `2` the render could not
  happen. Nothing is written on `2`, and an output is written whole or not at all:
  a temporary file beside the destination, then a rename, then the temporary file
  removed if anything fails.

## The record, and what a project gates on

`--record` writes a JSON record of what produced the output: the template digest,
the palette digest and revision, and the output digest. It holds no path, so it is
identical in every checkout and can be committed beside the generated file. **The
digests are identity and the revision is provenance**: a gate is decided by content
only, so a checkout that moved without the palette changing leaves a consumer
current. A stored record is validated on read — version, both digests, the
revision — and anything else is exit `2` naming the field, never drift. A
consuming repository gates its commits on `--check`, and pins the palette it
rendered against with the recorded digest plus `--expect-palette <sha256>`. The
consumer side is documented in `README.md` and `docs/template-contract.md`.

## Continuous integration

`.github/workflows/ci.yml` runs the suite on every push to `main` and every pull
request: one job, no install step, because there is nothing to install. The Node
major version is pinned (`22`), so the runner's patch release is its own; an
action is adopted by tag, and the version-and-digest rule below applies to a tool
this repository downloads and runs, not to the runner's own actions.

## Gotchas

- **A published artifact cannot be TypeScript.** Node refuses to strip types from
  a file under a `node_modules` path, so `npm publish` ships `dist/` written by
  `scripts/build-package.mjs`. A change that only edits `src/` is not published
  until the package is packed again.
- **A template edit is drift even when the bytes are identical.** The record names
  the template that produced the output, so re-render after touching a template.
- **The goldens are the review surface.** Never regenerate one to make a failing
  test pass without reading the diff.
- **Nothing in a render may depend on the working directory, the checkout path or
  the clock.** The determinism test fails on any of them, and it is the only place
  a leaked path would show up.
- **An unknown schema keyword is refused.** The shipped validator implements a
  fixed subset and reports anything else, so a schema can never read as enforced
  while checking nothing.
- **A record that cannot be read is exit `2`, not drift.** A gate that treats `2`
  as "current" is broken.
- **There is no typecheck and no linter, by design.** Node strips the types, so a
  type-level mistake in `src/`, `tests/` or `examples/` is invisible to this suite
  and to CI. Only a mistake that changes behaviour fails.
