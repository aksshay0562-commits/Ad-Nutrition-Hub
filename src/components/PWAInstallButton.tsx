import React from 'react';
import { Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenModal: () => void;
  variant?: 'nav' | 'mobile' | 'hero' | 'footer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenModal,
  variant = 'nav'
}) => {
  const { isInstalled } = usePWAInstall();

  // If already running as an installed standalone app, show subtle status or hide
  if (isInstalled && variant === 'nav') {
    return null;
  }

  if (variant === 'hero') {
    return (
      <button
        onClick={onOpenModal}
        className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 font-bold text-sm shadow-xl shadow-black/40 transition-all hover:scale-[1.02] cursor-pointer"
        id="hero-install-android-app-btn"
      >
        <Smartphone className="w-4 h-4 text-amber-400 animate-pulse" />
        <span>Get Android App (APK)</span>
      </button>
    );
  }

  if (variant === 'mobile') {
    return (
      <button
        onClick={onOpenModal}
        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm shadow-md shadow-amber-500/20 transition-all"
        id="mobile-drawer-android-btn"
      >
        <Smartphone className="w-4 h-4" />
        <span>Install Android App / APK</span>
      </button>
    );
  }

  if (variant === 'footer') {
    return (
      <button
        onClick={onOpenModal}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 hover:text-amber-300 text-xs font-semibold transition-colors"
        id="footer-android-apk-btn"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Download Android App (.APK)</span>
      </button>
    );
  }

  // Default 'nav' variant
  return (
    <button
      onClick={onOpenModal}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-400 hover:text-amber-300 text-xs sm:text-sm font-semibold transition-all shadow-sm"
      title="Install Android App / Download APK"
      id="navbar-android-apk-btn"
    >
      <Smartphone className="w-3.5 h-3.5 text-amber-400" />
      <span className="hidden sm:inline">Android App</span>
      <span className="sm:hidden">App</span>
    </button>
  );
};
