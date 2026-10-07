import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusChip } from '../components/StatusChip';
import { ConflictBanner } from '../components/ConflictBanner';
import { StatBlock } from '../components/StatBlock';

describe('Design System Components', () => {
  it('renders P1 PriorityBadge with P1 CRITICAL label', () => {
    render(<PriorityBadge priority="P1" />);
    expect(screen.getByText('P1 CRITICAL')).toBeInTheDocument();
  });

  it('renders P2 PriorityBadge with P2 HIGH label', () => {
    render(<PriorityBadge priority="P2" />);
    expect(screen.getByText('P2 HIGH')).toBeInTheDocument();
  });

  it('renders StatusChip with formatted status text', () => {
    render(<StatusChip status="IN_PROGRESS" />);
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });

  it('renders ConflictBanner and responds to reload click', () => {
    const handleReload = vi.fn();
    render(<ConflictBanner onReload={handleReload} clientVersion={2} serverVersion={3} />);
    expect(screen.getByText(/409 CONFLICT — STALE VERSION/i)).toBeInTheDocument();
    
    const reloadButton = screen.getByRole('button', { name: /RELOAD LATEST VERSION/i });
    fireEvent.click(reloadButton);
    expect(handleReload).toHaveBeenCalledTimes(1);
  });

  it('renders StatBlock with mono value and uppercase label', () => {
    render(<StatBlock label="ACTIVE TICKETS" value={142} subtext="Operational count" />);
    expect(screen.getByText('ACTIVE TICKETS')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('Operational count')).toBeInTheDocument();
  });
});
