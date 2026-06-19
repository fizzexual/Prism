import { useDocumentStore } from '../../state/documentStore.js';
import { useEditorStore } from '../../state/editorStore.js';
import { ELEMENTS, ICON_SET } from '../../elements/registry.jsx';
import { resolveRect, resolveStyle } from '../../lib/geometry.js';
import { Group, Row, NumberField, TextField, TextArea, SelectField, ToggleField, ColorField } from './fields.jsx';
import UploadButton from './UploadButton.jsx';
import { ThreeGroups } from './ThreeInspector.jsx';

const WEIGHTS = [300, 400, 500, 600, 700, 800].map((w) => ({ value: String(w), label: String(w) }));
const ALIGNS = ['left', 'center', 'right'].map((a) => ({ value: a, label: a }));
const FONTS = [
  { value: 'inherit', label: 'Default' },
  { value: 'ui-sans-serif, system-ui, sans-serif', label: 'Sans' },
  { value: 'ui-serif, Georgia, serif', label: 'Serif' },
  { value: 'ui-monospace, Menlo, monospace', label: 'Mono' },
];
const SHADOWS = [
  { value: '', label: 'None' },
  { value: '0 1px 2px rgba(0,0,0,.12)', label: 'Small' },
  { value: '0 6px 18px rgba(0,0,0,.15)', label: 'Medium' },
  { value: '0 16px 40px rgba(0,0,0,.22)', label: 'Large' },
];

function GroupLayout({ el, ctx }) {
  const r = resolveRect(el, ctx.breakpoint);
  const override = ctx.breakpoint !== 'desktop' && el.responsive?.[ctx.breakpoint];
  return (
    <Group title={`Layout${ctx.breakpoint !== 'desktop' ? ` · ${ctx.breakpoint}` : ''}`}>
      <Row>
        <NumberField label="X" testId="field-x" value={Math.round(r.x)} onChange={(v) => ctx.patchRect({ x: v })} />
        <NumberField label="Y" testId="field-y" value={Math.round(r.y)} onChange={(v) => ctx.patchRect({ y: v })} />
      </Row>
      <Row>
        <NumberField label="W" testId="field-w" value={Math.round(r.width)} onChange={(v) => ctx.patchRect({ width: v })} />
        <NumberField label="H" testId="field-h" value={Math.round(r.height)} onChange={(v) => ctx.patchRect({ height: v })} />
      </Row>
      <Row>
        <NumberField label="R°" value={Math.round(r.rotation || 0)} onChange={(v) => ctx.patchRect({ rotation: v })} />
        <NumberField label="Z" value={el.zIndex} onChange={(v) => ctx.doc.reorder(ctx.pageId, el.id, v)} />
      </Row>
      <ToggleField label="Locked" checked={el.locked} onChange={(v) => ctx.update({ locked: v })} />
      <ToggleField label="Hidden" checked={el.hidden} onChange={(v) => ctx.update({ hidden: v })} />
      {override && (
        <button
          onClick={() => ctx.doc.clearBreakpointOverride(ctx.pageId, el.id, ctx.breakpoint)}
          className="text-left text-[11px] text-indigo-600 hover:underline"
        >
          Reset {ctx.breakpoint} overrides
        </button>
      )}
    </Group>
  );
}

function GroupAppearance({ ctx }) {
  const s = ctx.style || {};
  return (
    <Group title="Appearance">
      <ColorField label="Fill" value={s.background} onChange={(v) => ctx.patchStyle({ background: v })} />
      <Row>
        <NumberField label="Rad" value={s.radius} onChange={(v) => ctx.patchStyle({ radius: v })} />
        <NumberField label="Pad" value={typeof s.padding === 'number' ? s.padding : undefined} onChange={(v) => ctx.patchStyle({ padding: v })} />
      </Row>
      <div>
        <span className="text-[11px] text-neutral-400">Opacity</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={s.opacity ?? 1}
          onChange={(e) => ctx.patchStyle({ opacity: Number(e.target.value) })}
          className="w-full"
        />
      </div>
      <Row>
        <NumberField label="Bord" value={s.border?.width} onChange={(v) => ctx.patchBorder({ width: v })} />
        <ColorField value={s.border?.color} onChange={(v) => ctx.patchBorder({ color: v })} />
      </Row>
      <SelectField label="Shadow" value={s.shadow || ''} onChange={(v) => ctx.patchStyle({ shadow: v })} options={SHADOWS} />
    </Group>
  );
}

function GroupTypography({ ctx }) {
  const f = ctx.style?.font || {};
  return (
    <Group title="Typography">
      <ColorField label="Color" value={ctx.style?.color} onChange={(v) => ctx.patchStyle({ color: v })} />
      <Row>
        <NumberField label="Size" value={f.size} onChange={(v) => ctx.patchFont({ size: v })} />
        <SelectField label="Weight" value={String(f.weight || 400)} onChange={(v) => ctx.patchFont({ weight: Number(v) })} options={WEIGHTS} />
      </Row>
      <SelectField label="Font" value={f.family || 'inherit'} onChange={(v) => ctx.patchFont({ family: v })} options={FONTS} />
      <SelectField label="Align" value={f.align || 'left'} onChange={(v) => ctx.patchFont({ align: v })} options={ALIGNS} />
      <NumberField label="LH" step={0.1} value={f.lineHeight} onChange={(v) => ctx.patchFont({ lineHeight: v })} />
    </Group>
  );
}

function GroupTextContent({ el, ctx }) {
  return (
    <Group title="Content">
      <TextArea label="Text" testId="field-text" value={el.content?.text} onChange={(v) => ctx.patchContent({ text: v })} />
    </Group>
  );
}

