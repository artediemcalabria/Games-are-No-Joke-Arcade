import { HelpCircle, X } from 'lucide-react';
import { motion } from 'motion/react';

export type ManualSection = {
  title: string;
  items: string[];
};

export function ManualButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold uppercase text-gray-200 hover:border-yellow-300"
    >
      <HelpCircle className="w-4 h-4 inline mr-2" />
      Manual
    </button>
  );
}

export function GameManualPanel({
  open,
  title,
  sections,
  onClose,
}: {
  open: boolean;
  title: string;
  sections: ManualSection[];
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-yellow-300 bg-slate-950 p-5 shadow-[0_0_28px_rgba(253,224,71,.35)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">Game Manual</p>
            <h2 className="mt-2 text-xl font-arcade mobile-readable-arcade text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-black/50 p-2 text-gray-300 hover:border-red-300 hover:text-red-200"
            aria-label="Close manual"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {sections.map((section) => (
            <div key={section.title} className="rounded-xl border border-white/10 bg-black/45 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-cyan-300">{section.title}</p>
              <ul className="mt-3 space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-gray-200 readable-copy">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
