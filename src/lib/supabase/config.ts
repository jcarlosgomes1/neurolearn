/**
 * Constantes de configuração pública da plataforma.
 *
 * Estratégia híbrida: usa env vars do Vercel quando disponíveis,
 * fallback para constantes hardcoded para garantir resilience
 * (Next.js inlina NEXT_PUBLIC_* em build time; se não definidas, fica undefined).
 *
 * NOTA: SUPABASE_URL e SUPABASE_ANON_KEY são intencionalmente públicos
 * — qualquer browser pode ver através da network tab.
 * A segurança é garantida pela Row Level Security (RLS) no Postgres,
 * não pela secrecy destas chaves.
 *
 * SUPABASE_SERVICE_ROLE_KEY (que dá acesso bypass RLS) NUNCA está aqui —
 * tem que ser env var no Vercel/Supabase, usada apenas server-side.
 */

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obpezocujzdaznrdgwoo.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icGV6b2N1anpkYXpucmRnd29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTU4MzAsImV4cCI6MjA5MDAzMTgzMH0.SZx4ilUcyaA732zB6qInKVLuFHntzU9C_K0x7Y_dbuc';

// Site URL (para metadata, OG cards, links absolutos)
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://neurolearn-rosy.vercel.app';

// Branding
export const BRAND = {
  name: 'NeuroLearn',
  emoji: '🧠',
  tagline: 'Plataforma global de cursos de IA',
} as const;
