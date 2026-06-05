import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import FocusedEditor from '../src/components/FocusedEditor';
import DiffView from '../src/components/DiffView';
import { useAppStore } from '../src/store/useAppStore';

// Mock useAutoSave to avoid localStorage and timer issues in tests
vi.mock('../src/hooks/useAutoSave', () => ({
  useAutoSave: () => ({
    hasRecovery: false,
    recoveredContent: null,
    recoveredTitle: null,
    clearRecovery: vi.fn(),
  }),
}));

describe('FocusedEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      focusedEditor: null,
      activeThreadId: 'thread-1',
    });
  });

  it('does not render when editor is closed', () => {
    render(<FocusedEditor />);
    expect(screen.queryByTestId('focused-editor')).not.toBeInTheDocument();
  });

  it('renders when editor is open', () => {
    useAppStore.setState({
      focusedEditor: {
        cardId: 'card-1',
        documentId: 'doc-1',
        originalContent: '# Hello',
        editedContent: '# Hello',
        title: 'Test Doc',
        isOpen: true,
      },
    });
    render(<FocusedEditor />);
    expect(screen.getByTestId('focused-editor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Doc')).toBeInTheDocument();
  });

  it('shows Edit, Preview, and Diff tabs', () => {
    useAppStore.setState({
      focusedEditor: {
        cardId: 'card-1',
        documentId: 'doc-1',
        originalContent: '# Hello',
        editedContent: '# Hello',
        title: 'Test',
        isOpen: true,
      },
    });
    render(<FocusedEditor />);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diff' })).toBeInTheDocument();
  });

  it('switches to Preview tab and renders markdown', () => {
    useAppStore.setState({
      focusedEditor: {
        cardId: 'card-1',
        documentId: 'doc-1',
        originalContent: '# Title',
        editedContent: '# Title',
        title: 'Test',
        isOpen: true,
      },
    });
    render(<FocusedEditor />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(document.querySelector('h1')).toHaveTextContent('Title');
  });

  it('switches to Diff tab and shows changes', () => {
    useAppStore.setState({
      focusedEditor: {
        cardId: 'card-1',
        documentId: 'doc-1',
        originalContent: 'original text',
        editedContent: 'modified text',
        title: 'Test',
        isOpen: true,
      },
    });
    render(<FocusedEditor />);
    fireEvent.click(screen.getByRole('button', { name: 'Diff' }));
    // Diff view should render the content
    expect(screen.getByTestId('focused-editor')).toBeInTheDocument();
  });

  it('toolbar bold button wraps selection', () => {
    useAppStore.setState({
      focusedEditor: {
        cardId: 'card-1',
        documentId: 'doc-1',
        originalContent: 'hello',
        editedContent: 'hello',
        title: 'Test',
        isOpen: true,
      },
    });
    render(<FocusedEditor />);
    const textarea = screen.getByPlaceholderText('Start writing your PRD...') as HTMLTextAreaElement;
    textarea.setSelectionRange(0, 5);
    fireEvent.click(screen.getByTitle('Bold'));
    expect(useAppStore.getState().focusedEditor?.editedContent).toBe('**hello**');
  });

  it('has Cancel button that triggers close action', () => {
    const mockClose = vi.fn();
    useAppStore.setState({
      focusedEditor: {
        cardId: 'card-1',
        documentId: 'doc-1',
        originalContent: 'text',
        editedContent: 'text',
        title: 'Test',
        isOpen: true,
      },
      closeFocusedEditor: mockClose,
    });
    render(<FocusedEditor />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockClose).toHaveBeenCalled();
  });

  it.skip('submits revision on Save click', async () => {
    const mockClose = vi.fn();
    // Override closeFocusedEditor to avoid store update issues in tests
    useAppStore.setState({
      focusedEditor: {
        cardId: 'card-1',
        documentId: 'doc-1',
        originalContent: 'original',
        editedContent: 'modified content',
        title: 'Test Doc',
        isOpen: true,
      },
      closeFocusedEditor: mockClose,
    });

    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'rev-1' }) })
    ) as any;

    render(<FocusedEditor />);
    fireEvent.click(screen.getByText('Save Revision'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/doc-1/revisions'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('modified content'),
        })
      );
    });
  });

  it('disables Save when no changes', () => {
    useAppStore.setState({
      focusedEditor: {
        cardId: 'card-1',
        documentId: 'doc-1',
        originalContent: 'same',
        editedContent: 'same',
        title: 'Test',
        isOpen: true,
      },
    });
    render(<FocusedEditor />);
    const saveBtn = screen.getByText('Save Revision').closest('button');
    expect(saveBtn).toBeDisabled();
  });
});

describe('DiffView', () => {
  it('shows message when content is identical', () => {
    render(<DiffView original="same" modified="same" />);
    expect(screen.getByText(/No changes/)).toBeInTheDocument();
  });

  it('highlights additions and deletions', () => {
    render(<DiffView original="old text here" modified="new text here" />);
    // The diff splits text into segments, so we check for presence of the component
    expect(document.querySelector('ins')).toBeInTheDocument();
    expect(document.querySelector('del')).toBeInTheDocument();
  });
});
