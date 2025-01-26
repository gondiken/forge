// src/components/ContentBox.tsx
import { FC, useState } from 'react';

interface ContentBoxProps {
  title: string;
  content: string;
}

export const ContentBox: FC<ContentBoxProps> = ({ title, content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000); // Reset after 1 second
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-gray-50 rounded-md p-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium">{title}</h4>
        <button
          onClick={handleCopy}
          className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-200 rounded transition-all duration-200"
        >
          {copied ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-green-600"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
              />
            </svg>
          )}
        </button>
      </div>
      <div className="text-sm text-gray-800">
        {content}
      </div>
    </div>
  );
};