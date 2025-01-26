// src/components/ui/Button.tsx
import { FC, ButtonHTMLAttributes } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: FC<ButtonProps> = ({ 
  variant = 'primary',
  disabled,
  className,
  children,
  ...props 
}) => {
  const theme = useTheme();
  
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';
  const variantClasses = disabled 
    ? theme.button.disabled
    : theme.button[variant];

  return (
    <button
      className={clsx(
        baseClasses, 
        variantClasses, 
        // Add text-white to maintain white text in all states
        variant === 'primary' && 'text-white',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};