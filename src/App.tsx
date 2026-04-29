import { BrowserRouter, HashRouter, Routes, Route, Link } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import Home from './pages/Home';
import Theory from './pages/Theory';
import ArcadeList from './pages/ArcadeList';
import Progress from './pages/Progress';
import About from './pages/About';
import Quiz from './pages/Quiz';
import PrototypeLab from './pages/PrototypeLab';
import GeminiCoach from './pages/GeminiCoach';
import CastleRushGame from './pages/games/CastleRushGame';
import YouthPassDropGame from './pages/games/YouthPassDropGame';
import FiladelfiaStoryGame from './pages/games/FiladelfiaStoryGame';
import { courseInfo } from './data/course';

const Router = import.meta.env.BASE_URL === '/' ? BrowserRouter : HashRouter;
const routerBasename = import.meta.env.BASE_URL === '/'
  ? undefined
  : import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
  return (
    <Router basename={Router === BrowserRouter ? routerBasename : undefined}>
      {/* Outer shell containing the CRT effects */}
      <div className="min-h-screen bg-arcade-bg scanlines crt-flicker flex flex-col items-center font-sans tracking-wide">
        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-5xl mx-auto relative pb-32 px-4 pt-6 flex flex-col gap-4">
          
          <header className="flex flex-col md:flex-row justify-between items-center bg-black/40 arcade-border-pink p-4 mb-4 gap-4">
            <Link to="/" className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">
                {courseInfo.title}
              </h1>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-2 tracking-widest font-bold uppercase">
                <span className="text-pink-500">●</span> {courseInfo.programme}
              </p>
            </Link>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-300">Hosted by <span className="text-arcade-green font-bold">{courseInfo.host}</span></p>
              <p className="text-[10px] text-gray-500 uppercase">{courseInfo.dates} - {courseInfo.venue}</p>
              <p className="text-[10px] text-cyan-400/80 uppercase mt-1">{courseInfo.code}</p>
            </div>
          </header>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/theory" element={<Theory />} />
            <Route path="/prototype" element={<PrototypeLab />} />
            <Route path="/coach" element={<GeminiCoach />} />
            <Route path="/arcade" element={<ArcadeList />} />
            <Route path="/arcade/castle-rush" element={<CastleRushGame />} />
            <Route path="/arcade/youthpass-drop" element={<YouthPassDropGame />} />
            <Route path="/arcade/filadelfia-story" element={<FiladelfiaStoryGame />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/about" element={<About />} />
            <Route path="/quiz" element={<Quiz />} />
          </Routes>
        </main>

        <NavBar />
      </div>
    </Router>
  );
}
