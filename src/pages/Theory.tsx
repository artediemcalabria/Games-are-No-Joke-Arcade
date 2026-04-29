import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Lightbulb, PlayCircle } from 'lucide-react';
import { lessons } from '../data/course';
import { useStore } from '../store/useStore';

export default function Theory() {
  const { completedLessons, completeLesson, saveQuizScore } = useStore();
  const [activeLessonId, setActiveLessonId] = useState(lessons[0].id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const activeLesson = lessons.find((lesson) => lesson.id === activeLessonId) ?? lessons[0];
  const selectedAnswer = answers[activeLesson.id];
  const isCorrect = selectedAnswer === activeLesson.checkpoint.answer;

  const completeActiveLesson = () => {
    completeLesson(activeLesson.id);
    saveQuizScore(`lesson-${activeLesson.id}`, isCorrect ? 10 : 5);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 grid grid-cols-1 lg:grid-cols-12 gap-4">
      <section className="lg:col-span-4 arcade-border glass-panel p-4 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-arcade text-cyan-400">Learning Models</h2>
            <p className="text-xs text-gray-400 mt-2">Simple English. Short models. Try it now.</p>
          </div>
          <span className="text-xs font-bold text-white bg-black/60 border border-cyan-400/30 rounded px-2 py-1">
            {completedLessons.length}/{lessons.length}
          </span>
        </div>

        <div className="space-y-2">
          {lessons.map((lesson, index) => {
            const done = completedLessons.includes(lesson.id);
            const isActive = lesson.id === activeLesson.id;
            return (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonId(lesson.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isActive ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-black/40 hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {done ? <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" /> : <Circle className="w-5 h-5 text-gray-500 mt-0.5" />}
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Model {index + 1}/{lessons.length}</p>
                    <p className="text-sm text-white font-bold leading-snug mt-1">{lesson.title}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="lg:col-span-8 arcade-border-pink glass-panel-pink p-5 md:p-6 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-pink-500/30 pb-5">
          <div>
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Learning Model</p>
            <h1 className="text-2xl font-arcade text-white mt-3 leading-tight">{activeLesson.title}</h1>
            <p className="text-gray-300 mt-4 leading-relaxed">{activeLesson.focus}</p>
          </div>
          <div className="shrink-0 rounded-xl bg-black/60 border border-pink-500/40 p-4 text-center">
            <activeLesson.icon className="w-8 h-8 text-pink-400 mx-auto" />
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-3">Model</p>
            <p className="text-xs text-white font-bold mt-1 max-w-[170px]">{activeLesson.model}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          {activeLesson.bullets.map((bullet) => (
            <div key={bullet} className="bg-black/50 border border-white/10 rounded-lg p-4">
              <Lightbulb className="w-5 h-5 text-yellow-300 mb-3" />
              <p className="text-sm text-gray-200 leading-relaxed">{bullet}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
            <h3 className="text-sm font-arcade text-cyan-300">Example</h3>
            <p className="text-sm text-gray-200 leading-relaxed mt-3">{activeLesson.example}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <h3 className="text-sm font-arcade text-green-300">Try It Now</h3>
            <p className="text-sm text-gray-200 leading-relaxed mt-3">{activeLesson.tryIt}</p>
          </div>
        </div>

        <div className="mt-5 bg-black/60 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-arcade text-white flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-pink-400" /> Quick Check
          </h3>
          <p className="text-sm text-gray-300 mt-3">{activeLesson.checkpoint.question}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
            {activeLesson.checkpoint.options.map((option, index) => (
              <button
                key={option}
                onClick={() => setAnswers((current) => ({ ...current, [activeLesson.id]: index }))}
                className={`rounded-lg border px-3 py-3 text-sm font-bold transition-colors ${
                  selectedAnswer === index
                    ? index === activeLesson.checkpoint.answer
                      ? 'border-green-400 bg-green-400/20 text-green-100'
                      : 'border-red-400 bg-red-400/20 text-red-100'
                    : 'border-white/10 bg-white/5 text-gray-200 hover:border-cyan-400/60'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {selectedAnswer !== undefined && (
            <p className={`mt-3 text-sm font-bold ${isCorrect ? 'text-green-300' : 'text-yellow-300'}`}>
              {isCorrect ? 'Good. This is the core idea.' : 'Almost. The best answer is about active learning and reflection.'}
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            Sources inspired: youth work games, gamification, MDA, serious game design, playtesting.
          </p>
          <button
            onClick={completeActiveLesson}
            disabled={selectedAnswer === undefined}
            className="arcade-border px-5 py-3 bg-cyan-900/40 text-cyan-200 text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-500 hover:text-black transition-colors"
          >
            Mark Lesson Done
          </button>
        </div>
      </section>
    </motion.div>
  );
}
