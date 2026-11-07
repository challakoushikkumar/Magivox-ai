# MAGIVOX AI — Advanced V2

MAGIVOX AI is a Firebase-based learning + career-preparation web app. This V2 extends the uploaded project into a course-aware AI learning platform with topic exams, course finals, ATS resume tools, voice transcription plumbing, interview practice, progress/portfolio tools and a real-jobs backend adapter.

> **Important status:** the product code is implemented and locally tested, but paid/live services are **not activated in this ZIP**. Real AI/transcription/exam review needs an OpenAI API key stored server-side and Firebase Functions deployment. Real job search needs approved Adzuna credentials and deployment. No secret is stored in frontend code.

## What V2 includes

### Learning library

Sixteen course areas are available in the workspace:

- Excel
- SQL
- Power BI
- Tableau
- Python
- R Language
- Java
- Data Structures & Algorithms
- GIS Mapping
- HTML
- CSS
- JavaScript
- Data Entry
- Aptitude & Reasoning
- Interview Preparation
- ATS Resume & Job Search

Every course has five structured modules/topics. The learning screen shows a topic summary, current progress, a direct PDF guide link, an AI lesson link and a topic-test link.

The `resources/` folder contains 16 course PDFs plus the existing Excel/Power BI practice workbook. Five user-supplied A-to-Z PDFs and the R guide were preserved; the additional MAGIVOX guides were created to complete the library.

### Exams and scoring

`assessment-engine.js` implements a consistent course flow:

`Course -> Module -> detailed lesson -> practice -> 5-question topic test -> progress -> 50-question final exam`

- Every topic test = **5 MCQs + 5 written/practical questions**.
- Every five-topic course final = **50 questions**.
- MCQs are scored from the local answer key.
- Written answers always have a transparent local keyword-based practice estimate so the app works offline.
- When live AI access is enabled, written answers can be reviewed by the `/exam` backend route using structured output.
- A topic test scoring 60% or higher is marked passed.
- The final course exam unlocks after all lessons, practices and five topic tests are completed at 70% or higher.
- A 70% or higher final result unlocks the existing certificate only when every course requirement is satisfied.
- Attempt history and weak-answer review links are stored with the learner's practice state.

These scores are learning/practice estimates, not hiring or accredited examination results.

### Course-aware AI Teacher

The AI Teacher supports four modes:

- **Teach** — foundation -> explanation -> example
- **Doubt** — answers the exact doubt first
- **Practice** — gives a small task and works from the learner's attempt
- **Revision** — focuses on weak points and recent assessment history

The client sends the selected course, topic, level, target role and recent performance context to the backend. Supported response-language choices are English, Telugu, Telugu in English letters and Hindi.

The AI does not pretend it can see the user's screen, execute code, search jobs or inspect files that were not supplied.

### Voice + transcription

The browser voice recorder supports record, stop, playback, retry/delete and transcription submission. The backend validates audio bytes and forwards supported recordings to the configured speech-to-text model. English, Hindi and Telugu language hints are passed to transcription.

Interview feedback evaluates **transcribed text only**. It does not claim to measure accent, acoustic confidence, personality or hiring probability.

### Interview practice

The interview tool supports self-introduction/custom questions, typed or transcribed answers, structured AI feedback and a four-part practice score:

- Structure
- Relevance
- Evidence
- Language clarity

The backend computes the total score server-side from validated structured fields and generates corrections, a fact-preserving improved answer and a follow-up question.

### ATS Resume Studio

The Resume Studio can create a resume from scratch without inventing credentials.

Included locally:

- Classic ATS, Modern ATS, Technical and Fresher styles
- Contact, target role, summary, skills, education, experience, projects and certifications
- Live preview
- Section editing
- Local ATS-style **readiness** heuristic with an explicit disclaimer
- Job-description keyword overlap, matched keywords and missing keywords
- Saved local/Firebase draft state
- Print / Save as PDF
- DOCX export when the browser can load the DOCX library

