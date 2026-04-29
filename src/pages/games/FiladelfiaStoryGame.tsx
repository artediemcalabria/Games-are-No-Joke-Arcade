import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, GitBranch, RotateCcw, Sparkles } from 'lucide-react';
import { gameCatalog } from '../../data/course';
import { useStore } from '../../store/useStore';

type MeterKey = 'trust' | 'clarity' | 'inclusion' | 'energy' | 'learning';
type Meters = Record<MeterKey, number>;
type SceneId = 'arrival' | 'team' | 'prototype' | 'conflict' | 'debrief' | 'showcase';
type EndingId =
  | 'inclusive-showcase'
  | 'fun-weak-learning'
  | 'perfect-bored'
  | 'conflict-returned'
  | 'collapsed-great-debrief'
  | 'shared-ownership';

type Choice = {
  id: string;
  label: string;
  text: string;
  effects: Partial<Meters>;
  flags?: string[];
  next: SceneId | 'ending';
  feedback: string;
};

type Scene = {
  id: SceneId;
  act: string;
  title: string;
  location: string;
  speaker: string;
  text: string;
  stageNote: string;
  choices: Choice[];
};

type PathStep = {
  sceneId: SceneId;
  choiceId: string;
  label: string;
  feedback: string;
};

type Ending = {
  title: string;
  summary: string;
  logic: string;
  howToReach: string;
};

const game = gameCatalog.find((item) => item.id === 'filadelfia-story')!;
const initialMeters: Meters = {
  trust: 50,
  clarity: 50,
  inclusion: 50,
  energy: 62,
  learning: 45,
};

