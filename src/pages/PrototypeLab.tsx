import { motion } from 'motion/react';
import { CheckCircle2, ClipboardList, Download, RotateCcw } from 'lucide-react';
import { gameCatalog, prototypeSteps } from '../data/course';
import { useStore } from '../store/useStore';

export default function PrototypeLab() {
  const { prototype, gameTakeaways, gameNotes, updatePrototypeField } = useStore();
  const completedSteps = prototypeSteps.filter((step) => prototype[step.id]?.trim()).length;
  const progressPercent = Math.round((completedSteps / prototypeSteps.length) * 100);

  const copyPrototypeCard = async () => {
    const text = prototypeSteps
      .map((step) => `${step.label}: ${prototype[step.id]?.trim() || '-'}`)
      .join('\n');
    await navigator.clipboard?.writeText(`Games Are No Joke - Prototype Card\n\n${text}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 grid grid-cols-1 lg:grid-cols-12 gap-4">
      <section className="lg:col-span-12 arcade-border-green glass-panel-green rounded-xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Prototype Lab</p>
            <h1 className="text-2xl md:text-3xl font-arcade text-white mt-3">Design Your First Game Prototype</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-3xl">
              Fill one small field at a time. Keep it simple. Your first version only needs to be clear enough to test with other participants.
            </p>
          </div>
          <div className="bg-black/60 border border-green-400/30 rounded-xl p-4 min-w-[170px]">
            <div className="flex items-center justify-between text-xs font-bold text-green-300 uppercase">
              <span>Ready</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 rounded bg-green-900/40 mt-3 overflow-hidden">
              <div className="h-full bg-green-400" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-3">{completedSteps}/{prototypeSteps.length} fields completed</p>
          </div>
        </div>
      </section>

      <section className="lg:col-span-7 space-y-3">
        {prototypeSteps.map((step, index) => {
          const isDone = Boolean(prototype[step.id]?.trim());
          return (
            <div key={step.id} className="bg-black/50 border border-white/10 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${isDone ? 'border-green-400 bg-green-400/10' : 'border-gray-700 bg-black/60'}`}>
                  {isDone ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <step.icon className="w-5 h-5 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-arcade text-white">{index + 1}. {step.label}</h2>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">{isDone ? 'Saved' : 'Draft'}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{step.prompt}</p>
                  <textarea
                    value={prototype[step.id] ?? ''}
                    onChange={(event) => updatePrototypeField(step.id, event.target.value)}
                    rows={step.id === 'rules' ? 4 : 3}
                    className="mt-3 w-full rounded-lg border border-white/10 bg-black/70 px-3 py-3 text-sm text-white outline-none focus:border-green-400 resize-y"
                    placeholder="Write in simple English..."
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <aside className="lg:col-span-5">
        <div className="sticky top-4 space-y-4">
        <div className="arcade-border-pink glass-panel-pink rounded-xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Live Output</p>
              <h2 className="text-lg font-arcade text-white mt-2">Prototype Card</h2>
            </div>
            <ClipboardList className="w-8 h-8 text-pink-400" />
          </div>

          <div className="mt-5 rounded-xl bg-white text-black p-4 space-y-3">
            <div className="border-b border-black/20 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Games Are No Joke</p>
              <h3 className="text-xl font-black uppercase leading-tight">{prototype.topic || 'Untitled prototype'}</h3>
            </div>
            {prototypeSteps.map((step) => (
              <div key={step.id}>
                <p className="text-[10px] font-black uppercase text-gray-500">{step.label}</p>
                <p className="text-sm font-semibold leading-snug whitespace-pre-wrap">{prototype[step.id]?.trim() || '-'}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={copyPrototypeCard}
              className="flex items-center justify-center gap-2 rounded-lg border border-pink-400 bg-pink-400/10 px-3 py-3 text-xs font-bold uppercase text-pink-100 hover:bg-pink-400 hover:text-black transition-colors"
            >
              <Download className="w-4 h-4" /> Copy Card
            </button>
            <button
              onClick={() => prototypeSteps.forEach((step) => updatePrototypeField(step.id, ''))}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-xs font-bold uppercase text-gray-300 hover:border-red-400 hover:text-red-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Clear Draft
            </button>
          </div>
        </div>

        <div className="arcade-border glass-panel rounded-xl p-5">
          <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Collection Takeaways</p>
          <div className="mt-4 space-y-3">
            {gameCatalog.map((game) => (
              <div key={game.id} className="rounded-lg border border-white/10 bg-black/50 p-3">
                <p className="text-sm text-white font-bold">{game.title}</p>
                <p className="text-xs text-gray-300 leading-relaxed mt-2">{gameTakeaways[game.id] || 'Play this game to unlock a design takeaway.'}</p>
                {gameNotes[game.id] && <p className="text-xs text-cyan-300 leading-relaxed mt-2">Prototype note: {gameNotes[game.id]}</p>}
              </div>
            ))}
          </div>
        </div>
        </div>
      </aside>
    </motion.div>
  );
}
