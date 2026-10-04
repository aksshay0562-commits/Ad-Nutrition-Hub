import React, { useState } from 'react';
import { Phone, MessageCircle, ShieldCheck, MapPin, Menu, X, Lock, Unlock, PlusCircle, LogIn, LogOut, User as UserIcon, Smartphone, Camera, QrCode, Palette, Sparkles, Eye, Users } from 'lucide-react';
import { STORE_INFO } from '../types';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import { SiteVisitStats } from '../services/visitService';

interface NavbarProps {
  isAdmin: boolean;
  onToggleAdminModal: () => void;
  onOpenAddProduct: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenAndroidModal?: () => void;
  onOpenScanner?: () => void;
  onOpenThemeModal?: () => void;
  onOpenExpertAdvice?: () => void;
  visitStats?: SiteVisitStats;
  onOpenVisitStats?: () => void;
  onOpenPaymentQR?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdmin,
  onToggleAdminModal,
  onOpenAddProduct,
  activeSection,
  onNavigate,
  onOpenAndroidModal,
  onOpenScanner,
  onOpenThemeModal,
  onOpenExpertAdvice,
  visitStats,
  onOpenVisitStats,
  onOpenPaymentQR
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, signInWithGoogle, logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'products', label: 'All Supplements' },
    { id: 'categories', label: 'Categories' },
    { id: 'calculator-stack', label: 'Calculator & Stacks' },
    { id: 'community', label: 'Community' },
    { id: 'location', label: 'Shop Location' },
    { id: 'about', label: 'About Store' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      {/* Top Banner with Location and Quick Phone */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-neutral-950 text-xs font-semibold py-1 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>Mandi Mor, Israna, Panipat, Haryana</span>
            <span className="hidden md:inline">• 100% Genuine & Authentic Supplements</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-neutral-950 font-bold text-xs">
            {onOpenVisitStats && (
              <button
                type="button"
                onClick={onOpenVisitStats}
                className="flex items-center gap-1.5 bg-neutral-950/15 hover:bg-neutral-950/25 px-2.5 py-0.5 rounded-full text-neutral-950 transition-all cursor-pointer font-bold"
                title="View live site visits & store traffic"
                id="top-bar-visit-counter-btn"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 animate-pulse" />
                <span className="text-[11px] font-black font-mono">
                  {visitStats ? new Intl.NumberFormat('en-IN').format(visitStats.totalVisits) : '1,845'}
                </span>
                <span className="text-[10px] font-semibold opacity-90">Visits</span>
              </button>
            )}
            <span>Shop: 8:00 AM - 9:00 PM</span>
            <span className="text-amber-800">•</span>
            <a 
              href={`tel:${STORE_INFO.phone}`} 
              className="flex items-center gap-1 hover:underline"
              id="top-bar-phone-link"
              title="Call Line 1"
            >
              <Phone className="w-3 h-3" />
              <span>{STORE_INFO.phone}</span>
            </a>
            <span className="text-amber-800">•</span>
            <a 
              href={`https://wa.me/${STORE_INFO.rawPhone2}?text=${encodeURIComponent('Namaste AD Nutrition Hub Israna!')}`}
              target="_blank"
              rel="noopener noreferrer" 
              className="flex items-center gap-1 hover:underline"
              id="top-bar-whatsapp2-link"
              title="WhatsApp Line 2"
            >
              <MessageCircle className="w-3 h-3" />
              <span>{STORE_INFO.phone2}</span>
            </a>
            {onOpenPaymentQR && (
              <>
                <span className="text-amber-800">•</span>
                <button
                  type="button"
                  onClick={onOpenPaymentQR}
                  className="flex items-center gap-1.5 bg-neutral-950/20 hover:bg-neutral-950/35 px-2.5 py-0.5 rounded-full text-neutral-950 transition-all cursor-pointer font-bold"
                  id="top-bar-payment-qr-btn"
                  title="Official Store UPI Payment QR Codes (PhonePe & Kotak Bank)"
                >
                  <QrCode className="w-3 h-3 text-neutral-950" />
                  <span>UPI Pay QRs</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
            id="navbar-brand-logo"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center font-black text-neutral-950 shadow-lg shadow-amber-500/20 text-xl tracking-wider group-hover:scale-105 transition-transform">
              AD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  AD NUTRITION HUB
                </span>
                <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Israna
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                Fitness & Nutrition Supplement Store
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'text-amber-400 bg-neutral-900 border border-neutral-800'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                }`}
                id={`nav-link-${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions: Phone, WhatsApp, and Admin */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Call */}
            <a
              href={`tel:${STORE_INFO.phone}`}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs sm:text-sm font-medium transition-colors"
              title="Call Store"
              id="navbar-call-button"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Call Store</span>
            </a>

            {/* Nutrition Expert Consultation Button */}
            {onOpenExpertAdvice && (
              <button
                onClick={onOpenExpertAdvice}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer group"
                id="navbar-expert-advice-btn"
                title="Get Personalized Stack & Nutrition Guidance"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden xl:inline">Expert Advice</span>
              </button>
            )}

            {/* Quick WhatsApp */}
            <a
              href={`https://wa.me/917015959517?text=${encodeURIComponent('Namaste AD Nutrition Hub Israna! I want to enquire about supplements.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-emerald-900/30"
              id="navbar-whatsapp-button"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Android App Button */}
            <PWAInstallButton onOpenModal={onOpenAndroidModal || (() => {})} variant="nav" />

            {/* Quick Scan QR Code Button */}
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-neutral-300 hover:text-amber-400 text-xs sm:text-sm font-semibold transition-colors"
                id="navbar-scan-qr-btn"
                title="Scan Product QR or Barcode"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Scan QR</span>
              </button>
            )}

            {/* App Colour Theme Switcher Button */}
            {onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-neutral-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer group"
                id="navbar-theme-btn"
                title="Change App Colour Theme"
                aria-label="Change App Colour Theme"
              >
                <Palette className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden xl:inline">Colours</span>
              </button>
            )}

            {/* User / Google Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'User'} 
                      className="w-5 h-5 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-neutral-300 max-w-[100px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  title="Sign out of Google"
                  id="navbar-logout-button"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  const ok = await signInWithGoogle();
                  if (!ok && !currentUser) {
                    onToggleAdminModal();
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs sm:text-sm font-medium transition-colors"
                id="navbar-google-signin"
                title="Sign in with Google"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Sign In</span>
              </button>
            )}

            {/* Admin Portal Button */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenAddProduct}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-colors"
                  id="admin-add-product-quick"
                  title="Add New Product"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden md:inline">Add Product</span>
                </button>
                <button
                  onClick={onToggleAdminModal}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs sm:text-sm font-medium hover:bg-amber-500/25 transition-colors"
                  id="admin-badge-button"
                  title="Manage Admin Panel"
                >
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Admin Mode</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onToggleAdminModal}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs sm:text-sm font-medium transition-colors"
                id="admin-login-button"
                title="Shop Owner Login"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Owner Login</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800"
              id="mobile-menu-toggle"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-neutral-950 border-b border-neutral-800 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-neutral-300 hover:bg-neutral-900'
              }`}
              id={`mobile-nav-${item.id}`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-neutral-800 flex flex-col gap-2">
            <PWAInstallButton 
              onOpenModal={() => {
                setMobileMenuOpen(false);
                onOpenAndroidModal?.();
              }} 
              variant="mobile" 
            />
            {onOpenExpertAdvice && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenExpertAdvice();
                }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/40 text-sm font-bold text-amber-300 hover:bg-amber-500/30 shadow-sm"
                id="mobile-nav-expert-advice"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Nutrition Expert Stack Advice</span>
              </button>
            )}
            {onOpenScanner && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenScanner();
                }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-sm font-semibold text-amber-400 hover:bg-neutral-850"
                id="mobile-nav-scan-qr"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Product QR / Barcode</span>
              </button>
            )}
            {onOpenThemeModal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenThemeModal();
                }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-sm font-semibold text-neutral-200 hover:text-white"
                id="mobile-nav-theme-btn"
              >
                <Palette className="w-4 h-4 text-amber-400" />
                <span>Change App Colour & Theme</span>
              </button>
            )}

            {/* Mobile Nav: Live Site Visit Counter */}
            {onOpenVisitStats && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenVisitStats();
                }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-amber-400 text-xs font-semibold text-neutral-200 hover:text-white transition-all w-full cursor-pointer shadow-sm group"
                id="mobile-nav-visit-counter-btn"
                title="View live site visits & traffic analytics"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Eye className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Store Visits:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {visitStats ? new Intl.NumberFormat('en-IN').format(visitStats.totalVisits) : '1,846'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                    +{visitStats ? new Intl.NumberFormat('en-IN').format(visitStats.todayVisits) : '47'} Today
                  </span>
                  <span className="text-[10px] text-neutral-400 group-hover:text-amber-300">Stats →</span>
                </div>
              </button>
            )}

            {/* Mobile Nav: UPI Payment QR Code */}
            {onOpenPaymentQR && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPaymentQR();
                }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-emerald-500/50 text-xs font-semibold text-neutral-200 hover:text-white transition-all w-full cursor-pointer shadow-sm group"
                id="mobile-nav-payment-qr-btn"
                title="View Store UPI Payment QR Code (sumit6269@kotak)"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <span>Store UPI Payment QRs:</span>
                  <span className="font-mono text-[11px] text-amber-400 font-bold">PhonePe & Kotak</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  Scan & Pay →
                </span>
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${STORE_INFO.phone}`}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-semibold text-neutral-200"
                id="mobile-nav-call"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Call: 70159 59517</span>
              </a>
              <a
                href={`https://wa.me/${STORE_INFO.rawPhone2}?text=${encodeURIComponent('Namaste AD Nutrition Hub Israna!')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs font-semibold text-emerald-300"
                id="mobile-nav-whatsapp2"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WA: 80532 26224</span>
              </a>
            </div>
            {currentUser ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                <div className="flex items-center gap-2 truncate">
                  <UserIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{currentUser.displayName || currentUser.email}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-2 py-1 rounded bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  const ok = await signInWithGoogle();
                  if (!ok && !currentUser) {
                    onToggleAdminModal();
                  }
                }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-medium text-white"
                id="mobile-nav-google-signin"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>Sign in with Google</span>
              </button>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onToggleAdminModal();
              }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-medium text-amber-400"
              id="mobile-nav-admin"
            >
              {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{isAdmin ? 'Admin Dashboard (Active)' : 'Owner / Admin Login'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
