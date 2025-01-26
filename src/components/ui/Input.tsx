// src/components/ui/Input.tsx
import { FC, InputHTMLAttributes } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: FC<InputProps> = ({ 
  label,
  className,
  ...props 
}) => {
  const theme = useTheme();
  
  const inputClasses = clsx(
    'w-full px-4 py-2 rounded-md',
    // Add a slightly darker border and subtle shadow
    'border border-purple-300',
    'shadow-sm',
    theme.input.focus,
    theme.input.background,
    className
  );

  return (
    <div>
      {label && (
        <label className={`block text-sm font-medium text-${theme.colors.text.secondary} mb-2`}>
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
    </div>
  );
};