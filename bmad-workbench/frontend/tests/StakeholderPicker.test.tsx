import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StakeholderPicker from '../src/components/StakeholderPicker';

describe('StakeholderPicker', () => {
  const mockOnClose = vi.fn();
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 'user-1', display_name: 'Sarah Chen', email: 'sarah@example.com', department: 'Product' },
            { id: 'user-2', display_name: 'Alice Chen', email: 'alice@example.com', department: 'Engineering' },
          ]),
      } as Response)
    );
  });

  it('renders search step', () => {
    render(
      <StakeholderPicker
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        existingStakeholders={[]}
      />
    );
    expect(screen.getByText('Add Stakeholder')).toBeInTheDocument();
    expect(screen.getByTestId('stakeholder-search-input')).toBeInTheDocument();
  });

  it('searches users when typing', async () => {
    render(
      <StakeholderPicker
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        existingStakeholders={[]}
      />
    );
    const input = screen.getByTestId('stakeholder-search-input');
    fireEvent.change(input, { target: { value: 'Sarah' } });
    await waitFor(() => {
      expect(screen.getAllByTestId('user-result').length).toBeGreaterThan(0);
    });
  });

  it('shows already added users as disabled', async () => {
    render(
      <StakeholderPicker
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        existingStakeholders={[{ user_id: 'user-1', role: 'consulted' } as any]}
      />
    );
    const input = screen.getByTestId('stakeholder-search-input');
    fireEvent.change(input, { target: { value: 'Sarah' } });
    await waitFor(() => {
      expect(screen.getByText('Already added')).toBeInTheDocument();
    });
  });

  it('proceeds to role selection after selecting user', async () => {
    render(
      <StakeholderPicker
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        existingStakeholders={[]}
      />
    );
    const input = screen.getByTestId('stakeholder-search-input');
    fireEvent.change(input, { target: { value: 'Sarah' } });
    await waitFor(() => {
      expect(screen.getAllByTestId('user-result').length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByTestId('user-result')[0]);
    fireEvent.click(screen.getByTestId('next-btn'));
    expect(screen.getByTestId('role-accountable')).toBeInTheDocument();
    expect(screen.getByTestId('role-responsible')).toBeInTheDocument();
  });
});
