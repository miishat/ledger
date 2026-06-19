import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WidgetWrapper } from './WidgetWrapper';

describe('WidgetWrapper', () => {
  it('renders title and children correctly', () => {
    render(
      <WidgetWrapper title="Test Widget">
        <p>Widget Content</p>
      </WidgetWrapper>
    );
    
    expect(screen.getByText('Test Widget')).toBeDefined();
    expect(screen.getByText('Widget Content')).toBeDefined();
    expect(screen.queryByRole('button', { name: /action menu/i })).toBeNull();
  });

  it('renders action element when provided', () => {
    render(
      <WidgetWrapper title="Test Widget" action={<button aria-label="action menu">action menu</button>}>
        <p>Widget Content</p>
      </WidgetWrapper>
    );
    
    expect(screen.getByRole('button', { name: /action menu/i })).toBeDefined();
  });
});
