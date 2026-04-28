import { DragEvent, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Eye, PlayCircle, Sparkles, Wrench } from 'lucide-react';
import { gameCatalog } from '../../data/course';
import { useStore } from '../../store/useStore';
import { GameTakeawayPanel } from './GameTakeawayPanel';

const game = gameCatalog.find((item) => item.id === 'prototype-remix')!;

const problems = [
  { id: 'clarity', title: 'Confused Tester', quote: 'What can I do on my turn?', need: 'clarity' },
  { id: 'balance', title: 'Dominating Player', quote: 'I won before others understood.', need: 'balance' },
  { id: 'inclusion', title: 'Excluded Voice', quote: 'My role feels like a stereotype.', need: 'inclusion' },
  { id: 'engagement', title: 'Bored Group', quote: 'We waited too long.', need: 'engagement' },
  { id: 'learning', title: 'Lost Message', quote: 'It was fun, but what was the point?', need: 'learning' },
];

const fixes = [
  { id: 'clarity', label: 'Rule Example Card', body: 'Show the next action with one example.', color: 'border-cyan-400 text-cyan-200' },
  { id: 'balance', label: 'Catch-Up Rule', body: 'Give trailing players a useful choice.', color: 'border-pink-400 text-pink-200' },
  { id: 'inclusion', label: 'Role Review', body: 'Rewrite roles with dignity and agency.', color: 'border-green-400 text-green-200' },
  { id: 'engagement', label: 'Fast Turn Timer', body: 'Make all players act more often.', color: 'border-yellow-300 text-yellow-100' },
  { id: 'learning', label: 'Debrief Card', body: 'Ask what happened and why it matters.', color: 'border-purple-300 text-purple-100' },
];

export default function PrototypeRemixGame() {
  const { completeGame, updatePrototypeField } = useStore();
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [selectedFix, setSelectedFix] = useState<string | null>(null);
  const [tested, setTested] = useState(false);
  const [finished, setFinished] = useState(false);

  const correctCount = useMemo(
    () => problems.filter((problem) => placements[problem.id] === problem.need).length,
    [placements],
  );
  const score = correctCount * 60;
  const remainingFixes = fixes.filter((fix) => !Object.values(placements).includes(fix.id));

  const placeFix = (problemId: string, fixId: string) => {
    setPlacements((current) => {
      const cleared = Object.fromEntries(Object.entries(current).filter(([, value]) => value !== fixId));
      return { ...cleared, [problemId]: fixId };
    });
    setSelectedFix(null);
    setTested(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, problemId: string) => {
    event.preventDefault();
    const fixId = event.dataTransfer.getData('text/plain');
    if (fixId) placeFix(problemId, fixId);
  };

  const runPlaytest = () => {
    setTested(true);
    if (correctCount >= 4) {
      setFinished(true);
      completeGame(game.id, score, game.takeaway, game.prototypePrompt);
    }
  };

  const reset = () => {
    setPlacements({});
    setSelectedFix(null);
    setTested(false);
    setFinished(false);
  };

  if (finished) {
    return (
      <GameTakeawayPanel
        title={game.title}
        score={score}
        played="You watched tester behaviors, matched design fixes to problems, and ran the prototype again until it worked better."
        taught={game.takeaway}
        prototypeFieldLabel="Playtest Plan"
        prototypeOutput={game.prototypePrompt}
        onSendToPrototype={() => updatePrototypeField('playtestPlan', game.prototypePrompt)}
        onReplay={reset}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-5xl mx-auto">
      <section className="arcade-border-green glass-panel-green rounded-xl p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">{game.subtitle}</p>
            <h1 className="text-2xl md:text-3xl font-arcade text-white mt-3">{game.title}</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-2xl">{game.mechanic}</p>
          </div>
          <button onClick={runPlaytest} className="flex items-center justify-center gap-2 rounded-lg bg-green-400 px-5 py-3 text-xs font-bold uppercase text-black hover:bg-green-300">
            <PlayCircle className="w-4 h-4" /> Run Playtest
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-4">
        <div className="arcade-border glass-panel rounded-xl p-4">
          <h2 className="text-sm font-arcade text-cyan-300 mb-4">Fix Cards</h2>
          <div className="space-y-3">
            {remainingFixes.map((fix) => (
              <button
                key={fix.id}
                draggable
                onDragStart={(event) => event.dataTransfer.setData('text/plain', fix.id)}
                onClick={() => setSelectedFix(fix.id)}
                className={`w-full rounded-xl border bg-black/60 p-4 text-left ${fix.color} ${selectedFix === fix.id ? 'ring-2 ring-white' : ''}`}
              >
                <p className="text-sm font-black uppercase">{fix.label}</p>
                <p className="text-xs text-gray-400 mt-2">{fix.body}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">Drag a fix to a tester problem. On mobile, tap a fix, then tap a problem.</p>
        </div>

        <div className="arcade-border-pink glass-panel-pink rounded-xl p-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-arcade text-pink-300">Broken Prototype Board</h2>
            <div className="bg-black/60 border border-white/10 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-500 font-bold uppercase">Fixed</p>
              <p className="text-lg text-white font-black">{correctCount}/5</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {problems.map((problem) => {
              const fix = fixes.find((item) => item.id === placements[problem.id]);
              const correct = placements[problem.id] === problem.need;
              return (
                <div
                  key={problem.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, problem.id)}
                  onClick={() => selectedFix && placeFix(problem.id, selectedFix)}
                  className={`min-h-[170px] rounded-xl border-2 border-dashed p-4 transition-colors ${
                    tested && placements[problem.id]
                      ? correct
                        ? 'border-green-400 bg-green-400/10'
                        : 'border-red-400 bg-red-400/10'
                      : 'border-pink-400/30 bg-black/55'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Eye className="w-5 h-5 text-pink-300 mt-0.5" />
                    <div>
                      <p className="text-sm text-white font-black uppercase">{problem.title}</p>
                      <p className="text-xs text-gray-300 mt-2">"{problem.quote}"</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-white/10 bg-black/50 p-3">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Applied fix</p>
                    {fix ? (
                      <>
                        <p className="text-sm text-white font-bold mt-1">{fix.label}</p>
                        {tested && <p className={`text-xs font-bold mt-2 ${correct ? 'text-green-300' : 'text-red-300'}`}>{correct ? 'Good match.' : 'This does not solve the observed behavior yet.'}</p>}
                      </>
                    ) : (
                      <p className="text-xs text-gray-600 mt-2">Drop a fix card here</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {tested && correctCount < 4 && (
            <div className="mt-4 bg-yellow-400/10 border border-yellow-300/40 rounded-xl p-4">
              <p className="text-sm text-yellow-100 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Observe first, then iterate. You need at least 4 good fixes before the prototype is ready.
              </p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
