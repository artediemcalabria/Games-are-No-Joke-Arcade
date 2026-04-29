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
  title: string;
  location: string;
  text: string;
  choices: Choice[];
};

type PathStep = {
  sceneId: SceneId;
  choiceId: string;
  label: string;
  feedback: string;
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
    title: 'Late Breakfast, Loud Table',
    location: 'Residenza Antico Borgo',
    text: 'The group is joking before the first design session. One participant is quiet and outside the conversation.',
    choices: [
      {
        id: 'listen-first',
        label: 'Listen first',
        text: 'Sit near the quiet participant and ask what they hope to create.',
        effects: { trust: 10, inclusion: 14, learning: 6, energy: -3 },
        flags: ['listenedFirst', 'includedQuietVoice'],
        next: 'team',
        feedback: 'You used attention as a mechanic. The group became safer.',
      },
      {
        id: 'join-joke',
        label: 'Join the joke',
        text: 'Make the loud group laugh and move quickly to the activity.',
        effects: { energy: 10, trust: 4, inclusion: -8, learning: -2 },
        flags: ['missedQuietVoice'],
        next: 'team',
        feedback: 'Energy went up, but one voice stayed outside the game.',
      },
      {
        id: 'trainer-mode',
        label: 'Act like trainer',
        text: 'Tell everyone to focus and stop the jokes immediately.',
        effects: { clarity: 8, trust: -8, energy: -5, learning: 4 },
        flags: ['controlledGroup'],
        next: 'team',
        feedback: 'You created order, but ownership decreased.',
      },
    ],
  },
  {
    id: 'team',
    title: 'Choose the Prototype Topic',
    location: 'Activity Room',
    text: 'Your team must choose a topic: misinformation, inclusion, polarization, or well-being. People want different things.',
    choices: [
      {
        id: 'vote-fast',
        label: 'Vote fast',
        text: 'Use a quick vote and start building immediately.',
        effects: { clarity: 8, energy: 6, trust: -4, inclusion: -7 },
        flags: ['rushedDecision'],
        next: 'prototype',
        feedback: 'Fast decisions help pace, but can hide disagreement.',
      },
      {
        id: 'map-needs',
        label: 'Map needs',
        text: 'Give everyone one minute to name the need behind their topic.',
        effects: { trust: 10, inclusion: 12, clarity: 8, learning: 5, energy: -4 },
        flags: ['sharedOwnership'],
        next: 'prototype',
        feedback: 'You turned disagreement into design material.',
      },
      {
        id: 'pick-cool',
        label: 'Pick coolest idea',
        text: 'Choose the topic that sounds most fun for a game.',
        effects: { energy: 12, clarity: -5, learning: -8, trust: -3 },
        flags: ['funFirst'],
        next: 'prototype',
        feedback: 'Fun matters, but the learning link became weaker.',
      },
    ],
  },
  {
    id: 'prototype',
    title: 'Prototype Pressure',
    location: 'Workshop Table',
    text: 'The showcase is close. Your team wants a beautiful game, but the core rules are still unclear.',
    choices: [
      {
        id: 'test-core-loop',
        label: 'Test core loop',
        text: 'Play one ugly round with paper, tokens, and three rules.',
        effects: { clarity: 15, learning: 12, trust: 6, energy: -4 },
        flags: ['testedCoreLoop'],
        next: 'conflict',
        feedback: 'A small playable test answered more than a long discussion.',
      },
      {
        id: 'make-pretty',
        label: 'Make it beautiful',
        text: 'Spend time making cards, icons, and a polished board.',
        effects: { energy: -8, clarity: 8, learning: -8, trust: -4 },
        flags: ['overbuiltPrototype'],
        next: 'conflict',
        feedback: 'The prototype looked better, but weak rules stayed hidden.',
      },
      {
        id: 'copy-classic',
        label: 'Copy a classic',
        text: 'Use a familiar board game and add the project topic on top.',
        effects: { clarity: 5, energy: 8, learning: -10, inclusion: -3 },
        flags: ['reskinnedGame'],
        next: 'conflict',
        feedback: 'The structure was clear, but the message did not live inside the mechanic.',
      },
    ],
  },
  {
    id: 'conflict',
    title: 'Team Conflict',
    location: 'Courtyard Break',
    text: 'A participant says: “This game is not fair. I do not understand why I lose.” The team becomes defensive.',
    choices: [
      {
        id: 'invite-feedback',
        label: 'Invite feedback',
        text: 'Ask what felt unfair and write it as a design problem.',
        effects: { trust: 12, learning: 12, clarity: 8, inclusion: 5 },
        flags: ['usedFeedback'],
        next: 'debrief',
        feedback: 'Feedback became fuel for iteration.',
      },
      {
        id: 'defend-rules',
        label: 'Defend rules',
        text: 'Explain that the rules are correct and players need to listen better.',
        effects: { trust: -16, inclusion: -8, clarity: -4, learning: -8 },
        flags: ['ignoredFeedback'],
        next: 'debrief',
        feedback: 'You protected the idea, but lost information from players.',
      },
      {
        id: 'avoid-conflict',
        label: 'Change subject',
        text: 'Avoid tension and say the team can fix it later.',
        effects: { energy: 5, trust: -10, learning: -4, clarity: -8 },
        flags: ['avoidedConflict'],
        next: 'debrief',
        feedback: 'The room felt calmer, but the conflict stayed inside the system.',
      },
    ],
  },
  {
    id: 'debrief',
    title: 'Debrief Moment',
    location: 'Training Room',
    text: 'Emanuel asks how your game will connect fun to learning. Your team has two minutes.',
    choices: [
      {
        id: 'safe-question',
        label: 'Ask safe question',
        text: 'Write: “What did this system make you feel or notice?”',
        effects: { learning: 16, trust: 8, inclusion: 8, clarity: 4 },
        flags: ['strongDebrief'],
        next: 'showcase',
        feedback: 'The debrief connected emotions, rules, and real life.',
      },
      {
        id: 'skip-debrief',
        label: 'Skip debrief',
        text: 'Say the game is clear enough and the learning is obvious.',
        effects: { energy: 6, learning: -14, clarity: -6 },
        flags: ['weakDebrief'],
        next: 'showcase',
        feedback: 'The game stayed fun, but reflection became accidental.',
      },
      {
        id: 'lecture-ending',
        label: 'Add lecture',
        text: 'Prepare a long explanation after the game ends.',
        effects: { learning: 4, clarity: 5, energy: -12, trust: -3 },
        flags: ['lectureEnding'],
        next: 'showcase',
        feedback: 'The explanation helped a little, but the mechanic still had to teach.',
      },
    ],
  },
  {
    id: 'showcase',
    title: 'Final Showcase',
    location: 'Filadelfia Game Fair',
    text: 'Other teams arrive to play. Your team must decide how to facilitate the final test.',
    choices: [
      {
        id: 'facilitate-circle',
        label: 'Facilitate circle',
        text: 'Let players test, observe silently, then run a short reflection circle.',
        effects: { trust: 8, inclusion: 10, learning: 12, clarity: 5, energy: -3 },
        flags: ['reflectionCircle'],
        next: 'ending',
        feedback: 'The activity became a shared learning space.',
      },
      {
        id: 'sell-fun',
        label: 'Sell the fun',
        text: 'Pitch the game as the funniest prototype in the room.',
        effects: { energy: 12, trust: 2, learning: -6, clarity: -3 },
        flags: ['soldFun'],
        next: 'ending',
        feedback: 'Players were curious, but the learning frame became thin.',
      },
      {
        id: 'admit-rough',
        label: 'Admit rough edges',
        text: 'Tell players this is a test and ask them to help improve it.',
        effects: { trust: 10, learning: 10, inclusion: 6, clarity: 2 },
        flags: ['honestPrototype'],
        next: 'ending',
        feedback: 'A rough prototype became an invitation to participate.',
      },
    ],
  },
];

