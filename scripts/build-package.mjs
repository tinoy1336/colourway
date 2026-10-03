#!/usr/bin/env node
/**
 * build-package.mjs — writes the JavaScript a published package runs.
 *
 * WHY THIS EXISTS. Node refuses to strip types from a file under a
 * `node_modules` path, so the TypeScript sources cannot be the published
 * artifact: a consumer installing this package would get
 * `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` before a render started. The
 * stripping here is Node's own, from `node:module`, so no compiler and no
 * dependency enters the repository, and development and the suite still run the
 * sources directly — only packing pays for the transform.
 *
 * The output is `dist/`, which is not committed: `files` in the manifest names
 * it, and the `prepare` script produces it whenever the package is packed or
 * installed from a repository.
 */

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dist = join(root, "dist")

/** The files the package needs at runtime, relative to the repository root. */
const sources = [
  "bin/colourway",
  ...readdirSync(join(root, "src"))
    .filter((name) => name.endsWith(".ts"))
    .sort()
    .map((name) => `src/${name}`),
]

/** Where a source file lands under `dist/`. */
function outputPath(source) {
  if (source.startsWith("bin/")) return join(dist, "bin", `${source.slice("bin/".length)}.js`)
  return join(dist, source.replace(/^src\//, "").replace(/\.ts$/, ".js"))
}

const outputs = new Map(sources.map((source) => [resolve(root, source), outputPath(source)]))

/**
 * Rewrites one relative import to the path its target takes in `dist/`, so the
 * package does not depend on the source layout it was built from.
 */
function rewriteSpecifier(source, specifier) {
  const from = resolve(root, source)
  const target = resolve(dirname(from), specifier)
  const to = outputs.get(target)
  if (to === undefined) throw new Error(`${source} imports ${specifier}, which is not part of the package`)
  const spec = relative(dirname(outputs.get(from)), to).replace(/\\/g, "/")
  return spec.startsWith(".") ? spec : `./${spec}`
}

rmSync(dist, { recursive: true, force: true })
for (const source of sources) {
  const text = readFileSync(join(root, source), "utf8")
  const rewritten = text.replace(/(from\s+")(\.[^"]*)(")/g, (_match, before, specifier, after) => `${before}${rewriteSpecifier(source, specifier)}${after}`)
  const out = outputPath(source)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, stripTypeScriptTypes(rewritten, { mode: "strip" }))
}
console.log(`colourway: wrote ${sources.length} file(s) to ${relative(root, dist)}`)
