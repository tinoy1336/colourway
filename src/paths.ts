/**
 * paths.ts — where the package is installed.
 *
 * The schema belongs to the package rather than to the palette file beside it: a
 * palette is a consumer's configuration, and a second copy of the schema living
 * there could drift from the renderer that enforces it. This is the one place
 * the layout is written down.
 *
 * Both the sources (`src/`) and a built package (`dist/`) sit one level below
 * the file that carries the schema, so the same expression resolves the root in
 * either layout.
 */

import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

/** The directory holding `palette.schema.json` and the package manifest. */
export const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)))
