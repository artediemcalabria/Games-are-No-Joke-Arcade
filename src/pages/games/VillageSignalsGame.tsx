import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Radio, ShieldCheck, UsersRound } from 'lucide-react';
import { gameCatalog } from '../../data/course';
import { useStore } from '../../store/useStore';
import { GameTakeawayPanel } from './GameTakeawayPanel';

const game = gameCatalog.find((item) => item.id === 'village-signals')!;

const actions = [
  {
    id: 'dialogue',
    label: 'Host Dialogue',
    icon: MessageCircle,
    cost: 2,
    effects: { trust: 12, rumors: -6, tension: -8 },
    note: 'Dialogue lowers tension when the group has enough time and safety.',
  },
  {
    id: 'verify',
    label: 'Verify Source',
    icon: ShieldCheck,
    cost: 1,
    effects: { trust: 4, rumors: -16, tension: -2 },
    note: 'Fact-checking works best when it is connected to relationships.',
  },
  {
    id: 'support',
    label: 'Support Excluded Voice',
    icon: UsersRound,
    cost: 2,
    effects: { trust: 14, rumors: -3, tension: -5 },
    note: 'Inclusion changes the system because more people feel ownership.',
  },
  {
    id: 'rush',
    label: 'Rush Decision',
    icon: Radio,
    cost: 0,
    effects: { trust: -12, rumors: 12, tension: 14 },
    note: 'Fast decisions save resources, but they can increase polarization.',
  },
];

const districts = [
  { name: 'Youth Centre', x: '20%', y: '24%' },
  { name: 'School', x: '66%', y: '20%' },
  { name: 'Online Chat', x: '45%', y: '48%' },
  { name: 'Town Square', x: '24%', y: '72%' },
  { name: 'Families', x: '72%', y: '72%' },
];

export default function VillageSignalsGame() {
  const { completeGame, updatePrototypeField } = useStore();
  const [round, setRound] = useState(1);
  const [trust, setTrust] = useState(45);
  const [rumors, setRumors] = useState(45);
  const [tension, setTension] = useState(45);
  const [resources, setResources] = useState(7);
  const [log, setLog] = useState<string[]>(['A rumor is moving through the village. Choose actions for five rounds.']);
  const [finished, setFinished] = useState(false);

  const score = useMemo(() => Math.max(0, trust + (100 - rumors) + (100 - tension) + resources * 3), [resources, rumors, tension, trust]);
  const signalLevel = Math.max(1, Math.ceil((rumors + tension) / 35));

  const applyAction = (action: typeof actions[number]) => {
    if (resources < action.cost) {
      setLog((current) => [`Not enough resources for ${action.label}. Try a cheaper action.`, ...current].slice(0, 4));
      return;
    }

    const nextTrust = clamp(trust + action.effects.trust);
    const nextRumors = clamp(rumors + action.effects.rumors + round * 2);
    const nextTension = clamp(tension + action.effects.tension + (nextRumors > 60 ? 4 : 0));
    const nextResources = Math.max(0, resources - action.cost + (action.id === 'rush' ? 1 : 0));

    setTrust(nextTrust);
    setRumors(nextRumors);
    setTension(nextTension);
    setResources(nextResources);
    setLog((current) => [`Round ${round}: ${action.note}`, ...current].slice(0, 4));

    if (round >= 5) {
      const finalScore = Math.max(0, nextTrust + (100 - nextRumors) + (100 - nextTension) + nextResources * 3);
      setFinished(true);
      completeGame(game.id, finalScore, game.takeaway, game.prototypePrompt);
      return;
    }

    setRound((current) => current + 1);
  };

  const reset = () => {
    setRound(1);
    setTrust(45);
    setRumors(45);
    setTension(45);
    setResources(7);
    setLog(['A rumor is moving through the village. Choose actions for five rounds.']);
    setFinished(false);
  };

  if (finished) {
    return (
      <GameTakeawayPanel
        title={game.title}
        score={score}
        played="You managed trust, rumors, tension, and resources in a youth community where every action changed the system."
        taught={game.takeaway}
        prototypeFieldLabel="Debrief"
        prototypeOutput={game.prototypePrompt}
        onSendToPrototype={() => updatePrototypeField('debriefQuestion', game.prototypePrompt)}
        onReplay={reset}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 max-w-5xl mx-auto">
      <section className="arcade-border glass-panel rounded-xl p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">{game.subtitle}</p>
            <h1 className="text-2xl md:text-3xl font-arcade text-white mt-3">{game.title}</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-2xl">{game.mechanic}</p>
          </div>
          <div className="bg-black/60 border border-cyan-400/30 rounded-xl p-4 text-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Round</p>
            <p className="text-3xl text-white font-black">{round}/5</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="arcade-border-pink glass-panel-pink rounded-xl p-4">
          <h2 className="text-sm font-arcade text-pink-300 mb-4">Community Map</h2>
          <div className="relative min-h-[360px] rounded-xl bg-black/70 border border-white/10 overflow-hidden">
            <div className="absolute inset-0 opacity-30 bg-[linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
            {districts.map((district, index) => (
              <div
                key={district.name}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-center"
                style={{ left: district.x, top: district.y }}
              >
                <p className="text-[10px] text-cyan-100 font-bold uppercase">{district.name}</p>
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: signalLevel + (index % 2) }).map((_, dotIndex) => (
                    <span key={dotIndex} className={`h-2 w-2 rounded-full ${rumors > 60 ? 'bg-pink-400' : tension > 55 ? 'bg-yellow-300' : 'bg-green-400'}`} />
                  ))}
                </div>
              </div>
            ))}
            <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pink-400 bg-pink-400/15 flex items-center justify-center">
              <Radio className="w-7 h-7 text-pink-300 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="arcade-border-green glass-panel-green rounded-xl p-4">
            <h2 className="text-sm font-arcade text-green-300 mb-4">System Meters</h2>
            <Meter label="Trust" value={trust} color="bg-green-400" />
            <Meter label="Rumors" value={rumors} color="bg-pink-500" />
            <Meter label="Tension" value={tension} color="bg-yellow-300" />
            <Meter label="Resources" value={resources * 10} color="bg-cyan-400" text={`${resources} tokens`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => applyAction(action)}
                className="rounded-xl border border-white/10 bg-black/60 p-4 text-left hover:border-cyan-400 hover:bg-cyan-400/10 transition-colors"
              >
                <action.icon className="w-6 h-6 text-cyan-300" />
                <p className="text-sm text-white font-bold mt-3">{action.label}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Cost: {action.cost}</p>
              </button>
            ))}
          </div>

          <div className="bg-black/60 border border-white/10 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">System Log</h3>
            <div className="space-y-2">
              {log.map((entry, index) => (
                <p key={`${entry}-${index}`} className="text-xs text-gray-300 leading-relaxed">{entry}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function Meter({ label, value, color, text }: { label: string; value: number; color: string; text?: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs font-bold uppercase mb-2">
        <span className="text-gray-400">{label}</span>
        <span className="text-white">{text || value}</span>
      </div>
      <div className="h-3 rounded-full bg-black/70 overflow-hidden border border-white/10">
        <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
