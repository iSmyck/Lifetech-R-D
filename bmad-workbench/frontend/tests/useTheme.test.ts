import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../src/hooks/useTheme';
import { useAppStore } from '../src/store/useAppStore';

describe('useTheme', () => {
  let storage: Record<string, string> = {};

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    useAppStore.setState({ theme: 'system' });
    storage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => { storage[key] = value; },
        removeItem: (key: string) => { delete storage[key]; },
      },
      writable: true,
    });
  });

  it('defaults to system theme', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('system');
  });

  it('applies dark class when theme is dark', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('dark');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('removes dark class when theme is light', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('light');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(result.current.resolvedTheme).toBe('light');
  });

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('light');
    });
    expect(storage['bmad-theme']).toBe('light');
  });
});
