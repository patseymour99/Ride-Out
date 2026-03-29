import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-brand-card border border-brand-border rounded-xl ${onClick ? 'cursor-pointer hover:border-brand-orange/50 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
