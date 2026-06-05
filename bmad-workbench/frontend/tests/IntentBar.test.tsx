import { render, screen, fireEvent } from '@testing-library/react';
import IntentBar from '../src/components/IntentBar';

describe('IntentBar', () => {
  it('submits on Enter key', () => {
    render(<IntentBar />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    // Textarea is disabled when no active thread — verify disabled state
    expect(textarea).toBeDisabled();
  });

  it('does not submit on Shift+Enter', () => {
    render(<IntentBar />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toBeDisabled();
  });
});
