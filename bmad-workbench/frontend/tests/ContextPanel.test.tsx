import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContextPanel from '../src/components/ContextPanel';

describe('ContextPanel', () => {
  it('renders all four tabs', () => {
    render(<ContextPanel />);
    expect(screen.getByTestId('tab-document')).toBeInTheDocument();
    expect(screen.getByTestId('tab-stakeholders')).toBeInTheDocument();
    expect(screen.getByTestId('tab-attachments')).toBeInTheDocument();
    expect(screen.getByTestId('tab-resources')).toBeInTheDocument();
  });

  it('shows document tab by default', () => {
    render(<ContextPanel />);
    expect(screen.getByTestId('document-tab')).toBeInTheDocument();
  });

  it('switches to stakeholders tab', () => {
    render(<ContextPanel />);
    fireEvent.click(screen.getByTestId('tab-stakeholders'));
    expect(screen.getByTestId('stakeholders-tab')).toBeInTheDocument();
    expect(screen.getByText('No stakeholders')).toBeInTheDocument();
  });

  it('switches to attachments tab', () => {
    render(<ContextPanel />);
    fireEvent.click(screen.getByTestId('tab-attachments'));
    expect(screen.getByTestId('attachments-tab')).toBeInTheDocument();
    expect(screen.getByText('No attachments')).toBeInTheDocument();
  });

  it('switches to resources tab', () => {
    render(<ContextPanel />);
    fireEvent.click(screen.getByTestId('tab-resources'));
    expect(screen.getByTestId('resources-tab')).toBeInTheDocument();
    expect(screen.getByText('No linked resources yet')).toBeInTheDocument();
  });

  it('shows add stakeholder button', () => {
    render(<ContextPanel />);
    fireEvent.click(screen.getByTestId('tab-stakeholders'));
    expect(screen.getByTestId('add-stakeholder-btn')).toBeInTheDocument();
  });

  it('shows link resource button in resources tab', () => {
    render(<ContextPanel />);
    fireEvent.click(screen.getByTestId('tab-resources'));
    expect(screen.getByTestId('link-resource-btn')).toBeInTheDocument();
  });
});
