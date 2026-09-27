import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, MessageCircle, Clock, ShieldCheck, Navigation, ExternalLink } from 'lucide-react';
import { STORE_INFO } from '../types';

export const ContactSection: React.FC = () => {
  return (
    <section id="location" className="py-16 sm:py-20 bg-neutral-950 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>Visit Our Store</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            AD NUTRITION HUB ISRANA
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 mt-2">
            Mandi Mor, Israna, Panipat par hamara store located hai. Aap direct store visit karke genuine supplements le sakte hain ya WhatsApp par order kar sakte hain.
          </p>
        </div>

        {/* Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Store Details & Contact */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Address Card */}
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Shop Address</h3>
                    <p className="text-sm text-neutral-200 font-semibold mt-1">
                      Mandi Mor, Israna
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Panipat, Haryana 132107, India
                    </p>
                    <div className="pt-2">
                      <a
                        href={STORE_INFO.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Get Directions on Google Maps</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Card: Phone & WhatsApp (Dual Numbers) */}
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Phone & WhatsApp Contacts</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Direct consultation, authentic stock enquiries & instant WhatsApp orders.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* WhatsApp Line 1 */}
                  <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-amber-400">Line 1 (Primary)</span>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-white font-black tracking-tight">
                      {STORE_INFO.phone}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <motion.a
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                        href={`https://wa.me/${STORE_INFO.rawPhone1}?text=${encodeURIComponent('Namaste AD Nutrition Hub Israna! Mujhe supplements ke baare mein enquire karna hai.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                        id="contact-whatsapp-line1-btn"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>WhatsApp</span>
                      </motion.a>
                      <a
                        href={`tel:${STORE_INFO.phone}`}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold border border-neutral-700 transition-colors"
                        title="Call Line 1"
                        id="contact-call-line1-btn"
                      >
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                      </a>
                    </div>
                  </div>

                  {/* WhatsApp Line 2 */}
                  <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-emerald-400">Line 2 (WhatsApp)</span>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-white font-black tracking-tight">
                      {STORE_INFO.phone2}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <motion.a
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                        href={`https://wa.me/${STORE_INFO.rawPhone2}?text=${encodeURIComponent('Namaste AD Nutrition Hub Israna! Mujhe supplements ke baare mein enquire karna hai.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                        id="contact-whatsapp-line2-btn"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>WhatsApp</span>
                      </motion.a>
                      <a
                        href={`tel:${STORE_INFO.phone2}`}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold border border-neutral-700 transition-colors"
                        title="Call Line 2"
                        id="contact-call-line2-btn"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shop Timings Card */}
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Store Timings</h3>
                    <div className="text-xs text-neutral-300 mt-1.5 space-y-1">
                      <div className="flex items-center justify-between gap-6">
                        <span className="text-neutral-400">Monday - Saturday:</span>
                        <span className="font-semibold text-white">{STORE_INFO.hours.weekdays}</span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <span className="text-neutral-400">Sunday:</span>
                        <span className="font-semibold text-white">{STORE_INFO.hours.sunday}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Genuine Guarantee Tag */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="text-xs text-neutral-300 font-medium">
                100% Genuine batch verified products directly available at store counter.
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Map Preview Card */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative flex-1 rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden min-h-[380px] flex flex-col">
              {/* Map Header Overlay */}
              <div className="p-4 bg-neutral-950/90 border-b border-neutral-800 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-white">Live Store Location</span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-xs text-neutral-400">Israna, Panipat, Haryana</span>
                </div>
                <a
                  href={STORE_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold hover:underline"
                >
                  <span>Open Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Google Maps Embed iframe with clean fallback */}
              <div className="relative flex-1 w-full h-full min-h-[300px] bg-neutral-950">
                <iframe
                  title="AD Nutrition Hub Israna Location"
                  src="https://maps.google.com/maps?q=Mandi+Mor+Israna+Panipat+Haryana&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0 absolute inset-0 filter invert-[90%] hue-rotate-180 contrast-125 opacity-85"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                {/* Pin Card overlay on top of map */}
                <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-neutral-950/90 backdrop-blur-md border border-neutral-700 p-4 rounded-xl shadow-xl z-20">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-neutral-950 font-black text-[10px]">
                      AD
                    </div>
                    <h4 className="text-xs font-extrabold text-white">AD Nutrition Hub Israna</h4>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Mandi Mor, Main Highway, Israna, Panipat.
                  </p>
                  <a
                    href={STORE_INFO.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Navigate Here</span>
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
