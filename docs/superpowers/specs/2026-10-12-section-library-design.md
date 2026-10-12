# Section library — design

## Goal
Enough well-designed sections to assemble a complete, impressive site in minutes.
Every section must be phone-ready, follow the site theme and animate in.

## Sections (17, grouped in the Add panel)
| Category | Sections |
| --- | --- |
| Navigation | Navbar |
| Hero | Hero, Hero (split) |
| Content | Features, Bento grid, Stats, Gallery, Team |
| Social proof | Logo cloud, Testimonials |
| Pricing | Pricing |
| Help | FAQ, Contact |
| Call to action | Call to action, Newsletter |
| Footer | Footer, Footer (columns) |

Visuals are theme gradients (`linear-gradient(135deg, var(--pm-primary), var(--pm-dark))`…).
They need no external images and no network. You can drop an Image into any tile.

## Rules every section obeys (tested for all of them)
1. Builds from known components only.
2. Root section side padding ≤ 24px on phones.
3. Every multi-column Columns/Grid collapses on phones: `flex-direction: column` or
   `grid-template-columns` of at most 2 columns.
4. Headings use `var(--pm-font-heading)`.
5. No raw theme hex (#4f46e5, #111827, #0b1020, …). Theme colours are `var(--pm-*)`,
   so every section restyles with the theme.
6. White text only on `dark`, `primary` or `ink` backgrounds (the pairs the presets guarantee ≥ 4.5:1).
7. Has an entrance animation somewhere (except Navigation and Footer — they should simply be there).

Checked in a real Chrome as well: each section at 390px has no horizontal scroll,
and a contrast audit runs across all 6 themes.

## Starter pages
Landing, Portfolio and Startup are ordered section lists. The store action
`addPageWithSections(name, snapshots)` creates a new page filled with them in one
undo step and switches to it. Existing pages are never touched.

## Small default changes
`Link` defaults to `var(--pm-primary)` so links follow the theme.
