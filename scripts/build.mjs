import { copyFile, cp, mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const vendor = resolve(root, "vendor");
await mkdir(vendor, { recursive: true });
for (const [source, destination] of [
  ["pdfjs-dist/build/pdf.mjs", "pdf.mjs"],
  ["pdfjs-dist/build/pdf.worker.mjs", "pdf.worker.mjs"],
  ["pdfjs-dist/LICENSE", "PDFJS-LICENSE.txt"],
  ["mammoth/mammoth.browser.min.js", "mammoth.browser.min.js"],
  ["mammoth/LICENSE", "MAMMOTH-LICENSE.txt"]
]) {
  try { await copyFile(resolve(root, "node_modules", source), resolve(vendor, destination)); }
  catch (error) {
    if (error?.code !== "ENOENT") throw error;
    // Source archives include verified browser reader assets so a static rebuild can run offline.
    await readFile(resolve(vendor, destination));
  }
}

// Only this allowlisted output may be hosted. Server source/env files are excluded.
const publicFiles = [
  "interview-engine.js", "interview-studio.js", "speech-normalizer.js", "course-learning-engine.js", "lesson-curriculum.js", "aptitude-engine.js", "aptitude-studio.js", "career-roadmap-engine.js", "career-roadmaps.js",
  "password-policy.js", "account-security.js", "reset-password.html", "help-content.js", "help-support.js", "learning-store.js", "teacher.js", "teacher-conversation.js",
  "index.html", "login.html", "signup.html", "profile-setup.html", "dashboard.html", "workspace.html", "admin.html",
  "style.css", "workspace.css", "studio.css", "firebase-auth.js", "admin.js", "profile-setup.js", "dashboard-data.js", "script.js",
  "workspace.js", "app-config.js", "ai-client.js", "ai-core.js", "studio-utils.js", "studio.js", "voice-recorder.js", "resume-reader.js",
  "docx-worker.js", "jobs.js", "job-engine.js", "platform-engine.js", "platform-hub.js", "reminders.js", "learning-resources.js", "course-catalog.js", "assessment-engine.js", "resume-builder.js", "resume-engine.js", "resume-store.js", "progress-portfolio.js", "portfolio-engine.js", "portfolio-store.js", "portfolio.html", "public-portfolio.js", "certificate-design.js", "privacy.html"
];
const dist = resolve(root, "dist-pages");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const name of publicFiles) await copyFile(resolve(root, name), resolve(dist, name));
await cp(vendor, resolve(dist, "vendor"), { recursive: true });
await cp(resolve(root, "resources"), resolve(dist, "resources"), { recursive: true });
for (const name of publicFiles.filter(x => x.endsWith(".html"))) {
  const html = await readFile(resolve(dist, name), "utf8");
  for (const match of html.matchAll(/(?:src|href)="([^"#?]+)(?:[^\"]*)"/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|data:)/.test(target)) continue;
    await readFile(resolve(dist, target));
  }
}
console.log(`Static site built: ${publicFiles.length} files plus readers and learning resources. No server credentials included.`);



