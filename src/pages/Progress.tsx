import { motion } from 'motion/react';
import { Bot, CheckCircle2, ClipboardList, Gamepad2, Lock, Newspaper, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { gameCatalog, lessons, prototypeSteps } from '../data/course';
import { projectReports } from '../data/reports';

export default function Progress() {
  const { completedLessons, completedGames, gameTakeaways, gameNotes, coachHistory, coachNotes, readReports, gddImports, quizScores, totalScore, prototype, disabledPrototypeFields, resetProgress } = useStore();
  const completedCatalogGames = completedGames.filter((id) => gameCatalog.some((game) => game.id === id));
  const enabledPrototypeSteps = prototypeSteps.filter((step) => !disabledPrototypeFields.includes(step.id));
  const completedPrototypeSteps = enabledPrototypeSteps.filter((step) => prototype[step.id]?.trim()).length;

  const milestoneGroups = [
    {
      title: 'Learning Models',
      type: 'lesson',
      items: lessons.map((lesson) => ({
        id: lesson.id,
        name: lesson.title,
        completed: completedLessons.includes(lesson.id),
      })),
    },
    {
      title: 'Project Reports',
      type: 'report',
      items: projectReports.map((report) => ({
        id: report.id,
        name: `${report.title} - ${report.date}`,
        completed: readReports.includes(report.id),
      })),
    },
    {
      title: 'Game Collection',
      type: 'game',
      items: gameCatalog.map((game) => ({
        id: game.id,
        name: game.title,
        completed: completedCatalogGames.includes(game.id),
      })),
    },
    {
      title: 'Prototype Lab',
      type: 'prototype',
      items: [{
        id: 'prototype-card',
        name: 'Prototype Card',
        completed: completedPrototypeSteps === enabledPrototypeSteps.length,
      }],
    },
    {
      title: 'Reflection / YouthPass',
      type: 'reflection',
      items: [
        {
          id: 'gdd-import',
          name: 'GDD Imported',
          completed: gddImports.length > 0,
        },
        {
          id: 'ai-coach',
          name: 'AI Coach Session',
          completed: coachHistory.length > 0 || coachNotes.length > 0,
        },
        {
          id: 'youthpass-reflection',
          name: 'Learning Reflection',
          completed: completedLessons.length === lessons.length && completedCatalogGames.length > 0,
        },
      ],
    },
  ];
  const milestones = milestoneGroups.flatMap((group) => group.items.map((item) => ({ ...item, type: group.type })));

  const completedCount = milestones.filter((milestone) => milestone.completed).length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);
  const highestQuizScore = Math.max(0, ...Object.values(quizScores));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 grid grid-cols-1 md:grid-cols-12 gap-4">
      <section className="notebook-surface md:col-span-12 arcade-border-pink glass-panel-pink p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-6">
          <div className="bg-black/60 p-4 rounded-full border-2 border-pink-500">
            <Trophy className="w-12 h-12 text-pink-500" />
          </div>
          <div>
            <h2 className="text-xl font-arcade text-pink-500 uppercase tracking-widest">Training Journey</h2>
            <p className="text-2xl font-bold text-white mt-2">{completedCount}/{milestones.length} outcomes ready</p>
            <p className="text-xs text-gray-400 mt-2">Learn models, play design games, build prototype, reflect.</p>
            <p className="text-xs text-gray-500 mt-1">XP: {totalScore} - Best quick-check score: {highestQuizScore}</p>
          </div>
        </div>

        <div className="notebook-card w-full md:w-1/3 bg-black/60 p-4 rounded border border-pink-500/30">
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

      <section className="notebook-surface md:col-span-4 arcade-border glass-panel p-5 rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-arcade text-cyan-400">Learning Models</h3>
          <span className="text-xs font-bold text-white">{completedLessons.length}/{lessons.length}</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">Complete short models and quick checks.</p>
      </section>

      <section className="notebook-surface md:col-span-4 arcade-border-pink glass-panel-pink p-5 rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-arcade text-pink-500">Games</h3>
          <span className="text-xs font-bold text-white">{completedCatalogGames.length}/{gameCatalog.length}</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">Play design games and unlock takeaways.</p>
      </section>

      <section className="notebook-surface md:col-span-4 arcade-border glass-panel p-5 rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-arcade text-yellow-300">Reports</h3>
          <span className="text-xs font-bold text-white">{readReports.length}/{projectReports.length}</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">Read the daily training reports.</p>
      </section>

      <section className="notebook-surface md:col-span-12 arcade-border-green glass-panel-green p-5 rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-arcade text-green-400">Prototype</h3>
          <span className="text-xs font-bold text-white">{completedPrototypeSteps}/{prototypeSteps.length}</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">Fill the live prototype card. GDD imports: {gddImports.length}</p>
      </section>

      <section className="notebook-surface md:col-span-12 bg-black/60 border border-white/10 p-5 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-arcade text-cyan-300 flex items-center gap-2"><Bot className="w-5 h-5" /> AI Coach</h3>
            <p className="text-xs text-gray-400 mt-3">Use the coach to improve prototype, rules, debrief, inclusion, and playtest plan.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="notebook-muted-card rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3">
              <p className="text-lg font-black text-white">{coachHistory.length}</p>
              <p className="text-[10px] font-bold uppercase text-cyan-200">sessions</p>
            </div>
            <div className="notebook-muted-card rounded-lg border border-green-300/20 bg-green-300/10 px-4 py-3">
              <p className="text-lg font-black text-white">{coachNotes.length}</p>
              <p className="text-[10px] font-bold uppercase text-green-200">notes</p>
            </div>
          </div>
        </div>
      </section>

      <section className="notebook-surface md:col-span-12 arcade-border glass-panel p-6 rounded-xl mt-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-arcade text-cyan-400">Milestone Tracker</h3>
          <span className="text-xs px-2 py-1 bg-black/50 rounded font-bold text-gray-400">{completedCount} / {milestones.length} complete</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {milestoneGroups.map((group) => (
            <div key={group.title} className="notebook-card rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-arcade text-white">{group.title}</h4>
                <span className="text-[10px] font-bold uppercase text-gray-500">
                  {group.items.filter((item) => item.completed).length}/{group.items.length}
                </span>
              </div>
              <div className="space-y-2">
                {group.items.map((milestone) => (
                  <div key={milestone.id} className={`p-3 rounded border flex items-center justify-between transition-colors ${
                    milestone.completed ? 'border-cyan-400 bg-cyan-900/10' : 'border-gray-800 bg-black/40'
                  }`}>
                    <div className="flex items-center gap-3">
                      {group.type === 'game' && <Gamepad2 className="w-5 h-5 text-pink-400" />}
                      {group.type === 'lesson' && <Trophy className="w-5 h-5 text-cyan-400" />}
                      {group.type === 'report' && <Newspaper className="w-5 h-5 text-yellow-300" />}
                      {group.type === 'prototype' && <ClipboardList className="w-5 h-5 text-green-400" />}
                      {group.type === 'reflection' && (milestone.id === 'ai-coach' ? <Bot className="w-5 h-5 text-cyan-400" /> : <ClipboardList className="w-5 h-5 text-green-400" />)}
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold uppercase ${milestone.completed ? 'text-white' : 'text-gray-500'}`}>
                          {milestone.name}
                        </span>
                        <span className="text-[10px] text-gray-500 capitalize">
                          {group.type === 'game' && gameTakeaways[milestone.id]
                            ? 'takeaway saved'
                            : group.type === 'game' && gameNotes[milestone.id]
                              ? gameNotes[milestone.id]
                              : group.title}
                        </span>
                      </div>
                    </div>
                    {milestone.completed ? <CheckCircle2 className="w-6 h-6 text-cyan-400" /> : <Lock className="w-5 h-5 text-gray-600" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="md:col-span-12 text-center pt-8">
        <button onClick={resetProgress} className="text-gray-500 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors py-2 px-4 border border-transparent hover:border-red-500/30 rounded">
          Reset my progress
        </button>
      </div>
    </motion.div>
  );
}
