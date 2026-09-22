import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Share2, Check, Copy, QrCode, Download, ExternalLink } from 'lucide-react';
import { STORE_INFO } from '../types';

export const FloatingWhatsApp: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);
  const [copied, setCopied] = useState(false);
  const [modalCopied, setModalCopied] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [showQrModal, setShowQrModal] = useState(false);

  const holdTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const holdTriggeredRef = useRef<boolean>(false);

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

  const handleClick = (e: React.MouseEvent) => {
    if (holdTriggeredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      holdTriggeredRef.current = false;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowQrModal(false);
      }
    };
    if (showQrModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [showQrModal]);

  return (
    <>
      {/* Floating Widget Container */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 select-none">
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

        {/* Tooltip bubble when not copying */}
        {!copied && showTooltip && !showQrModal && (
          <div 
            className="relative bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs py-2 px-3.5 rounded-xl shadow-xl max-w-xs flex items-center gap-2"
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
              className="text-neutral-400 hover:text-white p-0.5 shrink-0"
              title="Dismiss"
              id="dismiss-whatsapp-tooltip-btn"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-neutral-900 border-r border-b border-neutral-700 rotate-45" />
          </div>
        )}

        {/* Main WhatsApp & Quick Action Buttons */}
        <div className="relative flex items-center gap-2">
          {/* Share via QR Code Button */}
          <button
            onClick={() => setShowQrModal(true)}
            className="p-2.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-amber-400 hover:text-amber-300 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
            title="Share via QR Code"
            id="share-via-qr-code-btn"
            aria-label="Share store via QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Dedicated Quick-Share pill icon for 1-click clipboard copy */}
          <button
            onClick={(e) => {
              e.preventDefault();
              executeCopyShareLink();
            }}
            className="p-2.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-400 shadow-xl transition-all hover:scale-105 active:scale-95"
            title="Copy store link to clipboard"
            id="quick-share-store-link-btn"
            aria-label="Copy store link to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          {/* WhatsApp Button with Hold-to-Copy functionality */}
          <a
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
            className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-full text-white shadow-2xl font-bold text-sm transition-all select-none ${
              isPressing
                ? 'scale-95 bg-emerald-700 shadow-emerald-900/60 ring-4 ring-amber-400/50'
                : copied
                ? 'bg-neutral-800 border border-emerald-500 text-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950 hover:scale-105 active:scale-95'
            }`}
            id="floating-whatsapp-btn"
            aria-label="Chat on WhatsApp with AD Nutrition Hub Israna (Hold to copy store link)"
            title="Click to chat on WhatsApp • Hold to copy store link"
          >
            {/* Circular hold progress bar indicator */}
            {isPressing && (
              <div 
                className="absolute inset-0 rounded-full border-2 border-amber-400 pointer-events-none transition-all duration-75"
                style={{
                  clipPath: `inset(0 ${100 - pressProgress}% 0 0)`
                }}
              />
            )}

            {/* Status icon / pulse */}
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

            <span className="hidden sm:inline">
              {copied
                ? 'Link Copied!'
                : isPressing
                ? 'Keep holding to copy...'
                : 'WhatsApp Enquiry'}
            </span>
            <span className="sm:hidden">
              {copied ? 'Copied!' : isPressing ? 'Holding...' : 'WhatsApp'}
            </span>
          </a>
        </div>
      </div>

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

            {/* QR Code Container with Vibrant Gradient Border */}
            <div 
              className="p-1 sm:p-1.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 shadow-xl shadow-amber-500/25 inline-block mx-auto transition-transform hover:scale-[1.02]"
              id="qr-code-image-container"
            >
              <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-inner flex items-center justify-center">
                <img
                  src={qrCodeImageUrl}
                  alt="Store QR Code"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain block"
                  loading="eager"
                />
              </div>
            </div>

            {/* Store URL with Copy Button */}
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between gap-2 text-xs">
              <span className="text-neutral-400 truncate max-w-[200px] text-left font-mono text-[11px]">
                {storeUrl}
              </span>
              <button
                onClick={() => executeCopyShareLink(true)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-semibold shrink-0 flex items-center gap-1 transition-colors"
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
              </button>
            </div>

            {/* Action Buttons: Download QR & WhatsApp Share */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={downloadQrCode}
                className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                id="download-qr-image-btn"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Save QR Image</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Check out AD Nutrition Hub Israna for 100% genuine supplements: ${storeUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-colors"
                id="modal-share-whatsapp-btn"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>Share Link</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

