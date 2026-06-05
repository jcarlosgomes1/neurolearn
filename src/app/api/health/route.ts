import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc('nl_health_check');
    if (error) {
      return NextResponse.json({ status: 'error', error: error.message }, { status: 503 });
    }
    const result = data as { status?: string };
    const httpStatus = result?.status === 'ok' ? 200 : result?.status === 'degraded' ? 200 : 503;
    return NextResponse.json(data, { 
      status: httpStatus,
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' }
    });
  } catch (e) {
    return NextResponse.json({ 
      status: 'error', 
      error: e instanceof Error ? e.message : String(e),
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
