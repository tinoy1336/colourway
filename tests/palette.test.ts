/**
 * The palette's own arithmetic, over the example palette: every token states a
 * purpose no other states, every derived token recomputes from its formula, and
 * every opaque stand-in is the token painted over the base surface.
 *
 * The design a palette encodes — the numbers it tuned by eye and the contrast
 * its text tiers reach — belongs to whoever owns that palette, so nothing here
 * asserts it.
 */

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { test } from "node:test"
import { blendTowardWhite, compositeOver, parseHex, rotateHue } from "../src/colour.ts"
import { packageRoot } from "../src/paths.ts"
import { buildPalette, loadPalette, type Palette, type Token } from "../src/palette.ts"

const palette: Palette = loadPalette(join(packageRoot, "examples", "palette.json"))
const hexOf = (name: string): string => {
  const hex = palette.find(name).hex
  assert.ok(hex !== undefined, `${name} carries no colour`)
  return hex
}

test("every token states what it is for, and no two state the same thing", () => {
  const tokens = Object.values(palette.tokens)
  assert.ok(tokens.length >= 70, `only ${tokens.length} tokens`)
  const purposes = new Map<string, string>()
  for (const token of tokens) {
    assert.ok(token.purpose.trim().length >= 20, `${token.name}: purpose too short to state anything: ${token.purpose}`)
    assert.ok(!purposes.has(token.purpose), `${token.name} repeats the purpose of ${purposes.get(token.purpose)}`)
    purposes.set(token.purpose, token.name)
  }
})

test("a derived token recomputes from its own formula", () => {
  assert.equal(hexOf("accent.soft"), blendTowardWhite(hexOf("accent.primary"), 0.3))
  assert.equal(hexOf("state.success"), rotateHue(hexOf("accent.primary"), 140))
  assert.equal(hexOf("text.faint-solid"), compositeOver(hexOf("text.faint"), 0.55, hexOf("surface.base")))
})

test("the bright terminal slots are their own slot a quarter of the way to white", () => {
  const expected: [string, string][] = [
    ["terminal.9", "state.error"],
    ["terminal.10", "state.success"],
    ["terminal.11", "state.warning"],
    ["terminal.12", "accent.primary"],
    ["terminal.13", "accent.tertiary"],
    ["terminal.14", "accent.secondary"],
  ]
  for (const [slot, source] of expected) assert.equal(hexOf(slot), blendTowardWhite(hexOf(source), 0.25), slot)
})

test("every opaque stand-in is its token painted over the base surface", () => {
  const base = hexOf("surface.base")
  const channels = (hex: string) => [parseHex(hex).r, parseHex(hex).g, parseHex(hex).b]
  const translucent = Object.values(palette.tokens).filter((token) => token.hex !== undefined && token.alpha !== undefined && token.alpha > 0)
  assert.ok(translucent.length >= 20, `only ${translucent.length} translucent tokens`)
  for (const token of translucent) {
    const declared = palette.tokens[token.name] as Token
    const computed = compositeOver(token.hex as string, token.alpha as number, base)
    const [a, b] = [channels(declared.solid as string), channels(computed)]
    for (let index = 0; index < 3; index += 1) {
      // One step of slack per channel: the stand-ins were rounded by eye at the
      // half-step boundaries, and a wider gap means a wrong value.
      assert.ok(Math.abs((a[index] as number) - (b[index] as number)) <= 1, `${token.name}: ${declared.solid} against ${computed}`)
    }
  }
})

test("an alias carries the value of the token it names", () => {
  const aliases = Object.values(palette.tokens).filter((token) => token.alias !== undefined)
  assert.ok(aliases.length >= 20, `only ${aliases.length} aliases`)
  for (const token of aliases) {
    const target = palette.find(token.alias as string)
    assert.equal(token.hex, target.hex, `${token.name} against ${target.name}`)
    assert.equal(token.alpha, target.alpha, `${token.name} against ${target.name}`)
    assert.equal(token.solid, target.solid, `${token.name} against ${target.name}`)
  }
})

