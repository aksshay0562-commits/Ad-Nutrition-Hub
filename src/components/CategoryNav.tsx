import React from 'react';
import { CATEGORIES, CategoryType } from '../types';

interface CategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'All': return '🔥';
      case 'Whey Protein': return '🥛';
      case 'Mass Gainer': return '💪';
      case 'Creatine': return '⚡';
      case 'Pre-Workout': return '🚀';
      case 'BCAA / EAA': return '🧪';
      case 'Vitamins & Minerals': return '💊';
      case 'Weight Gain Supplements': return '⚖️';
      case 'Fitness Accessories': return '🏋️';
      case 'Maximum Strength': return '💥';
      case 'Dietary Supplements': return '🌿';
      default: return '📦';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none no-scrollbar">
        {CATEGORIES.map((category) => {
          const count = categoryCounts[category] || 0;
          const isSelected = selectedCategory === category;
          const icon = getCategoryIcon(category);

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                isSelected
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 scale-102 font-bold'
                  : 'bg-neutral-900/90 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
              id={`category-tab-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            >
              <span className="text-base leading-none">{icon}</span>
              <span>{category}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  isSelected
                    ? 'bg-neutral-950/20 text-neutral-950'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
