import React from 'react';

interface StatBlockProps {
  label: string;
  value: string | number;
  topBorderColor?: string;
  subtext?: string;
}

export const StatBlock: React.FC<StatBlockProps> = ({
  label,
  value,
  topBorderColor = 'var(--accent)',
  subtext,
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: 'var(--bw) solid var(--ink)',
        borderTop: `3px solid ${topBorderColor}`,
        boxShadow: 'var(--sh-md)',
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--ink-2)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '6px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '44px',
          fontWeight: 700,
          lineHeight: 1,
          color: 'var(--ink)',
        }}
      >
        {value}
      </div>
      {subtext && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--ink-2)',
            marginTop: '8px',
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
};
