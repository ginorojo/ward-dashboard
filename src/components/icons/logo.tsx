import React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#F0E68C', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#DAA520', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#B8860B', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    {/* Gold border */}
    <circle cx="50" cy="50" r="49" fill="url(#gold-gradient)" />
    {/* Blue inner circle */}
    <circle cx="50" cy="50" r="45" fill="hsl(var(--primary))" />
    {/* Angel Moroni Silhouette */}
    <g fill="hsl(var(--primary-foreground))" transform="translate(0, 5)">
        <path d="M47.2,18.4h-3.8c-0.4,0-0.7,0.3-0.7,0.7v1.8c0,0.4,0.3,0.7,0.7,0.7h3.3c0.3,0,0.5-0.1,0.7-0.4l1.2-2.1c0.2-0.3,0.1-0.7-0.2-0.9L47.2,18.4z M61.1,23.3c-0.6-0.3-1.3-0.2-1.8,0.2l-10.4,8.2c-0.4,0.3-0.9,0.5-1.4,0.5c-0.6,0-1.1-0.2-1.6-0.5c-1.4-0.9-2-2.6-1.5-4.2l1.6-4.8c0.3-1,0.1-2-0.6-2.8l-1.9-2.4c-0.8-1-2-1.5-3.3-1.5c-0.8,0-1.6,0.3-2.2,0.8l-1,0.9c-0.8,0.7-1.3,1.7-1.3,2.8c0,0.5,0.1,1,0.4,1.4l2.4,3.3c0.5,0.7,1.2,1.1,2,1.3l11.4,2.9c0.2,0.1,0.5,0.1,0.7,0.1c1.3,0,2.6-0.6,3.4-1.7l3.8-4.9c0.9-1.2,0.7-2.8-0.5-3.6L61.1,23.3z M49.3,58.4l-2.6,2.9c-0.5,0.5-0.7,1.2-0.7,1.9v1.4c0,1.1,0.9,2,2,2h0.1c0.5,0,0.9-0.2,1.3-0.5l2.8-2.4c0.6-0.5,1-1.3,1-2.1v-1.6L49.3,58.4z M52.5,58.4L56,60v-1.6c0-0.8-0.2-1.6-0.7-2.2l-2.9-3.6L52.5,58.4z M50.2,38.6c-0.5-0.1-1.1-0.2-1.6-0.2c-1.8,0-3.5,0.8-4.7,2.2l-2.4,2.9c-0.5,0.6-0.8,1.4-0.8,2.2c0,1.1,0.5,2.1,1.3,2.8l3.9,3.3c0.7,0.6,1.7,1,2.7,1c0.5,0,1-0.1,1.5-0.3l11.4-4.5c1.4-0.5,2.4-1.8,2.7-3.3l0.9-4.5c0.1-0.7-0.1-1.4-0.5-2c-0.5-0.8-1.4-1.4-2.3-1.5L50.2,38.6z"/>
    </g>
  </svg>
);

export default Logo;
