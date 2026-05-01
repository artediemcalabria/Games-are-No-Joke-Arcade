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

The public frontend must never contain `GEMINI_API_KEY`.

## Firebase Hosting + Functions

Firebase is the primary deployment target.

- Hosting serves the React app from `dist/`.
- Functions exposes:
  - `POST /api/coach`
  - `POST /api/prototype-image`
- The Gemini key is stored only as a Firebase Functions secret.

First setup:

```bash
firebase login
firebase functions:secrets:set GEMINI_API_KEY
npm run firebase:deploy
```

This repo is configured for Firebase project:

```text
games-are-no-joke
```

Future updates:

```bash
npm run firebase:deploy
```

If a Gemini key was pasted into chat, Cloud Shell, GitHub Secrets, or any frontend file, rotate it in Google AI Studio before deploying.

## GitHub Pages

The old GitHub Pages workflow can stay as a static backup, but AI is expected to run through Firebase Functions.

Do not use the old Cloud Run/Cloudflare backend attempts. They were removed to keep one deployment path.
