import React from 'react';
import { X, MessageCircle, Phone, MapPin, CheckCircle2, XCircle, ShieldCheck, Zap, Share2 } from 'lucide-react';
import { Product, STORE_INFO } from '../types';
import { buildWhatsAppEnquiryUrl, formatPrice } from '../services/productService';

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

  const isInStock = product.availability === 'In Stock';
  const whatsappUrl = buildWhatsAppEnquiryUrl(product);

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const savingsAmount = product.originalPrice && product.originalPrice > product.price
    ? product.originalPrice - product.price
    : null;

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      id="product-details-modal-backdrop"
    >
      <div 
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

          {/* Description Block */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Product Description & Benefits
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 transition-colors"
              id="modal-order-whatsapp-btn"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Order / Enquire on WhatsApp</span>
            </a>

            <a
              href={`tel:${STORE_INFO.phone}`}
              className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold text-sm transition-colors"
              id="modal-call-store-btn"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Call Shop: {STORE_INFO.phone}</span>
            </a>
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
      </div>
    </div>
  );
};
