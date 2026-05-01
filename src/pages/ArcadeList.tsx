import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Beer, Clock, Coffee, Droplets, Gamepad2, GitBranch, Globe2, Sparkles, Trophy, Users, Wine } from 'lucide-react';
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
  if (id === 'filadelfia-story') {
    return (
      <div className="rounded-xl border border-white/10 bg-black/60 min-h-[260px] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(57,255,20,.16),transparent_42%),linear-gradient(180deg,#07140c,#15051c)]" />
        <div className="absolute inset-x-6 top-7 flex items-center justify-between">
          <StoryAvatar name="Andrea" country="FR" color="bg-blue-300" />
          <GitBranch className="h-9 w-9 text-green-300" />
          <StoryAvatar name="Ivalina" country="BG" color="bg-green-300" />
        </div>
        <div className="absolute left-7 right-7 top-24 rounded-xl border border-green-300/35 bg-black/55 p-4">
          <p className="text-[10px] font-black uppercase text-green-200">Day 1 to final showcase</p>
          <p className="mt-2 text-sm font-black leading-snug text-white">One participant. One team. Many choices.</p>
        </div>
        <div className="absolute bottom-7 left-7 right-7 grid grid-cols-3 gap-2">
          {['Listen', 'Build', 'Debrief'].map((step, index) => (
            <div key={step} className="rounded-lg border border-white/10 bg-black/60 p-3 text-center">
              <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-green-300 text-xs font-black text-black">{index + 1}</span>
              <p className="mt-2 text-[9px] font-black uppercase text-gray-200">{step}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'youthpass-drop') {
    return (
      <div className="rounded-xl border border-white/10 bg-black/60 min-h-[260px] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.22),transparent_42%),linear-gradient(180deg,#041626,#160818)]" />
        <div className="absolute left-6 right-6 top-6 rounded-xl border border-cyan-300/35 bg-cyan-300/10 p-4">
          <p className="text-[10px] font-black uppercase text-cyan-100">Training week balance</p>
          <p className="mt-2 text-sm font-black leading-snug text-white">Reach YouthPass with energy, water, and smart choices.</p>
        </div>
        <div className="absolute left-8 right-8 top-32 grid grid-cols-4 gap-3">
          <ChoiceToken icon={<Droplets className="h-6 w-6" />} label="Water" tone="cyan" />
          <ChoiceToken icon={<Coffee className="h-6 w-6" />} label="Coffee" tone="yellow" />
          <ChoiceToken icon={<Beer className="h-6 w-6" />} label="Beer" tone="orange" />
          <ChoiceToken icon={<Wine className="h-6 w-6" />} label="Wine" tone="red" />
        </div>
        <div className="absolute bottom-7 left-7 right-7 rounded-xl border border-yellow-300/35 bg-black/55 p-3">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-300" />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase text-yellow-200">Certificate pieces</p>
              <div className="mt-2 flex gap-1">
                {Array.from({ length: 10 }).map((_, index) => (
                  <span key={index} className={`h-2 flex-1 rounded ${index < 6 ? 'bg-yellow-300' : 'bg-white/20'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'future-exchange') {
    return (
      <div className="rounded-xl border border-white/10 bg-black/60 min-h-[260px] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(253,224,71,.20),transparent_42%),linear-gradient(180deg,#1d1304,#06121f)]" />
        <div className="absolute left-7 right-7 top-7 flex items-center gap-3">
          <Globe2 className="h-12 w-12 shrink-0 rounded-xl border border-yellow-300/50 bg-yellow-300/15 p-2 text-yellow-200 shadow-[0_0_18px_rgba(253,224,71,.45)]" />
          <div>
            <p className="text-[10px] font-black uppercase text-yellow-200">KA152 parallel world</p>
            <p className="mt-1 text-sm font-black leading-snug text-white">Craft tools, trust, care, and impact.</p>
          </div>
        </div>
        <div className="absolute left-8 right-8 top-24 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, index) => (
            <span key={index} className={`h-8 rounded border ${index < 3 ? 'border-green-300 bg-green-300/60' : 'border-white/10 bg-black/60'}`} />
          ))}
        </div>
        <div className="absolute left-7 top-40 right-7 rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-3">
          <p className="text-[9px] font-black uppercase text-cyan-100">Resources become a project</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Paper', 'Trust', 'Voice', 'Keys', 'Cards', 'Climate'].map((token, index) => (
              <span key={token} className={`rounded border px-2 py-1 text-[9px] font-black ${index < 4 ? 'border-yellow-300 bg-yellow-300/20 text-yellow-100' : 'border-green-300 bg-green-300/20 text-green-100'}`}>
                {token}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute bottom-7 left-7 right-7 grid grid-cols-4 gap-2">
          {['Andrea', 'Slave', 'Ivalina', 'Rocco'].map((name) => (
            <div key={name} className="rounded-lg border border-white/10 bg-black/60 p-2 text-center">
              <Users className="mx-auto h-4 w-4 text-cyan-200" />
              <p className="mt-1 text-[7px] font-bold uppercase text-gray-300">{name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/60 min-h-[260px] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_45%),linear-gradient(180deg,#051722,#071019)]" />
      <div className="absolute left-6 right-6 top-6 rounded-xl border border-cyan-300/35 bg-black/55 p-4">
        <p className="text-[10px] font-black uppercase text-cyan-200">Castle Rush</p>
        <p className="mt-2 text-sm font-black leading-snug text-white">Participants are late. Rocco reminds everyone to reach the activity on time.</p>
      </div>
      <div className="absolute left-8 top-32 flex items-center gap-3">
        <div className="h-14 w-14 rounded-full border-4 border-yellow-100 bg-yellow-300 shadow-[0_0_18px_rgba(250,204,21,.65)]" />
        <div className="h-1 w-24 rounded bg-cyan-300/50" />
        <Clock className="h-12 w-12 rounded-full border-2 border-red-200 bg-red-500 p-2 text-white shadow-[0_0_18px_rgba(248,113,113,.8)]" />
        <div className="h-1 w-20 rounded bg-cyan-300/50" />
        <div className="rounded-xl border border-green-300/50 bg-green-300/15 px-4 py-3">
          <Users className="mx-auto h-7 w-7 text-green-200" />
          <p className="mt-1 text-[9px] font-black uppercase text-green-100">Activity room</p>
        </div>
      </div>
      <div className="absolute bottom-7 left-7 right-7 rounded-xl border border-red-300/35 bg-red-400/10 p-3">
        <p className="text-[9px] font-black uppercase text-red-100">Design story</p>
        <p className="mt-1 text-xs font-bold leading-relaxed text-gray-200">Can a clear route, fair pressure, and readable clocks make urgency feel fun?</p>
      </div>
    </div>
  );
}

function StoryAvatar({ name, country, color }: { name: string; country: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`mx-auto h-12 w-12 rounded-full border-4 border-white/80 ${color}`} />
      <p className="mt-2 text-[9px] font-black uppercase text-white">{name}</p>
      <p className="text-[8px] font-bold uppercase text-gray-400">{country}</p>
    </div>
  );
}

function ChoiceToken({ icon, label, tone }: { icon: ReactNode; label: string; tone: 'cyan' | 'yellow' | 'orange' | 'red' }) {
  const toneClass = {
    cyan: 'border-cyan-300/50 bg-cyan-300/15 text-cyan-100',
    yellow: 'border-yellow-300/50 bg-yellow-300/15 text-yellow-100',
    orange: 'border-orange-300/50 bg-orange-400/20 text-orange-100',
    red: 'border-red-300/50 bg-red-500/20 text-red-100',
  }[tone];
  return (
    <div className={`rounded-xl border p-3 text-center ${toneClass}`}>
      <div className="mx-auto flex justify-center">{icon}</div>
      <p className="mt-2 text-[9px] font-black uppercase">{label}</p>
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
