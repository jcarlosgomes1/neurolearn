'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart, MessageCircle, Send, Loader2 } from 'lucide-react';

type Post = { id: string; author_name: string | null; content: string; course_id: string | null; likes: number | null; created_at: string | null };
type Reply = { id: string; post_id: string; author_name: string | null; content: string; created_at: string | null };

export function CommunityClient({ initialPosts, initialReplies, likedIds, isAuthed }: { initialPosts: Post[]; initialReplies: Reply[]; likedIds: string[]; isAuthed: boolean }) {
  const sb = createClient();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [replies, setReplies] = useState<Reply[]>(initialReplies);
  const [liked, setLiked] = useState<Set<string>>(new Set(likedIds));
  const [draft, setDraft] = useState('');
  const [openReplies, setOpenReplies] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const repliesByPost = useMemo(() => {
    const m: Record<string, Reply[]> = {};
    for (const r of replies) (m[r.post_id] ||= []).push(r);
    return m;
  }, [replies]);

  async function createPost() {
    if (!draft.trim()) return;
    setBusy(true); setErr(null);
    const { data, error } = await sb.rpc('nl_community_post_create', { p_content: draft });
    if (error) { setErr(error.message); setBusy(false); return; }
    setPosts((p) => [{ id: data as string, author_name: 'tu', content: draft.trim(), course_id: null, likes: 0, created_at: new Date().toISOString() }, ...p]);
    setDraft(''); setBusy(false);
  }

  async function toggleLike(id: string) {
    if (!isAuthed) return;
    const wasLiked = liked.has(id);
    setLiked((s) => { const n = new Set(s); if (wasLiked) n.delete(id); else n.add(id); return n; });
    setPosts((p) => p.map((x) => (x.id === id ? { ...x, likes: (x.likes ?? 0) + (wasLiked ? -1 : 1) } : x)));
    const { error } = await sb.rpc('nl_community_like_toggle', { p_post_id: id });
    if (error) setLiked((s) => { const n = new Set(s); if (wasLiked) n.add(id); else n.delete(id); return n; });
  }

  async function createReply(postId: string) {
    if (!replyDraft.trim()) return;
    setBusy(true); setErr(null);
    const { data, error } = await sb.rpc('nl_community_reply_create', { p_post_id: postId, p_content: replyDraft });
    if (error) { setErr(error.message); setBusy(false); return; }
    setReplies((r) => [...r, { id: data as string, post_id: postId, author_name: 'tu', content: replyDraft.trim(), created_at: new Date().toISOString() }]);
    setReplyDraft(''); setBusy(false);
  }

  return (
    <div className="space-y-6">
      {err ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div> : null}
      {isAuthed ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} placeholder="Partilha algo com a comunidade..." className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-violet-400" />
          <div className="mt-2 flex justify-end">
            <button onClick={createPost} disabled={busy || !draft.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publicar
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">Inicia sessao para publicar.</div>
      )}

      <div className="space-y-3">
        {posts.map((post) => {
          const prs = repliesByPost[post.id] ?? [];
          const isOpen = openReplies === post.id;
          const isLiked = liked.has(post.id);
          return (
            <div key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{(post.author_name ?? '?').slice(0, 2).toUpperCase()}</span>
                <span className="font-semibold text-slate-900">{post.author_name}</span>
                <span className="text-xs text-slate-400">{post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{post.content}</p>
              <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                <button onClick={() => toggleLike(post.id)} disabled={!isAuthed} className={'inline-flex items-center gap-1 transition-colors ' + (isLiked ? 'text-rose-600' : 'hover:text-rose-600') + (!isAuthed ? ' cursor-default opacity-60' : '')}>
                  <Heart className={'h-4 w-4 ' + (isLiked ? 'fill-rose-500' : '')} /> {post.likes ?? 0}
                </button>
                <button onClick={() => setOpenReplies(isOpen ? null : post.id)} className="inline-flex items-center gap-1 hover:text-violet-600">
                  <MessageCircle className="h-4 w-4" /> {prs.length}
                </button>
              </div>
              {isOpen ? (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {prs.map((r) => (
                    <div key={r.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                      <span className="font-semibold text-slate-900">{r.author_name}</span>
                      <span className="ml-2 text-xs text-slate-400">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                      <p className="mt-1 whitespace-pre-wrap text-slate-700">{r.content}</p>
                    </div>
                  ))}
                  {isAuthed ? (
                    <div className="flex gap-2">
                      <input value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} placeholder="Responder..." className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
                      <button onClick={() => createReply(post.id)} disabled={busy || !replyDraft.trim()} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Enviar</button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
        {posts.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Ainda sem publicacoes. Se o primeiro!</div> : null}
      </div>
    </div>
  );
}
