import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-brand-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`
          bg-brand-surface border text-brand-text placeholder-brand-muted
          rounded-lg px-3 py-2.5 w-full
          focus:outline-none focus:ring-1 transition-colors duration-200
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-brand-border focus:border-brand-orange focus:ring-brand-orange'
          }
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-brand-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={`
          bg-brand-surface border text-brand-text placeholder-brand-muted
          rounded-lg px-3 py-2.5 w-full resize-none
          focus:outline-none focus:ring-1 transition-colors duration-200
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-brand-border focus:border-brand-orange focus:ring-brand-orange'
          }
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