test("a token name is a group and a key, and the group is the one it sits in", () => {
  for (const [name, token] of Object.entries(palette.tokens)) {
    assert.equal(name, token.name)
    assert.match(name, /^[a-z][a-z0-9-]*\.[a-z0-9-]+$/, name)
    assert.equal(name.slice(0, name.indexOf(".")), token.group, name)
  }
})

test("a token carries an opaque stand-in exactly when it carries a colour", () => {
  for (const token of Object.values(palette.tokens)) {
    assert.equal(token.solid !== undefined, token.hex !== undefined, `${token.name}: hex ${token.hex}, solid ${token.solid}`)
    if (token.hex !== undefined && token.alpha === undefined) assert.equal(token.solid, token.hex, `${token.name} is opaque, so its stand-in is its own colour`)
    if (token.hex !== undefined && token.alpha !== undefined) assert.match(String(token.solid), /^#[0-9a-f]{6}$/, token.name)
  }
})

test("an unknown token name is an error, not an empty value", () => {
  assert.throws(() => palette.find("text.nonexistent"), /no such token: text\.nonexistent/)
})

test("the token table and every token in it are frozen", () => {
  assert.ok(Object.isFrozen(palette))
  assert.ok(Object.isFrozen(palette.tokens))
  for (const token of Object.values(palette.tokens)) assert.ok(Object.isFrozen(token), token.name)
  assert.throws(() => {
    ;(palette.tokens["text.primary"] as { hex?: string }).hex = "#000000"
  }, TypeError)
})

test("the syntax roles are aliases, and each one resolves inside the palette", () => {
  const syntax = Object.values(palette.tokens).filter((token) => token.group === "syntax")
  assert.equal(syntax.length, 9)
  for (const token of syntax) {
    assert.ok(token.alias !== undefined, `${token.name} is not an alias`)
    assert.notEqual(palette.find(token.alias as string).name, token.name)
  }
})

test("a palette that cannot be resolved is refused, naming the reason", () => {
  const source = JSON.parse(readFileSync(join(packageRoot, "examples", "palette.json"), "utf8")) as {
    groups: Record<string, Record<string, Record<string, unknown>>>
  }
  const clone = () => JSON.parse(JSON.stringify(source)) as typeof source

  const translucentBase = clone()
  translucentBase.groups.surface.base.alpha = 0.5
  assert.throws(() => buildPalette(translucentBase as never), /surface.base must be an opaque colour/)

  const missingBase = clone()
  delete missingBase.groups.surface.base
  assert.throws(() => buildPalette(missingBase as never), /surface.base/)

  const missingTarget = clone()
  missingTarget.groups.syntax.comment.alias = "text.nonexistent"
  assert.throws(() => buildPalette(missingTarget as never), /no such token: text.nonexistent/)

  const cycle = clone()
  cycle.groups.syntax.comment.alias = "syntax.keyword"
  cycle.groups.syntax.keyword.alias = "syntax.comment"
  assert.throws(() => buildPalette(cycle as never), /alias cycle: syntax.comment -> syntax.keyword -> syntax.comment/)

  const wrongSource = clone()
  wrongSource.groups.text["faint-solid"] = { derive: { op: "composite", from: "text.primary", over: "surface.base" }, purpose: "A composite of a token that carries no opacity of its own." }
  assert.throws(() => buildPalette(wrongSource as never), /composite derives from text.primary, which carries no alpha/)

  const translucentOver = clone()
  translucentOver.groups.text["faint-solid"] = {
    derive: { op: "composite", from: "text.faint", over: "border.hairline" },
    purpose: "A composite derived over a token that carries its own opacity.",
  }
  assert.throws(() => buildPalette(translucentOver as never), /composite derives over border.hairline, which carries its own opacity/)
})
