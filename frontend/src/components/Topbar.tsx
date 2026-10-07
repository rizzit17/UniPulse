import React from 'react';
import { Search, Radio } from 'lucide-react';
import { User } from '../types/api';

interface TopbarProps {
  user: User | null;
  onSearch?: (query: string) => void;
  sseConnected: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ user, onSearch, sseConnected }) => {
  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--paper)',
        borderBottom: 'var(--bw) solid var(--ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      {/* Search Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '380px', width: '100%' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-2)',
            }}
          />
          <input
            type="text"
            placeholder="SEARCH PUBLIC ID OR KEYWORDS..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="form-input"
            style={{
              paddingLeft: '34px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              height: '38px',
            }}
          />
        </div>
      </div>

      {/* Right rail badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* SSE live indicator */}
        <div
          className="stamp-chip"
          style={{
            backgroundColor: sseConnected ? '#E7EFE0' : 'var(--paper-2)',
            color: sseConnected ? 'var(--moss)' : 'var(--ink-3)',
            border: 'var(--bw) solid var(--ink)',
          }}
          title={sseConnected ? 'Connected to live push stream' : 'Push stream connecting...'}
        >
          <Radio size={12} className={sseConnected ? 'pulse' : ''} />
          {sseConnected ? 'STREAM ACTIVE' : 'CONNECTING'}
        </div>

        {/* Campus Stamp */}
        <div
          className="stamp-chip"
          style={{
            backgroundColor: 'var(--card)',
            color: 'var(--ink)',
          }}
        >
          CAMPUS 01
        </div>

        {/* Role Stamp */}
        <div
          className="stamp-chip"
          style={{
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
          }}
        >
          {user?.role || 'GUEST'}
        </div>
      </div>
    </header>
  );
};
