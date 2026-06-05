import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LLMSettingsTab from '../src/components/LLMSettingsTab';

describe('LLMSettingsTab', () => {
  const mockSave = vi.fn();
  const mockTest = vi.fn();

  const providers = [
    { id: 'vllm', name: 'Local vLLM', fields: ['base_url', 'model_name'], default_base_url: 'http://localhost:8000/v1', default_models: ['llama-3.1-8b'] },
    { id: 'openai', name: 'OpenAI', fields: ['api_key', 'model_name'], default_models: ['gpt-4'] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders provider selector', () => {
    render(
      <LLMSettingsTab
        config={null}
        providers={providers}
        loading={false}
        testing={false}
        testResult={null}
        onSave={mockSave}
        onTest={mockTest}
      />
    );
    expect(screen.getByTestId('provider-select')).toBeInTheDocument();
  });

  it('shows base url input for vllm', () => {
    render(
      <LLMSettingsTab
        config={null}
        providers={providers}
        loading={false}
        testing={false}
        testResult={null}
        onSave={mockSave}
        onTest={mockTest}
      />
    );
    expect(screen.getByTestId('base-url-input')).toBeInTheDocument();
  });

  it('shows api key input for openai', () => {
    render(
      <LLMSettingsTab
        config={null}
        providers={providers}
        loading={false}
        testing={false}
        testResult={null}
        onSave={mockSave}
        onTest={mockTest}
      />
    );
    const select = screen.getByTestId('provider-select');
    fireEvent.change(select, { target: { value: 'openai' } });
    expect(screen.getByTestId('api-key-input')).toBeInTheDocument();
  });

  it('calls onTest when test button clicked', () => {
    render(
      <LLMSettingsTab
        config={{ provider: 'vllm', model_name: 'llama-3.1-8b', base_url: 'http://localhost:8000/v1' }}
        providers={providers}
        loading={false}
        testing={false}
        testResult={null}
        onSave={mockSave}
        onTest={mockTest}
      />
    );
    fireEvent.click(screen.getByTestId('test-connection-btn'));
    expect(mockTest).toHaveBeenCalled();
  });

  it('displays test result', () => {
    render(
      <LLMSettingsTab
        config={{ provider: 'vllm', model_name: 'llama-3.1-8b' }}
        providers={providers}
        loading={false}
        testing={false}
        testResult={{ success: true, message: 'Connected!', latency_ms: 145 }}
        onSave={mockSave}
        onTest={mockTest}
      />
    );
    expect(screen.getByTestId('test-result')).toHaveTextContent('Connected!');
  });
});