The existing resume reader also accepts PDF, DOCX and TXT text extraction for AI review. AI review is instructed never to invent skills, experience, achievements or qualifications.

### Progress, certificates and portfolio

`progress-portfolio.js` adds:

- XP and learner level
- Daily activity streak
- Achievement badges
- Passed-final certificates with a local verification-style ID
- 7–90 day study-plan generator by target role
- Real-project tracker
- Printable learner portfolio

Certificates clearly state that they are MAGIVOX practice-platform certificates, not accredited degrees or employer credentials.

### Live jobs and application tracking

The existing Adzuna-backed jobs adapter remains real-provider only—no sample jobs are presented as live vacancies. It supports role/location search, up to three typed cities per request, safe provider links and application tracking. Coverage and freshness depend on the provider.

### Backend/security architecture

- Firebase Authentication verifies the signed-in user.
- Firebase Functions hold provider keys in Secret Manager.
- Same-origin Firebase Hosting rewrites map `/api/**` to `magivoxApi` and `/jobs-api/**` to `magivoxJobs`.
- Guests/anonymous users cannot call paid endpoints.
- `ACCESS_MODE=pilot` restricts calls to `ALLOWED_UIDS`; `ACCESS_MODE=authenticated` allows signed-in, non-anonymous users while app quotas still apply.
- Request size limits, origin checks, content-type checks, consent checks and usage limits fail closed.
- OpenAI Responses requests use `store: false`.
- No raw API key belongs in HTML/JavaScript/GitHub.

## Local verification performed on this V2

The project was rebuilt after the V2 changes and the local automated suite passed:

- 29 first-party JavaScript files syntax-checked
- 19 unit/contract tests passed
- exam route and authenticated/pilot access behavior covered
- static `dist-pages/` build completed
- all 16 courses confirmed to have five topics
- every topic generator confirmed to return 10 questions
- every course final generator confirmed to return 50 questions
- representative public pages/scripts/PDFs returned successfully from a local HTTP server

These checks use mocked AI/job providers. They do **not** constitute paid-provider or production deployment testing.

## Run locally

Use Node.js 22.

```bash
npm ci
npm --prefix functions ci
npm test
npm run build
```

For a frontend preview, serve the project or `dist-pages/` through localhost/Live Server. Do not open pages with `file://`.

For the **full** product with `/api` and `/jobs-api` rewrites, Firebase Hosting + Firebase Functions is the recommended deployment path. See `SETUP.md`.

## Main V2 files

| File | Purpose |
| --- | --- |
| `course-catalog.js` | 16-course structured learning catalogue |
| `assessment-engine.js` | Randomized 5-question topic tests, 50-question finals and scoring UI |
| `resume-builder.js` | ATS Resume Studio and exports |
| `progress-portfolio.js` | XP, streaks, badges, certificates, study plans and projects |
| `studio.js` | AI Teacher, interview and resume-review experiences |
| `voice-recorder.js` | recording and transcription client |
| `workspace.js` | app state, navigation, course progress and tool integration |
| `functions/core.js` | validation, teacher/interview/resume/exam prompts and schemas |
| `functions/handler.js` | authenticated API routing and access control |
| `functions/openai.js` | OpenAI Responses + transcription provider adapter |
| `functions/jobs-provider.js` | Adzuna job-search adapter |
| `firebase.json` | Hosting rewrites + Functions configuration |
| `resources/` | 16 learning PDFs + practice workbook |

## What still requires owner credentials/actions

1. OpenAI API project/key + billing/usage controls.
2. Firebase Functions/Hosting deployment permission and billing where required.
3. Approved Adzuna app ID/key for the live-jobs feed.
4. A GitHub repository if you want source pushed/versioned. The connected GitHub account currently had no repository available when checked during this build.
5. Real-browser/device acceptance testing after deployment: microphone permission, actual transcription, AI teacher, written-answer review, resume AI review, job searches and production auth/domain settings.

See `SETUP.md` for the exact activation sequence and `MAGIVOX-V2-IMPLEMENTATION.txt` for the build summary.
