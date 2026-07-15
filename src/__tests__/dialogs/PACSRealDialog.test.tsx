import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PACSRealDialog from '@/sections/dialogs/PACSRealDialog';

describe('PACSRealDialog static mode', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('loads demo studies without calling localhost when Orthanc is not configured', async () => {
    render(<PACSRealDialog open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /conectar/i }));

    await waitFor(() => {
      expect(screen.getByText(/5 estudios disponibles/i)).toBeTruthy();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not call Orthanc when a URL is typed without PACS opt-in', async () => {
    render(<PACSRealDialog open onOpenChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/servidor orthanc url/i), {
      target: { value: 'http://127.0.0.1:8042' },
    });
    fireEvent.click(screen.getByRole('button', { name: /conectar/i }));

    await waitFor(() => {
      expect(screen.getByText(/5 estudios disponibles/i)).toBeTruthy();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
