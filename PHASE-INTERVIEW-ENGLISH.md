# Conversational Interview and English Coach handover

## Completion

This phase is implemented in the existing MAGIVOX workspace. Open **Interview Practice** and choose **Self-Introduction English AI**, **Mock Interview**, or **English Communication Coach**. The earlier Teacher, Help & Support, account security, certificates, courses and PDFs were not rebuilt.

The implementation and local automated validation are complete. Real-account Firebase/Gemini checks and listening tests with your physical microphone and device voices remain manual acceptance steps. Nothing was deployed automatically.

## What is implemented

- English conversation with one question at a time and context from all completed turns in the current session.
- Existing microphone recorder → Stop → playback → Transcribe → editable text → Send answer.
- Short feedback and a relevant follow-up after each submitted answer, rather than one score after a single answer.
- Start, Pause/Resume, Retry Answer, Skip question and End Interview. Retry replaces the previous turn; skipped turns are not counted as answered evidence. Pausing releases the microphone, stops local speech and ignores late AI responses. A request already sent to the provider may still finish there.
- User and AI transcripts; English read-aloud, repeat question and Stop voice. Starting the microphone cancels queued AI speech.
- Up to 10 questions per session, with at least two answered questions required for a scored report. Short sessions end without fabricated scores. In-progress transcripts remain in the tab; download them before leaving.
- Mock modes: HR, Data Analyst, SQL, Power BI, Tableau, Java, Python, GIS and Web Development, mapped to the existing course catalogue.
- English coaching at Beginner, Intermediate and Advanced levels: Grammar correction, Workplace English, Recruiter communication, Interview sentences and Speaking practice.
- Final report: overall /100, English Fluency, Grammar, Confidence (delivery), Clarity, Pronunciation, Vocabulary, Content Quality, Interview Readiness, mistakes, corrected sentences, better vocabulary, transcript filler counts, strong/weak points, a truthful improved introduction and a personalized plan.
- Download/print reports, download the full session transcript, save reports to existing account history, reopen reports and compare matching earlier attempts. Earlier score-only records remain readable.

## Score interpretation

Grammar, clarity, vocabulary, content quality and interview readiness are AI practice estimates from submitted answers. For recorded answers, the same existing Firebase AI Logic client also sends the recording for estimates of fluency, pronunciation/intelligibility and audible delivery confidence. Confidence is not an assessment of personality or inner confidence, and a regional accent is not treated as a defect.

If there is no usable audio, those three speech measures show **Not assessed**, rather than zero or invented numbers. The overall score averages available measures. Comparisons use the five text measures across the same practice/mode/role/level/rubric, so switching from typed to spoken practice does not artificially change the comparison. Opening older reports compares only against attempts earlier than that report.

Filler counts use the submitted transcript; transcription can omit fillers and some phrases may be intentional. Corrected sentences/vocabulary must quote text actually submitted by the learner. AI feedback and introductions still need a human check for accuracy.

## Exact files changed in this phase

New files:

- `interview-engine.js` — session transitions, catalogue modes, validation, scoring and comparisons.
- `interview-studio.js` — the three conversational practice experiences and report/history UI.
- `scripts/interview-browser-cases.mjs` — deterministic interview, speech and history browser tests.
- `test/interview.test.js` — session, scoring, evidence, saved-report and comparison unit tests.
- `PHASE-INTERVIEW-ENGLISH.md` — this handover document.

Existing files modified:

- `ai-client.js` — adds `/interview-turn` and `/interview-report` to the existing authenticated Firebase AI Logic dispatcher; validates structured responses. Existing routes remain.
- `voice-recorder.js` — optional lifecycle controls/callbacks, recording metadata, microphone shutdown and stale-transcript protection; existing callers remain compatible.
- `studio.js` — re-exports the upgraded `mountInterview`; Teacher export and Resume implementation are retained.
- `studio.css` — styles scoped to the interview/coach workspace.
- `workspace.js` — history getter, idempotent report saves in the existing interview history, updated interview description.
- `help-content.js` — updates the existing interview FAQ to describe the new flow.
- `privacy.html` — describes interview audio processing and optional saved report contents.
- `scripts/build.mjs` — includes the two new public modules.
- `scripts/browser-check.mjs` — extends the existing regression runner, adds synthetic microphone support and an optional interview-only test mode.

Generated copies updated/added under `dist-pages/`:

`ai-client.js`, `help-content.js`, `interview-engine.js`, `interview-studio.js`, `privacy.html`, `studio.css`, `studio.js`, `voice-recorder.js`, `workspace.js`.

