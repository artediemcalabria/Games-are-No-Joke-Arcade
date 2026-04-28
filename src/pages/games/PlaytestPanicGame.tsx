import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { useStore } from '../../store/useStore';

const complaints = [
  {
    quote: 'I do not understand what I can do.',
    fix: 'clarity',
    lesson: 'Write the next action on the table, card, or board.',
  },
  {
    quote: 'The same player wins every time.',
    fix: 'balance',
    lesson: 'Change resources, turn order, or catch-up rules.',
  },
  {
    quote: 'I am waiting too long for my turn.',
    fix: 'flow',
    lesson: 'Reduce downtime with simultaneous choices or shorter turns.',
  },
  {
    quote: 'This character feels like a stereotype.',
    fix: 'inclusion',
    lesson: 'Review language, roles, and power with the target group.',
  },
  {
    quote: 'The game is fun, but I do not see the learning point.',
    fix: 'debrief',
    lesson: 'Add reflection prompts and connect actions to real life.',
  },
];

const fixes = [
  { id: 'clarity', label: 'Clarify Rules', color: 'text-cyan-300' },
  { id: 'balance', label: 'Balance Power', color: 'text-pink-300' },
  { id: 'flow', label: 'Speed Up Flow', color: 'text-yellow-300' },
  { id: 'inclusion', label: 'Check Inclusion', color: 'text-green-300' },
  { id: 'debrief', label: 'Add Debrief', color: 'text-purple-300' },
];

export default function PlaytestPanicGame() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [tokens, setTokens] = useState(7);
  const [fixed, setFixed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [lastLesson, setLastLesson] = useState('');
  const [finished, setFinished] = useState(false);
  const { completeGame } = useStore();
  const navigate = useNavigate();
  const complaint = complaints[roundIndex];
  const quality = useMemo(() => Math.max(0, fixed * 20 - mistakes * 10 + tokens * 5), [fixed, mistakes, tokens]);

  const applyFix = (fixId: string) => {
    const correct = fixId === complaint.fix;
    const nextFixed = correct ? fixed + 1 : fixed;
    const nextMistakes = correct ? mistakes : mistakes + 1;
    const nextTokens = tokens - 1;
    setFixed(nextFixed);
    setMistakes(nextMistakes);
    setTokens(nextTokens);
    setLastLesson(correct ? complaint.lesson : 'That fix can help later, but it does not solve this tester problem.');

    if (roundIndex === complaints.length - 1 || nextTokens <= 0) {
      setFinished(true);
      completeGame('playtest-panic', Math.max(100, nextFixed * 70 - nextMistakes * 20 + nextTokens * 10));
      if (nextFixed >= 4) confetti({ particleCount: 140, spread: 75, origin: { y: 0.65 } });
      return;
    }

    setRoundIndex((current) => current + 1);
  };

  const reset = () => {
    setRoundIndex(0);
    setTokens(7);
    setFixed(0);
    setMistakes(0);
    setLastLesson('');
    setFinished(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-4xl mx-auto">
      <section className="arcade-border-green glass-panel-green rounded-xl p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Prototype Fixer</p>
            <h1 className="text-2xl font-arcade text-white mt-2">Playtest Panic</h1>
            <p className="text-sm text-gray-300 mt-3">Testers are confused. Spend fix tokens before the showcase.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-black/60 border border-white/10 rounded-lg p-3">
              <p className="text-xl font-bold text-white">{tokens}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase">Tokens</p>
            </div>
            <div className="bg-black/60 border border-white/10 rounded-lg p-3">
              <p className="text-xl font-bold text-white">{fixed}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase">Fixed</p>
            </div>
            <div className="bg-black/60 border border-white/10 rounded-lg p-3">
              <p className="text-xl font-bold text-white">{quality}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase">Quality</p>
            </div>
          </div>
        </div>
      </section>

      {!finished ? (
        <section className="arcade-border-pink glass-panel-pink rounded-xl p-5">
          <div className="bg-black/60 border border-pink-500/30 rounded-xl p-5 text-center">
            <AlertTriangle className="w-10 h-10 text-yellow-300 mx-auto mb-3" />
            <p className="text-xs text-gray-500 font-bold uppercase">Tester says</p>
            <h2 className="text-2xl text-white font-black mt-3 leading-tight">"{complaint.quote}"</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
            {fixes.map((fix) => (
              <button
                key={fix.id}
                onClick={() => applyFix(fix.id)}
                className="min-h-[110px] rounded-xl border border-white/10 bg-black/50 p-4 hover:border-green-400 hover:bg-green-400/10 transition-colors"
              >
                <Wrench className={`w-6 h-6 mx-auto ${fix.color}`} />
                <span className="block text-sm text-white font-bold mt-3">{fix.label}</span>
              </button>
            ))}
          </div>

          {lastLesson && <p className="text-sm text-green-300 font-bold mt-5">{lastLesson}</p>}
        </section>
      ) : (
        <section className="arcade-border glass-panel rounded-xl p-6 text-center">
          <CheckCircle2 className="w-14 h-14 text-cyan-300 mx-auto mb-4" />
          <h2 className="text-2xl font-arcade text-cyan-300">Prototype Tested</h2>
          <p className="text-gray-300 leading-relaxed mt-4 max-w-xl mx-auto">
            You solved {fixed}/{complaints.length} tester problems. Takeaway: do not wait for a perfect game. Test early, listen, and improve one thing at a time.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <button onClick={reset} className="px-5 py-3 border border-cyan-400 text-cyan-300 font-bold uppercase hover:bg-cyan-400 hover:text-black transition-colors">
              Play Again
            </button>
            <button onClick={() => navigate('/arcade')} className="px-5 py-3 border border-white/20 text-white font-bold uppercase hover:bg-white hover:text-black transition-colors">
              Return to Arcade
            </button>
          </div>
        </section>
      )}
    </motion.div>
  );
}
