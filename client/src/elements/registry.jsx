import {
  LayoutPanelTop,
  SquareDashed,
  Heading as HeadingIcon,
  Type,
  MousePointerClick,
  Image as ImageIcon,
  Star,
  Minus,
  StretchVertical,
  Box as BoxIcon,
  Heart,
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Mail,
  Phone,
  Play,
} from 'lucide-react';
import { lazy, Suspense } from 'react';
import { newId } from '../lib/ids.js';
import { cssProps } from '../lib/styleToCss.js';

// Lazy-load the 3D viewport so three.js / R3F only ship when a 3D element renders.
const Element3D = lazy(() => import('./Element3D.jsx'));

const fill = { width: '100%', height: '100%', boxSizing: 'border-box' };

/** Curated icons available to the Icon element (avoids importing all of lucide). */
export const ICON_SET = {
  Star, Heart, Check, ArrowRight, Sparkles, Zap, Shield, Globe, Mail, Phone, Play, MousePointerClick,
};

/* ---------- render helpers (return inner content; wrapper handles position) ---------- */

const renderBox = (el) => <div style={{ ...fill, ...cssProps(el.style) }} />;

const renderHeading = (el) => (
  <h2 style={{ ...fill, margin: 0, display: 'flex', alignItems: 'center', ...cssProps(el.style) }}>
    {el.content?.text}
  </h2>
);

const renderText = (el) => (
  <p style={{ ...fill, margin: 0, overflow: 'hidden', ...cssProps(el.style) }}>{el.content?.text}</p>
);

const renderButton = (el, mode) => {
  const style = {
    ...fill,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    textDecoration: 'none',
    ...cssProps(el.style),
  };
  if (mode === 'preview' && el.content?.href) {
    return (
      <a href={el.content.href} style={style}>
        {el.content?.text}
      </a>
    );
  }
  return (
    <button type="button" style={style}>
      {el.content?.text}
    </button>
  );
};

const renderImage = (el) => {
  if (!el.content?.src) {
    return (
      <div
        style={{
          ...fill,
          display: 'grid',
          placeItems: 'center',
          background: '#eef0f4',
          color: '#9aa0aa',
          fontSize: 13,
          ...cssProps(el.style),
        }}
      >
        Image
      </div>
    );
  }
  return (
    <img
      src={el.content.src}
      alt={el.content?.alt || ''}
      style={{ ...fill, objectFit: el.content?.fit || 'cover', display: 'block', ...cssProps(el.style) }}
    />
  );
};

const renderIcon = (el) => {
  const Cmp = ICON_SET[el.content?.iconName] || Star;
  return (
    <div style={{ ...fill, display: 'grid', placeItems: 'center', color: el.style?.color || '#111827', ...cssProps(el.style) }}>
      <Cmp style={{ width: '72%', height: '72%' }} />
    </div>
  );
};

const renderDivider = (el) => (
  <div style={{ ...fill, display: 'flex', alignItems: 'center' }}>
    <hr
      style={{
        width: '100%',
        border: 'none',
        borderTop: `${el.style?.border?.width || 2}px ${el.style?.border?.style || 'solid'} ${el.style?.border?.color || '#d1d5db'}`,
        margin: 0,
      }}
    />
  </div>
);

const renderSpacer = () => <div style={fill} />;

const render3d = (el, mode) => (
  <Suspense
    fallback={
      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#0b1020', color: '#7dd3fc', fontSize: 12 }}>
        Loading 3D…
      </div>
    }
  >
    <Element3D element={el} mode={mode} />
  </Suspense>
);

/* ---------- the registry ---------- */

