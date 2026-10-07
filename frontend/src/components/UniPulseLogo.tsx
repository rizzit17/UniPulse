import React from 'react';

interface UniPulseLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light';
  showSubtitle?: boolean;
  subtitleText?: string;
  badgeText?: string;
}

export const UniPulseLogo: React.FC<UniPulseLogoProps> = ({
  size = 'md',
  theme = 'light',
  showSubtitle = true,
  subtitleText = 'MUNICIPAL CAMPUS DISPATCH',
  badgeText = 'OPS',
}) => {
  const isDark = theme === 'dark';

  const dimensions = {
    sm: { icon: 34, title: '18px', sub: '9px', badge: '9px', gap: '10px' },
    md: { icon: 44, title: '22px', sub: '11px', badge: '10px', gap: '12px' },
    lg: { icon: 58, title: '32px', sub: '12px', badge: '11px', gap: '16px' },
    xl: { icon: 70, title: '38px', sub: '13px', badge: '12px', gap: '18px' },
  }[size];

  // Emblem colors adhering to neo-brutalist token palette
  const emblemBg = isDark ? '#1F1E16' : '#16150F';
  const emblemBorder = isDark ? 'var(--paper)' : 'var(--ink)';
  const emblemShadow = isDark ? '3px 3px 0 var(--amber)' : '3px 3px 0 var(--ink)';
  const glyphStroke = 'var(--paper)';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dimensions.gap,
        userSelect: 'none',
      }}
    >
      {/* Neo-brutalist Architectural Emblem */}
      <div
        style={{
          width: dimensions.icon,
          height: dimensions.icon,
          minWidth: dimensions.icon,
          backgroundColor: emblemBg,
          border: `2px solid ${emblemBorder}`,
          boxShadow: emblemShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '88%', height: '88%' }}
        >
          {/* Subtle crosshair grid lines */}
          <line x1="24" y1="2" x2="24" y2="46" stroke="#2D2B20" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="2" y1="24" x2="46" y2="24" stroke="#2D2B20" strokeWidth="1" strokeDasharray="2 2" />

          {/* Bold U Monogram */}
          <path
            d="M 9 9 V 26 C 9 32.5 14 37 21 37 H 23"
            stroke={glyphStroke}
            strokeWidth="3.5"
            strokeLinecap="square"
          />

          {/* Bold P Monogram Upper Loop & Stem */}
          <path
            d="M 27 37 V 9 H 37 C 41 9 43 12 43 16 C 43 20 41 23 37 23 H 27"
            stroke={glyphStroke}
            strokeWidth="3.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* High-Voltage Dynamic Pulse Waveform in Architectural Amber */}
          <path
            d="M 2 24 H 13 L 18 11 L 24 37 L 30 15 L 35 24 H 46"
            stroke="var(--amber)"
            strokeWidth="3.2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* Signal Status Beacon Node in Safety Brick */}
          <circle cx="24" cy="37" r="2.8" fill="var(--brick)" />
          <circle cx="24" cy="37" r="1.2" fill="var(--amber)" />
        </svg>
      </div>

      {/* Typographic Lockup */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: dimensions.title,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: isDark ? 'var(--paper)' : 'var(--ink)',
              textTransform: 'uppercase',
            }}
          >
            UniPulse
          </span>

          {badgeText && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: dimensions.badge,
                fontWeight: 800,
                color: 'var(--amber)',
                backgroundColor: isDark ? '#27251B' : '#16150F',
                border: '1.5px solid var(--amber)',
                padding: '2px 5px',
                lineHeight: 1,
                letterSpacing: '0.08em',
              }}
            >
              {badgeText}
            </span>
          )}
        </div>

        {showSubtitle && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: dimensions.sub,
              fontWeight: 600,
              color: isDark ? 'var(--paper-2)' : 'var(--ink-2)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '5px',
              lineHeight: 1.2,
            }}
          >
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
};
