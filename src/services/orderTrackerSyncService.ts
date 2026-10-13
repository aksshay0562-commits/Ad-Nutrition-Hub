/**
 * OrderTracker Background Sync Service
 * 
 * Manages caching and automatic background retries for outgoing WhatsApp URL generation
 * and dispatch attempts. Ensures users in remote areas or with unstable internet connectivity
 * never lose their tracking queries, order notes, or fulfillment requests.
 */

import { OrderTrackingStatus, recordOrderSearch, formatOrderRelativeTime } from '../utils/orderTracking';

export interface CachedWhatsAppOrderAttempt {
  id: string;
  orderId: string;
  orderNote?: string;
  statusHint?: OrderTrackingStatus;
  productHint?: string;
  targetPhone: string;
  targetDesk: string;
  whatsappUrl: string;
  messageText: string;
  createdAt: string;       // ISO string
  lastAttemptAt?: string;   // ISO string
  attempts: number;
  status: 'pending' | 'retrying' | 'synced' | 'failed';
  failureReason?: string;
  source: 'search_form' | 'history_card' | 'quick_order' | 'manual_retry';
}

export const WA_SYNC_STORAGE_KEY = 'ad_nutrition_wa_order_sync_queue';
export const SYNC_STATUS_EVENT = 'ad_order_tracker_sync_updated';

// Default phone numbers for AD Nutrition Hub Israna
export const DEFAULT_ORDERS_PHONE = '917015959517'; // Line 1: Orders desk
export const DEFAULT_GENERAL_PHONE = '919812730100'; // Line 2: General desk

/**
 * Builds the canonical tracking message text formatted for WhatsApp.
 */
export function buildTrackingWhatsAppMessage(orderId: string, orderNote?: string): string {
  const trimmed = orderId.trim();
  const noteText = orderNote?.trim();

  let msg = `Namaste AD Nutrition Hub Israna! 🙏\n\n📦 *Order Status Tracking Enquiry*\n• Order Reference ID: *${trimmed}*\n• Routing Line: Orders & Dispatch Desk (Line 1: 70159 59517)\n• Store: Mandi Mor, Israna, Panipat (Haryana)`;

  if (noteText) {
    msg += `\n• Customer Request / Order Note: _"${noteText}"_`;
  }

  msg += `\n\nPlease check the current status of my order:\n1. Has this order been confirmed and packed at the store?\n2. What is the estimated dispatch or in-store pickup readiness time?`;

  if (noteText) {
    msg += `\n3. Note / Request: Please verify the specific request mentioned above.`;
  }

  msg += `\n\nThank you!`;
  return msg;
}

