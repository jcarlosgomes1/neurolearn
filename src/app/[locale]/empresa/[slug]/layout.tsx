import { createClient } from '@/lib/supabase/server';
import { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

interface Branding {
  org_name: string;
  org_slug: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  font_family?: string | null;
  welcome_message?: string | null;
  footer_message?: string | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const [brandRes, cfgRes] = await Promise.all([
    sb.rpc('nl_org_branding_public', { p_slug: slug }),
    sb.from('nl_platform_config').select('value').eq('key', 'company_name').maybeSingle(),
  ]);
  const b = brandRes.data as Branding | null;
  // Platform brand comes from the backoffice (nl_platform_config), never hardcoded.
  const platformName = ((cfgRes.data?.value as string | undefined) || '').trim();
  // White-label: a tenant page shows the tenant's own brand, not the platform brand.
  const title = (b?.org_name || '').trim() || platformName || undefined;
  return {
    title,
    icons: b?.favicon_url ? { icon: b.favicon_url } : undefined,
  };
}

export default async function OrgLayout({ 
  children, 
  params 
}: { 
  children: ReactNode; 
  params: Promise<{ locale: string; slug: string }> 
}) {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.rpc('nl_org_branding_public', { p_slug: slug });
  const b = data as Branding | null;
  
  const hasBranding = b && (b.primary_color || b.accent_color || b.logo_url);
  
  // Build CSS vars dinamicamente
  const cssVars: Record<string, string> = {};
  if (b?.primary_color) cssVars['--org-primary'] = b.primary_color;
  if (b?.accent_color) cssVars['--org-accent'] = b.accent_color;
  if (b?.background_color) cssVars['--org-bg'] = b.background_color;
  if (b?.text_color) cssVars['--org-text'] = b.text_color;
  if (b?.font_family) cssVars['--org-font'] = b.font_family;
  
  return (
    <div className="org-context" style={cssVars as React.CSSProperties}>
      {b?.welcome_message && (
        <div className="border-b" style={{ 
          background: `linear-gradient(135deg, ${b.primary_color || '#6366f1'}15, ${b.accent_color || '#8b5cf6'}10)`,
          borderColor: `${b.primary_color || '#6366f1'}30`
        }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            {b.logo_url && <img src={b.logo_url} alt={b.org_name} className="h-8 w-8 rounded object-cover flex-shrink-0" />}
            <p className="text-sm flex-1 min-w-0" style={{ color: b.primary_color || '#1e293b' }}>
              {b.welcome_message}
            </p>
          </div>
        </div>
      )}
      
      {children}
      
      {b?.footer_message && (
        <footer className="border-t border-slate-100 bg-white py-4 mt-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-500">
            {b.footer_message}
          </div>
        </footer>
      )}
    </div>
  );
}
