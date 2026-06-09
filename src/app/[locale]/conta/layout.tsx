import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer data={{}} />
    </div>
  );
}