export const ELEMENTS = {
  section: {
    type: 'section',
    label: 'Section',
    icon: LayoutPanelTop,
    defaultSize: { width: 1280, height: 320 },
    defaultProps: { style: { background: '#f5f5f7' }, content: {} },
    render: renderBox,
    inspector: ['layout', 'appearance'],
    exportTag: () => ({ tag: 'section', attrs: {}, inner: '' }),
  },
  container: {
    type: 'container',
    label: 'Container',
    icon: SquareDashed,
    defaultSize: { width: 320, height: 200 },
    defaultProps: {
      style: { background: '#ffffff', border: { width: 1, style: 'solid', color: '#e5e7eb' }, radius: 12 },
      content: {},
    },
    render: renderBox,
    inspector: ['layout', 'appearance'],
    exportTag: () => ({ tag: 'div', attrs: {}, inner: '' }),
  },
  heading: {
    type: 'heading',
    label: 'Heading',
    icon: HeadingIcon,
    defaultSize: { width: 460, height: 56 },
    defaultProps: {
      style: { color: '#111827', font: { size: 36, weight: 700, align: 'left', lineHeight: 1.1 } },
      content: { text: 'Big Heading' },
    },
    render: renderHeading,
    inspector: ['layout', 'typography', 'text', 'appearance'],
    exportTag: (el) => ({ tag: 'h2', attrs: {}, inner: el.content?.text || '' }),
  },
  text: {
    type: 'text',
    label: 'Text',
    icon: Type,
    defaultSize: { width: 360, height: 84 },
    defaultProps: {
      style: { color: '#374151', font: { size: 16, weight: 400, align: 'left', lineHeight: 1.5 } },
      content: { text: 'Some descriptive text goes right here. Edit me in the inspector.' },
    },
    render: renderText,
    inspector: ['layout', 'typography', 'text', 'appearance'],
    exportTag: (el) => ({ tag: 'p', attrs: {}, inner: el.content?.text || '' }),
  },
  button: {
    type: 'button',
    label: 'Button',
    icon: MousePointerClick,
    defaultSize: { width: 168, height: 46 },
    defaultProps: {
      style: { background: '#4f46e5', color: '#ffffff', radius: 8, font: { size: 15, weight: 600, align: 'center' } },
      content: { text: 'Click me', href: '#' },
    },
    render: renderButton,
    inspector: ['layout', 'typography', 'text', 'link', 'appearance'],
    exportTag: (el) => {
      const href = el.content?.href;
      return href
        ? { tag: 'a', attrs: { href, class: 'prism-btn' }, inner: el.content?.text || '' }
        : { tag: 'button', attrs: { class: 'prism-btn' }, inner: el.content?.text || '' };
    },
  },
  image: {
    type: 'image',
    label: 'Image',
    icon: ImageIcon,
    defaultSize: { width: 300, height: 190 },
    defaultProps: { style: { radius: 8 }, content: { src: '', alt: '' } },
    render: renderImage,
    inspector: ['layout', 'image', 'appearance'],
    exportTag: (el) => ({
      tag: 'img',
      attrs: { src: el.content?.src || '', alt: el.content?.alt || '' },
      inner: '',
      selfClosing: true,
    }),
  },
  icon: {
    type: 'icon',
    label: 'Icon',
    icon: Star,
    defaultSize: { width: 64, height: 64 },
    defaultProps: { style: { color: '#4f46e5' }, content: { iconName: 'Star' } },
    render: renderIcon,
    inspector: ['layout', 'icon', 'appearance'],
    exportTag: () => ({ tag: 'div', attrs: { class: 'prism-icon' }, inner: '' }),
  },
  divider: {
    type: 'divider',
    label: 'Divider',
    icon: Minus,
    defaultSize: { width: 320, height: 24 },
    defaultProps: { style: { border: { width: 2, style: 'solid', color: '#d1d5db' } }, content: {} },
    render: renderDivider,
    inspector: ['layout', 'appearance'],
    exportTag: () => ({ tag: 'hr', attrs: {}, inner: '', selfClosing: true }),
  },
  spacer: {
    type: 'spacer',
    label: 'Spacer',
    icon: StretchVertical,
    defaultSize: { width: 200, height: 40 },
    defaultProps: { style: {}, content: {} },
    render: renderSpacer,
    inspector: ['layout'],
    exportTag: () => ({ tag: 'div', attrs: {}, inner: '' }),
  },
  '3d': {
    type: '3d',
    label: '3D Object',
    icon: BoxIcon,
    defaultSize: { width: 360, height: 300 },
    defaultProps: {
      style: { radius: 8 },
      content: {},
      three: {
        model: { assetId: null, url: null, format: null },
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
        material: { enabled: false, color: '#9aa6ff', metalness: 0.1, roughness: 0.6, wireframe: false, opacity: 1 },
        lights: [
          { type: 'ambient', intensity: 0.6, color: '#ffffff' },
          { type: 'directional', intensity: 1, color: '#ffffff', position: [5, 6, 4] },
        ],
        environment: 'city',
        camera: { fov: 50, autoRotate: false, orbit: true, position: [3, 2, 4] },
        background: null,
      },
    },
    render: render3d,
    inspector: ['layout', 'three-model', 'three-transform', 'three-material', 'three-lighting', 'three-camera'],
    exportTag: (el) => ({ tag: 'div', attrs: { 'data-three': el.id, class: 'prism-3d' }, inner: '' }),
  },
};

/** Palette order. */
export const elementList = [
  'section', 'container', 'heading', 'text', 'button', 'image', 'icon', 'divider', 'spacer', '3d',
].map((t) => ELEMENTS[t]);

/** Build a fresh element of `type`, positioned at `at` (top-left), default size. */
export function createElement(type, at = { x: 40, y: 40 }) {
  const def = ELEMENTS[type];
  if (!def) throw new Error(`Unknown element type: ${type}`);
  const props = def.defaultProps || {};
  return {
    id: newId('el'),
    type,
    name: def.label,
    locked: false,
    hidden: false,
    zIndex: 0,
    rect: {
      x: Math.round(at.x),
      y: Math.round(at.y),
      width: def.defaultSize.width,
      height: def.defaultSize.height,
      rotation: 0,
    },
    responsive: {},
    style: structuredClone(props.style || {}),
    content: structuredClone(props.content || {}),
    ...(props.three ? { three: structuredClone(props.three) } : {}),
  };
}
