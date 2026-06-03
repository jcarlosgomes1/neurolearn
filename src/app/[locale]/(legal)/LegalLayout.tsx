import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import type { ReactNode } from 'react';

export async function LegalLayout({ locale, title, lastUpdated, children }: {
  locale: string;
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  const blocks = await getHomeBlocks(locale);
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">{title}</h1>
          {lastUpdated && <p className="mt-2 text-sm text-slate-500">{lastUpdated}</p>}
          <div className="mt-8 prose prose-slate prose-sm sm:prose-base max-w-none prose-h2:font-bold prose-h2:text-slate-900 prose-h2:mt-8 prose-h2:mb-3 prose-p:text-slate-700 prose-p:leading-relaxed">
            {children}
          </div>
        </article>
      </main>
      <Footer data={blocks.footer_brand || {}} />
    </>
  );
}
