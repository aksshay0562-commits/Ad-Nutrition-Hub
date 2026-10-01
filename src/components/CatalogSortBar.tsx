import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowDownWideNarrow, 
  ArrowUpNarrowWide, 
  Flame, 
  BadgePercent, 
  Sparkles, 
  RotateCcw, 
  Check, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export type ProductSortOption = 'default' | 'popularity' | 'low-to-high' | 'high-to-low' | 'discount';

export interface SortOptionMeta {
  id: ProductSortOption;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

export const SORT_OPTIONS: SortOptionMeta[] = [
  {
    id: 'popularity',
    label: 'Most Popular & Trending',
    shortLabel: 'Popularity',
    icon: <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />,
    description: 'Bestsellers, most viewed & high customer demand',
    badge: 'Trending',
  },
  {
    id: 'low-to-high',
    label: 'Price: Low to High',
    shortLabel: 'Price: Low → High',
    icon: <ArrowUpNarrowWide className="w-3.5 h-3.5 text-emerald-400" />,
    description: 'Budget-friendly deals & student options first',
    badge: 'Cheapest',
  },
  {
    id: 'high-to-low',
    label: 'Price: High to Low',
    shortLabel: 'Price: High → Low',
    icon: <ArrowDownWideNarrow className="w-3.5 h-3.5 text-cyan-400" />,
    description: 'Bulk 5kg gainers, imported isolates & complete stacks',
    badge: 'Premium',
  },
  {
    id: 'discount',
    label: 'Biggest Savings & Deals',
    shortLabel: 'Top Deals',
    icon: <BadgePercent className="w-3.5 h-3.5 text-rose-400" />,
    description: 'Maximum discounts and rupee savings first',
    badge: 'Max % Off',
  },
  {
    id: 'default',
    label: 'Default Curated',
    shortLabel: 'Curated',
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
    description: 'Original balanced store showcase',
  },
];

interface CatalogSortBarProps {
  currentSort: ProductSortOption;
  onSelectSort: (sort: ProductSortOption) => void;
  totalFilteredCount: number;
  totalCatalogCount: number;
  selectedCategory: string;
  stockFilter: 'all' | 'in-stock' | 'out-of-stock';
  searchQuery: string;
  onResetFilters: () => void;
  className?: string;
}

export const CatalogSortBar: React.FC<CatalogSortBarProps> = ({
  currentSort,
  onSelectSort,
  totalFilteredCount,
  totalCatalogCount,
  selectedCategory,
  stockFilter,
  searchQuery,
  onResetFilters,
  className = '',
}) => {
  const activeSortMeta = SORT_OPTIONS.find((s) => s.id === currentSort) || SORT_OPTIONS[4];
  const isCustomSortActive = currentSort !== 'default';
  const hasActiveFilters = selectedCategory !== 'All' || searchQuery !== '' || stockFilter !== 'all' || isCustomSortActive;

  const handleSortChange = (newSort: ProductSortOption) => {
    triggerHaptic('light');
    onSelectSort(newSort);
  };

  return (
    <div 
      className={`rounded-2xl bg-neutral-900/80 border border-neutral-800 p-3 sm:p-4 space-y-3 shadow-md backdrop-blur-sm ${className}`}
      id="catalog-sort-bar-container"
    >
      {/* Top Row: Sort Label + Quick Chips on Desktop/Tablet + Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Side: Active Sorting Label */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase font-extrabold tracking-wider text-neutral-300">
                Sort Supplements By:
              </span>
              {isCustomSortActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <span>{activeSortMeta.shortLabel}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSortChange('default');
                    }}
                    className="hover:text-white cursor-pointer ml-0.5"
                    title="Reset sort to default"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              {activeSortMeta.description}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Sort Segmented Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {SORT_OPTIONS.map((option) => {
            const isSelected = currentSort === option.id;
            return (
              <motion.button
                key={option.id}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSortChange(option.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-neutral-800 text-white border-amber-400/80 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30'
                    : 'bg-neutral-950/70 hover:bg-neutral-800/60 text-neutral-400 hover:text-neutral-200 border-neutral-800'
                }`}
                id={`sort-btn-${option.id}`}
                title={option.description}
              >
                <span>{option.icon}</span>
                <span>{option.shortLabel}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Bar & Active Filters Line */}
      <div className="pt-2 border-t border-neutral-800/70 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>
            Showing <strong className="text-white font-bold">{totalFilteredCount}</strong> of {totalCatalogCount} items
          </span>

          {selectedCategory !== 'All' && (
            <>
              <span className="text-neutral-600">•</span>
              <span>Category: <strong className="text-amber-400">{selectedCategory}</strong></span>
            </>
          )}

          {searchQuery && (
            <>
              <span className="text-neutral-600">•</span>
              <span>Search: <strong className="text-amber-300">"{searchQuery}"</strong></span>
            </>
          )}

          {stockFilter !== 'all' && (
            <>
              <span className="text-neutral-600">•</span>
              <span className={stockFilter === 'in-stock' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {stockFilter === 'in-stock' ? '🟢 In Stock' : '🔴 Out of Stock'}
              </span>
            </>
          )}

          <span className="text-neutral-600">•</span>
          <span className="text-neutral-300">
            Sorted: <strong className="text-amber-400 font-bold">{activeSortMeta.label}</strong>
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onResetFilters();
            }}
            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold hover:underline transition-colors cursor-pointer"
            id="catalog-reset-filters-btn"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters & Sort</span>
          </button>
        )}
      </div>
    </div>
  );
};
