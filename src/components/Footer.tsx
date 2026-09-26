import React from 'react';
import { MapPin, Phone, MessageCircle, ShieldCheck, Lock, Unlock, Smartphone, Palette, Instagram, Facebook } from 'lucide-react';
import { STORE_INFO, CATEGORIES } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface FooterProps {
  onCategorySelect: (category: string) => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
  onOpenAndroidModal?: () => void;
  onOpenThemeModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onCategorySelect,
  onOpenAdmin,
  isAdmin,
  onOpenAndroidModal,
  onOpenThemeModal
}) => {
  return (
    <footer id="app-footer" className="bg-neutral-950 border-t border-neutral-800 text-neutral-400 text-xs">
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Col 1: Store Intro */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center font-black text-neutral-950 text-lg shadow-md">
                AD
              </div>
              <div>
                <span className="text-base font-extrabold text-white block">AD NUTRITION HUB</span>
                <span className="text-xs text-amber-400 font-semibold">Israna, Panipat (Haryana)</span>
              </div>
            </div>

            <p className="text-neutral-400 text-xs leading-relaxed">
              AD Nutrition Hub Israna par fitness aur nutrition se related authentic products ka best collection available hai. 100% genuine protein supplements, gainers, vitamins aur fitness accessories.
            </p>

            <div className="flex items-center gap-2 text-neutral-300 font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>100% Original Products Guaranteed</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Product Categories
            </h4>
            <div className="grid grid-cols-1 gap-1.5">
              {CATEGORIES.filter(c => c !== 'All').slice(0, 7).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    onCategorySelect(category);
                    window.scrollTo({ top: 550, behavior: 'smooth' });
                  }}
                  className="text-left text-neutral-400 hover:text-amber-400 transition-colors py-0.5"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Col 3: Contact & Timings */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Store Address & Contacts
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Mandi Mor, Israna, Panipat, Haryana 132107, India</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`tel:${STORE_INFO.phone}`} className="hover:text-white font-semibold">
                  {STORE_INFO.phone}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a 
                  href={`https://wa.me/917015959517?text=${encodeURIComponent('Namaste AD Nutrition Hub Israna!')}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  WhatsApp: +91 70159 59517
                </a>
              </div>

              <div className="pt-1 text-[11px] text-neutral-400">
                <span>Mon - Sat 8:00 AM - 9:00 PM | Sun 9:00 AM - 8:00 PM</span>
              </div>
            </div>
          </div>

          {/* Col 4: Social Media & Latest Offers */}
          <div className="lg:col-span-3 space-y-3" id="footer-social-media-section">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Follow Us & Offers
              </h4>
              <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                Latest Updates
              </span>
            </div>

            <p className="text-neutral-400 text-xs leading-relaxed">
              Follow our official social media channels to catch new brand stock arrivals, unboxing tests, and special discount offers!
            </p>

            <div className="flex flex-col gap-2 pt-1">
              {/* Instagram Button */}
              <a
                href={STORE_INFO.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-pink-500/50 text-neutral-200 hover:text-white transition-all text-xs font-medium group shadow-sm cursor-pointer"
                id="footer-instagram-link"
                title="Follow AD Nutrition Hub on Instagram"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <Instagram className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white group-hover:text-pink-400 transition-colors flex items-center justify-between">
                    <span>Instagram</span>
                    <span className="text-[9.5px] font-semibold text-pink-400 uppercase tracking-tight">Follow</span>
                  </div>
                  <div className="text-[10.5px] text-neutral-400 truncate">
                    @ad_nutrition_hub_israna
                  </div>
                </div>
              </a>

              {/* Facebook Button */}
              <a
                href={STORE_INFO.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-blue-500/50 text-neutral-200 hover:text-white transition-all text-xs font-medium group shadow-sm cursor-pointer"
                id="footer-facebook-link"
                title="Follow AD Nutrition Hub on Facebook"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <Facebook className="w-4 h-4 fill-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white group-hover:text-blue-400 transition-colors flex items-center justify-between">
                    <span>Facebook</span>
                    <span className="text-[9.5px] font-semibold text-blue-400 uppercase tracking-tight">Like</span>
                  </div>
                  <div className="text-[10.5px] text-neutral-400 truncate">
                    AD Nutrition Hub Israna
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800/80 bg-neutral-950/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p>© {new Date().getFullYear()} AD Nutrition Hub Israna. All Rights Reserved.</p>

          <div className="flex flex-wrap items-center gap-4">
            {/* Quick Social Media Links */}
            <div className="flex items-center gap-1.5" id="footer-bottom-social-links">
              <a
                href={STORE_INFO.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-pink-400 border border-neutral-800 hover:border-pink-500/40 transition-colors"
                id="footer-bottom-instagram-btn"
                title="Follow on Instagram"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href={STORE_INFO.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-blue-400 border border-neutral-800 hover:border-blue-500/40 transition-colors"
                id="footer-bottom-facebook-btn"
                title="Follow on Facebook"
                aria-label="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
            </div>

            {onOpenAndroidModal && (
              <PWAInstallButton onOpenModal={onOpenAndroidModal} variant="footer" />
            )}
            {onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-amber-400 font-medium transition-colors cursor-pointer"
                id="footer-theme-btn"
                title="Change App Colour Theme"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>App Theme & Colours</span>
              </button>
            )}
            <span>Mandi Mor, Israna Supplement Shop</span>
            <span>•</span>
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-amber-400 font-medium transition-colors"
              id="footer-admin-login-btn"
            >
              {isAdmin ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isAdmin ? 'Admin Mode (Active)' : 'Owner / Admin Portal'}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
