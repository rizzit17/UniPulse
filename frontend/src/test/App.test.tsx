import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { api } from '../api/client';

describe('UniPulse Frontend Application', () => {
  beforeEach(() => {
    localStorage.clear();
    api.logout();
  });

  it('renders login screen when unauthenticated', () => {
    render(<App />);
    expect(screen.getByText('SECURE SIGN IN')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument(); // telemetry
  });

  it('authenticates via quick demo button and renders dashboard with sidebar', async () => {
    render(<App />);
    const adminBtn = screen.getByRole('button', { name: /ADMIN/i });
    fireEvent.click(adminBtn);

    await waitFor(() => {
      expect(screen.getByText('UniPulse')).toBeInTheDocument();
      expect(screen.getByText('OPERATIONAL DISPATCH DASHBOARD')).toBeInTheDocument();
    });

    // Sidebar items should be present
    expect(screen.getByText('MY REQUESTS')).toBeInTheDocument();
    expect(screen.getByText('RAISE REQUEST')).toBeInTheDocument();
    expect(screen.getByText('DEPT QUEUE')).toBeInTheDocument();
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
    expect(screen.getByText('ADMIN CONSOLE')).toBeInTheDocument();
    expect(screen.getByText('NOTIFICATIONS')).toBeInTheDocument();
  });

  it('navigates to My Requests and allows opening ticket drawer', async () => {
    render(<App />);
    const studentBtn = screen.getByRole('button', { name: /STUDENT/i });
    fireEvent.click(studentBtn);

    await waitFor(() => {
      expect(screen.getByText('MY SERVICE REQUESTS')).toBeInTheDocument();
    });

    // Check ticket-stub presence
    await waitFor(() => {
      expect(screen.getByText('UP-2026-000101')).toBeInTheDocument();
    });

    // Click on ticket stub row to open drawer
    const ticketRow = screen.getByText('UP-2026-000101');
    fireEvent.click(ticketRow);

    await waitFor(() => {
      expect(screen.getByText(/FACTS & DISPATCH DETAILS/i)).toBeInTheDocument();
    });
  });

  it('navigates to Raise Request screen', async () => {
    render(<App />);
    const studentBtn = screen.getByRole('button', { name: /STUDENT/i });
    fireEvent.click(studentBtn);

    await waitFor(() => {
      expect(screen.getByText('MY SERVICE REQUESTS')).toBeInTheDocument();
    });

    const raiseButtons = screen.getAllByRole('button', { name: /RAISE REQUEST/i });
    fireEvent.click(raiseButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('RAISE SERVICE REQUEST')).toBeInTheDocument();
      expect(screen.getByText(/01\. DEPARTMENT & ISSUE CATEGORY/i)).toBeInTheDocument();
      expect(screen.getByText(/02\. CAMPUS LOCATION/i)).toBeInTheDocument();
      expect(screen.getByText(/03\. WHAT IS WRONG\?/i)).toBeInTheDocument();
    });
  });
});
