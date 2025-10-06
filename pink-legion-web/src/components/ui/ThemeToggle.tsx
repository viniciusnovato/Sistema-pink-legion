'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="p-2 rounded-xl bg-gradient-to-r from-rose-gold-100 to-rose-gold-200 dark:from-rose-gold-800 dark:to-rose-gold-700 animate-pulse">
        <div className="w-5 h-5" />
      </div>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="group relative p-3 rounded-xl bg-gradient-to-r from-rose-gold-100 to-rose-gold-200 hover:from-rose-gold-200 hover:to-rose-gold-300 dark:from-rose-gold-800 dark:to-rose-gold-700 dark:hover:from-rose-gold-700 dark:hover:to-rose-gold-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
      aria-label="Toggle theme"
    >
      <div className="relative">
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-rose-gold-600 dark:text-rose-gold-300 transition-all duration-300 group-hover:rotate-180" />
        ) : (
          <Moon className="w-5 h-5 text-rose-gold-600 dark:text-rose-gold-300 transition-all duration-300 group-hover:-rotate-12" />
        )}
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-gold-400/20 to-rose-gold-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
    </button>
  )
}