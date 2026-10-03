/**
 * Where a run looks for the palette: the flag first, then the environment, then
 * the standard configuration location, and a refusal that names the path when
 * none of them answers.
 */

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { test } from "node:test"
import { literalTemplate, repoPalette, run, withTempDir, writeInto } from "./helpers.ts"

/** Runs `body` with an environment, restoring every variable it touched. */
async function withEnv<T>(values: Record<string, string | undefined>, body: () => Promise<T>): Promise<T> {
  const saved = new Map<string, string | undefined>()
  for (const [name, value] of Object.entries(values)) {
    saved.set(name, process.env[name])
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
  try {
    return await body()
  } finally {
    for (const [name, value] of saved) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
}

test("an explicit path wins over the environment and the configuration directory", async () => {
  await withTempDir(async (dir) => {
    const named = writeInto(join(dir, "named.json"), readFileSync(repoPalette, "utf8"))
    const template = literalTemplate(dir, "rendered\n")
    await withEnv({ COLOURWAY_PALETTE: join(dir, "elsewhere.json"), XDG_CONFIG_HOME: join(dir, "config") }, async () => {
      const result = await run(["--template", template, "--out", join(dir, "out.txt"), "--palette", named])
      assert.equal(result.code, 0, result.err.join("\n"))
    })
  })
})

test("the environment names the palette when the flag does not", async () => {
  await withTempDir(async (dir) => {
    const named = writeInto(join(dir, "named.json"), readFileSync(repoPalette, "utf8"))
    const template = literalTemplate(dir, "rendered\n")
    await withEnv({ COLOURWAY_PALETTE: named, XDG_CONFIG_HOME: join(dir, "config") }, async () => {
      const result = await run(["--template", template, "--out", join(dir, "out.txt")])
      assert.equal(result.code, 0, result.err.join("\n"))
    })
  })
})

test("the configuration directory answers when neither the flag nor the environment does", async () => {
  await withTempDir(async (dir) => {
    const config = join(dir, "config")
    const palette = writeInto(join(config, "colourway", "palette.json"), readFileSync(repoPalette, "utf8"))
    const template = literalTemplate(dir, "rendered\n")
    await withEnv({ COLOURWAY_PALETTE: undefined, XDG_CONFIG_HOME: config }, async () => {
      const result = await run(["--template", template, "--out", join(dir, "out.txt")])
      assert.equal(result.code, 0, result.err.join("\n"))
      assert.ok(palette.endsWith(join("colourway", "palette.json")))
    })
  })
})

test("a run with no palette anywhere refuses, naming the path it looked in", async () => {
  await withTempDir(async (dir) => {
    const template = literalTemplate(dir, "rendered\n")
    const empty = join(dir, "empty")
    await withEnv({ COLOURWAY_PALETTE: undefined, XDG_CONFIG_HOME: empty }, async () => {
      const result = await run(["--template", template, "--out", join(dir, "out.txt")])
      assert.equal(result.code, 2)
      const message = result.err.join("\n")
      assert.match(message, /no palette at /)
      assert.match(message, /COLOURWAY_PALETTE/)
      assert.ok(message.includes(join("colourway", "palette.json")), message)
    })
  })
})

test("an environment path that is not there is still the path the run reports", async () => {
  await withTempDir(async (dir) => {
    const template = literalTemplate(dir, "rendered\n")
    const missing = join(dir, "missing.json")
    await withEnv({ COLOURWAY_PALETTE: missing }, async () => {
      const result = await run(["--template", template, "--out", join(dir, "out.txt")])
      assert.equal(result.code, 2)
      assert.match(result.err.join("\n"), new RegExp(`palette ${missing.replace(/[.]/g, "\\.")} could not be read`))
    })
  })
})
