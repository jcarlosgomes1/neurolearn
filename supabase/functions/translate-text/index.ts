// Edge Function: translate-text
// Traduz texto on-demand usando Anthropic API + cache em nl_community_translations
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-target-lang",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://obpezocujzdaznrdgwoo.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

const LANG_NAMES: Record<string, string> = {
  pt: "Portuguese (Portugal)",
  en: "English",
  es: "Spanish",
  fr: "French",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { source_table, source_id, text, target_lang, source_lang } = await req.json();
    
    if (!text || !target_lang) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Already same language → return original
    if (source_lang === target_lang) {
      return new Response(JSON.stringify({ translated: text, cached: false, same: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Try cache first
    if (source_table && source_id) {
      const cacheRes = await fetch(
        `${SUPABASE_URL}/rest/v1/nl_community_translations?source_table=eq.${source_table}&source_id=eq.${source_id}&target_lang=eq.${target_lang}&select=translated_text`,
        { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
      );
      if (cacheRes.ok) {
        const rows = await cacheRes.json();
        if (rows.length > 0) {
          return new Response(JSON.stringify({ translated: rows[0].translated_text, cached: true }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
    }

    // Call Anthropic
    const targetName = LANG_NAMES[target_lang] || target_lang;
    const prompt = `Translate this community post to ${targetName}. Keep tone natural and conversational. Reply ONLY with the translation, no preamble or explanation.\n\nText:\n${text}`;
    
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      return new Response(JSON.stringify({ error: "Translation failed", details: err }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data = await anthropicRes.json();
    const translated = data.content?.[0]?.text?.trim() || text;

    // Cache it
    if (source_table && source_id) {
      await fetch(`${SUPABASE_URL}/rest/v1/nl_community_translations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ source_table, source_id, target_lang, translated_text: translated }),
      });
    }

    return new Response(JSON.stringify({ translated, cached: false }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
