import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, CheckCircle2, ClipboardList, MapPinned, Newspaper, Sparkles } from 'lucide-react';
import { courseInfo } from '../data/course';
import { projectReports } from '../data/reports';
import { useStore } from '../store/useStore';

export default function Reports() {
  const { readReports, markReportRead } = useStore();
  const [activeReportId, setActiveReportId] = useState(projectReports[0]?.id);
  const activeReport = projectReports.find((report) => report.id === activeReportId) ?? projectReports[0];
  const isRead = readReports.includes(activeReport.id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-10">
      <section className="notebook-surface arcade-border-pink glass-panel-pink rounded-xl p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-300">{courseInfo.programme}</p>
            <h1 className="mt-3 text-2xl font-arcade leading-tight text-white md:text-3xl">Day by Day Reports</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">
              Follow the daily journey of {courseInfo.title}: activities, learning focus, group reflections, and prototype outputs from Filadelfia.
            </p>
          </div>
          <div className="notebook-card rounded-xl border border-pink-300/30 bg-black/50 p-4 text-sm">
            <p className="font-bold text-white">{courseInfo.dates}</p>
            <p className="mt-1 text-xs font-bold uppercase text-gray-400">{courseInfo.venue}</p>
            <p className="mt-2 text-[10px] font-bold uppercase text-cyan-300">{courseInfo.code}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {projectReports.map((report) => {
          const reportRead = readReports.includes(report.id);
          const active = report.id === activeReport.id;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReportId(report.id)}
              className={`notebook-list-button rounded-xl border p-4 text-left transition-colors ${
                active ? 'border-cyan-300 bg-cyan-300/12' : 'border-white/10 bg-black/40 hover:border-cyan-300/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{report.date}</p>
                  <h2 className="mt-2 text-lg font-black text-white">{report.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">{report.headline}</p>
                </div>
                {reportRead ? <CheckCircle2 className="h-6 w-6 shrink-0 text-green-400" /> : <Newspaper className="h-6 w-6 shrink-0 text-cyan-300" />}
              </div>
            </button>
          );
        })}
      </section>

      <article className="reading-panel p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">{activeReport.date}</p>
            <h2 className="mt-3 text-2xl font-arcade leading-tight text-white">{activeReport.title}: {activeReport.headline}</h2>
            <p className="mt-4 max-w-4xl text-sm leading-relaxed text-gray-300">{activeReport.summary}</p>
          </div>
          <button
            onClick={() => markReportRead(activeReport.id)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-300/40 bg-green-300/10 px-4 py-3 text-xs font-bold uppercase text-green-100 hover:bg-green-300 hover:text-black"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isRead ? 'Report Read' : 'Mark Read'}
          </button>
        </div>

        {activeReport.videoEmbedUrl && (
          <section className="mt-6 notebook-card overflow-hidden rounded-xl border border-white/10 bg-black/40">
            <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-arcade text-pink-200">{activeReport.title} Video Report</h3>
              {activeReport.videoUrl && (
                <a
                  href={activeReport.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-200 hover:text-cyan-100"
                >
                  Open on YouTube
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </div>
            <iframe
              className="aspect-video w-full"
              src={activeReport.videoEmbedUrl}
              title={`${activeReport.title} video report`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </section>
        )}

        <section className="mt-6">
          <h3 className="flex items-center gap-2 text-sm font-arcade text-cyan-300">
            <ClipboardList className="h-5 w-5" /> Activity Timeline
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {activeReport.activities.map((activity, index) => (
              <div key={`${activity.title}-${index}`} className="notebook-card rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-pink-300">{activity.timeLabel}</p>
                    <h4 className="mt-2 text-base font-black text-white">{activity.title}</h4>
                  </div>
                  <span className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-[10px] font-bold uppercase text-cyan-100">
                    Learning focus
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-300">{activity.description}</p>
                <p className="mt-3 rounded-lg border border-white/10 bg-white/[.04] p-3 text-xs font-bold leading-relaxed text-gray-200">
                  {activity.learningFocus}
                </p>
              </div>
            ))}
          </div>
        </section>

        {activeReport.fieldResearch && (
          <section className="notebook-muted-card mt-6 rounded-xl border border-green-300/30 bg-green-300/10 p-4">
            <h3 className="flex items-center gap-2 text-sm font-arcade text-green-300">
              <MapPinned className="h-5 w-5" /> {activeReport.fieldResearch.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-200">{activeReport.fieldResearch.description}</p>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="notebook-card rounded-xl border border-white/10 bg-black/35 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-200">Challenge checklist</p>
                <ul className="mt-3 space-y-2">
                  {activeReport.fieldResearch.checklist.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-relaxed text-gray-100">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {activeReport.fieldResearch.categories.map((category) => (
                  <div key={category.title} className="notebook-card rounded-lg border border-white/10 bg-black/35 p-3">
                    <p className="text-sm font-black text-white">{category.title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-300">{category.prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="notebook-muted-card rounded-xl border border-yellow-300/30 bg-yellow-300/10 p-4">
            <h3 className="flex items-center gap-2 text-sm font-arcade text-yellow-100">
              <Sparkles className="h-5 w-5" /> Outputs
            </h3>
            <ul className="mt-3 space-y-2">
              {activeReport.outputs.map((output) => (
                <li key={output} className="flex gap-2 text-sm leading-relaxed text-gray-100">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-200" />
                  <span>{output}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="notebook-muted-card rounded-xl border border-pink-300/30 bg-pink-300/10 p-4">
            <h3 className="text-sm font-arcade text-pink-200">Group Reflection</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-100">{activeReport.reflection}</p>
          </div>
        </section>

        {activeReport.resources && (
          <section className="notebook-card mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
            <h3 className="text-sm font-arcade text-cyan-300">Resources</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {activeReport.resources.map((resource) => (
                <a
                  key={resource.url}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="notebook-list-button rounded-lg border border-white/10 bg-black/45 p-3 text-sm hover:border-cyan-300"
                >
                  <span className="flex items-center justify-between gap-3 font-black text-white">
                    {resource.label}
                    <ArrowUpRight className="h-4 w-4 text-cyan-300" />
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-gray-400">{resource.note}</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </article>
    </motion.div>
  );
}
