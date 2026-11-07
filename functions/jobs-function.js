import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createHandler } from "./handler.js";
import { createJobsProvider } from "./jobs-provider.js";
import { consumeCounts } from "./core.js";

const appId = defineSecret("ADZUNA_APP_ID");
const appKey = defineSecret("ADZUNA_APP_KEY");
const split = value => (value || "").split(",").map(s => s.trim()).filter(Boolean);
export const magivoxJobs = onRequest({ region: "asia-south2", timeoutSeconds: 60, memory: "256MiB", maxInstances: 2, minInstances: 0, secrets: [appId, appKey], cors: false }, (req, res) => {
  const config = { enabled: process.env.JOBS_ENABLED === "true", configured: Boolean(appId.value() && appKey.value()), origins: split(process.env.ALLOWED_ORIGINS), allowedUIDs: split(process.env.ALLOWED_UIDS), accessMode: process.env.ACCESS_MODE === "authenticated" ? "authenticated" : "pilot" };
  return createHandler({ config, verifyToken: token => getAuth().verifyIdToken(token, true),
    consume: async (uid, cost) => {
      const now = Date.now(), db = getFirestore(), day = new Date(now).toISOString().slice(0, 10);
      const uRef = db.doc(`_jobsUsage/${uid}_${day}`), gRef = db.doc(`_jobsUsage/global_${day}`);
      await db.runTransaction(async tx => {
        const [u, g] = await Promise.all([tx.get(uRef), tx.get(gRef)]);
        const next = consumeCounts(u.data(), g.data(), { now, cost, dailyLimit: 18, globalLimit: 60 });
        tx.set(uRef, next.user); tx.set(gRef, next.global);
      });
    }, jobs: createJobsProvider({ appId: appId.value(), appKey: appKey.value() })
  })(req, res);
});
