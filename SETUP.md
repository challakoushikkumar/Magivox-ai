# MAGIVOX AI Advanced V2 — Live Activation Guide

This file tells the project owner how to turn the locally tested V2 source into a real deployed product. The commands below are **instructions**, not actions already performed on your cloud account.

## 1. Verify the local build first

Install Node.js 22, extract the ZIP into a fresh folder, open a terminal in the folder containing `package.json`, then run:

```bash
npm ci
npm --prefix functions ci
npm test
npm run build
```

Expected V2 test baseline: **19 tests passing**. `npm run build` creates `dist-pages/` and copies the public learning resources without server secrets.

For a frontend-only preview, use VS Code Live Server or another localhost server. Firebase Auth modules need internet. AI/job calls will remain unavailable until the backend is deployed.

## 2. Recommended production shape

Use **Firebase Hosting + Firebase Functions** for the complete platform:

- Hosting serves `dist-pages/`.
- `/api/**` rewrites to `magivoxApi`.
- `/jobs-api/**` rewrites to `magivoxJobs`.
- Provider keys stay in Firebase Secret Manager.

`app-config.js` already points the browser to the same-origin paths `/api` and `/jobs-api`. Therefore there is no API key or function URL to put in frontend JavaScript.

GitHub Pages can host a frontend preview, but it cannot execute Firebase Hosting rewrites. For the complete V2 product, Firebase Hosting is simpler unless you deliberately change the public API base URLs to deployed HTTPS function endpoints.

## 3. Install and authenticate the Firebase CLI

On your own computer:

```bash
npm install -g firebase-tools
firebase login
firebase projects:list
```

The uploaded project's browser configuration uses Firebase project ID `magivox-ai`. Confirm this is the Firebase project you own and intend to deploy before continuing.

If the folder has no `.firebaserc`, either pass `--project magivox-ai` on commands or run:

```bash
firebase use --add
```

and select the correct project.

## 4. Configure server settings

Copy:

`functions/.env.example`

to:

`functions/.env.magivox-ai`

Start with a private pilot:

```dotenv
API_ENABLED=true
JOBS_ENABLED=false
OPENAI_MODEL=gpt-5.6-luna
TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
ALLOWED_UIDS=YOUR_FIREBASE_AUTH_UID
ACCESS_MODE=pilot
USER_DAILY_UNITS=30
GLOBAL_DAILY_UNITS=300
```

`ACCESS_MODE=pilot` means only Firebase UIDs listed in `ALLOWED_UIDS` can use paid routes. Keep this during initial testing.

After the product is ready for signed-in users, you may deliberately switch to:

```dotenv
ACCESS_MODE=authenticated
```

That mode allows any signed-in, non-anonymous Firebase user, while the request quotas still apply. Do not switch merely to bypass an access error.

As verified against OpenAI's current model documentation on 2026-09-07, `gpt-5.6-luna` supports the Responses API and structured outputs and is positioned for cost-sensitive workloads. `gpt-4o-mini-transcribe` is a supported speech-to-text model. Model availability and pricing can change, so verify them in your own OpenAI project before deployment.

## 5. Create/store the OpenAI key safely

Create the API key in the OpenAI Platform project owned by you. Never paste the raw key into:

- chat messages
- HTML/JavaScript
- `app-config.js`
- GitHub
- screenshots

Store it directly in Firebase Secret Manager:

```bash
firebase functions:secrets:set OPENAI_API_KEY --project magivox-ai
```

Enter the key only when the CLI securely prompts for the secret value.

## 6. Deploy the AI backend

With the env file and secret ready:

```bash
firebase deploy --only functions:magivoxApi --project magivox-ai
```

The AI function includes:

- `/api/health`
- `/api/chat`
- `/api/interview`
- `/api/resume`
- `/api/exam`
- `/api/transcribe`

The Hosting rewrite strips the `/api` prefix before backend routing.

## 7. Activate the real jobs provider

MAGIVOX uses the existing Adzuna adapter; it does not scrape random job sites. Obtain an approved Adzuna application ID and key for your intended use and confirm provider terms/attribution requirements.

Store the values in Secret Manager:

```bash
firebase functions:secrets:set ADZUNA_APP_ID --project magivox-ai
firebase functions:secrets:set ADZUNA_APP_KEY --project magivox-ai
```

Then update your server env:

```dotenv
JOBS_ENABLED=true
```

and deploy:

```bash
firebase deploy --only functions:magivoxJobs --project magivox-ai
```

The frontend will call `/jobs-api/jobs` through the Hosting rewrite. The UI keeps provider attribution text and sends users to the original listing to apply. The MAGIVOX tracker records status; it does not pretend the application was submitted automatically.

