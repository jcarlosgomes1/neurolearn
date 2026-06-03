'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface FaqData {
  title?: string;
  items: { q: string; a: string }[];
}

interface Props {
  data: FaqData;
  /** Maximum items to display on the page. If items.length > maxItems, a "See more" link is shown. Default 6. */
  maxItems?: number;
}

export function Faq({ data, maxItems = 6 }: Props) {
  const t = useTranslations();
  const [open, setOpen] = useState<number | null>(0);
  if (!data?.items?.length) return null;

  const visible = data.items.slice(0, maxItems);
  const hasMore = data.items.length > maxItems;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        {data.title && (
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-slate-900 mb-12 tracking-tight text-balance">
            {data.title}
          </h2>
        )}
        <div className="space-y-3">
          {visible.map((item, i) => {
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
        {hasMore && (
          <div className="mt-8 text-center">
            <Link href={'/legal/faq' as any} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline">
              {t('faq.see_all', { n: data.items.length })}
              <span aria-hidden>→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
