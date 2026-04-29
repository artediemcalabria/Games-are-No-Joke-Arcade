import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Coffee, Crown, Droplets, Flame, Gamepad2, GitBranch, Sparkles, Trophy } from 'lucide-react';
import { gameCatalog } from '../data/course';
import { useStore } from '../store/useStore';

export default function ArcadeList() {
  const { completedGames, gameTakeaways, gameNotes } = useStore();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 h-full flex flex-col">
      <div className="bg-black/40 arcade-border-pink p-4 md:p-5 rounded-xl mb-6 shadow-lg">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Games Are No Joke Collection</p>
            <h2 className="text-xl md:text-2xl font-arcade text-pink-500 uppercase tracking-widest mt-2">Games Are No Joke Collection</h2>
            <p className="text-sm text-gray-300 mt-3 max-w-2xl">
              Learn models, play design games, build a prototype, then reflect on what happened.
            </p>
          </div>
          <Gamepad2 className="w-10 h-10 text-pink-400 shrink-0" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 flex-grow">
        {gameCatalog.map((game) => {
          const isDone = completedGames.includes(game.id);
          const takeaway = gameTakeaways[game.id];
          const note = gameNotes[game.id];
          const status = isDone ? 'Completed' : note ? 'In progress' : 'Not started';
          return (
            <Link key={game.id} to={game.path}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`${game.borderClass} glass-panel p-5 min-h-[360px] grid grid-cols-1 lg:grid-cols-[0.75fr_1.25fr] gap-5 group hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden`}
              >
                <GamePreview id={game.id} />

                <div className="flex flex-col justify-between gap-5">
                  <div>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{game.subtitle}</p>
                        <h3 className="font-arcade text-xl md:text-2xl text-white group-hover:text-arcade-green transition-colors mt-3 leading-tight">{game.title}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 bg-black/50 rounded uppercase ${isDone ? 'text-green-300' : 'text-gray-400'}`}>
                        {status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <InfoLine label="Inspired by" value={game.inspiration} />
                      <InfoLine label="Main mechanic" value={game.mechanic} />
                      <InfoLine label="Learning goal" value={game.learningGoal} />
                    </div>
                  </div>

                  <div className={`rounded-lg border p-4 ${takeaway ? 'border-green-400/40 bg-green-400/10' : 'border-white/10 bg-black/40'}`}>
                    <p className="text-[10px] font-bold uppercase text-cyan-300 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Design Takeaway
                    </p>
                    <p className="text-sm text-gray-200 leading-relaxed mt-2">{takeaway || 'Complete all 10 levels to unlock the design takeaway.'}</p>
                    {note && <p className="text-[10px] text-cyan-300 font-bold uppercase mt-3">{note}</p>}
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-4">{game.duration} - {game.difficulty}</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/45 border border-white/10 rounded-lg p-3">
      <p className="text-[10px] font-bold uppercase text-gray-500">{label}</p>
      <p className="text-xs text-gray-200 leading-relaxed mt-2">{value}</p>
    </div>
  );
}

function GamePreview({ id }: { id: string }) {
  if (id === 'filadelfia-story') {
    return (
      <div className="rounded-xl border border-white/10 bg-black/60 min-h-[260px] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(57,255,20,.16),transparent_45%),linear-gradient(180deg,#07140c,#12051b)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
        <GitBranch className="absolute left-7 top-7 w-12 h-12 text-green-300 rounded-xl border border-green-300/40 bg-green-300/10 p-2 shadow-[0_0_18px_rgba(57,255,20,.45)]" />
        <div className="absolute left-8 right-8 top-24 grid grid-cols-3 gap-3">
          {['Trust', 'Clarity', 'Learning'].map((meter, index) => (
            <div key={meter} className="rounded-lg border border-white/10 bg-black/60 p-2">
              <p className="text-[8px] font-bold uppercase text-gray-400">{meter}</p>
              <div className="mt-2 h-2 rounded bg-gray-900 overflow-hidden">
                <div className="h-full bg-green-300" style={{ width: `${55 + index * 12}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-8 left-8 right-8 rounded-xl border border-green-300/40 bg-green-300/10 p-4">
          <p className="text-[10px] font-black uppercase text-green-200">Ending logic unlocked</p>
          <div className="mt-3 flex justify-between gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={index} className="h-3 flex-1 rounded bg-green-300/30 border border-green-300/40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (id === 'youthpass-drop') {
    return (
      <div className="rounded-xl border border-white/10 bg-black/60 min-h-[260px] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.22),transparent_40%),linear-gradient(180deg,#041626,#17051b)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
        <Droplets className="absolute left-[18%] top-[18%] w-12 h-12 text-cyan-200 rounded-xl border border-cyan-300/50 bg-cyan-300/15 p-2 shadow-[0_0_18px_rgba(34,211,238,.55)]" />
        <Coffee className="absolute right-[20%] top-[30%] w-12 h-12 text-yellow-200 rounded-xl border border-yellow-300/50 bg-yellow-300/15 p-2" />
        <span className="absolute left-[35%] top-[48%] rounded-xl border-2 border-red-300 bg-red-500/20 px-3 py-3 text-xs font-black text-red-100 shadow-[0_0_16px_rgba(248,113,113,.5)]">VOD</span>
        <div className="absolute left-1/2 bottom-8 h-14 w-14 -translate-x-1/2 rounded-full border-4 border-white bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,.8)]" />
        <div className="absolute left-5 right-5 top-5 flex gap-1">
          {Array.from({ length: 10 }).map((_, index) => (
            <span key={index} className={`h-6 flex-1 rounded border ${index < 4 ? 'border-yellow-300 bg-yellow-300' : 'border-white/10 bg-black/60'}`} />
          ))}
        </div>
        <Trophy className="absolute right-6 bottom-7 w-9 h-9 text-yellow-300" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/60 min-h-[260px] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <div className="absolute inset-4 border-4 border-stone-500/70 rounded-lg" />
      <div className="absolute left-6 top-6 right-20 h-10 bg-stone-600/80 rounded" />
      <div className="absolute left-20 top-20 bottom-12 w-10 bg-stone-600/80 rounded" />
      <div className="absolute right-8 bottom-8 h-20 w-28 rounded-lg border-2 border-green-400 bg-green-400/15 shadow-[0_0_24px_rgba(57,255,20,.35)]" />
      <div className="absolute left-8 bottom-8 h-6 w-6 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(0,242,255,.75)]" />
      <div className="absolute right-16 bottom-14 grid grid-cols-5 gap-1">
        {Array.from({ length: 21 }).map((_, index) => (
          <span key={index} className="h-2 w-2 rounded-full bg-white/80" />
        ))}
      </div>
      <Flame className="absolute right-5 top-5 w-9 h-9 text-orange-400 animate-pulse" />
      <Crown className="absolute right-16 bottom-12 w-7 h-7 text-yellow-300" />
    </div>
  );
}
