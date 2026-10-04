import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, ShieldCheck, Sparkles, MapPin, ArrowRight, Zap, CheckCircle2, Smartphone, Eye, Users } from 'lucide-react';
import { STORE_INFO } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { NutritionVideoBackground } from './NutritionVideoBackground';
import { SiteVisitStats } from '../services/visitService';

interface HeroProps {
  onExploreClick: () => void;
  onLocationClick: () => void;
  onCategorySelect: (category: string) => void;
  onOpenAndroidModal?: () => void;
  onCalculatorClick?: () => void;
  onOpenExpertAdvice?: () => void;
  visitStats?: SiteVisitStats;
  onOpenVisitStats?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreClick,
  onLocationClick,
  onCategorySelect,
  onOpenAndroidModal,
  onCalculatorClick,
  onOpenExpertAdvice,
  visitStats,
  onOpenVisitStats
}) => {
  const quickCategories = [
    { label: 'Whey Protein', icon: '🥛', category: 'Whey Protein' },
    { label: 'Mass Gainer', icon: '💪', category: 'Mass Gainer' },
    { label: 'Creatine', icon: '⚡', category: 'Creatine' },
    { label: 'Pre-Workout', icon: '🔥', category: 'Pre-Workout' },
    { label: 'Vitamins & Fish Oil', icon: '💊', category: 'Vitamins & Minerals' },
  ];

  return (
    <section className="relative overflow-hidden bg-neutral-950 border-b border-neutral-800/80 pt-8 pb-14 sm:pt-12 sm:pb-20" id="home">
      {/* Background Auto-Playing Nutrition & Fitness Workout Video Animation */}
      <NutritionVideoBackground />

      {/* Background radial glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -top-10 -right-10 w-72 h-72 bg-amber-600/10 blur-2xl pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-semibold shadow-inner">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>100% Genuine & Authentic Supplements • Israna</span>
              </div>

              {onCalculatorClick && (
                <button
                  type="button"
                  onClick={onCalculatorClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:scale-105 hover:border-amber-400 transition-all shadow-sm cursor-pointer"
                  id="hero-calculator-stack-badge"
                  title="Open Nutrition Calculator & Stack Builder"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Calculator & Stacks</span>
                  <ArrowRight className="w-3 h-3 text-amber-400" />
                </button>
              )}

              {onOpenExpertAdvice && (
                <button
                  type="button"
                  onClick={onOpenExpertAdvice}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:scale-105 hover:border-emerald-400 transition-all shadow-sm cursor-pointer"
                  id="hero-expert-advice-badge"
                  title="Ask Nutrition Expert for Personalized Stack"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Free Expert Advice</span>
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                </button>
              )}
            </div>

            {/* Main headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              FUEL YOUR GAINS WITH{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">
                AD NUTRITION HUB
              </span>
            </h1>

            {/* Subtitle in Hindi / English as requested */}
            <p className="text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Fitness aur nutrition se related authentic supplements ka best collection. Whey Protein, Mass Gainer, Creatine, Pre-Workout aur Fitness Accessories ki live prices & stock availability dekhein aur direct WhatsApp par order karein.
            </p>

            {/* Location & Contact quick pill */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs sm:text-sm text-neutral-400 pt-1">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mandi Mor, Israna, Panipat (Haryana)</span>
              </div>
              <div className="hidden sm:block text-neutral-600">•</div>
              <div className="flex items-center gap-1.5 text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant In-Store & WhatsApp Order</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={onExploreClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold text-sm sm:text-base shadow-lg shadow-amber-500/25 transition-all hover:scale-102"
                id="hero-explore-products-btn"
              >
                <span>Browse Supplement Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <motion.a
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.94, y: 1 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                href={`https://wa.me/917015959517?text=${encodeURIComponent('Namaste AD Nutrition Hub Israna! Mujhe supplements ke baare me poochhna hai.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-900/30 transition-colors cursor-pointer"
                id="hero-whatsapp-enquiry-btn"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>WhatsApp Enquiry</span>
              </motion.a>

              {onOpenExpertAdvice && (
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.94, y: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  type="button"
                  onClick={onOpenExpertAdvice}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-500/40 text-amber-300 font-bold text-sm sm:text-base shadow-lg transition-colors cursor-pointer"
                  id="hero-expert-advice-btn"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Ask Nutritionist</span>
                </motion.button>
              )}

              <button
                onClick={onLocationClick}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-semibold text-sm transition-all"
                id="hero-view-location-btn"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Visit Store</span>
              </button>

              {onOpenAndroidModal && (
                <PWAInstallButton onOpenModal={onOpenAndroidModal} variant="hero" />
              )}
            </div>

            {/* Quick Category Chips */}
            <div className="pt-4 text-left">
              <div className="text-xs uppercase font-bold tracking-wider text-neutral-400 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Popular Categories:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickCategories.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => {
                      onCategorySelect(cat.category);
                      onExploreClick();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-xs text-neutral-300 hover:text-white transition-all"
                    id={`hero-category-chip-${cat.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Visual Trust & Highlight Showcase */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 p-5 sm:p-6 shadow-2xl">
              {/* Top Card Badge */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Shop Open Today
                  </span>
                </div>
                <span className="text-xs text-neutral-400">Israna, Panipat</span>
              </div>

              {/* Store Highlights Grid */}
              <div className="space-y-3.5">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0 font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">100% Genuine Seals & QR Code</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Direct importer verified supplements. Har dabba scratch code aur original hologram ke saath.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <div className="w-9 h-9 rounded-lg bg-yellow-500/15 flex items-center justify-center text-yellow-400 shrink-0 font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Best Wholesale & Retail Rates</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Panipat and Israna mein sabse competitive supplement prices with verified bill.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Instant WhatsApp Consultation</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Workout goals ke according expert guidance aur direct product booking on +91 70159 59517.
                    </p>
                  </div>
                </div>

                {/* Live Store Traffic & Visit Counting Card */}
                <div 
                  onClick={onOpenVisitStats}
                  className={`flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-neutral-900/90 to-neutral-900 border border-amber-500/35 hover:border-amber-400 transition-all ${onOpenVisitStats ? 'cursor-pointer hover:bg-neutral-850' : ''} group shadow-sm`}
                  id="hero-live-visit-counter-card"
                  title="Click to view live site traffic & visit analytics"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-bold group-hover:scale-105 transition-transform">
                      <Eye className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          Live Store Visits
                        </h4>
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9.5px] font-bold border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>Counting Live</span>
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        <span className="font-mono font-bold text-white tracking-tight">
                          {visitStats ? new Intl.NumberFormat('en-IN').format(visitStats.totalVisits) : '1,846'}
                        </span>
                        <span> visits total</span>
                        <span className="text-neutral-600 mx-1.5">•</span>
                        <span className="text-amber-400 font-bold">
                          +{visitStats ? new Intl.NumberFormat('en-IN').format(visitStats.todayVisits) : '47'} today
                        </span>
                      </p>
                    </div>
                  </div>
                  {onOpenVisitStats && (
                    <span className="text-[11px] text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0 pl-2">
                      <span className="hidden sm:inline">Analytics</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Quick Callout */}
              <div className="mt-5 pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
                <span>📍 Mandi Mor, Israna</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${STORE_INFO.phone}`}
                    className="text-amber-400 font-bold hover:underline"
                    title="Call Line 1"
                  >
                    {STORE_INFO.phone}
                  </a>
                  <span className="text-neutral-600">•</span>
                  <a
                    href={`tel:${STORE_INFO.phone2}`}
                    className="text-emerald-400 font-bold hover:underline"
                    title="Call Line 2"
                  >
                    {STORE_INFO.phone2}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