/**
 * Generates the WhatsApp URL for a given phone and message text.
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

class OrderTrackerSyncService {
  private queue: CachedWhatsAppOrderAttempt[] = [];
  private listeners: Set<(queue: CachedWhatsAppOrderAttempt[]) => void> = new Set();
  private isCheckingConnection = false;
  private autoSyncTimer: number | null = null;
  private isOnlineState = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    this.loadQueue();
    this.setupNetworkListeners();
    this.registerServiceWorkerSync();
  }

  /**
   * Loads cached attempts from localStorage.
   */
  public loadQueue(): CachedWhatsAppOrderAttempt[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(WA_SYNC_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
          return this.queue;
        }
      }
    } catch (err) {
      console.warn('[OrderTrackerSync] Failed to read sync queue from storage', err);
    }
    this.queue = [];
    return [];
  }

  /**
   * Saves current queue to localStorage and notifies listeners.
   */
  private saveQueue() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(WA_SYNC_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (err) {
      console.warn('[OrderTrackerSync] Failed to persist sync queue', err);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.queue]);
      } catch (err) {
        console.error('[OrderTrackerSync] Listener error', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(SYNC_STATUS_EVENT, {
          detail: {
            queue: [...this.queue],
            pendingCount: this.getPendingCount(),
          },
        })
      );
    }
  }

  /**
   * Sets up window online/offline listeners.
   */
  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnlineState = true;
      console.log('[OrderTrackerSync] Network restored. Checking connection & triggering background retry...');
      this.handleNetworkRestored();
    });

    window.addEventListener('offline', () => {
      this.isOnlineState = false;
      console.log('[OrderTrackerSync] Device went offline.');
      this.notify();
    });

    // Periodic safety sweep every 45s if there are pending items
    this.autoSyncTimer = window.setInterval(() => {
      if (this.getPendingCount() > 0 && navigator.onLine) {
        this.verifyAndRetryPending();
      }
    }, 45000);
  }

  /**
   * Registers Background Sync with the Service Worker if supported.
   */
  private async registerServiceWorkerSync() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      if ('sync' in reg) {
        // @ts-ignore - background sync API
        await reg.sync.register('sync-whatsapp-orders');
      }
    } catch {
      // Background Sync API not supported or disabled - fallback to window online listener
    }
  }

  /**
   * Checks if network is actually reachable (not just local network interface).
   */
  public async checkConnectivity(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      // Fallback check: if /api/health fails, navigator.onLine is the best estimate
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }
  }

  /**
   * Handles network restoration by verifying live connection and retrying queued attempts.
   */
  public async handleNetworkRestored(): Promise<{ retried: number; succeeded: number }> {
    if (this.isCheckingConnection) {
      return { retried: 0, succeeded: 0 };
    }

    this.isCheckingConnection = true;
    try {
      const isActuallyOnline = await this.checkConnectivity();
      if (!isActuallyOnline) {
        console.warn('[OrderTrackerSync] Network reported online but ping failed.');
        return { retried: 0, succeeded: 0 };
      }

      return await this.verifyAndRetryPending();
    } finally {
      this.isCheckingConnection = false;
    }
  }

  /**
   * Queues an outgoing WhatsApp URL generation attempt when network is down or dispatch fails.
   */
  public queueFailedAttempt(params: {
    orderId: string;
    orderNote?: string;
    statusHint?: OrderTrackingStatus;
    productHint?: string;
    targetPhone?: string;
    failureReason?: string;
    source?: 'search_form' | 'history_card' | 'quick_order' | 'manual_retry';
  }): CachedWhatsAppOrderAttempt {
    const trimmedId = params.orderId.trim();
    const cleanPhone = (params.targetPhone || DEFAULT_ORDERS_PHONE).replace(/[^0-9]/g, '');
    const messageText = buildTrackingWhatsAppMessage(trimmedId, params.orderNote);
    const whatsappUrl = generateWhatsAppUrl(cleanPhone, messageText);

    // Save into Order Tracking History as well so customer has immediate record
    try {
      recordOrderSearch(
        trimmedId,
        params.statusHint || 'Enquiry Sent',
        params.productHint,
        params.orderNote
      );
    } catch {}

    const now = new Date().toISOString();
    const existingIndex = this.queue.findIndex(
      (item) => item.orderId.toLowerCase() === trimmedId.toLowerCase() && item.status === 'pending'
    );

    let attemptItem: CachedWhatsAppOrderAttempt;

    if (existingIndex >= 0) {
      attemptItem = {
        ...this.queue[existingIndex],
        orderNote: params.orderNote !== undefined ? params.orderNote : this.queue[existingIndex].orderNote,
        whatsappUrl,
        messageText,
        attempts: this.queue[existingIndex].attempts + 1,
        lastAttemptAt: now,
        failureReason: params.failureReason || 'Cached for background sync (network unavailable)',
      };
      this.queue[existingIndex] = attemptItem;
    } else {
      attemptItem = {
        id: `sync_wa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        orderId: trimmedId,
        orderNote: params.orderNote,
        statusHint: params.statusHint || 'Enquiry Sent',
        productHint: params.productHint,
        targetPhone: cleanPhone,
        targetDesk: 'Line 1 (Orders Desk)',
        whatsappUrl,
        messageText,
        createdAt: now,
        lastAttemptAt: now,
        attempts: 1,
        status: 'pending',
        failureReason: params.failureReason || 'Offline: saved for background sync',
        source: params.source || 'search_form',
      };
      // Keep maximum 20 items in queue
      this.queue = [attemptItem, ...this.queue].slice(0, 20);
    }

    this.saveQueue();
    return attemptItem;
  }

  /**
   * Main entry point to track an order via WhatsApp.
   * If online, generates the URL and launches WhatsApp.
   * If offline or popup fails, safely caches the attempt in the sync queue and returns cached: true.
   */
  public async trackOrderWithSync(params: {
    orderId: string;
    orderNote?: string;
    statusHint?: OrderTrackingStatus;
    productHint?: string;
    targetPhone?: string;
    forceOffline?: boolean;
    source?: 'search_form' | 'history_card' | 'quick_order';
  }): Promise<{
    success: boolean;
    cached: boolean;
    url: string;
    item?: CachedWhatsAppOrderAttempt;
    message?: string;
  }> {
    const trimmedId = params.orderId.trim();
    if (!trimmedId) {
      throw new Error('Order ID is required');
    }

    const cleanPhone = (params.targetPhone || DEFAULT_ORDERS_PHONE).replace(/[^0-9]/g, '');
    const messageText = buildTrackingWhatsAppMessage(trimmedId, params.orderNote);
    const whatsappUrl = generateWhatsAppUrl(cleanPhone, messageText);

    // Save to regular tracking history
    try {
      recordOrderSearch(
        trimmedId,
        params.statusHint || 'Enquiry Sent',
        params.productHint,
        params.orderNote
      );
    } catch {}

    const isOffline = params.forceOffline || (typeof navigator !== 'undefined' && !navigator.onLine);

    if (isOffline) {
      const cachedItem = this.queueFailedAttempt({
        orderId: trimmedId,
        orderNote: params.orderNote,
        statusHint: params.statusHint,
        productHint: params.productHint,
        targetPhone: cleanPhone,
        failureReason: 'Device is offline. Cached for background sync.',
        source: params.source,
      });

      return {
        success: false,
        cached: true,
        url: whatsappUrl,
        item: cachedItem,
        message: 'Saved to Background Sync Queue. Will retry automatically when internet returns.',
      };
    }

    // Attempt to open WhatsApp window
    try {
      const win = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      // If popup was blocked or window could not be opened
      if (!win) {
        const cachedItem = this.queueFailedAttempt({
          orderId: trimmedId,
          orderNote: params.orderNote,
          statusHint: params.statusHint,
          productHint: params.productHint,
          targetPhone: cleanPhone,
          failureReason: 'Popup window blocked or dispatch delayed. Cached for 1-tap retry.',
          source: params.source,
        });

        return {
          success: false,
          cached: true,
          url: whatsappUrl,
          item: cachedItem,
          message: 'Popup blocked. Order query cached for 1-tap retry.',
        };
      }

      return {
        success: true,
        cached: false,
        url: whatsappUrl,
      };
    } catch (err) {
      const cachedItem = this.queueFailedAttempt({
        orderId: trimmedId,
        orderNote: params.orderNote,
        statusHint: params.statusHint,
        productHint: params.productHint,
        targetPhone: cleanPhone,
        failureReason: err instanceof Error ? err.message : 'Failed to launch WhatsApp URL',
        source: params.source,
      });

      return {
        success: false,
        cached: true,
        url: whatsappUrl,
        item: cachedItem,
        message: 'Launch failed. Cached for background sync.',
      };
    }
  }

  /**
   * Retries all pending sync attempts.
   */
  public async verifyAndRetryPending(): Promise<{ retried: number; succeeded: number }> {
    const pendingItems = this.queue.filter((item) => item.status === 'pending' || item.status === 'failed');
    if (pendingItems.length === 0) {
      return { retried: 0, succeeded: 0 };
    }

    let succeeded = 0;
    const now = new Date().toISOString();

    for (const item of pendingItems) {
      // Mark as retrying
      item.status = 'retrying';
      item.attempts += 1;
      item.lastAttemptAt = now;
      this.saveQueue();

      try {
        // Regenerate message and URL with current data
        const updatedMsg = buildTrackingWhatsAppMessage(item.orderId, item.orderNote);
        item.messageText = updatedMsg;
        item.whatsappUrl = generateWhatsAppUrl(item.targetPhone, updatedMsg);

        // Update tracking history entry timestamp and note
        recordOrderSearch(
          item.orderId,
          item.statusHint || 'Enquiry Sent',
          item.productHint,
          item.orderNote
        );

        // Mark as synced and ready
        item.status = 'synced';
        item.failureReason = undefined;
        succeeded += 1;
      } catch (err) {
        item.status = 'failed';
        item.failureReason = err instanceof Error ? err.message : 'Retry failed';
      }
    }

    this.saveQueue();
    return { retried: pendingItems.length, succeeded };
  }

  /**
   * Retries an individual cached item by ID and optionally launches WhatsApp.
   */
  public async retryItem(id: string, launchInBrowser = true): Promise<boolean> {
    const item = this.queue.find((q) => q.id === id);
    if (!item) return false;

    item.status = 'retrying';
    item.attempts += 1;
    item.lastAttemptAt = new Date().toISOString();
    this.saveQueue();

    try {
      const updatedMsg = buildTrackingWhatsAppMessage(item.orderId, item.orderNote);
      item.messageText = updatedMsg;
      item.whatsappUrl = generateWhatsAppUrl(item.targetPhone, updatedMsg);

      recordOrderSearch(
        item.orderId,
        item.statusHint || 'Enquiry Sent',
        item.productHint,
        item.orderNote
      );

      item.status = 'synced';
      item.failureReason = undefined;
      this.saveQueue();

      if (launchInBrowser && typeof window !== 'undefined') {
        window.open(item.whatsappUrl, '_blank', 'noopener,noreferrer');
      }

      return true;
    } catch (err) {
      item.status = 'failed';
      item.failureReason = err instanceof Error ? err.message : 'Retry failed';
      this.saveQueue();
      return false;
    }
  }

  public removeQueueItem(id: string) {
    this.queue = this.queue.filter((item) => item.id !== id);
    this.saveQueue();
  }

  public clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  public clearSynced() {
    this.queue = this.queue.filter((item) => item.status !== 'synced');
    this.saveQueue();
  }

  public getQueue(): CachedWhatsAppOrderAttempt[] {
    return [...this.queue];
  }

  public getPendingCount(): number {
    return this.queue.filter((item) => item.status === 'pending' || item.status === 'retrying').length;
  }

  public getSyncedCount(): number {
    return this.queue.filter((item) => item.status === 'synced').length;
  }

  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Subscribes to queue changes. Returns an unsubscribe function.
   */
  public subscribe(listener: (queue: CachedWhatsAppOrderAttempt[]) => void): () => void {
    this.listeners.add(listener);
    // Emit initial state
    try {
      listener([...this.queue]);
    } catch {}

    return () => {
      this.listeners.delete(listener);
    };
  }
}

// Singleton instance
export const orderTrackerSyncService = new OrderTrackerSyncService();
