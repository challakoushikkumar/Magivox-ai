# Account, Help & Support, and AI Teacher handover

## Scope and outcome

Implemented only the three requested areas in the existing static JavaScript/Firebase project. The certificate implementation and reference image were verified unchanged by SHA-256. Resume, Jobs, Portfolio, Aptitude, assessment logic and their data were not redesigned. The Teacher was extracted from `studio.js` into `teacher.js`; its existing export remains compatible with the workspace.

- Account: live five-rule password validation, visible mismatch feedback, accessible eye buttons on login/signup/change/reset, current-password reauthentication before Firebase password update, friendly errors, Google-only account guidance, and a custom reset-link page.
- Support: sidebar navigation, MAGIVOX Help Assistant using a fixed guide to existing pages, optional Gemini answers with consent, FAQs, Report a Problem, Feature Request and Contact Support. Forms create actual Firestore records and retain input on failed writes. No fake email address, response time or submission success.
- Teacher: responsive learning workspace, local greetings including “hi mawa”, natural follow-up instructions, recent context, course/topic/level/language/mode selectors, explain-again/example/hint/practice/quiz/notes/Telugu actions, safe code display, copy/read-aloud/voice recording, real topic-test progress, explicit chat and note saves, reopen/delete/download/print, and retry without losing failed questions.
- Existing Firebase AI Logic/Gemini configuration is reused. Provider labels were corrected from OpenAI to Google/Firebase AI Logic. Credentials were not created, replaced, printed or moved. No live AI requests were made during testing.

## Exact source files changed or added

Existing files modified:

1. `.gitignore` — excludes browser-test output.
2. `ai-client.js` — conversational guidance, support route and safe provider errors.
3. `app-config.js` — optional public support email field, initially empty.
4. `dashboard.html` — Help & Support navigation.
5. `firebase-auth.js` — shared controls, signup policy and duplicate-submit protection.
6. `firestore.rules` — access and shape validation for the new collections.
7. `privacy.html` — accurate AI provider, explicit saved chats/notes and support storage disclosures.
8. `signup.html` — eight-character minimum.
9. `studio.css` — responsive Teacher and Support styles.
10. `studio.js` — re-exports the new Teacher and corrects shared AI consent wording.
11. `style.css` — password field, checklist, mismatch and reset-page styles.
12. `voice-recorder.js` — correct transcription-provider label; recording behavior retained.
13. `workspace.html` — Help & Support navigation.
14. `workspace.js` — support route and account security section.
15. `scripts/build.mjs` — includes new public modules and reset page.

New source/test/documentation files:

1. `account-security.js`
2. `help-content.js`
3. `help-support.js`
4. `learning-store.js`
5. `password-policy.js`
6. `reset-password.html`
7. `teacher-conversation.js`
8. `teacher.js`
9. `scripts/browser-check.mjs`
10. `test/learning-security.test.js`
11. `PHASE-ACCOUNT-SUPPORT-TEACHER.md` (this document)

Generated files updated/added under `dist-pages/`:

`account-security.js`, `ai-client.js`, `app-config.js`, `dashboard.html`, `firebase-auth.js`, `help-content.js`, `help-support.js`, `learning-store.js`, `password-policy.js`, `privacy.html`, `reset-password.html`, `signup.html`, `studio.css`, `studio.js`, `style.css`, `teacher-conversation.js`, `teacher.js`, `voice-recorder.js`, `workspace.html`, `workspace.js`.

Ignored visual QA output: `test-output/teacher-desktop.png`, `test-output/teacher-mobile.png`, `test-output/support-mobile.png`.

`login.html` itself is unchanged; its existing `firebase-auth.js` import adds the eye control. Certificate files `certificate-design.js`, `progress-portfolio.js` and `resources/certificates/magivox-reference.jpeg` are unchanged.

## Firebase data and security

New data only; existing user document and appState structure are preserved:

| Path | Contents | Access |
| --- | --- | --- |
| `supportTickets/{id}` | Owner UID, problem/contact type, name, email, category, title, description, open status and server timestamp | Authenticated owner creates; owner or trusted admin claim reads. Client update/delete denied. |
| `featureRequests/{id}` | Same fields with feature type | Same restrictions. |
| `users/{uid}/teacherChats/{id}` | Title, course/topic, language/level/mode, bounded recent messages, update timestamp | Only that authenticated UID reads, writes or deletes. |
| `users/{uid}/teacherNotes/{id}` | Title, course, reply text, update timestamp | Only that authenticated UID reads, writes or deletes. |

Admins mean trusted Firebase Auth custom claims, not a writable profile field. Ticket review is through the Firebase Console/trusted operator tooling; no admin dashboard or automatic notification/email sender was added in this phase. Saved chats/notes are explicit user actions. Teacher history keeps up to 20 messages and 26,000 characters; each saved message/note is capped at 10,000 characters. The library shows the latest 12 of each. Full in-tab conversations can be downloaded. These subcollections are separate from the existing Settings progress export/reset.

Passwords only pass to Firebase Authentication APIs. They are not written to Firestore or localStorage. Existing login passwords are not subjected to the new signup rules, preserving access for older accounts.