const scenes: Scene[] = [
  {
    id: 'arrival',
    act: 'Beginning',
    title: 'The Courtyard Before Session',
    location: 'Residenza Antico Borgo',
    speaker: 'Rocco',
    text: 'The group arrives with coffee, jokes, and loud energy. One participant stands near the wall, holding an idea but saying nothing.',
    stageNote: 'First tension: energy is high, but inclusion is fragile.',
    choices: [
      {
        id: 'listen-first',
        label: 'Move closer and listen',
        text: 'Ask the quiet participant what kind of game they dream about.',
        effects: { trust: 10, inclusion: 14, learning: 6, energy: -3 },
        flags: ['listenedFirst', 'includedQuietVoice'],
        next: 'team',
        feedback: 'You changed the scene with one small action: attention became a game mechanic.',
      },
      {
        id: 'join-joke',
        label: 'Ride the loud energy',
        text: 'Join the jokes and pull everyone quickly toward the activity room.',
        effects: { energy: 10, trust: 4, inclusion: -8, learning: -2 },
        flags: ['missedQuietVoice'],
        next: 'team',
        feedback: 'The room became lively, but one player was still outside the circle.',
      },
      {
        id: 'trainer-mode',
        label: 'Take control',
        text: 'Tell everyone to stop joking and focus on the task now.',
        effects: { clarity: 8, trust: -8, energy: -5, learning: 4 },
        flags: ['controlledGroup'],
        next: 'team',
        feedback: 'Order arrived fast. Ownership became weaker.',
      },
    ],
  },
  {
    id: 'team',
    act: 'Rising Action',
    title: 'The Topic Split',
    location: 'Activity Room',
    speaker: 'Emanuel',
    text: 'Your table must choose one theme: misinformation, inclusion, polarization, or well-being. Every person thinks their theme is urgent.',
    stageNote: 'The team needs one shared direction before the prototype can breathe.',
    choices: [
      {
        id: 'vote-fast',
        label: 'Push a fast vote',
        text: 'Choose the most popular topic and start building before energy drops.',
        effects: { clarity: 8, energy: 6, trust: -4, inclusion: -7 },
        flags: ['rushedDecision'],
        next: 'prototype',
        feedback: 'Pace improved, but the losing ideas did not disappear. They went underground.',
      },
      {
        id: 'map-needs',
        label: 'Map the needs',
        text: 'Give each person one minute to explain the need behind their topic.',
        effects: { trust: 10, inclusion: 12, clarity: 8, learning: 5, energy: -4 },
        flags: ['sharedOwnership'],
        next: 'prototype',
        feedback: 'Disagreement became useful design material.',
      },
      {
        id: 'pick-cool',
        label: 'Pick the coolest idea',
        text: 'Choose the topic that sounds most fun as a game.',
        effects: { energy: 12, clarity: -5, learning: -8, trust: -3 },
        flags: ['funFirst'],
        next: 'prototype',
        feedback: 'Fun pulled the team forward, but the learning target became blurry.',
      },
    ],
  },
  {
    id: 'prototype',
    act: 'Pressure',
    title: 'The Beautiful Broken Game',
    location: 'Workshop Table',
    speaker: 'Team Mate',
    text: 'The showcase is close. The board looks empty. Someone wants perfect cards. Someone else says the core rule still does not work.',
    stageNote: 'The prototype can become playable or become decoration.',
    choices: [
      {
        id: 'test-core-loop',
        label: 'Play the ugly version',
        text: 'Use paper, tokens, and three rules. Test one round now.',
        effects: { clarity: 15, learning: 12, trust: 6, energy: -4 },
        flags: ['testedCoreLoop'],
        next: 'conflict',
        feedback: 'A small playable loop revealed more truth than a long discussion.',
      },
      {
        id: 'make-pretty',
        label: 'Polish the board',
        text: 'Spend time making cards, icons, colors, and a nicer board.',
        effects: { energy: -8, clarity: 8, learning: -8, trust: -4 },
        flags: ['overbuiltPrototype'],
        next: 'conflict',
        feedback: 'The prototype looked safer, but the rule problem stayed hidden.',
      },
      {
        id: 'copy-classic',
        label: 'Copy a known game',
        text: 'Use a familiar board game and paste the topic on top.',
        effects: { clarity: 5, energy: 8, learning: -10, inclusion: -3 },
        flags: ['reskinnedGame'],
        next: 'conflict',
        feedback: 'The structure was clear, but the message did not live inside the mechanic.',
      },
    ],
  },
  {
    id: 'conflict',
    act: 'Climax',
    title: 'The Rule Breaks',
    location: 'Courtyard Break',
    speaker: 'Tester',
    text: 'A tester stops playing and says: “This is not fair. I do not understand why I lose.” The team freezes. One person starts defending the rules.',
    stageNote: 'The conflict is not outside the game. It is feedback from the system.',
    choices: [
      {
        id: 'invite-feedback',
        label: 'Turn anger into data',
        text: 'Ask what felt unfair and write it as a design problem.',
        effects: { trust: 12, learning: 12, clarity: 8, inclusion: 5 },
        flags: ['usedFeedback'],
        next: 'debrief',
        feedback: 'The conflict became fuel for iteration.',
      },
      {
        id: 'defend-rules',
        label: 'Defend the rules',
        text: 'Explain that the rules are correct and players need to listen better.',
        effects: { trust: -16, inclusion: -8, clarity: -4, learning: -8 },
        flags: ['ignoredFeedback'],
        next: 'debrief',
        feedback: 'You protected the idea and lost information from players.',
      },
      {
        id: 'avoid-conflict',
        label: 'Change subject',
        text: 'Say the team can fix it later and move everyone away from tension.',
        effects: { energy: 5, trust: -10, learning: -4, clarity: -8 },
        flags: ['avoidedConflict'],
        next: 'debrief',
        feedback: 'The moment felt calmer, but the same problem kept moving under the surface.',
      },
    ],
  },
  {
    id: 'debrief',
    act: 'Action',
    title: 'Two Minutes With Emanuel',
    location: 'Training Room',
    speaker: 'Emanuel',
    text: 'Emanuel asks: “How does your game connect fun to learning?” Your team has two minutes before the showcase doors open.',
    stageNote: 'Now the game needs a bridge between emotion and reflection.',
    choices: [
      {
        id: 'safe-question',
        label: 'Create a debrief question',
        text: 'Write: “What did this system make you feel or notice?”',
        effects: { learning: 16, trust: 8, inclusion: 8, clarity: 4 },
        flags: ['strongDebrief'],
        next: 'showcase',
        feedback: 'The debrief connected rules, emotions, and real life.',
      },
      {
        id: 'skip-debrief',
        label: 'Trust the fun',
        text: 'Say the game is clear enough and the learning is obvious.',
        effects: { energy: 6, learning: -14, clarity: -6 },
        flags: ['weakDebrief'],
        next: 'showcase',
        feedback: 'The game stayed fun, but reflection became accidental.',
      },
      {
        id: 'lecture-ending',
        label: 'Add a final lecture',
        text: 'Prepare a long explanation after the game ends.',
        effects: { learning: 4, clarity: 5, energy: -12, trust: -3 },
        flags: ['lectureEnding'],
        next: 'showcase',
        feedback: 'The explanation helped a little. The mechanic still had to teach.',
      },
    ],
  },
  {
    id: 'showcase',
    act: 'Resolution',
    title: 'Filadelfia Game Fair',
    location: 'Final Showcase',
    speaker: 'Narrator',
    text: 'Other teams arrive. Your prototype is on the table. This is the last choice: how will you invite people into the experience?',
    stageNote: 'The ending depends on what your system made visible.',
    choices: [
      {
        id: 'facilitate-circle',
        label: 'Facilitate a reflection circle',
        text: 'Let players test, observe silently, then ask a short reflection question.',
        effects: { trust: 8, inclusion: 10, learning: 12, clarity: 5, energy: -3 },
        flags: ['reflectionCircle'],
        next: 'ending',
        feedback: 'The activity became a shared learning space.',
      },
      {
        id: 'sell-fun',
        label: 'Sell the fun',
        text: 'Pitch the prototype as the funniest game in the room.',
        effects: { energy: 12, trust: 2, learning: -6, clarity: -3 },
        flags: ['soldFun'],
        next: 'ending',
        feedback: 'Players were curious, but the learning frame became thin.',
      },
      {
        id: 'admit-rough',
        label: 'Invite co-design',
        text: 'Say this is a rough test and ask players to help improve it.',
        effects: { trust: 10, learning: 10, inclusion: 6, clarity: 2 },
        flags: ['honestPrototype'],
        next: 'ending',
        feedback: 'A rough prototype became an invitation to participate.',
      },
    ],
  },
];

