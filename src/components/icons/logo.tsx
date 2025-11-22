'use client';
import Image from 'next/image';
import React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
    <Image
      src="/logo.webp"
      alt="Ward Dashboard Logo"
      layout="fill"
      objectFit="contain"
    />
  </div>
);

export default Logo;
