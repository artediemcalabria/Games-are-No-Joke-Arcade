# Games Are No Joke AI Backend

Google Cloud Run backend for the AI Coach and Prototype image generator.

Endpoints:

- `POST /api/coach`
- `POST /api/prototype-image`

Required environment variable:

- `GEMINI_API_KEY`

Optional environment variable:

- `GEMINI_IMAGE_MODEL`

Deploy example:

```bash
gcloud run deploy games-ai-coach \
  --source server \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="YOUR_GEMINI_KEY"
```

For production, prefer Google Secret Manager instead of plain `--set-env-vars`.
