import React, { useState, useEffect } from 'react';
import { Flame, TrendingUp, Sparkles, X, RotateCcw } from 'lucide-react';
import { 
  PopularSearchItem, 
  getPopularSearches, 
  recordSearch, 
  resetPopularSearches, 
  removePopularSearch,
  POPULAR_SEARCHES_UPDATED_EVENT 
} from '../services/popularSearchService';
import { triggerHaptic } from '../utils/haptics';

interface PopularSearchesProps {
  currentSearchQuery: string;
  onSelectSearch: (term: string) => void;
  onClearSearch?: () => void;
  className?: string;
}

export const PopularSearches: React.FC<PopularSearchesProps> = ({
  currentSearchQuery,
  onSelectSearch,
  onClearSearch,
  className = ''
}) => {
  const [popularSearches, setPopularSearches] = useState<PopularSearchItem[]>(() => getPopularSearches(7));
  const [showManage, setShowManage] = useState(false);

  // Sync with localStorage updates across components
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PopularSearchItem[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setPopularSearches(customEvent.detail.slice(0, 7));
      } else {
        setPopularSearches(getPopularSearches(7));
      }
    };

    window.addEventListener(POPULAR_SEARCHES_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(POPULAR_SEARCHES_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const handleChipClick = (item: PopularSearchItem) => {
    triggerHaptic('light');
    const isAlreadySelected = currentSearchQuery.toLowerCase().trim() === item.normalized;

    if (isAlreadySelected) {
      if (onClearSearch) {
        onClearSearch();
      } else {
        onSelectSearch('');
      }
    } else {
      onSelectSearch(item.term);
      recordSearch(item.term);
    }
  };

  const handleRemove = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    triggerHaptic('light');
    const updated = removePopularSearch(term);
    setPopularSearches(updated.slice(0, 7));
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    const defaults = resetPopularSearches();
    setPopularSearches(defaults.slice(0, 7));
    setShowManage(false);
  };

  if (popularSearches.length === 0) return null;

  return (
    <div 
      className={`pt-2 border-t border-neutral-800/80 ${className}`} 
      id="popular-searches-container"
      role="region"
      aria-label="Popular searches"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 fill-amber-500/30 text-amber-400" />
            <span>Popular Searches:</span>
          </div>
          <span className="text-[10px] text-neutral-500 hidden sm:inline">
            (Saved locally based on top searches)
          </span>
        </div>

        {/* Small manage toggle */}
        <div className="flex items-center gap-2">
          {showManage ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                title="Reset to default trending supplements"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={() => setShowManage(false)}
                className="text-[10px] text-neutral-400 hover:text-white px-1 font-medium"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowManage(true)}
              className="text-[10.5px] text-neutral-500 hover:text-neutral-300 transition-colors"
              title="Manage popular search terms"
            >
              Manage
            </button>
          )}
        </div>
      </div>

      {/* Popular Search Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar flex-wrap sm:flex-nowrap">
        {popularSearches.map((item) => {
          const isSelected = currentSearchQuery.toLowerCase().trim() === item.normalized;

          return (
            <button
              key={item.normalized}
              type="button"
              onClick={() => handleChipClick(item)}
              className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 shrink-0 select-none cursor-pointer border ${
                isSelected
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md shadow-amber-500/20 font-bold'
                  : 'bg-neutral-950/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
              }`}
              title={`Searched ${item.count} times. Click to ${isSelected ? 'clear filter' : `filter by ${item.term}`}`}
            >
              <TrendingUp className={`w-3 h-3 ${isSelected ? 'text-neutral-950' : 'text-amber-400/80 group-hover:text-amber-400'}`} />
              <span>{item.term}</span>

              {/* Count / Badge */}
              <span className={`text-[10px] px-1 py-0.2 rounded ${
                isSelected 
                  ? 'bg-neutral-900/30 text-neutral-950 font-black' 
                  : 'bg-neutral-900 text-neutral-400 group-hover:text-amber-300 font-mono'
              }`}>
                {item.count > 1 ? item.count : 'New'}
              </span>

              {/* Remove button in manage mode */}
              {showManage && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleRemove(e, item.term)}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 transition-colors"
                  title={`Remove "${item.term}" from popular searches`}
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
