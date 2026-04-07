import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ 
  children, 
  hover = false, 
  padding = 'md',
  className = '',
  ...props 
}: CardProps) {
  const baseClasses = 'bg-white rounded-card shadow-card';
  const hoverClasses = hover 
    ? 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer' 
    : '';
  
  const classes = `${baseClasses} ${hoverClasses} ${paddingClasses[padding]} ${className}`.trim();

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
