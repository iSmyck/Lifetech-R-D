import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import StreamCard from '../src/components/StreamCard';
import type { StreamCard as StreamCardType } from '../src/types';

describe('StreamCard', () => {
  it('renders user intent card', () => {
    const card: StreamCardType = {
      id: '1',
      thread_id: 't1',
      card_type: 'user_intent',
      sequence_number: 1,
      content: { text: 'Hello' },
      created_at: new Date().toISOString(),
    };
    render(<StreamCard card={card} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByTestId('stream-card')).toHaveAttribute('data-card-type', 'user_intent');
  });

  it('renders checkpoint card with question and options', () => {
    const card: StreamCardType = {
      id: '2',
      thread_id: 't1',
      card_type: 'checkpoint_clarification',
      sequence_number: 2,
      content: {
        checkpoint_id: 'cp-1',
        type: 'clarification',
        question: 'Should I include API specs?',
        options: ['Yes', 'No'],
      },
      created_at: new Date().toISOString(),
    };
    render(<StreamCard card={card} />);
    expect(screen.getByText('Should I include API specs?')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('renders checkpoint card with free-text input when no options', () => {
    const card: StreamCardType = {
      id: '3',
      thread_id: 't1',
      card_type: 'checkpoint_clarification',
      sequence_number: 3,
      content: {
        checkpoint_id: 'cp-2',
        type: 'clarification',
        question: 'What is your preference?',
      },
      created_at: new Date().toISOString(),
    };
    render(<StreamCard card={card} />);
    expect(screen.getByPlaceholderText('Type your answer…')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('submits checkpoint response on button click', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as any;

    const card: StreamCardType = {
      id: '4',
      thread_id: 't1',
      card_type: 'checkpoint_clarification',
      sequence_number: 4,
      content: {
        checkpoint_id: 'cp-3',
        type: 'clarification',
        question: 'Q?',
        options: ['Yes'],
      },
      created_at: new Date().toISOString(),
    };
    render(<StreamCard card={card} />);
    fireEvent.click(screen.getByText('Yes'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/threads/t1/respond'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ checkpoint_id: 'cp-3', response: 'Yes' }),
        })
      );
    });
  });

  it('submits free-text response', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as any;

    const card: StreamCardType = {
      id: '5',
      thread_id: 't1',
      card_type: 'checkpoint_clarification',
      sequence_number: 5,
      content: {
        checkpoint_id: 'cp-4',
        type: 'clarification',
        question: 'Q?',
      },
      created_at: new Date().toISOString(),
    };
    render(<StreamCard card={card} />);
    const textarea = screen.getByPlaceholderText('Type your answer…');
    fireEvent.change(textarea, { target: { value: 'My answer' } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/threads/t1/respond'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ checkpoint_id: 'cp-4', response: 'My answer' }),
        })
      );
    });
  });
});
