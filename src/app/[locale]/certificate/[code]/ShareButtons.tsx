'use client';

import { useEffect, useState } from 'react';

interface Props {
  code: string;
  courseTitle: string;
  studentName: string;
  shareText: string;
  title: string;
  copyLabel: string;
  copiedLabel: string;
}

export default function ShareButtons({
  code, courseTitle, studentName,
  shareText, title, copyLabel, copiedLabel,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(`${window.location.origin}/certificate/${code}`);
    }
  }, [code]);

  const text = `${shareText}\n\n${studentName} · "${courseTitle}"`;

  const linkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const trackShare = () => {
    if (typeof window === 'undefined') return;
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/nl_certificate_track_share`, {
      method: 'POST',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_code: code }),
    }).catch(() => {});
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackShare();
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="text-sm font-semibold text-slate-900 mb-4 text-center">{title}</div>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackShare}
          className="px-4 py-2 bg-[#0A66C2] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
        >
          <span>in</span> LinkedIn
        </a>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackShare}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          𝕏  X
        </a>
        <a
          href={fb}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackShare}
          className="px-4 py-2 bg-[#1877F2] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          f Facebook
        </a>
        <button
          onClick={copy}
          className="px-4 py-2 bg-slate-100 text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  );
}
