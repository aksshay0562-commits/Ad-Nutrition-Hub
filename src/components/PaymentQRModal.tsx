import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  MessageCircle, 
  CreditCard, 
  ShieldCheck, 
  IndianRupee, 
  Sparkles,
  QrCode as QrCodeIcon,
  Smartphone
} from 'lucide-react';
import { STORE_INFO } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAmount?: number;
  productContext?: {
    name: string;
    price: number;
  };
}

export const PaymentQRModal: React.FC<PaymentQRModalProps> = ({
  isOpen,
  onClose,
  initialAmount,
  productContext
}) => {
  const [amount, setAmount] = useState<string>(initialAmount ? initialAmount.toString() : '');
  const [showAmountInput, setShowAmountInput] = useState<boolean>(Boolean(initialAmount));
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const payeeName = STORE_INFO.payment.payeeName; // "Sumit ."
  const upiId = STORE_INFO.payment.upiId; // "sumit6269@kotak"
  const accountInfo = `${STORE_INFO.payment.accountType} ${STORE_INFO.payment.accountMasked}`; // "Savings XX8240"

  // Build the UPI Payment URI
  const numericAmount = parseFloat(amount);
  const validAmount = !isNaN(numericAmount) && numericAmount > 0 ? numericAmount.toFixed(2) : '';

  const upiUri = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set('pa', upiId);
    params.set('pn', 'Sumit');
    params.set('cu', 'INR');
    if (validAmount) {
      params.set('am', validAmount);
    }
    const note = productContext 
      ? `AD Nutrition: ${productContext.name.slice(0, 25)}` 
      : 'AD Nutrition Hub Israna Payment';
    params.set('tn', note);

    return `upi://pay?${params.toString()}`;
  }, [upiId, validAmount, productContext]);

  // Generate QR Code with high quality whenever amount or URI changes
  useEffect(() => {
    if (!isOpen) return;

    setIsGenerating(true);
    QRCode.toDataURL(upiUri, {
      width: 512,
      margin: 2,
      color: {
        dark: '#0a0a0a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => {
        setQrDataUrl(url);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error('Failed to generate payment QR code:', err);
        setIsGenerating(false);
      });
  }, [upiUri, isOpen]);

  // Sync initialAmount if passed
  useEffect(() => {
    if (initialAmount && initialAmount > 0) {
      setAmount(initialAmount.toString());
      setShowAmountInput(true);
    }
  }, [initialAmount]);

  if (!isOpen) return null;

  const handleCopyUpiId = async () => {
    triggerHaptic('success');
    try {
      await navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      // Fallback
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const handleDownloadQR = () => {
    triggerHaptic('light');
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `AD-Nutrition-Payment-QR-${validAmount ? `Rs${validAmount}` : 'UPI'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenUpiApp = () => {
    triggerHaptic('medium');
    window.location.href = upiUri;
  };

  const getWhatsAppConfirmUrl = () => {
    const text = validAmount
      ? `Namaste Sumit bhaiya! Maine AD Nutrition Hub Israna ke liye ₹${validAmount} ka UPI payment (${upiId}) kar diya hai.${productContext ? ` Product: ${productContext.name}` : ''} Kripya payment verify karein.`
      : `Namaste Sumit bhaiya! Maine AD Nutrition Hub Israna ke UPI (${upiId}) par payment transfer kiya hai. Kripya check karein.`;
    return `https://wa.me/917015959517?text=${encodeURIComponent(text)}`;
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-md overflow-y-auto"
        id="payment-qr-modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800/90 bg-neutral-950/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                <QrCodeIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                  <span>Store UPI Payment QR</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    Live
                  </span>
                </h3>
                <p className="text-[10.5px] text-neutral-400">
                  Instant Direct Payment to AD Nutrition Hub
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Payment Modal"
              id="payment-qr-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* The Authentic Kotak UPI QR Card matching the user's uploaded payment receipt/standee */}
            <div className="relative rounded-2xl bg-white text-neutral-900 p-5 shadow-xl text-center space-y-3.5 border-2 border-neutral-200">
              {/* Payee Name & Kotak Bank Branding */}
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-neutral-900 font-sans">
                  {payeeName}
                </h2>
                
                {/* Kotak Mahindra Bank & Account Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold border border-neutral-200">
                  {/* Kotak Infinity Logo representation */}
                  <span className="w-4 h-4 rounded-full bg-[#ED1C24] flex items-center justify-center text-white font-bold text-[9px] shadow-sm">
                    <span className="text-[#003366] font-black">∞</span>
                  </span>
                  <span className="text-neutral-900 font-bold">{accountInfo}</span>
                </div>
              </div>

              {/* QR Code Container with Center Kotak / UPI Emblem */}
              <div className="relative mx-auto w-64 h-64 sm:w-68 sm:h-68 bg-white p-2 rounded-2xl border border-neutral-200 shadow-inner flex items-center justify-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-2 text-neutral-400">
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Generating QR...</span>
                  </div>
                ) : qrDataUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                      src={qrDataUrl} 
                      alt={`UPI Payment QR Code for ${payeeName}`}
                      className="w-full h-full object-contain rounded-lg"
                      id="official-payment-qr-image"
                    />

                    {/* Center Kotak / Infinity Emblem Badge over the QR code */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border-2 border-[#ED1C24] flex items-center justify-center shadow-lg pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-xs tracking-tighter shadow-inner">
                        <span className="text-red-500 font-extrabold text-sm">8</span>
                        <span className="text-white font-bold text-xs">11</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-neutral-400">QR Code Unavailable</span>
                )}
              </div>

              {/* UPI ID Pill with 1-Click Copy */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={handleCopyUpiId}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer group shadow-sm"
                  id="copy-upi-id-btn"
                  title="Click to copy UPI ID"
                >
                  <span className="text-neutral-500 font-normal">UPI ID</span>
                  <span className="font-mono font-bold text-neutral-900 group-hover:text-black">
                    {upiId}
                  </span>
                  {copiedUpi ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-neutral-500 group-hover:text-black transition-colors" />
                  )}
                </button>
              </div>

              {/* "Include payment amount in this QR code" button & expandable input */}
              <div className="pt-1">
                {!showAmountInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setShowAmountInput(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 hover:text-neutral-900 text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                    id="include-payment-amount-btn"
                  >
                    <IndianRupee className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Include payment amount in this QR code</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-left">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="custom-qr-amount" className="font-bold text-neutral-700 flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                        <span>Specify Payable Amount:</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAmount('');
                          setShowAmountInput(false);
                        }}
                        className="text-[11px] text-neutral-500 hover:text-neutral-800 underline cursor-pointer"
                      >
                        Reset / Flexible
                      </button>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        id="custom-qr-amount"
                        type="number"
                        min="1"
                        step="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount (e.g. 500, 1500, 3200)"
                        className="w-full pl-7 pr-3 py-2 rounded-lg bg-white border border-neutral-300 text-sm font-bold text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono shadow-sm"
                        autoFocus
                      />
                    </div>

                    {/* Quick Amount Suggestion Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {[500, 1000, 2000, 3500].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setAmount(preset.toString());
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                            amount === preset.toString()
                              ? 'bg-amber-500 text-neutral-950 font-black'
                              : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          ₹{preset}
                        </button>
                      ))}
                      {productContext && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setAmount(productContext.price.toString());
                          }}
                          className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-100 border border-emerald-300 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
                        >
                          Full Price (₹{productContext.price})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Mobile UPI & Download Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleOpenUpiApp}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer active:scale-98"
                id="open-in-upi-app-btn"
              >
                <Smartphone className="w-4 h-4 text-neutral-950" />
                <span>Pay via UPI App (GPay / PhonePe / Paytm)</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-950" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  id="download-payment-qr-btn"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download QR</span>
                </button>

                <a
                  href={getWhatsAppConfirmUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  id="confirm-payment-whatsapp-btn"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confirm on WA</span>
                </a>
              </div>
            </div>

            {/* Supported Apps Strip & Security Assurance */}
            <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="font-semibold text-neutral-300">Accepted Payment Apps:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>0% Convenience Fee</span>
                </span>
              </div>

              {/* Brand badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Cred', 'Amazon Pay', 'Any Bank App'].map((app) => (
                  <span 
                    key={app}
                    className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-semibold"
                  >
                    {app}
                  </span>
                ))}
              </div>

              <div className="pt-1 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
                <span>📍 Mandi Mor, Israna Store Counter</span>
                <span>Sumit Malik • +91 70159 59517</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