const endings: Record<EndingId, Ending> = {
  'inclusive-showcase': {
    title: 'Inclusive Prototype Showcase',
    summary: 'Your game was clear, inclusive, and connected to learning. The group could play and reflect.',
    logic: 'Learning, clarity, and inclusion stayed strong at the end.',
    howToReach: 'Test the core loop, invite feedback, and use a safe debrief question.',
  },
  'fun-weak-learning': {
    title: 'Fun Game, Weak Learning',
    summary: 'Players laughed and moved fast, but the learning message did not live inside the rules.',
    logic: 'Energy became high while learning stayed low.',
    howToReach: 'Choose fun-first options, skip debrief, and sell the game mainly as entertainment.',
  },
  'perfect-bored': {
    title: 'Perfect Rules, Bored Players',
    summary: 'The prototype looked controlled and clear, but players had low ownership and little energy.',
    logic: 'The overbuilt prototype flag or high clarity with low energy triggered this ending.',
    howToReach: 'Spend too much time polishing rules and visuals before testing the core loop.',
  },
  'conflict-returned': {
    title: 'Conflict Avoided, Conflict Returned',
    summary: 'The team avoided tension, but the same problem returned during the showcase.',
    logic: 'Avoided conflict and low trust made unresolved tension visible again.',
    howToReach: 'Change subject during conflict and avoid turning disagreement into design feedback.',
  },
  'collapsed-great-debrief': {
    title: 'Prototype Collapsed, Great Debrief',
    summary: 'The game broke during play, but the group learned a lot because the debrief was honest.',
    logic: 'Ignored feedback or low clarity combined with enough learning triggered this ending.',
    howToReach: 'Ignore some feedback, then recover by asking strong reflection questions.',
  },
  'shared-ownership': {
    title: 'Shared Ownership Breakthrough',
    summary: 'The prototype became a real Erasmus+ group creation. Quiet voices shaped the final design.',
    logic: 'Listening, inclusion, shared ownership, and strong trust all stayed visible.',
    howToReach: 'Listen first, include quiet voices, map needs, and facilitate a reflection circle.',
  },
};

