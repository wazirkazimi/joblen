import React from 'react';

/**
 * JobLens Logo component
 *
 * Props:
 *   size     — pixel size of the logo square (default 36)
 *   showText — show "JobLens" wordmark beside image (default true)
 *   textSize — font-size of the wordmark (default '1.3rem')
 *   variant  — 'dark' (black bg, for sidebar/auth) | 'light' (white circle, for light contexts)
 */
const Logo = ({ size = 36, showText = true, textSize = '1.3rem', variant = 'dark' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', lineHeight: 1 }}>
    <img
      src={variant === 'light' ? '/logo-light.png' : '/logo.png'}
      alt="JobLens logo"
      style={{
        width:        `${size}px`,
        height:       `${size}px`,
        borderRadius: '10px',
        objectFit:    'cover',
        flexShrink:   0,
        display:      'block',
      }}
    />
    {showText && (
      <span style={{
        fontWeight:    800,
        fontSize:      textSize,
        color:         'var(--text-primary)',
        letterSpacing: '-0.02em',
        lineHeight:    1,
      }}>
        JobLens
      </span>
    )}
  </div>
);

export default Logo;
