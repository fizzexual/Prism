# Google Fonts — design

## Goal
Pick a real typeface (Inter, Poppins, Playfair Display…) in the Font dropdown and
see it on the canvas and in the exported site.

## Fonts
A curated list in `fonts.js` of about 16 families: sans, display, serif and mono.
Each entry is `{ family, category }`. The stored CSS value is a full stack,
`"Inter", ui-sans-serif, system-ui, sans-serif`, so the page still reads well
before the font loads, or if it never does.

## Loading
- `usedGoogleFonts(styles)` scans every `font-family` value (all breakpoints and
  states). It returns the curated families in use, matched on the quoted first family.
- `googleFontsHref(families)` builds one css2 URL with weights 400–800 and
  `display=swap`. Only curated family names ever go into the URL.
- Editor: each canvas iframe has a `<link id="gfonts">` that is updated when the
  set of used fonts changes.
- Export: `preconnect` + stylesheet `<link>` in `<head>`, only when a curated font is used.

## Privacy
Loading from fonts.googleapis.com shares the visitor's IP with Google. That is the
same trade-off every site using Google Fonts makes; self-hosting is a later option.
