import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Camera, 
  X, 
  FlipHorizontal, 
  Zap, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  PlusCircle, 
  Edit, 
  Eye, 
  RefreshCw,
  QrCode,
  Barcode,
  Search,
  HelpCircle,
  ExternalLink,
  History,
  Clock,
  Trash2
} from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../services/productService';
import { triggerHaptic } from '../utils/haptics';

export interface RecentScanItem {
  id: string;
  code: string;
  timestamp: number;
  product: Product;
}

interface ProductScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddProductWithScannedData?: (data: Partial<Product>) => void;
  isAdmin?: boolean;
  inlineMode?: boolean; // When rendered directly inside the AdminPanel tab
}

// Audio chime using Web Audio API for zero-dependency instant feedback
function playScanChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // AudioContext blocked or unavailable
  }

  // Tactile haptic confirmation feedback
  triggerHaptic('success');
}

// Helper to format time ago for recent scans
function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Recently';
  const diff = Math.max(0, Date.now() - timestamp);
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / (1000 * 60 * 60 * 24));
  return `${days}d ago`;
}

export const ProductScannerModal: React.FC<ProductScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onAddProductWithScannedData,
  isAdmin = false,
  inlineMode = false
}) => {
  const scannerContainerId = 'product-qr-barcode-reader';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');

  // Recent scans state (stores up to 5 items)
  const [recentScans, setRecentScans] = useState<RecentScanItem[]>([]);

  // Load and hydrate recent scans from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ad_nutrition_recent_scans');
      if (raw) {
        const parsed: Array<{ id: string; code: string; timestamp: number; product?: Product }> = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Re-hydrate with fresh product state from products array
          const hydrated: RecentScanItem[] = parsed
            .map((item) => {
              const currentProd = products.find((p) => p.id === item.id) || item.product;
              return {
                id: item.id,
                code: item.code || item.id,
                timestamp: item.timestamp || Date.now(),
                product: currentProd as Product
              };
            })
            .filter((item) => Boolean(item.product));

          setRecentScans(hydrated.slice(0, 5));
          return;
        }
      }

      // If initial visit and no scans recorded yet, populate with first 2 products for immediate demonstration
      if (products.length > 0 && raw === null) {
        const initialDemo: RecentScanItem[] = products.slice(0, 2).map((prod, idx) => ({
          id: prod.id,
          code: prod.id,
          timestamp: Date.now() - (idx + 1) * 8 * 60 * 1000,
          product: prod
        }));
        setRecentScans(initialDemo);
        try {
          localStorage.setItem('ad_nutrition_recent_scans', JSON.stringify(initialDemo));
        } catch {}
      }
    } catch (err) {
      console.error('Error loading recent scans:', err);
    }
  }, [products]);

  // Record a product scan into recent scans (deduplicated, max 5)
  const recordRecentScan = (code: string, product: Product) => {
    if (!product || !product.id) return;
    setRecentScans((prev) => {
      const filtered = prev.filter((item) => item.product?.id !== product.id && item.id !== product.id);
      const newItem: RecentScanItem = {
        id: product.id,
        code,
        timestamp: Date.now(),
        product
      };
      const updated = [newItem, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('ad_nutrition_recent_scans', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearRecentScans = () => {
    triggerHaptic('light');
    setRecentScans([]);
    try {
      localStorage.setItem('ad_nutrition_recent_scans', JSON.stringify([]));
    } catch {}
  };

  const removeRecentScan = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    triggerHaptic('light');
    setRecentScans((prev) => {
      const updated = prev.filter((item) => item.id !== productId && item.product?.id !== productId);
      try {
        localStorage.setItem('ad_nutrition_recent_scans', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRevisitProduct = (product: Product) => {
    triggerHaptic('light');
    onSelectProduct(product);
    if (!inlineMode) {
      onClose();
    }
  };

  // Scanned state
  const [scannedResult, setScannedResult] = useState<{
    rawCode: string;
    matchedProduct: Product | null;
    isJsonData: boolean;
    jsonData?: Partial<Product>;
  } | null>(null);

  // Initialize and start scanner when opened
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScannedResult(null);
      setCameraError(null);
      return;
    }

    startScanner(facingMode);

    return () => {
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        // Clean shutdown
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  const startScanner = async (preferredFacingMode: 'environment' | 'user') => {
    setCameraError(null);
    await stopScanner();

    // Give DOM a frame to ensure target container exists
    setTimeout(async () => {
      const container = document.getElementById(scannerContainerId);
      if (!container) return;

      try {
        const scanner = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39
          ],
          verbose: false
        });

        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: preferredFacingMode },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdge * 0.75);
              return {
                width: qrboxSize,
                height: qrboxSize
              };
            },
            aspectRatio: 1.0
          },
          (decodedText) => {
            handleSuccessfulScan(decodedText);
          },
          () => {
            // Frame analyzed without a code
          }
        );

        setIsScanning(true);

        // Check if flashlight / torch is supported
        try {
          const streamTracks = (scanner as any).localMediaStream?.getVideoTracks?.();
          if (streamTracks && streamTracks[0]) {
            const capabilities = streamTracks[0].getCapabilities?.();
            if (capabilities && capabilities.torch) {
              setTorchSupported(true);
            }
          }
        } catch {}
      } catch (err: any) {
        console.warn('Camera scanner start warning:', err);
        const errMsg = err?.message || String(err);
        if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
          setCameraError('Camera access was denied. Please allow camera permissions in your browser or upload a photo/screenshot of the QR code.');
        } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
          setCameraError('No camera found on this device. You can upload an image or enter the code manually.');
        } else {
          setCameraError('Unable to open live camera. You can upload an image from your gallery or test with sample codes below.');
        }
        setIsScanning(false);
      }
    }, 150);
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const nextTorch = !torchOn;
      await (html5QrCodeRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle not supported:', e);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Process decoded string
  const handleSuccessfulScan = (rawText: string) => {
    playScanChime();
    const cleanText = rawText.trim();

    // Check 1: JSON payload (e.g. exported product or structured QR)
    let parsedJson: Partial<Product> | null = null;
    if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
      try {
        const obj = JSON.parse(cleanText);
        if (obj.name || obj.price || obj.brand) {
          parsedJson = obj;
        }
      } catch {}
    }

    // Check 2: Direct match by Product ID or URL with ?product= or ?id=
    let matched: Product | null = null;

    // Direct ID check
    matched = products.find((p) => p.id === cleanText) || null;

    // URL parameter check
    if (!matched && (cleanText.includes('product=') || cleanText.includes('id='))) {
      try {
        const url = new URL(cleanText.startsWith('http') ? cleanText : `https://example.com/${cleanText}`);
        const prodId = url.searchParams.get('product') || url.searchParams.get('id');
        if (prodId) {
          matched = products.find((p) => p.id === prodId) || null;
        }
      } catch {}
    }

    // Barcode / SKU / Description / Name match check
    if (!matched) {
      matched = products.find(
        (p) =>
          p.name.toLowerCase() === cleanText.toLowerCase() ||
          p.description?.includes(cleanText) ||
          p.id.toLowerCase().includes(cleanText.toLowerCase())
      ) || null;
    }

    if (matched) {
      recordRecentScan(cleanText, matched);
    }

    setScannedResult({
      rawCode: cleanText,
      matchedProduct: matched,
      isJsonData: Boolean(parsedJson),
      jsonData: parsedJson || undefined
    });
  };

  // File upload scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let scanner = html5QrCodeRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.CODE_128
          ],
          verbose: false
        });
        html5QrCodeRef.current = scanner;
      }

      const decodedText = await scanner.scanFile(file, true);
      handleSuccessfulScan(decodedText);
    } catch (err: any) {
      setCameraError('No readable QR code or barcode found in this image. Please try a clearer picture.');
    }
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleSuccessfulScan(manualCodeInput.trim());
    setManualCodeInput('');
  };

  const resetScan = () => {
    setScannedResult(null);
    setCameraError(null);
    if (!isScanning) {
      startScanner(facingMode);
    }
  };

  // Sample quick tests for instant testing in sandboxes
  const testSampleProductQR = () => {
    const target = products[0];
    if (target) {
      handleSuccessfulScan(`https://adnutritionhubisrana.com/?product=${target.id}`);
    } else {
      handleSuccessfulScan('prod-1789900789150-ze2f');
    }
  };

  const testSampleNewBarcode = () => {
    handleSuccessfulScan('8906067029812');
  };

  const testSampleJsonProduct = () => {
    handleSuccessfulScan(
      JSON.stringify({
        name: 'Optimum Nutrition Gold Standard Whey 2kg',
        price: 6499,
        originalPrice: 7299,
        category: 'Whey Protein',
        brand: 'Optimum Nutrition',
        weightOrSize: '2 kg (4.4 lbs)',
        flavour: 'Double Rich Chocolate',
        description: '100% Whey Protein Isolate & Concentrate blend for peak muscle recovery and lean gains.'
      })
    );
  };

  const content = (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Product Scanner</span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Camera Live
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Scan product QR codes or package barcodes to open or add to inventory
            </p>
          </div>
        </div>

        {!inlineMode && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Scanner Body */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* Scanned Result Card View */}
        {scannedResult ? (
          <div className="p-5 rounded-2xl bg-neutral-950 border border-amber-500/40 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Code Scanned Successfully!</span>
            </div>

            {/* Matched Product in Store */}
            {scannedResult.matchedProduct ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <img
                    src={scannedResult.matchedProduct.imageUrl}
                    alt={scannedResult.matchedProduct.name}
                    className="w-18 h-18 object-cover rounded-lg border border-neutral-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {scannedResult.matchedProduct.category}
                    </span>
                    <h4 className="text-sm font-bold text-white line-clamp-1">
                      {scannedResult.matchedProduct.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                      <span className="text-base font-extrabold text-amber-400">
                        {formatPrice(scannedResult.matchedProduct.price)}
                      </span>
                      <span>•</span>
                      <span
                        className={`font-semibold ${
                          scannedResult.matchedProduct.availability === 'In Stock'
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {scannedResult.matchedProduct.availability}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      onSelectProduct(scannedResult.matchedProduct!);
                      if (!inlineMode) onClose();
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm shadow-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Product Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      resetScan();
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs sm:text-sm transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Scan Another</span>
                  </button>
                </div>
              </div>
            ) : scannedResult.isJsonData && scannedResult.jsonData ? (
              /* JSON Product payload detected */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Product Data Package Detected
                  </span>
                  <p className="text-sm font-bold text-white">
                    {scannedResult.jsonData.name || 'New Supplement Product'}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Brand: <strong className="text-white">{scannedResult.jsonData.brand || 'AD Nutrition'}</strong> • Price: <strong className="text-amber-400">{scannedResult.jsonData.price ? formatPrice(scannedResult.jsonData.price) : 'N/A'}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      if (onAddProductWithScannedData) {
                        onAddProductWithScannedData(scannedResult.jsonData!);
                      }
                      if (!inlineMode) onClose();
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm shadow-lg transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add to Inventory</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      resetScan();
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs sm:text-sm transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Scan Another</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Unmatched Barcode / Code - Perfect for adding new product */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Barcode className="w-4 h-4" />
                      New Product Barcode Scanned
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono bg-neutral-800 px-2 py-0.5 rounded">
                      {scannedResult.rawCode.length > 24 ? `${scannedResult.rawCode.slice(0, 24)}...` : scannedResult.rawCode}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    This barcode was not found in your current product catalog. You can immediately add it as a new product in your inventory with this barcode linked.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      if (onAddProductWithScannedData) {
                        onAddProductWithScannedData({
                          description: `Barcode: ${scannedResult.rawCode}`,
                          brand: 'AD Nutrition Hub'
                        });
                      }
                      if (!inlineMode) onClose();
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm shadow-lg transition-colors"
                    id="scanner-add-new-product-btn"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add as New Product</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      resetScan();
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs sm:text-sm transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Scan Another</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Live Camera Viewport */
          <div className="space-y-3">
            <div className="relative w-full aspect-square max-h-[340px] sm:max-h-[380px] mx-auto bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center shadow-inner">
              {/* HTML5 QR Code Mount Element */}
              <div id={scannerContainerId} className="w-full h-full object-cover" />

              {/* Viewfinder Overlay Laser & Corner Frame (when active) */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                  {/* Square target box */}
                  <div className="relative w-60 h-60 border-2 border-amber-500/50 rounded-2xl">
                    {/* Top Left Corner */}
                    <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
                    {/* Top Right Corner */}
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
                    {/* Bottom Left Corner */}
                    <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
                    {/* Bottom Right Corner */}
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

                    {/* Animated Laser Scanning Line */}
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-bounce opacity-80" />

                    {/* Center crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
                    </div>
                  </div>
                </div>
              )}

              {/* Camera Error Message */}
              {cameraError && (
                <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-neutral-300 max-w-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => startScanner(facingMode)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors"
                  >
                    Retry Camera
                  </button>
                </div>
              )}

              {/* Camera Controls Overlay Bar */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-20">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-900 text-neutral-200 border border-neutral-700/80 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 shadow-md"
                  title="Switch Front/Rear Camera"
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>{facingMode === 'environment' ? 'Back Camera' : 'Front Camera'}</span>
                </button>

                {torchSupported && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2 rounded-xl border backdrop-blur-md transition-colors ${
                      torchOn
                        ? 'bg-amber-500 text-neutral-950 border-amber-400'
                        : 'bg-neutral-900/80 text-neutral-300 border-neutral-700 hover:text-white'
                    }`}
                    title="Toggle Flashlight / Torch"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-900 text-neutral-200 border border-neutral-700/80 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 shadow-md"
                  title="Upload image or screenshot"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload Image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            <p className="text-center text-xs text-neutral-400">
              Point your camera at any supplement QR code or barcode to instantly open or add it.
            </p>
          </div>
        )}

        {/* Recent Scans Section (Last 5 Products) */}
        <div id="scanner-recent-scans-section" className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Recent Scans</span>
                  {recentScans.length > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {recentScans.length} / 5
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Quickly revisit your last 5 scanned products without rescanning
                </p>
              </div>
            </div>

            {recentScans.length > 0 && (
              <button
                type="button"
                onClick={clearRecentScans}
                className="text-[11px] font-semibold text-neutral-400 hover:text-red-400 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors"
                title="Clear recent scan history"
                id="scanner-clear-recent-scans-btn"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {recentScans.length === 0 ? (
            <div className="py-6 px-4 rounded-xl border border-dashed border-neutral-800/80 bg-neutral-900/30 text-center flex flex-col items-center justify-center gap-1.5">
              <Clock className="w-5 h-5 text-neutral-600 mb-1" />
              <p className="text-xs font-semibold text-neutral-300">No products scanned yet</p>
              <p className="text-[11px] text-neutral-500 max-w-xs">
                Scan any supplement QR or packaging barcode above to quickly access it here without rescanning.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentScans.map((item, index) => (
                <div
                  key={`${item.id}-${item.timestamp}-${index}`}
                  id={`recent-scan-${item.id}`}
                  onClick={() => handleRevisitProduct(item.product)}
                  className="group relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 transition-all duration-200 cursor-pointer shadow-sm"
                  title="Click to revisit product details"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                    <div className="relative shrink-0">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-lg object-cover bg-neutral-950 border border-neutral-800 group-hover:border-amber-500/40"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-neutral-800 border border-neutral-700 text-[9px] font-bold text-neutral-300 flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {item.product.category}
                        </span>
                        <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>
                      <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {item.product.name}
                      </h5>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="font-extrabold text-amber-400">
                          {formatPrice(item.product.price)}
                        </span>
                        <span className="text-neutral-500">•</span>
                        <span className={`text-[11px] font-medium ${item.product.availability === 'In Stock' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.product.availability}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      id={`recent-scan-revisit-${item.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevisitProduct(item.product);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-neutral-950 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                      title="Revisit product details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Revisit</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => removeRecentScan(e, item.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                      title="Remove from recent scans"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Code Input Bar */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
          <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
            <Barcode className="w-4 h-4 text-amber-400" />
            <span>Or Enter Product Code / Barcode Manually</span>
          </label>
          <form onSubmit={handleManualCodeSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. prod-1789900789150-ze2f or 8906067021234"
              value={manualCodeInput}
              onChange={(e) => setManualCodeInput(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!manualCodeInput.trim()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs transition-colors shrink-0"
            >
              Lookup
            </button>
          </form>
        </div>

        {/* Sandbox Quick Test Triggers */}
        <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              Quick Scanner Test Samples (Instant simulation)
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={testSampleProductQR}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold flex items-center gap-1 transition-colors border border-neutral-700"
            >
              <QrCode className="w-3 h-3 text-amber-400" />
              <span>Existing Product QR</span>
            </button>

            <button
              type="button"
              onClick={testSampleNewBarcode}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold flex items-center gap-1 transition-colors border border-neutral-700"
            >
              <Barcode className="w-3 h-3 text-emerald-400" />
              <span>New EAN-13 Barcode</span>
            </button>

            <button
              type="button"
              onClick={testSampleJsonProduct}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold flex items-center gap-1 transition-colors border border-neutral-700"
            >
              <Package className="w-3 h-3 text-yellow-400" />
              <span>Full Product Data QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (inlineMode) {
    return (
      <div className="p-4 sm:p-6 bg-neutral-900/90 rounded-2xl border border-neutral-800 h-full">
        {content}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="product-scanner-modal"
      >
        {content}
      </div>
    </div>
  );
};
