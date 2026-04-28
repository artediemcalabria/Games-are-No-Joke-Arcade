import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Gamepad2, ShieldQuestion, Users, Wrench } from 'lucide-react';
import { gameCatalog } from '../data/course';
import { useStore } from '../store/useStore';

const icons = {
  'bubble-boss': ShieldQuestion,
  'empathy-switch': Users,
  'playtest-panic': Wrench,
};

export default function ArcadeList() {
  const { completedGames } = useStore();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 h-full flex flex-col">
      <div className="flex justify-between items-center bg-black/40 arcade-border-pink p-4 rounded-xl mb-6 shadow-lg">
        <div>
          <h2 className="text-xl font-arcade text-pink-500 uppercase tracking-widest">Training Arcade</h2>
          <p className="text-xs text-gray-400 mt-1">Play short games. Catch the design lesson.</p>
        </div>
        <Gamepad2 className="w-10 h-10 text-pink-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
        {gameCatalog.map((game, idx) => {
          const Icon = icons[game.id as keyof typeof icons];
          const isDone = completedGames.includes(game.id);
          return (
            <Link key={game.id} to={game.path}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${game.borderClass} glass-panel p-5 h-full min-h-[240px] flex flex-col justify-between group hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 bg-black/80 rounded-lg ${game.borderClass} border shadow-sm`}>
                    <Icon className={`w-7 h-7 ${game.color}`} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 bg-black/50 rounded uppercase ${isDone ? 'text-green-300' : 'text-gray-400'}`}>
                    {isDone ? 'Cleared' : `0${idx + 1}`}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{game.eyebrow}</p>
                  <h3 className="font-arcade text-base text-white group-hover:text-arcade-green transition-colors mt-3 leading-tight">{game.title}</h3>
                  <p className="text-sm text-gray-300 mt-3 font-medium leading-relaxed">{game.desc}</p>
                  <p className="text-xs text-cyan-300 mt-4 font-bold">Takeaway: {game.lesson}</p>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
