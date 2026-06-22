import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { RouteGlyphProvider } from '@/components/layout/RouteGlyphProvider';

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <div className="flex-1"><div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-3 pb-6 sm:py-8"><RouteGlyphProvider>{children}</RouteGlyphProvider></div></div>
      <Footer data={{}} />
    </div>
  );
}
