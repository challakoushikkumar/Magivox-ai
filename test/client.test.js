import test from "node:test";
import assert from "node:assert/strict";
import { endpoint } from "../ai-client.js";
import { conversationHistory } from '../ai-core.js';
import { escapeHTML } from "../studio-utils.js";
import { calendarEvent } from "../reminders.js";
import { safeLink } from "../jobs.js";
import { readResume } from "../resume-reader.js";

test("API addresses reject non-HTTPS remote URLs and embedded credentials", () => {
  assert.throws(()=>endpoint("/chat","http://example.com"));
  assert.throws(()=>endpoint("/chat","https://user:pass@example.com"));
  assert.throws(()=>endpoint("/chat","https://example.com?apiKey=bad"));
  assert.equal(endpoint("/chat","https://example.com/api"),"https://example.com/api/chat");
  assert.equal(endpoint("/chat","http://127.0.0.1:5001/api"),"http://127.0.0.1:5001/api/chat");
});
test("chat history truncation preserves ordering and bounded recent context", () => {
  const history=Array.from({length:30},(_,i)=>({role:i%2?"assistant":"user",content:String(i)+"x".repeat(3000)}));
  const kept=conversationHistory(history); assert.ok(kept.length<=16);assert.ok(kept.reduce((n,m)=>n+m.content.length,0)<=18000);assert.deepEqual(kept.at(-1),history.at(-1));
});
test("untrusted output is escaped and unsafe saved URLs cannot execute", () => {
  assert.equal(escapeHTML('<img src=x onerror="alert(1)">'),"&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assert.equal(safeLink("javascript:alert(1)"),""); assert.equal(safeLink("data:text/html,evil"),"");
});
test("calendar reminders use UTC, an alarm, escaped text and valid line folding", () => {
  const file=calendarEvent({id:"test-id",title:"SQL, joins; practice\nBEGIN:BAD "+"తెలుగు".repeat(20),when:"2026-09-08T13:00:00+05:30"});
  assert.ok(file.includes("DTSTART:20260908T073000Z"));assert.ok(file.includes("TRIGGER:-PT10M"));assert.ok(file.includes("SQL\\, joins\\; practice\\n"));
  assert.equal(file.split("\r\n").some(l=>l.startsWith("BEGIN:BAD")),false);
  assert.ok(file.split("\r\n").every(l=>Buffer.byteLength(l)<=75));assert.ok(file.endsWith("END:VCALENDAR\r\n"));
});

test("resume reader preserves local text and rejects unsupported or oversized uploads", async () => {
  const text = "Example learner resume. I built a sales dashboard using Excel and Power BI with sample data. I am seeking my first analyst role.";
  assert.equal(await readResume(new File([text], "resume.txt")), text);
  await assert.rejects(readResume(new File(["short"], "resume.txt")), /Very little text/);
  await assert.rejects(readResume(new File([text], "resume.exe")), /PDF, DOCX or TXT/);
  await assert.rejects(readResume(new File([new Uint8Array(3 * 1024 * 1024 + 1)], "resume.txt")), /smaller than 3 MB/);
  await assert.rejects(readResume(new File(["not a PDF"], "resume.pdf")), /not a readable PDF/);
});
