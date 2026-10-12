# Adding a new element

Every element type is one entry in
[`client/src/builder/components.jsx`](../client/src/builder/components.jsx)
(`COMPONENTS`). The Add panel, the canvas, the style panel and the exporter read
from it, so a plain text or container element needs nothing else.

## 1. Add a registry entry

```jsx
import { Tag } from 'lucide-react'; // icon shown in the Add panel

Badge: {
  label: 'Badge',
  tag: 'span',            // the real HTML tag rendered on the canvas and in the export
  container: false,       // true = can hold children (drop target)
  icon: Tag,
  defaultProps: { text: 'New' },
  defaultStyle: {         // kebab-case CSS with units; becomes the `base` breakpoint
    display: 'inline-block',
    'padding-top': '4px', 'padding-bottom': '4px', 'padding-left': '10px', 'padding-right': '10px',
    'border-radius': '999px', 'background-color': '#eef2ff', color: '#4f46e5', 'font-size': '12px',
  },
},
```

Add the key to `COMPONENT_LIST` (same file) to show it in the Add panel.

- Elements with a `text` prop are edited by double-clicking on the canvas and in
  the Content section of the style panel.
- Containers render their `children`; everything else renders `props.text`.

## 2. Special rendering (only if needed)

If the element isn't "a tag with text" or "a tag with children" (an `<img>`, a
form field, an icon, a widget), add a `case` to:

- `InstanceRender.jsx` — how it renders on the canvas, and
- `renderNode` in `exportSite.js` — how it is written to the exported HTML. Escape
  text with `esc`, attributes with `escAttr`, and pass any URL through `safeHref`.

Add its editable props to `ContentSection` in `StylePanel.jsx`.

## 3. Test it

Add a case to `client/src/builder/exportSite.test.js` that exports a project
containing the element and checks the HTML, then run `npm test`.
