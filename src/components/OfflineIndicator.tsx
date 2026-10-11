import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualRetry = () => {
    setIsRetrying(true);
    fetch('/api/health', { cache: 'no-store' })
      .then((res) => {
        if (res.ok) {
          setIsOnline(true);
          setShowReconnected(true);
          setTimeout(() => setShowReconnected(false), 4000);
        }
      })
      .catch(() => {
        // still offline
      })
      .finally(() => {
        setTimeout(() => setIsRetrying(false), 800);
      });
  };

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div 
        id="pwa-reconnected-banner" 
        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300"
      >
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
          <Wifi className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Connection Restored
          </p>
          <p className="text-[11px] text-emerald-300/90 leading-tight">
            Syncing live supplement stock and order statuses from Israna store.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="pwa-offline-access-banner"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md bg-neutral-900/95 border border-amber-500/40 text-neutral-100 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
          <WifiOff className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>Offline Mode Active</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono border border-amber-500/30">
                PWA Cached
              </span>
            </p>
            <button
              onClick={handleManualRetry}
              disabled={isRetrying}
              className="text-[10.5px] font-semibold text-neutral-400 hover:text-amber-300 flex items-center gap-1 bg-neutral-800/80 px-2 py-0.5 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Test connection"
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin text-amber-400' : ''}`} />
              <span>Retry</span>
            </button>
          </div>
          <p className="text-[11px] text-neutral-300 mt-1 leading-snug">
            You are browsing the offline product catalog & cached store data. Full specs, prices, and direct WhatsApp contact remain accessible!
          </p>
          <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
            <span className="flex items-center gap-1">
              <CloudOff className="w-3 h-3 text-amber-400/80" />
              Service worker active
            </span>
            <span className="text-amber-400/90 font-medium">AD Nutrition Hub Israna</span>
          </div>
        </div>
      </div>
    </div>
  );
};
