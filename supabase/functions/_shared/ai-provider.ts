// deno-lint-ignore-file no-explicit-any
// Shared AI provider helper. Supports Lovable AI Gateway and OpenRouter.
// Configuration is read from app_settings:
//   ai_provider           -> "lovable" | "openrouter"
//   ai_lovable_model      -> default "google/gemini-2.5-flash"
//   ai_openrouter_model   -> e.g. "openai/gpt-4o-mini"
//   ai_openrouter_api_key -> sk-or-...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { AI_PAUSED, AI_PAUSED_MESSAGE } from "./ai-pause.ts";

export type AiProvider = "lovable" | "openrouter";

export interface AiConfig {
  provider: AiProvider;
  lovableModel: string;
  openrouterModel: string;
  openrouterApiKey: string;
}

const DEFAULT_LOVABLE_MODEL = "google/gemini-2.5-flash";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";

export async function getAiConfig(): Promise<AiConfig> {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data } = await admin
    .from("app_settings")
    .select("key,value")
    .in("key", [
      "ai_provider",
      "ai_lovable_model",
      "ai_openrouter_model",
      "ai_openrouter_api_key",
    ]);
  const cfg = Object.fromEntries((data ?? []).map((r: any) => [r.key, (r.value ?? "").trim()])) as Record<string, string>;
  const provider: AiProvider = cfg.ai_provider === "openrouter" ? "openrouter" : "lovable";
  return {
    provider,
    lovableModel: cfg.ai_lovable_model || DEFAULT_LOVABLE_MODEL,
    openrouterModel: cfg.ai_openrouter_model || DEFAULT_OPENROUTER_MODEL,
    openrouterApiKey: cfg.ai_openrouter_api_key || "",
  };
}

export interface AiChatOptions {
  system: string;
  user: string;
  jsonObject?: boolean;
  config?: AiConfig;
}

export interface AiChatResult {
  ok: boolean;
  status: number;
  content: string;
  provider: AiProvider;
  model: string;
  error?: string;
}

export async function aiChat(opts: AiChatOptions): Promise<AiChatResult> {
  if (AI_PAUSED) {
    return { ok: false, status: 403, content: "", provider: opts.config?.provider ?? "lovable", model: "", error: AI_PAUSED_MESSAGE };
  }
  const cfg = opts.config ?? (await getAiConfig());
  const messages = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];

  if (cfg.provider === "openrouter") {
    if (!cfg.openrouterApiKey) {
      return { ok: false, status: 500, content: "", provider: "openrouter", model: cfg.openrouterModel, error: "OpenRouter API key belum diisi" };
    }
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.openrouterApiKey}`,
        "HTTP-Referer": "https://safariman.lovable.app",
        "X-Title": "Safar Iman",
      },
      body: JSON.stringify({
        model: cfg.openrouterModel,
        messages,
        ...(opts.jsonObject ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    const text = await res.text();
    let content = "";
    try {
      const j = JSON.parse(text);
      content = j?.choices?.[0]?.message?.content ?? "";
    } catch { /* keep empty */ }
    return {
      ok: res.ok && !!content,
      status: res.status,
      content,
      provider: "openrouter",
      model: cfg.openrouterModel,
      error: res.ok ? undefined : text.slice(0, 500),
    };
  }

  // Lovable
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return { ok: false, status: 500, content: "", provider: "lovable", model: cfg.lovableModel, error: "LOVABLE_API_KEY tidak tersedia" };
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: cfg.lovableModel,
      messages,
      ...(opts.jsonObject ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const text = await res.text();
  let content = "";
  try {
    const j = JSON.parse(text);
    content = j?.choices?.[0]?.message?.content ?? "";
  } catch { /* keep empty */ }
  return {
    ok: res.ok && !!content,
    status: res.status,
    content,
    provider: "lovable",
    model: cfg.lovableModel,
    error: res.ok ? undefined : text.slice(0, 500),
  };
}
