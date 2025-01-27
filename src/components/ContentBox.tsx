// src/components/ContentBox.tsx
import { FC, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import clsx from 'clsx';

interface ContentBoxProps {
  title: string;
  content: string;
  className?: string;
  titleColor?: string;
}

export const ContentBox: FC<ContentBoxProps> = ({ 
  title, 
  content,
  className,
  titleColor = '#581C87' // default to the darker purple
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  return (
    <div className={clsx(
      'rounded-md p-4 bg-purple-50 border border-purple-200',
      className
    )}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium" style={{ color: titleColor }}>
          {title}
        </h4>
        
        <button
          onClick={handleCopy}
          className={clsx(
            'p-1 rounded transition-all duration-200',
            copied ? 'text-green-600' : 'text-purple-600 hover:text-purple-900 hover:bg-purple-100'
          )}
          aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? (
            <Check className="h-5 w-5" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="text-sm text-[#9333EA]">
        {content}
      </div>
    </div>
  );
};