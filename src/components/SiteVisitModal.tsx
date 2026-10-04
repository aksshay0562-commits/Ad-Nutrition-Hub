import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Eye, 
  Users, 
  Calendar, 
  Activity, 
  RefreshCw, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Smartphone, 
  Globe, 
  CheckCircle2 
} from 'lucide-react';
import { SiteVisitStats, fetchSiteVisitStats, getCachedVisitStats } from '../services/visitService';
import { triggerHaptic } from '../utils/haptics';
import { STORE_INFO } from '../types';

interface SiteVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: SiteVisitStats;
  onRefresh?: () => Promise<void>;
}

export const SiteVisitModal: React.FC<SiteVisitModalProps> = ({
  isOpen,
  onClose,
  stats: propStats,
  onRefresh
}) => {
  const [stats, setStats] = useState<SiteVisitStats>(propStats || getCachedVisitStats());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  useEffect(() => {
    if (propStats) {
      setStats(propStats);
    }
  }, [propStats]);

  useEffect(() => {
    if (isOpen) {
      handleManualRefresh();
    }
  }, [isOpen]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    triggerHaptic('light');
    try {
      if (onRefresh) {
        await onRefresh();
      }
      const updated = await fetchSiteVisitStats();
      setStats(updated);
      setRefreshSuccess(true);
      triggerHaptic('success');
      setTimeout(() => setRefreshSuccess(false), 2000);
    } catch {
      triggerHaptic('error');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isOpen) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hr ago`;
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md"
        id="site-visit-modal-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          id="site-visit-modal-panel"
        >
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 border-b border-neutral-800 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white tracking-wide">
                      Store Traffic & Visits
                    </h3>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>Live Counter</span>
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    AD Nutrition Hub • Mandi Mor, Israna (Panipat)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className={`p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer ${
                    isRefreshing ? 'animate-spin text-amber-400' : ''
                  }`}
                  title="Refresh Live Statistics"
                  id="site-visit-refresh-btn"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer"
                  aria-label="Close"
                  id="site-visit-modal-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Top 3 KPI Metric Cards */}
            <div className="grid grid-cols-3 gap-3">
              {/* Total Visits Card */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/90 relative overflow-hidden group">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider">Total Visits</span>
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
                  {formatNumber(stats.totalVisits)}
                </div>
                <div className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>All-time hits</span>
                </div>
              </div>

              {/* Today's Visits Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-neutral-950 border border-amber-500/30 relative overflow-hidden group">
                <div className="flex items-center justify-between text-neutral-300 mb-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider">Today</span>
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight font-mono">
                  +{formatNumber(stats.todayVisits)}
                </div>
                <div className="text-[10px] text-neutral-400 font-medium flex items-center gap-1 mt-0.5">
                  <span>Current 24h</span>
                </div>
              </div>

              {/* Unique Visitors Card */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/90 relative overflow-hidden group">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider">Shoppers</span>
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight font-mono">
                  {formatNumber(stats.uniqueVisitors)}
                </div>
                <div className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1 mt-0.5">
                  <span>Unique devices</span>
                </div>
              </div>
            </div>

            {/* Daily Traffic Breakdown Bar representation */}
            {stats.dailyHistory && stats.dailyHistory.length > 0 && (
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recent Daily Traffic</span>
                  </span>
                  <span className="text-[10.5px] text-neutral-400">
                    Last {stats.dailyHistory.length} Days
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  {stats.dailyHistory.slice(-4).map((day) => {
                    const dateObj = new Date(day.date);
                    const formattedDay = isNaN(dateObj.getTime())
                      ? day.date
                      : dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });

                    return (
                      <div 
                        key={day.date} 
                        className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center space-y-1"
                      >
                        <span className="text-[10px] text-neutral-400 font-semibold block truncate">
                          {formattedDay}
                        </span>
                        <span className="text-sm font-black text-amber-400 font-mono block">
                          {day.visits}
                        </span>
                        <span className="text-[9.5px] text-neutral-500 block">
                          {day.unique} unique
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Live Activity Stream */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-time Activity Stream</span>
                </span>
                <span className="text-[10.5px] text-neutral-400">
                  Last visit: {formatRelativeTime(stats.lastVisitedAt)}
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {(stats.recentVisits && stats.recentVisits.length > 0) ? (
                  stats.recentVisits.map((visit) => (
                    <div 
                      key={visit.id}
                      className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">
                          {visit.deviceType?.toLowerCase().includes('mobile') ? (
                            <Smartphone className="w-3.5 h-3.5" />
                          ) : (
                            <Globe className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                            <span>{visit.deviceType || 'Web Visitor'}</span>
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                              {visit.path === '/' ? 'Home Catalog' : visit.path}
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate max-w-xs">
                            via {visit.referrer || 'Direct Store Visit'}
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-neutral-400 font-mono">
                        {formatRelativeTime(visit.timestamp)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-neutral-400 bg-neutral-950/40 rounded-xl border border-neutral-800">
                    Live session active. Your visit is recorded.
                  </div>
                )}
              </div>
            </div>

            {/* Trust & Privacy Notice */}
            <div className="p-3 rounded-2xl bg-neutral-950/50 border border-neutral-800/70 flex items-start gap-2.5 text-[11px] text-neutral-400 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-200 block">Privacy-First Counting:</span>
                <span>
                  All site visits are counted anonymously on the AD Nutrition Hub server without cookies or personal tracking. Numbers reflect genuine Israna store interest and supplement shoppers.
                </span>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs">
            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{STORE_INFO.name} • Mandi Mor</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-all cursor-pointer shadow-sm"
              id="site-visit-close-btn"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
