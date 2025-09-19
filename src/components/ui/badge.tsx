// Badge Component for RLS Guard Dog
// Created: September 19, 2025
// Description: Reusable badge component for status indicators and labels

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border border-input',
        success: 'border-transparent bg-green-100 text-green-800',
        warning: 'border-transparent bg-yellow-100 text-yellow-800',
        info: 'border-transparent bg-blue-100 text-blue-800',
        grade: 'border-transparent text-white font-bold',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  grade?: number; // For grade-specific styling
}

function Badge({ className, variant, size, grade, children, ...props }: BadgeProps) {
  // Special handling for grade badges
  if (variant === 'grade' && typeof grade === 'number') {
    let gradeColor = '';
    if (grade >= 90) gradeColor = 'bg-green-600';
    else if (grade >= 80) gradeColor = 'bg-blue-600';
    else if (grade >= 70) gradeColor = 'bg-yellow-600';
    else if (grade >= 60) gradeColor = 'bg-orange-600';
    else gradeColor = 'bg-red-600';
    
    return (
      <div
        className={cn(
          badgeVariants({ variant, size }),
          gradeColor,
          className
        )}
        {...props}
      >
        {children || `${grade}%`}
      </div>
    );
  }

  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge, badgeVariants };