import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleField } from './controls.jsx';

describe('ToggleField', () => {
  it('is a named switch that reports its state', () => {
    const onChange = vi.fn();
    render(<ToggleField label="Replay on scroll back" checked={false} onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Replay on scroll back' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('ColorField theme colours', () => {
  it('offers the theme colours first and stores a live link to the theme', async () => {
    const { ColorField } = await import('./controls.jsx');
    const { useBuilder } = await import('./store.js');
    const { defaultProject } = await import('./model.js');
    useBuilder.getState().loadProject(defaultProject());
    const onChange = vi.fn();
    render(<ColorField value="" onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Pick color'));
    fireEvent.click(screen.getByRole('button', { name: 'Theme Primary' }));
    expect(onChange).toHaveBeenCalledWith('var(--pm-primary)');
  });

  it('shows the resolved colour for a theme link', async () => {
    const { ColorField } = await import('./controls.jsx');
    render(<ColorField value="var(--pm-primary)" onChange={() => {}} />);
    const swatch = screen.getAllByTitle('Pick color').at(-1);
    expect(swatch.style.background).toContain('rgb(79, 70, 229)'); // #4f46e5
  });
});
