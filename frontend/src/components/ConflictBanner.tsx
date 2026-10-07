import React from 'react';

interface ConflictBannerProps {
  onReload: () => void;
  serverVersion?: number;
  clientVersion?: number;
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({
  onReload,
  serverVersion,
  clientVersion,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#F7E7E2',
        border: 'var(--bw) solid var(--brick)',
        boxShadow: 'var(--sh-md)',
        padding: '16px 20px',
        marginBottom: '20px',
      }}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--brick)',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            409 CONFLICT — STALE VERSION
          </div>
          <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ink)' }}>
            Someone changed this request while you were editing. Review changes before saving.
          </div>
          {clientVersion !== undefined && serverVersion !== undefined && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-2)', marginTop: '6px' }}>
              Your cached version: v{clientVersion} | Current database version: v{serverVersion}
            </div>
          )}
        </div>
        <button
          onClick={onReload}
          className="btn-brutalist btn-danger"
          style={{ whiteSpace: 'nowrap' }}
        >
          RELOAD LATEST VERSION
        </button>
      </div>
    </div>
  );
};
