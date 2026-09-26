import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Filter, Sparkles, Check, Clock, Tag } from 'lucide-react';
import { CATEGORIES } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface CategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalProductsCount?: number;
}

interface CategoryMeta {
  id: string;
  shortLabel: string;
  fullCategory: string;
  icon: string;
  variant?: 'default' | 'sale' | 'new';
  badgeLabel?: string;
}

const CATEGORY_METADATA: CategoryMeta[] = [
  { id: 'All', shortLabel: 'All Products', fullCategory: 'All', icon: '🔥', variant: 'default' },
  { id: 'On Sale', shortLabel: 'On Sale', fullCategory: 'On Sale', icon: '🏷️', variant: 'sale', badgeLabel: 'Sale' },
  { id: 'New Arrivals', shortLabel: 'New Arrivals', fullCategory: 'New Arrivals', icon: '✨', variant: 'new', badgeLabel: '7d' },
  { id: 'Whey Protein', shortLabel: 'Protein', fullCategory: 'Whey Protein', icon: '🥛', variant: 'default' },
  { id: 'Mass Gainer', shortLabel: 'Gainers', fullCategory: 'Mass Gainer', icon: '💪', variant: 'default' },
  { id: 'Creatine', shortLabel: 'Creatine', fullCategory: 'Creatine', icon: '⚡', variant: 'default' },
  { id: 'Pre-Workout', shortLabel: 'Pre-Workout', fullCategory: 'Pre-Workout', icon: '🚀', variant: 'default' },
  { id: 'BCAA / EAA', shortLabel: 'Amino / BCAA', fullCategory: 'BCAA / EAA', icon: '🧪', variant: 'default' },
  { id: 'Vitamins & Minerals', shortLabel: 'Vitamins', fullCategory: 'Vitamins & Minerals', icon: '💊', variant: 'default' },
  { id: 'Fitness Accessories', shortLabel: 'Accessories', fullCategory: 'Fitness Accessories', icon: '🏋️', variant: 'default' },
  { id: 'Weight Gain Supplements', shortLabel: 'Weight Gain', fullCategory: 'Weight Gain Supplements', icon: '⚖️', variant: 'default' },
  { id: 'Maximum Strength', shortLabel: 'Strength', fullCategory: 'Maximum Strength', icon: '💥', variant: 'default' },
  { id: 'Dietary Supplements', shortLabel: 'Dietary', fullCategory: 'Dietary Supplements', icon: '🌿', variant: 'default' },
];

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalProductsCount
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activePillRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position to show/hide left and right arrow buttons & fade gradients
  const updateScrollButtons = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, []);

  // Smoothly center the active pill in the horizontal container when category changes
  useEffect(() => {
    if (activePillRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const pill = activePillRef.current;

      const pillLeft = pill.offsetLeft;
      const pillWidth = pill.offsetWidth;
      const containerWidth = container.offsetWidth;

      const targetScroll = pillLeft - (containerWidth / 2) + (pillWidth / 2);

      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    }
    updateScrollButtons();
  }, [selectedCategory]);

  const handleScroll = (direction: 'left' | 'right') => {
    triggerHaptic('light');
    if (!scrollContainerRef.current) return;
    const scrollAmount = 240;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handlePillClick = (category: string) => {
    triggerHaptic('light');
    onSelectCategory(category);
  };

  return (
    <div className="w-full relative group/strip" id="category-filter-strip">
      {/* Strip Header Info */}
      <div className="flex items-center justify-between gap-3 mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Filter className="w-3 h-3" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Filter by Category
          </span>
          {selectedCategory === 'On Sale' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10.5px] font-extrabold uppercase">
              <Tag className="w-3 h-3 text-rose-400 animate-pulse" />
              <span>Discount Deals & Price Drops</span>
            </span>
          ) : selectedCategory === 'New Arrivals' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10.5px] font-extrabold uppercase">
              <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Added in Last 7 Days</span>
            </span>
          ) : selectedCategory !== 'All' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{selectedCategory}</span>
            </span>
          ) : null}
        </div>

        {/* Scroll Helper Arrows (Desktop & Tablet) */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-neutral-400">
          <span className="text-[11px] text-neutral-500 mr-1">Swipe or scroll</span>
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            className={`p-1.5 rounded-lg border transition-all ${
              canScrollLeft
                ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:text-white hover:bg-neutral-800 cursor-pointer shadow-sm'
                : 'bg-neutral-950/60 border-neutral-900 text-neutral-600 opacity-40 cursor-not-allowed'
            }`}
            aria-label="Scroll categories left"
            id="category-scroll-left-btn"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            className={`p-1.5 rounded-lg border transition-all ${
              canScrollRight
                ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:text-white hover:bg-neutral-800 cursor-pointer shadow-sm'
                : 'bg-neutral-950/60 border-neutral-900 text-neutral-600 opacity-40 cursor-not-allowed'
            }`}
            aria-label="Scroll categories right"
            id="category-scroll-right-btn"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Strip Container with Gradient Fade Masks */}
      <div className="relative">
        {/* Left Fade Gradient Mask */}
        <div 
          className={`absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-r from-neutral-950 to-transparent transition-opacity duration-200 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`} 
        />

        {/* Right Fade Gradient Mask */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-l from-neutral-950 to-transparent transition-opacity duration-200 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`} 
        />

        {/* Scrollable Pills Strip */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 px-0.5 scrollbar-none no-scrollbar scroll-smooth"
          id="category-pills-horizontal-strip"
        >
          {CATEGORY_METADATA.map((item) => {
            const count = categoryCounts[item.fullCategory] || 0;
            const isSelected = selectedCategory === item.fullCategory;

            // Class styles depending on variant (sale, new, default)
            let pillClass = 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700';
            let badgeClass = 'bg-neutral-800 text-neutral-400 group-hover:text-neutral-200 group-hover:bg-neutral-700';
            let tagClass = 'bg-neutral-800/80 text-neutral-400';

            if (isSelected) {
              if (item.variant === 'sale') {
                pillClass = 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 text-white shadow-lg shadow-red-500/30 ring-2 ring-rose-400/60 scale-[1.03] font-black';
                badgeClass = 'bg-neutral-950/40 text-white';
                tagClass = 'bg-neutral-950/30 text-white';
              } else if (item.variant === 'new') {
                pillClass = 'bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/60 scale-[1.03] font-black';
                badgeClass = 'bg-neutral-950 text-amber-300 shadow-sm';
                tagClass = 'bg-neutral-950/20 text-neutral-950';
              } else {
                pillClass = 'bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50 scale-[1.03] font-black';
                badgeClass = 'bg-neutral-950 text-amber-300 shadow-sm';
                tagClass = 'bg-neutral-950/20 text-neutral-950';
              }
            } else {
              if (item.variant === 'sale') {
                pillClass = 'bg-gradient-to-r from-red-950/60 to-neutral-900 border border-red-500/40 text-red-300 hover:text-red-200 hover:border-red-400 shadow-sm';
                badgeClass = 'bg-red-950 text-red-400 border border-red-800/60';
                tagClass = 'bg-red-500/20 text-red-300 border border-red-500/30';
              } else if (item.variant === 'new') {
                pillClass = 'bg-gradient-to-r from-emerald-950/60 to-neutral-900 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 hover:border-emerald-400 shadow-sm';
                badgeClass = 'bg-emerald-950 text-emerald-400 border border-emerald-800/60';
                tagClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
              }
            }

            return (
              <button
                key={item.fullCategory}
                ref={isSelected ? activePillRef : null}
                type="button"
                onClick={() => handlePillClick(item.fullCategory)}
                className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer select-none ${pillClass}`}
                id={`filter-pill-${item.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                title={`Filter by ${item.fullCategory} (${count} products)`}
              >
                {/* Icon */}
                <span className="text-sm leading-none shrink-0 drop-shadow-sm">
                  {item.icon}
                </span>

                {/* Primary Short Label */}
                <span className="tracking-tight">
                  {item.shortLabel}
                </span>

                {/* Special Tag (e.g. Sale or 7d) */}
                {item.badgeLabel && (
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${tagClass}`}
                  >
                    {item.badgeLabel}
                  </span>
                )}

                {/* Counter Badge */}
                <span
                  className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-black leading-tight transition-colors ${badgeClass}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
