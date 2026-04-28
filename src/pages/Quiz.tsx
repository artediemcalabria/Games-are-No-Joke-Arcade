import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpenCheck } from 'lucide-react';
import { lessons } from '../data/course';
import { useStore } from '../store/useStore';

export default function Quiz() {
  const { completedLessons, quizScores } = useStore();
  const completedChecks = lessons.filter((lesson) => quizScores[`lesson-${lesson.id}`]).length;

  return (
    <div className="flex flex-col items-center py-6 h-full pb-10 pt-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-black/40 arcade-border-green p-8 rounded-xl shadow-lg text-center flex flex-col max-w-xl w-full mx-auto">
        <BookOpenCheck className="w-14 h-14 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-arcade text-green-400 uppercase tracking-widest mb-3">Quick Checks</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          The final quiz is now inside the theory path. Each lesson has one short question and one practical takeaway.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-black/60 border border-white/10 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">{completedLessons.length}/{lessons.length}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Lessons Done</p>
          </div>
          <div className="bg-black/60 border border-white/10 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">{completedChecks}/{lessons.length}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Checks Saved</p>
          </div>
        </div>
        <Link to="/theory" className="mt-6">
          <button className="arcade-border-green px-6 py-3 bg-green-900/30 text-green-200 text-xs font-bold uppercase tracking-widest hover:bg-green-400 hover:text-black transition-colors">
            Open Theory Path
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
