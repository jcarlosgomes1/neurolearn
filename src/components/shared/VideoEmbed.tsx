'use client';

interface Props { url: string; title?: string }

function parseUrl(url: string): { type: 'youtube' | 'vimeo' | 'mux' | 'mp4' | 'iframe'; embedUrl: string } | null {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      let id: string | null = null;
      if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
      else if (u.searchParams.get('v')) id = u.searchParams.get('v');
      else if (u.pathname.startsWith('/embed/')) id = u.pathname.replace('/embed/', '');
      if (id) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` };
    }
    // Vimeo
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      if (id) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${id}?byline=0&portrait=0` };
    }
    // Mux (stream.mux.com/{id}.m3u8 ou player.mux.com/{id})
    if (u.hostname.includes('mux.com')) {
      return { type: 'mux', embedUrl: url };
    }
    // MP4/WebM directos
    if (/\.(mp4|webm|ogv)$/i.test(u.pathname)) return { type: 'mp4', embedUrl: url };
    // Fallback: iframe directo
    return { type: 'iframe', embedUrl: url };
  } catch { return null; }
}

export function VideoEmbed({ url, title }: Props) {
  const parsed = parseUrl(url);
  if (!parsed) {
    return (
      <div className="rounded-xl bg-slate-100 p-6 text-sm text-slate-500 text-center">
        URL de vídeo inválido. <a href={url} className="text-brand-600 underline" target="_blank" rel="noopener noreferrer">Abrir noutra janela</a>
      </div>
    );
  }

  if (parsed.type === 'mp4') {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        <video src={parsed.embedUrl} controls preload="metadata" playsInline className="absolute inset-0 w-full h-full" title={title} />
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
      <iframe
        src={parsed.embedUrl}
        title={title || 'Vídeo da aula'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}
