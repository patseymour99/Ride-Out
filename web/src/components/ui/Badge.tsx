import React from 'react';

type BadgeVariant = 'orange' | 'green' | 'blue' | 'red' | 'muted';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  orange: 'bg-brand-orange/20 text-brand-orange border-brand-orange/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  muted: 'bg-brand-surface text-brand-muted border-brand-border',
};

export function Badge({ children, variant = 'muted', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
