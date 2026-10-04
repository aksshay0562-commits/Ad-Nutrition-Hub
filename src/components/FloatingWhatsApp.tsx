import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { 
  MessageCircle, 
  X, 
  Share2, 
  Check, 
  Copy, 
  QrCode, 
  Download, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  MessageSquare, 
  Mail,
  SlidersHorizontal,
  ShoppingBag,
  HelpCircle,
  CheckCircle2,
  Palette,
  Sparkles,
  ChevronRight,
  Package,
  Truck,
  Clock,
  History,
  Trash2,
  ArrowUpRight,
  RotateCcw,
  ChevronDown,
  Send,
  Search,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { STORE_INFO } from '../types';
import { 
  WhatsAppLine, 
  WhatsAppQueryType,
  QUERY_TYPE_CONFIG,
  buildWhatsAppUrl, 
  buildWhatsAppShareUrl 
} from '../utils/whatsapp';
import { triggerHaptic } from '../utils/haptics';
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
  fetchRealtimeOrderStatuses
} from '../utils/orderTracking';
import { 
  getQrBorderGradientConfig, 
  getSavedColorTheme, 
  getSavedCustomHex, 
  applyColorTheme 
} from '../utils/theme';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export interface FloatingWhatsAppProps {
  onOpenExpertAdvice?: () => void;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  onOpenExpertAdvice,
}) => {
  const [showTooltip, setShowTooltip] = useState(true);
  const [copied, setCopied] = useState(false);
  const [modalCopied, setModalCopied] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Order Tracking feature states
  const [showOrderTracker, setShowOrderTracker] = useState(false);
  const [trackerTab, setTrackerTab] = useState<'search' | 'history'>('search');
  const [orderIdInput, setOrderIdInput] = useState('');
  const [orderIdError, setOrderIdError] = useState<string | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<OrderTrackingHistoryItem[]>([]);
  const [showTrackingPreview, setShowTrackingPreview] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | OrderTrackingStatus>('All');

  // Compute status counts for the quick-filter bar
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { All: trackingHistory.length };
    trackingHistory.forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    return counts;
  }, [trackingHistory]);

  // Statuses that currently exist in the user's history
  const availableFilterStatuses = React.useMemo(() => {
    const present = new Set(trackingHistory.map((item) => item.status));
    return ALL_ORDER_STATUSES.filter((status) => present.has(status));
  }, [trackingHistory]);

  // Filtered history based on quick-filter toggle bar
  const filteredHistory = React.useMemo(() => {
    if (historyStatusFilter === 'All') return trackingHistory;
    return trackingHistory.filter((item) => item.status === historyStatusFilter);
  }, [trackingHistory, historyStatusFilter]);

  const [csvExportSuccess, setCsvExportSuccess] = useState(false);

  // Export current filtered history into Excel-compatible CSV file
  const handleExportCSV = () => {
    if (filteredHistory.length === 0) {
      triggerHaptic('error');
      return;
    }

    triggerHaptic('success');
    const success = exportOrderHistoryToCSV(filteredHistory, historyStatusFilter);
    if (success) {
      setCsvExportSuccess(true);
      setTimeout(() => setCsvExportSuccess(false), 2500);
    }
  };

  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [refreshStatusMessage, setRefreshStatusMessage] = useState<string | null>(null);

  // Hits mock API to fetch real-time statuses for the displayed orders in the history list
  const handleRefreshLiveStatus = async () => {
    const ordersToRefresh = filteredHistory.length > 0 ? filteredHistory : trackingHistory;
    if (ordersToRefresh.length === 0) {
      triggerHaptic('error');
      return;
    }

    setIsRefreshingStatus(true);
    triggerHaptic('medium');

    try {
      const orderIds = ordersToRefresh.map((item) => item.orderId);
      const updates = await fetchRealtimeOrderStatuses(orderIds);

      // Update statuses in localStorage and memory
      let updatedList = getOrderTrackingHistory();
      for (const update of updates) {
        updatedList = updateOrderTrackingStatus(update.orderId, update.status);
      }

      setTrackingHistory(updatedList);
      triggerHaptic('success');
      setRefreshStatusMessage(`Updated ${updates.length} ${updates.length === 1 ? 'order' : 'orders'}!`);
      setTimeout(() => setRefreshStatusMessage(null), 2800);
    } catch (err) {
      console.error('Failed to refresh real-time statuses:', err);
      triggerHaptic('error');
      setRefreshStatusMessage('Refresh failed');
      setTimeout(() => setRefreshStatusMessage(null), 2800);
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  // Load order tracking history from browser localStorage on mount and when modal opens
  const refreshHistory = () => {
    const list = getOrderTrackingHistory();
    setTrackingHistory(list);
    if (list.length > 0 && !orderIdInput) {
      setOrderIdInput(list[0].orderId);
    }
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  useEffect(() => {
    if (showOrderTracker) {
      refreshHistory();
    }
  }, [showOrderTracker]);

  const generateTrackingMessage = (orderId: string): string => {
    const trimmed = orderId.trim();
    return `Namaste AD Nutrition Hub Israna! 🙏\n\n📦 *Order Status Tracking Enquiry*\n• Order Reference ID: *${trimmed}*\n• Routing Line: Orders & Dispatch Desk (Line 1: 70159 59517)\n• Store: Mandi Mor, Israna, Panipat (Haryana)\n\nPlease check the current status of my order:\n1. Has this order been confirmed and packed at the store?\n2. What is the estimated dispatch or in-store pickup readiness time?\n\nThank you!`;
  };

  const executeTrackOrderId = (idToTrack: string, statusHint?: OrderTrackingStatus) => {
    const trimmed = idToTrack.trim();
    if (!trimmed) {
      triggerHaptic('error');
      setOrderIdError('Please enter your Order ID or mobile number');
      return;
    }

    setOrderIdError(null);
    triggerHaptic('success');

    // Persist into localStorage history (stores up to last 5 searched order IDs with status)
    const updated = recordOrderSearch(trimmed, statusHint || 'Enquiry Sent');
    setTrackingHistory(updated);

    const message = generateTrackingMessage(trimmed);
    const targetPhone = STORE_INFO.rawPhone1; // Line 1: Orders line
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTrackOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeTrackOrderId(orderIdInput);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderTrackingStatus) => {
    triggerHaptic('light');
    const updated = updateOrderTrackingStatus(orderId, newStatus);
    setTrackingHistory(updated);
    setEditingStatusId(null);
  };

  const handleRemoveHistoryItem = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const updated = removeOrderTrackingItem(orderId);
    setTrackingHistory(updated);
    if (orderIdInput.toLowerCase() === orderId.toLowerCase()) {
      setOrderIdInput(updated[0]?.orderId || '');
    }
  };

  const handleClearAllHistory = () => {
    triggerHaptic('medium');
    clearOrderTrackingHistory();
    setTrackingHistory([]);
    setOrderIdInput('');
    setTrackerTab('search');
  };

  const [queryType, setQueryType] = useState<WhatsAppQueryType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ad_wa_preferred_query');
      if (saved === 'orders' || saved === 'general') return saved as WhatsAppQueryType;
    }
    return 'orders';
  });

  const selectedLine: WhatsAppLine = QUERY_TYPE_CONFIG[queryType].line;

  const handleSelectQueryType = (type: WhatsAppQueryType) => {
    setQueryType(type);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ad_wa_preferred_query', type);
    }
  };

  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [zoomCopied, setZoomCopied] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-color-theme') || getSavedColorTheme();
    }
    return 'amber';
  });
  const [activeCustomHex, setActiveCustomHex] = useState<string>(getSavedCustomHex);
  const [isQrHovered, setIsQrHovered] = useState(false);
  const [verticalOffset, setVerticalOffset] = useState<number>(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const holdTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const holdTriggeredRef = useRef<boolean>(false);

  // Subtle 3D tilt animation for QR Code Container
  const qrTiltX = useMotionValue(0);
  const qrTiltY = useMotionValue(0);

  const qrSpringX = useSpring(qrTiltX, { stiffness: 350, damping: 25 });
  const qrSpringY = useSpring(qrTiltY, { stiffness: 350, damping: 25 });

  const qrRotateX = useTransform(qrSpringY, [-0.5, 0.5], ['8deg', '-8deg']);
  const qrRotateY = useTransform(qrSpringX, [-0.5, 0.5], ['-8deg', '8deg']);

  const handleQrMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    qrTiltX.set(xPct);
    qrTiltY.set(yPct);
  };

  const handleQrMouseLeave = () => {
    qrTiltX.set(0);
    qrTiltY.set(0);
    setIsQrHovered(false);
  };

  // Standardized WhatsApp URL for active query type (Orders vs General)
  const whatsappUrl = buildWhatsAppUrl({ queryType });

  const getStoreUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://ais-pre-3nngh2ht6suqabobkknf2b-638592500263.asia-southeast1.run.app';
  };

  const storeUrl = getStoreUrl();
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(storeUrl)}`;
  const qrCodeLargeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=12&data=${encodeURIComponent(storeUrl)}`;

  const smsShareMessage = `Check out AD Nutrition Hub Israna for 100% genuine supplements & best prices: ${storeUrl}`;
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const smsShareHref = isIOS
    ? `sms:&body=${encodeURIComponent(smsShareMessage)}`
    : `sms:?body=${encodeURIComponent(smsShareMessage)}`;

  const emailSubject = `AD Nutrition Hub Israna - 100% Genuine Supplements & Store Catalog`;
  const emailBody = `Hello,

Check out AD Nutrition Hub in Mandi Mor, Israna (Panipat, Haryana) for 100% genuine fitness supplements with verified importer tags.

🏪 Online Store & Catalog:
${storeUrl}

✨ Featured Categories & Products Available:
• Whey Protein (Pure Whey & Whey Isolate)
• Mass Gainers & Weight Gain Supplements
• Micronized Creatine Monohydrate
• Pre-Workout Energy Blasts
• Daily Vitamins, Fish Oil Omega-3 & Joint Support

📍 Store Address:
${STORE_INFO.addressDetail}

📞 Phone / WhatsApp Enquiry:
Line 1: ${STORE_INFO.phone}
Line 2: ${STORE_INFO.phone2}

Visit the online catalog or walk in to check batch verification and current in-store offers!`;

  const emailShareHref = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const executeCopyShareLink = async (isModal = false) => {
    const url = getStoreUrl();
    const shareText = `AD Nutrition Hub Israna - 100% Genuine Fitness & Nutrition Supplements in Mandi Mor, Israna, Panipat.\nVisit store: ${url}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 30, 40]);
      }

      if (!isModal && typeof navigator !== 'undefined' && navigator.share && /android|iphone|ipad/i.test(navigator.userAgent)) {
        navigator.share({
          title: 'AD Nutrition Hub Israna',
          text: shareText,
          url: url,
        }).catch(() => {});
      }

      if (isModal) {
        setModalCopied(true);
        setTimeout(() => setModalCopied(false), 2500);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 3500);
      }
    } catch (err) {
      console.warn('Failed to copy store link:', err);
    }
  };

  const downloadQrCode = async () => {
    try {
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'AD-Nutrition-Hub-Israna-QR.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrCodeImageUrl, '_blank');
    }
  };

  const handleZoomShare = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    triggerHaptic('success');
    const url = getStoreUrl();
    const shareText = `AD Nutrition Hub Israna - 100% Genuine Fitness & Nutrition Supplements in Mandi Mor, Israna, Panipat.\nVisit store: ${url}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (typeof navigator !== 'undefined' && navigator.share && /android|iphone|ipad/i.test(navigator.userAgent)) {
        navigator.share({
          title: 'AD Nutrition Hub Israna',
          text: shareText,
          url: url,
        }).catch(() => {});
      }

      setZoomCopied(true);
      setTimeout(() => setZoomCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to share in zoom view:', err);
    }
  };

  const startHold = () => {
    holdTriggeredRef.current = false;
    setIsPressing(true);
    setPressProgress(0);

    const startTime = Date.now();
    const HOLD_DURATION = 550; // milliseconds to trigger share/copy

    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setPressProgress(progressPercent);
    }, 20);

    holdTimerRef.current = window.setTimeout(() => {
      holdTriggeredRef.current = true;
      setIsPressing(false);
      setPressProgress(100);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      executeCopyShareLink();
    }, HOLD_DURATION);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsPressing(false);
    setPressProgress(0);
  };

  const createRipple = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX && e.clientX > 0 ? e.clientX : rect.left + rect.width / 2;
    const clientY = e.clientY && e.clientY > 0 ? e.clientY : rect.top + rect.height / 2;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.5;

    const newRipple: Ripple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size,
    };
    setRipples((prev) => [...prev.slice(-3), newRipple]);
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    createRipple(e);
    if (holdTriggeredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      holdTriggeredRef.current = false;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isQrZoomed) {
          setIsQrZoomed(false);
        } else {
          setShowQrModal(false);
        }
      }
    };
    if (showQrModal || isQrZoomed) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [showQrModal, isQrZoomed]);

  // Tactile haptic feedback when entering high-clarity scanner zoom
  useEffect(() => {
    if (isQrZoomed) {
      triggerHaptic('medium');
    } else {
      setZoomCopied(false);
    }
  }, [isQrZoomed]);

  // Sync with user's selected app color theme (e.g. gold/amber, emerald, cyan, etc.)
  useEffect(() => {
    const handleThemeChange = (e?: Event) => {
      const customEvent = e as CustomEvent<{ themeId?: string; customHex?: string }> | undefined;
      const themeId = customEvent?.detail?.themeId || (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-color-theme') : null) || getSavedColorTheme();
      const customHex = customEvent?.detail?.customHex || getSavedCustomHex();
      setActiveTheme(themeId || 'amber');
      setActiveCustomHex(customHex);
    };

    window.addEventListener('ad_theme_change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    let observer: MutationObserver | null = null;
    if (typeof document !== 'undefined') {
      observer = new MutationObserver(() => {
        handleThemeChange();
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-color-theme'],
      });
    }

    return () => {
      window.removeEventListener('ad_theme_change', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
      if (observer) observer.disconnect();
    };
  }, []);

  const qrThemeConfig = getQrBorderGradientConfig(activeTheme, activeCustomHex);

  // Detect if the floating widget overlaps with the footer and shift vertically
  useEffect(() => {
    let ticking = false;

    const checkFooterOverlap = () => {
      const footer = document.getElementById('app-footer') || document.querySelector('footer');
      if (!footer) {
        setVerticalOffset(0);
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Base bottom offset is 24px (bottom-6). We want at least a 20px clear buffer above the footer.
      const margin = 20;
      const baseBottom = 24;
      const visibleFooterTopDistance = viewportHeight - footerRect.top;

      if (visibleFooterTopDistance > 0) {
        // Shift needed so widget sits cleanly above the footer's top boundary
        const targetShift = visibleFooterTopDistance + margin - baseBottom;
        // Safety cap so the button never shoots past the top of the viewport
        const maxShift = Math.max(0, viewportHeight - 120);
        const shift = Math.min(Math.max(0, targetShift), maxShift);
        setVerticalOffset(shift);
      } else {
        setVerticalOffset(0);
      }
    };

    const handleScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkFooterOverlap();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check
    checkFooterOverlap();

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    // Watch for dynamic content expansions (e.g., categories loaded, accordion expansions)
    let resizeObserver: ResizeObserver | null = null;
    const footer = document.getElementById('app-footer') || document.querySelector('footer');
    if (footer && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleScrollOrResize();
      });
      resizeObserver.observe(footer);
    }

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  // User inactivity tracking (10 seconds timeout for subtle scale-pulse effect)
  const [isInactive, setIsInactive] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const INACTIVITY_TIMEOUT_MS = 10000; // 10 seconds of user inactivity

    const resetInactivity = () => {
      setIsInactive(false);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        setIsInactive(true);
      }, INACTIVITY_TIMEOUT_MS);
    };

    // User activity events that reset the 10-second timer
    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'touchmove',
      'scroll',
      'wheel',
      'click'
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivity, { passive: true });
    });

    // Start initial 10s timer on mount
    resetInactivity();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // Scale pulse active when user is inactive, unless QR modal or hold-press is active
  const activePulse = isInactive && !showQrModal && !isPressing;

  return (
    <>
      {/* Floating Widget Container with dynamic footer avoidance, soft spring-based entry, and 10s inactivity scale-pulse */}
      <motion.div 
        className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 select-none pointer-events-none *:pointer-events-auto origin-bottom-right"
        initial={{ opacity: 0, y: 50, x: 20, scale: 0.88 }}
        animate={{ 
          opacity: 1, 
          y: -verticalOffset, 
          x: 0, 
          scale: activePulse ? [1, 1.055, 0.99, 1.045, 1] : 1 
        }}
        transition={{
          y: {
            type: 'spring',
            stiffness: 260,
            damping: 22,
            mass: 0.85,
          },
          x: {
            type: 'spring',
            stiffness: 260,
            damping: 22,
            mass: 0.85,
          },
          scale: activePulse
            ? {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 2.6,
                ease: 'easeInOut',
              }
            : {
                type: 'spring',
                stiffness: 260,
                damping: 22,
                mass: 0.85,
              },
          opacity: { duration: 0.4 }
        }}
        id="floating-whatsapp-widget"
      >
        {/* Copied Success Toast */}
        {copied && (
          <div 
            className="bg-neutral-900 border border-emerald-500 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
            id="whatsapp-share-copied-toast"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div>
              <p className="text-white font-bold">Store link copied to clipboard!</p>
              <p className="text-[10px] text-neutral-400">Share with friends on WhatsApp or Instagram</p>
            </div>
          </div>
        )}

        {/* Tooltip bubble with spring-based entry animation */}
        <AnimatePresence>
          {!copied && showTooltip && !showQrModal && (
            <motion.div 
              key="floating-whatsapp-tooltip"
              initial={{ opacity: 0, scale: 0.82, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 8, transition: { duration: 0.15 } }}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 24,
                mass: 0.8,
              }}
              className="relative bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs py-2 px-3.5 rounded-xl shadow-xl max-w-xs flex items-center gap-2 origin-bottom-right"
              id="floating-whatsapp-tooltip"
            >
              <div className="text-[11px] leading-snug">
                <span>Enquire on WhatsApp! </span>
                <span className="text-neutral-400 block sm:inline text-[10px]">
                  (Toggle Settings ⚙️ for Orders vs General lines)
                </span>
              </div>
              <button
                onClick={() => setShowTooltip(false)}
                className="text-neutral-400 hover:text-white p-0.5 shrink-0 transition-colors"
                title="Dismiss"
                id="dismiss-whatsapp-tooltip-btn"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-neutral-900 border-r border-b border-neutral-700 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* WhatsApp Settings & Line Switcher Menu */}
        <AnimatePresence>
          {showSettingsMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8, transition: { duration: 0.15 } }}
              className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl shadow-2xl p-3.5 w-80 sm:w-88 space-y-3 origin-bottom-right"
              id="whatsapp-settings-menu"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      WhatsApp Settings
                    </h4>
                    <p className="text-[10px] text-neutral-400">
                      Switch line for different query types
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsMenu(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                  aria-label="Close WhatsApp settings"
                  id="close-whatsapp-settings-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Segmented UI Toggle: Orders vs General */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-300">
                    Query Routing Mode
                  </span>
                  <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-semibold">
                    <span className={`w-2 h-2 rounded-full ${
                      queryType === 'orders' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
                    }`} />
                    {queryType === 'orders' ? 'Orders Active' : 'General Active'}
                  </span>
                </div>

                <div 
                  className="grid grid-cols-2 p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold relative"
                  id="whatsapp-query-segmented-toggle"
                >
                  {/* Segment: Orders */}
                  <button
                    type="button"
                    onClick={() => handleSelectQueryType('orders')}
                    className={`relative z-10 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      queryType === 'orders'
                        ? 'text-neutral-950'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    id="toggle-query-orders-btn"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Orders</span>
                    <span className="text-[9px] opacity-75 font-semibold">(Line 1)</span>
                    {queryType === 'orders' && (
                      <motion.div
                        layoutId="activeQueryPill"
                        className="absolute inset-0 bg-amber-400 rounded-lg -z-10 shadow-sm"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>

                  {/* Segment: General */}
                  <button
                    type="button"
                    onClick={() => handleSelectQueryType('general')}
                    className={`relative z-10 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      queryType === 'general'
                        ? 'text-neutral-950'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    id="toggle-query-general-btn"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>General</span>
                    <span className="text-[9px] opacity-75 font-semibold">(Line 2)</span>
                    {queryType === 'general' && (
                      <motion.div
                        layoutId="activeQueryPill"
                        className="absolute inset-0 bg-emerald-400 rounded-lg -z-10 shadow-sm"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Interactive Line Selection Cards */}
              <div className="space-y-2 pt-0.5">
                {/* Line 1 Card (Orders) */}
                <div
                  onClick={() => handleSelectQueryType('orders')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                    queryType === 'orders'
                      ? 'bg-neutral-800/90 border-amber-500/70 ring-1 ring-amber-400/40 shadow-sm'
                      : 'bg-neutral-950/70 hover:bg-neutral-800 border-neutral-800 hover:border-neutral-700'
                  }`}
                  id="settings-line1-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                        queryType === 'orders'
                          ? 'bg-amber-400 text-neutral-950'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        1
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                            {STORE_INFO.phone}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400/20 text-amber-400 border border-amber-400/30">
                            Orders & Stock
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400">
                          Product bookings, current inventory & pricing
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      {queryType === 'orders' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      )}
                      <a
                        href={buildWhatsAppUrl({ queryType: 'orders' })}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSettingsMenu(false);
                        }}
                        className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] flex items-center gap-1 transition-colors shadow-sm"
                        title="Direct chat on Line 1"
                      >
                        <MessageCircle className="w-3 h-3 fill-neutral-950" />
                        <span>Chat</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Line 2 Card (General) */}
                <div
                  onClick={() => handleSelectQueryType('general')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                    queryType === 'general'
                      ? 'bg-neutral-800/90 border-emerald-500/70 ring-1 ring-emerald-400/40 shadow-sm'
                      : 'bg-neutral-950/70 hover:bg-neutral-800 border-neutral-800 hover:border-neutral-700'
                  }`}
                  id="settings-line2-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                        queryType === 'general'
                          ? 'bg-emerald-400 text-neutral-950'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        2
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {STORE_INFO.phone2}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-400/20 text-emerald-400 border border-emerald-400/30">
                            General Enquiry
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400">
                          Supplement advice, dosage, timing & shop queries
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      {queryType === 'general' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      <a
                        href={buildWhatsAppUrl({ queryType: 'general' })}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSettingsMenu(false);
                        }}
                        className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-[10px] flex items-center gap-1 transition-colors shadow-sm"
                        title="Direct chat on Line 2"
                      >
                        <MessageCircle className="w-3 h-3 fill-neutral-950" />
                        <span>Chat</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Structured Nutrition Expert Advice Banner */}
              {onOpenExpertAdvice && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    setShowSettingsMenu(false);
                    onOpenExpertAdvice();
                  }}
                  className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-amber-500/15 to-emerald-500/15 hover:from-emerald-500/25 hover:to-amber-500/25 border border-emerald-500/40 text-left transition-all cursor-pointer flex items-center justify-between group"
                  id="wa-menu-expert-advice-btn"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xs font-bold text-white">Nutrition Expert Advice</p>
                      <p className="text-[10px] text-neutral-300">Personalized stack guidance before chat</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}

              {/* Order Tracking Direct Shortcut */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowOrderTracker(true);
                  setShowSettingsMenu(false);
                }}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-yellow-500/25 border border-amber-500/40 text-left transition-all cursor-pointer flex items-center justify-between group"
                id="wa-menu-track-order-btn"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-white">Track Order Status</p>
                    <p className="text-[10px] text-neutral-300">Enter Order ID to enquire directly on Orders Line 1</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
              </button>

              {/* Message Template Preview Banner */}
              <div className="p-2.5 rounded-xl bg-neutral-950/90 border border-neutral-800/80 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span>Pre-filled Enquiry Preview:</span>
                  <span className={queryType === 'orders' ? 'text-amber-400' : 'text-emerald-400'}>
                    {queryType === 'orders' ? 'Line 1 Template' : 'Line 2 Template'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 italic line-clamp-2 leading-relaxed">
                  "{QUERY_TYPE_CONFIG[queryType].defaultMessage}"
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Tracking Modal / Popover */}
        <AnimatePresence>
          {showOrderTracker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8, transition: { duration: 0.15 } }}
              className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl shadow-2xl p-4 w-80 sm:w-92 space-y-3.5 origin-bottom-right"
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
                      Pre-fills WhatsApp status query to Orders line
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOrderTracker(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                  aria-label="Close order tracking"
                  id="close-order-tracker-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Segmented Tab Navigation: Search vs History */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold relative">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setTrackerTab('search');
                  }}
                  className={`relative z-10 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    trackerTab === 'search'
                      ? 'text-neutral-950 font-black'
                      : 'text-neutral-400 hover:text-white'
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
                  className={`relative z-10 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    trackerTab === 'history'
                      ? 'text-neutral-950 font-black'
                      : 'text-neutral-400 hover:text-white'
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
              </div>

              {/* Tab 1: Search Form View */}
              {trackerTab === 'search' ? (
                <form onSubmit={handleTrackOrder} className="space-y-3">
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
                          orderIdError ? 'border-red-500 ring-1 ring-red-500/40' : 'border-neutral-700/80 focus:border-amber-400'
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
                          const statusConf = ORDER_STATUS_CONFIG[item.status];
                          const isSelected = orderIdInput.toLowerCase() === item.orderId.toLowerCase();
                          return (
                            <button
                              key={item.orderId}
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setOrderIdInput(item.orderId);
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

                  {/* Routed Line Clarification */}
                  <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-[10.5px] text-neutral-400 space-y-1">
                    <div className="flex items-center justify-between font-bold text-neutral-300">
                      <span>Target WhatsApp Desk:</span>
                      <span className="text-amber-400 font-bold">Line 1 ({STORE_INFO.phone})</span>
                    </div>
                    <p className="leading-relaxed">
                      Direct line to Akshay Malik & Israna store packing staff for real-time dispatch and stock status.
                    </p>
                  </div>

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
                        {generateTrackingMessage(orderIdInput || 'YOUR_ORDER_ID')}
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
                      <span>Send Tracking Query to Orders Line</span>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-950" />
                    </motion.button>

                    <a
                      href={`tel:${STORE_INFO.phone}`}
                      className="w-full py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Urgent? Call Orders Desk: {STORE_INFO.phone}</span>
                    </a>
                  </div>
                </form>
              ) : (
                /* Tab 2: Persistent History View (Displays Last 5 Searched Orders with Distinct Backgrounds & Quick-Filter) */
                <div className="space-y-3" id="order-tracking-history-view">
                  {/* History View Sub-header with Refresh Status & Quick CSV Export */}
                  <div className="flex items-center justify-between gap-1.5 text-[11px] font-bold text-neutral-300 pb-1 border-b border-neutral-800/80">
                    <span className="flex items-center gap-1.5 shrink-0">
                      <History className="w-3.5 h-3.5 text-amber-400" />
                      <span>Last 5 Searches</span>
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Refresh Status Button hitting Mock API */}
                      <button
                        type="button"
                        onClick={handleRefreshLiveStatus}
                        disabled={isRefreshingStatus || (filteredHistory.length === 0 && trackingHistory.length === 0)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                          isRefreshingStatus
                            ? 'bg-amber-400/25 text-amber-300 border-amber-400/50 animate-pulse'
                            : refreshStatusMessage
                            ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border-amber-500/30 hover:border-amber-400 shadow-sm'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        title="Hit mock API to fetch real-time fulfillment statuses for displayed orders"
                        id="refresh-order-statuses-btn"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshingStatus ? 'animate-spin text-amber-400' : ''}`} />
                        <span>{isRefreshingStatus ? 'Refreshing...' : refreshStatusMessage || 'Refresh Status'}</span>
                      </button>

                      {/* Quick CSV Export */}
                      {trackingHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={handleExportCSV}
                          disabled={filteredHistory.length === 0}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                            csvExportSuccess
                              ? 'bg-emerald-500/25 text-emerald-400 border-emerald-500/50'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-750 hover:border-emerald-500/40'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                          title="Export current filtered history to CSV (Excel compatible)"
                          id="header-export-order-history-csv-btn"
                        >
                          {csvExportSuccess ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>CSV</span>
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                              <span>CSV</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick-Filter Toggle Bar */}
                  {trackingHistory.length > 0 && (
                    <div className="space-y-1.5 pt-0.5" id="order-history-filter-bar">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>Filter by Status:</span>
                        {historyStatusFilter !== 'All' && (
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setHistoryStatusFilter('All');
                            }}
                            className="text-amber-400 hover:text-amber-300 font-semibold normal-case cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Reset ({filteredHistory.length}/{trackingHistory.length})</span>
                          </button>
                        )}
                      </div>

                      {/* Filter Pills Scrollable Row */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
                        {/* 'All' Filter Pill */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setHistoryStatusFilter('All');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                            historyStatusFilter === 'All'
                              ? 'bg-amber-400 text-neutral-950 shadow-sm shadow-amber-950/40 ring-1 ring-amber-300 font-black'
                              : 'bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800'
                          }`}
                          id="order-filter-all-btn"
                        >
                          <span>All</span>
                          <span className={`px-1 py-0.2 rounded text-[9px] font-mono ${
                            historyStatusFilter === 'All' ? 'bg-neutral-950/20 text-neutral-950 font-black' : 'bg-neutral-900 text-neutral-400'
                          }`}>
                            {trackingHistory.length}
                          </span>
                        </button>

                        {/* Available status filter pills */}
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
                                  : 'bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border-neutral-800'
                              }`}
                              id={`order-filter-${statusKey.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-btn`}
                            >
                              <span>{conf.icon}</span>
                              <span>{conf.shortLabel}</span>
                              <span className={`px-1 py-0.2 rounded text-[9px] font-mono ${isActive ? 'bg-neutral-950/40' : 'bg-neutral-900 text-neutral-400'}`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty States */}
                  {trackingHistory.length === 0 ? (
                    <div className="py-8 text-center space-y-2.5 bg-neutral-950/50 rounded-xl border border-neutral-800/60 p-4">
                      <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                        <History className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-white">No Order History Yet</p>
                      <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                        Search for an order ID or place a quick order to see its live tracking status saved here.
                      </p>
                      <button
                        type="button"
                        onClick={() => setTrackerTab('search')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Track an Order Now</span>
                      </button>
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="py-6 text-center space-y-2 bg-neutral-950/40 rounded-xl border border-neutral-800/60 p-4">
                      <p className="text-xs text-neutral-400">
                        No orders matching status <span className="text-white font-bold">"{historyStatusFilter}"</span>.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setHistoryStatusFilter('All');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-semibold transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Show All Orders ({trackingHistory.length})</span>
                      </button>
                    </div>
                  ) : (
                    /* History Cards List with Distinct Status Background Colors */
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5" id="order-history-items-list">
                      {filteredHistory.map((item) => {
                        const statusConf = ORDER_STATUS_CONFIG[item.status] || ORDER_STATUS_CONFIG['Enquiry Sent'];
                        const isEditingStatus = editingStatusId === item.orderId;

                        return (
                          <div
                            key={item.orderId}
                            className={`p-3 rounded-2xl ${statusConf.cardBg} border ${statusConf.cardBorder} space-y-2.5 transition-all shadow-md relative group`}
                            id={`history-order-card-${item.orderId}`}
                          >
                            {/* Card Top: Order ID, Timestamp & Delete button */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-xs ${statusConf.cardAccent}`}>
                                  #{item.orderId}
                                </span>
                                <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-neutral-500" />
                                  <span>{formatOrderRelativeTime(item.searchedAt)}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveHistoryItem(item.orderId, e)}
                                  className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-900/80 transition-colors cursor-pointer"
                                  title="Remove from history"
                                  aria-label={`Remove order ${item.orderId} from history`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Product Hint if available */}
                            {item.productHint && (
                              <div className="text-[10.5px] text-neutral-200 font-medium truncate flex items-center gap-1.5 bg-neutral-950/60 px-2.5 py-1 rounded-lg border border-neutral-800/80">
                                <span>📦</span>
                                <span className="truncate">{item.productHint}</span>
                              </div>
                            )}

                            {/* Status Section with Interactive Dropdown Picker */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                                <span>Status:</span>
                                <button
                                  type="button"
                                  onClick={() => setEditingStatusId(isEditingStatus ? null : item.orderId)}
                                  className="text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                                >
                                  <span>{isEditingStatus ? 'Done' : 'Change Status'}</span>
                                  <ChevronDown className={`w-3 h-3 transition-transform ${isEditingStatus ? 'rotate-180' : ''}`} />
                                </button>
                              </div>

                              {/* Current Status Badge with distinct background */}
                              <div
                                onClick={() => setEditingStatusId(isEditingStatus ? null : item.orderId)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer shadow-sm ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                                title="Click to update status"
                              >
                                <span className={`w-2 h-2 rounded-full ${statusConf.dot} animate-pulse`} />
                                <span>{statusConf.icon} {statusConf.label}</span>
                              </div>

                              {/* Interactive Inline Status Picker Menu */}
                              <AnimatePresence>
                                {isEditingStatus && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-750 space-y-1 mt-1 overflow-hidden shadow-xl"
                                  >
                                    <span className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider block">
                                      Select Updated Status from Store:
                                    </span>
                                    <div className="grid grid-cols-1 gap-1">
                                      {ALL_ORDER_STATUSES.map((statusOption) => {
                                        const optConf = ORDER_STATUS_CONFIG[statusOption];
                                        const isCurrent = item.status === statusOption;

                                        return (
                                          <button
                                            key={statusOption}
                                            type="button"
                                            onClick={() => handleStatusChange(item.orderId, statusOption)}
                                            className={`text-left px-2 py-1.5 rounded-lg text-[10.5px] font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                              isCurrent
                                                ? 'bg-neutral-800 text-white font-bold ring-1 ring-amber-400/40'
                                                : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
                                            }`}
                                          >
                                            <span className="flex items-center gap-1.5">
                                              <span>{optConf.icon}</span>
                                              <span>{statusOption}</span>
                                            </span>
                                            {isCurrent && (
                                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Card Actions: Re-check on WhatsApp & Fill in Search */}
                            <div className="flex items-center gap-1.5 pt-1.5 border-t border-neutral-900/80">
                              <button
                                type="button"
                                onClick={() => executeTrackOrderId(item.orderId, item.status)}
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-neutral-950 text-[10.5px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                title="Send live status query to Line 1 Orders on WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3 fill-neutral-950" />
                                <span>Re-check on WhatsApp</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic('light');
                                  setOrderIdInput(item.orderId);
                                  setTrackerTab('search');
                                }}
                                className="py-1.5 px-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[10.5px] font-semibold border border-neutral-800 transition-colors cursor-pointer"
                                title="Open in search tab"
                              >
                                <span>Edit</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* History Footer Actions with CSV Download and Clear History */}
                  {trackingHistory.length > 0 && (
                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2 text-[10.5px]">
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        disabled={filteredHistory.length === 0}
                        className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer border ${
                          csvExportSuccess
                            ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-200 hover:text-white border-neutral-750 hover:border-emerald-500/50 shadow-sm'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        id="export-order-history-csv-btn"
                        title="Download CSV spreadsheet of current filtered orders for Excel audit"
                      >
                        {csvExportSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>CSV Downloaded!</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Export CSV ({filteredHistory.length})</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleClearAllHistory}
                          className="text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 cursor-pointer font-medium text-[10.5px]"
                          id="clear-order-tracking-history-btn"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear History</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main WhatsApp & Quick Action Buttons */}
        <div className="relative flex items-center gap-2">
          {/* Order Tracking Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.90 }}
            onClick={() => {
              triggerHaptic('light');
              setShowOrderTracker(!showOrderTracker);
              setShowSettingsMenu(false);
            }}
            className={`p-2.5 rounded-full border shadow-xl flex items-center justify-center transition-colors cursor-pointer relative ${
              showOrderTracker 
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-amber-500/20' 
                : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-amber-400'
            }`}
            title="Track Order: Enter Order ID to get status on WhatsApp (Orders line)"
            id="track-order-floating-btn"
            aria-label="Track Order Status"
          >
            <Truck className="w-4 h-4" />
          </motion.button>

          {/* WhatsApp Settings & Line Switcher Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.90 }}
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`p-2.5 rounded-full border shadow-xl flex items-center justify-center transition-colors cursor-pointer relative ${
              showSettingsMenu 
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-amber-500/20' 
                : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-amber-400'
            }`}
            title={`WhatsApp Settings: Switch between Orders (${STORE_INFO.phone}) & General (${STORE_INFO.phone2})`}
            id="choose-whatsapp-line-btn"
            aria-label="WhatsApp Settings & Query Switcher"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {/* Small active query type indicator dot */}
            <span 
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-neutral-900 ${
                queryType === 'orders' ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
          </motion.button>

          {/* Share via QR Code Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.90 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={() => setShowQrModal(true)}
            className="p-2.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-amber-400 hover:text-amber-300 shadow-xl flex items-center justify-center transition-colors cursor-pointer"
            title="Share via QR Code"
            id="share-via-qr-code-btn"
            aria-label="Share store via QR Code"
          >
            <QrCode className="w-4 h-4" />
          </motion.button>

          {/* Dedicated Quick-Share pill icon for 1-click clipboard copy */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.90 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={(e) => {
              e.preventDefault();
              executeCopyShareLink();
            }}
            className="p-2.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-400 shadow-xl flex items-center justify-center transition-colors cursor-pointer"
            title="Copy store link to clipboard"
            id="quick-share-store-link-btn"
            aria-label="Copy store link to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </motion.button>

          {/* WhatsApp Button with Framer Motion tactile press animation & Hold-to-Copy */}
          <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            onTouchCancel={cancelHold}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.92, y: 1 }}
            transition={{
              type: 'spring',
              stiffness: 450,
              damping: 20,
            }}
            className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-full text-white shadow-2xl font-bold text-sm select-none cursor-pointer ${
              isPressing
                ? 'bg-emerald-700 shadow-emerald-900/60 ring-4 ring-amber-400/50'
                : copied
                ? 'bg-neutral-800 border border-emerald-500 text-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
            }`}
            id="floating-whatsapp-btn"
            aria-label={`Chat on WhatsApp with AD Nutrition Hub Israna (${queryType === 'orders' ? 'Orders Line 1' : 'General Line 2'})`}
            title={`Click to chat on WhatsApp (${queryType === 'orders' ? 'Orders: Line 1' : 'General: Line 2'}) • Hold to copy store link`}
          >
            {/* Small active query line indicator badge on the button */}
            <span
              className={`absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md border border-neutral-900 flex items-center gap-1 z-20 pointer-events-none transition-colors ${
                queryType === 'orders' ? 'bg-amber-400 text-neutral-950' : 'bg-emerald-400 text-neutral-950'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-950 animate-pulse" />
              <span>{queryType === 'orders' ? 'Orders: Line 1' : 'General: Line 2'}</span>
            </span>

            {/* Subtle secondary glowing outer-ring animation when idle */}
            {!copied && !isPressing && (
              <>
                {/* Secondary ambient soft glow aura */}
                <motion.span
                  className="absolute -inset-1 rounded-full bg-emerald-500/25 blur-[3px] pointer-events-none -z-10"
                  animate={{
                    scale: [1, 1.12, 1],
                    opacity: [0.35, 0.75, 0.35],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  aria-hidden="true"
                />
                {/* Secondary crisp pulsating outer accent ring */}
                <motion.span
                  className="absolute -inset-1.5 rounded-full border border-emerald-400/35 pointer-events-none -z-10"
                  animate={{
                    scale: [0.98, 1.08, 0.98],
                    opacity: [0.2, 0.65, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.25,
                  }}
                  aria-hidden="true"
                />
              </>
            )}

            {/* Circular hold progress bar indicator */}
            {isPressing && (
              <div 
                className="absolute inset-0 rounded-full border-2 border-amber-400 pointer-events-none transition-all duration-75 z-10"
                style={{
                  clipPath: `inset(0 ${100 - pressProgress}% 0 0)`
                }}
              />
            )}

            {/* Radial Ripple Effect expanding from click point */}
            <span className="absolute inset-0 overflow-hidden rounded-full pointer-events-none z-0">
              {ripples.map((ripple) => (
                <motion.span
                  key={ripple.id}
                  initial={{ scale: 0, opacity: 0.55 }}
                  animate={{ scale: 1, opacity: 0 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                  onAnimationComplete={() => {
                    setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
                  }}
                  className="absolute rounded-full bg-white/40 pointer-events-none"
                  style={{
                    left: ripple.x - ripple.size / 2,
                    top: ripple.y - ripple.size / 2,
                    width: ripple.size,
                    height: ripple.size,
                  }}
                  aria-hidden="true"
                />
              ))}
            </span>

            {/* Status icon / pulse */}
            <span className="relative z-10 flex items-center gap-2">
              {copied ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : isPressing ? (
                <Copy className="w-5 h-5 text-amber-300 animate-pulse" />
              ) : (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <MessageCircle className="w-5 h-5 fill-white" />
                </>
              )}
            </span>

            <span className="relative z-10 hidden sm:inline">
              {copied
                ? 'Link Copied!'
                : isPressing
                ? 'Keep holding to copy...'
                : queryType === 'orders'
                ? 'WhatsApp Orders'
                : 'WhatsApp Enquiry'}
            </span>
            <span className="relative z-10 sm:hidden">
              {copied ? 'Copied!' : isPressing ? 'Holding...' : queryType === 'orders' ? 'Orders' : 'Enquiry'}
            </span>
          </motion.a>
        </div>
      </motion.div>

      {/* Share via QR Code Modal Popup */}
      {showQrModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowQrModal(false)}
          id="share-qr-modal-backdrop"
        >
          <div 
            className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            id="share-qr-code-popup"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              id="close-share-qr-modal-btn"
              aria-label="Close QR popup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="space-y-1 pt-1">
              <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Scan to Visit Store
              </h3>
              <p className="text-xs text-neutral-400">
                Point any smartphone camera to view genuine supplements & prices
              </p>
            </div>

            {/* QR Code Container with Rotating Gradient-Border, 3D Tilt & Click-to-Zoom */}
            <div style={{ perspective: 800 }} className="inline-block mx-auto">
              <motion.div 
                className="relative p-1 sm:p-1.5 rounded-2xl shadow-xl shadow-amber-500/20 inline-block mx-auto cursor-zoom-in group select-none"
                id="qr-code-image-container"
                onClick={() => setIsQrZoomed(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsQrZoomed(true);
                  }
                }}
                aria-label="Click to enlarge QR code to fullscreen"
                title="Click to zoom in for easier scanning"
                style={{
                  rotateX: qrRotateX,
                  rotateY: qrRotateY,
                  transformStyle: 'preserve-3d',
                }}
                whileHover={{
                  scale: 1.04,
                  boxShadow: '0 20px 35px -5px rgba(245, 158, 11, 0.45), 0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                onMouseMove={(e) => {
                  handleQrMouseMove(e);
                  if (!isQrHovered) setIsQrHovered(true);
                }}
                onMouseEnter={() => setIsQrHovered(true)}
                onMouseLeave={handleQrMouseLeave}
              >
                {/* Soft green scan confirmation pulse aura on hover */}
                <motion.div
                  className="absolute -inset-2 rounded-2xl pointer-events-none -z-10 transition-opacity duration-300"
                  style={{
                    opacity: isQrHovered ? 1 : 0,
                    boxShadow: '0 0 28px 4px rgba(16, 185, 129, 0.45)',
                  }}
                  animate={isQrHovered ? { opacity: [0.6, 1, 0.7] } : { opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  aria-hidden="true"
                />

                {/* Ambient rotating glow behind border */}
                <motion.div
                  className="absolute -inset-1.5 rounded-2xl blur-md opacity-45 pointer-events-none -z-20"
                  style={{
                    background: 'conic-gradient(from 0deg, #f59e0b 0%, #fbbf24 20%, #10b981 40%, #06b6d4 60%, #fbbf24 80%, #f59e0b 100%)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  aria-hidden="true"
                />

                {/* Rotating gradient-border mask layer with metallic light-sweep */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none -z-10">
                  <motion.div
                    className="absolute -inset-[140%] pointer-events-none"
                    style={{
                      background: 'conic-gradient(from 0deg, #f59e0b 0%, #fbbf24 20%, #10b981 40%, #06b6d4 60%, #fbbf24 80%, #f59e0b 100%)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 7,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    aria-hidden="true"
                  />

                  {/* Periodic metallic light-sweep shine across the border */}
                  <motion.div
                    className="absolute -inset-[80%] pointer-events-none mix-blend-screen"
                    style={{
                      background:
                        'linear-gradient(115deg, transparent 25%, rgba(255, 255, 255, 0.1) 38%, rgba(255, 255, 255, 0.95) 50%, rgba(255, 255, 255, 0.1) 62%, transparent 75%)',
                    }}
                    initial={{ x: '-120%', y: '-120%' }}
                    animate={{ x: '120%', y: '120%' }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      repeatDelay: 3.5,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    aria-hidden="true"
                  />
                </div>

                {/* Elevated white QR card with persistent glossy laminated texture */}
                <div 
                  style={{ transform: 'translateZ(14px)' }}
                  className="relative z-10 bg-white p-3.5 sm:p-4 rounded-xl shadow-inner flex items-center justify-center transition-transform overflow-hidden"
                >
                  <img
                    src={qrCodeImageUrl}
                    alt="Store QR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain block select-none"
                    loading="eager"
                  />

                  {/* Persistent subtle 'glossy glass' laminated card overlay */}
                  <div 
                    className="absolute inset-0 pointer-events-none rounded-xl"
                    style={{
                      background: 'linear-gradient(130deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.16) 32%, rgba(255, 255, 255, 0) 52%, rgba(255, 255, 255, 0.04) 75%, rgba(255, 255, 255, 0.22) 100%)',
                      boxShadow: 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.06)',
                    }}
                    aria-hidden="true"
                  />

                  {/* Fine diagonal glossy specular reflection streak */}
                  <div
                    className="absolute -inset-full pointer-events-none rotate-12 opacity-60"
                    style={{
                      background: 'linear-gradient(to right, transparent 35%, rgba(255, 255, 255, 0.15) 46%, rgba(255, 255, 255, 0.32) 49%, rgba(255, 255, 255, 0) 53%, transparent 65%)',
                    }}
                    aria-hidden="true"
                  />

                  {/* Corner Zoom badge indicator */}
                  <div className="absolute top-2.5 right-2.5 z-30 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] text-amber-300 font-medium flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-2.5 h-2.5" />
                    <span>Zoom</span>
                  </div>

                  {/* Scan Success Viewfinder & Reticle Animation on Hover */}
                  <AnimatePresence>
                    {isQrHovered && (
                      <motion.div
                        initial={{ opacity: 0, scale: 1.06 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.03 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="absolute inset-3 pointer-events-none z-30"
                      >
                        {/* 4 Glowing Emerald Corner Target Reticles */}
                        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-500 rounded-tl-sm shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-500 rounded-tr-sm shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-500 rounded-bl-sm shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-500 rounded-br-sm shadow-[0_0_8px_rgba(16,185,129,0.9)]" />

                        {/* Subtle Horizontal Scanner Laser Sweep */}
                        <motion.div
                          className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(16,185,129,0.95)] opacity-80"
                          initial={{ y: 2 }}
                          animate={{ y: [4, 155, 4] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Scan Success Confirmation Checkmark Badge on Hover */}
                  <AnimatePresence>
                    {isQrHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.86 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute bottom-2.5 inset-x-0 mx-auto w-fit z-40 px-2.5 py-1 rounded-full bg-neutral-950/92 border border-emerald-500/70 backdrop-blur-md shadow-lg shadow-emerald-950/70 flex items-center gap-1.5 pointer-events-none"
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 600, damping: 16, delay: 0.06 }}
                          className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-500/60"
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </motion.div>
                        <span className="text-[10.5px] font-semibold text-emerald-300 tracking-tight whitespace-nowrap">
                          Verified Scannable
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Persistent outer container laminated card sheen */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none z-20"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.06) 24%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.1) 100%)',
                    boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.5)',
                  }}
                  aria-hidden="true"
                />
              </motion.div>
            </div>

            {/* Click to Zoom In hint button */}
            <button
              type="button"
              onClick={() => setIsQrZoomed(true)}
              className="inline-flex items-center justify-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 transition-colors mx-auto cursor-pointer focus:outline-none"
              id="qr-zoom-hint-btn"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Click QR to zoom fullscreen</span>
            </button>

            {/* Store URL with Copy Button */}
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between gap-2 text-xs">
              <span className="text-neutral-400 truncate max-w-[200px] text-left font-mono text-[11px]">
                {storeUrl}
              </span>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                onClick={() => executeCopyShareLink(true)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-semibold shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                id="modal-copy-link-btn"
              >
                {modalCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy Link</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Action Buttons: Download QR, WhatsApp Share & Native SMS Share */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  onClick={downloadQrCode}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  id="download-qr-image-btn"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save QR Image</span>
                </motion.button>

                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  href={buildWhatsAppShareUrl(`Check out AD Nutrition Hub Israna for 100% genuine supplements: ${storeUrl}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-colors cursor-pointer"
                  id="modal-share-whatsapp-btn"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>WhatsApp</span>
                </motion.a>
              </div>

              {/* Secondary Share Options: Native SMS Messaging & Email */}
              <div className="grid grid-cols-2 gap-2">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  href={smsShareHref}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm group"
                  id="modal-share-sms-btn"
                  title="Send store link via SMS Text Message"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">Share via SMS</span>
                </motion.a>

                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  href={emailShareHref}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm group"
                  id="modal-share-email-btn"
                  title="Share store link and product catalog via Email"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">Share via Email</span>
                </motion.a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Zoomed QR View with Darker Background Overlay for Better Scanning */}
      <AnimatePresence>
        {isQrZoomed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ 
              opacity: 0, 
              scale: 0.96, 
              filter: 'blur(6px)', 
              transition: { duration: 0.22, ease: [0.32, 0, 0.67, 0] } 
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 260, 
              damping: 22, 
              mass: 0.78 
            }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-md cursor-zoom-out select-none"
            onClick={() => {
              triggerHaptic('light');
              setIsQrZoomed(false);
            }}
            id="qr-fullscreen-zoom-overlay"
          >
            {/* Top Bar Controls with Spring Slide-in */}
            <motion.div 
              initial={{ opacity: 0, y: -24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ 
                type: 'spring', 
                stiffness: 320, 
                damping: 22, 
                mass: 0.7, 
                delay: 0.04 
              }}
              className="absolute top-4 sm:top-6 left-4 right-4 sm:left-8 sm:right-8 flex items-center justify-between pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span 
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ backgroundColor: qrThemeConfig.accentHex }}
                  />
                  <span 
                    className="relative inline-flex rounded-full h-2.5 w-2.5"
                    style={{ backgroundColor: qrThemeConfig.accentHex }}
                  />
                </span>
                <span className="text-xs sm:text-sm font-semibold text-neutral-200 tracking-wide hidden xs:inline">
                  High-Clarity Scanner Mode
                </span>

                {/* Theme Selector Pill synced to app color themes */}
                <div 
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neutral-900/90 border border-neutral-700/80 shadow-md backdrop-blur-sm"
                  id="qr-zoom-theme-picker"
                  title={`Active theme: ${qrThemeConfig.name}. Click to switch theme`}
                >
                  <Palette className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'gold', name: 'Gold', hex: '#f59e0b' },
                      { id: 'emerald', name: 'Emerald', hex: '#10b981' },
                      { id: 'cyan', name: 'Cyan', hex: '#06b6d4' },
                      { id: 'crimson', name: 'Crimson', hex: '#ef4444' },
                      { id: 'purple', name: 'Purple', hex: '#a855f7' },
                    ].map((theme) => {
                      const isCurrent = activeTheme === theme.id || (theme.id === 'gold' && (activeTheme === 'amber' || activeTheme === 'gold'));
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            const targetId = theme.id === 'gold' ? 'amber' : theme.id;
                            applyColorTheme(targetId);
                            setActiveTheme(targetId);
                          }}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all cursor-pointer relative ${
                            isCurrent ? 'ring-2 ring-white scale-125 shadow-sm' : 'hover:scale-110 opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: theme.hex }}
                          title={`Switch to ${theme.name} theme`}
                          aria-label={`Switch to ${theme.name} theme`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsQrZoomed(false);
                }}
                className="px-3.5 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg active:scale-95"
                id="close-qr-zoom-btn"
                aria-label="Exit fullscreen QR mode"
              >
                <Minimize2 className="w-3.5 h-3.5" style={{ color: qrThemeConfig.accentHex }} />
                <span>Exit Fullscreen (Esc)</span>
              </button>
            </motion.div>

            {/* Pronounced Spring-Scaled Fullscreen QR Card */}
            <motion.div
              initial={{ scale: 0.32, opacity: 0, y: 56, rotateX: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
              exit={{ 
                scale: 0.45, 
                opacity: 0, 
                y: 36, 
                rotateX: -8,
                transition: { type: 'spring', stiffness: 380, damping: 28, mass: 0.6 } 
              }}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.965 }}
              transition={{ 
                type: 'spring', 
                stiffness: 340, 
                damping: 18, 
                mass: 0.72, 
                restDelta: 0.001 
              }}
              style={{ 
                transformPerspective: 1000,
                boxShadow: `0 25px 50px -12px ${qrThemeConfig.glowColor}`,
              }}
              className={`relative p-2 sm:p-2.5 rounded-3xl max-w-sm sm:max-w-md w-full my-auto text-center cursor-zoom-out overflow-hidden shadow-2xl ${qrThemeConfig.shadowClass}`}
              onClick={() => {
                triggerHaptic('light');
                setIsQrZoomed(false);
              }}
            >
              {/* Ambient rotating glow synced to active theme */}
              <motion.div
                className="absolute -inset-2 rounded-3xl blur-xl opacity-65 pointer-events-none -z-20 transition-all duration-500"
                style={{
                  background: qrThemeConfig.conicGradient,
                  filter: `drop-shadow(0 0 20px ${qrThemeConfig.glowColor})`,
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                aria-hidden="true"
              />

              {/* Rotating gradient-border mask layer with metallic sweep synced to active theme */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none -z-10">
                <motion.div
                  className="absolute -inset-[140%] pointer-events-none transition-all duration-500"
                  style={{
                    background: qrThemeConfig.conicGradient,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  aria-hidden="true"
                />
                <motion.div
                  className="absolute -inset-[80%] pointer-events-none mix-blend-screen"
                  style={{
                    background:
                      'linear-gradient(115deg, transparent 25%, rgba(255, 255, 255, 0.1) 38%, rgba(255, 255, 255, 0.95) 50%, rgba(255, 255, 255, 0.1) 62%, transparent 75%)',
                  }}
                  initial={{ x: '-120%', y: '-120%' }}
                  animate={{ x: '120%', y: '120%' }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    repeatDelay: 3.5,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Elevated white QR card with Surface Shimmer Sweep */}
              <div className="relative z-10 bg-white p-5 sm:p-6 rounded-2xl shadow-inner flex flex-col items-center justify-center overflow-hidden">
                <img
                  src={qrCodeLargeImageUrl}
                  alt="Store QR Code Fullscreen"
                  className="w-64 h-64 sm:w-80 sm:h-80 md:w-88 md:h-88 object-contain block select-none relative z-10"
                  loading="eager"
                />

                {/* Small, pulsing 'Tap to Share' hint label below the QR code */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    opacity: { duration: 0.3, delay: 0.15 },
                    y: { duration: 0.3, delay: 0.15 },
                    scale: {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
                  }}
                  className="relative z-40 mt-3 flex justify-center pointer-events-auto"
                >
                  <motion.button
                    type="button"
                    onClick={handleZoomShare}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer select-none border ${
                      zoomCopied
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-extrabold shadow-emerald-500/40 ring-2 ring-emerald-400/50'
                        : 'bg-neutral-950 hover:bg-neutral-900 text-amber-400 border-amber-400/50 hover:border-amber-300 shadow-amber-500/20'
                    }`}
                    style={
                      !zoomCopied
                        ? {
                            borderColor: `${qrThemeConfig.accentHex}80`,
                            color: qrThemeConfig.accentHex,
                          }
                        : undefined
                    }
                    id="qr-zoom-tap-to-share-hint"
                    title="Tap to share or copy store link"
                    aria-label="Tap to share store link"
                  >
                    {zoomCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-neutral-950 stroke-[3]" />
                        <span>Store Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span 
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-80"
                            style={{ backgroundColor: qrThemeConfig.accentHex }}
                          />
                          <span 
                            className="relative inline-flex rounded-full h-2 w-2"
                            style={{ backgroundColor: qrThemeConfig.accentHex }}
                          />
                        </span>
                        <Share2 className="w-3.5 h-3.5" style={{ color: qrThemeConfig.accentHex }} />
                        <span className="tracking-wide">Tap to Share</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>

                {/* Gentle Shimmer Sweep Effect across the surface of the zoomed QR card synced to theme */}
                <motion.div
                  className="absolute -inset-[120%] pointer-events-none z-20 mix-blend-screen"
                  style={{
                    background:
                      `linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.0) 42%, rgba(255, 255, 255, 0.65) 50%, ${qrThemeConfig.shimmerColor} 54%, rgba(255, 255, 255, 0.6) 58%, transparent 66%)`,
                  }}
                  initial={{ x: '-130%', y: '-130%' }}
                  animate={{ x: '130%', y: '130%' }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    repeatDelay: 2.5,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  aria-hidden="true"
                />

                {/* Secondary gentle diagonal gloss sweep */}
                <motion.div
                  className="absolute -inset-[100%] pointer-events-none z-20 opacity-40 mix-blend-overlay"
                  style={{
                    background:
                      'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.8) 50%, transparent 60%)',
                  }}
                  initial={{ x: '-100%', y: '-100%' }}
                  animate={{ x: '100%', y: '100%' }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: 'easeInOut',
                    delay: 0.8,
                  }}
                  aria-hidden="true"
                />

                {/* Laminated glass overlay */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-2xl z-30"
                  style={{
                    background:
                      'linear-gradient(130deg, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.14) 32%, rgba(255, 255, 255, 0) 52%, rgba(255, 255, 255, 0.04) 75%, rgba(255, 255, 255, 0.2) 100%)',
                    boxShadow:
                      'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.85), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.06)',
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Outer sheen and edge highlight */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none z-20"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.06) 24%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.1) 100%)',
                  boxShadow: 'inset 0 1px 1.5px rgba(255, 255, 255, 0.6)',
                }}
                aria-hidden="true"
              />
            </motion.div>

            {/* Bottom Dismiss Instruction with Spring Slide-in */}
            <motion.div 
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 22, 
                mass: 0.7, 
                delay: 0.06 
              }}
              className="mt-4 sm:mt-6 text-center space-y-1 pointer-events-none select-none"
            >
              <p className="text-sm font-semibold text-white tracking-wide">
                AD Nutrition Hub Israna
              </p>
              <p className="text-xs text-neutral-400 flex items-center justify-center gap-1.5">
                <ZoomOut className="w-3.5 h-3.5" style={{ color: qrThemeConfig.accentHex }} />
                Click anywhere or press Esc to exit zoom
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

