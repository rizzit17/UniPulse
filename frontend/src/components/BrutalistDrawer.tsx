import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BrutalistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export const BrutalistDrawer: React.FC<BrutalistDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = '560px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Flat overlay at 60% opacity */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 21, 15, 0.6)',
          zIndex: 1001,
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: 'relative',
          zIndex: 1002,
          width: width,
          maxWidth: '100vw',
          height: '100vh',
          backgroundColor: 'var(--card)',
          borderLeft: 'var(--bw-heavy) solid var(--ink)',
          boxShadow: 'var(--sh-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: 'var(--paper-2)',
            borderBottom: 'var(--bw) solid var(--ink)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h2 style={{ fontSize: '20px', letterSpacing: '-0.01em', color: 'var(--ink)' }}>
              {title}
            </h2>
            {subtitle && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--ink-2)', marginTop: '4px' }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn-brutalist btn-secondary"
            style={{ padding: '6px' }}
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ padding: '24px', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};
