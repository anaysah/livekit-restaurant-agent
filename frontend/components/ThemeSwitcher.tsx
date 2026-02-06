// components/ThemeSwitcher.tsx
'use client';

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-64 bg-card animate-pulse rounded" />;
  }

  return (
    <div className="flex gap-2 p-4">
      <button 
        onClick={() => setTheme('light')}
        className={`px-4 py-2 rounded border ${
          theme === 'light' 
            ? 'bg-primary text-white' 
            : 'bg-card text-foreground'
        }`}
      >
        Light
      </button>
      <button 
        onClick={() => setTheme('dark')}
        className={`px-4 py-2 rounded border ${
          theme === 'dark' 
            ? 'bg-primary text-white' 
            : 'bg-card text-foreground'
        }`}
      >
        Dark
      </button>
      <button 
        onClick={() => setTheme('neon')}
        className={`px-4 py-2 rounded border ${
          theme === 'neon' 
            ? 'bg-primary text-white' 
            : 'bg-card text-foreground'
        }`}
      >
        Neon
      </button>
      <button 
        onClick={() => setTheme('pink')}
        className={`px-4 py-2 rounded border ${
          theme === 'pink' 
            ? 'bg-primary text-white' 
            : 'bg-card text-foreground'
        }`}
      >
        Pink
      </button>
    </div>
  );
}
