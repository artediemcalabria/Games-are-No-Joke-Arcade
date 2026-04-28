import { useMemo, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'motion/react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { courseInfo } from '../data/course';
import { useStore } from '../store/useStore';

const apiKey = process.env.GEMINI_API_KEY;

const starterPrompts = [
  'Help me turn my youth work topic into a simple board game mechanic.',
  'Give me three debrief questions for a game about polarization.',
  'How can I make my prototype more inclusive for young people with fewer opportunities?',
];

export default function GeminiCoach() {
  const { prototype } = useStore();
  const [prompt, setPrompt] = useState(starterPrompts[0]);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const prototypeContext = useMemo(() => {
    const filled = Object.entries(prototype)
      .filter(([, value]) => value.trim())
      .map(([key, value]) => `${key}: ${value.trim()}`)
      .join('\n');
    return filled || 'No prototype fields filled yet.';
  }, [prototype]);

  const askGemini = async () => {
    if (!apiKey) {
      setError('Gemini is not configured yet. Add GEMINI_API_KEY to the deployment environment.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnswer('');

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a trainer assistant for the Erasmus+ Training Course "${courseInfo.title}" (${courseInfo.code}) in ${courseInfo.venue}, ${courseInfo.dates}.

Audience: youth workers who may not be native English speakers.
Style: Simple English, short sentences, practical, warm, and non-formal education focused.
Do not write long theory. Give concrete steps, examples, and debrief questions.

Participant prototype context:
${prototypeContext}

Participant question:
${prompt}`,
      });
      setAnswer(response.text ?? 'Gemini returned an empty answer. Try a more specific question.');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Gemini request failed.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-4xl mx-auto">
      <section className="arcade-border glass-panel rounded-xl p-5 md:p-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Gemini AI</p>
            <h1 className="text-2xl md:text-3xl font-arcade text-white mt-3">Trainer Coach</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-2xl">
              Ask for help with mechanics, debrief questions, inclusion, playtesting, or your Prototype Lab draft.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-400/30 bg-black/60 p-4">
            <Bot className="w-10 h-10 text-cyan-300" />
          </div>
        </div>
      </section>

      <section className="arcade-border-pink glass-panel-pink rounded-xl p-5 md:p-6">
        <div className="grid grid-cols-1 gap-3 mb-4">
          {starterPrompts.map((starter) => (
            <button
              key={starter}
              onClick={() => setPrompt(starter)}
              className="rounded-lg border border-white/10 bg-black/40 p-3 text-left text-sm text-gray-200 hover:border-pink-400 hover:bg-pink-400/10 transition-colors"
            >
              <Sparkles className="inline w-4 h-4 text-pink-300 mr-2" />
              {starter}
            </button>
          ))}
        </div>

        <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-2" htmlFor="gemini-prompt">
          Your Question
        </label>
        <textarea
          id="gemini-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          className="w-full rounded-lg border border-white/10 bg-black/70 px-3 py-3 text-sm text-white outline-none focus:border-pink-400 resize-y"
          placeholder="Ask the trainer coach..."
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
          <p className="text-xs text-gray-500">
            The coach also reads your saved Prototype Lab fields.
          </p>
          <button
            onClick={askGemini}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center justify-center gap-2 arcade-border px-5 py-3 bg-cyan-900/40 text-cyan-200 text-xs font-bold uppercase tracking-widest disabled:opacity-40 hover:bg-cyan-500 hover:text-black transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Ask Gemini
          </button>
        </div>
      </section>

      {(answer || error) && (
        <section className={`mt-4 rounded-xl p-5 border ${error ? 'border-red-400 bg-red-950/30' : 'border-green-400 bg-green-950/20'}`}>
          <h2 className={`text-sm font-arcade mb-3 ${error ? 'text-red-300' : 'text-green-300'}`}>
            {error ? 'Connection Issue' : 'Coach Answer'}
          </h2>
          <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap">{error || answer}</p>
        </section>
      )}
    </motion.div>
  );
}
