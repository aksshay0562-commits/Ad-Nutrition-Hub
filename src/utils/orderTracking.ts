export type OrderTrackingStatus = 
  | 'Enquiry Sent'
  | 'Order Confirmed'
  | 'Packing in Store'
  | 'Dispatched'
  | 'Ready for Pickup'
  | 'Delivered';

export interface OrderTrackingHistoryItem {
  orderId: string;
  searchedAt: string; // ISO string
  status: OrderTrackingStatus;
  productHint?: string;
}

export const ORDER_TRACKING_STORAGE_KEY = 'ad_nutrition_order_tracking_history';
export const LEGACY_ORDER_IDS_KEY = 'ad_nutrition_recent_order_ids';

export const ORDER_STATUS_CONFIG: Record<
  OrderTrackingStatus,
  { 
    label: string; 
    shortLabel: string;
    bg: string; 
    text: string; 
    border: string; 
    dot: string; 
    icon: string;
    cardBg: string;
    cardBorder: string;
    cardAccent: string;
  }
> = {
  'Enquiry Sent': {
    label: 'Enquiry Sent',
    shortLabel: 'Enquiry',
    bg: 'bg-sky-950/80',
    text: 'text-sky-300',
    border: 'border-sky-500/40',
    dot: 'bg-sky-400',
    icon: '💬',
    cardBg: 'bg-gradient-to-br from-sky-950/50 via-neutral-950 to-neutral-950',
    cardBorder: 'border-sky-600/35 hover:border-sky-400/60 hover:shadow-sky-950/40',
    cardAccent: 'text-sky-400',
  },
  'Order Confirmed': {
    label: 'Order Confirmed',
    shortLabel: 'Confirmed',
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    dot: 'bg-emerald-400',
    icon: '✅',
    cardBg: 'bg-gradient-to-br from-emerald-950/50 via-neutral-950 to-neutral-950',
    cardBorder: 'border-emerald-600/35 hover:border-emerald-400/60 hover:shadow-emerald-950/40',
    cardAccent: 'text-emerald-400',
  },
  'Packing in Store': {
    label: 'Packing in Store',
    shortLabel: 'Packing',
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    dot: 'bg-amber-400',
    icon: '📦',
    cardBg: 'bg-gradient-to-br from-amber-950/50 via-neutral-950 to-neutral-950',
    cardBorder: 'border-amber-600/35 hover:border-amber-400/60 hover:shadow-amber-950/40',
    cardAccent: 'text-amber-400',
  },
  'Dispatched': {
    label: 'Dispatched / In Transit',
    shortLabel: 'Dispatched',
    bg: 'bg-purple-950/80',
    text: 'text-purple-300',
    border: 'border-purple-500/40',
    dot: 'bg-purple-400',
    icon: '🚚',
    cardBg: 'bg-gradient-to-br from-purple-950/50 via-neutral-950 to-neutral-950',
    cardBorder: 'border-purple-600/35 hover:border-purple-400/60 hover:shadow-purple-950/40',
    cardAccent: 'text-purple-400',
  },
  'Ready for Pickup': {
    label: 'Ready at Mandi Mor Counter',
    shortLabel: 'Pickup Ready',
    bg: 'bg-cyan-950/80',
    text: 'text-cyan-300',
    border: 'border-cyan-500/40',
    dot: 'bg-cyan-400',
    icon: '📍',
    cardBg: 'bg-gradient-to-br from-cyan-950/50 via-neutral-950 to-neutral-950',
    cardBorder: 'border-cyan-600/35 hover:border-cyan-400/60 hover:shadow-cyan-950/40',
    cardAccent: 'text-cyan-400',
  },
  'Delivered': {
    label: 'Delivered / Completed',
    shortLabel: 'Delivered',
    bg: 'bg-green-950/80',
    text: 'text-green-300',
    border: 'border-green-500/40',
    dot: 'bg-green-400',
    icon: '🎉',
    cardBg: 'bg-gradient-to-br from-green-950/50 via-neutral-950 to-neutral-950',
    cardBorder: 'border-green-600/35 hover:border-green-400/60 hover:shadow-green-950/40',
    cardAccent: 'text-green-400',
  },
};

export const ALL_ORDER_STATUSES: OrderTrackingStatus[] = [
  'Enquiry Sent',
  'Order Confirmed',
  'Packing in Store',
  'Dispatched',
  'Ready for Pickup',
  'Delivered',
];

/**
 * Loads the last searched order tracking history (up to 5 items) from browser localStorage.
 * Includes graceful migration from legacy order IDs array.
 */
