'use client';

import { Link } from '@/i18n/routing';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { CurrencySwitcher } from '@/components/currency/CurrencySwitcher';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { LogOut, LayoutDashboard, BookOpen, Route, Sparkles, Building2, Newspaper } from 'lucide-react';

interface Session { email: string; area: 'student' | 'instructor' | 'admin'; areas: Array<'student' | 'instructor' | 'admin'> }

export function HeaderClient({ session }: { session: Session | null }) {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // LinkedIn-style: barra de altura fixa que desliza para fora ao descer e volta ao subir (mobile).
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    function update() {
      const y = window.scrollY;
      if (y < 80) setHidden(false);
      else if (y > lastY + 4) setHidden(true);
      else if (y < lastY - 4) setHidden(false);
      lastY = y;
      ticking = false;
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const NAV: Array<{ href: string; label: string; Icon: typeof BookOpen }> = [
    { href: '/cursos', label: t('nav.courses'), Icon: BookOpen },
    { href: '/aprender/percursos', label: 'Percursos', Icon: Route },
    { href: '/essentials', label: t('nav.essentials'), Icon: Sparkles },
    { href: '/para-empresas', label: t('nav.business'), Icon: Building2 },
    { href: '/blog', label: t('nav.blog'), Icon: Newspaper },
  ];

  const cleanPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  const isActive = (href: string) =>
    href === '/' ? cleanPath === '/' : cleanPath === href || cleanPath.startsWith(href + '/');

  return (
    <>
      <header className={`sticky top-0 z-40 bg-white border-b border-slate-200 transition-transform duration-300 will-change-transform ${(hidden && !open) ? 'max-md:-translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 group shrink-0">
            <span className="text-2xl transition-transform group-hover:scale-110">🧠</span>
            <span className="text-lg tracking-tight">NeuroLearn</span>
          </Link>

          <nav className="hidden md:flex items-stretch h-full">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href as any}
                  className={`group relative flex flex-col items-center justify-center h-full px-3 lg:px-4 min-w-[60px] gap-0.5 text-[11px] font-medium transition-colors ${active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-900'}`}>
                  <item.Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
                  <span>{item.label}</span>
                  <span className={`absolute bottom-0 left-2.5 right-2.5 h-[2.5px] rounded-full transition-colors ${active ? 'bg-brand-600' : 'bg-transparent group-hover:bg-slate-200'}`} />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href={'/search' as any} aria-label={t('nav.search')}
              className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
            </Link>

            <div className="hidden sm:block"><CurrencySwitcher /></div>

            {session && <div className="hidden md:block"><NotificationsDropdown locale={locale} /></div>}

            {(!session || session.area === 'student') && (
              <Link href={'/candidatar' as any}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white transition-all shadow-sm hover:shadow">
                <span>🎓</span><span>{t('nav.teach_cta')}</span>
              </Link>
            )}

            {!session && <div className="hidden sm:block"><LanguageSwitcher /></div>}
            {session ? (
              <div className="hidden sm:block"><UserMenu email={session.email} area={session.area} areas={session.areas} /></div>
            ) : (
              <Link href={'/login' as any} className="hidden sm:inline-flex btn-primary text-sm py-2 px-4">{t('nav.signin')}</Link>
            )}

            <button onClick={() => setOpen(!open)}
              aria-label={open ? t('nav.close_menu') : t('nav.open_menu')}
              aria-expanded={open}
              className="md:hidden w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors active:scale-95">
              {open ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="absolute top-0 right-0 bottom-0 w-[88%] max-w-sm bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-900">{t('nav.menu')}</span>
              <button onClick={() => setOpen(false)} aria-label={t('nav.close_menu')} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
              </button>
            </div>

            {session ? (
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">
                    {session.email[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-500 capitalize">{session.area}</div>
                    <div className="text-sm font-medium text-slate-900 truncate">{session.email}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href={'/conta' as any} className="text-sm bg-white border border-slate-200 hover:border-slate-300 rounded-lg py-2 text-center font-medium text-slate-700">
                    {t('user_menu.account')}
                  </Link>
                  <Link href={'/learn' as any} className="text-sm bg-white border border-slate-200 hover:border-slate-300 rounded-lg py-2 text-center font-medium text-slate-700">
                    {t('user_menu.learning')}
                  </Link>
                </div>
                {session.area === 'admin' && (
                  <a href={`/${locale}/admin`}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow">
                    <LayoutDashboard className="h-4 w-4" /> Cockpit admin
                  </a>
                )}
                {session.area === 'instructor' && (
                  <a href={`/${locale}/teach`}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-lg shadow">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard instrutor
                  </a>
                )}
              </div>
            ) : null}

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href as any}
                  className="flex items-center gap-3 px-3 py-3.5 rounded-lg hover:bg-slate-50 text-slate-800 font-medium transition-colors">
                  <item.Icon className="h-5 w-5 text-slate-400" /> {item.label}
                </Link>
              ))}

              {(!session || session.area === 'student') && (
                <Link href={'/candidatar' as any} className="flex items-center gap-3 px-3 py-3.5 rounded-lg hover:opacity-90 text-white font-semibold transition-colors bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 mt-2 shadow-sm">
                  <span>🎓</span><span>{t('nav.teach_cta')}</span>
                </Link>
              )}

              <div className="my-3 border-t border-slate-100" />
              <Link href={'/search' as any} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
                {t('nav.search')}
              </Link>
              {session && (
                <Link href={'/conta/notificacoes' as any} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                Notificações
                </Link>
              )}
              <Link href={'/contacto' as any} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm">
                <span>📨</span> Contacto
              </Link>
              <Link href={'/legal/faq' as any} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm">
                <span>❓</span> {t('footer.faq')}
              </Link>
              <Link href={'/legal/about' as any} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm">
                <span>ℹ️</span> {t('nav.about')}
              </Link>
            </nav>

            <div className="px-5 py-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">Moeda</span>
                <CurrencySwitcher />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">{t('nav.language')}</span>
                <LanguageSwitcher />
              </div>
              {!session ? (
                <Link href={'/login' as any} className="btn-primary w-full text-center text-sm py-3 block">
                  {t('nav.signin')}
                </Link>
              ) : (
                <a href="/api/auth/logout"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow transition-colors">
                  <LogOut className="h-4 w-4" /> Terminar sessão
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