const endings: Record<EndingId, {
  title: string;
  summary: string;
  logic: string;
  howToReach: string;
}> = {
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

    if (choice.next === 'ending') {
      const result = resolveEnding(nextMeters, nextFlags);
      setEndingId(result);
      completeGame(game.id, 650, game.takeaway, `Ending: ${endings[result].title}`);
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
    saveGameNote(game.id, 'Story restarted');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-5xl mx-auto">
      <section className="arcade-border-green glass-panel-green rounded-xl p-4 md:p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">{game.subtitle}</p>
            <h1 className="text-2xl md:text-3xl font-arcade text-white mt-3">{game.title}</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-3xl">
              A branching story inside the Games Are No Joke Erasmus+ project in Filadelfia. Your choices change meters, hidden flags, and the final outcome.
            </p>
          </div>
          <button onClick={restart} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold uppercase text-gray-200 hover:border-green-400">
            <RotateCcw className="w-4 h-4 inline mr-2" /> Restart
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="arcade-border glass-panel rounded-xl p-4 md:p-5">
          {!ending && (
            <>
              <div className="rounded-xl border border-green-400/30 bg-green-400/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-300">{scene.location}</p>
                <h2 className="text-xl font-arcade text-white mt-3">{scene.title}</h2>
                <p className="text-sm text-gray-200 leading-relaxed mt-4">{scene.text}</p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                {scene.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => choose(choice)}
                    className="group rounded-xl border border-white/10 bg-black/50 p-4 text-left hover:border-green-400 hover:bg-green-400/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-white">{choice.label}</p>
                        <p className="text-sm text-gray-300 leading-relaxed mt-2">{choice.text}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-green-300 opacity-70 group-hover:opacity-100 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {ending && (
            <div>
              <div className="arcade-border-green glass-panel-green rounded-xl p-5 text-center">
                <Sparkles className="w-10 h-10 text-green-300 mx-auto" />
                <p className="text-xs text-green-300 font-bold uppercase tracking-widest mt-4">Ending Unlocked</p>
                <h2 className="text-2xl font-arcade text-white mt-3">{ending.title}</h2>
                <p className="text-sm text-gray-200 leading-relaxed mt-4">{ending.summary}</p>
                <p className="text-sm text-cyan-200 leading-relaxed mt-4">{ending.logic}</p>
                <button
                  onClick={() => updatePrototypeField('debriefQuestion', game.prototypePrompt)}
                  className="mt-5 arcade-border-green px-5 py-3 bg-green-900/40 text-green-100 text-xs font-bold uppercase tracking-widest hover:bg-green-400 hover:text-black"
                >
                  Send Takeaway to Prototype Lab
                </button>
              </div>

              <LogicDiagram chosenChoiceIds={chosenChoiceIds} endingId={endingId} />
            </div>
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
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Your Path</p>
            <div className="mt-3 space-y-2">
              {path.length === 0 && <p className="text-sm text-gray-400">No choices yet.</p>}
              {path.map((step, index) => (
                <div key={`${step.sceneId}-${step.choiceId}`} className="rounded-lg border border-white/10 bg-black/45 p-3">
                  <p className="text-[10px] font-bold uppercase text-gray-500">Choice {index + 1}</p>
                  <p className="text-sm text-white font-bold mt-1">{step.label}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mt-2">{step.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Hidden Logic</p>
            <p className="text-sm text-gray-300 leading-relaxed mt-3">
              Flags are hidden during play. At the end, you can see how choices created the outcome.
            </p>
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
        <GitBranch className="w-5 h-5" /> Full Logic Diagram
      </h3>
      <div className="mt-4 space-y-4">
        {scenes.map((scene) => (
          <div key={scene.id} className="rounded-lg border border-white/10 bg-black/45 p-3">
            <p className="text-[10px] font-bold uppercase text-gray-500">{scene.title}</p>
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
        {(Object.entries(endings) as Array<[EndingId, typeof endings[EndingId]]>).map(([id, ending]) => (
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
