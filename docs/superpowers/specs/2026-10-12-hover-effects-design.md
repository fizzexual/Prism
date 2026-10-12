# Hover & pressed effects — design

## Goal
Buttons, cards and links can react to the mouse (hover) and to clicks (pressed),
with a smooth transition, set in 1–2 clicks, previewed on the canvas and exported.

## Data
Each instance's style map gains two state keys next to the breakpoints:

```
styles[id] = { base, tablet?, mobile?, hover?, pressed? }
```

- `hover` / `pressed` hold CSS declarations, like a breakpoint does.
- They apply at every screen size (no per-breakpoint hover).
- Transition timing lives in `base` as `transition-duration` and
  `transition-timing-function`.

## CSS (cssGen.js)
- `hover` → `@media (hover: hover) { .x:hover { … } }`. Phones don't get sticky hover.
- `pressed` → `.x:active { … }`, emitted after hover so it wins.
- When an element has hover/pressed styles and `base` sets no `transition` /
  `transition-property`, the base rule gets
  `transition-property: <union of hover/pressed properties>`. It also gets
  `transition-duration: 200ms` and `transition-timing-function: ease` unless they are set.
  Only the changed properties animate, so layout drags in the editor stay instant.
- Editor only (`{ preview: true }`): the same declarations also match
  `.x[data-ws-state~="hover"]` / `[data-ws-state~="pressed"]`. The canvas sets that
  attribute on the selected element while its Hover/Pressed state is being edited,
  so you see the state without holding the mouse over it.
- Values go through the existing sanitizer.

## Editor
- The style panel gets a **Normal / Hover / Pressed** switch under its header. A
  dot marks states that have styles. It resets to Normal when the selection changes.
- In Hover/Pressed:
  - **Presets** (one click). Hover: None, Lift, Grow, Glow, Dim. Pressed: None,
    Press, Sink. A preset replaces that state's styles and writes the default
    transition into `base` in one undo step.
  - **Transition**: duration (100–600 ms) and easing (Ease, Ease out, Spring, Linear).
  - Sections that make sense for a state: Typography, Background, Border,
    Transform, Appearance (minus the Visible toggle), Filters. Content, layout,
    spacing, size and position stay on Normal.
- Effective values shown in a state = normal (current breakpoint) + hover
  (+ pressed for Pressed).

## Export
Same CSS as above without the preview selectors.

## Out of scope (later)
Focus state for inputs, per-breakpoint hover, scroll/entrance animations (roadmap #1).
