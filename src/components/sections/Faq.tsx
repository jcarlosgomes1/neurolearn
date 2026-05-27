'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FaqData {
  title?: string;
  items: { q: string; a: string }[];
}

export function Faq({ data }: { data: FaqData }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!data?.items?.length) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        {data.title && (
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-slate-900 mb-12 tracking-tight text-balance">
            {data.title}
          </h2>
        )}
        <div className="space-y-3">
          {data.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={cn(
                  'border rounded-xl transition-all overflow-hidden',
                  isOpen ? 'border-brand-300 bg-brand-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-medium text-slate-900">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-slate-400 flex-shrink-0 transition-transform',
                      isOpen && 'rotate-180 text-brand-600'
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-200',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed text-pretty">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
