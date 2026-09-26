import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Eye, Edit, Trash2, CheckCircle2, XCircle, Tag, Youtube, QrCode, Flame } from 'lucide-react';
import { Product } from '../types';
import { buildWhatsAppEnquiryUrl, formatPrice } from '../services/productService';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onShowQR?: (product: Product) => void;
  isAdmin?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onToggleStock?: (product: Product) => void;
  badge?: 'Trending' | 'Shop Now' | string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onShowQR,
  isAdmin = false,
  onEdit,
  onDelete,
  onToggleStock,
  badge
}) => {
  const isInStock = product.availability === 'In Stock';
  const whatsappUrl = buildWhatsAppEnquiryUrl(product);

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div 
      className="group relative flex flex-col rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 overflow-hidden"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Section */}
      <div 
        className="relative w-full aspect-square bg-neutral-950/60 overflow-hidden cursor-pointer"
        onClick={() => onViewDetails(product)}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            // Fallback supplement image
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Dark subtle gradient at bottom of image for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Top Badges: Category, Spotlight Badge & Discount */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md border border-neutral-700 text-neutral-200 text-[11px] font-bold tracking-wide">
              {product.category}
            </span>
            {badge && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 text-[10.5px] font-black uppercase tracking-wider shadow-md shadow-black/50"
                id={`product-card-badge-${product.id}`}
              >
                <Flame className="w-3 h-3 fill-neutral-950 stroke-neutral-950" />
                <span>{badge}</span>
              </span>
            )}
          </div>
          {discountPercent ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-neutral-950 text-[11px] font-extrabold uppercase shadow-sm">
              {discountPercent}% OFF
            </span>
          ) : null}
        </div>

        {/* Stock Status Badge & YouTube Badge at bottom left of image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold backdrop-blur-md border ${
              isInStock
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                : 'bg-red-950/80 text-red-400 border-red-800/80'
            }`}
          >
            {isInStock ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Stock</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Out of Stock</span>
              </>
            )}
          </span>

          {product.youtubeUrl && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-red-600/90 text-white border border-red-500/80 backdrop-blur-md shadow-sm"
              title="Includes Video Review & Guide"
            >
              <Youtube className="w-3 h-3 fill-white" />
              <span>Video</span>
            </span>
          )}
        </div>

        {/* Quick View and QR Overlay Buttons */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onShowQR && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowQR(product);
              }}
              className="p-2 rounded-lg bg-neutral-900/90 text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 border border-neutral-700 shadow-md transition-colors"
              title="Show Product QR Code"
              id={`quick-qr-btn-${product.id}`}
            >
              <QrCode className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="p-2 rounded-lg bg-neutral-900/90 text-neutral-200 hover:text-white hover:bg-neutral-800 border border-neutral-700 shadow-md transition-colors"
            title="Quick View"
            id={`quick-view-btn-${product.id}`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Brand or Size tag */}
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
          <span className="font-semibold text-neutral-300 truncate max-w-[65%]">
            {product.brand || 'AD Nutrition Hub'}
          </span>
          {product.weightOrSize && (
            <span className="text-neutral-400 bg-neutral-800/60 px-2 py-0.5 rounded text-[11px]">
              {product.weightOrSize}
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3 
          onClick={() => onViewDetails(product)}
          className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 cursor-pointer mb-2"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Flavour if present */}
        {product.flavour && (
          <div className="text-xs text-amber-300/80 font-medium mb-2.5 flex items-center gap-1 truncate">
            <span>Flavour:</span>
            <span className="text-neutral-200">{product.flavour}</span>
          </div>
        )}

        {/* Short Description */}
        <p className="text-xs text-neutral-400 line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>

        {/* Price Row */}
        <div className="flex items-baseline justify-between pt-3 border-t border-neutral-800/80 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-white">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-neutral-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {badge && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] sm:text-[10.5px] font-bold uppercase tracking-tight group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
                <span>Shop Now</span>
                <span className="text-[11px] font-black leading-none ml-0.5">→</span>
              </span>
            )}
            <span className="text-[11px] text-emerald-400 font-medium">
              Best Store Price
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 mt-auto">
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950 transition-colors cursor-pointer"
            id={`product-whatsapp-enquiry-${product.id}`}
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Enquire on WhatsApp</span>
          </motion.a>

          <button
            onClick={() => onViewDetails(product)}
            className="w-full py-2 px-3 rounded-xl bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 group/btn cursor-pointer"
            id={`product-view-details-${product.id}`}
          >
            <span>{badge ? 'Shop Now • Details' : 'Full Product Details'}</span>
            {badge && (
              <span className="text-amber-400 group-hover/btn:translate-x-0.5 transition-transform font-bold">
                →
              </span>
            )}
          </button>
        </div>

        {/* Admin Controls (Only visible when Admin Mode is active) */}
        {isAdmin && (
          <div className="mt-3 pt-3 border-t border-amber-500/20 bg-amber-500/5 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 flex items-center justify-between gap-1 text-xs">
            <button
              onClick={() => onToggleStock && onToggleStock(product)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                isInStock
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
              id={`admin-toggle-stock-${product.id}`}
              title="Click to toggle Stock Status"
            >
              {isInStock ? 'Mark Out of Stock' : 'Mark In Stock'}
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit && onEdit(product)}
                className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white"
                title="Edit Product"
                id={`admin-edit-prod-${product.id}`}
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete && onDelete(product)}
                className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-400 hover:text-red-200"
                title="Delete Product"
                id={`admin-delete-prod-${product.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
