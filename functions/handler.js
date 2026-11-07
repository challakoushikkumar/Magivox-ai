import { AppError, chatInput, interviewInput, resumeInput, audioInput, examInput } from "./core.js";
import { jobsInput } from "./jobs-provider.js";

// No client-supplied UID, model, key, system instruction or arbitrary URL is trusted.
export function createHandler({ config, verifyToken, consume, ai, jobs }) {
  return async (req, res) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Vary", "Origin");
    try {
      const origin = req.get("origin");
      if (origin && !config.origins.includes(origin)) throw new AppError(403, "origin-denied", "This website is not authorised to connect.");
      if (origin) res.set("Access-Control-Allow-Origin", origin);
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.set("Access-Control-Allow-Headers", "Authorization,Content-Type");
        return res.status(204).send("");
      }
      const path = (req.path.replace(/^\/(?:api|jobs-api)/, "").replace(/\/$/, "") || "/");
      if (req.method === "GET" && path === "/health") return res.json({ ready: Boolean(config.enabled && config.configured), mode: config.accessMode || "pilot" });
      if (req.method !== "POST") throw new AppError(405, "method-not-allowed", "Use POST for this action.");
      const routes = jobs ? { "/jobs": [jobsInput, 3] } : { "/chat": [chatInput, 1], "/interview": [interviewInput, 2], "/resume": [resumeInput, 4], "/exam": [examInput, 2], "/transcribe": [audioInput, 3] };
      if (!routes[path]) throw new AppError(404, "not-found", "This action does not exist.");
      if (!config.enabled || !config.configured) throw new AppError(503, "setup-required", jobs ? "The live job feed is not connected yet." : "AI is not connected yet. Recording and local file preview are available.");
      const token = req.get("authorization")?.match(/^Bearer (\S+)$/)?.[1];
      if (!token) throw new AppError(401, "sign-in-required", "Log in to use AI features.");
      let identity;
      try { identity = await verifyToken(token); } catch { throw new AppError(401, "session-expired", "Your session has expired. Please log in again."); }
      if (!identity?.uid || identity.firebase?.sign_in_provider === "anonymous") throw new AppError(401, "sign-in-required", "Log in with Google or email to use AI.");
      // Fail closed until the owner explicitly adds pilot account UIDs server-side.
      if (config.accessMode !== "authenticated" && !config.allowedUIDs.includes(identity.uid)) throw new AppError(403, "pilot-access", "This account is not enabled for the current MAGIVOX pilot.");
      if (!(req.get("content-type") || "").startsWith("application/json")) throw new AppError(415, "invalid-type", "Send JSON content.");
      const maxBytes = path === "/transcribe" ? 8500000 : 120000;
      const size = req.rawBody?.length ?? Buffer.byteLength(JSON.stringify(req.body || {}));
      if (size > maxBytes) throw new AppError(413, "too-large", "This request is too large. Use a smaller file or shorter text.");
      if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) throw new AppError(400, "invalid-input", "Invalid request.");
      if (req.body.consent !== true) throw new AppError(400, "consent-required", "Please agree to send this content for AI processing.");
      const [validate, cost] = routes[path];
      const input = validate(req.body);
      await consume(identity.uid, cost);
      const result = jobs ? await jobs(input) : path === "/transcribe" ? await ai.transcribe(input) : await ai.respond(input);
      if (path === "/interview") result.score = result.structure + result.relevance + result.evidence + result.languageClarity;
      return res.json(result);
    } catch (error) {
      const known = error instanceof AppError;
      if (known && error.status === 429) res.set("Retry-After", "60");
      // Never log raw questions, resumes, recordings, tokens, provider responses or keys.
      if (!known) console.error("MAGIVOX request failed", { type: error?.name || "Error" });
      return res.status(known ? error.status : 503).json({ error: { code: known ? error.code : "service-unavailable", message: known ? error.message : "Could not complete this action. Please try later." } });
    }
  };
}
