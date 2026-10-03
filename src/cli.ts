/**
 * cli.ts — the command over the renderer.
 *
 *   colourway --template <path> --out <path>              render, and write
 *   colourway --template <path> --out <path> --check      compare, and report
 *
 * Exit codes are the contract a consuming repository gates on:
 *
 *   0  the write succeeded, or the check found the output and the record current
 *   1  drift: the output is missing, differs from a fresh render, the record
 *      differs, or the palette is not the digest the caller pinned
 *   2  the render could not happen: bad arguments, no palette to read, an
 *      unreadable or invalid palette, a template that is missing, malformed,
 *      thrown or returning a non-string
 *
 * Nothing is written on exit 2.
 */

import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import {
  differingFields,
  type RenderRequest,
  compareOutput,
  planRender,
  readRecord,
  writePlan,
} from "./engine.ts"

const USAGE = `usage: colourway --template <path> --out <path> [options]

  --template <path>      the template module to render
  --out <path>           the file to write, or to compare against with --check
  --check                render in memory and compare; exit 1 when they differ
  --record <path>        a JSON record of what produced the output: written, or
                         compared with --check
  --palette <path>       the palette source (default: $COLOURWAY_PALETTE, else
                         $XDG_CONFIG_HOME/colourway/palette.json)
  --revision <string>    the palette revision to record (default: the palette's own
                         commit when it sits in a repository, else unversioned)
  --expect-palette <sha256>  fail unless the loaded palette digest is exactly this

exit codes: 0 current, 1 drift, 2 the render could not happen
`

/**
 * The palette path a run reads: `--palette` first, then `COLOURWAY_PALETTE`,
 * then the standard configuration location. Only the last is checked here: a
 * path a caller named is reported by the loader that fails to read it.
 */
export function resolvePalettePath(named?: string, env: NodeJS.ProcessEnv = process.env): string {
  if (named !== undefined) return named
  const fromEnv = env["COLOURWAY_PALETTE"]
  if (fromEnv !== undefined && fromEnv !== "") return fromEnv
  const configHome = env["XDG_CONFIG_HOME"]
  const home = configHome !== undefined && configHome !== "" ? configHome : join(homedir(), ".config")
  const fallback = join(home, "colourway", "palette.json")
  if (existsSync(fallback)) return fallback
  throw new PaletteUnavailable(
    `no palette at ${fallback}: pass --palette <path>, set COLOURWAY_PALETTE, or write the file there`,
  )
}

export type Options = {
  check: boolean
  template: string
  out: string
  palette: string
  revision?: string
  record?: string
  expectPalette?: string
}

export function parseArgs(argv: string[]): Options {
  const values: Record<string, string> = {}
  let check = false
  const takesValue = new Set(["--template", "--out", "--record", "--palette", "--revision", "--expect-palette"])

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] as string
    if (arg === "--check") {
      check = true
      continue
    }
    if (arg === "--help" || arg === "-h") throw new HelpRequested()
    if (!takesValue.has(arg)) throw new UsageError(`unknown argument: ${arg}`)
    index += 1
    const value = argv[index]
    if (value === undefined) throw new UsageError(`${arg} needs a value`)
    if (values[arg] !== undefined) throw new UsageError(`${arg} was given twice`)
    values[arg] = value
  }

  const template = values["--template"]
  const out = values["--out"]
  if (template === undefined) throw new UsageError("--template is required")
  if (out === undefined) throw new UsageError("--out is required")
  const expectPalette = values["--expect-palette"]
  if (expectPalette !== undefined && !/^[0-9a-f]{64}$/.test(expectPalette)) throw new UsageError("--expect-palette takes a sha256 digest")

  return {
    check,
    template,
    out,
    palette: resolvePalettePath(values["--palette"]),
    revision: values["--revision"],
    record: values["--record"],
    expectPalette,
  }
}

/** No palette could be resolved before the render started. */
export class PaletteUnavailable extends Error {}

export class UsageError extends Error {}

export class HelpRequested extends Error {}

export type Streams = { out: (line: string) => void; err: (line: string) => void }

const consoleStreams: Streams = {
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
}

export async function main(argv: string[], streams: Streams = consoleStreams): Promise<number> {
  let options: Options
  try {
    options = parseArgs(argv)
  } catch (error) {
    if (error instanceof HelpRequested) {
      streams.out(USAGE.trimEnd())
      return 0
    }
    streams.err((error as Error).message)
    if (error instanceof UsageError) streams.err(USAGE.trimEnd())
    return 2
  }
  const request: RenderRequest = {
    template: options.template,
    out: options.out,
    palette: options.palette,
    revision: options.revision,
    record: options.record,
  }

  try {
    const plan = await planRender(request)

    if (options.expectPalette !== undefined && plan.palette.sha256 !== options.expectPalette) {
      streams.out(`palette-mismatch ${options.palette}: expected ${options.expectPalette}, found ${plan.palette.sha256}`)
      return 1
    }

    if (!options.check) {
      writePlan(plan, request)
      streams.out(`rendered ${options.out}`)
      if (options.record !== undefined) streams.out(`recorded ${options.record}`)
      return 0
    }

    const drift: string[] = []
    const outputState = compareOutput(options.out, plan.content)
    if (outputState !== undefined) drift.push(`${outputState} ${options.out}`)

    if (options.record !== undefined) {
      if (!existsSync(options.record)) {
        drift.push(`record-missing ${options.record}`)
      } else {
        const differences = differingFields(plan.record, readRecord(options.record))
        if (differences.length > 0) drift.push(`record-stale ${options.record}: ${differences.join("; ")}`)
      }
    }

    for (const line of drift) streams.out(line)
    if (drift.length === 0) {
      streams.out(`clean ${options.out}`)
      return 0
    }
    return 1
  } catch (error) {
    streams.err((error as Error).message)
    return 2
  }
}
