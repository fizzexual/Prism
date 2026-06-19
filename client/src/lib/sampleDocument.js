import { newId } from './ids.js';
import { createElement } from '../elements/registry.jsx';

function make(type, at, overrides = {}) {
  const el = createElement(type, at);
  if (overrides.rect) el.rect = { ...el.rect, ...overrides.rect };
  if (overrides.style) {
    el.style = {
      ...el.style,
      ...overrides.style,
      font: { ...(el.style.font || {}), ...(overrides.style.font || {}) },
    };
  }
  if (overrides.content) el.content = { ...el.content, ...overrides.content };
  if (overrides.responsive) el.responsive = overrides.responsive;
  if (overrides.name) el.name = overrides.name;
  return el;
}

/**
 * A welcoming showcase project shown on first run — with proper tablet and
 * mobile layouts so it demonstrates responsive design out of the box.
 */
export function sampleDocument() {
  const els = [
    make('section', { x: 0, y: 0 }, {
      name: 'Hero',
      rect: { width: 1280, height: 520 },
      style: { background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 55%,#ec4899 100%)' },
      responsive: { tablet: { width: 768, height: 560 }, mobile: { width: 375, height: 690 } },
    }),
    make('heading', { x: 96, y: 130 }, {
      rect: { width: 600, height: 130 },
      style: { color: '#ffffff', font: { size: 56, weight: 800, lineHeight: 1.05 } },
      content: { text: 'Build beautiful sites — in 3D' },
      responsive: {
        tablet: { x: 40, y: 90, width: 470, height: 150, style: { font: { size: 44 } } },
        mobile: { x: 24, y: 48, width: 327, height: 150, style: { font: { size: 34 } } },
      },
    }),
    make('text', { x: 96, y: 280 }, {
      rect: { width: 520, height: 80 },
      style: { color: 'rgba(255,255,255,0.88)', font: { size: 18, lineHeight: 1.5 } },
      content: { text: 'Drag, drop, and design — now with real-time Three.js objects right on the canvas.' },
      responsive: {
        tablet: { x: 40, y: 250, width: 440 },
        mobile: { x: 24, y: 214, width: 327, height: 96, style: { font: { size: 16 } } },
      },
    }),
    make('button', { x: 96, y: 384 }, {
      rect: { width: 184, height: 52 },
      style: { background: '#ffffff', color: '#4f46e5', radius: 10, font: { size: 16, weight: 700, align: 'center' } },
      content: { text: 'Get started', href: '#' },
      responsive: { tablet: { x: 40, y: 350 }, mobile: { x: 24, y: 330, width: 180, height: 48 } },
    }),
    make('3d', { x: 752, y: 96 }, {
      name: 'Hero 3D',
      rect: { width: 432, height: 360 },
      style: { radius: 16 },
      responsive: {
        tablet: { x: 360, y: 96, width: 368, height: 360 },
        mobile: { x: 24, y: 408, width: 327, height: 250 },
      },
    }),
    make('heading', { x: 96, y: 600 }, {
      rect: { width: 520, height: 50 },
      style: { color: '#111827', font: { size: 34, weight: 700 } },
      content: { text: 'Everything you need' },
      responsive: {
        tablet: { x: 40, y: 620, width: 480, style: { font: { size: 30 } } },
        mobile: { x: 24, y: 730, width: 327, style: { font: { size: 26 } } },
      },
    }),
    make('text', { x: 96, y: 662 }, {
      rect: { width: 640, height: 60 },
      style: { color: '#4b5563', font: { size: 16, lineHeight: 1.6 } },
      content: { text: 'Components, an inspector, layers, responsive preview, undo/redo, and one-click export.' },
      responsive: {
        tablet: { x: 40, y: 676, width: 560 },
        mobile: { x: 24, y: 786, width: 327, height: 96 },
      },
    }),
  ];
  els.forEach((e, i) => {
    e.zIndex = i;
  });
  const cube = els.find((e) => e.type === '3d');
  if (cube) cube.three.camera.autoRotate = true;

  return {
    id: newId('proj'),
    name: 'Welcome to Prism',
    pages: [{ id: newId('page'), name: 'Home', canvas: { background: '#ffffff' }, elements: els }],
  };
}
