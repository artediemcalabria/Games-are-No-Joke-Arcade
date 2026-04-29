const allowedOrigins = new Set([
  'https://artediemcalabria.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = buildCorsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Use POST /api/coach.' }, 405, corsHeaders);
    }

    if (!allowedOrigins.has(origin)) {
      return json({ error: 'This origin is not allowed.' }, 403, corsHeaders);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: 'AI Coach backend is missing GEMINI_API_KEY.' }, 500, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400, corsHeaders);
    }

    const question = String(body.question || '').trim();
    if (!question) {
      return json({ error: 'Question is required.' }, 400, corsHeaders);
    }
    if (question.length > 1800) {
      return json({ error: 'Question is too long. Please make it shorter.' }, 400, corsHeaders);
    }

    const contents = buildPrompt(body);
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: contents }] }],
      }),
    });

    if (!geminiResponse.ok) {
      return json({ error: 'Gemini did not return an answer. Try again later.' }, 502, corsHeaders);
    }

    const data = await geminiResponse.json();
    const answer = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n').trim();
    return json({ answer: answer || 'The coach returned an empty answer. Try a more specific question.' }, 200, corsHeaders);
  },
};

function buildCorsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://artediemcalabria.github.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(payload, status, headers) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function buildPrompt(body) {
  return `You are the participant AI Coach for the Erasmus+ Training Course "Games Are No Joke".

Audience: youth workers who may not be native English speakers.
Style: Simple English. Short sentences. Practical. Warm. Non-formal education focused.
Do not write long theory.

Always answer with exactly these headings:
**What I notice**
**Try this**
**Example text**
**Debrief question**
**Next 3 actions**

Mode:
${String(body.mode || 'General coach')}

Participant prototype:
${JSON.stringify(body.prototype || {}, null, 2)}

Saved game takeaways:
${JSON.stringify(body.gameTakeaways || {}, null, 2)}

Saved game notes:
${JSON.stringify(body.gameNotes || {}, null, 2)}

Participant question:
${String(body.question || '').trim()}`;
}
