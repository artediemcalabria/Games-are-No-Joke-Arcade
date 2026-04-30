import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, BookOpen, Trophy, Info, ClipboardList, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { playSound } from '../lib/audio';
import { useStore } from '../store/useStore';

const navItems = [
  { path: '/theory', label: 'Theory', icon: BookOpen },
  { path: '/prototype', label: 'Prototype', icon: ClipboardList },
  { path: '/coach', label: 'AI Coach', icon: Bot },
  { path: '/arcade', label: 'Arcade', icon: Gamepad2 },
  { path: '/progress', label: 'Progress', icon: Trophy },
  { path: '/about', label: 'About', icon: Info },
];

export function NavBar() {
  const location = useLocation();
  const { audioEnabled } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-black/85 backdrop-blur-md border-t border-white/10 px-1.5 py-2 z-[70] safe-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <ul className="grid grid-cols-6 items-stretch gap-1 max-w-5xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <li key={item.path} className="min-w-0">
              <Link
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => playSound('select', audioEnabled)}
                className={cn(
                  "flex h-full min-h-14 flex-col items-center justify-center rounded-lg px-1.5 py-2 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300",
                  isActive ? "bg-cyan-300/10 text-arcade-cyan" : "text-gray-500 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute -bottom-2 left-1/2 w-1 h-1 bg-arcade-pink rounded-full shadow-[0_0_8px_#ff00ff]"
                      style={{ x: "-50%" }}
                    />
                  )}
                </div>
                <span className="mt-1 max-w-full truncate text-[9px] font-bold uppercase leading-tight sm:text-[10px]">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
