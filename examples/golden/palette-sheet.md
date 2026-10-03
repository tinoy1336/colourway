# Palette sheet

Rendered from the palette at revision example, sha256 dd9632a6255f.
Every value below comes from the palette source; this sheet is generated, so edit that instead.

## surface

| Token | Value | Purpose |
| --- | --- | --- |
| `surface.base` | `#131110` | The translucent base every glass surface composites over; each surface's own opacity is an opacity.* token. |
| `surface.view` | `#1d1a16` | The opaque background of a content view that sits above the base. |
| `surface.window` | `#24201b` | The opaque background of a floating window. |
| `surface.raised` | `#2c2721` | The background of a control or card raised above the view it sits in. |
| `surface.input` | `#1a1713` | The base of the on-screen input panel; its own opacity is opacity.input-panel. |

## text

| Token | Value | Purpose |
| --- | --- | --- |
| `text.strong` | `#ffffff` | The highest emphasis text: a heading that must outrank everything around it. |
| `text.primary` | `#e3dccd` | Default body text: the colour ordinary prose and control labels are drawn in. |
| `text.secondary` | `#c5bcaa` | Supporting text one step below the default. |
| `text.muted` | `#9e9482` | Text that must recede: labels, metadata, secondary detail. |
| `text.faint` | `#9e9482` at 0.55, opaque stand-in `#5f594f` | The lowest text tier, carried as translucency so it recedes on any surface. |
| `text.faint-solid` | `#5f594f` | The opaque stand-in for text.faint, for carriers that cannot express alpha. |
| `text.on-accent` | `#17130f` | Text and icons drawn on a filled accent surface. |

## accent

| Token | Value | Purpose |
| --- | --- | --- |
| `accent.primary` | `#d9a24a` | The one hue the interface leads with: selection, focus and emphasis. |
| `accent.soft` | `#e4be80` | A lighter step of the primary accent, for emphasis on a dark surface. |
| `accent.secondary` | `#6fb3a8` | A second accent hue, for the places where two accent hues must be told apart. |
| `accent.tertiary` | `#b98bc9` | A third accent hue, one step further from the primary than accent.secondary. |

## state

| Token | Value | Purpose |
| --- | --- | --- |
| `state.error` | `#e06c62` | Failure or destruction: invalid input, a destructive action, an error. |
| `state.warning` | `#d9b45a` | Caution: something needs attention but nothing has failed. |
| `state.success` | `#4ad97a` | A completed or healthy condition. |

## border

| Token | Value | Purpose |
| --- | --- | --- |
| `border.hairline` | `#ffffff` at 0.06, opaque stand-in `#211f1e` | The faintest edge: a panel against the surface behind it. |
| `border.divider` | same as `border.hairline` | The separator between the rows of a list; the same decision as border.hairline, so the two cannot drift. |
| `border.strong` | `#ffffff` at 0.1, opaque stand-in `#2b2928` | A boundary that must be seen, between two regions of one surface. |
| `border.active` | `#cfc7b6` | The border of the window that holds the focus. |
| `border.inactive` | `#000000` at 0, opaque stand-in `#131110` | The border of a window that does not hold the focus: fully transparent. |

## interaction

| Token | Value | Purpose |
| --- | --- | --- |
| `interaction.hover` | `#ffffff` at 0.08, opaque stand-in `#262423` | The background of a control under the pointer. |
| `interaction.hover-strong` | `#ffffff` at 0.14, opaque stand-in `#343231` | The pointer's background where the surface underneath is already light. |
| `interaction.wash` | `#ffffff` at 0.1, opaque stand-in `#2b2928` | A thin film laid over a region to lift it off the surface behind. |
| `interaction.card-wash` | `#ffffff` at 0.05, opaque stand-in `#1f1d1c` | The smaller lift applied to a card inside an already raised panel. |
| `interaction.row-highlight` | `#ffffff` at 0.1, opaque stand-in `#2b2928` | The background of the list row under the pointer. |
| `interaction.row-active` | `#ffffff` at 0.16, opaque stand-in `#393736` | The background of the list row being pressed or dragged. |
| `interaction.row-selected` | `#131110` at 0.72, opaque stand-in `#131110` | The background of the list row that is the current selection. |
| `interaction.selection-menu` | `#d9a24a` at 0.22, opaque stand-in `#3f311d` | The selection fill inside a pop-up menu. |
| `interaction.selection-row` | `#d9a24a` at 0.35, opaque stand-in `#584424` | The selection fill of the active row in a list. |
| `interaction.selection-text` | `#d9a24a` at 0.45, opaque stand-in `#6c522a` | The fill behind text a reader has highlighted. |
| `interaction.accent-fill` | `#d9a24a` at 0.18, opaque stand-in `#372b1a` | The accent laid down as a fill beneath text or an icon. |
| `interaction.focus-ring` | `#d9a24a` at 0.55, opaque stand-in `#806130` | The ring drawn around the element that holds keyboard focus. |
| `interaction.danger-fill` | `#e06c62` at 0.16, opaque stand-in `#34201d` | The destructive action's fill, at a strength that reads as a warning rather than an alarm. |
| `interaction.scrollbar-thumb` | `#ffffff` at 0.22, opaque stand-in `#474545` | The scrollbar thumb at rest. |
| `interaction.scrollbar-thumb-hover` | `#ffffff` at 0.3, opaque stand-in `#5a5858` | The scrollbar thumb under the pointer. |
| `interaction.scrollbar-thumb-active` | `#ffffff` at 0.45, opaque stand-in `#7d7c7c` | The scrollbar thumb while it is dragged. |

