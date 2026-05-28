import { cn } from '@/lib/utils/cn';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(?!\*)([^*\n]+)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-sm font-mono">$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-700 hover:underline" rel="noopener">$1</a>');
  return html;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  if (!source) return null;
  const lines = source.split('\n');
  const blocks: { type: string; content: string[] }[] = [];
  let current: { type: string; content: string[] } | null = null;

  for (const line of lines) {
    if (/^#{1,6} /.test(line)) {
      if (current) blocks.push(current);
      current = { type: 'h' + line.match(/^(#{1,6})/)![1].length, content: [line.replace(/^#+ /, '')] };
      blocks.push(current); current = null;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (current?.type !== 'ul') { if (current) blocks.push(current); current = { type: 'ul', content: [] }; }
      current.content.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      if (current?.type !== 'ol') { if (current) blocks.push(current); current = { type: 'ol', content: [] }; }
      current.content.push(line.replace(/^\d+\.\s/, ''));
    } else if (line.startsWith('> ')) {
      if (current?.type !== 'quote') { if (current) blocks.push(current); current = { type: 'quote', content: [] }; }
      current.content.push(line.slice(2));
    } else if (line.trim() === '---' || line.trim() === '***') {
      if (current) blocks.push(current); current = null; blocks.push({ type: 'hr', content: [] });
    } else if (line.trim() === '') {
      if (current) blocks.push(current); current = null;
    } else {
      if (current?.type !== 'p') { if (current) blocks.push(current); current = { type: 'p', content: [] }; }
      current.content.push(line);
    }
  }
  if (current) blocks.push(current);

  return (
    <div className={cn('prose-content max-w-none', className)}>
      {blocks.map((b, i) => {
        const html = b.content.map(inline).join(b.type === 'p' ? ' ' : '<br/>');
        if (b.type.startsWith('h')) {
          const level = parseInt(b.type[1]);
          const cls = level === 1 ? 'text-3xl font-bold mt-8 mb-4 text-slate-900' : level === 2 ? 'text-2xl font-bold mt-6 mb-3 text-slate-900' : level === 3 ? 'text-xl font-semibold mt-5 mb-2 text-slate-900' : 'text-lg font-semibold mt-4 mb-2 text-slate-900';
          const Tag = `h${level}` as 'h1'|'h2'|'h3'|'h4'|'h5'|'h6';
          return <Tag key={i} className={cls} dangerouslySetInnerHTML={{ __html: html }} />;
        }
        if (b.type === 'ul') return <ul key={i} className="my-4 space-y-1.5 list-disc list-inside text-slate-700">{b.content.map((c,j)=><li key={j} dangerouslySetInnerHTML={{__html:inline(c)}} />)}</ul>;
        if (b.type === 'ol') return <ol key={i} className="my-4 space-y-1.5 list-decimal list-inside text-slate-700">{b.content.map((c,j)=><li key={j} dangerouslySetInnerHTML={{__html:inline(c)}} />)}</ol>;
        if (b.type === 'quote') return <blockquote key={i} className="my-4 pl-4 border-l-4 border-brand-300 text-slate-600 italic" dangerouslySetInnerHTML={{ __html: html }} />;
        if (b.type === 'hr') return <hr key={i} className="my-8 border-slate-200" />;
        return <p key={i} className="my-3 text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}
