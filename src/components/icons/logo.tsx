import React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <g>
      <path d="M20,20 h60 v10 h-60 z" />
      <path d="M20,45 h60 v10 h-60 z" />
      <path d="M20,70 h60 v10 h-60 z" />
    </g>
  </svg>
);

export default Logo;
