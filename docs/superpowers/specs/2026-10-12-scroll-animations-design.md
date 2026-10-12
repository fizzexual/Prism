# Scroll & entrance animations — design

## Goal
Any element can animate in when it scrolls into view (fade, slide, zoom, blur…),
containers can stagger their children, set in 1–2 clicks, previewed in the editor
and working in the exported site with no dependencies.

## Data
An optional `motion` field on an instance (like `bindings`):

```
inst.motion = {
  preset:   'fade' | 'fade-up' | 'fade-down' | 'slide-left' | 'slide-right' | 'zoom-in' | 'blur-in' | 'flip-up',
  duration: 600,    // ms, 100–3000
  delay:    0,      // ms, 0–5000
  easing:   'smooth' | 'ease-out' | 'spring' | 'linear',
  repeat:   false,  // replay every time it re-enters the viewport
  stagger:  0,      // ms, containers only: children animate one after another
}
```

Values are normalised (clamped, unknown preset/easing dropped) before use, so a
crafted document can't inject CSS or script through them.

## Behaviour
- **Element with a preset:** it animates in when ≥15% of it enters the viewport.
- **Container with `stagger > 0`:** its direct children animate with the
  container's preset. Child *i* starts at `delay + i × stagger`. The container
  itself doesn't move.
- **`repeat`:** the element plays again each time it re-enters.
- **Reduced motion:** with `prefers-reduced-motion: reduce` nothing animates and
  nothing is hidden.
- **No JS:** nothing is hidden. The hide-until-visible rule only applies once the
  runtime has put `prism-motion` on `<html>`.

## CSS / runtime (motion.js)
- One `@keyframes pm-<preset>` per preset. It animates `opacity`, `translate`,
  `scale`, `rotate` and `filter` from the start state to the element's own values.
- `animation-fill-mode: backwards`, so after the animation ends the element's own
  styles apply again, including hover `translate`/`scale` from the hover feature.
- Timing comes from inline CSS variables (`--pm-dur`, `--pm-delay`, `--pm-ease`),
  because component instances share classes and staggered children need their
  own delay.
- The runtime is about 600 bytes and inlined in the export: an
  IntersectionObserver that adds/removes `pm-in`.

## Editor
- **Animation** section in the style panel (Normal state). It has:
  - preset grid: None + 8 presets
  - Duration, Delay and Easing
  - "Replay on scroll back"
  - Stagger children (containers): Off / 60 / 100 / 150 / 250 ms
  - a **Play** button
- Picking a preset or pressing Play replays the animation on the canvas. Elements
  are never hidden in the editor.
- Entering Preview plays every animation once.
- A small ✦ marks animated elements in the Layers tree.

## Out of scope (later)
Scroll-linked (scrubbed) animations, parallax, exit animations, per-breakpoint motion.
