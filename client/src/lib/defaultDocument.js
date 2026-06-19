import { newId } from './ids.js';

/** A blank single-page project. */
export function defaultDocument(name = 'Untitled Project') {
  return {
    id: newId('proj'),
    name,
    pages: [
      {
        id: newId('page'),
        name: 'Home',
        canvas: { background: '#ffffff' },
        elements: [],
      },
    ],
  };
}
