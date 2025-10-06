'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from '../ui/ThemeToggle'

interface DashboardLayoutProps {
  children: React.ReactNode
  onLogout?: () => void
  userRole?: string
  userName?: string
  userEmail?: string
}

export function DashboardLayout({ children, onLogout, userRole, userName, userEmail }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light via-background-light to-background-light/50 dark:from-background-dark dark:via-background-dark dark:to-background-dark/50 transition-colors duration-300">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        userRole={userRole as any}
        userName={userName}
        userEmail={userEmail}
        onLogout={onLogout}
      />

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-light/20 dark:border-border-dark/20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 lg:px-6">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Page title - hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Pink Legion Dashboard
            </h1>
          </div>

          {/* Right side - User info and theme toggle */}
          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                  {userName || 'Usuário'}
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {userEmail || 'email@exemplo.com'}
                </p>
                {userRole && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium capitalize">
                    {userRole}
                  </p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-medium">
                <span className="text-sm font-bold text-white">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            </div>

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-4 lg:p-6 space-y-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border-light/20 dark:border-border-dark/20 bg-background-light/50 dark:bg-background-dark/50 px-4 lg:px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              © 2024 Pink Legion. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
              <span>Versão 1.0.0</span>
              <span>•</span>
              <span>Status: Online</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}