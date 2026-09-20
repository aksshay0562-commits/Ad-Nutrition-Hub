import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { STORE_INFO } from '../types';

export const FloatingWhatsApp: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);

  const whatsappUrl = `https://wa.me/917015959517?text=${encodeURIComponent('Namaste AD Nutrition Hub Israna! Mujhe supplements ke baare mein enquire karna hai.')}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Tooltip bubble */}
      {showTooltip && (
        <div className="relative bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs py-2 px-3.5 rounded-xl shadow-xl max-w-xs flex items-center gap-2 animate-bounce">
          <span>Need fitness advice or price check? <strong>WhatsApp us!</strong></span>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-neutral-400 hover:text-white p-0.5"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-neutral-900 border-r border-b border-neutral-700 rotate-45" />
        </div>
      )}

      {/* WhatsApp Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-950 font-bold text-sm transition-all hover:scale-105 active:scale-95"
        id="floating-whatsapp-btn"
        aria-label="Chat on WhatsApp with AD Nutrition Hub Israna"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <MessageCircle className="w-5 h-5 fill-white" />
        <span className="hidden sm:inline">WhatsApp Enquiry</span>
      </a>
    </div>
  );
};
