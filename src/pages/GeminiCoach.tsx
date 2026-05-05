import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Bot, CheckCircle2, Clipboard, ClipboardList, History, Loader2, MessageSquareText, RotateCcw, Save, Send, Sparkles, Wand2 } from 'lucide-react';
import { courseInfo, gameCatalog, prototypeSteps } from '../data/course';
import { useStore } from '../store/useStore';

type CoachModeId = 'prototype' | 'debrief' | 'inclusion' | 'rules' | 'playtest' | 'simple-english';

type CoachMode = {
  id: CoachModeId;
  title: string;
  prompt: string;
  focusField: string;
  icon: typeof Wand2;
};

const endpoint = normalizeAiEndpoint(import.meta.env.VITE_AI_COACH_ENDPOINT, '/api/coach');
const healthEndpoint = endpoint ? endpoint.replace(/\/api\/coach$/, '/api/health') : '';

const coachModes: CoachMode[] = [
  {
    id: 'prototype',
    title: 'Improve My Prototype',
    prompt: 'My game has a topic but no clear mechanic. Help me make one simple playable loop.',
    focusField: 'gameplayMechanics',
    icon: Wand2,
  },
  {
    id: 'debrief',
    title: 'Create Debrief Questions',
    prompt: 'I need 3 debrief questions that connect my game to real life and youth work.',
    focusField: 'debriefQuestion',
    icon: MessageSquareText,
  },
  {
    id: 'inclusion',
    title: 'Check Inclusion',
    prompt: 'Check if my prototype includes quiet participants and young people with fewer opportunities.',
    focusField: 'obstacles',
    icon: CheckCircle2,
  },
  {
    id: 'rules',
    title: 'Fix My Rules',
    prompt: 'Players do not understand the rules. Help me rewrite them in simple English.',
    focusField: 'interface',
    icon: ClipboardList,
  },
  {
    id: 'playtest',
    title: 'Prepare a Playtest',
    prompt: 'Help me prepare a 10-minute playtest plan and what feedback to collect.',
    focusField: 'playtestPlan',
    icon: History,
  },
  {
    id: 'simple-english',
    title: 'Simplify My English',
    prompt: 'Rewrite my prototype idea in simple English for non-native speakers.',
    focusField: 'executiveSummary',
    icon: Sparkles,
  },
];

function normalizeAiEndpoint(value: string | undefined, fallback: string) {
  const endpoint = String(value || '').trim();
  if (!endpoint) return import.meta.env.DEV ? '' : fallback;
  if (endpoint.includes('your-worker') || endpoint.includes('your-account') || endpoint.includes('example.com')) {
    return import.meta.env.DEV ? '' : fallback;
  }
  return endpoint;
}

