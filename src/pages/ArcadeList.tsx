import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CircuitBoard, Gamepad2, Map, Sparkles, Wrench } from 'lucide-react';
import { gameCatalog } from '../data/course';
import { useStore } from '../store/useStore';

const icons = {
  'loop-lab': CircuitBoard,
  'village-signals': Map,
  'prototype-remix': Wrench,
};

export default function ArcadeList() {
  const { completedGames, gameTakeaways } = useStore();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 h-full flex flex-col">
      <div className="bg-black/40 arcade-border-pink p-4 md:p-5 rounded-xl mb-6 shadow-lg">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Curated Play Path</p>
            <h2 className="text-xl md:text-2xl font-arcade text-pink-500 uppercase tracking-widest mt-2">Games Are No Joke Collection</h2>
            <p className="text-sm text-gray-300 mt-3 max-w-2xl">
              Start with three playable design lessons: build a loop, manage a social system, then remix a prototype through playtesting.
            </p>
          </div>
          <Gamepad2 className="w-10 h-10 text-pink-400 shrink-0" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow">
        {gameCatalog.map((game, idx) => {
          const Icon = icons[game.id as keyof typeof icons];
          const isDone = completedGames.includes(game.id);
          const takeaway = gameTakeaways[game.id];
          return (
            <Link key={game.id} to={game.path}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${game.borderClass} glass-panel p-5 h-full min-h-[360px] flex flex-col justify-between group hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden`}
              >
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div className={`p-3 bg-black/80 rounded-lg ${game.borderClass} border shadow-sm`}>
                      <Icon className={`w-7 h-7 ${game.color}`} />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 bg-black/50 rounded uppercase ${isDone ? 'text-green-300' : 'text-gray-400'}`}>
                      {isDone ? 'Takeaway unlocked' : `Game 0${idx + 1}`}
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{game.subtitle}</p>
                  <h3 className="font-arcade text-base text-white group-hover:text-arcade-green transition-colors mt-3 leading-tight">{game.title}</h3>

                  <div className="mt-5 space-y-3">
                    <InfoLine label="Inspired by" value={game.inspiration} />
                    <InfoLine label="Main mechanic" value={game.mechanic} />
                    <InfoLine label="Learning goal" value={game.learningGoal} />
                  </div>
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 mb-3">
                    <span>{game.duration}</span>
                    <span>{game.difficulty}</span>
                  </div>
                  <div className={`rounded-lg border p-3 ${takeaway ? 'border-green-400/40 bg-green-400/10' : 'border-white/10 bg-black/40'}`}>
                    <p className="text-[10px] font-bold uppercase text-cyan-300 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Design Takeaway
                    </p>
                    <p className="text-xs text-gray-200 leading-relaxed mt-2">{takeaway || 'Play to unlock the design takeaway and send a note to Prototype Lab.'}</p>
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
    <div>
      <p className="text-[10px] font-bold uppercase text-gray-500">{label}</p>
      <p className="text-xs text-gray-200 leading-relaxed mt-1">{value}</p>
    </div>
  );
}
