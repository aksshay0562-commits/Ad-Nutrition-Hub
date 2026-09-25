/**
 * Scan Analytics Tracker Service
 * Tracks successful barcode and QR code scans, per-product scan counts,
 * and maintains analytics for the store owner in the admin panel.
 */

import { Product } from '../types';

export interface ProductScanStat {
  productId: string;
  productName: string;
  category: string;
  price: number;
  imageUrl?: string;
  scanCount: number;
  lastScannedAt: number;
}

export interface ScanEvent {
  id: string;
  productId: string;
  productName: string;
  category: string;
  timestamp: number;
  code: string;
}

export interface ScanAnalyticsData {
  totalScans: number;
  lastScannedAt: number | null;
  productStats: Record<string, ProductScanStat>;
  recentEvents: ScanEvent[];
}

const STORAGE_KEY = 'ad_nutrition_scan_analytics_v1';
export const SCAN_ANALYTICS_EVENT = 'ad_nutrition_scan_analytics_updated';

/**
 * Get current scan analytics data
 */
export function getScanAnalytics(): ScanAnalyticsData {
  if (typeof window === 'undefined') {
    return {
      totalScans: 0,
      lastScannedAt: null,
      productStats: {},
      recentEvents: []
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.totalScans === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading scan analytics from storage:', err);
  }

  return {
    totalScans: 0,
    lastScannedAt: null,
    productStats: {},
    recentEvents: []
  };
}

/**
 * Save scan analytics data and notify listeners
 */
function saveScanAnalytics(data: ScanAnalyticsData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(SCAN_ANALYTICS_EVENT, { detail: data }));
  } catch (err) {
    console.error('Error saving scan analytics:', err);
  }
}

/**
 * Record a successful product scan event
 */
export function recordProductScan(
  product: Pick<Product, 'id' | 'name' | 'category' | 'price' | 'imageUrl'>,
  rawCode?: string
): ScanAnalyticsData {
  const current = getScanAnalytics();
  const now = Date.now();

  const productId = product.id || 'unknown';
  const existingStat = current.productStats[productId];

  const updatedStat: ProductScanStat = {
    productId,
    productName: product.name || 'Unknown Product',
    category: product.category || 'Supplements',
    price: product.price || 0,
    imageUrl: product.imageUrl || '',
    scanCount: (existingStat?.scanCount || 0) + 1,
    lastScannedAt: now
  };

  const newEvent: ScanEvent = {
    id: `scan-${now}-${Math.random().toString(36).substring(2, 7)}`,
    productId,
    productName: product.name,
    category: product.category,
    timestamp: now,
    code: rawCode || productId
  };

  const updatedEvents = [newEvent, ...(current.recentEvents || [])].slice(0, 20);

  const updatedData: ScanAnalyticsData = {
    totalScans: (current.totalScans || 0) + 1,
    lastScannedAt: now,
    productStats: {
      ...current.productStats,
      [productId]: updatedStat
    },
    recentEvents: updatedEvents
  };

  saveScanAnalytics(updatedData);
  return updatedData;
}

/**
 * Record a general successful scan (e.g. unknown barcode or JSON package)
 */
export function recordGeneralScan(label: string, rawCode: string): ScanAnalyticsData {
  const current = getScanAnalytics();
  const now = Date.now();

  const newEvent: ScanEvent = {
    id: `scan-${now}-${Math.random().toString(36).substring(2, 7)}`,
    productId: 'generic-barcode',
    productName: label || 'Unlinked Barcode',
    category: 'Packaging Barcode',
    timestamp: now,
    code: rawCode
  };

  const updatedData: ScanAnalyticsData = {
    ...current,
    totalScans: (current.totalScans || 0) + 1,
    lastScannedAt: now,
    recentEvents: [newEvent, ...(current.recentEvents || [])].slice(0, 20)
  };

  saveScanAnalytics(updatedData);
  return updatedData;
}

/**
 * Get sorted list of products by scan count
 */
export function getTopScannedProducts(limit = 10): ProductScanStat[] {
  const data = getScanAnalytics();
  const statsList = Object.values(data.productStats || {});
  return statsList
    .sort((a, b) => b.scanCount - a.scanCount || b.lastScannedAt - a.lastScannedAt)
    .slice(0, limit);
}

/**
 * Clear all scan analytics data
 */
export function clearScanAnalytics(): void {
  const empty: ScanAnalyticsData = {
    totalScans: 0,
    lastScannedAt: null,
    productStats: {},
    recentEvents: []
  };
  saveScanAnalytics(empty);
}

/**
 * Pre-populate initial demo scan analytics if storage is completely uninitialized
 * so the store owner immediately has realistic, insightful data upon first opening.
 */
export function seedInitialScanAnalyticsIfEmpty(products: Product[]): ScanAnalyticsData {
  if (typeof window === 'undefined') {
    return { totalScans: 0, lastScannedAt: null, productStats: {}, recentEvents: [] };
  }

  const existingRaw = localStorage.getItem(STORAGE_KEY);
  if (existingRaw) {
    return getScanAnalytics();
  }

  if (!products || products.length === 0) {
    return getScanAnalytics();
  }

  // Pre-seed 4-6 products with realistic scan counts
  const now = Date.now();
  const sampleCounts = [28, 21, 15, 11, 7, 4];
  const seededStats: Record<string, ProductScanStat> = {};
  const sampleEvents: ScanEvent[] = [];
  let total = 0;

  products.slice(0, sampleCounts.length).forEach((prod, index) => {
    const count = sampleCounts[index];
    total += count;
    const timeOffset = (index + 1) * 35 * 60 * 1000; // minutes ago
    seededStats[prod.id] = {
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      price: prod.price,
      imageUrl: prod.imageUrl,
      scanCount: count,
      lastScannedAt: now - timeOffset
    };

    sampleEvents.push({
      id: `seed-event-${index}`,
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      timestamp: now - timeOffset,
      code: prod.id
    });
  });

  const initialData: ScanAnalyticsData = {
    totalScans: total,
    lastScannedAt: now - 15 * 60 * 1000,
    productStats: seededStats,
    recentEvents: sampleEvents
  };

  saveScanAnalytics(initialData);
  return initialData;
}
