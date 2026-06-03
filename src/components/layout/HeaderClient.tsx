'use client';

import { Link } from '@/i18n/routing';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Session { email: string; area: 'student' | 'instructor' | 'admin' }

export function HeaderClient({ session }: { session: Session | null }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const NAV: Array<{ href: string; label: string }> = [
    { href: '/cursos', label: t('nav.courses') },
    { href: '/essentials', label: t('nav.essentials') },
    { href: '/empresas', label: t('nav.business') },
    { href: '/blog', label: t('nav.blog') },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 group">
            <span className="text-2xl transition-transform group-hover:scale-110">🧠</span>
            <span className="text-lg tracking-tight">NeuroLearn</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href as any} className="btn-ghost">{item.label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href={'/search' as any} aria-label={t('nav.search')}
              className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
            </Link>

            {/* CTA destacado "Ensina connosco" — só para não-instrutores e não-admins (não esconde demais o teach) */}
            {(!session || session.area === 'student') && (
              <Link
                href={'/candidatar' as any}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white transition-all shadow-sm hover:shadow"
              >
                <span>🎓</span>
                <span>{t('nav.teach_cta')}</span>
              </Link>
            )}

            {/* Language switcher só visível quando NÃO logado. Quando logado, está em /conta. */}
            {!session && (
              <div className="hidden sm:block"><LanguageSwitcher /></div>
            )}
            {session ? (
              <div className="hidden sm:block"><UserMenu email={session.email} area={session.area} /></div>
            ) : (
              <Link href={'/login' as any} className="hidden sm:inline-flex btn-primary text-sm py-2 px-4">{t('nav.signin')}</Link>
            )}

            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? t('nav.close_menu') : t('nav.open_menu')}
              aria-expanded={open}
              className="md:hidden w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors active:scale-95"
            >
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
              </div>
            ) : null}

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href as any}
                  className="flex items-center gap-3 px-3 py-3.5 rounded-lg hover:bg-slate-50 text-slate-800 font-medium transition-colors">
                  {item.label}
                </Link>
              ))}

              {/* Ensina connosco também no mobile drawer com destaque */}
              {(!session || session.area === 'student') && (
                <Link href={'/candidatar' as any} className="flex items-center gap-3 px-3 py-3.5 rounded-lg hover:opacity-90 text-white font-semibold transition-colors bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 mt-2 shadow-sm">
                  <span>🎓</span>
                  <span>{t('nav.teach_cta')}</span>
                </Link>
              )}

              <div className="my-3 border-t border-slate-100" />
              <Link href={'/search' as any} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
                {t('nav.search')}
              </Link>
              <Link href={'/legal/faq' as any} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm">
                <span>❓</span> {t('footer.faq')}
              </Link>
              <Link href={'/legal/about' as any} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm">
                <span>ℹ️</span> {t('nav.about')}
              </Link>
            </nav>

            <div className="px-5 py-4 border-t border-slate-100 space-y-3">
              {!session && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">{t('nav.language')}</span>
                    <LanguageSwitcher />
                  </div>
                  <Link href={'/login' as any} className="btn-primary w-full text-center text-sm py-3 block">
                    {t('nav.signin')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
