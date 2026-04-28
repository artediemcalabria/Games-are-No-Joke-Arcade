import { DragEvent, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Bot, CircuitBoard, Play, Zap } from 'lucide-react';
import { gameCatalog } from '../../data/course';
import { useStore } from '../../store/useStore';
import { GameTakeawayPanel } from './GameTakeawayPanel';

const game = gameCatalog.find((item) => item.id === 'loop-lab')!;

const components = [
  { id: 'goal', label: 'Goal', hint: 'What players want', color: 'border-pink-400 text-pink-200' },
  { id: 'action', label: 'Action', hint: 'What players do', color: 'border-cyan-400 text-cyan-200' },
  { id: 'obstacle', label: 'Obstacle', hint: 'What blocks them', color: 'border-yellow-300 text-yellow-100' },
  { id: 'feedback', label: 'Feedback', hint: 'What changes', color: 'border-green-400 text-green-200' },
  { id: 'reward', label: 'Reward', hint: 'Why continue', color: 'border-purple-300 text-purple-100' },
  { id: 'choice', label: 'Next Choice', hint: 'What opens next', color: 'border-orange-300 text-orange-100' },
];

const correctLoop = ['goal', 'action', 'obstacle', 'feedback', 'reward', 'choice'];

export default function LoopLabGame() {
  const { completeGame, updatePrototypeField } = useStore();
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [avatarStep, setAvatarStep] = useState(0);
  const [message, setMessage] = useState('Build a loop, then run the avatar.');
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const remaining = useMemo(() => components.filter((component) => !slots.includes(component.id)), [slots]);
  const isCorrect = slots.every((slot, index) => slot === correctLoop[index]);
  const isFull = slots.every(Boolean);

  const placeComponent = (componentId: string, slotIndex: number) => {
    setSlots((current) => {
      const cleared = current.map((value) => (value === componentId ? null : value));
      cleared[slotIndex] = componentId;
      return cleared;
    });
    setSelectedComponent(null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, slotIndex: number) => {
    event.preventDefault();
    const componentId = event.dataTransfer.getData('text/plain');
    if (componentId) placeComponent(componentId, slotIndex);
  };

  const runLoop = () => {
    if (!isFull) {
      setMessage('The machine is missing parts. A loop needs every step.');
      return;
    }

    let step = 0;
    setAvatarStep(0);
    setMessage('Running the fun machine...');
    const timer = window.setInterval(() => {
      step += 1;
      setAvatarStep(step);
      if (step >= slots.length) {
        window.clearInterval(timer);
        if (isCorrect) {
          const finalScore = 300;
          setScore(finalScore);
          setFinished(true);
          completeGame(game.id, finalScore, game.takeaway, game.prototypePrompt);
        } else {
          setMessage('The avatar got confused. Try Goal -> Action -> Obstacle -> Feedback -> Reward -> Next Choice.');
          setAvatarStep(0);
        }
      }
    }, 420);
  };

  const reset = () => {
    setSlots([null, null, null, null, null, null]);
    setSelectedComponent(null);
    setAvatarStep(0);
    setMessage('Build a loop, then run the avatar.');
    setFinished(false);
    setScore(0);
  };

  if (finished) {
    return (
      <GameTakeawayPanel
        title={game.title}
        score={score}
        played="You assembled a six-part game loop and tested whether an avatar could move through it without getting stuck."
        taught={game.takeaway}
        prototypeFieldLabel="Core Mechanic"
        prototypeOutput={game.prototypePrompt}
        onSendToPrototype={() => updatePrototypeField('coreMechanic', game.prototypePrompt)}
        onReplay={reset}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-5xl mx-auto">
      <section className="arcade-border-pink glass-panel-pink rounded-xl p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">{game.subtitle}</p>
            <h1 className="text-2xl md:text-3xl font-arcade text-white mt-3">{game.title}</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-2xl">{game.mechanic}</p>
          </div>
          <CircuitBoard className="w-12 h-12 text-pink-300" />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-4">
        <div className="arcade-border glass-panel rounded-xl p-4">
          <h2 className="text-sm font-arcade text-cyan-300 mb-4">Loop Parts</h2>
          <div className="grid grid-cols-2 gap-3">
            {remaining.map((component) => (
              <button
                key={component.id}
                draggable
                onDragStart={(event) => event.dataTransfer.setData('text/plain', component.id)}
                onClick={() => setSelectedComponent(component.id)}
                className={`rounded-xl border bg-black/60 p-3 text-left min-h-[92px] ${component.color} ${selectedComponent === component.id ? 'ring-2 ring-white' : ''}`}
              >
                <p className="text-sm font-black uppercase">{component.label}</p>
                <p className="text-xs text-gray-400 mt-2">{component.hint}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">Drag a part into a slot. On mobile, tap a part, then tap a slot.</p>
        </div>

        <div className="arcade-border-green glass-panel-green rounded-xl p-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-arcade text-green-300">Fun Machine</h2>
            <button onClick={runLoop} className="flex items-center gap-2 rounded-lg bg-green-400 px-4 py-2 text-xs font-bold uppercase text-black hover:bg-green-300">
              <Play className="w-4 h-4" /> Run
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            {slots.map((slot, index) => {
              const component = components.find((item) => item.id === slot);
              const active = avatarStep === index;
              return (
                <div
                  key={index}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, index)}
                  onClick={() => selectedComponent && placeComponent(selectedComponent, index)}
                  className={`min-h-[128px] rounded-xl border-2 border-dashed p-3 flex flex-col justify-between transition-colors ${
                    active ? 'border-white bg-white/15' : 'border-green-400/30 bg-black/50'
                  }`}
                >
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Slot {index + 1}</p>
                  {component ? (
                    <div>
                      <p className={`text-sm font-black uppercase ${component.color.split(' ')[1]}`}>{component.label}</p>
                      <p className="text-xs text-gray-400 mt-2">{component.hint}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600">Drop part here</p>
                  )}
                  {active && <Bot className="w-6 h-6 text-white animate-bounce" />}
                </div>
              );
            })}
          </div>

          <div className="mt-4 bg-black/60 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span>{message}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 mt-4 text-gray-600">
              {correctLoop.map((part, index) => (
                <span key={part} className="flex items-center gap-2 text-[10px] uppercase font-bold">
                  {components.find((component) => component.id === part)?.label}
                  {index < correctLoop.length - 1 && <ArrowRight className="w-3 h-3" />}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
