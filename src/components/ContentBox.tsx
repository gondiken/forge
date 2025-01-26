// src/components/ContentBox.tsx
import { FC, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Check, Copy } from 'lucide-react';
import clsx from 'clsx';

interface ContentBoxProps {
  title: string;
  content: string;
  className?: string;
}

export const ContentBox: FC<ContentBoxProps> = ({ 
  title, 
  content,
  className 
}) => {
  // Access our theme context
  const theme = useTheme();
  
  // State for copy feedback
  const [copied, setCopied] = useState(false);

  // Handle copy functionality with visual feedback
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      // Reset the copied state after 1 second
      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  // Compute the container classes based on theme
  const containerClasses = clsx(
    // Base layout styles
    'rounded-md p-4',
    // Theme-based background and border
    `bg-${theme.colors.background}`,
    `border border-${theme.colors.border}`,
    // Allow additional classes to be passed in
    className
  );

  // Compute the icon button classes based on theme and state
  const iconButtonClasses = clsx(
    // Base button styles
    'p-1 rounded transition-all duration-200',
    // Theme-based colors for different states
    copied
      ? 'text-green-600'
      : clsx(
          `text-${theme.colors.text.secondary}`,
          `hover:text-${theme.colors.text.primary}`,
          `hover:bg-${theme.colors.background}`
        )
  );

  return (
    <div className={containerClasses}>
      {/* Header with title and copy button */}
      <div className="flex justify-between items-center mb-2">
        <h4 className={`font-medium text-${theme.colors.text.primary}`}>
          {title}
        </h4>
        
        {/* Copy button with icon that changes based on state */}
        <button
          onClick={handleCopy}
          className={iconButtonClasses}
          aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? (
            <Check className="h-5 w-5" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Content area */}
      <div className={`text-sm text-${theme.colors.text.secondary}`}>
        {content}
      </div>
    </div>
  );
};