import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Zap, 
  MessageCircle, 
  Check, 
  Copy, 
  Phone, 
  ShoppingBag, 
  Plus, 
  Minus, 
  MapPin, 
  Store, 
  Truck, 
  CreditCard, 
  Banknote, 
  ShieldCheck, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Product, STORE_INFO } from '../types';
import { formatPrice } from '../services/productService';
import { buildWhatsAppUrl, WhatsAppLine } from '../utils/whatsapp';
import { triggerHaptic } from '../utils/haptics';
import { recordOrderSearch } from '../utils/orderTracking';

export interface QuickOrderModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDetails?: (product: Product) => void;
}

export type OrderFulfillment = 'pickup' | 'delivery';
export type PaymentPreference = 'upi' | 'cod';

interface StoredCustomerInfo {
  name: string;
  phone: string;
  fulfillment: OrderFulfillment;
  address: string;
  paymentPreference: PaymentPreference;
}

const STORAGE_KEY = 'ad_nutrition_quick_order_customer_v1';

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  product,
  isOpen,
  onClose,
  onOpenDetails,
}) => {
  // Order quantity
  const [quantity, setQuantity] = useState<number>(1);

  // Customer Form State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [fulfillment, setFulfillment] = useState<OrderFulfillment>('pickup');
  const [address, setAddress] = useState<string>('');
  const [paymentPreference, setPaymentPreference] = useState<PaymentPreference>('upi');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<WhatsAppLine>('line1');
  const [orderRefId, setOrderRefId] = useState<string>(() => `AD-${Math.floor(10000 + Math.random() * 90000)}`);

  // UI state
  const [copied, setCopied] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  // Restore saved customer profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: StoredCustomerInfo = JSON.parse(saved);
        if (parsed.name) setCustomerName(parsed.name);
        if (parsed.phone) setCustomerPhone(parsed.phone);
        if (parsed.fulfillment) setFulfillment(parsed.fulfillment);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.paymentPreference) setPaymentPreference(parsed.paymentPreference);
      }
    } catch (e) {
      // Ignore localStorage parse error
    }
  }, []);

  // Reset quantity when new product opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setFormErrors({});
      setCopied(false);
      setOrderRefId(`AD-${Math.floor(10000 + Math.random() * 90000)}`);
    }
  }, [isOpen, product]);

  // Calculations
  const calculations = useMemo(() => {
    if (!product) return { subtotal: 0, originalSubtotal: 0, savings: 0, discountPercent: 0 };
    const price = product.price || 0;
    const originalPrice = product.originalPrice && product.originalPrice > price ? product.originalPrice : price;
    
    const subtotal = price * quantity;
    const originalSubtotal = originalPrice * quantity;
    const savings = originalSubtotal - subtotal;
    const discountPercent = originalPrice > price 
      ? Math.round(((originalPrice - price) / originalPrice) * 100) 
      : 0;

    return {
      subtotal,
      originalSubtotal,
      savings,
      discountPercent,
    };
  }, [product, quantity]);

  // Save customer details to localStorage for future frictionless orders
  const saveCustomerDetails = () => {
    try {
      const dataToSave: StoredCustomerInfo = {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        fulfillment,
        address: address.trim(),
        paymentPreference,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {}
  };

  // Compile Structured Order Message
  const compiledOrderMessage = useMemo(() => {
    if (!product) return '';

    const name = customerName.trim() || 'Store Visitor';
    const phone = customerPhone.trim() || 'Not specified';
    const fulfillmentText = fulfillment === 'delivery' ? '🚚 Home Delivery' : '🏪 In-Store Pickup (Mandi Mor, Israna)';
    const paymentText = paymentPreference === 'upi' ? '📱 UPI (PhonePe / Google Pay / Paytm)' : '💵 Cash on Delivery / Counter';
    const savingsText = calculations.savings > 0 ? ` (Saved ${formatPrice(calculations.savings)})` : '';
    const flavourText = product.flavour ? `\n• Flavour: ${product.flavour}` : '';
    const sizeText = product.weightOrSize ? `\n• Size / Weight: ${product.weightOrSize}` : '';
    const addressText = fulfillment === 'delivery' && address.trim() ? `\n• Delivery Address: ${address.trim()}` : '';
    const notesText = specialNotes.trim() ? `\n\n📝 *Special Request / Note:*\n"${specialNotes.trim()}"` : '';

    return `*AD NUTRITION HUB ISRANA — QUICK ORDER REQUEST* 🛒
📍 Mandi Mor, Israna (Panipat, Haryana)
🔖 Order Ref: *#${orderRefId}*

📦 *Product Ordered:*
• Item: *${product.name}*
• Quantity: *${quantity} ${quantity > 1 ? 'Units' : 'Unit'}*${flavourText}${sizeText}
• Unit Price: ${formatPrice(product.price)}
• *Total Order Value: ${formatPrice(calculations.subtotal)}*${savingsText}

👤 *Customer Details:*
• Name: *${name}*
• Contact: ${phone}
• Order Type: ${fulfillmentText}${addressText}
• Payment Mode: ${paymentText}

Namaste Akshay Bhai! 🙏 Kripya is product ka stock reserve karein aur WhatsApp par bill / delivery confirmation share karein.${notesText}`;
  }, [product, quantity, customerName, customerPhone, fulfillment, address, paymentPreference, specialNotes, calculations, orderRefId]);

  const validateForm = (): boolean => {
    const errors: { name?: string; phone?: string; address?: string } = {};

    if (!customerName.trim()) {
      errors.name = 'Please enter your name';
    }

    if (!customerPhone.trim()) {
      errors.phone = 'Please enter your phone or WhatsApp number';
    } else if (customerPhone.trim().replace(/[^\d]/g, '').length < 10) {
      errors.phone = 'Please enter a valid 10-digit number';
    }

    if (fulfillment === 'delivery' && !address.trim()) {
      errors.address = 'Please enter your delivery address or landmark in/around Israna';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendOrder = () => {
    if (!product) return;

    if (!validateForm()) {
      triggerHaptic('error');
      return;
    }

    triggerHaptic('success');
    saveCustomerDetails();

    // Save order reference ID for 1-tap tracking in Floating WhatsApp history
    try {
      recordOrderSearch(orderRefId, 'Order Confirmed', product.name);
    } catch {}

    const targetPhone = selectedLine === 'line2' ? STORE_INFO.rawPhone2 : STORE_INFO.rawPhone1;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(compiledOrderMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = async () => {
    triggerHaptic('medium');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(compiledOrderMessage);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = compiledOrderMessage;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const adjustQuantity = (delta: number) => {
    triggerHaptic('light');
    setQuantity((prev) => Math.max(1, Math.min(50, prev + delta)));
  };

  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
        id="quick-order-modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            triggerHaptic('light');
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 18 }}
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
          className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          id="quick-order-modal-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="relative px-5 py-4 sm:px-6 sm:py-4 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/25 shrink-0">
                <Zap className="w-5 h-5 text-neutral-950 fill-neutral-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Quick Order via WhatsApp
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Instant Stock Hold</span>
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Pre-formats your order with quantity and delivery details for instant WhatsApp confirmation
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              id="quick-order-close-btn"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Product Summary Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0 relative">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                {calculations.discountPercent > 0 && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950 text-[9px] font-black uppercase">
                    {calculations.discountPercent}% OFF
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">
                  <span>{product.brand || 'AD Nutrition Hub'}</span>
                  <span>•</span>
                  <span>{product.category}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate mb-1">
                  {product.name}
                </h4>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-base sm:text-lg font-black text-amber-400">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-neutral-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  {product.weightOrSize && (
                    <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-semibold">
                      {product.weightOrSize}
                    </span>
                  )}
                  {product.flavour && (
                    <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-semibold truncate max-w-[120px]">
                      {product.flavour}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Quantity Selector & Price Tally */}
            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs uppercase font-extrabold tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>Select Order Quantity:</span>
                </label>

                {/* Live total display */}
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block">Total Amount</span>
                  <span className="text-base sm:text-lg font-black text-amber-400">
                    {formatPrice(calculations.subtotal)}
                  </span>
                  {calculations.savings > 0 && (
                    <span className="text-[10px] text-emerald-400 block font-bold">
                      You save {formatPrice(calculations.savings)}!
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Stepper & Quick Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Stepper Buttons */}
                <div className="inline-flex items-center rounded-xl bg-neutral-900 border border-neutral-700/80 p-1">
                  <button
                    type="button"
                    onClick={() => adjustQuantity(-1)}
                    disabled={quantity <= 1}
                    className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors cursor-pointer"
                    id="quick-order-qty-minus"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setQuantity(Math.max(1, Math.min(50, val)));
                    }}
                    className="w-14 text-center bg-transparent text-sm sm:text-base font-black text-white focus:outline-none"
                    id="quick-order-qty-input"
                  />

                  <button
                    type="button"
                    onClick={() => adjustQuantity(1)}
                    disabled={quantity >= 50}
                    className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors cursor-pointer"
                    id="quick-order-qty-plus"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Quantity Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 2, 3, 5].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setQuantity(qty);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        quantity === qty
                          ? 'bg-amber-400 text-neutral-950 font-black shadow-md shadow-amber-500/20'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700'
                      }`}
                    >
                      {qty} {qty === 1 ? 'Tub' : qty === 5 ? 'Bulk (5)' : 'Tubs'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Details Form */}
            <div className="space-y-3.5">
              <label className="text-xs uppercase font-extrabold tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-400" />
                <span>Your Details & Delivery Preference:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                    Your Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors ${
                      formErrors.name ? 'border-red-500' : 'border-neutral-800'
                    }`}
                    id="quick-order-name-input"
                  />
                  {formErrors.name && (
                    <p className="text-[10px] text-red-400 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* WhatsApp Phone */}
                <div>
                  <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                    WhatsApp / Phone Number <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="e.g. 98123 45678"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors ${
                      formErrors.phone ? 'border-red-500' : 'border-neutral-800'
                    }`}
                    id="quick-order-phone-input"
                  />
                  {formErrors.phone && (
                    <p className="text-[10px] text-red-400 mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Fulfillment Choice (Store Pickup vs Home Delivery) */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setFulfillment('pickup');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    fulfillment === 'pickup'
                      ? 'bg-neutral-800/90 border-amber-400 ring-2 ring-amber-400/20 text-white'
                      : 'bg-neutral-950/60 hover:bg-neutral-800/40 border-neutral-800 text-neutral-400'
                  }`}
                  id="quick-order-fulfillment-pickup"
                >
                  <Store className={`w-4 h-4 mt-0.5 shrink-0 ${fulfillment === 'pickup' ? 'text-amber-400' : 'text-neutral-500'}`} />
                  <div>
                    <p className="text-xs font-bold text-white">In-Store Pickup</p>
                    <p className="text-[10px] text-neutral-400">Mandi Mor, Israna (Ready in 15m)</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setFulfillment('delivery');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    fulfillment === 'delivery'
                      ? 'bg-neutral-800/90 border-amber-400 ring-2 ring-amber-400/20 text-white'
                      : 'bg-neutral-950/60 hover:bg-neutral-800/40 border-neutral-800 text-neutral-400'
                  }`}
                  id="quick-order-fulfillment-delivery"
                >
                  <Truck className={`w-4 h-4 mt-0.5 shrink-0 ${fulfillment === 'delivery' ? 'text-amber-400' : 'text-neutral-500'}`} />
                  <div>
                    <p className="text-xs font-bold text-white">Home Delivery</p>
                    <p className="text-[10px] text-neutral-400">Israna & Panipat region</p>
                  </div>
                </button>
              </div>

              {/* Delivery Address if Home Delivery is selected */}
              {fulfillment === 'delivery' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="text-[11px] font-bold text-neutral-400 block">
                    Delivery Address & Landmark <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: undefined }));
                    }}
                    placeholder="e.g. Near Govt College / Mandi Mor, Village Israna, Panipat"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors ${
                      formErrors.address ? 'border-red-500' : 'border-neutral-800'
                    }`}
                    id="quick-order-address-input"
                  />
                  {formErrors.address && (
                    <p className="text-[10px] text-red-400">{formErrors.address}</p>
                  )}
                </motion.div>
              )}

              {/* Payment Mode Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-neutral-400 block">
                  Payment Mode Preference:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPaymentPreference('upi');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentPreference === 'upi'
                        ? 'bg-neutral-800 text-white border-emerald-500/80 shadow-sm'
                        : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>UPI / GPay / PhonePe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPaymentPreference('cod');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentPreference === 'cod'
                        ? 'bg-neutral-800 text-white border-amber-500/80 shadow-sm'
                        : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cash on Delivery / Pickup</span>
                  </button>
                </div>
              </div>

              {/* Optional Special Notes / Flavour request */}
              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                  Optional Note (e.g. Specific flavour preference or delivery timing):
                </label>
                <input
                  type="text"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Chocolate flavour preferred, deliver in evening after 5 PM"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* WhatsApp Line Selector */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Choose WhatsApp Order Line:</span>
                </span>
                <span className="text-[10px] text-neutral-400">Direct Store Contacts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedLine('line1');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                    selectedLine === 'line1'
                      ? 'bg-neutral-800 border-emerald-400 text-white shadow-sm'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div>
                    <span className="font-bold text-white block">Line 1 (70159 59517)</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Primary Order Desk</span>
                  </div>
                  {selectedLine === 'line1' && <Check className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedLine('line2');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                    selectedLine === 'line2'
                      ? 'bg-neutral-800 border-emerald-400 text-white shadow-sm'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div>
                    <span className="font-bold text-white block">Line 2 (80532 26224)</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Akshay Malik Direct</span>
                  </div>
                  {selectedLine === 'line2' && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Collapsible WhatsApp Message Preview */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full flex items-center justify-between text-xs text-neutral-400 hover:text-white py-1 px-1 transition-colors cursor-pointer"
              >
                <span className="font-semibold flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Pre-formatted WhatsApp Message</span>
                </span>
                {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <AnimatePresence>
                {showPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300 whitespace-pre-wrap leading-relaxed shadow-inner max-h-48 overflow-y-auto"
                  >
                    {compiledOrderMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-400">Total:</span>
              <span className="text-lg font-black text-white">{formatPrice(calculations.subtotal)}</span>
              {calculations.savings > 0 && (
                <span className="text-[11px] text-emerald-400 font-bold hidden sm:inline">
                  (Save {formatPrice(calculations.savings)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="px-3.5 py-2.5 rounded-xl border border-neutral-750 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy WhatsApp order text"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleSendOrder}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all flex-1 sm:flex-none cursor-pointer"
                id="quick-order-submit-whatsapp-btn"
              >
                <MessageCircle className="w-4 h-4 fill-neutral-950 text-neutral-950" />
                <span>Send Order via WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-950" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