## Deployment/setup still required

1. Deploy the revised `firestore.rules` to the existing Firebase project before using support submissions or saved Teacher items. The old rules deny these new paths. Publish the generated `dist-pages/` through your usual hosting process. Nothing was deployed automatically.
2. In Firebase Authentication settings, configure password policy in Require mode: minimum 8, uppercase, lowercase, numeric and non-alphanumeric. MAGIVOX additionally enforces `@` specifically in its three new-password flows. Firebase's built-in policy accepts a category of non-alphanumeric characters, so this is **not a server-enforced requirement for @ specifically**. Direct Firebase calls or a different reset handler can bypass that app-specific constraint. See [Firebase password policy](https://firebase.google.com/docs/auth/web/password-auth).
3. After hosting `reset-password.html`, configure the Password reset email template's custom action URL to your site's HTTPS `reset-password.html`. The handler reads Firebase's `mode=resetPassword` and `oobCode` parameters, verifies the code, applies the same password rules and confirms reset through Firebase. Until this template setting is changed, existing reset emails still use the Firebase-hosted handler. See [Firebase custom email actions](https://firebase.google.com/docs/auth/custom-email-handler).
4. Keep current Firebase Authentication/AI Logic configuration and App Check protections. This phase does not disable App Check or change the selected model.
5. Optionally set `supportEmail` in `app-config.js` to your real public support mailbox and rebuild. Without it, Contact Support creates a Firestore ticket. Assign someone to review these collections.

## Verification performed

- `npm test`: all 24 tests passed (19 existing, 5 new).
- `npm run check`: all 39 first-party JavaScript files passed syntax checks (also runs as part of `npm test`).
- `npm run build`: passed; 38 public files plus existing resources/readers.
- `scripts/browser-check.mjs`: 36 deterministic Chromium browser checks passed, with Firebase/AI mocked. Covers eye controls, five-rule/mismatch enforcement, reauthentication order, wrong password, reset expiry/success, Google account behavior, greetings without API, consent, follow-up history, safe errors, retry, Telugu, saves/restoration, support failures and successes, guest restrictions, mobile overflow and runtime errors.
- Desktop Teacher, mobile Teacher and mobile Support screenshots rendered and inspected. A contrast issue found during review was corrected.
- SHA-256 comparison confirmed the certificate code and artwork remained unchanged.

Browser checks do **not** verify production authentication, Gemini output quality, delivered reset emails or deployed Firestore authorization. Firestore rules were reviewed but not exercised in an emulator: Firebase CLI/emulator and Java are not installed in this workspace. Live microphone, transcription and device voices need manual testing.

To rerun browser checks with an installed Playwright package, run `node scripts/browser-check.mjs`. If using a bundled package/browser, set `PLAYWRIGHT_MODULE` to its `index.mjs` and `CHROME_PATH` to the Chrome executable. These checks never send real account data to Firebase or AI.

## Manual acceptance checklist

Use dedicated test accounts after deployment/configuration:

1. **Signup and login:** test each missing password requirement, valid `Magi@2026ai`, mismatch feedback, eye buttons, existing-account login, Google login, Remember me and logout.
2. **Settings → Change Password:** wrong current password must fail; weak or mismatched new password must stay blocked; correct credentials must succeed. Log out and verify the new password works and the old one fails. A Google-only account should show Google Account security instead of a password form.
3. **Forgot password:** request a real email; confirm its link opens the new reset page; test valid, expired and reused links and the five rules. Confirm login with the reset password.
4. **Help & Support:** try each quick topic/FAQ, ask the optional AI assistant a follow-up, submit one Problem, Feature and Contact request. Verify the reference exists in the correct Firestore collection. Test offline/denied writes: no success message, entered text retained.
5. **Teacher conversation:** try `hi`, `hi mawa`, `hello`, `thanks`, then a SQL/Python question, `naku ardham kaledhu`, `simple ga cheppu`, `example ivu`, `next`, Explain Again, Quiz Me (answer the question), Create Notes and Explain in Telugu. Verify the reply follows the previous concept and chosen level.
6. **Teacher storage:** save a chat/note, refresh or sign in on another browser and reopen it; continue the conversation, save updates, download/print and delete. Changing topics should prompt before discarding unsaved messages.
7. **Voice:** on HTTPS/localhost, Record → Stop → playback → agree → Transcribe; edit and send the transcript. Test microphone denial, Delete recording, Read aloud, Stop reading, auto-read and Telugu voice availability. Roman Telugu remains text-only for read-aloud.
8. **Security:** with two test UIDs in the Firestore Rules Playground/emulator, verify A cannot read/write B's chats/notes or read B's support ticket; unauthenticated creates fail; spoofed UID, extra fields, invalid type/length, edited timestamps and ticket updates fail. Owner writes with server timestamps should succeed. Do not use production private records for this check.
9. **Responsive/regression:** check the three areas on a phone and desktop; verify current courses, tests, certificate printing, resume/interview and other existing navigation still open normally.

Implementation and local checks are complete. Production setup and the live checks above remain; later master-plan phases were intentionally not started.
