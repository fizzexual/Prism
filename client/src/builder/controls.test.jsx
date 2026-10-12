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
