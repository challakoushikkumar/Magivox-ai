import { AppError, validateResult } from "./core.js";

export function createAI({ apiKey, model, transcriptionModel = "gpt-4o-mini-transcribe", fetchImpl = fetch }) {
  async function request(path, body, multipart = false) {
    if (!apiKey || !model) throw new AppError(503, "setup-required", "AI is not connected yet. Please contact MAGIVOX support.");
    let response;
    try {
      response = await fetchImpl(`https://api.openai.com/v1/${path}`, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(60000),
        headers: { Authorization: `Bearer ${apiKey}`, ...(!multipart ? { "Content-Type": "application/json" } : {}) },
        body: multipart ? body : JSON.stringify(body)
      });
    } catch { throw new AppError(504, "ai-timeout", "AI did not respond in time. Your text is still here. Try again later."); }
    if (!response.ok) throw new AppError(response.status === 429 ? 429 : 502, "ai-unavailable", "AI is temporarily unavailable. Please try again later.");
    try { return await response.json(); } catch { throw new AppError(502, "invalid-response", "AI returned an unreadable response. Please try again."); }
  }
  return {
    async respond({ instructions, input, schema, schemaName }) {
      const body = { model, store: false, instructions, input, max_output_tokens: schema ? 4000 : 2000 };
      if (schema) body.text = { format: { type: "json_schema", name: schemaName, strict: true, schema } };
      const result = await request("responses", body);
      const content = (result.output || []).filter(x => x.type === "message").flatMap(x => x.content || []);
      if (content.some(x => x.type === "refusal")) throw new AppError(422, "cannot-review", "AI cannot review this request. Rephrase your question or choose different content.");
      if (result.status && result.status !== "completed") throw new AppError(502, "incomplete-response", "The answer was incomplete. Shorten the text and try again.");
      const answer = content.filter(x => x.type === "output_text").map(x => x.text || "").join("\n");
      if (!answer.trim() || answer.length > 30000) throw new AppError(502, "invalid-response", "AI returned an incomplete answer. Please try again.");
      if (!schema) return { answer };
      let parsed;
      try { parsed = JSON.parse(answer); } catch { /* Checked below. */ }
      if (!validateResult(parsed, schema)) throw new AppError(502, "invalid-review", "AI returned an incomplete review. No score was saved. Please try again.");
      return parsed;
    },
    async transcribe({ data, mime, ext, languageCode }) {
      const form = new FormData();
      form.set("file", new Blob([data], { type: mime }), `recording.${ext}`);
      form.set("model", transcriptionModel);
      form.set("response_format", "json");
      if (languageCode) form.set("language", languageCode);
      const result = await request("audio/transcriptions", form, true);
      if (typeof result.text !== "string" || result.text.trim().length < 2) throw new AppError(422, "no-speech", "No clear speech was found. Record again in a quieter place.");
      if (result.text.length > 10000) throw new AppError(422, "recording-too-long", "Please record a shorter answer.");
      return { text: result.text };
    }
  };
}
