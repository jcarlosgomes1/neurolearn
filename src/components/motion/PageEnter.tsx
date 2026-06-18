'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export function PageEnter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="nl-page-enter">
      {children}
    </div>
  );
}
