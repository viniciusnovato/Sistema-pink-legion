import { InputHTMLAttributes, forwardRef, useState, useId } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'default' | 'filled' | 'outlined' | 'ghost'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, variant = 'default', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const generatedId = useId()
    const inputId = id || generatedId

    const variants = {
      default: 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark',
      filled: 'bg-gradient-to-r from-primary-50 via-white to-primary-50/50 dark:from-primary-900/10 dark:via-surface-dark dark:to-primary-800/10 border border-primary-200/30 dark:border-primary-700/30',
      outlined: 'bg-transparent border-2 border-primary-300/60 dark:border-primary-600/60',
      ghost: 'bg-transparent border-0 hover:bg-surface-light/50 dark:hover:bg-surface-dark/50'
    }

    return (
      <div className="w-full group">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-semibold mb-3 transition-all duration-200',
              'text-text-primary-light dark:text-text-primary-dark',
              isFocused && 'text-primary-600 dark:text-primary-400'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            className={cn(
              'flex h-12 w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 transform',
              'text-text-primary-light dark:text-text-primary-dark',
              'placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark',
              'focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-transparent focus:scale-[1.01]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'hover:shadow-soft focus:shadow-medium',
              variants[variant],
              error && 'border-error-400 focus:ring-error-400/50 bg-gradient-to-r from-error-50 to-error-50/50 dark:from-error-900/10 dark:to-error-800/10',
              isFocused && !error && 'border-primary-400 dark:border-primary-500 shadow-medium',
              className
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />
          
          {/* Glow effect on focus */}
          <div className={cn(
            'absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400/10 to-primary-500/10 opacity-0 transition-opacity duration-200 pointer-events-none blur-sm',
            isFocused && !error && 'opacity-100'
          )} />
          
          {/* Error glow effect */}
          <div className={cn(
            'absolute inset-0 rounded-xl bg-gradient-to-r from-error-400/10 to-error-500/10 opacity-0 transition-opacity duration-200 pointer-events-none blur-sm',
            error && 'opacity-100'
          )} />
        </div>
        
        {error && (
          <p className="mt-2 text-sm text-error-500 font-medium animate-in slide-in-from-top-1 duration-200">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }