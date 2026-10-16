/**
 * Popular Searches & Catalog Search Tracker Service
 * Tracks user search queries in localStorage, ranks the most searched supplement terms,
 * and broadcasts updates for the Popular Searches list in the catalog search bar.
 */

export interface PopularSearchItem {
  term: string;
  normalized: string;
  count: number;
  lastSearchedAt: number;
  badge?: string;
}

const STORAGE_KEY = 'ad_nutrition_popular_searches_v1';
export const POPULAR_SEARCHES_UPDATED_EVENT = 'ad_nutrition_popular_searches_updated';

// Default trending supplement searches for AD Nutrition Hub Israna
export const DEFAULT_POPULAR_SEARCHES: PopularSearchItem[] = [
  { term: 'Whey Protein', normalized: 'whey protein', count: 48, lastSearchedAt: Date.now() - 3600000 * 2, badge: '🔥 Top Seller' },
  { term: 'Creatine', normalized: 'creatine', count: 41, lastSearchedAt: Date.now() - 3600000 * 3, badge: '⚡ High Demand' },
  { term: 'Mass Gainer', normalized: 'mass gainer', count: 35, lastSearchedAt: Date.now() - 3600000 * 5 },
  { term: 'Pre-Workout', normalized: 'pre-workout', count: 28, lastSearchedAt: Date.now() - 3600000 * 7 },
  { term: 'Fish Oil & Omega 3', normalized: 'fish oil & omega 3', count: 22, lastSearchedAt: Date.now() - 3600000 * 12 },
  { term: 'Multivitamins', normalized: 'multivitamins', count: 18, lastSearchedAt: Date.now() - 3600000 * 16 },
  { term: 'Peanut Butter', normalized: 'peanut butter', count: 14, lastSearchedAt: Date.now() - 3600000 * 24 }
];

/**
 * Get current popular searches from localStorage, fallback to defaults
 */
export function getPopularSearches(limit: number = 7): PopularSearchItem[] {
  if (typeof window === 'undefined') {
    return DEFAULT_POPULAR_SEARCHES.slice(0, limit);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sort by search count descending, then by recent timestamp
        const sorted = [...parsed].sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return b.lastSearchedAt - a.lastSearchedAt;
        });
        return sorted.slice(0, limit);
      }
    }
  } catch (err) {
    console.warn('Could not read popular searches from localStorage:', err);
  }

  // Initialize storage with defaults if not present
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POPULAR_SEARCHES));
  } catch {
    // Ignore storage quota errors
  }

  return DEFAULT_POPULAR_SEARCHES.slice(0, limit);
}

/**
 * Capitalizes search terms cleanly for UI display
 */
function formatSearchTerm(term: string): string {
  const words = term.trim().split(/\s+/);
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Records a search term in local storage tracker.
 * Increments count if already searched, or adds new entry.
 */
export function recordSearch(term: string): PopularSearchItem[] {
  if (!term || typeof window === 'undefined') return getPopularSearches();

  const trimmed = term.trim();
  // Don't track trivial single characters or ultra long queries
  if (trimmed.length < 2 || trimmed.length > 50) {
    return getPopularSearches();
  }

  const normalized = trimmed.toLowerCase();

  try {
    const currentList: PopularSearchItem[] = (() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      return [...DEFAULT_POPULAR_SEARCHES];
    })();

    const existingIndex = currentList.findIndex(
      item => item.normalized === normalized || item.normalized.includes(normalized) || normalized.includes(item.normalized)
    );

    if (existingIndex >= 0) {
      const item = currentList[existingIndex];
      item.count += 1;
      item.lastSearchedAt = Date.now();
      // Keep best capitalization
      if (trimmed.length > item.term.length && !item.term.includes(' ')) {
        item.term = formatSearchTerm(trimmed);
      }
    } else {
      currentList.push({
        term: formatSearchTerm(trimmed),
        normalized,
        count: 1,
        lastSearchedAt: Date.now()
      });
    }

    // Keep top 30 items to prevent local storage bloat
    currentList.sort((a, b) => b.count - a.count);
    const trimmedList = currentList.slice(0, 30);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedList));

    // Dispatch update event
    window.dispatchEvent(new CustomEvent(POPULAR_SEARCHES_UPDATED_EVENT, { detail: trimmedList }));

    return trimmedList;
  } catch (err) {
    console.error('Failed to record search term in localStorage:', err);
    return getPopularSearches();
  }
}

/**
 * Clears search history and resets back to store trending defaults
 */
export function resetPopularSearches(): PopularSearchItem[] {
  if (typeof window === 'undefined') return DEFAULT_POPULAR_SEARCHES;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POPULAR_SEARCHES));
    window.dispatchEvent(new CustomEvent(POPULAR_SEARCHES_UPDATED_EVENT, { detail: DEFAULT_POPULAR_SEARCHES }));
    return DEFAULT_POPULAR_SEARCHES;
  } catch (err) {
    console.error('Failed to reset popular searches:', err);
    return DEFAULT_POPULAR_SEARCHES;
  }
}

/**
 * Removes a single search term from the list
 */
export function removePopularSearch(termToRemove: string): PopularSearchItem[] {
  if (typeof window === 'undefined') return DEFAULT_POPULAR_SEARCHES;
  try {
    const currentList = getPopularSearches(30);
    const filtered = currentList.filter(
      item => item.normalized !== termToRemove.toLowerCase().trim() && item.term !== termToRemove
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent(POPULAR_SEARCHES_UPDATED_EVENT, { detail: filtered }));
    return filtered;
  } catch (err) {
    console.error('Failed to remove popular search:', err);
    return getPopularSearches();
  }
}
