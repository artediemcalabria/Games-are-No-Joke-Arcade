import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { ComponentType } from 'react';
import {
  Clock,
  Droplets,
  Gamepad2,
  GitBranch,
  Globe2,
  MessageCircle,
  PackageCheck,
  Route,
  Sparkles,
  Trophy,
} from 'lucide-react';
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
            <h2 className="text-lg sm:text-xl md:text-2xl font-arcade mobile-readable-arcade text-pink-500 uppercase tracking-widest mt-2">Playable Design Challenges</h2>
            <p className="text-sm text-gray-300 mt-3 max-w-2xl">
              Each game teaches one design idea through action: pressure, feedback, resources, choices, or debrief.
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
          const status = takeaway ? 'Takeaway saved' : isDone ? 'Completed' : note ? 'In progress' : 'Not started';
          return (
            <Link key={game.id} to={game.path}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`${game.borderClass} glass-panel p-4 sm:p-5 min-h-[320px] grid grid-cols-1 lg:grid-cols-[0.75fr_1.25fr] gap-5 group hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden focus-within:ring-2 focus-within:ring-cyan-300`}
              >
                <GamePreview id={game.id} />

                <div className="flex flex-col justify-between gap-5">
                  <div>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Step {gameCatalog.findIndex((item) => item.id === game.id) + 1}/{gameCatalog.length} - {bestMoment(game.id)}</p>
                        <h3 className="font-arcade text-lg md:text-2xl mobile-readable-arcade text-white group-hover:text-arcade-green transition-colors mt-3 leading-tight">{game.title}</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-2">{game.subtitle}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 bg-black/50 rounded uppercase ${isDone ? 'text-green-300' : 'text-gray-400'}`}>
                        {status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <InfoLine label="What you practice" value={practiceText(game.id)} />
                      <InfoLine label="Design lesson" value={game.learningGoal} />
                      <InfoLine label="Best moment" value={bestMoment(game.id)} />
                    </div>
                  </div>

                  <div className={`rounded-lg border p-4 ${takeaway ? 'border-green-400/40 bg-green-400/10' : 'border-white/10 bg-black/40'}`}>
                    <p className="text-[10px] font-bold uppercase text-cyan-300 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Design Takeaway
                    </p>
                    <p className="text-sm text-gray-200 leading-relaxed mt-2">{takeaway || lockedTakeawayText(game.id)}</p>
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
  const previews: Record<string, {
    title: string;
    story: string;
    question: string;
    Icon: ComponentType<{ className?: string }>;
    secondary: ComponentType<{ className?: string }>;
    tone: 'cyan' | 'blue' | 'green' | 'yellow';
    tags: string[];
  }> = {
    'castle-rush': {
      title: 'Arrive on time',
      story: 'Rocco reminds the participants to cross the castle and reach Emanuel in the Activity Room.',
      question: 'Can pressure stay fair when the route is readable?',
      Icon: Route,
      secondary: Clock,
      tone: 'cyan',
      tags: ['Route', 'Clocks', 'Activity Room'],
    },
    'youthpass-drop': {
      title: 'Balance the week',
      story: 'A participant protects energy and health while collecting YouthPass pieces.',
      question: 'Can meters show consequences without lecturing?',
      Icon: Droplets,
      secondary: Trophy,
      tone: 'blue',
      tags: ['Water', 'Energy', 'YouthPass'],
    },
    'filadelfia-story': {
      title: 'One journey, many endings',
      story: 'Andrea, Slave, or Ivalina try to build a board game with the group.',
      question: 'Can choices reveal trust, inclusion, and ownership?',
      Icon: GitBranch,
      secondary: MessageCircle,
      tone: 'green',
      tags: ['Dialogue', 'Team', 'Debrief'],
    },
    'future-exchange': {
      title: 'Craft a KA152 project',
      story: 'Resources, relationships, care, and logistics become a Youth Exchange board game.',
      question: 'Can crafting make project tradeoffs visible?',
      Icon: Globe2,
      secondary: PackageCheck,
      tone: 'yellow',
      tags: ['Craft', 'Trade', 'Project'],
    },
  };

  const preview = previews[id] ?? previews['castle-rush'];
  const Icon = preview.Icon;
  const Secondary = preview.secondary;

  return (
    <div className={`game-symbol-preview game-symbol-${preview.tone} min-h-[260px] rounded-xl border p-5 relative overflow-hidden`}>
      <div className="game-symbol-orbit" />
      <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="game-symbol-icon">
            <Icon className="h-12 w-12" />
          </div>
          <div className="game-symbol-small-icon">
            <Secondary className="h-7 w-7" />
          </div>
        </div>

        <div>
          <p className="game-symbol-kicker text-[10px] font-black uppercase tracking-widest">{preview.title}</p>
          <p className="mt-3 text-lg font-black leading-snug text-white">{preview.story}</p>
        </div>

        <div className="game-symbol-question rounded-xl border p-4">
          <p className="text-[10px] font-black uppercase tracking-widest">Design question</p>
          <p className="mt-2 text-sm font-bold leading-relaxed">{preview.question}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {preview.tags.map((tag) => (
            <span key={tag} className="game-symbol-pill rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function lockedTakeawayText(id: string) {
  if (id === 'filadelfia-story') return 'Reach an ending to unlock the hidden logic and design takeaway.';
  if (id === 'youthpass-drop') return 'Collect YouthPass pieces to unlock the resource-system takeaway.';
  if (id === 'future-exchange') return 'Build the KA152 board to unlock the crafting-systems takeaway.';
  return 'Complete the fair route levels to unlock the level-design takeaway.';
}

function practiceText(id: string) {
  if (id === 'castle-rush') return 'Readable goals, fair routes, checkpoints, pickups, and predictable pressure.';
  if (id === 'youthpass-drop') return 'Meters, resource feedback, consequence loops, and healthy strategy.';
  if (id === 'future-exchange') return 'Collecting, crafting, trading, resource systems, and project assembly.';
  return 'Inclusive choices, hidden flags, social consequences, and debrief logic.';
}

function bestMoment(id: string) {
  if (id === 'castle-rush') return 'Before level design and core loops';
  if (id === 'youthpass-drop') return 'Before resource and feedback design';
  if (id === 'future-exchange') return 'Before project-design simulations';
  return 'Before debriefing and social-impact design';
}
