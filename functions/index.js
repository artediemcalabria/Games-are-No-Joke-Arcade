const express = require('express');
const { onRequest } = require('firebase-functions/v2/https');

const app = express();

const allowedOrigins = new Set([
  'https://artediemcalabria.github.io',
  'https://artediemcalabria.github.io/Games-are-No-Joke-Arcade',
  'https://games-are-no-joke.web.app',
  'https://games-are-no-joke.firebaseapp.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

app.use(express.json({ limit: '2mb' }));
app.use((request, response, next) => {
  const origin = request.headers.origin || '';
  if (allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }
  response.setHeader('Vary', 'Origin');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }
  next();
});

app.get('/', (_request, response) => {
  response.json({ ok: true, service: 'Games Are No Joke Firebase AI backend' });
});

app.post('/api/coach', async (request, response) => {
  if (!isAllowedOrigin(request)) {
    response.status(403).json({ error: 'This origin is not allowed.' });
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    response.status(500).json({ error: 'AI backend is missing GEMINI_API_KEY.' });
    return;
  }

  const question = String(request.body?.question || '').trim();
  if (!question) {
    response.status(400).json({ error: 'Question is required.' });
    return;
  }
  if (question.length > 16000) {
    response.status(400).json({ error: 'Question is too long. Please make it shorter.' });
    return;
  }

  try {
    const answer = await callGeminiText(buildPrompt(request.body));
    response.json({ answer: answer || 'The coach returned an empty answer. Try a more specific question.' });
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : 'Gemini did not return an answer.' });
  }
});

app.post('/api/prototype-image', async (request, response) => {
  if (!isAllowedOrigin(request)) {
    response.status(403).json({ error: 'This origin is not allowed.' });
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    response.status(500).json({ error: 'AI backend is missing GEMINI_API_KEY.' });
    return;
  }

  const prompt = String(request.body?.prompt || '').trim();
  if (!prompt) {
    response.status(400).json({ error: 'Prototype image prompt is required.' });
    return;
  }
  if (prompt.length > 6000) {
    response.status(400).json({ error: 'Prototype image prompt is too long. Please make it shorter.' });
    return;
  }

  try {
    const imageDataUrl = await callGeminiImage(prompt);
    response.json({ imageDataUrl });
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : 'Gemini could not generate the prototype image.' });
  }
});

exports.api = onRequest(
  {
    region: 'europe-west1',
    secrets: ['GEMINI_API_KEY'],
    timeoutSeconds: 120,
    memory: '512MiB',
    invoker: 'public',
  },
  app,
);

function isAllowedOrigin(request) {
  const origin = request.headers.origin || '';
  return allowedOrigins.has(origin);
}

async function callGeminiText(prompt) {
  const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });

  if (!geminiResponse.ok) {
    const text = await geminiResponse.text();
    throw new Error(`Gemini text request failed: ${geminiResponse.status} ${text.slice(0, 180)}`);
  }

  const data = await geminiResponse.json();
  return data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n').trim();
}

async function callGeminiImage(prompt) {
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  });

  if (!geminiResponse.ok) {
    const text = await geminiResponse.text();
    throw new Error(`Gemini image request failed: ${geminiResponse.status} ${text.slice(0, 180)}`);
  }

  const data = await geminiResponse.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part) => part.inlineData?.data && part.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart) {
    throw new Error('Gemini returned no image. Add more visual prototype details.');
  }
  return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
}

function buildPrompt(body) {
  const mode = String(body.mode || 'Free question');
  const question = String(body.question || '').trim();
  const prototype = body.prototype || {};
  const gameTakeaways = body.gameTakeaways || {};
  const gameNotes = body.gameNotes || {};

  return `You are the participant AI Coach for the Erasmus+ Training Course "Games Are No Joke".
Course: 28.04-06.05.2026, Filadelfia (VV), Calabria.
Project code: 2025-1-IT03-KA153-YOU-000303546.

Audience:
- Youth workers and participants.
- Many are non-native English speakers.

Answer style:
- Simple English.
- Short sentences.
- Practical advice.
- No long theory.
- Always connect to board games, youth work, inclusion, playtesting, debriefing, or prototype design.

If mode is "gdd-import":
- Return ONLY valid JSON.
- Do not use markdown fences.
- Keep exact keys requested by the frontend.
- Improve the GDD text in Simple English.
- Fill missing fields when the source gives enough context to infer them.
- If a field is inferred or expanded by you instead of clearly present in the source, begin that field value with "AI Suggested: ".
- Use short emoji bullets only when they improve readability.

For normal coach answers, use this format:
What I notice
Try this
Example text
Debrief question
Next 3 actions

Mode: ${mode}

Participant question:
${question}

Prototype context:
${JSON.stringify(prototype, null, 2)}

Saved game takeaways:
${JSON.stringify(gameTakeaways, null, 2)}

Saved game notes:
${JSON.stringify(gameNotes, null, 2)}`;
}
