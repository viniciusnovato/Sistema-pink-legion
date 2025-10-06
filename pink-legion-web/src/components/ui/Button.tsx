import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseClasses = 'group relative inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden'
    
    const variants = {
      primary: 'bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400 hover:from-primary-500 hover:via-primary-600 hover:to-primary-500 text-white shadow-medium hover:shadow-strong border border-primary-300/50',
      secondary: 'bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-400 hover:from-secondary-500 hover:via-secondary-600 hover:to-secondary-500 text-white shadow-medium hover:shadow-strong border border-secondary-300/50',
      outline: 'border-2 border-primary-400 text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 active:from-primary-100 active:to-primary-200 dark:text-primary-300 dark:hover:from-primary-900/20 dark:hover:to-primary-800/20 dark:active:from-primary-800/30 dark:active:to-primary-700/30 shadow-soft hover:shadow-medium',
      ghost: 'text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 active:from-primary-100 active:to-primary-200 dark:text-primary-300 dark:hover:from-primary-900/20 dark:hover:to-primary-800/20 dark:active:from-primary-800/30 dark:active:to-primary-700/30 hover:shadow-soft',
      destructive: 'bg-gradient-to-r from-red-500 via-red-600 to-red-500 hover:from-red-600 hover:via-red-700 hover:to-red-600 text-white shadow-medium hover:shadow-strong border border-red-400/50',
      success: 'bg-gradient-to-r from-success-500 via-success-600 to-success-500 hover:from-success-600 hover:via-success-700 hover:to-success-600 text-white shadow-medium hover:shadow-strong border border-success-400/50',
      warning: 'bg-gradient-to-r from-warning-500 via-warning-600 to-warning-500 hover:from-warning-600 hover:via-warning-700 hover:to-warning-600 text-white shadow-medium hover:shadow-strong border border-warning-400/50'
    }
    
    const sizes = {
      sm: 'px-3 py-2 text-sm h-8',
      md: 'px-4 py-2.5 text-sm h-10',
      lg: 'px-6 py-3 text-base h-12',
      xl: 'px-8 py-4 text-lg h-14'
    }

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400/20 to-primary-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 blur-sm"></div>
        
        {/* Content */}
        <div className="relative flex items-center">
          {loading && (
            <svg
              className="animate-spin -ml-1 mr-3 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {children}
        </div>
        
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-active:opacity-100 bg-white/20 transition-opacity duration-150"></div>
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }