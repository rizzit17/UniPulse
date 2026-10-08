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
    expect(screen.getByText(/ARCHIVAL DISPATCH REGISTRY/i)).toBeInTheDocument();
    expect(screen.getByText('UniPulse')).toBeInTheDocument();
    expect(screen.getByText(/Sign In \(Authorized ID\)/i)).toBeInTheDocument();
  });

  it('authenticates via quick demo button and renders dashboard with top navbar', async () => {
    render(<App />);
    const adminBtn = screen.getByRole('button', { name: /Sys Admin/i });
    fireEvent.click(adminBtn);

    await waitFor(() => {
      expect(screen.getByText('Operational Dispatch Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Campus Operations Pulse/i)).toBeInTheDocument();
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
    const studentBtn = screen.getByRole('button', { name: /Alex Rivera/i });
    fireEvent.click(studentBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'My Requests' })).toBeInTheDocument();
      expect(screen.getByText('[STUDENT REPOSITORY]')).toBeInTheDocument();
    });

    // Wait for ticket item in repository
    await waitFor(() => {
      expect(screen.getByText('UP-2026-000101')).toBeInTheDocument();
    });

    // Click on ticket item to inspect docket
    const ticketRow = screen.getByText('UP-2026-000101');
    fireEvent.click(ticketRow);

    await waitFor(() => {
      expect(screen.getByText(/01 \/\/ Incident Narrative & Initial Assessment/i)).toBeInTheDocument();
      expect(screen.getByText('DOCKET REFERENCE')).toBeInTheDocument();
    });
  });

  it('navigates to New Request screen', async () => {
    render(<App />);
    const studentBtn = screen.getByRole('button', { name: /Alex Rivera/i });
    fireEvent.click(studentBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'My Requests' })).toBeInTheDocument();
    });

    const newReqBtn = screen.getByRole('button', { name: /Raise New Request/i });
    fireEvent.click(newReqBtn);

    await waitFor(() => {
      expect(screen.getByText('File an Incident Report')).toBeInTheDocument();
      expect(screen.getByText(/\[FORM 804-A: DISPATCH DOCKET\]/i)).toBeInTheDocument();
      expect(screen.getByText(/Category & Trade Classification/i)).toBeInTheDocument();
      expect(screen.getByText('DISPATCH REVIEW DOCKET')).toBeInTheDocument();
    });
  });
});
