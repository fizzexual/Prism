import {
  Square,
  Type,
  Heading as HeadingIcon,
  MousePointerClick,
  Image as ImageIcon,
  Link as LinkIcon,
  LayoutPanelTop,
  Minus,
} from 'lucide-react';

/**
 * Component registry for the flow builder. Each component renders a real HTML
 * tag with real CSS (no absolute positioning). `defaultStyle` keys are real
 * CSS properties (kebab-case) with units.
 */
export const COMPONENTS = {
  Body: {
    label: 'Body',
    tag: 'div',
    container: true,
    icon: LayoutPanelTop,
    defaultStyle: {
      display: 'flex',
      'flex-direction': 'column',
      'min-height': '100%',
      'background-color': '#ffffff',
      'font-family': 'system-ui, -apple-system, "Segoe UI", sans-serif',
    },
  },
  Section: {
    label: 'Section',
    tag: 'section',
    container: true,
    icon: LayoutPanelTop,
    defaultStyle: {
      display: 'flex',
      'flex-direction': 'column',
      'padding-top': '48px',
      'padding-bottom': '48px',
      'padding-left': '48px',
      'padding-right': '48px',
      gap: '16px',
    },
  },
  Box: {
    label: 'Box',
    tag: 'div',
    container: true,
    icon: Square,
    defaultStyle: { display: 'block', 'padding-top': '16px', 'padding-bottom': '16px', 'padding-left': '16px', 'padding-right': '16px' },
  },
  Heading: {
    label: 'Heading',
    tag: 'h2',
    container: false,
    icon: HeadingIcon,
    defaultProps: { text: 'Heading' },
    defaultStyle: { 'font-size': '32px', 'font-weight': '700', 'margin-top': '0px', 'margin-bottom': '0px', color: '#111827' },
  },
  Text: {
    label: 'Text',
    tag: 'p',
    container: false,
    icon: Type,
    defaultProps: { text: 'Some paragraph text.' },
    defaultStyle: { 'font-size': '16px', 'line-height': '1.5', 'margin-top': '0px', 'margin-bottom': '0px', color: '#374151' },
  },
  Link: {
    label: 'Link',
    tag: 'a',
    container: false,
    icon: LinkIcon,
    defaultProps: { text: 'Link', href: '#' },
    defaultStyle: { color: '#4f46e5', 'text-decoration-line': 'underline' },
  },
  Button: {
    label: 'Button',
    tag: 'button',
    container: false,
    icon: MousePointerClick,
    defaultProps: { text: 'Button' },
    defaultStyle: {
      'background-color': '#4f46e5',
      color: '#ffffff',
      'padding-top': '10px',
      'padding-bottom': '10px',
      'padding-left': '18px',
      'padding-right': '18px',
      'border-radius': '8px',
      'border-style': 'none',
      'font-size': '15px',
      'font-weight': '600',
      cursor: 'pointer',
    },
  },
  Image: {
    label: 'Image',
    tag: 'img',
    container: false,
    icon: ImageIcon,
    defaultProps: { src: '', alt: '' },
    defaultStyle: { 'max-width': '100%', display: 'block', height: 'auto' },
  },
  Divider: {
    label: 'Divider',
    tag: 'hr',
    container: false,
    icon: Minus,
    defaultStyle: { 'border-top-width': '1px', 'border-top-style': 'solid', 'border-color': '#e5e7eb', width: '100%' },
  },
};

/** Components offered in the insert panel (Body is implicit). */
export const COMPONENT_LIST = ['Section', 'Box', 'Heading', 'Text', 'Link', 'Button', 'Image', 'Divider'];

export const isContainer = (component) => !!COMPONENTS[component]?.container;
export const isVoid = (component) => component === 'Image' || component === 'Divider';
