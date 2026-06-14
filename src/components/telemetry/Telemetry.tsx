'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { SUPABASE_URL } from '@/lib/supabase/config';

const ANON_KEY = 'nl_anon_id';
const CONSENT_KEY = 'nl_cookie_consent_v1';
const ENDPOINT = '/track-ingest'; // reescrito para a edge function via rewrite, ou usa URL absoluta abaixo
const TRACK_URL = `${SUPABASE_URL}/functions/v1/track`;

function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const c = JSON.parse(raw);
    return c?.analytics === true;
  } catch { return false; }
}

function getAnonId(): string {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() || `a_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch { return `a_${Date.now()}`; }
}

function readUTM() {
  try {
    const p = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    ['source', 'medium', 'campaign', 'term', 'content'].forEach((k) => {
      const v = p.get(`utm_${k}`); if (v) utm[k] = v;
    });
    return utm;
  } catch { return {}; }
}

// fila simples em memória; flush em batch
type PV = { path: string; title?: string; referrer?: string; time_ms?: number; scroll?: number };
type EV = { name: string; path?: string; props?: Record<string, unknown> };

export function Telemetry() {
  const pathname = usePathname();
  const pvQueue = useRef<PV[]>([]);
  const evQueue = useRef<EV[]>([]);
  const pageEnter = useRef<number>(Date.now());
  const maxScroll = useRef<number>(0);
  const lastPath = useRef<string>('');
  const landing = useRef<string>('');
  const utm = useRef<Record<string, string>>({});

  // captura inicial (UTM + landing)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    utm.current = readUTM();
    landing.current = window.location.pathname;
  }, []);

  async function flush(useBeacon = false) {
    if (!hasAnalyticsConsent()) { pvQueue.current = []; evQueue.current = []; return; }
    if (pvQueue.current.length === 0 && evQueue.current.length === 0) return;
    const body = JSON.stringify({
      anon_id: getAnonId(), consent: true,
      utm: utm.current, referrer: document.referrer || null, landing: landing.current,
      lang: document.documentElement.lang || null,
      page_views: pvQueue.current.splice(0), events: evQueue.current.splice(0),
    });
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(TRACK_URL, new Blob([body], { type: 'application/json' }));
      } else {
        await fetch(TRACK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: useBeacon });
      }
    } catch { /* */ }
  }

  // regista o page view anterior quando muda de rota
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (lastPath.current && lastPath.current !== pathname) {
      pvQueue.current.push({
        path: lastPath.current, title: document.title, referrer: document.referrer || undefined,
        time_ms: Date.now() - pageEnter.current, scroll: maxScroll.current,
      });
      flush();
    }
    lastPath.current = pathname;
    pageEnter.current = Date.now();
    maxScroll.current = 0;
  }, [pathname]);

  // scroll depth
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function onScroll() {
      const h = document.documentElement;
      const denom = (h.scrollHeight - h.clientHeight) || 1;
      const pct = Math.round((h.scrollTop / denom) * 100);
      if (pct > maxScroll.current) maxScroll.current = Math.min(100, pct);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // cliques marcados com data-track
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest?.('[data-track]') as HTMLElement | null;
      if (!el) return;
      const name = el.getAttribute('data-track') || 'click';
      let props: Record<string, unknown> = {};
      try { const raw = el.getAttribute('data-track-props'); if (raw) props = JSON.parse(raw); } catch {}
      evQueue.current.push({ name, path: window.location.pathname, props });
      flush();
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // flush ao sair / esconder a aba (regista o ultimo page view)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function onHide() {
      if (lastPath.current) {
        pvQueue.current.push({
          path: lastPath.current, title: document.title,
          time_ms: Date.now() - pageEnter.current, scroll: maxScroll.current,
        });
      }
      flush(true);
    }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') onHide(); });
    window.addEventListener('pagehide', onHide);
    return () => { window.removeEventListener('pagehide', onHide); };
  }, []);

  return null;
}

// helper para registar eventos manualmente noutros componentes
export function trackEvent(name: string, props?: Record<string, unknown>) {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw || JSON.parse(raw)?.analytics !== true) return;
    const anon = localStorage.getItem('nl_anon_id') || '';
    if (!anon) return;
    const body = JSON.stringify({
      anon_id: anon, consent: true,
      events: [{ name, path: window.location.pathname, props: props || {} }],
    });
    fetch(`${SUPABASE_URL}/functions/v1/track`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true,
    }).catch(() => {});
  } catch { /* */ }
}
