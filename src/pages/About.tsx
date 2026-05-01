import { motion } from 'motion/react';
import { ExternalLink, Instagram } from 'lucide-react';
import { courseInfo, partners } from '../data/course';

export default function About() {
  const assetBase = import.meta.env.BASE_URL;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-10 flex flex-col gap-4">
      <div className="notebook-surface arcade-border-pink glass-panel-pink p-6 rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6 items-center">
          <div>
            <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">{courseInfo.programme}</p>
            <h2 className="text-2xl font-arcade tracking-tight text-white mt-3 uppercase">{courseInfo.title}</h2>
            <p className="text-gray-300 leading-relaxed text-sm font-medium mt-4">
              This app supports the Training Course <strong className="text-arcade-green">Games Are No Joke</strong>, focused on game design for youth work.
              Participants use it to learn key models, play short training games, and design their first prototype.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
              <div className="notebook-muted-card bg-black/50 border border-white/10 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Dates</p>
                <p className="text-sm text-white font-bold mt-1">{courseInfo.dates}</p>
              </div>
              <div className="notebook-muted-card bg-black/50 border border-white/10 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Venue</p>
                <p className="text-sm text-white font-bold mt-1">{courseInfo.venue}</p>
              </div>
              <div className="notebook-muted-card bg-black/50 border border-white/10 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Code</p>
                <p className="text-xs text-white font-bold mt-1 break-words">{courseInfo.code}</p>
              </div>
            </div>
          </div>
          <img src={`${assetBase}ganj-logo.png`} alt="Games Are No Joke logo" className="w-full max-w-[220px] mx-auto rounded-xl border border-white/10 bg-black/50 object-cover" />
        </div>
      </div>

      <div className="notebook-surface arcade-border glass-panel p-6 rounded-xl mt-2">
        <h3 className="text-sm font-arcade text-cyan-400 mb-6 uppercase tracking-widest">Partner Organisations</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partners.map((partner) => (
            <li key={partner.name} className="notebook-card p-4 rounded-xl border border-white/10 shadow-sm flex flex-col bg-black/40 hover:bg-white/5 transition-colors gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white p-2">
                {partner.logo ? (
                  <img
                    src={`${assetBase}${partner.logo}`}
                    alt={`${partner.name} logo`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-center text-sm font-black uppercase leading-none text-slate-800">
                    {partner.name.split(' ').slice(0, 2).map((word) => word[0]).join('')}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-white font-bold text-sm tracking-wide">{partner.name}</span>
                <span className="text-gray-500 text-xs mt-1 block">{partner.country}</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={partner.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="notebook-button inline-flex min-h-9 items-center gap-2 rounded-lg border border-pink-300/40 bg-pink-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-pink-100 transition-colors hover:bg-pink-300 hover:text-black"
                    aria-label={`Open ${partner.name} on Instagram`}
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    Instagram
                  </a>
                  <a
                    href={partner.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="notebook-button inline-flex min-h-9 items-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-cyan-100 transition-colors hover:bg-cyan-300 hover:text-black"
                    aria-label={`Open ${partner.name} on Facebook`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Facebook
                  </a>
                </div>
              </div>
              <span className={`shrink-0 text-[10px] uppercase border px-2 py-1 rounded-sm font-bold ${
                partner.role === 'Host' ? 'text-green-400 border-green-400/50 bg-green-400/10' : 'text-cyan-400 border-cyan-400/50 bg-cyan-400/10'
              }`}>
                {partner.role}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="notebook-surface arcade-border-green glass-panel-green p-6 rounded-xl">
        <h3 className="text-sm font-arcade text-green-400 mb-4 uppercase tracking-widest">Source-Inspired Content</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          The app uses original Simple English learning content inspired by youth work game handbooks, gamification curricula, serious game design methods,
          MDA, playtesting, and game designer worksheets from the provided training source folder.
        </p>
      </div>

      <div className="text-center mt-4">
        <p className="text-[10px] text-gray-600 font-arcade">VER. 2026.04.29</p>
      </div>
    </motion.div>
  );
}
