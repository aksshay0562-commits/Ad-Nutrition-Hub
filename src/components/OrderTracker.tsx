import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  History,
  Package,
  X,
  FileText,
  ExternalLink,
  MessageCircle,
  Clock,
  Trash2,
  RotateCcw,
  Activity,
  RefreshCw,
  FileSpreadsheet,
  Check,
  Truck,
  Wifi,
  WifiOff,
  CloudOff,
  CloudLightning,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  OrderTrackingHistoryItem,
  OrderTrackingStatus,
  ORDER_STATUS_CONFIG,
  ALL_ORDER_STATUSES,
  getOrderTrackingHistory,
  recordOrderSearch,
  updateOrderTrackingStatus,
  removeOrderTrackingItem,
  clearOrderTrackingHistory,
  formatOrderRelativeTime,
  exportOrderHistoryToCSV,
  fetchRealtimeOrderStatuses,
} from '../utils/orderTracking';
import {
  orderTrackerSyncService,
  CachedWhatsAppOrderAttempt,
  buildTrackingWhatsAppMessage,
  DEFAULT_ORDERS_PHONE,
} from '../services/orderTrackerSyncService';
import { triggerHaptic } from '../utils/haptics';

interface OrderTrackerProps {
  onClose?: () => void;
  initialOrderId?: string;
  initialOrderNote?: string;
  compact?: boolean;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  onClose,
  initialOrderId = '',
  initialOrderNote = '',
  compact = false,
}) => {
  // Tabs: Search, History, Sync Queue
  const [trackerTab, setTrackerTab] = useState<'search' | 'history' | 'sync'>('search');
  const [orderIdInput, setOrderIdInput] = useState<string>(initialOrderId);
  const [orderNoteInput, setOrderNoteInput] = useState<string>(initialOrderNote);
  const [orderIdError, setOrderIdError] = useState<string | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<OrderTrackingHistoryItem[]>([]);
  const [showTrackingPreview, setShowTrackingPreview] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  // Sync Queue states
  const [syncQueue, setSyncQueue] = useState<CachedWhatsAppOrderAttempt[]>(() =>
    orderTrackerSyncService.getQueue()
  );
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [copiedSyncId, setCopiedSyncId] = useState<string | null>(null);

  // History filtering & dynamic metrics
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | OrderTrackingStatus>('All');
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [refreshStatusMessage, setRefreshStatusMessage] = useState<string | null>(null);
  const [csvExportSuccess, setCsvExportSuccess] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ad_nutrition_tracker_auto_refresh') === 'true';
    }
    return false;
  });
  const [autoRefreshSecondsLeft, setAutoRefreshSecondsLeft] = useState<number>(60);

  // Subscribe to Background Sync Service
  useEffect(() => {
    const unsubscribe = orderTrackerSyncService.subscribe((updatedQueue) => {
      setSyncQueue(updatedQueue);
    });

    const handleOnline = () => {
      setIsOnline(true);
      triggerHaptic('success');
      setSyncFeedback('Connection restored! Retrying queued WhatsApp queries...');
      setTimeout(() => setSyncFeedback(null), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      triggerHaptic('warning');
      setSyncFeedback('Offline mode active. Outgoing queries will be cached in Sync Queue.');
      setTimeout(() => setSyncFeedback(null), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync counts
  const pendingSyncCount = useMemo(
    () => syncQueue.filter((item) => item.status === 'pending' || item.status === 'retrying').length,
    [syncQueue]
  );

  const syncedCount = useMemo(
    () => syncQueue.filter((item) => item.status === 'synced').length,
    [syncQueue]
  );

  // Load and refresh tracking history
  const refreshHistory = () => {
    const list = getOrderTrackingHistory();
    setTrackingHistory(list);
    if (list.length > 0 && !orderIdInput) {
      setOrderIdInput(list[0].orderId);
      if (list[0].orderNote && !orderNoteInput) {
        setOrderNoteInput(list[0].orderNote);
      }
    }
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  // Filtered history calculations
  const filteredHistory = useMemo(() => {
    if (historyStatusFilter === 'All') return trackingHistory;
    return trackingHistory.filter((item) => item.status === historyStatusFilter);
  }, [trackingHistory, historyStatusFilter]);

  const inTransitCount = useMemo(
    () => trackingHistory.filter((item) => item.status === 'Dispatched').length,
    [trackingHistory]
  );

  const deliveredCount = useMemo(
    () => trackingHistory.filter((item) => item.status === 'Delivered').length,
    [trackingHistory]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: trackingHistory.length };
    trackingHistory.forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    return counts;
  }, [trackingHistory]);

  const availableFilterStatuses = useMemo(() => {
    const present = new Set(trackingHistory.map((item) => item.status));
    return ALL_ORDER_STATUSES.filter((st) => present.has(st));
  }, [trackingHistory]);

  // Execute tracking query with background sync fallback
  const executeTrackOrder = async (
    idToTrack: string,
    statusHint?: OrderTrackingStatus,
    note?: string,
    source: 'search_form' | 'history_card' = 'search_form'
  ) => {
    const trimmed = idToTrack.trim();
    if (!trimmed) {
      triggerHaptic('error');
      setOrderIdError('Please enter your Order ID or contact number');
      return;
    }

    setOrderIdError(null);
    const effectiveNote = note !== undefined ? note.trim() : orderNoteInput.trim();

    try {
      const result = await orderTrackerSyncService.trackOrderWithSync({
        orderId: trimmed,
        orderNote: effectiveNote,
        statusHint: statusHint || 'Enquiry Sent',
        source,
      });

      refreshHistory();

      if (result.cached) {
        triggerHaptic('warning');
        setSyncFeedback(
          result.message || 'Offline: Query cached in Background Sync. Will auto-retry on reconnect.'
        );
        setTimeout(() => setSyncFeedback(null), 4500);
      } else {
        triggerHaptic('success');
        setSyncFeedback('Opening WhatsApp Orders line...');
        setTimeout(() => setSyncFeedback(null), 2500);
      }
    } catch (err) {
      triggerHaptic('error');
      setOrderIdError(err instanceof Error ? err.message : 'Failed to process tracking request');
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeTrackOrder(orderIdInput, undefined, orderNoteInput, 'search_form');
  };

  const handleManualSyncRetryAll = async () => {
    triggerHaptic('medium');
    setIsSyncing(true);
    try {
      const res = await orderTrackerSyncService.handleNetworkRestored();
      refreshHistory();
      if (res.retried > 0) {
        triggerHaptic('success');
        setSyncFeedback(`Successfully retried ${res.succeeded}/${res.retried} queued queries!`);
      } else {
        setSyncFeedback('Sync queue verified. All queries up to date.');
      }
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch {
      triggerHaptic('error');
      setSyncFeedback('Sync attempt failed. Please check network.');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetrySingleSync = async (id: string, launch: boolean = true) => {
    triggerHaptic('light');
    const ok = await orderTrackerSyncService.retryItem(id, launch);
    refreshHistory();
    if (ok) {
      triggerHaptic('success');
      setSyncFeedback('Query retried successfully!');
      setTimeout(() => setSyncFeedback(null), 2500);
    } else {
      triggerHaptic('error');
    }
  };

  const handleCopySyncUrl = (item: CachedWhatsAppOrderAttempt) => {
    triggerHaptic('light');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(item.whatsappUrl);
      setCopiedSyncId(item.id);
      setTimeout(() => setCopiedSyncId(null), 2000);
    }
  };

  const handleRefreshLiveStatus = async (isAuto = false) => {
    const ordersToRefresh = filteredHistory.length > 0 ? filteredHistory : trackingHistory;
    if (ordersToRefresh.length === 0) {
      if (!isAuto) triggerHaptic('error');
      return;
    }

    setIsRefreshingStatus(true);
    if (!isAuto) triggerHaptic('medium');

    try {
      const orderIds = ordersToRefresh.map((item) => item.orderId);
      const updates = await fetchRealtimeOrderStatuses(orderIds);

      let updatedList = getOrderTrackingHistory();
      for (const update of updates) {
        updatedList = updateOrderTrackingStatus(update.orderId, update.status);
      }

      setTrackingHistory(updatedList);
      if (!isAuto) triggerHaptic('success');
      setRefreshStatusMessage(
        isAuto
          ? `Auto: Updated ${updates.length} ${updates.length === 1 ? 'order' : 'orders'}!`
          : `Updated ${updates.length} ${updates.length === 1 ? 'order' : 'orders'}!`
      );
      setTimeout(() => setRefreshStatusMessage(null), 2800);
      setAutoRefreshSecondsLeft(60);
    } catch (err) {
      console.error('Failed to refresh real-time statuses:', err);
      if (!isAuto) {
        triggerHaptic('error');
        setRefreshStatusMessage('Refresh failed');
        setTimeout(() => setRefreshStatusMessage(null), 2800);
      }
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  const handleExportCSV = () => {
    triggerHaptic('medium');
    const success = exportOrderHistoryToCSV(filteredHistory, historyStatusFilter);
    if (success) {
      setCsvExportSuccess(true);
      setTimeout(() => setCsvExportSuccess(false), 2000);
    }
  };

  const toggleAutoRefresh = () => {
    triggerHaptic('light');
    const next = !autoRefreshEnabled;
    setAutoRefreshEnabled(next);
    localStorage.setItem('ad_nutrition_tracker_auto_refresh', String(next));
    if (next) {
      setAutoRefreshSecondsLeft(60);
    }
  };

  return (
    <div
      className={`bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl shadow-2xl p-4 space-y-3.5 origin-bottom-right ${
        compact ? 'w-full' : 'w-80 sm:w-92'
      }`}
      id="whatsapp-order-tracker-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Order Tracking</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-400 font-bold border border-amber-400/30">
                Line 1 Orders
              </span>
            </h4>
            <p className="text-[10px] text-neutral-400">
              Offline-ready dispatch with background sync
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close order tracking"
            id="close-order-tracker-btn"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Network Status & Background Sync Alert Bar */}
      <div
        className={`px-2.5 py-1.5 rounded-xl text-[10.5px] border flex items-center justify-between gap-2 transition-all ${
          !isOnline
            ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
            : pendingSyncCount > 0
            ? 'bg-sky-950/60 border-sky-500/40 text-sky-200'
            : 'bg-neutral-950/60 border-neutral-800 text-neutral-300'
        }`}
        id="order-tracker-sync-status-bar"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {!isOnline ? (
            <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : pendingSyncCount > 0 ? (
            <CloudLightning className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" />
          ) : (
            <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}

          <div className="truncate">
            {!isOnline ? (
              <span className="font-semibold text-amber-300">
                Offline Mode: Outgoing queries cached
              </span>
            ) : pendingSyncCount > 0 ? (
              <span className="font-semibold text-sky-300">
                {pendingSyncCount} query pending sync
              </span>
            ) : (
              <span className="text-neutral-400 text-[10px]">
                Sync active • Direct WhatsApp dispatch
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {pendingSyncCount > 0 && (
            <button
              type="button"
              onClick={handleManualSyncRetryAll}
              disabled={isSyncing}
              className="px-2 py-0.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[9.5px] font-bold border border-sky-500/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Retry queued WhatsApp URL generation attempts now"
              id="order-tracker-retry-sync-btn"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setTrackerTab('sync')}
            className={`px-1.5 py-0.5 rounded-lg text-[9.5px] font-mono transition-colors ${
              trackerTab === 'sync'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Open Background Sync Queue"
          >
            Queue ({syncQueue.length})
          </button>
        </div>
      </div>

      {/* Sync Feedback Toast Banner */}
      <AnimatePresence>
        {syncFeedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10.5px] flex items-center gap-1.5 font-medium shadow-sm overflow-hidden"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="leading-snug">{syncFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segmented Tab Navigation: Search, History, Sync Queue */}
      <div className="grid grid-cols-3 p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold relative">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setTrackerTab('search');
          }}
          className={`relative z-10 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            trackerTab === 'search' ? 'text-neutral-950 font-black' : 'text-neutral-400 hover:text-white'
          }`}
          id="order-tracker-tab-search"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          {trackerTab === 'search' && (
            <motion.div
              layoutId="activeTrackerTabPill"
              className="absolute inset-0 bg-amber-400 rounded-lg -z-10 shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setTrackerTab('history');
            refreshHistory();
          }}
          className={`relative z-10 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            trackerTab === 'history' ? 'text-neutral-950 font-black' : 'text-neutral-400 hover:text-white'
          }`}
          id="order-tracker-tab-history"
        >
          <History className="w-3.5 h-3.5" />
          <span>History ({trackingHistory.length}/5)</span>
          {trackerTab === 'history' && (
            <motion.div
              layoutId="activeTrackerTabPill"
              className="absolute inset-0 bg-amber-400 rounded-lg -z-10 shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setTrackerTab('sync');
          }}
          className={`relative z-10 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            trackerTab === 'sync' ? 'text-neutral-950 font-black' : 'text-neutral-400 hover:text-white'
          }`}
          id="order-tracker-tab-sync"
        >
          <CloudLightning className="w-3.5 h-3.5" />
          <span>Sync ({syncQueue.length})</span>
          {pendingSyncCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse ml-0.5" />
          )}
          {trackerTab === 'sync' && (
            <motion.div
              layoutId="activeTrackerTabPill"
              className="absolute inset-0 bg-amber-400 rounded-lg -z-10 shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </button>
      </div>

      {/* Tab 1: Search Form View */}
      {trackerTab === 'search' && (
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-neutral-300 block mb-1">
              Enter Order ID or Contact Number:
            </label>
            <div className="relative">
              <Package className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => {
                  setOrderIdInput(e.target.value);
                  if (orderIdError) setOrderIdError(null);
                }}
                placeholder="e.g. AD-10492 or 9812345678"
                className={`w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-950 border text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors ${
                  orderIdError
                    ? 'border-red-500 ring-1 ring-red-500/40'
                    : 'border-neutral-700/80 focus:border-amber-400'
                }`}
                id="order-tracker-input"
              />
              {orderIdInput && (
                <button
                  type="button"
                  onClick={() => setOrderIdInput('')}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {orderIdError && (
              <p className="text-[10px] text-red-400 mt-1 font-semibold">{orderIdError}</p>
            )}
          </div>

          {/* Optional Order Note text input field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5"
                htmlFor="order-tracker-note-input"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Order Note / Specific Requests:</span>
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">Optional</span>
            </div>
            <div className="relative">
              <input
                type="text"
                id="order-tracker-note-input"
                value={orderNoteInput}
                onChange={(e) => setOrderNoteInput(e.target.value)}
                placeholder="e.g. Call before dispatch, add shaker, extra bubble wrap..."
                className="w-full px-3 py-2 pr-8 rounded-xl bg-neutral-950 border border-neutral-700/80 focus:border-amber-400 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
              />
              {orderNoteInput && (
                <button
                  type="button"
                  onClick={() => setOrderNoteInput('')}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                  title="Clear note"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[9.5px] text-neutral-400 mt-1">
              Cached in Background Sync queue and included in the WhatsApp query.
            </p>
          </div>

          {/* Recent Order History Chips */}
          {trackingHistory.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <History className="w-3 h-3 text-neutral-500" />
                  <span>Recent Searches ({trackingHistory.length}/5):</span>
                </span>
                <button
                  type="button"
                  onClick={() => setTrackerTab('history')}
                  className="text-amber-400 hover:text-amber-300 transition-colors normal-case cursor-pointer font-semibold"
                >
                  View Full History →
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {trackingHistory.map((item) => {
                  const statusConf = ORDER_STATUS_CONFIG[item.status] || ORDER_STATUS_CONFIG['Enquiry Sent'];
                  const isSelected = orderIdInput.toLowerCase() === item.orderId.toLowerCase();
                  return (
                    <button
                      key={item.orderId}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setOrderIdInput(item.orderId);
                        if (item.orderNote) setOrderNoteInput(item.orderNote);
                        if (orderIdError) setOrderIdError(null);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 border-amber-400 font-bold shadow-sm'
                          : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                      title={`Status: ${item.status} (${formatOrderRelativeTime(item.searchedAt)})`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-neutral-950' : statusConf.dot}`} />
                      <span>#{item.orderId}</span>
                      <span className={`text-[9px] font-sans ${isSelected ? 'text-neutral-950/80 font-bold' : statusConf.text}`}>
                        • {item.status.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsible WhatsApp Message Preview */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setShowTrackingPreview(!showTrackingPreview)}
              className="w-full flex items-center justify-between text-[10.5px] text-neutral-400 hover:text-white py-0.5 cursor-pointer"
            >
              <span>Preview Pre-filled WhatsApp Message</span>
              <span className="text-[11px] font-bold">{showTrackingPreview ? '▲' : '▼'}</span>
            </button>
            {showTrackingPreview && (
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-300 whitespace-pre-wrap leading-relaxed shadow-inner max-h-32 overflow-y-auto">
                {buildTrackingWhatsAppMessage(orderIdInput || 'YOUR_ORDER_ID', orderNoteInput)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              id="submit-order-tracking-btn"
            >
              <MessageCircle className="w-4 h-4 fill-neutral-950 text-neutral-950" />
              <span>
                {!isOnline ? 'Queue for Background Sync' : 'Send Tracking Query to Orders Line'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-950" />
            </motion.button>
          </div>
        </form>
      )}

      {/* Tab 2: Persistent History View */}
      {trackerTab === 'history' && (
        <div className="space-y-3" id="order-tracking-history-view">
          {/* Sub-header with Refresh Status & CSV Export */}
          <div className="flex items-center justify-between gap-1.5 text-[11px] font-bold text-neutral-300 pb-1 border-b border-neutral-800/80">
            <span className="flex items-center gap-1.5 shrink-0">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Last 5 Searches</span>
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              {trackingHistory.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAutoRefresh}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                    autoRefreshEnabled
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border-neutral-800'
                  }`}
                  id="auto-refresh-toggle-btn"
                  aria-pressed={autoRefreshEnabled}
                >
                  <span className="flex h-1.5 w-1.5 relative">
                    {autoRefreshEnabled && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        autoRefreshEnabled ? 'bg-emerald-400' : 'bg-neutral-600'
                      }`}
                    ></span>
                  </span>
                  <span>Auto {autoRefreshEnabled ? `${autoRefreshSecondsLeft}s` : 'Off'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleRefreshLiveStatus(false)}
                disabled={isRefreshingStatus || trackingHistory.length === 0}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 disabled:opacity-40"
                id="refresh-order-statuses-btn"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
                <span>{isRefreshingStatus ? 'Refreshing...' : refreshStatusMessage || 'Refresh Status'}</span>
              </button>

              {trackingHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-750"
                  id="header-export-order-history-csv-btn"
                >
                  {csvExportSuccess ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  )}
                  <span>CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Fulfillment Summary KPI Bar */}
          {trackingHistory.length > 0 && (
            <div
              className="p-2.5 rounded-2xl bg-gradient-to-b from-neutral-900/95 via-neutral-950/90 to-neutral-950 border border-neutral-800 space-y-2 shadow-sm"
              id="order-tracking-summary-widget"
            >
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => {
                    triggerHaptic('light');
                    setHistoryStatusFilter(historyStatusFilter === 'Dispatched' ? 'All' : 'Dispatched');
                  }}
                  className={`p-2 rounded-xl transition-all cursor-pointer border select-none ${
                    historyStatusFilter === 'Dispatched'
                      ? 'bg-purple-950/70 border-purple-500 text-purple-200 ring-1 ring-purple-400/50'
                      : 'bg-purple-950/25 hover:bg-purple-950/45 border-purple-500/30 text-purple-300'
                  }`}
                  id="summary-in-transit-counter-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>🚚</span>
                      <span>In-Transit</span>
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Dispatched
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-black font-mono tracking-tight text-purple-300">
                      {inTransitCount}
                    </span>
                    <span className="text-[9.5px] text-purple-400/80">
                      {inTransitCount === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => {
                    triggerHaptic('light');
                    setHistoryStatusFilter(historyStatusFilter === 'Delivered' ? 'All' : 'Delivered');
                  }}
                  className={`p-2 rounded-xl transition-all cursor-pointer border select-none ${
                    historyStatusFilter === 'Delivered'
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-1 ring-emerald-400/50'
                      : 'bg-emerald-950/25 hover:bg-emerald-950/45 border-emerald-500/30 text-emerald-300'
                  }`}
                  id="summary-delivered-counter-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>✅</span>
                      <span>Delivered</span>
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Completed
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-black font-mono tracking-tight text-emerald-300">
                      {deliveredCount}
                    </span>
                    <span className="text-[9.5px] text-emerald-400/80">
                      {deliveredCount === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick-Filter Toggle Bar */}
          {trackingHistory.length > 0 && (
            <div className="space-y-1.5 pt-0.5" id="order-history-filter-bar">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setHistoryStatusFilter('All');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    historyStatusFilter === 'All'
                      ? 'bg-amber-400 text-neutral-950 ring-1 ring-amber-300 font-black'
                      : 'bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 border border-neutral-800'
                  }`}
                  id="order-filter-all-btn"
                >
                  <span>All</span>
                  <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-neutral-900 text-neutral-400">
                    {trackingHistory.length}
                  </span>
                </button>

                {availableFilterStatuses.map((statusKey) => {
                  const conf = ORDER_STATUS_CONFIG[statusKey];
                  const count = statusCounts[statusKey] || 0;
                  const isActive = historyStatusFilter === statusKey;
                  return (
                    <button
                      key={statusKey}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setHistoryStatusFilter(isActive ? 'All' : statusKey);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                        isActive
                          ? `${conf.bg} ${conf.text} ${conf.border} ring-1 ring-current shadow-sm`
                          : 'bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 border-neutral-800'
                      }`}
                      id={`order-filter-${statusKey.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-btn`}
                    >
                      <span>{conf.icon}</span>
                      <span>{conf.shortLabel}</span>
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-neutral-900 text-neutral-400">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* History Cards List */}
          {trackingHistory.length === 0 ? (
            <div className="py-8 text-center space-y-2.5 bg-neutral-950/50 rounded-xl border border-neutral-800/60 p-4">
              <History className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-xs font-bold text-white">No Order History Yet</p>
              <button
                type="button"
                onClick={() => setTrackerTab('search')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 text-xs font-bold cursor-pointer"
              >
                Track an Order Now
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5" id="order-history-items-list">
              {filteredHistory.map((item) => {
                const statusConf = ORDER_STATUS_CONFIG[item.status] || ORDER_STATUS_CONFIG['Enquiry Sent'];
                const hasPendingSync = syncQueue.some(
                  (q) => q.orderId.toLowerCase() === item.orderId.toLowerCase() && q.status === 'pending'
                );

                return (
                  <div
                    key={item.orderId}
                    className={`p-3 rounded-2xl ${statusConf.cardBg} border ${statusConf.cardBorder} space-y-2.5 transition-all shadow-md relative group`}
                    id={`history-order-card-${item.orderId}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm select-none shrink-0 inline-flex items-center justify-center"
                          role="img"
                          aria-label={statusConf.label}
                          title={`Status: ${statusConf.label}`}
                          id={`history-order-status-icon-${item.orderId}`}
                        >
                          {statusConf.icon}
                        </span>
                        <span className={`font-mono font-bold text-xs ${statusConf.cardAccent}`}>
                          #{item.orderId}
                        </span>
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{formatOrderRelativeTime(item.searchedAt)}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {hasPendingSync && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1"
                            title="Query cached in Background Sync Queue"
                          >
                            <CloudLightning className="w-2.5 h-2.5 animate-pulse" />
                            <span>Queued</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            const updated = removeOrderTrackingItem(item.orderId);
                            setTrackingHistory(updated);
                          }}
                          className="p-1 rounded text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Customer Note in History Card */}
                    {item.orderNote && statusConf.showOrderNote !== false && (
                      <div
                        className={`text-[10.5px] ${statusConf.noteText || 'text-amber-200/90'} font-normal flex items-start gap-1.5 ${statusConf.noteBg || 'bg-neutral-950/70'} p-2 rounded-xl border ${statusConf.noteBorder || 'border-amber-500/20'} leading-snug`}
                        id={`history-order-note-${item.orderId}`}
                        data-testid={`history-order-note-${item.orderId}`}
                      >
                        <span className="shrink-0 mt-0.5 text-xs select-none" role="img" aria-label="note icon">
                          {statusConf.noteIcon || statusConf.orderNoteIcon || '📝'}
                        </span>
                        <div className="space-y-0.5 min-w-0">
                          <span
                            className={`text-[9.5px] font-bold ${statusConf.noteAccent || statusConf.orderNoteAccent || 'text-amber-400/90'} uppercase tracking-wider block`}
                            id={`history-order-note-label-${item.orderId}`}
                          >
                            {statusConf.noteLabel || statusConf.orderNoteLabel || statusConf.orderNote || 'Customer Note'}:
                          </span>
                          <p className="text-neutral-200 break-words" id={`history-order-note-text-${item.orderId}`}>
                            {item.orderNote}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Card Actions: Re-check on WhatsApp */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-900/80">
                      <button
                        type="button"
                        onClick={() => executeTrackOrder(item.orderId, item.status, item.orderNote, 'history_card')}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-neutral-950 text-[10.5px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Send live status query to Line 1 Orders on WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3 fill-neutral-950" />
                        <span>Re-check on WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Background Sync Queue View */}
      {trackerTab === 'sync' && (
        <div className="space-y-3" id="order-tracker-sync-queue-view">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-800 text-[11px] font-bold text-neutral-300">
            <span className="flex items-center gap-1.5">
              <CloudLightning className="w-3.5 h-3.5 text-sky-400" />
              <span>Background Sync Queue</span>
            </span>

            <div className="flex items-center gap-1.5">
              {pendingSyncCount > 0 && (
                <button
                  type="button"
                  onClick={handleManualSyncRetryAll}
                  disabled={isSyncing}
                  className="px-2 py-0.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-bold border border-sky-500/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  id="sync-queue-retry-all-btn"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Retry All ({pendingSyncCount})</span>
                </button>
              )}

              {syncQueue.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    orderTrackerSyncService.clearQueue();
                  }}
                  className="px-1.5 py-0.5 rounded-lg text-[10px] text-neutral-400 hover:text-red-400 bg-neutral-950 hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Clear all queue items"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <p className="text-[10.5px] text-neutral-400 leading-relaxed">
            When you're offline or connectivity drops, your order tracking queries are cached here. The service automatically dispatches them as soon as the network returns.
          </p>

          {syncQueue.length === 0 ? (
            <div className="py-8 text-center space-y-2 bg-neutral-950/50 rounded-xl border border-neutral-800/60 p-4">
              <CloudOff className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-xs font-bold text-white">Sync Queue is Empty</p>
              <p className="text-[10.5px] text-neutral-400">
                All outgoing WhatsApp URL generation attempts have been dispatched or synced.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
              {syncQueue.map((item) => {
                const isPending = item.status === 'pending' || item.status === 'retrying';
                const isSynced = item.status === 'synced';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border space-y-2 transition-all ${
                      isPending
                        ? 'bg-gradient-to-br from-sky-950/40 via-neutral-950 to-neutral-950 border-sky-500/40'
                        : isSynced
                        ? 'bg-gradient-to-br from-emerald-950/40 via-neutral-950 to-neutral-950 border-emerald-500/40'
                        : 'bg-neutral-950 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">
                          #{item.orderId}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isPending
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse'
                              : isSynced
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopySyncUrl(item)}
                          className="p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy generated WhatsApp URL"
                        >
                          {copiedSyncId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            orderTrackerSyncService.removeQueueItem(item.id);
                          }}
                          className="p-1 rounded text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete from queue"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {item.orderNote && (
                      <div className="text-[10px] text-amber-200/90 bg-neutral-950/80 p-1.5 rounded-lg border border-amber-500/20 truncate">
                        <span className="font-bold text-amber-400 mr-1">Note:</span>
                        <span>{item.orderNote}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9.5px] text-neutral-400">
                      <span>Attempts: {item.attempts}</span>
                      <span>{formatOrderRelativeTime(item.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-900">
                      <button
                        type="button"
                        onClick={() => handleRetrySingleSync(item.id, true)}
                        className="flex-1 py-1 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-[10.5px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3 fill-neutral-950" />
                        <span>Launch on WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
