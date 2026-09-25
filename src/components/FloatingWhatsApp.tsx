import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { MessageCircle, X, Share2, Check, Copy, QrCode, Download, ExternalLink, ZoomIn, ZoomOut, Maximize2, Minimize2, MessageSquare, Mail } from 'lucide-react';
import { STORE_INFO } from '../types';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const FloatingWhatsApp: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);
  const [copied, setCopied] = useState(false);
  const [modalCopied, setModalCopied] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isQrZoomed, setIsQrZoomed] = useState(false);
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

  const whatsappUrl = `https://wa.me/917015959517?text=${encodeURIComponent(
    'Namaste AD Nutrition Hub Israna! Mujhe supplements ke baare mein enquire karna hai.'
  )}`;

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
${STORE_INFO.phone}

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
                  (💡 <strong>Hold</strong> to copy link • <strong>QR button</strong> to scan)
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

        {/* Main WhatsApp & Quick Action Buttons */}
        <div className="relative flex items-center gap-2">
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
            aria-label="Chat on WhatsApp with AD Nutrition Hub Israna (Hold to copy store link)"
            title="Click to chat on WhatsApp • Hold to copy store link"
          >
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
                : 'WhatsApp Enquiry'}
            </span>
            <span className="relative z-10 sm:hidden">
              {copied ? 'Copied!' : isPressing ? 'Holding...' : 'WhatsApp'}
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
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Check out AD Nutrition Hub Israna for 100% genuine supplements: ${storeUrl}`
                  )}`}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-md cursor-zoom-out"
            onClick={() => setIsQrZoomed(false)}
            id="qr-fullscreen-zoom-overlay"
          >
            {/* Top Bar Controls */}
            <div 
              className="absolute top-4 sm:top-6 left-4 right-4 sm:left-8 sm:right-8 flex items-center justify-between pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs sm:text-sm font-semibold text-neutral-200 tracking-wide">
                  High-Clarity Scanner Mode
                </span>
              </div>
              <button
                onClick={() => setIsQrZoomed(false)}
                className="px-3.5 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
                id="close-qr-zoom-btn"
                aria-label="Exit fullscreen QR mode"
              >
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Exit Fullscreen (Esc)</span>
              </button>
            </div>

            {/* Scaled Fullscreen QR Card */}
            <motion.div
              initial={{ scale: 0.72, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.72, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative p-2 sm:p-2.5 rounded-3xl shadow-2xl shadow-amber-500/30 max-w-sm sm:max-w-md w-full my-auto text-center cursor-zoom-out"
              onClick={() => setIsQrZoomed(false)}
            >
              {/* Ambient rotating glow */}
              <motion.div
                className="absolute -inset-2 rounded-3xl blur-xl opacity-60 pointer-events-none -z-20"
                style={{
                  background:
                    'conic-gradient(from 0deg, #f59e0b 0%, #fbbf24 20%, #10b981 40%, #06b6d4 60%, #fbbf24 80%, #f59e0b 100%)',
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                aria-hidden="true"
              />

              {/* Rotating gradient-border mask layer with metallic sweep */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none -z-10">
                <motion.div
                  className="absolute -inset-[140%] pointer-events-none"
                  style={{
                    background:
                      'conic-gradient(from 0deg, #f59e0b 0%, #fbbf24 20%, #10b981 40%, #06b6d4 60%, #fbbf24 80%, #f59e0b 100%)',
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

              {/* Elevated white QR card */}
              <div className="relative z-10 bg-white p-5 sm:p-6 rounded-2xl shadow-inner flex flex-col items-center justify-center overflow-hidden">
                <img
                  src={qrCodeLargeImageUrl}
                  alt="Store QR Code Fullscreen"
                  className="w-64 h-64 sm:w-80 sm:h-80 md:w-88 md:h-88 object-contain block select-none"
                  loading="eager"
                />

                {/* Laminated glass overlay */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-2xl"
                  style={{
                    background:
                      'linear-gradient(130deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.16) 32%, rgba(255, 255, 255, 0) 52%, rgba(255, 255, 255, 0.04) 75%, rgba(255, 255, 255, 0.22) 100%)',
                    boxShadow:
                      'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.06)',
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Outer sheen */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none z-20"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.06) 24%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.1) 100%)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.5)',
                }}
                aria-hidden="true"
              />
            </motion.div>

            {/* Bottom Dismiss Instruction */}
            <div className="mt-4 sm:mt-6 text-center space-y-1 pointer-events-none select-none">
              <p className="text-sm font-semibold text-white tracking-wide">
                AD Nutrition Hub Israna
              </p>
              <p className="text-xs text-neutral-400 flex items-center justify-center gap-1.5">
                <ZoomOut className="w-3.5 h-3.5 text-amber-400" />
                Click anywhere or press Esc to exit zoom
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

