import { render, screen, waitFor } from '@testing-library/react';
import LiveStatusBar from './LiveStatusBar';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('LiveStatusBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state and "Network Live" indicator', () => {
    render(<LiveStatusBar />);
    expect(screen.getByText('Network Live')).toBeInTheDocument();
  });

  it('renders weather data after successful fetch', async () => {
    const mockResponse = {
      current_weather: {
        temperature: 28,
        weathercode: 0 // Clear Sky
      }
    };
    
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockResponse)
    });

    render(<LiveStatusBar />);
    
    await waitFor(() => {
      expect(screen.getByText('Clear Sky')).toBeInTheDocument();
      expect(screen.getByText('28°C')).toBeInTheDocument();
    });
  });

  it('renders error state when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));

    render(<LiveStatusBar />);
    
    await waitFor(() => {
      expect(screen.getByText('Campus Data Offline')).toBeInTheDocument();
    });
  });
});
