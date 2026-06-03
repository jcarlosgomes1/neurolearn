'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface Props { url: string; title: string }

export function ShareButtons({ url, title }: Props) {
  const t = useTranslations('certificate');
  const [copied, setCopied] = useState(false);

  function share(target: 'linkedin' | 'x' | 'facebook') {
    const enc = encodeURIComponent(url);
    const encTitle = encodeURIComponent(title);
    const urls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}`,
      x: `https://twitter.com/intent/tweet?text=${encTitle}&url=${enc}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,
    };
    window.open(urls[target], '_blank', 'width=600,height=600,noopener,noreferrer');
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('link_copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('copy_failed'));
    }
  }

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-md border border-slate-200 p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3 text-center">{t('share_title')}</div>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={() => share('linkedin')} className="flex items-center gap-2 bg-[#0077b5] hover:bg-[#005e93] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
          LinkedIn
        </button>
        <button onClick={() => share('x')} className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X
        </button>
        <button onClick={() => share('facebook')} className="flex items-center gap-2 bg-[#1877f2] hover:bg-[#0c5dc7] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647z"/></svg>
          Facebook
        </button>
        <button onClick={copy} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          {copied ? '✓' : '📋'} {copied ? t('copied') : t('copy_link')}
        </button>
      </div>
    </div>
  );
}
