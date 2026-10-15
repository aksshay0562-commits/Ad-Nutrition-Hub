import { STORE_INFO, StoreInfo } from '../types';

export const STORE_CONFIG_STORAGE_KEY = 'ad_nutrition_custom_store_config_v1';
export const STORE_CONFIG_UPDATED_EVENT = 'ad_nutrition_store_config_updated';

export interface GoogleSiteConfig {
  googleSiteUrl: string;
  googleMapsUrl: string;
  googleBusinessUrl: string;
  googleRating: number;
  googleReviewsCount: number;
  googleSearchTitle: string;
  googleSearchDescription: string;
  siteKeywords: string[];
}

export const DEFAULT_GOOGLE_CONFIG: GoogleSiteConfig = {
  googleSiteUrl: "",
  googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandi+Mor+Israna+Panipat+Haryana",
  googleBusinessUrl: "https://maps.google.com/?q=AD+Nutrition+Hub+Israna+Mandi+Mor+Panipat",
  googleRating: 4.9,
  googleReviewsCount: 148,
  googleSearchTitle: "AD Nutrition Hub Israna — 100% Genuine Nutrition & Supplements",
  googleSearchDescription: "Premier authentic fitness and bodybuilding supplement store at Mandi Mor, Israna, Panipat (Haryana). Whey protein, gainers, creatine, pre-workout with fast WhatsApp orders.",
  siteKeywords: [
    "AD Nutrition Hub Israna",
    "Nutrition store Israna",
    "Protein shop Panipat",
    "Genuine whey protein Israna",
    "Gym supplements Mandi Mor",
    "Akshay Malik AD Nutrition"
  ]
};

/**
 * Loads current store info merged with user-defined Google site and store config from localStorage
 */
export function getActiveStoreConfig(): StoreInfo & GoogleSiteConfig {
  if (typeof window === 'undefined') {
    return {
      ...STORE_INFO,
      ...DEFAULT_GOOGLE_CONFIG,
      googleSiteUrl: ""
    };
  }

  try {
    const raw = localStorage.getItem(STORE_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure any removed google site link is scrubbed
      if (parsed.googleSiteUrl && parsed.googleSiteUrl.includes('sites.google.com')) {
        parsed.googleSiteUrl = "";
      }
      return {
        ...STORE_INFO,
        ...DEFAULT_GOOGLE_CONFIG,
        ...parsed,
        googleSiteUrl: parsed.googleSiteUrl || "",
        payment: {
          ...STORE_INFO.payment,
          ...(parsed.payment || {})
        },
        hours: {
          ...STORE_INFO.hours,
          ...(parsed.hours || {})
        }
      };
    }
  } catch (err) {
    console.warn('Could not load custom store config from localStorage:', err);
  }

  return {
    ...STORE_INFO,
    ...DEFAULT_GOOGLE_CONFIG
  };
}

/**
 * Saves customized store and Google site settings
 */
export function saveActiveStoreConfig(updates: Partial<StoreInfo & GoogleSiteConfig>): StoreInfo & GoogleSiteConfig {
  const current = getActiveStoreConfig();
  const merged: StoreInfo & GoogleSiteConfig = {
    ...current,
    ...updates,
    hours: {
      ...current.hours,
      ...(updates.hours || {})
    }
  };

  try {
    localStorage.setItem(STORE_CONFIG_STORAGE_KEY, JSON.stringify(merged));
    // Dispatch cross-component event
    window.dispatchEvent(new CustomEvent(STORE_CONFIG_UPDATED_EVENT, { detail: merged }));
  } catch (err) {
    console.error('Failed to save store config:', err);
  }

  return merged;
}

/**
 * Resets store config back to factory defaults
 */
export function resetActiveStoreConfig(): StoreInfo & GoogleSiteConfig {
  try {
    localStorage.removeItem(STORE_CONFIG_STORAGE_KEY);
    const defaults = {
      ...STORE_INFO,
      ...DEFAULT_GOOGLE_CONFIG
    };
    window.dispatchEvent(new CustomEvent(STORE_CONFIG_UPDATED_EVENT, { detail: defaults }));
    return defaults;
  } catch {
    return {
      ...STORE_INFO,
      ...DEFAULT_GOOGLE_CONFIG
    };
  }
}
