import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Bot, ClipboardList, Gamepad2, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { courseInfo, gameCatalog, lessons, prototypeSteps } from '../data/course';

export default function Home() {
  const { totalScore, completedLessons, completedGames, prototype } = useStore();
  const assetBase = import.meta.env.BASE_URL;
  const completedCatalogGames = completedGames.filter((id) => gameCatalog.some((game) => game.id === id));
  const completedPrototypeSteps = prototypeSteps.filter((step) => prototype[step.id]?.trim()).length;
  const journeyTotal = lessons.length + gameCatalog.length + prototypeSteps.length;
  const journeyDone = completedLessons.length + completedCatalogGames.length + completedPrototypeSteps;
  const progressPercent = Math.round((journeyDone / journeyTotal) * 100);
  const nextGame = gameCatalog.find((game) => !completedCatalogGames.includes(game.id)) ?? gameCatalog[0];
  const nextModel = lessons.find((lesson) => !completedLessons.includes(lesson.id)) ?? lessons[0];
  const nextAction = completedLessons.length < lessons.length
    ? { to: '/theory', label: 'Continue Learning Models', detail: 'Learn models -> Play design games -> Build prototype -> Reflect.' }
    : completedCatalogGames.length < gameCatalog.length
      ? { to: '/arcade', label: 'Play Next Design Game', detail: 'Use games to feel the design ideas, not only read them.' }
      : completedPrototypeSteps < prototypeSteps.length
        ? { to: '/prototype', label: 'Improve Prototype Card', detail: 'Turn takeaways into your first playable prototype.' }
        : { to: '/progress', label: 'Review Your Journey', detail: 'Check your learning, games, prototype, and reflection.' };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-grow pb-10">
      <section className="md:col-span-12 overflow-hidden rounded-xl arcade-border-pink bg-black/70 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] min-h-[320px]">
          <div className="p-5 md:p-8 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-arcade-green">{courseInfo.programme}</p>
              <h2 className="text-xl sm:text-2xl md:text-4xl font-arcade mobile-readable-arcade text-white mt-4 leading-tight">{courseInfo.title}</h2>
              <p className="text-cyan-300 text-sm md:text-base font-bold mt-4 uppercase tracking-widest">{courseInfo.subtitle}</p>
              <p className="text-gray-300 text-sm leading-relaxed mt-4 max-w-2xl">
                A mobile companion for youth workers learning how to design meaningful, fun, and inclusive games during the training in {courseInfo.venue}.
              </p>
              <Link
                to={nextAction.to}
                className="mt-5 inline-flex items-center gap-3 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-cyan-100 hover:bg-cyan-400 hover:text-black transition-colors"
              >
                {nextAction.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-gray-400 mt-3">{nextAction.detail}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-pink-500/10 border border-pink-500/40 rounded-lg p-3">
                <p className="text-[10px] text-pink-300 font-bold uppercase">Dates</p>
                <p className="text-sm text-white font-bold mt-1">{courseInfo.dates}</p>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/40 rounded-lg p-3">
                <p className="text-[10px] text-cyan-300 font-bold uppercase">Project Code</p>
                <p className="text-xs text-white font-bold mt-1 break-words">{courseInfo.code}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/40 rounded-lg p-3">
                <p className="text-[10px] text-green-300 font-bold uppercase">Journey</p>
                <p className="text-sm text-white font-bold mt-1">{progressPercent}% ready</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[260px] md:min-h-full bg-black">
            <img src={`${assetBase}ganj-cover.jpeg`} alt="Games Are No Joke course cover" className="absolute inset-0 h-full w-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-black via-black/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
              <img src={`${assetBase}ganj-logo.png`} alt="" className="h-16 w-16 rounded-lg border border-white/20 bg-black/50 object-cover" />
              <span className="text-[10px] text-gray-200 font-bold uppercase text-right tracking-widest">Filadelfia (VV), Calabria</span>
            </div>
          </div>
        </div>
      </section>

      <section className="md:col-span-12 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="arcade-border-pink glass-panel-pink rounded-xl p-5">
          <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Featured Next Game</p>
          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
          <h2 className="text-lg sm:text-xl font-arcade mobile-readable-arcade text-white">{nextGame.title}</h2>
              <p className="text-sm text-gray-300 leading-relaxed mt-3 max-w-2xl">{nextGame.learningGoal}</p>
              <p className="text-xs text-pink-200 font-bold uppercase mt-3">{nextGame.duration} - {nextGame.difficulty}</p>
            </div>
            <Link
              to={nextGame.path}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-pink-400/50 bg-pink-400/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-pink-100 hover:bg-pink-400 hover:text-black transition-colors"
            >
              Play Now
              <Gamepad2 className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="arcade-border glass-panel rounded-xl p-5">
          <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Next Learning Model</p>
          <h2 className="text-base sm:text-lg font-arcade mobile-readable-arcade text-white mt-4">{nextModel.title}</h2>
          <p className="text-sm text-gray-300 leading-relaxed mt-3">{nextModel.focus}</p>
          <Link to="/theory" className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-300 hover:text-white">
            Open Models
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="md:col-span-4">
        <Link to="/theory" className="block h-full group">
          <motion.div whileHover={{ scale: 1.01 }} className="arcade-border glass-panel p-5 h-full flex flex-col justify-between gap-5">
            <div>
              <BookOpen className="w-8 h-8 text-arcade-cyan mb-4" />
              <h2 className="text-lg font-arcade text-arcade-cyan">Learning Path</h2>
              <p className="text-sm text-gray-300 leading-relaxed mt-3">
                Simple English learning models with quick checks and trainer prompts.
              </p>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-white">
              <span>{completedLessons.length}/{lessons.length} models</span>
              <ArrowRight className="w-5 h-5 text-arcade-cyan opacity-70 group-hover:opacity-100" />
            </div>
          </motion.div>
        </Link>
      </section>

      <section className="md:col-span-4">
        <Link to="/arcade" className="block h-full group">
          <motion.div whileHover={{ scale: 1.01 }} className="arcade-border-pink glass-panel-pink p-5 h-full flex flex-col justify-between gap-5">
            <div>
              <Gamepad2 className="w-8 h-8 text-pink-500 mb-4" />
              <h2 className="text-lg font-arcade text-pink-500">Game Collection</h2>
              <p className="text-sm text-gray-300 leading-relaxed mt-3">
                Play short Erasmus+ games about goals, pressure, choices, resources, and debriefing.
              </p>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-white">
              <span>{completedCatalogGames.length}/{gameCatalog.length} games</span>
              <ArrowRight className="w-5 h-5 text-pink-500 opacity-70 group-hover:opacity-100" />
            </div>
          </motion.div>
        </Link>
      </section>

      <section className="md:col-span-4">
        <Link to="/prototype" className="block h-full group">
          <motion.div whileHover={{ scale: 1.01 }} className="arcade-border-green glass-panel-green p-5 h-full flex flex-col justify-between gap-5">
            <div>
              <ClipboardList className="w-8 h-8 text-green-400 mb-4" />
              <h2 className="text-lg font-arcade text-green-400">Prototype Lab</h2>
              <p className="text-sm text-gray-300 leading-relaxed mt-3">
                Build a first paper prototype card step by step during the course.
              </p>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-white">
              <span>{completedPrototypeSteps}/{prototypeSteps.length} fields</span>
              <ArrowRight className="w-5 h-5 text-green-400 opacity-70 group-hover:opacity-100" />
            </div>
          </motion.div>
        </Link>
      </section>

      <section className="md:col-span-12 arcade-border bg-blue-900/20 p-5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-lg font-arcade text-cyan-400 flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5" /> Your Trainer Toolkit
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Read a short model, play the collection, then turn each design takeaway into a real prototype for your youth work context.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
          <div className="bg-black/60 border border-white/10 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-white">{totalScore}</p>
            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">XP</p>
          </div>
          <div className="bg-black/60 border border-white/10 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-white">{lessons.length}</p>
            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Models</p>
          </div>
          <div className="bg-black/60 border border-white/10 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-white">{gameCatalog.length}</p>
            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Games</p>
          </div>
          <Link to="/coach" className="bg-black/60 border border-cyan-400/40 rounded-lg p-3 text-center hover:bg-cyan-400/10 transition-colors">
            <Bot className="w-6 h-6 text-cyan-300 mx-auto" />
            <p className="text-[9px] text-cyan-300 font-bold uppercase mt-2">AI Coach</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