Ignored QA images: `test-output/interview-desktop.png` and `test-output/interview-mobile.png`, alongside existing phase screenshots.

SHA-256 comparison against the start of this phase confirmed `teacher.js`, `account-security.js`, `help-support.js`, `certificate-design.js`, `progress-portfolio.js`, `course-catalog.js` and `firestore.rules` are unchanged. Existing PDF/resource files were preserved.

## Firebase and manual setup

- **No new keys, Firebase services, collections, indexes or rule changes are required for this phase.** It reuses Firebase Authentication and the existing Gemini/Firebase AI Logic configuration. The legacy `/interview` route remains available.
- Reports are saved through the existing `users/{uid}.appState.interviewSessions` array, keeping the latest 20 attempts. Entries include an ID, practice/mode/role/level, date, counts, score and feedback report. Retried saves replace the same ID instead of creating duplicates. The existing owner-only user-document rule applies.
- Raw audio and the full transcript are **not** saved to Firestore. Saved feedback can contain quoted corrections and the improved introduction; the save checkbox explains this and can be turned off. Settings export/reset includes this existing history array.
- Run `npm run build` and publish `dist-pages/` using your normal hosting process when ready. Production microphones require HTTPS (localhost is supported for development).
- The existing Firebase project must still allow authenticated AI Logic requests and the configured model. Do not disable App Check to work around access errors. This implementation uses Firebase's supported [structured output](https://firebase.google.com/docs/ai-logic/generate-structured-output) and [audio input](https://firebase.google.com/docs/ai-logic/analyze-audio) through the existing client.
- Earlier account reset-email/support setup remains as documented in the previous phase; it was not changed here.

## Verification

- `npm test`: **31 tests passed**, including all existing tests and 7 interview tests.
- Syntax checks: **43 first-party JavaScript files passed**.
- `npm run build`: passed; **40 public files** plus existing readers/resources.
- Full Chromium regression suite: **66 checks passed** across prior features and this phase.
- Browser tests exercise real Chromium MediaRecorder with a **synthetic microphone**, checking permission denial, recording, playback creation, stopped tracks, transcription insertion, audio submission, context, pause/cancellation, retry/skip, final-report failures, save failures/retry, history reload/comparison, all mode choices and mobile overflow. Firebase and Gemini responses are mocked; read-aloud uses a controlled speech-synthesis sink. These are not claims of live Gemini quality or physically hearing your device.
- Desktop and mobile screenshots were inspected. The test double's Firebase schema lookup and a timing-sensitive cancellation test were corrected during validation; failures never produced a saved fake score.

Re-run the normal checks with `npm test` and `npm run build`. Run browser checks with `node scripts/browser-check.mjs` using Playwright. If using the bundled runtime, set `PLAYWRIGHT_MODULE` to its `playwright/index.mjs` and `CHROME_PATH` to the installed Chrome executable. `INTERVIEW_ONLY=1` runs the focused interview checks; omit it for all regressions.

## Simple manual checklist

1. Sign in and open **Interview Practice**. Start Self-Introduction, answer at least three questions, and check each follow-up refers to what you said.
2. Record a real spoken answer, Stop, listen, Transcribe, correct a word and Send. Verify User/AI transcripts, English read-aloud, repeat question and Stop voice. Deny microphone access once and confirm typing still works.
3. Pause during recording and during an AI request. Confirm the microphone stops, the draft remains and no late answer appears. Resume, retry the previous answer, skip a question and end the session.
4. Inspect all eight measures, corrections, vocabulary, filler feedback, strengths, weaknesses, improved introduction and plan. Try typed-only practice and confirm speech measures say Not assessed. End a zero/one-answer session and confirm no score is invented.
5. Complete two attempts with the same mode/role/level. Save, refresh/sign in elsewhere, reopen the reports and check the comparison. Test Download report, Print/Save PDF and Download transcript. Disable saving for an attempt and verify it is not automatically stored.
6. Try Mock Interview modes such as SQL, Power BI and HR. Try all English Coach focus choices and switch between Beginner/Intermediate/Advanced before starting.
7. Temporarily go offline or simulate a denied save using a test environment. Verify failed sends retain your answer, reports can retry, and failed saves do not claim success.
8. On phone and desktop, verify Teacher, Help & Support, password controls, certificates, courses and PDF links still work. Use two test accounts to confirm interview history stays private.

**Status:** implementation complete and locally validated. Live provider/device acceptance and publishing remain manual; no other master-plan phase was started.
