import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import StreamCard from '../src/components/StreamCard';
import { useAppStore } from '../src/store/useAppStore';
import type { StreamCard as StreamCardType } from '../src/types';

describe('Draft Card', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeAgent: null,
      focusedEditor: null,
    });
  });

  const makeDraftCard = (text: string, overrides: Partial<StreamCardType['content']> = {}): StreamCardType => ({
    id: 'draft-1',
    thread_id: 't1',
    card_type: 'draft',
    sequence_number: 1,
    content: { text, document_id: 'doc-1', title: 'Test PRD', ...overrides },
    created_at: new Date().toISOString(),
  });

  it('renders draft card with markdown', () => {
    const card = makeDraftCard('# Heading\n\nSome text');
    render(<StreamCard card={card} />);
    expect(document.querySelector('h1')).toHaveTextContent('Heading');
    expect(screen.getByText('Some text')).toBeInTheDocument();
  });

  it('shows action buttons on hover', () => {
    const card = makeDraftCard('Short text');
    render(<StreamCard card={card} />);
    const draftContent = screen.getByTestId('draft-card-content');
    fireEvent.mouseEnter(draftContent);
    expect(screen.getByRole('button', { name: /Refine/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Challenge/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
  });

  it('collapses long draft and shows expand button', () => {
    const longText = 'A'.repeat(400);
    const card = makeDraftCard(longText);
    render(<StreamCard card={card} />);
    expect(screen.getByText(/Show more/)).toBeInTheDocument();
  });

  it('does not show expand button for short drafts', () => {
    const card = makeDraftCard('Short');
    render(<StreamCard card={card} />);
    expect(screen.queryByText(/Show more/)).not.toBeInTheDocument();
  });

  it('expands draft on click', () => {
    const longText = 'A'.repeat(400);
    const card = makeDraftCard(longText);
    render(<StreamCard card={card} />);
    fireEvent.click(screen.getByText(/Show more/));
    expect(screen.queryByText(/Show more/)).not.toBeInTheDocument();
  });

  it('opens focused editor on Refine click', () => {
    const card = makeDraftCard('Draft content');
    render(<StreamCard card={card} />);
    const draftContent = screen.getByTestId('draft-card-content');
    fireEvent.mouseEnter(draftContent);
    fireEvent.click(screen.getByRole('button', { name: /Refine/i }));

    const editor = useAppStore.getState().focusedEditor;
    expect(editor).toBeTruthy();
    expect(editor?.documentId).toBe('doc-1');
    expect(editor?.title).toBe('Test PRD');
    expect(editor?.originalContent).toBe('Draft content');
  });

  it('submits approval when checkbox checked and Approve clicked', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'approved' }) })
    ) as any;

    const card = makeDraftCard('Draft');
    render(<StreamCard card={card} />);
    const draftContent = screen.getByTestId('draft-card-content');
    fireEvent.mouseEnter(draftContent);
    fireEvent.click(screen.getByRole('button', { name: /Approve/i }));

    // Check the checkbox
    const checkbox = screen.getByLabelText(/I have reviewed/);
    fireEvent.click(checkbox);

    // Click approve in modal (the one inside the modal, not the action bar)
    const modal = screen.getByText(/Review the draft before approving/i).closest('div')?.parentElement;
    expect(modal).toBeTruthy();
    const approveBtn = modal!.querySelector('button:not([disabled])');
    expect(approveBtn).toBeTruthy();
    fireEvent.click(approveBtn!);

    // Should call API
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/doc-1/approve'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
