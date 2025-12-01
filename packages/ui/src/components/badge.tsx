import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-emerald-500 text-white',
        warning: 'border-transparent bg-amber-500 text-white',
        // Difficulty badges
        beginner: 'border-transparent bg-emerald-500/20 text-emerald-700',
        intermediate: 'border-transparent bg-amber-500/20 text-amber-700',
        advanced: 'border-transparent bg-red-500/20 text-red-700',
        // Category badges
        strength: 'border-transparent bg-red-500/20 text-red-700',
        cardio: 'border-transparent bg-blue-500/20 text-blue-700',
        hiit: 'border-transparent bg-orange-500/20 text-orange-700',
        yoga: 'border-transparent bg-violet-500/20 text-violet-700',
        pilates: 'border-transparent bg-pink-500/20 text-pink-700',
        stretching: 'border-transparent bg-emerald-500/20 text-emerald-700',
        dance: 'border-transparent bg-amber-500/20 text-amber-700',
        // XP badges
        xp: 'border-transparent bg-violet-500/20 text-violet-700',
        // Medal badges
        bronze: 'border-transparent bg-amber-700/20 text-amber-800',
        silver: 'border-transparent bg-slate-400/20 text-slate-600',
        gold: 'border-transparent bg-yellow-500/20 text-yellow-700',
        platinum: 'border-transparent bg-slate-600/20 text-slate-700',
        // Premium badge
        premium: 'border-transparent bg-gradient-to-r from-violet-500 to-purple-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Streak Badge
interface StreakBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  streak: number;
}

function StreakBadge({ streak, className, ...props }: StreakBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-sm font-bold text-white',
        className
      )}
      {...props}
    >
      <span>🔥</span>
      <span>{streak}일 연속</span>
    </div>
  );
}

// Level Badge
interface LevelBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  level: number;
  title?: string;
}

function LevelBadge({ level, title, className, ...props }: LevelBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-3 py-1 text-sm font-bold text-white',
        className
      )}
      {...props}
    >
      <span>Lv.{level}</span>
      {title && <span className="text-white/80">{title}</span>}
    </div>
  );
}

export { Badge, badgeVariants, StreakBadge, LevelBadge };
