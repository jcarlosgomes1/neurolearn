import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRow {
  key: string;
  lang: string;
  value: string;
}

interface SeedRequest {
  pin: string;
  data: TranslationRow[];
}

interface SeedResponse {
  success: boolean;
  message: string;
  inserted?: number;
  updated?: number;
  errors?: string[];
}

async function processBatch(
  client: ReturnType<typeof createClient>,
  batch: TranslationRow[]
): Promise<{ inserted: number; updated: number; error?: string }> {
  try {
    const keys = batch.map(r => r.key);
    const langs = batch.map(r => r.lang);
    const values = batch.map(r => r.value);

    const { data, error } = await client.rpc('upsert_translations_batch', {
      p_keys: keys,
      p_langs: langs,
      p_values: values,
    });

    if (error) {
      return { inserted: 0, updated: 0, error: error.message };
    }

    const result = data?.[0] || { inserted: batch.length, updated: 0 };
    return { inserted: result.inserted || 0, updated: result.updated || 0 };
  } catch (err) {
    return {
      inserted: 0,
      updated: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const body: SeedRequest = await req.json();
    const { pin, data } = body;

    const adminPin = Deno.env.get('ADMIN_PIN') || '2026';
    if (pin !== adminPin) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid data: must be non-empty array' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const errors: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row.key || !row.lang || !row.value) {
        errors.push(`Row ${i}: missing key, lang, or value`);
      }
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'Validation failed', errors }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const client = createClient(supabaseUrl, supabaseKey);

    const batchSize = 50;
    let totalInserted = 0;
    let totalUpdated = 0;
    const batchErrors: string[] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, Math.min(i + batchSize, data.length));
      const { inserted, updated, error } = await processBatch(client, batch);

      totalInserted += inserted;
      totalUpdated += updated;

      if (error) {
        batchErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error}`);
      }
    }

    const response: SeedResponse = {
      success: batchErrors.length === 0,
      message: `Processed ${data.length} translations`,
      inserted: totalInserted,
      updated: totalUpdated,
    };

    if (batchErrors.length > 0) {
      response.errors = batchErrors;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        message: err instanceof Error ? err.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
