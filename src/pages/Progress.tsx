import { motion } from 'motion/react';
import { CheckCircle2, ClipboardList, Gamepad2, Lock, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { gameCatalog, lessons, prototypeSteps } from '../data/course';

export default function Progress() {
  const { completedLessons, completedGames, quizScores, totalScore, prototype, resetProgress } = useStore();
  const completedPrototypeSteps = prototypeSteps.filter((step) => prototype[step.id]?.trim()).length;

  const milestones = [
    ...lessons.map((lesson) => ({
      id: lesson.id,
      name: lesson.title,
      type: 'lesson',
      completed: completedLessons.includes(lesson.id),
    })),
    ...gameCatalog.map((game) => ({
      id: game.id,
      name: game.title,
      type: 'game',
      completed: completedGames.includes(game.id),
    })),
    {
      id: 'prototype-card',
      name: 'Prototype Card',
      type: 'prototype',
      completed: completedPrototypeSteps === prototypeSteps.length,
    },
  ];

  const completedCount = milestones.filter((milestone) => milestone.completed).length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);
  const highestQuizScore = Math.max(0, ...Object.values(quizScores));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 grid grid-cols-1 md:grid-cols-12 gap-4">
      <section className="md:col-span-12 arcade-border-pink glass-panel-pink p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-6">
          <div className="bg-black/60 p-4 rounded-full border-2 border-pink-500">
            <Trophy className="w-12 h-12 text-pink-500" />
          </div>
          <div>
            <h2 className="text-xl font-arcade text-pink-500 uppercase tracking-widest">Training Journey</h2>
            <p className="text-3xl font-bold text-white mt-2">{totalScore} XP</p>
            <p className="text-xs text-gray-400 mt-2">Best quick-check score: {highestQuizScore}</p>
          </div>
        </div>

        <div className="w-full md:w-1/3 bg-black/60 p-4 rounded border border-pink-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-pink-500 uppercase">Completion Rate</span>
            <span className="text-xs font-bold text-white">{progressPercent}%</span>
          </div>
          <div className="overflow-hidden h-2 text-xs flex rounded bg-pink-900/30">
            <div style={{ width: `${progressPercent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-pink-500" />
          </div>
          <p className="text-xs text-gray-400 mt-3 text-right">{completedCount} / {milestones.length} milestones</p>
        </div>
      </section>

      <section className="md:col-span-4 arcade-border glass-panel p-5 rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-arcade text-cyan-400">Theory</h3>
          <span className="text-xs font-bold text-white">{completedLessons.length}/{lessons.length}</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">Complete lessons and quick checks.</p>
      </section>

      <section className="md:col-span-4 arcade-border-pink glass-panel-pink p-5 rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-arcade text-pink-500">Arcade</h3>
          <span className="text-xs font-bold text-white">{completedGames.length}/{gameCatalog.length}</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">Play minigames and collect takeaways.</p>
      </section>

      <section className="md:col-span-4 arcade-border-green glass-panel-green p-5 rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-arcade text-green-400">Prototype</h3>
          <span className="text-xs font-bold text-white">{completedPrototypeSteps}/{prototypeSteps.length}</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">Fill the live prototype card.</p>
      </section>

      <section className="md:col-span-12 arcade-border glass-panel p-6 rounded-xl mt-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-arcade text-cyan-400">Milestone Tracker</h3>
          <span className="text-xs px-2 py-1 bg-black/50 rounded font-bold text-gray-400">{completedCount} / {milestones.length} complete</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {milestones.map((milestone) => (
            <div key={milestone.id} className={`p-4 rounded border-2 flex items-center justify-between transition-colors ${
              milestone.completed ? 'border-cyan-400 bg-cyan-900/10' : 'border-gray-800 bg-black/40'
            }`}>
              <div className="flex items-center gap-3">
                {milestone.type === 'game' && <Gamepad2 className="w-5 h-5 text-pink-400" />}
                {milestone.type === 'lesson' && <Trophy className="w-5 h-5 text-cyan-400" />}
                {milestone.type === 'prototype' && <ClipboardList className="w-5 h-5 text-green-400" />}
                <div className="flex flex-col">
                  <span className={`text-sm font-bold uppercase ${milestone.completed ? 'text-white' : 'text-gray-500'}`}>
                    {milestone.name}
                  </span>
                  <span className="text-[10px] text-gray-500 capitalize">{milestone.type}</span>
                </div>
              </div>
              {milestone.completed ? <CheckCircle2 className="w-6 h-6 text-cyan-400" /> : <Lock className="w-5 h-5 text-gray-600" />}
            </div>
          ))}
        </div>
      </section>

      <div className="md:col-span-12 text-center pt-8">
        <button onClick={resetProgress} className="text-gray-500 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors py-2 px-4 border border-transparent hover:border-red-500/30 rounded">
          Factory Reset Memory
        </button>
      </div>
    </motion.div>
  );
}
