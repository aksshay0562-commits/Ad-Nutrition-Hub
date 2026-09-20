import React, { useState } from 'react';
import { Phone, MessageCircle, ShieldCheck, MapPin, Menu, X, Lock, Unlock, PlusCircle } from 'lucide-react';
import { STORE_INFO } from '../types';

interface NavbarProps {
  isAdmin: boolean;
  onToggleAdminModal: () => void;
  onOpenAddProduct: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdmin,
  onToggleAdminModal,
  onOpenAddProduct,
  activeSection,
  onNavigate
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'products', label: 'All Supplements' },
    { id: 'categories', label: 'Categories' },
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
          <div className="hidden sm:flex items-center gap-4 text-neutral-950 font-bold">
            <span>Shop Timings: 8:00 AM - 9:00 PM</span>
            <a 
              href={`tel:${STORE_INFO.phone}`} 
              className="flex items-center gap-1 hover:underline"
              id="top-bar-phone-link"
            >
              <Phone className="w-3 h-3" />
              <span>{STORE_INFO.phone}</span>
            </a>
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
            <a
              href={`tel:${STORE_INFO.phone}`}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-sm font-medium text-neutral-200"
              id="mobile-nav-call"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Call: {STORE_INFO.phone}</span>
            </a>
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
