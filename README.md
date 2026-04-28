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

To enable the Gemini AI Trainer Coach locally, create `.env.local`:

```bash
GEMINI_API_KEY="your_gemini_api_key_here"
```

## Online Deployment

This repo includes a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

After pushing to `main`, enable GitHub Pages in the repository settings with **GitHub Actions** as the source. The online URL will be:

```text
https://artediemcalabria.github.io/Games-are-No-Joke-Arcade/
```

For Gemini online, add a repository secret named `GEMINI_API_KEY` before running the deployment workflow.
