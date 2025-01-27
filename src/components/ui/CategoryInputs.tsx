// src/components/ui/CategoryInputs.tsx
import { FC } from 'react';

interface CategoryInputsProps {
  category1: string;
  setCategory1: (value: string) => void;
  category2: string;
  setCategory2: (value: string) => void;
}

export const CategoryInputs: FC<CategoryInputsProps> = ({ 
  category1, 
  setCategory1, 
  category2, 
  setCategory2 
}) => {
  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-[#581C87] mb-2">
        Personalisation Categories (optional)
      </label>
      
      <div className="flex gap-4">
        <input
          type="text"
          value={category1}
          onChange={(e) => setCategory1(e.target.value)}
          placeholder="Category #1"
          className="w-full px-4 py-2 rounded-md border border-purple-300 bg-purple-50 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        
        <input
          type="text"
          value={category2}
          onChange={(e) => setCategory2(e.target.value)}
          placeholder="Category #2"
          className="w-full px-4 py-2 rounded-md border border-purple-300 bg-purple-50 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
    </div>
  );
};