import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LinkResourceModal from '../src/components/LinkResourceModal';

describe('LinkResourceModal', () => {
  const mockOnClose = vi.fn();
  const mockOnLink = vi.fn();
  const mockSearch = vi.fn();
  const mockClearSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders type selection step', () => {
    render(
      <LinkResourceModal
        onClose={mockOnClose}
        onLink={mockOnLink}
        searchResources={mockSearch}
        clearSearch={mockClearSearch}
        searchResults={[]}
        searchLoading={false}
      />
    );
    expect(screen.getByText('Link Resource')).toBeInTheDocument();
    expect(screen.getByTestId('select-jira')).toBeInTheDocument();
    expect(screen.getByTestId('select-confluence')).toBeInTheDocument();
  });

  it('switches to search step when selecting jira', () => {
    render(
      <LinkResourceModal
        onClose={mockOnClose}
        onLink={mockOnLink}
        searchResources={mockSearch}
        clearSearch={mockClearSearch}
        searchResults={[]}
        searchLoading={false}
      />
    );
    fireEvent.click(screen.getByTestId('select-jira'));
    expect(screen.getByTestId('resource-search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type ticket ID (e.g., PROD-442) or keywords…')).toBeInTheDocument();
  });

  it('calls search when typing in search input', async () => {
    render(
      <LinkResourceModal
        onClose={mockOnClose}
        onLink={mockOnLink}
        searchResources={mockSearch}
        clearSearch={mockClearSearch}
        searchResults={[]}
        searchLoading={false}
      />
    );
    fireEvent.click(screen.getByTestId('select-jira'));
    const input = screen.getByTestId('resource-search-input');
    fireEvent.change(input, { target: { value: 'PROD' } });
    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith('PROD', 'jira');
    });
  });

  it('displays search results and allows selection', () => {
    render(
      <LinkResourceModal
        onClose={mockOnClose}
        onLink={mockOnLink}
        searchResources={mockSearch}
        clearSearch={mockClearSearch}
        searchResults={[
          { external_id: 'PROD-442', title: 'OAuth integration', status: 'In Progress', assignee: 'Bob' },
        ]}
        searchLoading={false}
      />
    );
    fireEvent.click(screen.getByTestId('select-jira'));
    expect(screen.getAllByTestId('search-result').length).toBe(1);
    fireEvent.click(screen.getAllByTestId('search-result')[0]);
    expect(screen.getByTestId('link-resource-btn')).not.toBeDisabled();
  });

  it('calls onClose when clicking close button', () => {
    render(
      <LinkResourceModal
        onClose={mockOnClose}
        onLink={mockOnLink}
        searchResources={mockSearch}
        clearSearch={mockClearSearch}
        searchResults={[]}
        searchLoading={false}
      />
    );
    fireEvent.click(screen.getByTestId('close-modal'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
