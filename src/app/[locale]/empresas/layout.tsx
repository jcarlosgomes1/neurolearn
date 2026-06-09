import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';

export default function ChromeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer data={{}} />
    </div>
  );
}
