import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createHandler } from "./handler.js";
import { createAI } from "./openai.js";
import { consumeCounts } from "./core.js";

initializeApp();
export { magivoxJobs } from "./jobs-function.js";
const openAIKey = defineSecret("OPENAI_API_KEY");
const split = value => (value || "").split(",").map(x => x.trim()).filter(Boolean);
const positive = (value, fallback) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback;

export const magivoxApi = onRequest({
  region: "asia-south2", memory: "256MiB", timeoutSeconds: 90,
  maxInstances: 2, minInstances: 0, concurrency: 10,
  secrets: [openAIKey], cors: false
}, (req, res) => {
  const apiKey = openAIKey.value();
  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  const config = {
    enabled: process.env.API_ENABLED === "true",
    configured: Boolean(apiKey && model),
    origins: split(process.env.ALLOWED_ORIGINS),
    allowedUIDs: split(process.env.ALLOWED_UIDS),
    accessMode: process.env.ACCESS_MODE === "authenticated" ? "authenticated" : "pilot"
  };
  const db = getFirestore();
  const consume = async (uid, cost) => {
    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    const userRef = db.doc(`_apiUsage/${uid}_${day}`);
    const globalRef = db.doc(`_apiUsage/global_${day}`);
    await db.runTransaction(async tx => {
      const [u, g] = await Promise.all([tx.get(userRef), tx.get(globalRef)]);
      const next = consumeCounts(u.data(), g.data(), {
        now, cost, dailyLimit: positive(process.env.USER_DAILY_UNITS, 30),
        globalLimit: positive(process.env.GLOBAL_DAILY_UNITS, 300)
      });
      tx.set(userRef, next.user);
      tx.set(globalRef, next.global);
    });
  };
  return createHandler({ config, verifyToken: token => getAuth().verifyIdToken(token, true), consume,
    ai: createAI({ apiKey, model, transcriptionModel: process.env.TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe" })
  })(req, res);
});
