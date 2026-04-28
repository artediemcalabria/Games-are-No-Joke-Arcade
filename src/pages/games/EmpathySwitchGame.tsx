import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeftRight, HeartHandshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

const rounds = [
  {
    role: 'Youth Worker',
    need: 'Keep the group safe and open.',
    conflict: 'Two participants argue about a news story. The room becomes tense.',
    choices: [
      { text: 'Stop the topic forever.', effect: -10, feedback: 'This may feel safe, but it removes learning.' },
      { text: 'Ask each person what they need to feel safe in the discussion.', effect: 20, feedback: 'Good. Safety and voice come first.' },
      { text: 'Pick the side that sounds correct.', effect: -15, feedback: 'The group may stop trusting the process.' },
    ],
  },
  {
    role: 'Young Person',
    need: 'Be heard without being laughed at.',
    conflict: 'You share an opinion and others react with jokes.',
    choices: [
      { text: 'Leave the game and stop talking.', effect: -10, feedback: 'This shows why inclusion must be designed.' },
      { text: 'Use a role card to explain your point through the character.', effect: 20, feedback: 'Good. Roles can make hard dialogue safer.' },
      { text: 'Attack another player back.', effect: -15, feedback: 'The tension grows instead of becoming learning.' },
    ],
  },
  {
    role: 'Designer',
    need: 'Turn conflict into meaningful play.',
    conflict: 'Your prototype creates debate, but players forget the learning goal.',
    choices: [
      { text: 'Add a debrief card after each round.', effect: 20, feedback: 'Good. Reflection connects play to real life.' },
      { text: 'Add more points and louder rewards.', effect: -5, feedback: 'More points do not automatically create learning.' },
      { text: 'Make the rules longer.', effect: -10, feedback: 'Longer rules may hide the message even more.' },
    ],
  },
  {
    role: 'Community Member',
    need: 'Feel respected by people with power.',
    conflict: 'A policy decision affects you, but nobody asks your opinion.',
    choices: [
      { text: 'Create a voting mechanic with unequal information.', effect: 10, feedback: 'Interesting. Now make the inequality visible in debrief.' },
      { text: 'Create a cooperation goal where all voices unlock resources.', effect: 20, feedback: 'Strong. The mechanic rewards listening.' },
      { text: 'Let one player decide everything.', effect: -20, feedback: 'This may recreate the problem without reflection.' },
    ],
  },
];

export default function EmpathySwitchGame() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [tension, setTension] = useState(50);
  const [lastFeedback, setLastFeedback] = useState('');
  const [finished, setFinished] = useState(false);
  const { completeGame } = useStore();
  const navigate = useNavigate();
  const round = rounds[roundIndex];
  const score = useMemo(() => Math.max(0, 100 - tension), [tension]);

  const choose = (effect: number, feedback: string) => {
    const nextTension = Math.max(0, Math.min(100, tension - effect));
    setTension(nextTension);
    setLastFeedback(feedback);

    if (roundIndex === rounds.length - 1) {
      setFinished(true);
      completeGame('empathy-switch', Math.max(120, 300 - nextTension * 2));
      if (nextTension <= 45) confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } });
      return;
    }
    setRoundIndex((current) => current + 1);
  };

  const reset = () => {
    setRoundIndex(0);
    setTension(50);
    setLastFeedback('');
    setFinished(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-3xl mx-auto">
      <section className="arcade-border glass-panel rounded-xl p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Perspective Sprint</p>
            <h1 className="text-2xl font-arcade text-white mt-2">Empathy Switch</h1>
            <p className="text-sm text-gray-300 mt-3">Switch roles. Lower tension. Learn how perspective can become a game mechanic.</p>
          </div>
          <div className="bg-black/60 border border-cyan-400/30 rounded-xl p-4 min-w-[150px]">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Tension</p>
            <p className="text-3xl font-bold text-white">{tension}</p>
          </div>
        </div>
      </section>

      {!finished ? (
        <section className="arcade-border-pink glass-panel-pink rounded-xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-12 w-12 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-pink-300" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Round {roundIndex + 1}/{rounds.length}</p>
              <h2 className="text-xl font-arcade text-pink-400">{round.role}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/50 rounded-xl border border-white/10 p-4">
              <p className="text-[10px] text-cyan-300 font-bold uppercase">Hidden Need</p>
              <p className="text-lg text-white font-bold mt-2">{round.need}</p>
            </div>
            <div className="bg-black/50 rounded-xl border border-white/10 p-4">
              <p className="text-[10px] text-yellow-300 font-bold uppercase">Scene</p>
              <p className="text-sm text-gray-200 leading-relaxed mt-2">{round.conflict}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-5">
            {round.choices.map((choice) => (
              <button
                key={choice.text}
                onClick={() => choose(choice.effect, choice.feedback)}
                className="rounded-xl border border-white/10 bg-black/50 p-4 text-left hover:border-cyan-400 hover:bg-cyan-400/10 transition-colors"
              >
                <span className="text-sm font-bold text-white">{choice.text}</span>
              </button>
            ))}
          </div>

          {lastFeedback && <p className="text-sm text-green-300 font-bold mt-5">{lastFeedback}</p>}
        </section>
      ) : (
        <section className="arcade-border-green glass-panel-green rounded-xl p-6 text-center">
          <HeartHandshake className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-arcade text-green-400">Switch Complete</h2>
          <p className="text-gray-300 leading-relaxed mt-4 max-w-xl mx-auto">
            Final score: {score}. Takeaway: roles, hidden needs, and debrief questions help players understand other perspectives.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <button onClick={reset} className="px-5 py-3 border border-green-400 text-green-300 font-bold uppercase hover:bg-green-400 hover:text-black transition-colors">
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
