import React from 'react';
import { MessageCircle, ShieldCheck, Sparkles, MapPin, ArrowRight, Zap, CheckCircle2, Smartphone } from 'lucide-react';
import { STORE_INFO } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeroProps {
  onExploreClick: () => void;
  onLocationClick: () => void;
  onCategorySelect: (category: string) => void;
  onOpenAndroidModal?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreClick,
  onLocationClick,
  onCategorySelect,
  onOpenAndroidModal
}) => {
  const quickCategories = [
    { label: 'Whey Protein', icon: '🥛', category: 'Whey Protein' },
    { label: 'Mass Gainer', icon: '💪', category: 'Mass Gainer' },
    { label: 'Creatine', icon: '⚡', category: 'Creatine' },
    { label: 'Pre-Workout', icon: '🔥', category: 'Pre-Workout' },
    { label: 'Vitamins & Fish Oil', icon: '💊', category: 'Vitamins & Minerals' },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 border-b border-neutral-800/80 pt-8 pb-14 sm:pt-12 sm:pb-20">
      {/* Background radial glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -top-10 -right-10 w-72 h-72 bg-amber-600/10 blur-2xl pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Trust pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-semibold shadow-inner">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>100% Genuine & Authentic Supplements • Israna</span>
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

              <a
                href={`https://wa.me/917015959517?text=${encodeURIComponent('Namaste AD Nutrition Hub Israna! Mujhe supplements ke baare me poochhna hai.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-900/30 transition-all hover:scale-102"
                id="hero-whatsapp-enquiry-btn"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>WhatsApp Enquiry</span>
              </a>

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
              </div>

              {/* Bottom Quick Callout */}
              <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <span>📍 Mandi Mor, Israna</span>
                <a
                  href={`tel:${STORE_INFO.phone}`}
                  className="text-amber-400 font-bold hover:underline"
                >
                  Call: {STORE_INFO.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