function GroupLink({ el, ctx }) {
  return (
    <Group title="Link">
      <TextField label="Link URL" value={el.content?.href} onChange={(v) => ctx.patchContent({ href: v })} placeholder="https://…" />
    </Group>
  );
}

function GroupImage({ el, ctx }) {
  return (
    <Group title="Image">
      <TextField label="Image URL" value={el.content?.src} onChange={(v) => ctx.patchContent({ src: v })} />
      <UploadButton accept="image/*" label="Upload image" onUpload={(url) => ctx.patchContent({ src: url })} />
      <TextField label="Alt text" value={el.content?.alt} onChange={(v) => ctx.patchContent({ alt: v })} />
      <SelectField
        label="Fit"
        value={el.content?.fit || 'cover'}
        onChange={(v) => ctx.patchContent({ fit: v })}
        options={[
          { value: 'cover', label: 'Cover' },
          { value: 'contain', label: 'Contain' },
          { value: 'fill', label: 'Fill' },
        ]}
      />
    </Group>
  );
}

function GroupIcon({ el, ctx }) {
  return (
    <Group title="Icon">
      <SelectField
        label="Icon"
        value={el.content?.iconName || 'Star'}
        onChange={(v) => ctx.patchContent({ iconName: v })}
        options={Object.keys(ICON_SET).map((k) => ({ value: k, label: k }))}
      />
      <ColorField label="Color" value={ctx.style?.color} onChange={(v) => ctx.patchStyle({ color: v })} />
    </Group>
  );
}

const GROUPS = {
  layout: GroupLayout,
  appearance: GroupAppearance,
  typography: GroupTypography,
  text: GroupTextContent,
  link: GroupLink,
  image: GroupImage,
  icon: GroupIcon,
};

function EmptyState({ page }) {
  return (
    <div>
      <Group title="Page">
        <ColorField
          label="Background"
          value={page.canvas?.background}
          onChange={(v) => useDocumentStore.getState().updatePageCanvas(page.id, { background: v })}
        />
      </Group>
      <p className="px-3 py-6 text-center text-xs text-neutral-400">Select an element to edit its properties.</p>
    </div>
  );
}

function MultiPanel({ selected, pageId }) {
  const doc = useDocumentStore.getState();
  const ids = selected.map((e) => e.id);
  const patchAll = (style) => doc.updateElements(pageId, ids, { style });
  const first = selected[0];
  return (
    <div>
      <div className="px-3 py-2 border-b border-neutral-100 text-xs font-medium text-neutral-600">
        {selected.length} elements selected
      </div>
      <Group title="Appearance (all)">
        <ColorField label="Fill" value={first.style?.background} onChange={(v) => patchAll({ background: v })} />
        <NumberField label="Rad" value={first.style?.radius} onChange={(v) => patchAll({ radius: v })} />
      </Group>
      <div className="px-3 py-2">
        <button
          onClick={() => {
            doc.removeElements(pageId, ids);
            useEditorStore.getState().clearSelect();
          }}
          className="w-full rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600 hover:bg-red-100"
        >
          Delete {selected.length} elements
        </button>
      </div>
    </div>
  );
}

export function Inspector() {
  const project = useDocumentStore((s) => s.project);
  const activePageId = useEditorStore((s) => s.activePageId);
  const breakpoint = useEditorStore((s) => s.breakpoint);
  const selectedIds = useEditorStore((s) => s.selectedIds);

  const page = project?.pages.find((p) => p.id === activePageId) || project?.pages[0];
  if (!page) return null;

  const selected = page.elements.filter((e) => selectedIds.includes(e.id));

  if (selected.length === 0) return <ScrollPanel><EmptyState page={page} /></ScrollPanel>;
  if (selected.length > 1) return <ScrollPanel><MultiPanel selected={selected} pageId={page.id} /></ScrollPanel>;

  const el = selected[0];
  const def = ELEMENTS[el.type];
  const doc = useDocumentStore.getState();
  const update = (patch) => doc.updateElement(page.id, el.id, patch);
  const ctx = {
    pageId: page.id,
    breakpoint,
    doc,
    update,
    style: resolveStyle(el, breakpoint),
    patchRect: (p) => (breakpoint === 'desktop' ? update({ rect: p }) : doc.setBreakpointPatch(page.id, el.id, breakpoint, p)),
    patchStyle: (p) => doc.patchElementStyle(page.id, el.id, breakpoint, p),
    patchFont: (p) => doc.patchElementStyle(page.id, el.id, breakpoint, { font: p }),
    patchBorder: (p) => doc.patchElementStyle(page.id, el.id, breakpoint, { border: p }),
    patchContent: (p) => update({ content: p }),
    patchThree: (p) => update({ three: p }),
  };

  return (
    <ScrollPanel>
      <div className="px-3 py-2 border-b border-neutral-100">
        <input
          value={el.name || ''}
          onChange={(e) => doc.renameElement(page.id, el.id, e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-neutral-800 outline-none"
        />
        <span className="text-[11px] text-neutral-400">{ELEMENTS[el.type]?.label}</span>
      </div>
      {def.inspector?.includes('three-model') && <ThreeGroups el={el} ctx={ctx} />}
      {def.inspector?.map((key) => {
        const Cmp = GROUPS[key];
        return Cmp ? <Cmp key={key} el={el} ctx={ctx} /> : null;
      })}
    </ScrollPanel>
  );
}

function ScrollPanel({ children }) {
  return <div className="h-full overflow-y-auto scroll-thin">{children}</div>;
}
