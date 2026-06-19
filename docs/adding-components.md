# Adding a new component

Every element type in Prism is a single entry in
[`client/src/elements/registry.jsx`](../client/src/elements/registry.jsx). The
palette, canvas renderer, property inspector, and code exporter all read from that
registry, so adding one entry wires the component into the whole app.

## 1. Add a registry entry

Add a key to the `ELEMENTS` object. Example — a "Badge" pill:

```jsx
import { Tag } from 'lucide-react'; // an icon for the palette

badge: {
  type: 'badge',
  label: 'Badge',
  icon: Tag,
  defaultSize: { width: 120, height: 32 },
  defaultProps: {
    style: { background: '#eef2ff', color: '#4f46e5', radius: 999, font: { size: 13, weight: 600, align: 'center' } },
    content: { text: 'New' },
  },
  // `mode` is 'edit' | 'preview'. Return the inner content; the wrapper
  // handles absolute position/size/rotation for you.
  render: (el) => (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', ...cssProps(el.style) }}>
      {el.content?.text}
    </div>
  ),
  // Which inspector groups to show (see step 2).
  inspector: ['layout', 'typography', 'text', 'appearance'],
  // How it exports to static HTML.
  exportTag: (el) => ({ tag: 'span', attrs: {}, inner: el.content?.text || '' }),
},
```

Then add `'badge'` to the `elementList` array (controls palette order).

That's it — the Badge now appears in the palette, can be dropped/moved/resized,
shows the chosen inspector groups, and exports as a `<span>`.

## 2. Inspector groups

`inspector` is a list of group keys handled in
[`client/src/components/Inspector/Inspector.jsx`](../client/src/components/Inspector/Inspector.jsx).
Built-in groups: `layout`, `appearance`, `typography`, `text`, `link`, `image`,
`icon`, and the 3D groups (`three-model`, `three-transform`, `three-material`,
`three-lighting`, `three-camera`).

Reuse those when you can. To add a **new** group, write a small group component
(see the existing `GroupText`, `GroupLink`, etc.) and register it in the `GROUPS`
map in `Inspector.jsx`:

```jsx
function GroupQuote({ el, ctx }) {
  return (
    <Group title="Quote">
      <TextField label="Author" value={el.content?.author} onChange={(v) => ctx.patchContent({ author: v })} />
    </Group>
  );
}
const GROUPS = { /* …existing… */ quote: GroupQuote };
```

Helpers available on `ctx`: `patchStyle`, `patchFont`, `patchBorder`,
`patchContent`, `patchRect` (breakpoint-aware), and `update`.

## 3. Export mapping

`exportTag(el)` returns `{ tag, attrs, inner, selfClosing? }`. The exporter wraps
it with the element's positioning class (`.el-<id>`) automatically. Use
`selfClosing: true` for void tags like `<img>`/`<hr>`.

## 4. Tests

Add assertions to
[`client/src/elements/registry.test.js`](../client/src/elements/registry.test.js)
(e.g. that `createElement('badge')` has the right defaults and `exportTag` maps to
the expected tag). Run `npm run test:client`.
