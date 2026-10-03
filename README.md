# colourway

One palette, and a renderer that turns it into any file a project needs.

A palette is a set of colours and opacities written as purpose-named tokens: what
a value is *for*, never what colour it is or which file it lands in. The renderer
knows nothing about any destination — it loads a template module, hands it the
palette and a small colour helper API, and writes exactly what the template
returns. Every template belongs to the project that uses it, lives in that
project's own repository, and is committed beside the file it produces.

Nothing here defines geometry, motion, glyphs or layout.

The palette file belongs to the project it serves, so this repository ships one
only as a worked example, and the command resolves the real one from the machine
it runs on (see [Where the palette is read from](#where-the-palette-is-read-from)).

The rule this repository keeps: **the palette's names and keys, the renderer and
the example carry no consumer, product or toolkit name and no carrier format
name.** A value is named for its purpose, and the renderer knows no destination,
so adding a consumer never adds a token here. A guard enforces the rule over
every text file in the tree, with one named exception: the guard's own file holds
the list of refused words, and prose may name the formats this repository's own
artifacts are written in — its source, schema and record are JSON, and the
example renders a Markdown sheet.

## Install

```sh
npx --yes @tinoy/colourway --help          # one run, nothing installed
npm install --save-dev @tinoy/colourway    # or as a development dependency
```

Node 22.18 or later. A project that gates its generated files takes the package
as a development dependency and pins the version it renders with; a one-off run
pins it on the command line, `npx --yes @tinoy/colourway@0.1.0`.

## Where the palette is read from

First match wins, and a run that finds none stops with exit `2` naming the path
it looked in:

1. `--palette <path>`, the explicit flag.
2. `$COLOURWAY_PALETTE`, the environment variable.
3. `$XDG_CONFIG_HOME/colourway/palette.json`, falling back to
   `~/.config/colourway/palette.json`.

A gate always passes `--palette` explicitly, so what it renders never depends on
where the run happened. The other two steps are for a person running the command
by hand.

The **schema is part of the package**, not a file beside the palette: a second
copy next to a project's palette could drift from the renderer that enforces it.
Every run validates the palette against the schema it ships with before anything
is rendered.

## The palette file

Ten groups of tokens. Every token's full name is `group.key`, and its purpose is a
sentence in the palette file — the file is the list, this is the shape of it:

| Group | What it holds |
|---|---|
| `surface` | The base that translucent surfaces composite over, and the opaque tiers above it. |
| `text` | Text by emphasis tier, from the loudest heading to the quietest label, plus the colour used on a filled accent. |
| `accent` | The accent family: the leading hue, a lighter step of it, and two further hues. |
| `state` | Failure, caution and success. |
| `border` | Edges, separators, and the pair of window border colours. |
| `interaction` | The fills a control takes as it is pointed at, pressed, selected or dragged, and the keyboard focus ring. |
| `opacity` | How much shows through each surface. |
| `effect` | A text shadow, a halo, and the wash laid over a backdrop for legibility. |
| `syntax` | The colours of a code listing by syntactic role. Every one is an alias of another token. |
| `terminal` | The conventional sixteen colour slots of a text console. |

A token is written in exactly one of five shapes:

```jsonc
{ "hex": "#131110", "purpose": "…" }                       // a solid colour
{ "hex": "#ffffff", "alpha": 0.06, "purpose": "…" }        // a colour with its own opacity
{ "alpha": 0.5, "purpose": "…" }                           // an opacity with no colour
{ "alias": "border.hairline", "purpose": "…" }             // the same decision as another token
{ "derive": { "op": "rotate-hue", "from": "accent.primary", "degrees": 140 }, "purpose": "…" }
```

Three derivation operations exist and no more: `blend-toward-white`, `rotate-hue`
and `composite` (a translucent token painted over a solid one). `frozen: true`
marks a value that was tuned by eye: it is carried unchanged, never derived,
averaged or normalised, and only the palette's own project can say what it was
tuned to.

Two tables outside the groups:

- **`composites`** — the opaque stand-in for each translucent token, for a carrier
  that cannot express opacity. A test recomputes every one of them from the token
  and allows one step of rounding per channel.
- The **schema** — every group, every token, and the five shapes, validated on
  every run, so a palette that breaks the schema does not render at all.

## The command

```sh
colourway --template <path> --out <path>
colourway --template <path> --out <path> --check
colourway --template <path> --out <path> --record <path>
colourway --template <path> --out <path> --check --expect-palette <sha256>
```

| Option | What it does |
|---|---|
| `--template <path>` | The template module to render. |
| `--out <path>` | The file to write, or the file to compare against with `--check`. A missing parent directory is created. |
| `--check` | Renders in memory and compares. Writes nothing. |
| `--record <path>` | A JSON record of what produced the output: written, or compared by `--check`. |
| `--palette <path>` | The palette source. See the resolution order above. |
| `--revision <string>` | The palette revision to record. Default: the palette's own commit when it sits in a repository, otherwise `unversioned`. |
| `--expect-palette <sha256>` | Fail unless the loaded palette is exactly this digest. |

### Exit codes: the promise a gate can rely on

| Code | Meaning |
|---|---|
| `0` | The write succeeded; or `--check` found the output and the record current. |
| `1` | Drift: the output is missing, the output differs from a fresh render, the record differs (the template or the palette moved), or the palette is not the digest that was pinned with `--expect-palette`. The reason is printed, one line each, naming the file and the digest it moved from. |
| `2` | The render could not happen: bad arguments, no palette to read, a palette that fails the schema, a template that is missing, malformed, thrown, or returning something other than a string, a record that is not a record, or a write that cannot be performed. The reason is printed on standard error. |

A write goes to a temporary file beside the destination and is renamed into
place, so a reader of the output sees the whole previous file or the whole new
one, never a half-written mix. A write that fails — the destination is a
directory, the directory refuses the write — exits `2`, leaves the destination
directory as it found it, and leaves no temporary file behind.

Exit `2` is never drift: it means the gate could not do its job, and a gate that
treats it as "current" is broken.

## Writing a template

A template module is an ES module whose default export is an object with a
`render(context)` method that returns the exact text of the output. The renderer
adds nothing to it: no header, no trailing newline, no reformatting. Everything a
template may use arrives in `context`:

- `context.palette` — the frozen palette: `version`, `tokens` (every token by
  full name) and `find(name)`.
- `context.colour` — the frozen helper API: `parseHex`, `toHex`, `toHsl`,
  `fromHsl`, `blendTowardWhite`, `compositeOver`, `rotateHue`, `contrastRatio`,
  `formatAlpha`, `isHex`.
- `context.provenance` — `generator`, `template.sha256`, `palette.sha256` and
  `palette.revision`, for a template that stamps its own header.

The full contract — what a template exports, what it receives, what it may
return, and how errors surface — is in
[`docs/template-contract.md`](docs/template-contract.md).

## The example

`examples/palette.json` is a complete palette, written as an illustration rather
than as anyone's configuration, and `examples/palette-sheet.template.ts` renders
the whole of it as a Markdown sheet. Its committed golden output and record live
in `examples/golden/`:

```sh
colourway --template examples/palette-sheet.template.ts \
  --palette examples/palette.json \
  --out examples/golden/palette-sheet.md \
  --record examples/golden/palette-sheet.record.json \
  --revision example
```

## What a consuming project gate relies on

The output path is the caller's `--out`; a template never writes, opens or
deletes a file. With `--record <path>` the renderer also writes what produced the
output:

```json
{
  "version": 1,
  "template": { "sha256": "…" },
  "palette": { "sha256": "…", "revision": "…" },
  "output": { "sha256": "…" }
}
```

It holds digests and a version, never a path, so two checkouts of one palette
render identical records. **Identity is the three digests; the recorded revision
is provenance** — it says which checkout a render came from — and the check never
compares it, so a palette checkout that moves without its content changing leaves
a project's gate current. A project pins what it rendered against in two steps:

1. **The record.** Committed beside the generated file, it names the palette
   digest the output was produced from. Nothing else detects that the palette
   moved underneath a project: the check fails, printing the recorded digest and
   the one now loaded, and the project re-renders, reads the diff and commits the
   new output and record deliberately.
2. **The digest, in the gate.** Passing `--expect-palette <sha256>` from the
   project's own configuration turns "the palette changed" into a hard failure
   even before the output is compared, which is what a project wants when it must
   choose the moment to take a change.

A mismatch is never silent, and a template change is the same shape of event:
the record names the template that produced the current output, so editing a
template without re-rendering is drift even when the bytes it produces are
unchanged.

## Tests

```sh
npm test
```

The suite is offline, dependency-free and runs the sources directly. It covers
the schema and every rule in it (each proved by a fixture that breaks it), the
palette's arithmetic — purposes, derivations, aliases and opaque stand-ins — the
colour helpers, where a run looks for the palette, the engine (loading, a
malformed template, a throwing template, a non-string return, no partial write, a
write that cannot happen, the parent directory of an output, and the palette
revision default), the check path with its exit codes, the example end to end
against its committed golden output, the absence of any consumer or carrier-format
vocabulary from every text file in the tree, and determinism: two runs are
byte-identical, and so are a run from another working directory and a run with the
palette loaded from a copy at another path.

Packing the package runs `scripts/build-package.mjs`, which writes the JavaScript
a published package runs — Node refuses to strip types from a file under a
`node_modules` path, so the sources cannot be the published artifact. The
stripping is Node's own, so no compiler and no dependency is involved.

## Licence

MIT — see [LICENSE](LICENSE).
