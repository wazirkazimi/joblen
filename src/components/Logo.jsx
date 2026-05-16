import React from 'react';

/**
 * JobLens Logo component
 * size: pixel size of the logo square (default 36)
 * showText: whether to show "JobLens" text beside it (default true)
 * textSize: font size of the wordmark (default '1.3rem')
 */
const Logo = ({ size = 36, showText = true, textSize = '1.3rem' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
    <img
      src="/logo.png"
      alt="JobLens logo"
      style={{
        width:  `${size}px`,
        height: `${size}px`,
        borderRadius: '10px',
        objectFit: 'cover',
        flexShrink: 0,
      }}
    />
    {showText && (
      <span style={{
        fontWeight: 800,
        fontSize: textSize,
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        JobLens
      </span>
    )}
  </div>
);

export default Logo;
