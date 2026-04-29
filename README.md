# Games Are No Joke Arcade

Mobile-ready companion app for the Erasmus+ Training Course **Games Are No Joke**.

- Dates: `28.04-06.05.2026`
- Venue: `Filadelfia (VV), Calabria`
- Project code: `2025-1-IT03-KA153-YOU-000303546`

## Local Development

```bash
npm install
npm run dev
```

To connect the AI Coach to Gemini locally, create `.env.local` with the URL of a secure backend proxy:

```bash
VITE_AI_COACH_ENDPOINT="https://your-worker.your-account.workers.dev/api/coach"
```

If this variable is missing, the app still works with offline coaching templates.

## Online Deployment

This repo includes a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

After pushing to `main`, enable GitHub Pages in the repository settings with **GitHub Actions** as the source. The online URL will be:

```text
https://artediemcalabria.github.io/Games-are-No-Joke-Arcade/
```

For Gemini online, do not put `GEMINI_API_KEY` in GitHub Pages. Deploy a backend proxy, store `GEMINI_API_KEY` there, then add `VITE_AI_COACH_ENDPOINT` to the frontend build environment.

An example Cloudflare Worker proxy is available in `workers/ai-coach-worker.js`.
