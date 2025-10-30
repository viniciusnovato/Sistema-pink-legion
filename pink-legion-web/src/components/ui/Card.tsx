import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient' | 'glass'
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = true, ...props }, ref) => {
    const variants = {
      default: 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-soft hover:shadow-medium',
      elevated: 'bg-gradient-to-br from-surface-light via-white to-surface-light/95 dark:from-surface-dark dark:via-surface-dark/90 dark:to-surface-dark/95 shadow-medium hover:shadow-strong border border-border-light/30 dark:border-border-dark/30 backdrop-blur-sm',
      outlined: 'bg-gradient-to-br from-transparent via-primary-50/20 to-transparent dark:from-transparent dark:via-primary-900/10 dark:to-transparent border-2 border-primary-300/60 dark:border-primary-600/60 hover:border-primary-400/80 dark:hover:border-primary-500/80 shadow-soft hover:shadow-medium',
      gradient: 'bg-gradient-to-br from-primary-50 via-white to-primary-100/50 dark:from-primary-900/20 dark:via-surface-dark dark:to-primary-800/20 border border-primary-200/50 dark:border-primary-700/50 shadow-medium hover:shadow-strong',
      glass: 'bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-medium hover:shadow-strong'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'group relative rounded-2xl p-6 transition-all duration-200 overflow-hidden',
          variants[variant],
          hover && 'transform hover:scale-[1.01] hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-400/5 via-transparent to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        
        {/* Content wrapper */}
        <div className="relative z-10">
          {props.children}
        </div>
      </div>
    )
  }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-3 pb-4 border-b border-border-light/20 dark:border-border-dark/20 mb-6', className)}
      {...props}
    />
  )
)

CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-xl font-bold leading-tight tracking-tight text-neutral-900 dark:text-text-primary-dark transition-colors duration-200',
        className
      )}
      {...props}
    />
  )
)

CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed', className)}
      {...props}
    />
  )
)

CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-0 space-y-4', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between pt-4 mt-6 border-t border-border-light/20 dark:border-border-dark/20', className)}
      {...props}
    />
  )
)

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }