import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardList, RotateCcw } from 'lucide-react';

interface GameTakeawayPanelProps {
  title: string;
  score: number;
  played: string;
  taught: string;
  prototypeFieldLabel: string;
  prototypeOutput: string;
  onSendToPrototype: () => void;
  onReplay: () => void;
}

export function GameTakeawayPanel({
  title,
  score,
  played,
  taught,
  prototypeFieldLabel,
  prototypeOutput,
  onSendToPrototype,
  onReplay,
}: GameTakeawayPanelProps) {
  return (
    <section className="arcade-border-green glass-panel-green rounded-xl p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-green-400/30 pb-5">
        <div>
          <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Design Takeaway Unlocked</p>
          <h2 className="text-2xl font-arcade text-white mt-3">{title}</h2>
        </div>
        <div className="bg-black/60 border border-green-400/30 rounded-xl p-4 text-center min-w-[130px]">
          <p className="text-[10px] text-gray-500 font-bold uppercase">Score</p>
          <p className="text-3xl text-white font-black">{score}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
        <TakeawayCard label="What you played" body={played} />
        <TakeawayCard label="What the mechanic taught" body={taught} />
        <TakeawayCard label={`Prototype Lab: ${prototypeFieldLabel}`} body={prototypeOutput} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-5">
        <button
          onClick={onSendToPrototype}
          className="flex items-center justify-center gap-2 rounded-lg border border-green-400 bg-green-400/10 px-4 py-3 text-xs font-bold uppercase text-green-100 hover:bg-green-400 hover:text-black transition-colors"
        >
          <ClipboardList className="w-4 h-4" /> Send to Prototype Lab
        </button>
        <button
          onClick={onReplay}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-xs font-bold uppercase text-gray-200 hover:border-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Replay
        </button>
        <Link
          to="/arcade"
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-xs font-bold uppercase text-gray-200 hover:border-pink-400 hover:text-pink-300 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" /> Collection
        </Link>
      </div>
    </section>
  );
}

function TakeawayCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="bg-black/55 border border-white/10 rounded-xl p-4">
      <p className="text-[10px] text-green-300 font-bold uppercase tracking-widest">{label}</p>
      <p className="text-sm text-gray-100 leading-relaxed mt-3">{body}</p>
    </div>
  );
}
