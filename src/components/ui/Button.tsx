// src/components/ui/Button.tsx
import { FC, ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export const Button: FC<ButtonProps> = ({ 
  isLoading, 
  loadingText, 
  children, 
  className, 
  disabled,
  ...props 
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        "flex-1 self-end px-6 py-2 bg-[#9333EA] text-white rounded-xl font-medium text-lg",
        "hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500",
        "disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center text-white">
          <svg 
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
};