export function getOrderTrackingHistory(): OrderTrackingHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(ORDER_TRACKING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 5);
      }
    }

    // Fallback: check legacy list of strings
    const legacyRaw = localStorage.getItem(LEGACY_ORDER_IDS_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
        const migrated: OrderTrackingHistoryItem[] = legacyParsed.slice(0, 5).map((id, index) => ({
          orderId: String(id),
          searchedAt: new Date(Date.now() - index * 60000).toISOString(),
          status: 'Enquiry Sent' as OrderTrackingStatus,
        }));
        localStorage.setItem(ORDER_TRACKING_STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (err) {
    console.warn('Failed to parse order tracking history', err);
  }

  return [];
}

/**
 * Persists an order ID into the top of the history list, capping at 5 items.
 */
export function recordOrderSearch(
  orderId: string,
  initialStatus: OrderTrackingStatus = 'Enquiry Sent',
  productHint?: string
): OrderTrackingHistoryItem[] {
  if (typeof window === 'undefined') return [];

  const trimmed = orderId.trim();
  if (!trimmed) return getOrderTrackingHistory();

  try {
    const existing = getOrderTrackingHistory();
    const existingItem = existing.find(
      (item) => item.orderId.toLowerCase() === trimmed.toLowerCase()
    );

    const newItem: OrderTrackingHistoryItem = {
      orderId: trimmed,
      searchedAt: new Date().toISOString(),
      // Keep existing status if it was already updated, otherwise use initialStatus
      status: existingItem ? existingItem.status : initialStatus,
      productHint: productHint || existingItem?.productHint,
    };

    const updated = [
      newItem,
      ...existing.filter((item) => item.orderId.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 5);

    localStorage.setItem(ORDER_TRACKING_STORAGE_KEY, JSON.stringify(updated));

    // Also update legacy key for backward compatibility
    localStorage.setItem(
      LEGACY_ORDER_IDS_KEY,
      JSON.stringify(updated.map((item) => item.orderId))
    );

    return updated;
  } catch (err) {
    console.warn('Failed to save order search to history', err);
    return getOrderTrackingHistory();
  }
}

/**
 * Updates the last known status of a specific order ID in localStorage.
 */
export function updateOrderTrackingStatus(
  orderId: string,
  newStatus: OrderTrackingStatus
): OrderTrackingHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const existing = getOrderTrackingHistory();
    const updated = existing.map((item) => {
      if (item.orderId.toLowerCase() === orderId.toLowerCase()) {
        return {
          ...item,
          status: newStatus,
          searchedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    localStorage.setItem(ORDER_TRACKING_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to update order tracking status', err);
    return getOrderTrackingHistory();
  }
}

/**
 * Removes a single item from the history.
 */
export function removeOrderTrackingItem(orderId: string): OrderTrackingHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const existing = getOrderTrackingHistory();
    const updated = existing.filter((item) => item.orderId.toLowerCase() !== orderId.toLowerCase());
    localStorage.setItem(ORDER_TRACKING_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(
      LEGACY_ORDER_IDS_KEY,
      JSON.stringify(updated.map((item) => item.orderId))
    );
    return updated;
  } catch (err) {
    return getOrderTrackingHistory();
  }
}

/**
 * Clears the order tracking history.
 */
export function clearOrderTrackingHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ORDER_TRACKING_STORAGE_KEY);
    localStorage.removeItem(LEGACY_ORDER_IDS_KEY);
  } catch (err) {}
}

/**
 * Formats an ISO date into a human-friendly relative string (e.g. 'Just now', '5m ago', '2h ago', 'Yesterday').
 */
export function formatOrderRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return 'Recently';
  }
}

/**
 * Escapes a cell value for CSV formatting, handling commas, quotes, and newlines.
 */
function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports the provided order tracking history items to an Excel-compatible CSV file with UTF-8 BOM.
 */
export function exportOrderHistoryToCSV(
  items: OrderTrackingHistoryItem[],
  filterLabel: string = 'All'
): boolean {
  if (typeof window === 'undefined' || !items || items.length === 0) {
    return false;
  }

  try {
    const headers = [
      'Order Reference ID',
      'Last Known Status',
      'Product / Stack Hint',
      'Searched Timestamp (ISO)',
      'Formatted Date & Time',
      'Time Ago',
      'Store Location',
      'Store Orders Contact'
    ];

    const rows = items.map((item) => {
      let formattedDate = 'N/A';
      try {
        formattedDate = new Date(item.searchedAt).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
      } catch {}

      return [
        escapeCsvCell(item.orderId),
        escapeCsvCell(item.status),
        escapeCsvCell(item.productHint || 'Standard Supplement Order'),
        escapeCsvCell(item.searchedAt),
        escapeCsvCell(formattedDate),
        escapeCsvCell(formatOrderRelativeTime(item.searchedAt)),
        escapeCsvCell('AD Nutrition Hub, Mandi Mor, Israna (Panipat, Haryana)'),
        escapeCsvCell('+91 70159 59517 (Line 1 Orders)')
      ].join(',');
    });

    // Excel-friendly UTF-8 Byte Order Mark (BOM)
    const bom = '\uFEFF';
    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');

    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const cleanFilter = filterLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const todayStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '');
    const filename = `ad_nutrition_order_history_${cleanFilter}_${todayStr}_${timeStr}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    console.error('Failed to export order history to CSV', err);
    return false;
  }
}

/**
 * Hits the mock status API to fetch updated real-time statuses for tracked order IDs.
 * Includes graceful offline fallback simulation.
 */
export async function fetchRealtimeOrderStatuses(
  orderIds: string[]
): Promise<Array<{ orderId: string; status: OrderTrackingStatus }>> {
  if (!orderIds || orderIds.length === 0) return [];

  try {
    const res = await fetch('/api/orders/mock-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.updates && Array.isArray(data.updates)) {
        return data.updates.map((u: any) => ({
          orderId: String(u.orderId),
          status: u.status as OrderTrackingStatus,
        }));
      }
    }
  } catch (e) {
    console.warn('Network call to mock status API failed, using fallback simulation', e);
  }

  // Fallback simulation
  const fallbackStatuses: OrderTrackingStatus[] = [
    'Order Confirmed',
    'Packing in Store',
    'Dispatched',
    'Ready for Pickup',
    'Delivered',
  ];

  return orderIds.map((id, index) => ({
    orderId: id,
    status: fallbackStatuses[(id.length + index + Math.floor(Date.now() / 30000)) % fallbackStatuses.length],
  }));
}