## opacity

| Token | Value | Purpose |
| --- | --- | --- |
| `opacity.panel` | opacity 0.5 | How much shows through the primary panel surface. |
| `opacity.card` | opacity 0.5 | How much shows through a raised card surface. |
| `opacity.backdrop` | opacity 0.35 | How much shows through the large backdrop behind a set of controls. |
| `opacity.control-disc` | opacity 0.45 | How much shows through the small rounded panel that groups a few controls. |
| `opacity.menu` | opacity 0.55 | How much shows through a pop-up menu. |
| `opacity.message` | opacity 0.5 | How much shows through a message panel. |
| `opacity.message-urgent` | opacity 0.62 | How much shows through a message panel whose text must stay legible against whatever is behind it. |
| `opacity.input-panel` | opacity 0.72 | How much shows through the on-screen input panel. |
| `opacity.terminal` | opacity 0.5 | How much shows through a full-screen text console surface. |

## effect

| Token | Value | Purpose |
| --- | --- | --- |
| `effect.text-shadow` | `#000000` at 0.44, opaque stand-in `#0b0a09` | The colour behind text so it stays legible over an image; the offset that pairs with it is geometry, not a palette value. |
| `effect.glow-alpha` | opacity 0.22 | How strong the halo around a focused or active element is drawn; the halo's colour is accent.primary. |
| `effect.scrim-base` | `#000000` | The colour the readability wash is painted in. |
| `effect.scrim-opacity` | opacity 0.5 | How strong the readability wash is. |

## syntax

| Token | Value | Purpose |
| --- | --- | --- |
| `syntax.comment` | same as `text.muted` | Source comments: the quietest text in a code listing. |
| `syntax.keyword` | same as `accent.primary` | Language keywords: the words that carry structural meaning. |
| `syntax.function` | same as `accent.soft` | Callable names: a function or a method in a code listing. |
| `syntax.variable` | same as `text.primary` | Identifiers that are neither a call nor a type. |
| `syntax.string` | same as `state.success` | String and character literals. |
| `syntax.number` | same as `state.warning` | Numeric and boolean literals. |
| `syntax.type` | same as `accent.secondary` | Type, class and enum names. |
| `syntax.operator` | same as `text.strong` | Operators and the punctuation that groups expressions. |
| `syntax.punctuation` | same as `text.faint-solid` | Structural punctuation: brackets, separators, terminators. |

## terminal

| Token | Value | Purpose |
| --- | --- | --- |
| `terminal.0` | same as `surface.base` | The default background of a text console. |
| `terminal.1` | same as `state.error` | Failure text in a text console. |
| `terminal.2` | same as `state.success` | Success text in a text console. |
| `terminal.3` | same as `state.warning` | Caution text in a text console. |
| `terminal.4` | same as `accent.primary` | The primary accent hue in a text console. |
| `terminal.5` | same as `accent.tertiary` | The third accent hue in a text console. |
| `terminal.6` | same as `accent.secondary` | The second accent hue in a text console. |
| `terminal.7` | same as `text.muted` | Ordinary foreground text in a text console. |
| `terminal.8` | same as `text.faint-solid` | The faintest readable text in a text console. |
| `terminal.9` | `#e89189` | A brighter failure colour than slot 1. |
| `terminal.10` | `#77e39b` | A brighter success colour than slot 2. |
| `terminal.11` | `#e3c783` | A brighter caution colour than slot 3. |
| `terminal.12` | `#e3b977` | A brighter primary accent than slot 4. |
| `terminal.13` | `#cba8d7` | A brighter third accent than slot 5. |
| `terminal.14` | `#93c6be` | A brighter second accent than slot 6. |
| `terminal.15` | same as `text.primary` | The brightest foreground text in a text console. |

## Contrast

Body text on the base surface: 13.79:1.
