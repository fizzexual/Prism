import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useBuilder } from '../store.js';
import { defaultProject } from '../model.js';
import LinkTarget from './LinkTarget.jsx';

beforeEach(() => {
  useBuilder.getState().loadProject(defaultProject('T'));
  useBuilder.getState().addPage('About');
});
const aboutId = () => useBuilder.getState().project.pages[1].id;

describe('LinkTarget', () => {
  it('lists the site pages and stores a page link', () => {
    const onChange = vi.fn();
    render(<LinkTarget value="" onChange={onChange} allowNone />);
    fireEvent.change(screen.getByLabelText('Links to'), { target: { value: `page:${aboutId()}` } });
    expect(onChange).toHaveBeenCalledWith(`page:${aboutId()}`);
  });

  it('shows the page as selected for a page link', () => {
    render(<LinkTarget value={`page:${aboutId()}`} onChange={() => {}} />);
    expect(screen.getByLabelText('Links to')).toHaveValue(`page:${aboutId()}`);
    expect(screen.queryByPlaceholderText('https://…')).toBeNull();
  });

  it('a web address shows the URL field and keeps the typed URL', () => {
    const onChange = vi.fn();
    render(<LinkTarget value="https://example.com" onChange={onChange} />);
    expect(screen.getByLabelText('Links to')).toHaveValue('url');
    fireEvent.change(screen.getByPlaceholderText('https://…'), { target: { value: 'https://acme.example' } });
    expect(onChange).toHaveBeenLastCalledWith('https://acme.example');
  });

  it('buttons can have no link', () => {
    const onChange = vi.fn();
    render(<LinkTarget value="page:x" onChange={onChange} allowNone />);
    fireEvent.change(screen.getByLabelText('Links to'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith('');
  });
});