## 8. Deploy Firestore rules and Hosting

Review `firestore.rules` first, especially if you have already changed rules in the live Firebase project. Then deploy deliberately:

```bash
npm test
npm run build
firebase deploy --only firestore:rules,hosting --project magivox-ai
```

For a complete first deployment including both functions:

```bash
firebase deploy --only functions,firestore:rules,hosting --project magivox-ai
```

Firebase Hosting serves `dist-pages/` and handles the same-origin backend rewrites.

## 9. Add the production domain to access settings

After Firebase prints the live Hosting domain:

1. Add the domain in Firebase Authentication -> Settings -> Authorized domains.
2. Add the exact origin, e.g. `https://YOUR-SITE.web.app`, to `ALLOWED_ORIGINS` in the Functions environment.
3. Redeploy the functions after changing allowed origins.

Origin values contain scheme + hostname only; no path and no trailing slash.

## 10. Real end-to-end acceptance test

Do this while `ACCESS_MODE=pilot` and only your UID is allowed.

Test in this order:

1. Sign in with your Firebase account.
2. Open AI Teacher -> choose a course/topic -> ask a short question.
3. Switch Teacher modes: Teach, Doubt, Practice, Revision.
4. Record a short English/Telugu voice clip -> transcribe -> edit the transcript if needed.
5. Run a self-introduction interview -> confirm the score and feedback are based on text content only.
6. Complete one 5-question topic test -> confirm score, answer review, history and pass state.
7. Complete all five topic tests for one course -> confirm the 50-question final unlocks.
8. Enable AI review on written exam answers -> confirm structured marking returns.
9. Build a resume from scratch -> change style -> check JD overlap -> print PDF -> test DOCX export.
10. Upload a selectable PDF/DOCX/TXT resume -> request AI review.
11. Add a real project -> print portfolio.
12. With jobs enabled, search at least two cities and one India-wide query -> open a real provider listing -> save/update its tracker status.
13. Sign in with a non-pilot account -> confirm paid routes are denied while pilot mode is active.
14. Check Firebase Functions logs and OpenAI/Adzuna usage dashboards for unexpected errors/cost.

The automated test suite uses mocks, so this real test is required before calling the site production-ready.

## 11. GitHub source control

The GitHub connection checked during this work returned **no repositories**. Create an empty repository in your account, for example `MAGIVOX-AI`, then either push from your computer or reconnect/use the GitHub integration after the repository exists.

Local command flow:

```bash
git init
git add .
git status
git commit -m "Build MAGIVOX AI Advanced V2"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/MAGIVOX-AI.git
git push -u origin main
```

Before committing, verify that no `.env.*`, service-account JSON, OpenAI key, Adzuna key or `node_modules` is staged. The supplied `.gitignore` excludes common secret/local paths.

The repository includes a GitHub Pages workflow for the static frontend. Remember: GitHub Pages alone does not provide the Firebase Hosting `/api` and `/jobs-api` rewrites, so the full live product is best deployed with Firebase Hosting unless the frontend API bases are intentionally changed.

## 12. Cost and access safety

The backend has app-level per-user/global limits, but these are not a guaranteed currency hard cap. Configure provider billing alerts/controls as well.

To stop new AI calls through MAGIVOX:

```dotenv
API_ENABLED=false
```

then redeploy the AI function.

To stop live jobs:

```dotenv
JOBS_ENABLED=false
```

then redeploy the jobs function.

## Troubleshooting

| Problem | Check |
| --- | --- |
| `AI is not connected yet` | `API_ENABLED`, OpenAI secret, deployed `magivoxApi`, model availability |
| `current pilot` / no access | `ACCESS_MODE`, signed-in Firebase UID, `ALLOWED_UIDS` |
| website not authorised | exact `ALLOWED_ORIGINS` value and Firebase Auth authorised domain |
| `/api/...` 404 in production | use Firebase Hosting with rewrites, or configure external API URL intentionally |
| transcription fails | HTTPS/localhost microphone permission, supported browser/audio type, secret/model |
| AI exam review unavailable | signed-in live AI access + consent; local rubric still works |
| final exam locked | pass all five topic tests at 60% or higher |
| DOCX export fails | browser needs internet access to load the DOCX export library |
| resume has little text | scanned/image-only PDFs need OCR outside the current reader |
| no live job results | Adzuna credentials/feed access, city/role coverage, quotas |
| saved job says Applied | this is tracker status only; apply on the original provider/employer link |

## Launch checklist

Before public launch, also add a real support/operator contact, account-deletion path, privacy review, accessibility check, mobile browser testing, Firestore data-shape validation, abuse monitoring and provider terms review.
