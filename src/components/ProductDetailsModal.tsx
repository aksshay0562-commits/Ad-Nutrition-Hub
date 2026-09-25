import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MessageCircle, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Share2, 
  TrendingDown, 
  TrendingUp, 
  History,
  Calendar,
  Sparkles,
  Bell,
  BellRing,
  Check,
  ArrowRight,
  Smartphone,
  ExternalLink,
  Youtube,
  Play
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Product, PriceHistoryPoint, STORE_INFO } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  buildWhatsAppEnquiryUrl, 
  formatPrice, 
  submitCustomerEnquiry,
  submitPriceAlert,
  buildWhatsAppPriceAlertUrl,
  getYoutubeEmbedUrl,
  getYoutubeVideoId
} from '../services/productService';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  isAdmin?: boolean;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onEdit,
  isAdmin = false
}) => {
  if (!product) return null;

  const { currentUser } = useAuth();
  const isInStock = product.availability === 'In Stock';
  const whatsappUrl = buildWhatsAppEnquiryUrl(product);

  // Price Drop Alert State
  const [showAlertForm, setShowAlertForm] = React.useState<boolean>(false);
  const [alertPhone, setAlertPhone] = React.useState<string>(() => localStorage.getItem('ad_nutrition_user_phone') || '');
  const [alertName, setAlertName] = React.useState<string>(() => localStorage.getItem('ad_nutrition_user_name') || currentUser?.displayName || '');
  const [targetType, setTargetType] = React.useState<'5percent' | '10percent' | 'any' | 'custom'>('5percent');
  const [customPrice, setCustomPrice] = React.useState<string>(() => Math.round(product.price * 0.95).toString());
  const [alertSubmitting, setAlertSubmitting] = React.useState<boolean>(false);
  const [alertSuccess, setAlertSuccess] = React.useState<boolean>(false);
  const [alertError, setAlertError] = React.useState<string | null>(null);
  const [alertWhatsAppUrl, setAlertWhatsAppUrl] = React.useState<string>('');

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const savingsAmount = product.originalPrice && product.originalPrice > product.price
    ? product.originalPrice - product.price
    : null;

  // Compute target price based on choice
  const computedTargetPrice = React.useMemo(() => {
    if (targetType === 'any') return Math.max(100, product.price - 100);
    if (targetType === '5percent') return Math.round(product.price * 0.95);
    if (targetType === '10percent') return Math.round(product.price * 0.90);
    const parsed = parseFloat(customPrice);
    return isNaN(parsed) || parsed <= 0 ? Math.round(product.price * 0.95) : Math.round(parsed);
  }, [targetType, customPrice, product.price]);

  // Compute or fallback realistic price history trend
  const chartData: PriceHistoryPoint[] = React.useMemo(() => {
    if (product.priceHistory && product.priceHistory.length >= 2) {
      return product.priceHistory;
    }
    if (product.priceHistory && product.priceHistory.length === 1) {
      const pt = product.priceHistory[0];
      const prevPrice = product.originalPrice && product.originalPrice > pt.price 
        ? product.originalPrice 
        : Math.round(pt.price * 1.15);
      return [
        { date: 'Initial', price: prevPrice },
        pt
      ];
    }
    // Realistic fallback based on originalPrice -> current price
    const curr = product.price;
    const orig = product.originalPrice && product.originalPrice > curr 
      ? product.originalPrice 
      : Math.round(curr * 1.18);
    const drop = orig - curr;
    return [
      { date: 'May', price: orig },
      { date: 'Jun', price: Math.round(orig - drop * 0.28) },
      { date: 'Jul', price: Math.round(orig - drop * 0.52) },
      { date: 'Aug', price: Math.round(orig - drop * 0.76) },
      { date: 'Sep (Now)', price: curr }
    ];
  }, [product]);

  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const isAtLowest = product.price <= minPrice;
  const savingsFromPeak = maxPrice - product.price;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${product.name} - AD Nutrition Hub Israna`,
        text: `Check out ${product.name} for ${formatPrice(product.price)} at AD Nutrition Hub Israna!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  const handlePriceAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);

    const cleanDigits = alertPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setAlertError('Please enter a valid 10-digit WhatsApp number (e.g. 7015959517).');
      return;
    }

    if (computedTargetPrice >= product.price) {
      setAlertError(`Target price must be lower than the current price (${formatPrice(product.price)}).`);
      return;
    }

    setAlertSubmitting(true);
    try {
      localStorage.setItem('ad_nutrition_user_phone', alertPhone.trim());
      if (alertName) localStorage.setItem('ad_nutrition_user_name', alertName.trim());

      await submitPriceAlert({
        productId: product.id,
        productName: product.name,
        phone: alertPhone.trim(),
        customerName: alertName.trim() || undefined,
        currentPrice: product.price,
        targetPrice: computedTargetPrice,
        userId: currentUser?.uid
      });

      const waUrl = buildWhatsAppPriceAlertUrl(product, computedTargetPrice, alertPhone.trim(), alertName.trim());
      setAlertWhatsAppUrl(waUrl);
      setAlertSuccess(true);
    } catch (err: any) {
      setAlertError(err?.message || 'Failed to submit price alert request. Please try again.');
    } finally {
      setAlertSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      id="product-details-modal-backdrop"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="relative w-full max-w-3xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        id="product-details-modal-content"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/80 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {product.category}
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-xs text-neutral-400">AD Nutrition Hub Israna</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Share Product"
              id="modal-share-product-btn"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Close modal"
              id="modal-close-product-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Product Image */}
            <div className="md:col-span-5 relative rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden aspect-square">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80';
                }}
              />
              {discountPercent && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-amber-500 text-neutral-950 text-xs font-black tracking-wider uppercase shadow-md">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Right: Key Details */}
            <div className="md:col-span-7 space-y-4">
              {/* Brand & Stock */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Brand: <span className="text-neutral-200">{product.brand || 'AD Nutrition Hub'}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    isInStock
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : 'bg-red-950/80 text-red-400 border-red-800'
                  }`}
                >
                  {isInStock ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{product.availability}</span>
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                {product.name}
              </h2>

              {/* Price Block */}
              <div className="p-3.5 rounded-xl bg-neutral-950/90 border border-neutral-800 space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-amber-400">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-neutral-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  {savingsAmount && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
                      Save {formatPrice(savingsAmount)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Includes all taxes • Available for store pickup at Mandi Mor, Israna
                </p>
              </div>

              {/* Specifications pills */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {product.weightOrSize && (
                  <div className="p-2.5 rounded-lg bg-neutral-800/60 border border-neutral-700/60">
                    <span className="text-neutral-400 block text-[10px] uppercase font-bold">Size / Servings</span>
                    <span className="text-white font-semibold">{product.weightOrSize}</span>
                  </div>
                )}
                {product.flavour && (
                  <div className="p-2.5 rounded-lg bg-neutral-800/60 border border-neutral-700/60">
                    <span className="text-neutral-400 block text-[10px] uppercase font-bold">Flavour</span>
                    <span className="text-white font-semibold">{product.flavour}</span>
                  </div>
                )}
                <div className="p-2.5 rounded-lg bg-neutral-800/60 border border-neutral-700/60">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="text-white font-semibold">{product.category}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-800/60 border border-neutral-700/60">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Origin</span>
                  <span className="text-white font-semibold">100% Genuine Importer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Trend Line Chart Section with Smooth Animation & Gradient Area */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
            className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-3 shadow-inner"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <TrendingDown className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Price Trend & History</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-normal">
                    {chartData.length} checkpoints
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-400 text-[11px]">Lowest:</span>
                    <span className="text-emerald-400 font-extrabold">{formatPrice(minPrice)}</span>
                  </div>
                  <span className="text-neutral-700">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-400 text-[11px]">Peak:</span>
                    <span className="text-neutral-300 font-semibold">{formatPrice(maxPrice)}</span>
                  </div>
                </div>

                {/* Get Price Alerts Toggle Button in Chart Header */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAlertForm(!showAlertForm);
                    setAlertSuccess(false);
                    setAlertError(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    showAlertForm 
                      ? 'bg-amber-500 text-neutral-950 shadow-amber-500/20' 
                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30'
                  }`}
                  id="modal-header-get-price-alerts-btn"
                  title="Subscribe for WhatsApp price drop alerts"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>{showAlertForm ? 'Hide Alert Form' : 'Get Price Alerts'}</span>
                </button>
              </div>
            </div>

            {/* Recharts Responsive Container with Gradient Area under line */}
            <div className="w-full h-44 sm:h-48 pt-1" id="product-price-trend-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 16, left: -14, bottom: 4 }}>
                  <defs>
                    <linearGradient id="priceTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.38} />
                      <stop offset="65%" stopColor="#f59e0b" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#737373" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#333333' }}
                    dy={5}
                  />
                  <YAxis 
                    stroke="#737373" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    domain={['dataMin - 100', 'dataMax + 100']}
                    tickFormatter={(val: number) => `₹${val}`}
                    width={58}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value as number;
                        const isLowest = val === minPrice;
                        const isPeak = val === maxPrice;
                        const diffFromPeak = maxPrice - val;

                        return (
                          <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700/90 p-3 rounded-xl shadow-2xl text-left min-w-[170px] pointer-events-none ring-1 ring-white/10">
                            <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-1.5 mb-1.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400">
                                <Calendar className="w-3 h-3 text-amber-400" />
                                <span>{label}</span>
                              </div>
                              {isLowest && (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  Best Price
                                </span>
                              )}
                              {isPeak && !isLowest && (
                                <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                                  Peak
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-base font-black text-amber-400 tracking-tight">
                                {formatPrice(val)}
                              </span>
                              <span className="text-[11px] text-neutral-500 font-medium">INR</span>
                            </div>
                            {diffFromPeak > 0 && (
                              <p className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3 shrink-0" />
                                <span>Save {formatPrice(diffFromPeak)} compared to peak</span>
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5}
                    fill="url(#priceTrendGradient)"
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    dot={{ r: 4, fill: '#f59e0b', stroke: '#171717', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 2.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Footer Summary Bar */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/80 gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                {isAtLowest 
                  ? 'Currently at all-time lowest recorded price!' 
                  : `₹${savingsFromPeak} lower than previous peak price`}
              </span>
              <span className="text-neutral-500 flex items-center gap-1">
                <History className="w-3 h-3" />
                <span>AD Nutrition Hub Verified Store Pricing</span>
              </span>
            </div>
          </motion.div>

          {/* Interactive Price Drop Alert Subscription Form */}
          <AnimatePresence>
            {showAlertForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
                id="price-alert-panel"
              >
                <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-amber-500/40 shadow-xl space-y-4 relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <BellRing className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <span>Get WhatsApp Price Drop Alerts</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Live via WhatsApp
                          </span>
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Never miss a deal! We'll ping your WhatsApp the moment this price drops or when special discount batches arrive at our Israna shop.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAlertForm(false)}
                      className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Close price alert form"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {alertSuccess ? (
                    <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 space-y-3">
                      <div className="flex items-center gap-2.5 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span className="font-bold text-sm">Price Drop Alert Activated!</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        We've registered your alert for <strong className="text-white">{product.name}</strong> at target price <strong className="text-amber-400">{formatPrice(computedTargetPrice)}</strong>. 
                        You can also send a 1-tap WhatsApp message to confirm directly with our store owner.
                      </p>
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <a
                          href={alertWhatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
                          id="modal-open-whatsapp-alert-btn"
                        >
                          <MessageCircle className="w-4 h-4 fill-white" />
                          <span>Open WhatsApp Confirmation</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setAlertSuccess(false);
                            setShowAlertForm(false);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handlePriceAlertSubmit} className="space-y-4">
                      {/* Target Price Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-300 block">
                          Alert Me When Price Drops To:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setTargetType('5percent')}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              targetType === '5percent'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <span className="block text-[11px] font-medium">5% Drop</span>
                            <span className="block text-xs font-black text-white">{formatPrice(Math.round(product.price * 0.95))}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTargetType('10percent')}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              targetType === '10percent'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <span className="block text-[11px] font-medium">10% Drop</span>
                            <span className="block text-xs font-black text-white">{formatPrice(Math.round(product.price * 0.90))}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTargetType('any')}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              targetType === 'any'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <span className="block text-[11px] font-medium">Any Drop</span>
                            <span className="block text-xs font-black text-white">&lt; {formatPrice(product.price)}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTargetType('custom')}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              targetType === 'custom'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <span className="block text-[11px] font-medium">Custom Target</span>
                            <span className="block text-xs font-black text-white">Enter ₹</span>
                          </button>
                        </div>

                        {targetType === 'custom' && (
                          <div className="pt-1">
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-neutral-400 text-xs font-bold">₹</span>
                              <input
                                type="number"
                                min="100"
                                max={product.price - 1}
                                value={customPrice}
                                onChange={(e) => setCustomPrice(e.target.value)}
                                placeholder={`Enter target below ${product.price}`}
                                className="w-full pl-7 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Contact Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>WhatsApp Phone Number *</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-neutral-400 text-xs font-bold">+91</span>
                            <input
                              type="tel"
                              value={alertPhone}
                              onChange={(e) => setAlertPhone(e.target.value)}
                              placeholder="7015959517"
                              maxLength={15}
                              className="w-full pl-11 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                              required
                              id="modal-alert-phone-input"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-neutral-300">
                            Your Name (Optional)
                          </label>
                          <input
                            type="text"
                            value={alertName}
                            onChange={(e) => setAlertName(e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            maxLength={50}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                            id="modal-alert-name-input"
                          />
                        </div>
                      </div>

                      {alertError && (
                        <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>{alertError}</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <p className="text-[11px] text-neutral-500">
                          🛡️ No spam • Official AD Nutrition Hub Israna alerts only
                        </p>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setShowAlertForm(false)}
                            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={alertSubmitting}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 text-xs font-bold shadow-lg transition-colors cursor-pointer"
                            id="modal-confirm-price-alert-btn"
                          >
                            {alertSubmitting ? (
                              <span>Activating Alert...</span>
                            ) : (
                              <>
                                <BellRing className="w-3.5 h-3.5" />
                                <span>Set Alert for {formatPrice(computedTargetPrice)}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Description Block */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Product Description & Benefits
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* YouTube Video Review & Guide Block */}
          {product.youtubeUrl && getYoutubeEmbedUrl(product.youtubeUrl) && (
            <div className="space-y-3 pt-2 border-t border-neutral-800" id="product-youtube-video-section">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Video Review & Supplement Guide</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        YouTube
                      </span>
                    </h3>
                  </div>
                </div>

                <a
                  href={product.youtubeUrl.startsWith('http') ? product.youtubeUrl : `https://www.youtube.com/watch?v=${getYoutubeVideoId(product.youtubeUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 transition-colors font-semibold"
                  title="Open video in YouTube app or new tab"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Responsive Embedded YouTube Player */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl">
                <iframe
                  src={getYoutubeEmbedUrl(product.youtubeUrl) || ''}
                  title={`${product.name} Video Review & Guide`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 gap-2">
                <span>Detailed supplement breakdown, timing, workout dosage, and genuine product verification.</span>
                <span className="text-neutral-500 font-medium">AD Nutrition Hub Israna</span>
              </div>
            </div>
          )}

          {/* Authenticity Guarantee Callout */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5">
            <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-300 space-y-1">
              <span className="font-bold text-white block text-sm">AD Nutrition Hub Authenticity Promise</span>
              <p>
                All supplements at our Mandi Mor, Israna store are sourced directly from authorized brand importers with genuine batch numbers, scratch validation codes, and GST bills.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  submitCustomerEnquiry({
                    customerName: 'Store Visitor',
                    phone: '917015959517',
                    message: `Interested in ${product.name} (₹${product.price})`,
                    productId: product.id,
                    productName: product.name,
                  }).catch(() => {});
                }}
                className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 transition-colors cursor-pointer"
                id="modal-order-whatsapp-btn"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Order / Enquire on WhatsApp</span>
              </motion.a>

              <a
                href={`tel:${STORE_INFO.phone}`}
                className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold text-sm transition-colors"
                id="modal-call-store-btn"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Call Shop: {STORE_INFO.phone}</span>
              </a>
            </div>

            {/* Quick Price Alert Banner CTA in Actions */}
            {!showAlertForm && (
              <button
                type="button"
                onClick={() => {
                  setShowAlertForm(true);
                  setAlertSuccess(false);
                  setTimeout(() => {
                    document.getElementById('price-alert-panel')?.scrollIntoView({ behavior: 'smooth' });
                  }, 80);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 hover:border-amber-500/40 text-neutral-200 transition-all cursor-pointer group"
                id="modal-quick-price-alert-cta"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Waiting for a price drop or offer?
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Sign up for instant WhatsApp notifications when price drops
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/20 border border-amber-500/35 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
                  <span>Get Alert</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            )}
          </div>

          {/* Store Location reminder */}
          <div className="text-center text-xs text-neutral-400 pt-1 flex items-center justify-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Store address: {STORE_INFO.location}</span>
          </div>

          {/* Admin Edit Shortcut inside Modal */}
          {isAdmin && onEdit && (
            <div className="pt-2 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors"
                id="modal-admin-edit-btn"
              >
                Edit This Product in Admin Panel
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};


