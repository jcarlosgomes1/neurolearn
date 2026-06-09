import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <div className="flex-1"><div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{children}</div></div>
      <Footer data={{}} />
    </div>
  );
}