export default function GeminiCoach() {
  const {
    prototype,
    gameTakeaways,
    gameNotes,
    coachHistory,
    coachNotes,
    disabledPrototypeFields,
    saveCoachSession,
    saveCoachNote,
    clearCoachHistory,
    updatePrototypeField,
  } = useStore();
  const [selectedModeId, setSelectedModeId] = useState<CoachModeId>('prototype');
  const selectedMode = coachModes.find((mode) => mode.id === selectedModeId) ?? coachModes[0];
  const [prompt, setPrompt] = useState(selectedMode.prompt);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [targetField, setTargetField] = useState(selectedMode.focusField);
  const enabledPrototypeSteps = prototypeSteps.filter((step) => !disabledPrototypeFields.includes(step.id));

  const completedPrototypeSteps = enabledPrototypeSteps.filter((step) => prototype[step.id]?.trim());
  const missingPrototypeSteps = enabledPrototypeSteps.filter((step) => !prototype[step.id]?.trim());

  const prototypeContext = useMemo(() => {
    const filled = enabledPrototypeSteps
      .map((step) => `${step.label}: ${prototype[step.id]?.trim() || '-'}`)
      .join('\n');
    return filled || 'No prototype fields filled yet.';
  }, [enabledPrototypeSteps, prototype]);

  useEffect(() => {
    let cancelled = false;

    const checkConnection = async () => {
      setConnectionStatus('checking');
      if (!healthEndpoint) {
        setConnectionStatus('error');
        return;
      }
      try {
        const response = await fetch(healthEndpoint, { headers: { Accept: 'application/json' } });
        const data = await response.json() as { ok?: boolean; geminiConfigured?: boolean; error?: string };
        if (!response.ok || !data.ok) throw new Error(data.error || `Backend health check returned ${response.status}.`);
        if (!data.geminiConfigured) throw new Error('AI backend is online, but GEMINI_API_KEY is not configured.');
        if (cancelled) return;
        setConnectionStatus('connected');
      } catch (caught) {
        if (cancelled) return;
        setConnectionStatus('error');
      }
    };

    void checkConnection();
    return () => {
      cancelled = true;
    };
  }, []);

  const chooseMode = (mode: CoachMode) => {
    setSelectedModeId(mode.id);
    setPrompt(mode.prompt);
    setTargetField(mode.focusField);
    setStatus('');
  };

  const askCoach = async (overrideQuestion?: string) => {
    const question = (overrideQuestion ?? prompt).trim();
    if (!question) return;

    if (!endpoint) {
      const fallback = ensureAnswerShape(buildFallbackAnswer(selectedMode.id, question, prototype));
      setError('AI backend is not connected on localhost. I used an offline coaching template instead.');
      setAnswer(fallback);
      saveCoachSession({
        id: createId(),
        mode: `${selectedMode.title} (offline fallback)`,
        question,
        answer: fallback,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    setIsLoading(true);
    setError('');
    setStatus('');

    try {
      const result = await askBackendCoach(endpoint, selectedMode, question, prototype, gameTakeaways, gameNotes);

      const finalAnswer = ensureAnswerShape(result);
      setAnswer(finalAnswer);
      saveCoachSession({
        id: createId(),
        mode: selectedMode.title,
        question,
        answer: finalAnswer,
        createdAt: new Date().toISOString(),
      });
      setStatus('Answer generated by Gemini coach.');
    } catch (caught) {
      const fallback = ensureAnswerShape(buildFallbackAnswer(selectedMode.id, question, prototype));
      const message = caught instanceof Error ? caught.message : 'AI Coach request failed.';
      setError(`${message}\n\nI used an offline coaching template instead.`);
      setAnswer(fallback);
      saveCoachSession({
        id: createId(),
        mode: `${selectedMode.title} (offline fallback)`,
        question,
        answer: fallback,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyAnswer = async () => {
    try {
      await navigator.clipboard?.writeText(answer);
      setStatus('Answer copied.');
    } catch {
      setStatus('Copy did not work in this browser. Select the text and copy manually.');
    }
  };

  const saveCurrentNote = () => {
    if (!answer.trim()) return;
    saveCoachNote({
      id: createId(),
      text: answer,
      createdAt: new Date().toISOString(),
    });
    setStatus('Coach note saved.');
  };

  const sendToPrototypeLab = () => {
    if (!answer.trim()) return;
    updatePrototypeField(targetField, extractUsefulSnippet(answer));
    setStatus(`Added to Prototype Lab: ${fieldLabel(targetField)}.`);
  };

  const retryShorter = () => {
    const nextPrompt = `${prompt}\n\nAnswer shorter. Use maximum 8 short lines.`;
    setPrompt(nextPrompt);
    void askCoach(nextPrompt);
  };

  const retryPractical = () => {
    const nextPrompt = `${prompt}\n\nMake it more practical. Give only concrete actions for tomorrow in the training room.`;
    setPrompt(nextPrompt);
    void askCoach(nextPrompt);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-6xl mx-auto">
      <section className="notebook-surface arcade-border glass-panel rounded-xl p-5 md:p-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">{courseInfo.title}</p>
            <h1 className="text-2xl md:text-3xl font-arcade mobile-readable-arcade text-white mt-3">Participant Coach</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-3xl">
              Use the coach for prototype mechanics, debrief questions, inclusion, rules, playtesting, and simple English.
            </p>
          </div>
          <div className="notebook-card rounded-xl border border-cyan-400/30 bg-black/60 p-4">
            <Bot className="w-10 h-10 text-cyan-300" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
        <div className="space-y-4">
          <div className="notebook-surface arcade-border-pink glass-panel-pink rounded-xl p-5">
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Guided Coach Modes</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {coachModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => chooseMode(mode)}
                  className={`notebook-list-button rounded-lg border p-4 text-left transition-colors ${
                    selectedModeId === mode.id
                      ? 'border-pink-300 bg-pink-300/15 text-white'
                      : 'border-white/10 bg-black/45 text-gray-200 hover:border-pink-400 hover:bg-pink-400/10'
                  }`}
                >
                  <mode.icon className="w-5 h-5 text-pink-300" />
                  <p className="mt-3 text-sm font-black">{mode.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-400">{mode.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="reading-panel p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Prompt Builder</p>
                <h2 className="mt-2 text-lg font-arcade text-white">{selectedMode.title}</h2>
              </div>
              <span className={`rounded border px-3 py-2 text-[10px] font-bold uppercase ${
                connectionStatus === 'connected'
                  ? 'border-green-300/40 text-green-200 bg-green-300/10'
                  : connectionStatus === 'checking'
                    ? 'border-cyan-300/40 text-cyan-200 bg-cyan-300/10'
                    : 'border-yellow-300/40 text-yellow-100 bg-yellow-300/10'
              }`}>
                {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'checking' ? 'Checking' : 'Backend issue'}
              </span>
            </div>
            <label className="mt-5 block text-xs text-gray-400 font-bold uppercase tracking-widest mb-2" htmlFor="coach-prompt">
              Your Question
            </label>
            <textarea
              id="coach-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={5}
              className="w-full rounded-lg border border-white/10 bg-black/70 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400 resize-y"
              placeholder="Ask the participant coach..."
            />

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                The coach reads Prototype Lab fields and saved game takeaways.
              </p>
              <button
                onClick={() => askCoach()}
                disabled={isLoading || !prompt.trim()}
                className="flex items-center justify-center gap-2 arcade-border px-5 py-3 bg-cyan-900/40 text-cyan-200 text-xs font-bold uppercase tracking-widest disabled:opacity-40 hover:bg-cyan-500 hover:text-black transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Ask Coach
              </button>
            </div>
          </div>

          {(answer || error) && (
            <section className={`rounded-xl p-5 border ${error ? 'border-yellow-400 bg-yellow-950/20' : 'border-green-400 bg-green-950/20'}`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h2 className={`text-sm font-arcade mb-3 ${error ? 'text-yellow-300' : 'text-green-300'}`}>
                    {error ? 'Coach Fallback Answer' : 'Coach Answer'}
                  </h2>
                  {error && <p className="mb-4 whitespace-pre-wrap text-xs leading-relaxed text-yellow-100">{error}</p>}
                  {status && <p className="mb-4 text-xs font-bold uppercase tracking-widest text-cyan-300">{status}</p>}
                </div>
              </div>
              <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap">{answer}</p>

              <div className="notebook-card mt-5 rounded-lg border border-white/10 bg-black/45 p-3">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400" htmlFor="coach-target-field">
                  Send answer to Prototype Lab field
                </label>
                <select
                  id="coach-target-field"
                  value={targetField}
                  onChange={(event) => setTargetField(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black px-3 py-3 text-sm text-white"
                >
                  {enabledPrototypeSteps.map((step) => (
                    <option key={step.id} value={step.id}>{step.label}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <ActionButton label="Copy answer" icon={<Clipboard className="w-4 h-4" />} onClick={copyAnswer} />
                <ActionButton label="Save note" icon={<Save className="w-4 h-4" />} onClick={saveCurrentNote} />
                <ActionButton label={`Add to ${fieldLabel(targetField)}`} icon={<ClipboardList className="w-4 h-4" />} onClick={sendToPrototypeLab} />
                <ActionButton label="Shorter" icon={<Sparkles className="w-4 h-4" />} onClick={retryShorter} disabled={isLoading} />
                <ActionButton label="Practical" icon={<Wand2 className="w-4 h-4" />} onClick={retryPractical} disabled={isLoading} />
              </div>
            </section>
          )}

          <section className="notebook-surface bg-black/60 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Recent Coach Sessions</p>
              <button onClick={clearCoachHistory} className="text-[10px] font-bold uppercase text-gray-500 hover:text-red-300">
                Clear
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {coachHistory.length === 0 && <p className="text-sm text-gray-400">No coach sessions yet.</p>}
              {coachHistory.slice(0, 5).map((session) => (
                <details key={session.id} className="notebook-card rounded-lg border border-white/10 bg-black/45 p-3">
                  <summary className="cursor-pointer text-sm font-bold text-white">
                    {session.mode} <span className="text-[10px] text-gray-500">{new Date(session.createdAt).toLocaleString()}</span>
                  </summary>
                  <p className="mt-3 text-xs text-cyan-200 leading-relaxed">{session.question}</p>
                  <p className="mt-3 whitespace-pre-wrap text-xs text-gray-300 leading-relaxed">{session.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <PrototypeSnapshot
            completedCount={completedPrototypeSteps.length}
            missingSteps={missingPrototypeSteps.map((step) => step.label)}
            prototypeContext={prototypeContext}
          />

          <div className="notebook-surface arcade-border-green glass-panel-green rounded-xl p-5">
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Ideas From The Games</p>
            <div className="mt-4 space-y-3">
              {gameCatalog.map((game) => (
                <div key={game.id} className="notebook-card rounded-lg border border-white/10 bg-black/45 p-3">
                  <p className="text-sm font-bold text-white">{game.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-300">{gameTakeaways[game.id] || game.prototypePrompt}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="notebook-surface bg-black/60 border border-white/10 rounded-xl p-5">
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Saved Coach Notes</p>
            <div className="mt-4 space-y-3">
              {coachNotes.length === 0 && <p className="text-sm text-gray-400">Save useful coach answers here.</p>}
              {coachNotes.slice(0, 5).map((note) => (
                <div key={note.id} className="notebook-card rounded-lg border border-white/10 bg-black/45 p-3">
                  <p className="line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-gray-300">{note.text}</p>
                  <button
                    onClick={() => updatePrototypeField(selectedMode.focusField, extractUsefulSnippet(note.text))}
                    className="mt-3 rounded border border-pink-300/30 bg-pink-300/10 px-3 py-2 text-[10px] font-bold uppercase text-pink-100 hover:bg-pink-300 hover:text-black"
                  >
                    Use in {fieldLabel(selectedMode.focusField)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </motion.div>
  );
}

function PrototypeSnapshot({ completedCount, missingSteps, prototypeContext }: { completedCount: number; missingSteps: string[]; prototypeContext: string }) {
  return (
    <div className="notebook-surface arcade-border-pink glass-panel-pink rounded-xl p-5">
      <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Prototype Snapshot</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-bold text-white">Fields completed</span>
        <span className="text-sm font-black text-pink-200">{completedCount}/{prototypeSteps.length}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded bg-pink-900/30">
        <div className="h-full bg-pink-400" style={{ width: `${Math.round((completedCount / prototypeSteps.length) * 100)}%` }} />
      </div>
      <div className="notebook-card mt-4 rounded-lg border border-white/10 bg-black/45 p-3">
        <p className="text-[10px] font-bold uppercase text-gray-500">Missing fields</p>
        <p className="mt-2 text-xs leading-relaxed text-gray-300">{missingSteps.length ? missingSteps.join(', ') : 'All prototype fields have content.'}</p>
      </div>
      <details className="notebook-card mt-3 rounded-lg border border-white/10 bg-black/45 p-3">
        <summary className="cursor-pointer text-[10px] font-bold uppercase text-cyan-300">Show context sent to coach</summary>
        <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-gray-300">{prototypeContext}</p>
      </details>
    </div>
  );
}

function ActionButton({ label, icon, onClick, disabled = false }: { label: string; icon: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/45 px-3 py-3 text-[10px] font-bold uppercase text-gray-200 hover:border-cyan-300 hover:text-cyan-200 disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  );
}

async function askBackendCoach(
  url: string,
  mode: CoachMode,
  question: string,
  prototype: Record<string, string>,
  gameTakeaways: Record<string, string>,
  gameNotes: Record<string, string>,
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: mode.title,
      question,
      prototype,
      gameTakeaways,
      gameNotes,
    }),
  });
  if (!response.ok) {
    throw new Error(await readBackendError(response, `Coach backend returned ${response.status}.`));
  }
  const data = await response.json() as { answer?: string };
  return data.answer || 'The coach returned an empty answer. Try a more specific question.';
}

async function readBackendError(response: Response, fallback: string) {
  try {
    const data = await response.clone().json() as { error?: string };
    if (data.error?.trim()) return data.error.trim();
  } catch {
    // ignore JSON parse failure
  }

  try {
    const text = (await response.text()).trim();
    if (text) return text;
  } catch {
    // ignore text read failure
  }

  return fallback;
}

function buildFallbackAnswer(mode: CoachModeId, question: string, prototype: Record<string, string>) {
  const topic = (prototype.gameTitle || prototype.topic)?.trim() || 'your topic';
  const mechanic = (prototype.gameplayMechanics || prototype.coreMechanic)?.trim();
  const learningGoal = prototype.learningGoal?.trim();
  const rules = (prototype.interface || prototype.obstacles || prototype.rules)?.trim();

  if (mode === 'debrief') {
    return `**What I notice**
You need questions that connect play to real life.

**Try this**
Ask after the game, not during the game.

**Example text**
1. What choice felt important in the game?
2. When did the game feel fair or unfair?
3. What does this remind you of in youth work?

**Debrief question**
What did this game make you feel, notice, or question?

**Next 3 actions**
1. Choose one main debrief question.
2. Test it with two participants.
3. Rewrite it in simpler words.`;
  }

  if (mode === 'inclusion') {
    return `**What I notice**
Your game should give every player a reason to participate.

**Try this**
Add one rule that helps quiet players enter the action.

**Example text**
Once per round, a player can invite another player to share one idea, card, or resource.

**Debrief question**
Who had power in the game? Who was left outside?

**Next 3 actions**
1. Check if anyone waits too long.
2. Add one cooperation rule.
3. Ask a quiet tester what felt unclear.`;
  }

  if (mode === 'rules' || mode === 'simple-english') {
    return `**What I notice**
The rules need to be short and easy to test.

**Try this**
Use three rules only for the first prototype.

**Example text**
1. On your turn, choose one action.
2. Move one step or help one player.
3. After three rounds, discuss what changed.

**Debrief question**
Which rule helped the learning goal: ${learningGoal || 'your learning goal'}?

**Next 3 actions**
1. Read the rules aloud.
2. Remove words players do not need.
3. Test one round before adding more.`;
  }

  if (mode === 'playtest') {
    return `**What I notice**
Your playtest should answer one question, not prove the game is perfect.

**Try this**
Test only the core loop: ${mechanic || 'one repeated player action'}.

**Example text**
We are testing if players understand what to do on their turn.

**Debrief question**
Where did players stop, ask questions, or lose interest?

**Next 3 actions**
1. Invite 3 testers.
2. Watch silently for 10 minutes.
3. Change one rule after the test.`;
  }

  return `**What I notice**
Your prototype is about ${topic}. The game needs one repeated action players can feel.

**Try this**
Make a loop: goal -> action -> obstacle -> feedback -> next choice.

**Example text**
Players repeatedly ${mechanic || 'choose one action'} so that they can practice ${learningGoal || 'the learning goal'}.

**Debrief question**
What did the repeated action teach players about ${topic}?

**Next 3 actions**
1. Write one player goal.
2. Test one repeated action.
3. Add feedback after every turn.`;
}

function ensureAnswerShape(answer: string) {
  const required = ['**What I notice**', '**Try this**', '**Example text**', '**Debrief question**', '**Next 3 actions**'];
  if (required.every((heading) => answer.includes(heading))) return answer;
  return `**What I notice**
${answer}

**Try this**
Choose one small change and test it with real players.

**Example text**
Players make one choice, see one feedback signal, then discuss what happened.

**Debrief question**
What did this game make players feel, notice, or question?

**Next 3 actions**
1. Simplify one rule.
2. Test one round.
3. Ask players what confused them.`;
}

function extractUsefulSnippet(answer: string) {
  const cleaned = answer
    .replace(/\*\*/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !['What I notice', 'Try this', 'Example text', 'Debrief question', 'Next 3 actions'].includes(line));
  return cleaned.slice(0, 6).join('\n');
}

function fieldLabel(field: string) {
  return prototypeSteps.find((step) => step.id === field)?.label ?? field;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
