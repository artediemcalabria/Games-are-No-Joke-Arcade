import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clipboard, ClipboardList, Download, Printer, RotateCcw } from 'lucide-react';
import { gameCatalog, prototypeSteps } from '../data/course';
import { useStore } from '../store/useStore';

export default function PrototypeLab() {
  const { prototype, gameTakeaways, gameNotes, coachNotes, updatePrototypeField } = useStore();
  const [actionMessage, setActionMessage] = useState('');
  const completedSteps = prototypeSteps.filter((step) => prototype[step.id]?.trim()).length;
  const progressPercent = Math.round((completedSteps / prototypeSteps.length) * 100);

  const buildPrototypeCardText = () => {
    const fields = prototypeSteps
      .map((step) => `${step.label}: ${prototype[step.id]?.trim() || '-'}`)
      .join('\n');
    return `Games Are No Joke - Prototype Card\n\n${fields}`;
  };

  const copyPrototypeCard = async () => {
    try {
      await navigator.clipboard?.writeText(buildPrototypeCardText());
      setActionMessage('Prototype Card copied. You can paste it anywhere.');
    } catch {
      setActionMessage('Copy did not work in this browser. Use Save File instead.');
    }
  };

  const savePrototypeCard = () => {
    const blob = new Blob([buildPrototypeCardText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (prototype.topic || 'games-are-no-joke-prototype').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    link.href = url;
    link.download = `${safeTitle || 'games-are-no-joke-prototype'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage('Prototype Card saved as a text file.');
  };

  const printPrototypeCard = () => {
    window.print();
    setActionMessage('Print view opened. Choose Save as PDF if you want a PDF.');
  };

  const stagedSteps = [
    { title: 'Idea', helper: 'Start with the people and the learning need.', ids: ['topic', 'targetGroup', 'learningGoal'] },
    { title: 'Play', helper: 'Make the player action concrete and repeatable.', ids: ['playerRole', 'coreMechanic', 'winCondition'] },
    { title: 'Table', helper: 'Keep materials and rules simple enough to test.', ids: ['materials', 'rules'] },
    { title: 'Reflect', helper: 'Plan debrief and playtest before polishing.', ids: ['debriefQuestion', 'playtestPlan'] },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 space-y-4">
      <section className="arcade-border-green glass-panel-green rounded-xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Prototype Lab</p>
            <h1 className="text-2xl md:text-3xl font-arcade text-white mt-3">Design Your First Game Prototype</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-3xl">
              Learn models, play design games, build a prototype, then reflect. Fill one small field at a time and keep the first version clear enough to test.
            </p>
          </div>
          <div className="bg-black/60 border border-green-400/30 rounded-xl p-4 min-w-[170px]">
            <div className="flex items-center justify-between text-xs font-bold text-green-300 uppercase">
              <span>Ready</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 rounded bg-green-900/40 mt-3 overflow-hidden">
              <div className="h-full bg-green-400" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-3">{completedSteps}/{prototypeSteps.length} fields completed</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {stagedSteps.map((stage) => (
          <div key={stage.title} className="reading-panel p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-[10px] text-green-300 font-bold uppercase tracking-widest">{stage.title}</p>
                <p className="mt-2 text-sm text-gray-300 readable-copy">{stage.helper}</p>
              </div>
              <span className="text-[10px] font-bold uppercase text-gray-500">
                {stage.ids.filter((id) => prototype[id]?.trim()).length}/{stage.ids.length} ready
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {prototypeSteps.filter((step) => stage.ids.includes(step.id)).map((step) => {
                const isDone = Boolean(prototype[step.id]?.trim());
                const absoluteIndex = prototypeSteps.findIndex((item) => item.id === step.id) + 1;
                return (
                  <div key={step.id} className="bg-black/45 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${isDone ? 'border-green-400 bg-green-400/10' : 'border-gray-700 bg-black/60'}`}>
                        {isDone ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <step.icon className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h2 className="text-sm font-bold text-white">{absoluteIndex}. {step.label}</h2>
                          <span className="text-[10px] text-gray-500 font-bold uppercase">{isDone ? 'Saved' : 'Draft'}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 readable-copy">{step.prompt}</p>
                        <textarea
                          value={prototype[step.id] ?? ''}
                          onChange={(event) => updatePrototypeField(step.id, event.target.value)}
                          rows={step.id === 'rules' ? 4 : 3}
                          className="mt-3 w-full rounded-lg border border-white/10 bg-black/70 px-3 py-3 text-sm text-white tracking-normal outline-none focus:border-green-400 resize-y"
                          placeholder={`Write ${step.label.toLowerCase()} in simple English...`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="arcade-border-pink glass-panel-pink rounded-xl p-5 md:p-6 print:border-0 print:bg-white print:text-black">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Live Output</p>
              <h2 className="text-lg font-arcade text-white mt-2">Prototype Card</h2>
            </div>
            <ClipboardList className="w-8 h-8 text-pink-400" />
          </div>

          <div className="mt-5 rounded-xl bg-white text-black p-5 md:p-6">
            <div className="border-b border-black/20 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Games Are No Joke</p>
              <h3 className="text-xl font-black uppercase leading-tight">{prototype.topic || 'Untitled prototype'}</h3>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {prototypeSteps.map((step) => (
                <div key={step.id} className={step.id === 'rules' || step.id === 'playtestPlan' ? 'md:col-span-2' : ''}>
                  <p className="text-[10px] font-black uppercase text-gray-500">{step.label}</p>
                  <p className="text-sm font-semibold leading-snug whitespace-pre-wrap">{prototype[step.id]?.trim() || '-'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 print:hidden">
            <button
              onClick={copyPrototypeCard}
              className="flex items-center justify-center gap-2 rounded-lg border border-pink-400 bg-pink-400/10 px-3 py-3 text-xs font-bold uppercase text-pink-100 hover:bg-pink-400 hover:text-black transition-colors"
            >
              <Clipboard className="w-4 h-4" /> Copy Text
            </button>
            <button
              onClick={savePrototypeCard}
              className="flex items-center justify-center gap-2 rounded-lg border border-green-400 bg-green-400/10 px-3 py-3 text-xs font-bold uppercase text-green-100 hover:bg-green-400 hover:text-black transition-colors"
            >
              <Download className="w-4 h-4" /> Save File
            </button>
            <button
              onClick={printPrototypeCard}
              className="flex items-center justify-center gap-2 rounded-lg border border-cyan-400 bg-cyan-400/10 px-3 py-3 text-xs font-bold uppercase text-cyan-100 hover:bg-cyan-400 hover:text-black transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={() => prototypeSteps.forEach((step) => updatePrototypeField(step.id, ''))}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-xs font-bold uppercase text-gray-300 hover:border-red-400 hover:text-red-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Clear Draft
            </button>
          </div>
          {actionMessage && <p className="mt-3 text-xs font-bold uppercase tracking-widest text-green-200">{actionMessage}</p>}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="arcade-border glass-panel rounded-xl p-5">
          <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Ideas From The Games</p>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            These are design lessons from the playable games. Use one if you need help filling a prototype field.
          </p>
          <div className="mt-4 space-y-3">
            {gameCatalog.map((game) => (
              <div key={game.id} className="rounded-lg border border-white/10 bg-black/50 p-3">
                <p className="text-sm text-white font-bold">{game.title}</p>
                <p className="text-xs text-gray-300 leading-relaxed mt-2">{gameTakeaways[game.id] || game.prototypePrompt}</p>
                {gameNotes[game.id] && <p className="text-xs text-cyan-300 leading-relaxed mt-2">Prototype note: {gameNotes[game.id]}</p>}
                <button
                  onClick={() => updatePrototypeField(game.id === 'filadelfia-story' || game.id === 'youthpass-drop' ? 'debriefQuestion' : 'coreMechanic', game.prototypePrompt)}
                  className="mt-3 rounded border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[10px] font-bold uppercase text-cyan-100 hover:bg-cyan-300 hover:text-black"
                >
                  Use as prompt
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black/60 border border-white/10 rounded-xl p-5">
          <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Saved AI Coach Suggestions</p>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            These are answers you saved from the AI Coach. Use them only if they help your prototype.
          </p>
          <div className="mt-4 space-y-3">
            {coachNotes.length === 0 && <p className="text-sm text-gray-400">Saved coach notes will appear here.</p>}
            {coachNotes.slice(0, 4).map((note) => (
              <div key={note.id} className="rounded-lg border border-white/10 bg-black/50 p-3">
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => updatePrototypeField('rules', note.text)}
                    className="rounded border border-green-300/30 bg-green-300/10 px-3 py-2 text-[10px] font-bold uppercase text-green-100 hover:bg-green-300 hover:text-black"
                  >
                    Use for rules
                  </button>
                  <button
                    onClick={() => updatePrototypeField('debriefQuestion', note.text)}
                    className="rounded border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[10px] font-bold uppercase text-cyan-100 hover:bg-cyan-300 hover:text-black"
                  >
                    Use for debrief
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
