import { describe, test, expect, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Inspector } from './Inspector.jsx';
import { useDocumentStore } from '../../state/documentStore.js';
import { useEditorStore } from '../../state/editorStore.js';
import { createElement } from '../../elements/registry.jsx';

const blank = () => ({ id: 'p', name: 'P', pages: [{ id: 'pg', name: 'Home', canvas: {}, elements: [] }] });

describe('Inspector', () => {
  beforeEach(() => {
    cleanup();
    useDocumentStore.getState().loadProject(blank());
    useEditorStore.getState().setActivePage('pg');
    useEditorStore.getState().setBreakpoint('desktop');
    useEditorStore.getState().clearSelect();
  });

  test('editing X patches the selected element rect.x', () => {
    const el = createElement('button', { x: 10, y: 10 });
    useDocumentStore.getState().addElement('pg', el);
    useEditorStore.getState().select([el.id]);
    const { getByTestId } = render(<Inspector />);
    fireEvent.change(getByTestId('field-x'), { target: { value: '123' } });
    expect(useDocumentStore.getState().project.pages[0].elements[0].rect.x).toBe(123);
  });

  test('editing text content updates the element', () => {
    const el = createElement('text', { x: 0, y: 0 });
    useDocumentStore.getState().addElement('pg', el);
    useEditorStore.getState().select([el.id]);
    const { getByTestId } = render(<Inspector />);
    fireEvent.change(getByTestId('field-text'), { target: { value: 'Hello world' } });
    expect(useDocumentStore.getState().project.pages[0].elements[0].content.text).toBe('Hello world');
  });

  test('non-desktop breakpoint edits write a responsive override', () => {
    const el = createElement('button', { x: 10, y: 10 });
    useDocumentStore.getState().addElement('pg', el);
    useEditorStore.getState().select([el.id]);
    useEditorStore.getState().setBreakpoint('mobile');
    const { getByTestId } = render(<Inspector />);
    fireEvent.change(getByTestId('field-x'), { target: { value: '5' } });
    const updated = useDocumentStore.getState().project.pages[0].elements[0];
    expect(updated.responsive.mobile.x).toBe(5);
    expect(updated.rect.x).toBe(10); // base untouched
  });

  test('shows empty state when nothing is selected', () => {
    const { queryByTestId, getByText } = render(<Inspector />);
    expect(queryByTestId('field-x')).toBeNull();
    expect(getByText(/Select an element/i)).toBeTruthy();
  });
});
