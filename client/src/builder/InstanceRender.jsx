import { lazy, Suspense } from 'react';
import { COMPONENTS, ICON_SET } from './components.jsx';

// Lazy so three.js only loads when a 3D element is present.
const ThreeBox = lazy(() => import('./ThreeBox.jsx'));

// Bindable style props become inline styles on an instance's node (per-instance overrides
// can't live in the shared master class). Map kebab CSS -> React camelCase.
const STYLE_BIND = { color: 'color', 'background-color': 'backgroundColor', 'font-size': 'fontSize', 'font-family': 'fontFamily' };

function makeResolver(comp, inst) {
  const defaults = {};
  for (const v of comp.variables || []) defaults[v.id] = v.default;
  const overrides = inst.props?.overrides || {};
  return (varId) => (overrides[varId] !== undefined ? overrides[varId] : defaults[varId]);
}

/**
 * Recursively render an instance as real HTML inside the iframe. Styling comes
 * from the generated stylesheet via the `s-<id>` class; `data-ws-id` carries
 * identity for selection. A component `Instance` node expands its master subtree:
 * every expanded node shares the master's class (so master styles apply) but
 * reports the instance's id for selection, and bound props resolve to the
 * instance's variable values.
 */
export function InstanceRender({ id, instances, components = {}, selOverride = null, resolve = null }) {
  const inst = instances[id];
  if (!inst) return null;

  if (inst.component === 'Instance') {
    const comp = components[inst.props?.componentId];
    if (!comp || !instances[comp.rootId]) return null;
    return (
      <InstanceRender
        id={comp.rootId}
        instances={instances}
        components={components}
        selOverride={selOverride || inst.id}
        resolve={makeResolver(comp, inst)}
      />
    );
  }

  const def = COMPONENTS[inst.component];
  if (!def) return null;
  const Tag = def.tag;
  const dwid = selOverride || id;

  let boundText = null;
  const boundStyle = {};
  if (resolve && inst.bindings) {
    for (const [prop, varId] of Object.entries(inst.bindings)) {
      const val = resolve(varId);
      if (val === undefined || val === '') continue;
      if (prop === 'text') boundText = val;
      else if (STYLE_BIND[prop]) boundStyle[STYLE_BIND[prop]] = val;
    }
  }
  const common = { 'data-ws-id': dwid, className: `s-${id}` };
  if (Object.keys(boundStyle).length) common.style = boundStyle;

  switch (inst.component) {
    case 'Image':
      return <img {...common} src={inst.props.src || undefined} alt={inst.props.alt || ''} />;
    case 'Divider':
      return <hr {...common} />;
    case 'Spacer':
      return <div {...common} />;
    case 'Input':
      return <input {...common} placeholder={inst.props.placeholder || ''} readOnly />;
    case 'Textarea':
      return <textarea {...common} placeholder={inst.props.placeholder || ''} readOnly />;
    case 'Icon': {
      const Ico = ICON_SET[inst.props.iconName] || ICON_SET.Star;
      return (
        <Tag {...common}>
          <Ico style={{ width: '100%', height: '100%' }} />
        </Tag>
      );
    }
    case '3D':
      return (
        <Tag {...common}>
          <Suspense fallback={null}>
            <ThreeBox config={inst.props} />
          </Suspense>
        </Tag>
      );
    default:
      break;
  }

  if (def.container) {
    return (
      <Tag {...common}>
        {inst.children.map((childId) => (
          <InstanceRender key={childId} id={childId} instances={instances} components={components} selOverride={selOverride} resolve={resolve} />
        ))}
      </Tag>
    );
  }

  const extra = {};
  if (inst.component === 'Link') extra.href = inst.props.href || undefined;
  if (inst.component === 'Button') extra.type = 'button';
  return (
    <Tag {...common} {...extra}>
      {boundText != null ? boundText : inst.props.text}
    </Tag>
  );
}
