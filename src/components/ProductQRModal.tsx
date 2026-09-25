import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, Printer, QrCode, ExternalLink, Sparkles } from 'lucide-react';
import { Product, STORE_INFO } from '../types';
import { formatPrice } from '../services/productService';

interface ProductQRModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductQRModal: React.FC<ProductQRModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!product || !isOpen) {
      setQrDataUrl('');
      return;
    }

    setIsGenerating(true);
    // Build direct product link
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://adnutritionhubisrana.com';
    const productUrl = `${origin}/?product=${product.id}`;

    // Generate rich high-resolution QR code
    QRCode.toDataURL(productUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        setQrDataUrl(url);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
        setIsGenerating(false);
      });
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://adnutritionhubisrana.com';
  const productUrl = `${origin}/?product=${product.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `AD-Nutrition-${product.name.replace(/[^a-zA-Z0-9]/g, '-')}-QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AD Nutrition Hub - Shelf Tag: ${product.name}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 24px;
              color: #111;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 90vh;
            }
            .tag {
              border: 2px dashed #000;
              padding: 24px;
              width: 340px;
              text-align: center;
              border-radius: 12px;
            }
            .store {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #d97706;
              margin-bottom: 4px;
            }
            .location {
              font-size: 11px;
              color: #666;
              margin-bottom: 12px;
            }
            .qr-img {
              width: 220px;
              height: 220px;
              margin: 0 auto 12px;
              display: block;
            }
            .prod-name {
              font-size: 16px;
              font-weight: bold;
              line-height: 1.25;
              margin-bottom: 6px;
            }
            .meta {
              font-size: 12px;
              color: #444;
              margin-bottom: 8px;
            }
            .price {
              font-size: 24px;
              font-weight: 900;
              color: #111;
            }
            .instructions {
              font-size: 10px;
              color: #888;
              margin-top: 10px;
              border-top: 1px solid #ddd;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="tag">
            <div class="store">${STORE_INFO.name}</div>
            <div class="location">${STORE_INFO.location}</div>
            <img src="${qrDataUrl}" class="qr-img" alt="QR Code" />
            <div class="prod-name">${product.name}</div>
            <div class="meta">${product.brand || 'AD Nutrition'} • ${product.weightOrSize || product.category}</div>
            <div class="price">${formatPrice(product.price)}</div>
            <div class="instructions">Scan with phone camera to view lab reports, prices & order on WhatsApp</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="product-qr-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                Product QR Code
              </h3>
              <p className="text-xs text-neutral-400">Scan to quickly open product or add to inventory</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Display Card */}
        <div className="mt-5 flex flex-col items-center">
          <div className="relative p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-amber-500/20">
            {isGenerating || !qrDataUrl ? (
              <div className="w-56 h-56 flex items-center justify-center text-neutral-400 text-xs">
                Generating QR Code...
              </div>
            ) : (
              <img 
                src={qrDataUrl} 
                alt={`${product.name} QR Code`} 
                className="w-56 h-56 object-contain"
              />
            )}
            
            {/* Center AD Logo Badge overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-lg bg-neutral-950 border-2 border-amber-500 flex items-center justify-center shadow-lg">
                <span className="text-[11px] font-black text-amber-400 tracking-wider">AD</span>
              </div>
            </div>
          </div>

          {/* Product Summary */}
          <div className="mt-4 text-center space-y-1">
            <h4 className="text-sm font-bold text-white line-clamp-1">{product.name}</h4>
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
              <span className="text-amber-400 font-extrabold">{formatPrice(product.price)}</span>
              <span>•</span>
              <span>{product.brand || 'AD Nutrition Hub'}</span>
              {product.weightOrSize && (
                <>
                  <span>•</span>
                  <span>{product.weightOrSize}</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 pt-1">
              Store location: Mandi Mor, Israna, Panipat
            </p>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadQR}
            disabled={!qrDataUrl}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 text-neutral-200 border border-neutral-700 hover:border-amber-500/50 transition-colors text-xs font-semibold gap-1.5"
            title="Download PNG for printing or sharing"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 text-neutral-200 border border-neutral-700 hover:border-amber-500/50 transition-colors text-xs font-semibold gap-1.5"
            title="Copy share link"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!qrDataUrl}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 text-neutral-200 border border-neutral-700 hover:border-amber-500/50 transition-colors text-xs font-semibold gap-1.5"
            title="Print Shelf Tag Label"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Tag</span>
          </button>
        </div>

        {/* Tips Footer */}
        <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Use scanner camera to instantly open this product
          </span>
          <span className="text-neutral-400 font-mono">ID: {product.id.slice(-6)}</span>
        </div>
      </div>
    </div>
  );
};
