import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  X, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Moon, 
  ShieldCheck, 
  Flame, 
  Sliders, 
  Layers, 
  Paintbrush,
  CheckCircle2,
  Zap,
  Star
} from 'lucide-react';
import { 
  COLOR_THEMES, 
  BG_THEMES, 
  UNIQUE_QUICK_SWATCHES,
  ColorTheme, 
  BgTheme 
} from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  currentBg: string;
  customHex: string;
  onSelectColor: (colorId: string) => void;
  onSelectCustomHex: (hex: string) => void;
  onSelectBg: (bgId: string) => void;
  onReset: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentColor,
  currentBg,
  customHex,
  onSelectColor,
  onSelectCustomHex,
  onSelectBg,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'unique' | 'classic' | 'background'>('unique');
  const [hexInput, setHexInput] = useState<string>(customHex || '#00F0FF');
  const [hexError, setHexError] = useState<string | null>(null);

  useEffect(() => {
    if (customHex) {
      setHexInput(customHex);
    }
  }, [customHex]);

  if (!isOpen) return null;

  const isCustomActive = currentColor === 'custom';
  const activeColorTheme = COLOR_THEMES.find((c) => c.id === currentColor);
  const activeBgTheme = BG_THEMES.find((b) => b.id === currentBg) || BG_THEMES[0];

  const currentActiveHex = isCustomActive 
    ? customHex 
    : (activeColorTheme?.primaryHex || '#f59e0b');

  const currentDisplayName = isCustomActive
    ? `Custom Unique (${customHex.toUpperCase()})`
    : (activeColorTheme?.name || 'Gold Amber');

  const handleApplyHex = (val: string) => {
    const formatted = val.startsWith('#') ? val : `#${val}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(formatted)) {
      setHexError(null);
      triggerHaptic('success');
      onSelectCustomHex(formatted.toUpperCase());
    } else {
      setHexError('Please enter a valid 6-character hex (e.g. #00F0FF)');
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setHexInput(val);
    setHexError(null);
    triggerHaptic('light');
    onSelectCustomHex(val);
  };

  const handleQuickSwatchClick = (hex: string) => {
    setHexInput(hex);
    setHexError(null);
    triggerHaptic('medium');
    onSelectCustomHex(hex);
  };

  // Filter themes
  const uniqueThemes = COLOR_THEMES.filter(t => t.isUnique);
  const classicThemes = COLOR_THEMES.filter(t => !t.isUnique);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
        id="theme-customizer-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto"
          id="theme-customizer-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-neutral-950 shadow-lg transition-colors border border-white/20"
                style={{ backgroundColor: currentActiveHex }}
              >
                <Palette className="w-5 h-5 text-neutral-950" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>App Colour & Themes</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Pick any custom unique color or select an exotic preset
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              id="close-theme-modal-btn"
              aria-label="Close theme modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Live UI Appearance</span>
              </span>
              <span className="text-[11px] font-bold text-amber-400 truncate max-w-[200px]">
                {currentDisplayName} • {activeBgTheme.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {/* Sample Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Genuine</span>
              </div>

              {/* Sample Price */}
              <div className="inline-flex items-baseline gap-1 text-sm font-black text-amber-400">
                <span>₹2,499</span>
                <span className="text-xs text-neutral-500 line-through">₹3,299</span>
              </div>

              {/* Sample Button */}
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-black shadow-md shadow-amber-500/20">
                Primary Button
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('unique');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'unique'
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
              id="tab-unique-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unique & Custom</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('classic');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'classic'
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
              id="tab-classic-colors"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Classic Presets</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('background');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'background'
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
              id="tab-bg-atmosphere"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Background</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: UNIQUE & CUSTOM COLOUR STUDIO                                      */}
          {/* ========================================================================= */}
          {activeTab === 'unique' && (
            <div className="space-y-4 animate-fade-in">
              {/* Custom Colour Wheel & Hex Input */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
                    <span>Create Your Own Unique Colour</span>
                  </label>
                  <span className="text-[10px] font-semibold text-neutral-400">
                    Full Spectrum
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Native Color Picker Circle */}
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-lg border-2 border-neutral-700 hover:border-amber-400 transition-colors cursor-pointer group">
                    <input
                      type="color"
                      value={hexInput.startsWith('#') && hexInput.length === 7 ? hexInput : '#00F0FF'}
                      onChange={handleColorPickerChange}
                      className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer opacity-0"
                      id="custom-color-picker-input"
                      title="Click to open color wheel"
                    />
                    <div 
                      className="w-full h-full flex items-center justify-center text-xs font-bold shadow-inner"
                      style={{ backgroundColor: hexInput.startsWith('#') && hexInput.length === 7 ? hexInput : '#00F0FF' }}
                    >
                      <Palette className="w-5 h-5 text-neutral-950 drop-shadow" />
                    </div>
                  </div>

                  {/* Hex Text Input */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={hexInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setHexInput(val);
                            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                              setHexError(null);
                              onSelectCustomHex(val.toUpperCase());
                            }
                          }}
                          placeholder="#00F0FF"
                          maxLength={7}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-sm font-bold uppercase focus:outline-none focus:border-amber-400"
                          id="custom-hex-text-input"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyHex(hexInput)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                        id="apply-custom-hex-btn"
                      >
                        Apply
                      </button>
                    </div>

                    {hexError && (
                      <p className="text-[11px] text-red-400 mt-1">{hexError}</p>
                    )}
                  </div>
                </div>

                {/* Quick 1-Tap Unique Neon & Metallic Swatches */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-neutral-400">
                    Quick Unique Neon Accents:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {UNIQUE_QUICK_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => handleQuickSwatchClick(swatch.hex)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-[11px] font-semibold text-neutral-300 cursor-pointer transition-all hover:scale-105"
                        title={swatch.label}
                      >
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-white/20"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span>{swatch.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Handcrafted Exotic Unique Themes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>Exotic Signature Editions</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">
                    Hand-Tuned
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {uniqueThemes.map((theme: ColorTheme) => {
                    const isSelected = currentColor === theme.id;

                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('medium');
                          onSelectColor(theme.id);
                        }}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 relative group ${
                          isSelected
                            ? 'bg-neutral-800/90 border-amber-500 ring-2 ring-amber-500/40 shadow-lg scale-[1.01]'
                            : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50'
                        }`}
                        id={`theme-color-opt-${theme.id}`}
                      >
                        <span
                          className="w-8 h-8 rounded-xl shadow-md flex items-center justify-center border border-white/20 shrink-0"
                          style={{ backgroundColor: theme.primaryHex }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                              {theme.name}
                            </span>
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              Exotic
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                            {theme.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CLASSIC SIGNATURE PRESETS                                          */}
          {/* ========================================================================= */}
          {activeTab === 'classic' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Classic Athletic Colours
                </label>
                <span className="text-[11px] text-neutral-500">
                  Standard palette
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {classicThemes.map((theme: ColorTheme) => {
                  const isSelected = currentColor === theme.id;

                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        onSelectColor(theme.id);
                      }}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between relative group ${
                        isSelected
                          ? 'bg-neutral-800/90 border-amber-500 ring-2 ring-amber-500/40 shadow-lg scale-[1.02]'
                          : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50'
                      }`}
                      id={`theme-color-opt-${theme.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="w-6 h-6 rounded-full shadow-md flex items-center justify-center border border-white/20"
                          style={{ backgroundColor: theme.primaryHex }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-neutral-950 stroke-[3]" />}
                        </span>

                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>

                      <div className="mt-2.5">
                        <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          {theme.name}
                        </div>
                        <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                          {theme.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: BACKGROUND ATMOSPHERE                                              */}
          {/* ========================================================================= */}
          {activeTab === 'background' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Background Atmosphere Mode</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {BG_THEMES.map((bg: BgTheme) => {
                  const isSelected = currentBg === bg.id;

                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        onSelectBg(bg.id);
                      }}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-neutral-800 border-amber-500/80 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                      id={`theme-bg-opt-${bg.id}`}
                    >
                      <span 
                        className="w-5 h-5 rounded-full border border-neutral-700 shrink-0 shadow-inner"
                        style={{ backgroundColor: bg.previewBg }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{bg.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                          {bg.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Actions: Reset & Done */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setHexInput('#00F0FF');
                onReset();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              id="reset-theme-btn"
              title="Reset to default Gold Amber theme"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('success');
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              id="apply-theme-done-btn"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
