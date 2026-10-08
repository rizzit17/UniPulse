import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { api } from '../api/client';

describe('UniPulse Frontend Application - Civic Cartography', () => {
  beforeEach(() => {
    localStorage.clear();
    api.logout();
  });

  it('renders login screen when unauthenticated', () => {
    render(<App />);
    expect(screen.getByText('UNIPULSE')).toBeInTheDocument();
    expect(screen.getByText('Sign in to UniPulse')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Sign In' }).length).toBeGreaterThan(0);
  });

  it('authenticates via quick demo button and renders dashboard with top navbar', async () => {
    render(<App />);
    const adminBtn = screen.getByRole('button', { name: 'Admin' });
    fireEvent.click(adminBtn);

    await waitFor(() => {
      expect(screen.getByText('Operations Analytics')).toBeInTheDocument();
      expect(screen.getByText(/Total Requests/i)).toBeInTheDocument();
    });

    // Top Architectural Navbar items
    expect(screen.getByRole('button', { name: 'My Requests' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Request' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Department Queue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Admin Console' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Notifications/i })).toBeInTheDocument();
  });

  it('navigates to My Requests and allows opening ticket docket view', async () => {
    render(<App />);
    const studentBtn = screen.getByRole('button', { name: 'Student' });
    fireEvent.click(studentBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'My Requests' })).toBeInTheDocument();
    });

    // Wait for ticket item in repository
    await waitFor(() => {
      expect(screen.getByText('UP-2026-000101')).toBeInTheDocument();
    });

    // Click on ticket item to inspect docket
    const ticketRow = screen.getByText('UP-2026-000101');
    fireEvent.click(ticketRow);

    await waitFor(() => {
      expect(screen.getByText(/Incident Summary/i)).toBeInTheDocument();
    });
  });

  it('navigates to New Request screen', async () => {
    render(<App />);
    const studentBtn = screen.getByRole('button', { name: 'Student' });
    fireEvent.click(studentBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'My Requests' })).toBeInTheDocument();
    });

    // Click the New Request button in the navigation or header
    const newReqBtns = screen.getAllByRole('button', { name: /New Request/i });
    fireEvent.click(newReqBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('New Service Request')).toBeInTheDocument();
      expect(screen.getByText(/1\. Issue Category/i)).toBeInTheDocument();
      expect(screen.getByText('Submit Request')).toBeInTheDocument();
    });
  });
});
