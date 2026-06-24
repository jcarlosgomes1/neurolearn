import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { RouteGlyphProvider } from '@/components/layout/RouteGlyphProvider';

export default function ChromeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1"><RouteGlyphProvider>{children}</RouteGlyphProvider></div>
      <Footer data={{}} />
    </div>
  );
}
