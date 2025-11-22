'use client';
import Image from 'next/image';
import React from 'react';
import { cn } from '@/lib/utils';

const Logo = ({ className }: { className?: string }) => (
  <div className={cn('relative rounded-full overflow-hidden', className)}>
    <Image
      src="/logo.webp"
      alt="Ward Dashboard Logo"
      layout="fill"
      objectFit="cover"
    />
  </div>
);

export default Logo;