export default function FiladelfiaStoryGame() {
  const { completeGame, saveGameNote, updatePrototypeField } = useStore();
  const [sceneId, setSceneId] = useState<SceneId>('arrival');
  const [meters, setMeters] = useState<Meters>(initialMeters);
  const [flags, setFlags] = useState<string[]>([]);
  const [path, setPath] = useState<PathStep[]>([]);
  const [endingId, setEndingId] = useState<EndingId | null>(null);
  const [lastFeedback, setLastFeedback] = useState('Your choices will change the story system.');

  const scene = scenes.find((item) => item.id === sceneId) ?? scenes[0];
  const ending = endingId ? endings[endingId] : null;
  const chosenChoiceIds = useMemo(() => new Set(path.map((step) => step.choiceId)), [path]);

  const choose = (choice: Choice) => {
    const nextMeters = clampMeters(meters, choice.effects);
    const nextFlags = Array.from(new Set([...flags, ...(choice.flags ?? [])]));
    const nextPath = [...path, {
      sceneId: scene.id,
      choiceId: choice.id,
      label: choice.label,
      feedback: choice.feedback,
    }];

    setMeters(nextMeters);
    setFlags(nextFlags);
    setPath(nextPath);
    setLastFeedback(choice.feedback);

    if (choice.next === 'ending') {
      const result = resolveEnding(nextMeters, nextFlags);
      setEndingId(result);
      completeGame(game.id, 650, game.takeaway, `Ending: ${endings[result].title}`);
      saveGameNote(game.id, `Ending: ${endings[result].title}`);
      return;
    }

    setSceneId(choice.next);
    saveGameNote(game.id, `Story scene ${nextPath.length + 1}/${scenes.length}`);
  };

  const restart = () => {
    setSceneId('arrival');
    setMeters(initialMeters);
    setFlags([]);
    setPath([]);
    setEndingId(null);
    setLastFeedback('Your choices will change the story system.');
    saveGameNote(game.id, 'Story restarted');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-6xl mx-auto">
      <section className="arcade-border-green glass-panel-green rounded-xl p-4 md:p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">{game.subtitle}</p>
            <h1 className="text-2xl md:text-3xl font-arcade text-white mt-3">{game.title}</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-3xl">
              A narrative game inside the Games Are No Joke Erasmus+ project in Filadelfia. Read the scene, choose actions, and watch the story system change.
            </p>
          </div>
          <button onClick={restart} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold uppercase text-gray-200 hover:border-green-400">
            <RotateCcw className="w-4 h-4 inline mr-2" /> Restart
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_310px] gap-4">
        <div className="arcade-border glass-panel rounded-xl p-3 md:p-4">
          {!ending ? (
            <StoryStage scene={scene} meters={meters} lastFeedback={lastFeedback} onChoose={choose} />
          ) : (
            <EndingPanel
              ending={ending}
              endingId={endingId}
              chosenChoiceIds={chosenChoiceIds}
              flags={flags}
              path={path}
              onSendTakeaway={() => updatePrototypeField('debriefQuestion', game.prototypePrompt)}
            />
          )}
        </div>

        <aside className="space-y-4">
          <div className="arcade-border-pink glass-panel-pink rounded-xl p-4">
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Story Meters</p>
            <div className="mt-4 space-y-3">
              {(Object.keys(meters) as MeterKey[]).map((key) => (
                <Meter key={key} label={key} value={meters[key]} />
              ))}
            </div>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Path Timeline</p>
            <div className="mt-3 space-y-2">
              {path.length === 0 && <p className="text-sm text-gray-400">No choices yet.</p>}
              {path.map((step, index) => (
                <div key={`${step.sceneId}-${step.choiceId}`} className="rounded-lg border border-white/10 bg-black/45 p-3">
                  <p className="text-[10px] font-bold uppercase text-gray-500">Scene {index + 1}: {sceneTitle(step.sceneId)}</p>
                  <p className="text-sm text-white font-bold mt-1">{step.label}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mt-2">{step.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Hidden Logic</p>
            {!ending && <p className="text-sm text-gray-300 leading-relaxed mt-3">Flags stay hidden during play. At the end, the game reveals why you got your ending.</p>}
            {ending && (
              <div className="mt-3 flex flex-wrap gap-2">
                {flags.map((flag) => (
                  <span key={flag} className="rounded bg-green-400/10 border border-green-400/30 px-2 py-1 text-[10px] font-bold uppercase text-green-200">
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>
    </motion.div>
  );
}

function StoryStage({ scene, meters, lastFeedback, onChoose }: { scene: Scene; meters: Meters; lastFeedback: string; onChoose: (choice: Choice) => void }) {
  return (
    <div className="relative min-h-[660px] overflow-hidden rounded-xl border border-green-400/30 bg-slate-950 p-3 sm:p-4 flex flex-col justify-between">
      <StageBackdrop sceneId={scene.id} />
      <div className="relative z-20 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="rounded-lg border border-white/10 bg-black/70 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-green-300">{scene.act}</p>
          <p className="mt-1 text-xs font-bold text-white">{scene.location}</p>
        </div>
        <div className="grid grid-cols-5 gap-1 rounded-lg border border-white/10 bg-black/70 p-2">
          {(Object.keys(meters) as MeterKey[]).map((key) => (
            <MeterPip key={key} label={key} value={meters[key]} />
          ))}
        </div>
      </div>

      <StageCharacters sceneId={scene.id} />

      <div className="relative z-20 mt-56 rounded-xl border-2 border-green-300/60 bg-black/88 p-4 shadow-[0_0_24px_rgba(34,197,94,.22)] backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-green-300">{scene.speaker}</p>
          <p className="text-[10px] font-bold uppercase text-gray-500">{scene.stageNote}</p>
        </div>
        <h2 className="mt-2 text-xl font-arcade text-white">{scene.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-200">{scene.text}</p>
        <div className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-xs font-bold leading-relaxed text-cyan-100">
          Consequence memory: {lastFeedback}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {scene.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => onChoose(choice)}
              className="group rounded-lg border border-white/10 bg-white/[.04] p-3 text-left transition-colors hover:border-green-300 hover:bg-green-300/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-white">{choice.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-300">{choice.text}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-green-300 opacity-70 group-hover:opacity-100" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StageBackdrop({ sceneId }: { sceneId: SceneId }) {
  const backdropClass: Record<SceneId, string> = {
    arrival: 'from-cyan-950 via-slate-950 to-emerald-950',
    team: 'from-emerald-950 via-slate-950 to-cyan-950',
    prototype: 'from-yellow-950 via-slate-950 to-pink-950',
    conflict: 'from-red-950 via-slate-950 to-orange-950',
    debrief: 'from-blue-950 via-slate-950 to-emerald-950',
    showcase: 'from-fuchsia-950 via-slate-950 to-cyan-950',
  };

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${backdropClass[sceneId]}`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute left-[8%] top-[16%] h-[52%] w-[22%] rounded-t-full border-4 border-white/10 bg-black/20" />
      <div className="absolute right-[8%] top-[18%] h-[48%] w-[24%] rounded-t-full border-4 border-white/10 bg-black/20" />
      <div className="absolute left-[28%] top-[24%] h-[28%] w-[44%] rounded-xl border border-white/10 bg-black/20 shadow-[0_0_26px_rgba(255,255,255,.08)]" />
      {sceneId === 'prototype' && <PrototypeTable />}
      {sceneId === 'showcase' && <ShowcaseLights />}
      {sceneId === 'conflict' && <div className="absolute left-[20%] top-[26%] h-[38%] w-[60%] rounded-full border-2 border-red-300/30 bg-red-500/10 blur-sm" />}
    </div>
  );
}

function PrototypeTable() {
  return (
    <div className="absolute left-[32%] top-[30%] h-[30%] w-[36%] rounded-lg border-2 border-yellow-200/40 bg-yellow-900/30">
      <div className="absolute left-[14%] top-[20%] h-[28%] w-[22%] rounded border border-cyan-200/50 bg-cyan-300/20" />
      <div className="absolute left-[42%] top-[18%] h-[36%] w-[20%] rounded border border-pink-200/50 bg-pink-300/20" />
      <div className="absolute left-[66%] top-[30%] h-[24%] w-[18%] rounded border border-green-200/50 bg-green-300/20" />
    </div>
  );
}

function ShowcaseLights() {
  return (
    <>
      <div className="absolute left-[18%] top-[12%] h-20 w-20 rounded-full bg-fuchsia-400/20 blur-xl" />
      <div className="absolute right-[16%] top-[14%] h-20 w-20 rounded-full bg-cyan-400/20 blur-xl" />
    </>
  );
}

function StageCharacters({ sceneId }: { sceneId: SceneId }) {
  const characters: Record<SceneId, Array<{ label: string; x: string; y: string; tone: string }>> = {
    arrival: [
      { label: 'You', x: '18%', y: '58%', tone: 'bg-yellow-300' },
      { label: 'Quiet voice', x: '74%', y: '52%', tone: 'bg-cyan-300' },
      { label: 'Group', x: '46%', y: '48%', tone: 'bg-pink-300' },
    ],
    team: [
      { label: 'You', x: '18%', y: '58%', tone: 'bg-yellow-300' },
      { label: 'Topic A', x: '38%', y: '48%', tone: 'bg-cyan-300' },
      { label: 'Topic B', x: '58%', y: '48%', tone: 'bg-green-300' },
      { label: 'Emanuel', x: '78%', y: '55%', tone: 'bg-orange-300' },
    ],
    prototype: [
      { label: 'You', x: '24%', y: '60%', tone: 'bg-yellow-300' },
      { label: 'Builder', x: '76%', y: '58%', tone: 'bg-pink-300' },
      { label: 'Rules', x: '50%', y: '56%', tone: 'bg-cyan-300' },
    ],
    conflict: [
      { label: 'Tester', x: '26%', y: '55%', tone: 'bg-red-300' },
      { label: 'Team', x: '52%', y: '48%', tone: 'bg-pink-300' },
      { label: 'You', x: '76%', y: '58%', tone: 'bg-yellow-300' },
    ],
    debrief: [
      { label: 'Emanuel', x: '28%', y: '52%', tone: 'bg-orange-300' },
      { label: 'You', x: '50%', y: '60%', tone: 'bg-yellow-300' },
      { label: 'Team', x: '72%', y: '52%', tone: 'bg-green-300' },
    ],
    showcase: [
      { label: 'Players', x: '25%', y: '52%', tone: 'bg-cyan-300' },
      { label: 'Prototype', x: '50%', y: '58%', tone: 'bg-green-300' },
      { label: 'You', x: '75%', y: '52%', tone: 'bg-yellow-300' },
    ],
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {characters[sceneId].map((character) => (
        <div
          key={character.label}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
          style={{ left: character.x, top: character.y }}
        >
          <div className={`h-11 w-11 rounded-full border-2 border-white shadow-[0_0_14px_rgba(255,255,255,.3)] ${character.tone}`} />
          <span className="rounded bg-black/70 px-2 py-1 text-[9px] font-black uppercase text-white">{character.label}</span>
        </div>
      ))}
    </div>
  );
}

function EndingPanel({ ending, endingId, chosenChoiceIds, flags, path, onSendTakeaway }: {
  ending: Ending;
  endingId: EndingId | null;
  chosenChoiceIds: Set<string>;
  flags: string[];
  path: PathStep[];
  onSendTakeaway: () => void;
}) {
  return (
    <div>
      <div className="arcade-border-green glass-panel-green rounded-xl p-5 text-center">
        <Sparkles className="w-10 h-10 text-green-300 mx-auto" />
        <p className="text-xs text-green-300 font-bold uppercase tracking-widest mt-4">Ending Unlocked</p>
        <h2 className="text-2xl font-arcade text-white mt-3">{ending.title}</h2>
        <p className="text-sm text-gray-200 leading-relaxed mt-4">{ending.summary}</p>
        <p className="text-sm text-cyan-200 leading-relaxed mt-4">{ending.logic}</p>
        <button
          onClick={onSendTakeaway}
          className="mt-5 arcade-border-green px-5 py-3 bg-green-900/40 text-green-100 text-xs font-bold uppercase tracking-widest hover:bg-green-400 hover:text-black"
        >
          Send Takeaway to Prototype Lab
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/60 p-4">
          <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Your Path</p>
          <div className="mt-3 space-y-2">
            {path.map((step, index) => (
              <div key={`${step.sceneId}-${step.choiceId}`} className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
                <p className="text-[10px] font-bold uppercase text-cyan-200">{index + 1}. {sceneTitle(step.sceneId)}</p>
                <p className="mt-1 text-sm font-bold text-white">{step.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/60 p-4">
          <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Hidden Flags Revealed</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {flags.map((flag) => (
              <span key={flag} className="rounded bg-green-400/10 border border-green-400/30 px-2 py-1 text-[10px] font-bold uppercase text-green-200">
                {flag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <LogicDiagram chosenChoiceIds={chosenChoiceIds} endingId={endingId} />
    </div>
  );
}

function MeterPip({ label, value }: { key?: MeterKey; label: MeterKey; value: number }) {
  const color = value >= 70 ? 'bg-green-300' : value >= 45 ? 'bg-cyan-300' : 'bg-red-300';
  return (
    <div className="w-10 text-center">
      <p className="text-[8px] font-black uppercase text-gray-400">{label[0]}</p>
      <div className="mt-1 h-8 rounded border border-white/10 bg-black/50 flex items-end overflow-hidden">
        <div className={`w-full ${color}`} style={{ height: `${value}%` }} />
      </div>
    </div>
  );
}

function Meter({ label, value }: { key?: MeterKey; label: MeterKey; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
        <span>{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-gray-900 overflow-hidden">
        <div className="h-full bg-green-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function LogicDiagram({ chosenChoiceIds, endingId }: { chosenChoiceIds: Set<string>; endingId: EndingId | null }) {
  return (
    <div className="mt-5 bg-black/60 border border-white/10 rounded-xl p-4">
      <h3 className="text-sm font-arcade text-green-300 flex items-center gap-2">
        <GitBranch className="w-5 h-5" /> Full Branching Map
      </h3>
      <div className="mt-4 space-y-4">
        {scenes.map((scene) => (
          <div key={scene.id} className="rounded-lg border border-white/10 bg-black/45 p-3">
            <p className="text-[10px] font-bold uppercase text-gray-500">{scene.act}: {scene.title}</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              {scene.choices.map((choice) => {
                const chosen = chosenChoiceIds.has(choice.id);
                return (
                  <div key={choice.id} className={`rounded border p-2 ${chosen ? 'border-green-300 bg-green-300/10' : 'border-white/10 bg-black/40'}`}>
                    <p className={`text-xs font-bold ${chosen ? 'text-green-200' : 'text-gray-300'}`}>{choice.label}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Next: {choice.next === 'ending' ? 'Ending logic' : sceneTitle(choice.next)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-arcade text-cyan-300 mt-6">Other Endings</h3>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {(Object.entries(endings) as Array<[EndingId, Ending]>).map(([id, ending]) => (
          <div key={id} className={`rounded-lg border p-3 ${id === endingId ? 'border-green-300 bg-green-300/10' : 'border-white/10 bg-black/45'}`}>
            <p className="text-sm text-white font-bold">{ending.title}</p>
            <p className="text-xs text-gray-300 leading-relaxed mt-2">{ending.howToReach}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function resolveEnding(meters: Meters, flags: string[]): EndingId {
  const has = (flag: string) => flags.includes(flag);
  if ((has('listenedFirst') || has('includedQuietVoice')) && has('sharedOwnership') && meters.trust >= 68 && meters.inclusion >= 68) {
    return 'shared-ownership';
  }
  if (has('avoidedConflict') && meters.trust < 55) return 'conflict-returned';
  if (has('overbuiltPrototype') || (meters.clarity >= 78 && meters.energy < 48)) return 'perfect-bored';
  if (has('ignoredFeedback') || (meters.clarity < 45 && meters.learning >= 58)) return 'collapsed-great-debrief';
  if (meters.energy >= 72 && meters.learning < 58) return 'fun-weak-learning';
  return 'inclusive-showcase';
}

function clampMeters(current: Meters, effects: Partial<Meters>) {
  return (Object.keys(current) as MeterKey[]).reduce((next, key) => ({
    ...next,
    [key]: clamp((current[key] ?? 0) + (effects[key] ?? 0)),
  }), {} as Meters);
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function sceneTitle(id: SceneId) {
  return scenes.find((scene) => scene.id === id)?.title ?? id;
}
