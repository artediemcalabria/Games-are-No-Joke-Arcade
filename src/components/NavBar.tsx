import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, BookOpen, Trophy, Info, ClipboardList, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

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

  return (
    <nav className="fixed bottom-0 w-full bg-black/60 backdrop-blur-md border-t border-white/10 p-2 z-40 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <ul className="flex justify-around items-center max-w-5xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <li key={item.path} className="flex-1">
              <Link
                to={item.path}
                className={cn(
                  "flex flex-col items-center p-2 transition-all duration-200",
                  isActive ? "text-arcade-cyan scale-110" : "text-gray-500 hover:text-white"
                )}
              >
                <div className="relative">
                  <item.icon className="w-6 h-6 md:w-5 md:h-5" />
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute -bottom-2 left-1/2 w-1 h-1 bg-arcade-pink rounded-full shadow-[0_0_8px_#ff00ff]"
                      style={{ x: "-50%" }}
                    />
                  )}
                </div>
                <span className="text-[10px] mt-1 font-bold uppercase hidden md:block">
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
