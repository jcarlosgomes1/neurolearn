// Edge Function: lesson-tutor
// Tutor pedagógico do aluno durante a aula.
// Âmbito configurável (lesson | course | open) lido de nl_agent_settings
// (student_tutor_scope + student_tutor_scope_prompts). Respeita ativação e
// limite diário por aluno. Chama Anthropic (Haiku) e regista em nl_ai_calls.
//
// Deploy: verify_jwt:false. Variáveis SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY /
// ANTHROPIC_API_KEY são injetadas pelo ambiente Supabase Edge Functions.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://obpezocujzdaznrdgwoo.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const MODEL = "claude-haiku-4-5-20251001";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function sbGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) return null;
  return await res.json();
}

async function logCall(row: Record<string, unknown>) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/nl_ai_calls`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
  } catch (_) { /* registo é best-effort */ }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { course_id, module_index, lesson_index, lesson_title, lesson_content, history, question } = body || {};

    if (!question || typeof question !== "string") {
      return json({ answer: "Coloca uma pergunta sobre a aula." });
    }

    // Utilizador (para limite diário e registo)
    let userId: string | null = null;
    const authz = req.headers.get("Authorization") || "";
    if (authz) {
      const ures = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SERVICE_KEY, Authorization: authz },
      });
      if (ures.ok) {
        const u = await ures.json();
        userId = u?.id || null;
      }
    }

    // Definições do tutor (config-driven)
    const keys = ["student_tutor_enabled", "student_tutor_daily_limit", "student_tutor_scope", "student_tutor_scope_prompts"];
    const rows = (await sbGet(`nl_agent_settings?key=in.(${keys.join(",")})&select=key,value`)) || [];
    const cfg: Record<string, any> = {};
    for (const r of (Array.isArray(rows) ? rows : [])) cfg[r.key] = r.value;

    if (cfg["student_tutor_enabled"] === false) {
      return json({ answer: "O tutor está desativado de momento." });
    }

    const dailyLimit = Number(cfg["student_tutor_daily_limit"]) || 20;
    const scope = ["lesson", "course", "open"].includes(cfg["student_tutor_scope"]) ? cfg["student_tutor_scope"] : "lesson";
    const scopePrompts = cfg["student_tutor_scope_prompts"] || {};
    const scopeRule = scopePrompts[scope] || scopePrompts["lesson"] || "Responde apenas sobre o conteúdo desta aula.";

    // Limite diário por utilizador
    if (userId) {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const used = (await sbGet(`nl_ai_calls?operation=eq.lesson_tutor&status=eq.success&user_id=eq.${userId}&created_at=gte.${since.toISOString()}&select=id`)) || [];
      if (Array.isArray(used) && used.length >= dailyLimit) {
        return json({ answer: `Atingiste o limite de ${dailyLimit} perguntas ao tutor por hoje. Volta amanhã!` });
      }
    }

    // Contexto conforme âmbito
    let context = `Aula atual: "${lesson_title || ""}".\n\nConteúdo da aula:\n${(lesson_content || "").toString().slice(0, 8000)}`;
    if (scope === "course" && course_id) {
      const courses = await sbGet(`nl_courses?id=eq.${encodeURIComponent(course_id)}&select=title,modules`);
      const course = Array.isArray(courses) && courses[0];
      if (course) {
        const mods = Array.isArray(course.modules) ? course.modules : [];
        const outline = mods.map((m: any, mi: number) =>
          `Módulo ${mi + 1}: ${m.title || ""}\n` +
          (Array.isArray(m.lessons) ? m.lessons.map((l: any) => `  - ${l.title || ""}`).join("\n") : "")
        ).join("\n");
        context = `Curso: "${course.title || ""}".\n\nEstrutura do curso:\n${outline}\n\n${context}`;
      }
    }

    const system = [
      "És o tutor pedagógico da plataforma, integrado numa aula. Ajudas o aluno a compreender a matéria.",
      "Responde sempre na língua em que o aluno escreve. Sê claro, didático e conciso (no máximo alguns parágrafos).",
      "Não inventes factos; se algo não constar do contexto, diz que não está coberto pela aula.",
      `Regra de âmbito (obrigatória): ${scopeRule}`,
      "",
      "Contexto:",
      context,
    ].join("\n");

    // Mensagens (Anthropic exige começar em 'user')
    let msgs: Array<{ role: string; content: string }> = [];
    if (Array.isArray(history)) {
      msgs = history
        .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && m.content)
        .map((m: any) => ({ role: m.role, content: String(m.content) }));
    }
    while (msgs.length && msgs[0].role !== "user") msgs.shift();
    if (!msgs.length || msgs[msgs.length - 1].role !== "user") {
      msgs.push({ role: "user", content: question });
    }

    // Chamada ao modelo
    const t0 = Date.now();
    const ares = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 900, system, messages: msgs }),
    });
    const durMs = Date.now() - t0;
    const resourceId = course_id ? `${course_id}:${module_index}:${lesson_index}` : null;

    if (!ares.ok) {
      const errTxt = await ares.text();
      await logCall({ operation: "lesson_tutor", model: MODEL, status: "error", error_message: errTxt.slice(0, 500), duration_ms: durMs, user_id: userId, resource_type: "lesson", resource_id: resourceId, course_id: course_id || null });
      return json({ answer: "O tutor está temporariamente indisponível. Tenta novamente daqui a pouco." });
    }

    const data = await ares.json();
    const answer = (data?.content || [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim() || "Não consegui gerar uma resposta. Reformula a pergunta, por favor.";
    const inTok = data?.usage?.input_tokens ?? null;
    const outTok = data?.usage?.output_tokens ?? null;

    await logCall({ operation: "lesson_tutor", model: MODEL, status: "success", input_tokens: inTok, output_tokens: outTok, duration_ms: durMs, user_id: userId, resource_type: "lesson", resource_id: resourceId, course_id: course_id || null });

    return json({ answer, tokens: (inTok || 0) + (outTok || 0) });
  } catch (_e) {
    return json({ answer: "O tutor encontrou um erro. Tenta novamente." });
  }
});
