# Site themes — design

## Goal
One click restyles the whole site: colours, heading/body fonts and corner rounding.
Changing a theme colour updates every element that uses it.

## Data
```
project.theme = {
  colors: { primary, accent, ink, muted, surface, dark },   // hex
  fonts:  { heading, body },                                // curated Google Font family or '' (system)
  radius: 10,                                               // px
}
```
Missing on old projects → `normalizeProject` adds the default theme. That is the
current Indigo look, so nothing changes visually. `tokens.colors` stay as extra swatches.

## How elements use the theme
- The theme becomes CSS variables on `:root`: `--pm-primary` … `--pm-dark`,
  `--pm-font-heading`, `--pm-font-body`, `--pm-radius`.
- Values are validated (hex colours, curated fonts, a clamped radius), so a crafted
  document can't inject CSS.
- Styles can hold `var(--pm-primary)`. The colour picker offers the six theme
  colours as swatches that insert the variable. The field and swatch show the
  resolved colour.
- Section templates use the variables: buttons primary, dark sections dark,
  headings ink, rounded corners `var(--pm-radius)`, heading/body fonts.

## Applying a theme (one undo step)
1. Set `project.theme`.
2. Point every page root at `var(--pm-surface)`, `var(--pm-ink)` and
   `var(--pm-font-body)`. Point every Heading at `var(--pm-font-heading)`.
3. **Link existing colours.** Any style value that exactly equals one of the
   *previous* theme's colours (except white) becomes that colour's variable. Hex
   colours already on the page then follow theme changes from now on.

## Theme panel (nothing selected)
- **Presets** grid: Indigo, Midnight, Sunset, Forest, Mono, Candy. Each card shows
  its colours and heading font, and the active one is marked.
- **Colours**: six named pickers (Primary, Accent, Text, Muted, Surface, Dark),
  updated live everywhere.
- **Corners**: 0 / 4 / 8 / 12 / 16 / 24 px.
- **Site fonts**: the existing Headings/Body dropdowns now set the theme fonts.
- **Swatches**: the old free palette, unchanged.

## Canvas / export
`themeCss(theme)` goes into each canvas iframe and the exported `<style>`.
`usedGoogleFonts` also counts the theme fonts.
