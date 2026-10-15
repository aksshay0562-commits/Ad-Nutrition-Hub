import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Upload, 
  Link as LinkIcon, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Save, 
  Database, 
  RefreshCw, 
  AlertCircle,
  Eye,
  Image as ImageIcon,
  Youtube,
  Camera,
  QrCode,
  Scan,
  BarChart3,
  TrendingUp,
  Trophy,
  Flame,
  Clock,
  Activity,
  Star,
  Layers,
  Plus,
  Globe,
  ExternalLink,
  MapPin,
  Search,
  Sparkles,
  Share2,
  Check
} from 'lucide-react';
import { Product, CATEGORIES, CategoryType } from '../types';
import { formatPrice, getYoutubeVideoId } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { ProductScannerModal } from './ProductScannerModal';
import { ProductQRModal } from './ProductQRModal';
import { triggerHaptic } from '../utils/haptics';
import { 
  getScanAnalytics, 
  clearScanAnalytics, 
  SCAN_ANALYTICS_EVENT, 
  ScanAnalyticsData, 
  ProductScanStat,
  seedInitialScanAnalyticsIfEmpty 
} from '../services/scanAnalyticsService';
import { SiteVisitStats } from '../services/visitService';
import { 
  getActiveStoreConfig, 
  saveActiveStoreConfig, 
  resetActiveStoreConfig, 
  GoogleSiteConfig 
} from '../services/storeConfigService';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLogin: (pin: string) => boolean;
  onLogout: () => void;
  products: Product[];
  onAddProduct: (data: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onResetDefaults: () => Promise<void>;
  editingProduct: Product | null;
  setEditingProduct: (product: Product | null) => void;
  onViewProductDetails?: (product: Product) => void;
  visitStats?: SiteVisitStats;
  onOpenVisitStats?: () => void;
}

// Preset supplement images for quick 1-click selection if user does not have a photo ready
const SUPPLEMENT_IMAGE_PRESETS = [
  { label: 'Whey Protein Jar', url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Mass Gainer Bucket', url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Creatine Tub', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80' },
  { label: 'Pre-Workout Blast', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80' },
  { label: 'Capsules Bottle', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80' },
  { label: 'Fish Oil Softgels', url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80' },
  { label: 'Gym Shaker Bottle', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80' },
];

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

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onLogin,
  onLogout,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onResetDefaults,
  editingProduct,
  setEditingProduct,
  onViewProductDetails,
  visitStats,
  onOpenVisitStats
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'scan' | 'analytics' | 'manage' | 'backup' | 'google-site'>('form');
  const [selectedQRProduct, setSelectedQRProduct] = useState<Product | null>(null);
  const { signInWithGoogle, authError } = useAuth();
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google Site & SEO Settings State
  const [googleConfig, setGoogleConfig] = useState<GoogleSiteConfig>(() => getActiveStoreConfig());
  const [googleSiteSaved, setGoogleSiteSaved] = useState(false);
  const [googlePreviewDevice, setGooglePreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  // Scan Analytics State
  const [scanAnalytics, setScanAnalytics] = useState<ScanAnalyticsData>(() => getScanAnalytics());
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');
  const [confirmResetAnalytics, setConfirmResetAnalytics] = useState(false);

  // Sync analytics data and listen for live scan updates
  React.useEffect(() => {
    if (products.length > 0) {
      seedInitialScanAnalyticsIfEmpty(products);
    }
    setScanAnalytics(getScanAnalytics());

    const handleUpdate = () => {
      setScanAnalytics(getScanAnalytics());
    };

    window.addEventListener(SCAN_ANALYTICS_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(SCAN_ANALYTICS_EVENT, handleUpdate);
    };
  }, [products, isOpen]);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Whey Protein');
  const [customCategory, setCustomCategory] = useState('');
  const [price, setPrice] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [availability, setAvailability] = useState<'In Stock' | 'Out of Stock'>('In Stock');
  const [weightOrSize, setWeightOrSize] = useState('');
  const [flavour, setFlavour] = useState('');
  const [brand, setBrand] = useState('AD Nutrition Hub');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [extraImageUrl, setExtraImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [featured, setFeatured] = useState(false);

  // Handler for data received from QR code or barcode scanner
  const handleScannedDataForForm = (scannedData: Partial<Product>) => {
    triggerHaptic('success');
    if (scannedData.name) setName(scannedData.name);
    if (scannedData.price) setPrice(String(scannedData.price));
    if (scannedData.originalPrice) setOriginalPrice(String(scannedData.originalPrice));
    if (scannedData.brand) setBrand(scannedData.brand);
    if (scannedData.weightOrSize) setWeightOrSize(scannedData.weightOrSize);
    if (scannedData.flavour) setFlavour(scannedData.flavour);
    if (scannedData.imageUrl) {
      setImageUrl(scannedData.imageUrl);
      setGalleryImages([scannedData.imageUrl]);
    }
    if ((scannedData as any).images && Array.isArray((scannedData as any).images)) {
      setGalleryImages((scannedData as any).images);
    }
    if (scannedData.youtubeUrl) setYoutubeUrl(scannedData.youtubeUrl);
    if (scannedData.description) {
      setDescription((prev) => prev ? `${prev}\n${scannedData.description}` : (scannedData.description || ''));
    }
    if (scannedData.category) {
      if (CATEGORIES.includes(scannedData.category as any)) {
        setCategory(scannedData.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(scannedData.category);
      }
    }
    setFeedbackMessage({
      type: 'success',
      text: 'Scanned details filled into product form! Verify and click Save.'
    });
    setActiveTab('form');
  };

  // Sync with editingProduct when it changes
  React.useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      if (CATEGORIES.includes(editingProduct.category as any)) {
        setCategory(editingProduct.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(editingProduct.category);
      }
      setPrice(String(editingProduct.price));
      setOriginalPrice(editingProduct.originalPrice ? String(editingProduct.originalPrice) : '');
      setAvailability(editingProduct.availability);
      setWeightOrSize(editingProduct.weightOrSize || '');
      setFlavour(editingProduct.flavour || '');
      setBrand(editingProduct.brand || 'AD Nutrition Hub');
      setDescription(editingProduct.description || '');
      setImageUrl(editingProduct.imageUrl || '');
      const initialGallery = editingProduct.images && editingProduct.images.length > 0
        ? editingProduct.images
        : (editingProduct.imageUrl ? [editingProduct.imageUrl] : []);
      setGalleryImages(initialGallery);
      setYoutubeUrl(editingProduct.youtubeUrl || '');
      setFeatured(Boolean(editingProduct.featured));
      setActiveTab('form');
    } else {
      resetForm();
    }
  }, [editingProduct]);

  const resetForm = () => {
    setName('');
    setCategory('Whey Protein');
    setCustomCategory('');
    setPrice('');
    setOriginalPrice('');
    setAvailability('In Stock');
    setWeightOrSize('');
    setFlavour('');
    setBrand('AD Nutrition Hub');
    setDescription('');
    setImageUrl('');
    setGalleryImages([]);
    setExtraImageUrl('');
    setYoutubeUrl('');
    setFeatured(false);
    setEditingProduct(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(pinInput.trim());
    if (success) {
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  // Multiple / Single image file upload handler (compresses files and supports 2 or more images)
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingImages(true);
    triggerHaptic('light');

    const newCompressed: string[] = [];
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" is too large! Please choose an image under 25MB.`);
        continue;
      }

      try {
        const compressed = await compressImage(file, 800, 800, 0.75);
        newCompressed.push(compressed);
      } catch (err) {
        console.warn('Image compression fallback:', err);
        try {
          const fallbackData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          newCompressed.push(fallbackData);
        } catch {
          // ignore
        }
      }
    }

    if (newCompressed.length > 0) {
      setGalleryImages((prev) => {
        const updated = [...prev, ...newCompressed].slice(0, 10);
        return updated;
      });

      // If imageUrl is empty, or not in list, set primary to first
      setImageUrl((current) => current || newCompressed[0]);
      triggerHaptic('success');
      setFeedbackMessage({
        type: 'success',
        text: `${newCompressed.length} photo(s) uploaded successfully! (Total: ${galleryImages.length + newCompressed.length} photos)`
      });
    }

    setIsUploadingImages(false);
    e.target.value = '';
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    triggerHaptic('light');
    const removedUrl = galleryImages[indexToRemove];
    const updated = galleryImages.filter((_, idx) => idx !== indexToRemove);
    setGalleryImages(updated);
    if (imageUrl === removedUrl) {
      setImageUrl(updated[0] || '');
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    triggerHaptic('medium');
    const selected = galleryImages[index];
    if (!selected) return;
    const reordered = [selected, ...galleryImages.filter((_, idx) => idx !== index)];
    setGalleryImages(reordered);
    setImageUrl(selected);
    setFeedbackMessage({
      type: 'success',
      text: 'Main Cover Photo updated!'
    });
  };

  const handleAddUrlToGallery = () => {
    const trimmed = extraImageUrl.trim();
    if (!trimmed) return;
    triggerHaptic('light');
    setGalleryImages((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed].slice(0, 10);
    });
    if (!imageUrl) {
      setImageUrl(trimmed);
    }
    setExtraImageUrl('');
  };

  const handleAddPresetToGallery = (presetUrl: string) => {
    triggerHaptic('light');
    setGalleryImages((prev) => {
      if (prev.includes(presetUrl)) return prev;
      return [...prev, presetUrl].slice(0, 10);
    });
    if (!imageUrl) {
      setImageUrl(presetUrl);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a product name');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      alert('Please enter a valid price in ₹');
      return;
    }

    const finalCategory = category === 'Other' ? (customCategory.trim() || 'Supplements') : category;
    
    // Process gallery images and cover photo
    let processedGallery = [...galleryImages];
    if (imageUrl.trim() && !processedGallery.includes(imageUrl.trim())) {
      processedGallery.unshift(imageUrl.trim());
    }

    let finalImageUrl = imageUrl.trim() || processedGallery[0] || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80';

    if (finalImageUrl.startsWith('data:image')) {
      try {
        finalImageUrl = await compressImage(finalImageUrl, 800, 800, 0.75);
      } catch (compErr) {
        console.warn('AdminPanel pre-submit image compression failed:', compErr);
      }
    }

    const finalImages = processedGallery.length > 0 ? processedGallery : [finalImageUrl];

    setIsSubmitting(true);
    try {
      const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
      const cleanWeight = weightOrSize.trim();
      const cleanFlavour = flavour.trim();

      const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (editingProduct) {
        const existingHistory = editingProduct.priceHistory || [];
        // If price has changed, append new history point
        const updatedPriceHistory = editingProduct.price !== numPrice
          ? [...existingHistory, { date: currentMonthYear, price: numPrice }]
          : existingHistory;

        await onUpdateProduct(editingProduct.id, {
          name: name.trim(),
          category: finalCategory,
          price: numPrice,
          availability,
          brand: brand.trim() || 'AD Nutrition Hub',
          description: description.trim(),
          imageUrl: finalImageUrl,
          images: finalImages,
          featured,
          youtubeUrl: youtubeUrl.trim() || undefined,
          priceHistory: updatedPriceHistory.length > 0 ? updatedPriceHistory : undefined,
          ...(parsedOriginalPrice && !isNaN(parsedOriginalPrice) ? { originalPrice: parsedOriginalPrice } : {}),
          ...(cleanWeight ? { weightOrSize: cleanWeight } : {}),
          ...(cleanFlavour ? { flavour: cleanFlavour } : {})
        });
        setFeedbackMessage({ type: 'success', text: `Product "${name}" updated and saved permanently to server!` });
      } else {
        const initialPriceHistory = [
          ...(parsedOriginalPrice && !isNaN(parsedOriginalPrice) ? [{ date: 'Launch', price: parsedOriginalPrice }] : []),
          { date: currentMonthYear, price: numPrice }
        ];

        await onAddProduct({
          name: name.trim(),
          category: finalCategory,
          price: numPrice,
          availability,
          brand: brand.trim() || 'AD Nutrition Hub',
          description: description.trim(),
          imageUrl: finalImageUrl,
          images: finalImages,
          featured,
          youtubeUrl: youtubeUrl.trim() || undefined,
          priceHistory: initialPriceHistory,
          ...(parsedOriginalPrice && !isNaN(parsedOriginalPrice) ? { originalPrice: parsedOriginalPrice } : {}),
          ...(cleanWeight ? { weightOrSize: cleanWeight } : {}),
          ...(cleanFlavour ? { flavour: cleanFlavour } : {})
        });
        setFeedbackMessage({ type: 'success', text: `New product "${name}" added and saved permanently to database!` });
      }

      resetForm();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to save product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      id="admin-panel-backdrop"
    >
      <div 
        className="relative w-full max-w-4xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        id="admin-panel-container"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>Owner & Admin Portal</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  AD Nutrition Hub Israna
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Permanent Database Sync • Products update live for all website visitors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={onLogout}
                className="text-xs px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                id="admin-logout-btn"
              >
                Logout
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              id="admin-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Database Status Banner */}
        <div className="px-5 py-2.5 bg-amber-950/30 border-b border-amber-900/40 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Firebase Firestore Active:</strong> Live cloud inventory synced on project <code className="bg-amber-900/40 px-1 py-0.5 rounded font-mono text-[11px]">united-data-x3t6m</code> (asia-southeast1).
            </span>
          </div>
          <span className="hidden sm:inline-block font-semibold text-amber-400">
            {products.length} Products in Catalog
          </span>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div 
            className={`px-5 py-3 flex items-center gap-2 text-xs font-semibold border-b ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/15 border-red-500/30 text-red-300'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Not Logged In: PIN Challenge Screen */}
        {!isAdmin ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800/80 border border-neutral-700 mx-auto flex items-center justify-center text-amber-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Owner / Admin Access</h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Authenticate with Google or enter shop passcode to manage supplements.
              </p>
            </div>

            <div className="space-y-4">
              {/* Contextual notice if Google popup is restricted by browser / iframe sandbox */}
              {authError && (
                <div 
                  className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs text-left flex items-start gap-2.5 animate-in fade-in"
                  id="admin-auth-error-notice"
                >
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{authError}</p>
                    <p className="text-[11px] text-neutral-400">
                      You can instantly unlock owner mode using the <strong>Owner PIN (1234)</strong> below without needing a Google popup.
                    </p>
                  </div>
                </div>
              )}

              {/* Google Sign In option */}
              <button
                type="button"
                onClick={async () => {
                  await signInWithGoogle();
                }}
                className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow transition-colors"
                id="admin-google-login-btn"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>Sign in with Google (Firebase)</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-neutral-800" />
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-bold">Or enter PIN</span>
                <div className="flex-1 h-px bg-neutral-800" />
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    placeholder="Enter PIN (Default: 1234)"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(false);
                    }}
                    className="w-full text-center tracking-widest text-lg px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:border-amber-500 font-mono"
                    id="admin-pin-input"
                    autoFocus
                  />
                  {pinError && (
                    <p className="text-xs text-red-400 mt-1.5">
                      Incorrect PIN. Try <strong>1234</strong> or <strong>70159</strong>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-md transition-colors"
                    id="admin-pin-submit-btn"
                  >
                    Unlock with PIN
                  </button>

                  {/* Instant Demo Access Button */}
                  <button
                    type="button"
                    onClick={() => onLogin('1234')}
                    className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors"
                    id="admin-quick-unlock-btn"
                  >
                    Quick Unlock (Owner Test PIN: 1234)
                  </button>
                </div>
              </form>
            </div>

            <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
              Owner Contact: +91 70159 59517 • Mandi Mor, Israna
            </div>
          </div>
        ) : (
          /* Logged In Content */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-neutral-800 bg-neutral-950/40">
              <button
                onClick={() => {
                  setActiveTab('form');
                  if (!editingProduct) resetForm();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
                  activeTab === 'form'
                    ? 'border-amber-500 text-amber-400 bg-neutral-800/40'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
                id="admin-tab-add-product"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{editingProduct ? 'Edit Product' : 'Add New Product'}</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('scan');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
                  activeTab === 'scan'
                    ? 'border-amber-500 text-amber-400 bg-neutral-800/40'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
                id="admin-tab-scan-product"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Scan Product</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('analytics');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
                  activeTab === 'analytics'
                    ? 'border-amber-500 text-amber-400 bg-neutral-800/40'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
                id="admin-tab-scan-analytics"
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Scan Analytics</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  {scanAnalytics.totalScans}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('manage')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
                  activeTab === 'manage'
                    ? 'border-amber-500 text-amber-400 bg-neutral-800/40'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
                id="admin-tab-manage-products"
              >
                <span>Manage All Products</span>
                <span className="px-1.5 py-0.5 rounded-full bg-neutral-800 text-[10px] font-bold text-neutral-300">
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
                  activeTab === 'backup'
                    ? 'border-amber-500 text-amber-400 bg-neutral-800/40'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
                id="admin-tab-backup"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Backup & Reset</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('google-site');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
                  activeTab === 'google-site'
                    ? 'border-amber-500 text-amber-400 bg-neutral-800/40'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
                id="admin-tab-google-site"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Site & SEO</span>
              </button>
            </div>

            {/* Tab 1: Add or Edit Form */}
            {activeTab === 'form' && (
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                {/* Fast Scan Shortcut Banner inside Form */}
                <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-amber-500/30 gap-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-300">
                    <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Have a supplement bottle or package barcode?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveTab('scan');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors"
                    id="admin-btn-scan-to-fill"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan with Camera to Auto-fill</span>
                  </button>
                </div>

                {editingProduct && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    <span>Currently editing: <strong>{editingProduct.name}</strong></span>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-neutral-400 hover:text-white underline"
                    >
                      Cancel & Create New Instead
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Name */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                      <span>Product Name *</span>
                      <span className="text-neutral-400 text-[11px]">e.g. Hyper Whey Protein – 2kg</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter product title..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500"
                      id="form-product-name"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500"
                      id="form-product-category"
                    >
                      {CATEGORIES.filter(c => c !== 'All').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="Other">+ Custom / Other Category</option>
                    </select>
                    {category === 'Other' && (
                      <input
                        type="text"
                        placeholder="Enter custom category name..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full mt-2 px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs"
                      />
                    )}
                  </div>

                  {/* Brand */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Brand / Manufacturer</label>
                    <input
                      type="text"
                      placeholder="e.g. Hyper Nutrition, AD Nutrition"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500"
                      id="form-product-brand"
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="e.g. 3800"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500 font-semibold"
                      id="form-product-price"
                    />
                  </div>

                  {/* MRP / Original Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Original MRP (₹) (Optional for Discount)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 4600"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500"
                      id="form-product-mrp"
                    />
                  </div>

                  {/* Size / Weight / Servings */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Weight / Size / Servings</label>
                    <input
                      type="text"
                      placeholder="e.g. 2kg, 5kg, 300g, 60 Capsules"
                      value={weightOrSize}
                      onChange={(e) => setWeightOrSize(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500"
                      id="form-product-weight"
                    />
                  </div>

                  {/* Flavour */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Flavour (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Rich Chocolate, Lemon Flavour"
                      value={flavour}
                      onChange={(e) => setFlavour(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500"
                      id="form-product-flavour"
                    />
                  </div>

                  {/* Availability */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Stock Availability</label>
                    <div className="flex gap-3 pt-1">
                      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-200 cursor-pointer">
                        <input
                          type="radio"
                          name="availability"
                          value="In Stock"
                          checked={availability === 'In Stock'}
                          onChange={() => setAvailability('In Stock')}
                          className="accent-emerald-500"
                        />
                        <span className="text-emerald-400">🟢 In Stock</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-200 cursor-pointer">
                        <input
                          type="radio"
                          name="availability"
                          value="Out of Stock"
                          checked={availability === 'Out of Stock'}
                          onChange={() => setAvailability('Out of Stock')}
                          className="accent-red-500"
                        />
                        <span className="text-red-400">🔴 Out of Stock</span>
                      </label>
                    </div>
                  </div>

                  {/* Featured Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">Homepage Spotlight</label>
                    <div className="pt-1">
                      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featured}
                          onChange={(e) => setFeatured(e.target.checked)}
                          className="accent-amber-500 w-4 h-4"
                        />
                        <span>Feature on Homepage Spotlight</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">Product Description & Key Highlights</label>
                  <textarea
                    rows={3}
                    placeholder="High-protein supplement for customers following a workout routine..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500"
                    id="form-product-desc"
                  />
                </div>

                {/* YouTube Video Review / Guide Link */}
                <div className="space-y-2 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-red-600/20 text-red-500 flex items-center justify-center">
                        <Youtube className="w-3.5 h-3.5" />
                      </div>
                      <span>YouTube Video Review or Guide Link (Optional)</span>
                    </label>
                    {youtubeUrl && getYoutubeVideoId(youtubeUrl) && (
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Valid Video ID: {getYoutubeVideoId(youtubeUrl)}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <div className="absolute left-3.5 top-3 text-red-500 pointer-events-none">
                      <Youtube className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                      id="form-product-youtube"
                    />
                  </div>

                  {youtubeUrl && getYoutubeVideoId(youtubeUrl) && (
                    <div className="flex items-center gap-3 pt-1">
                      <img 
                        src={`https://img.youtube.com/vi/${getYoutubeVideoId(youtubeUrl)}/mqdefault.jpg`} 
                        alt="YouTube Thumbnail Preview" 
                        className="w-20 h-12 object-cover rounded-lg border border-neutral-700 shrink-0" 
                      />
                      <div className="text-xs text-neutral-300">
                        <p className="font-semibold text-white">Video detected successfully!</p>
                        <p className="text-[11px] text-neutral-400">Shoppers will be able to watch this video review directly inside the product details modal.</p>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-neutral-500">
                    Paste any YouTube video link (supplement review, lab test, unboxing, or workout dosage guide).
                  </p>
                </div>

                {/* Product Image Section: Upload 2 or More Photos (Multi-Image Gallery) */}
                <div className="space-y-3.5 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800" id="admin-product-photos-gallery-section">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Product Photos (Upload 2 ya use jyada Photos)</span>
                          {galleryImages.length >= 2 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{galleryImages.length} Photos (Gallery Ready)</span>
                            </span>
                          ) : galleryImages.length === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80">
                              <span>1 Photo (Add 1+ more for 2+ photos)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-400">0 Photos selected</span>
                          )}
                        </label>
                        <p className="text-[11px] text-neutral-400">
                          Upload 2 or more images: Front cover photo, Nutrition facts label, Scoop/texture, and Authenticity seal.
                        </p>
                      </div>
                    </div>

                    {galleryImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setGalleryImages([]);
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear All ({galleryImages.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Processing / Uploading Indicator */}
                  {isUploadingImages && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Compressing & optimizing photos for instant mobile loading...</span>
                    </div>
                  )}

                  {/* Gallery Thumbnails Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Photo Gallery ({galleryImages.length} selected - First photo is Main Cover)</span>
                      {galleryImages.length > 1 && (
                        <span className="text-amber-400 font-medium">★ Click "Make Cover" to change main photo</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {galleryImages.map((imgSrc, idx) => {
                        const isMainCover = idx === 0 || imgSrc === imageUrl;
                        return (
                          <div
                            key={`${imgSrc.slice(0, 32)}-${idx}`}
                            className={`group relative rounded-xl overflow-hidden aspect-square bg-neutral-900 border transition-all ${
                              isMainCover
                                ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-md shadow-amber-500/10'
                                : 'border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            <img
                              src={imgSrc}
                              alt={`Product Photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Badge */}
                            <div className="absolute top-1.5 left-1.5 pointer-events-none">
                              {isMainCover ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950 text-[9.5px] font-black uppercase tracking-wider shadow">
                                  <Star className="w-2.5 h-2.5 fill-neutral-950" />
                                  <span>Cover</span>
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-neutral-950/80 backdrop-blur-sm text-neutral-300 text-[9.5px] font-bold border border-neutral-700/60">
                                  Photo #{idx + 1}
                                </span>
                              )}
                            </div>

                            {/* Card Hover Action Bar */}
                            <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent flex items-center justify-between gap-1">
                              {!isMainCover && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(idx)}
                                  className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 transition-colors"
                                  title="Set as Main Cover Photo"
                                >
                                  Make Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryImage(idx)}
                                className="p-1 rounded bg-neutral-800/90 hover:bg-red-600 text-neutral-400 hover:text-white transition-colors ml-auto"
                                title="Remove this photo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add More Photos Card in Grid */}
                      <label
                        className="cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-neutral-800 hover:border-amber-500/60 bg-neutral-900/50 hover:bg-neutral-900 text-neutral-400 hover:text-amber-400 transition-all aspect-square text-center group"
                        title="Upload 2 or more photos"
                      >
                        <div className="w-8 h-8 rounded-full bg-neutral-800 group-hover:bg-amber-500/20 flex items-center justify-center mb-1.5 transition-colors">
                          <Plus className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-xs font-bold text-neutral-200 group-hover:text-amber-300">
                          + Add Photos
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          Select 2+ files
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                          id="form-multi-image-file-input-grid"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Upload Controls & URL Input */}
                  <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                    {/* Method 1: Multi-file picker button */}
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black transition-all shadow-md shadow-amber-500/10">
                        <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Upload 2+ Photos (Select Multiple)</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                          id="form-multi-image-file-input"
                        />
                      </label>
                      <span className="text-xs text-neutral-400">
                        Supports JPEG, PNG, WEBP (auto-compressed under 150KB)
                      </span>
                    </div>

                    {/* Method 2: Add Image URL to Gallery */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          placeholder="Or paste an image URL (https://...) to add to gallery"
                          value={extraImageUrl}
                          onChange={(e) => setExtraImageUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddUrlToGallery();
                            }
                          }}
                          className="w-full pl-8 pr-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                          id="form-extra-image-url-input"
                        />
                        <LinkIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddUrlToGallery}
                        disabled={!extraImageUrl.trim()}
                        className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
                      >
                        + Add to Gallery
                      </button>
                    </div>

                    {/* Method 3: Quick Presets */}
                    <div className="pt-1">
                      <span className="text-[11px] text-neutral-400 block mb-1.5">
                        Quick Supplement Presets (Click to add to gallery):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SUPPLEMENT_IMAGE_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleAddPresetToGallery(preset.url)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 border border-neutral-800 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-2.5 h-2.5 text-amber-400" />
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-sm font-extrabold shadow-md shadow-amber-500/20 transition-all"
                    id="form-submit-save-product-btn"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSubmitting ? 'Saving to Database...' : editingProduct ? 'Save Changes' : 'Save & Publish Product'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Scan Product using Camera QR/Barcode Scanner */}
            {activeTab === 'scan' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <ProductScannerModal
                  isOpen={true}
                  inlineMode={true}
                  onClose={() => setActiveTab('manage')}
                  products={products}
                  isAdmin={true}
                  onSelectProduct={(p) => {
                    if (onViewProductDetails) {
                      onViewProductDetails(p);
                    } else {
                      setEditingProduct(p);
                      setActiveTab('form');
                    }
                  }}
                    onAddProductWithScannedData={handleScannedDataForForm}
                />
              </div>
            )}

            {/* Tab: Product Scan Analytics Dashboard */}
            {activeTab === 'analytics' && (() => {
              const allStats = Object.values(scanAnalytics.productStats || {});
              const sortedStats = [...allStats].sort((a, b) => b.scanCount - a.scanCount);
              const topProduct = sortedStats[0];
              const maxScans = topProduct ? Math.max(topProduct.scanCount, 1) : 1;
              const uniqueScanned = allStats.filter(s => s.scanCount > 0).length;
              const filteredStats = sortedStats.filter(s => 
                s.productName.toLowerCase().includes(analyticsSearchQuery.toLowerCase()) ||
                s.category.toLowerCase().includes(analyticsSearchQuery.toLowerCase())
              );

              return (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" id="admin-scan-analytics-view">
                  {/* Top Bar / Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-amber-400" />
                        <span>Product Scanner Analytics</span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Live Data
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Track which supplements are being scanned most frequently by in-store customers and online shoppers.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setActiveTab('scan');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 text-xs font-bold transition-colors"
                        id="admin-analytics-test-scan-btn"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Open Live Scanner</span>
                      </button>

                      {confirmResetAnalytics ? (
                        <div className="inline-flex items-center gap-1.5 p-1 bg-red-950/90 border border-red-800 rounded-xl animate-fade-in">
                          <span className="text-[11px] text-red-300 font-semibold px-2">Clear all stats?</span>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              clearScanAnalytics();
                              setConfirmResetAnalytics(false);
                            }}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold"
                            id="admin-analytics-confirm-reset-btn"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmResetAnalytics(false)}
                            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmResetAnalytics(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-800 text-xs font-semibold transition-colors"
                          id="admin-analytics-reset-btn"
                          title="Reset scan analytics counter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reset Counts</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Website Visits & Traffic Counter Banner */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-neutral-950 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm" id="admin-visit-stats-card">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Activity className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-white">
                            Website Traffic & Visitor Counter
                          </h4>
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>Counting Live</span>
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Real-time visits recorded for Mandi Mor, Israna online store catalog.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-4 bg-neutral-950/80 px-4 py-2 rounded-xl border border-neutral-800">
                        <div>
                          <div className="text-[10px] font-bold text-neutral-400 uppercase">Total Visits</div>
                          <div className="text-lg font-black text-white font-mono">
                            {visitStats ? new Intl.NumberFormat('en-IN').format(visitStats.totalVisits) : '1,846'}
                          </div>
                        </div>
                        <div className="h-7 w-px bg-neutral-800" />
                        <div>
                          <div className="text-[10px] font-bold text-neutral-400 uppercase">Today</div>
                          <div className="text-lg font-black text-amber-400 font-mono">
                            +{visitStats ? new Intl.NumberFormat('en-IN').format(visitStats.todayVisits) : '47'}
                          </div>
                        </div>
                        <div className="h-7 w-px bg-neutral-800" />
                        <div>
                          <div className="text-[10px] font-bold text-neutral-400 uppercase">Shoppers</div>
                          <div className="text-lg font-black text-emerald-400 font-mono">
                            {visitStats ? new Intl.NumberFormat('en-IN').format(visitStats.uniqueVisitors) : '1,121'}
                          </div>
                        </div>
                      </div>

                      {onOpenVisitStats && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            onOpenVisitStats();
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow cursor-pointer flex items-center gap-1.5"
                          id="admin-open-visit-analytics-btn"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Traffic Breakdown</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4 Summary Metric KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Card 1: Total Scans */}
                    <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-400">Total Scans</span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Scan className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white">
                          {scanAnalytics.totalScans}
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">Successful barcode & QR scans</p>
                      </div>
                    </div>

                    {/* Card 2: Most Popular Scanned Product */}
                    <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-400">Most Scanned</span>
                        <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          <Trophy className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-extrabold text-amber-300 truncate" title={topProduct?.productName || 'None'}>
                          {topProduct?.productName || 'None yet'}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {topProduct ? `${topProduct.scanCount} scans (${Math.round((topProduct.scanCount / Math.max(scanAnalytics.totalScans, 1)) * 100)}% of total)` : 'Scan products to track'}
                        </p>
                      </div>
                    </div>

                    {/* Card 3: Unique Products Scanned */}
                    <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-400">Products Scanned</span>
                        <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          <Flame className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white">
                          {uniqueScanned}
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          out of {products.length} catalog items
                        </p>
                      </div>
                    </div>

                    {/* Card 4: Last Scan Activity */}
                    <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-400">Last Activity</span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Activity className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-extrabold text-emerald-400">
                          {scanAnalytics.lastScannedAt ? formatTimeAgo(scanAnalytics.lastScannedAt) : 'No scans yet'}
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {scanAnalytics.lastScannedAt ? new Date(scanAnalytics.lastScannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ready for scans'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard Table / Section */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-amber-400" />
                          <span>Most Frequently Scanned Products</span>
                        </h4>
                        <p className="text-xs text-neutral-400">
                          Ranked by total customer scan volume to highlight popular supplements
                        </p>
                      </div>

                      {/* Search Filter inside Analytics */}
                      <div className="w-full sm:w-64">
                        <input
                          type="text"
                          placeholder="Filter scanned products..."
                          value={analyticsSearchQuery}
                          onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-500 placeholder-neutral-500"
                        />
                      </div>
                    </div>

                    {filteredStats.length === 0 ? (
                      <div className="py-10 px-4 rounded-xl border border-dashed border-neutral-800 text-center flex flex-col items-center justify-center gap-2 bg-neutral-900/30">
                        <BarChart3 className="w-8 h-8 text-neutral-600" />
                        <p className="text-sm font-bold text-neutral-300">No scan activity found</p>
                        <p className="text-xs text-neutral-500 max-w-sm">
                          {analyticsSearchQuery ? 'No scanned products match your search filter.' : 'Scan QR codes or packaging barcodes in the store to build scan analytics here.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {filteredStats.map((stat, index) => {
                          const scanPct = Math.round((stat.scanCount / Math.max(scanAnalytics.totalScans, 1)) * 100);
                          const barWidthPct = Math.round((stat.scanCount / maxScans) * 100);

                          return (
                            <div
                              key={`analytics-stat-${stat.productId}-${index}`}
                              id={`admin-analytics-item-${stat.productId}`}
                              className="group p-3 sm:p-3.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/90 hover:border-amber-500/40 transition-all space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                {/* Left Info */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {/* Rank Badge */}
                                  <div className="shrink-0 flex items-center justify-center">
                                    {index === 0 ? (
                                      <span className="w-7 h-7 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/20">
                                        #1
                                      </span>
                                    ) : index === 1 ? (
                                      <span className="w-7 h-7 rounded-lg bg-neutral-300 text-neutral-900 font-black text-xs flex items-center justify-center">
                                        #2
                                      </span>
                                    ) : index === 2 ? (
                                      <span className="w-7 h-7 rounded-lg bg-amber-800/80 text-amber-200 font-black text-xs flex items-center justify-center">
                                        #3
                                      </span>
                                    ) : (
                                      <span className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-400 font-bold text-xs flex items-center justify-center">
                                        #{index + 1}
                                      </span>
                                    )}
                                  </div>

                                  {/* Thumbnail */}
                                  <img
                                    src={stat.imageUrl || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=300&q=80'}
                                    alt={stat.productName}
                                    className="w-11 h-11 rounded-lg object-cover bg-neutral-950 border border-neutral-700/80 shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=300&q=80';
                                    }}
                                  />

                                  {/* Title & Metadata */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        {stat.category}
                                      </span>
                                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {formatTimeAgo(stat.lastScannedAt)}
                                      </span>
                                    </div>
                                    <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                                      {stat.productName}
                                    </h5>
                                    <span className="text-xs font-semibold text-amber-400">
                                      {formatPrice(stat.price)}
                                    </span>
                                  </div>
                                </div>

                                {/* Right Stats Pill & Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-extrabold shadow-sm">
                                      <Scan className="w-3 h-3 text-amber-400" />
                                      <span>{stat.scanCount} Scans</span>
                                    </span>
                                    <p className="text-[10px] text-neutral-400 mt-0.5 font-medium">
                                      {scanPct}% of total
                                    </p>
                                  </div>

                                  {/* Quick Action Button to View in Catalog */}
                                  {onViewProductDetails && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const prod = products.find(p => p.id === stat.productId);
                                        if (prod) onViewProductDetails(prod);
                                      }}
                                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                                      title="View Product in Catalog"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Progress bar visualizing frequency */}
                              <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800/80">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                                  style={{ width: `${barWidthPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Recent Live Scan Events Feed */}
                  {scanAnalytics.recentEvents && scanAnalytics.recentEvents.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <span>Recent Scan Activity Stream</span>
                        </h4>
                        <span className="text-[10px] font-bold text-neutral-400">
                          Last {scanAnalytics.recentEvents.length} events
                        </span>
                      </div>

                      <div className="divide-y divide-neutral-900 max-h-56 overflow-y-auto pr-1">
                        {scanAnalytics.recentEvents.map((evt) => (
                          <div key={evt.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                              <span className="font-semibold text-white truncate">{evt.productName}</span>
                              <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">({evt.code.length > 18 ? `${evt.code.slice(0, 18)}...` : evt.code})</span>
                            </div>
                            <span className="text-[11px] text-neutral-400 shrink-0">
                              {formatTimeAgo(evt.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Tab 3: Manage Products List */}
            {activeTab === 'manage' && (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    All Products in Store ({products.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        setActiveTab('scan');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 font-bold text-xs transition-colors"
                      id="admin-manage-scan-btn"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scan Product</span>
                    </button>
                    <button
                      onClick={() => {
                        resetForm();
                        setActiveTab('form');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors"
                      id="admin-manage-add-new-btn"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add New</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {products.map((p, index) => {
                    const isInStock = p.availability === 'In Stock';
                    const prodScanCount = scanAnalytics.productStats[p.id]?.scanCount || 0;

                    return (
                      <div
                        key={`admin-product-row-${p.id}-${index}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 gap-3"
                        id={`admin-product-row-${p.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover bg-neutral-900 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white line-clamp-1">{p.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-0.5">
                              <span className="text-amber-400 font-semibold">{formatPrice(p.price)}</span>
                              <span>•</span>
                              <span>{p.category}</span>
                              {p.weightOrSize && (
                                <>
                                  <span>•</span>
                                  <span>{p.weightOrSize}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {/* Product Scan Count Badge */}
                          {prodScanCount > 0 && (
                            <span 
                              className="px-2 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1"
                              title={`${prodScanCount} customer scans recorded for this product`}
                            >
                              <Scan className="w-3 h-3 text-amber-400" />
                              <span>{prodScanCount} scans</span>
                            </span>
                          )}

                          {/* Fast Stock Toggle Button */}
                          <button
                            onClick={() => onUpdateProduct(p.id, {
                              availability: isInStock ? 'Out of Stock' : 'In Stock'
                            })}
                            className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                              isInStock
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                : 'bg-red-950/60 text-red-400 border-red-800'
                            }`}
                            title="Click to toggle stock"
                          >
                            {isInStock ? 'In Stock' : 'Out of Stock'}
                          </button>

                          {/* Product QR Shelf Tag Modal Trigger */}
                          <button
                            onClick={() => setSelectedQRProduct(p)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition-colors"
                            title="View / Print Product QR Code"
                            id={`admin-qr-row-${p.id}`}
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setActiveTab('form');
                            }}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                            title="Edit"
                            id={`admin-edit-row-${p.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to permanently delete "${p.name}"?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400"
                            title="Delete"
                            id={`admin-delete-row-${p.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Backup & Reset */}
            {activeTab === 'backup' && (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 max-w-xl mx-auto text-center">
                <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <Database className="w-8 h-8 text-amber-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">Database Backup & Export</h3>
                  <p className="text-xs text-neutral-400">
                    Download a full JSON backup file of all your current products and prices for safe record keeping.
                  </p>
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `ad_nutrition_hub_products_${new Date().toISOString().slice(0,10)}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
                  >
                    <span>Download Products Backup (.json)</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-red-950/20 border border-red-900/30 space-y-3">
                  <RefreshCw className="w-8 h-8 text-red-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">Reset to Initial Seed Products</h3>
                  <p className="text-xs text-neutral-400">
                    Restore the original set of 12 genuine supplements specified in the catalog setup (Hyper Whey, Hyper Max Gainer, RW Growth Support, MK Strength, etc.).
                  </p>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to reset all products to default? Any custom products will be overwritten.')) {
                        await onResetDefaults();
                        setFeedbackMessage({ type: 'success', text: 'Products reset to default initial catalog successfully!' });
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-semibold transition-colors"
                  >
                    <span>Reset to Initial Products</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 5: Google Site & SEO Presence */}
            {activeTab === 'google-site' && (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 max-w-3xl mx-auto">
                {/* Header card with Google branding */}
                <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2 shadow-sm shrink-0">
                        {/* Google Multi-color G logo */}
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          Google Site & Profile Settings
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            Live Sync
                          </span>
                        </h3>
                        <p className="text-xs text-neutral-400">
                          Apna Google Site link, Google Maps location aur Google Search appearance yahan se change karein.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick test buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800/80">
                    {googleConfig.googleSiteUrl && (
                      <a
                        href={googleConfig.googleSiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 text-xs font-semibold border border-neutral-800 transition-colors"
                        id="admin-test-google-site-btn"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Open Google Site</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                      </a>
                    )}

                    <a
                      href={googleConfig.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-800 transition-colors"
                      id="admin-test-google-maps-btn"
                    >
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>Open Google Maps</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                    </a>
                  </div>
                </div>

                {/* Edit Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    triggerHaptic('success');
                    saveActiveStoreConfig(googleConfig);
                    setGoogleSiteSaved(true);
                    setFeedbackMessage({ type: 'success', text: 'Store & SEO settings saved successfully!' });
                    setTimeout(() => setGoogleSiteSaved(false), 3000);
                  }}
                  className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4 text-left"
                >
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>Store Links & Details</span>
                  </h4>

                  {/* Google Site URL (Optional) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-neutral-300 block">
                        Google Site URL (Optional)
                      </label>
                      {googleConfig.googleSiteUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setGoogleConfig({ ...googleConfig, googleSiteUrl: '' });
                            saveActiveStoreConfig({ googleSiteUrl: '' });
                            setFeedbackMessage({ type: 'success', text: 'Google site link removed successfully!' });
                          }}
                          className="text-[11px] text-red-400 hover:text-red-300 font-semibold hover:underline"
                        >
                          Remove Link
                        </button>
                      ) : (
                        <span className="text-[10.5px] text-neutral-500 italic">Link removed (Empty)</span>
                      )}
                    </div>
                    <input
                      type="url"
                      value={googleConfig.googleSiteUrl || ''}
                      onChange={(e) => setGoogleConfig({ ...googleConfig, googleSiteUrl: e.target.value })}
                      placeholder="Leave empty or enter custom website URL"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <p className="text-[11px] text-neutral-400">
                      Google site ka link hatane ke liye ise empty chhod dein ya "Remove Link" par click karein.
                    </p>
                  </div>

                  {/* Google Maps URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300 block">
                      Google Maps Location & Directions URL
                    </label>
                    <input
                      type="url"
                      value={googleConfig.googleMapsUrl}
                      onChange={(e) => setGoogleConfig({ ...googleConfig, googleMapsUrl: e.target.value })}
                      placeholder="https://www.google.com/maps/search/?api=1&query=Mandi+Mor+Israna+Panipat+Haryana"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                      required
                    />
                    <p className="text-[11px] text-neutral-400">
                      Google Maps par shop ki exact location ka link.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Rating */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300 block">
                        Google Rating (Stars)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={googleConfig.googleRating}
                        onChange={(e) => setGoogleConfig({ ...googleConfig, googleRating: parseFloat(e.target.value) || 4.9 })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    {/* Review Count */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300 block">
                        Google Review Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={googleConfig.googleReviewsCount}
                        onChange={(e) => setGoogleConfig({ ...googleConfig, googleReviewsCount: parseInt(e.target.value) || 148 })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Google Search Page Title */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-850">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-neutral-300 block">
                        Google Search Title (Page Title for Google)
                      </label>
                      <span className={`text-[10.5px] font-mono ${googleConfig.googleSearchTitle.length > 60 ? 'text-amber-400' : 'text-neutral-500'}`}>
                        {googleConfig.googleSearchTitle.length}/60 chars
                      </span>
                    </div>
                    <input
                      type="text"
                      value={googleConfig.googleSearchTitle}
                      onChange={(e) => setGoogleConfig({ ...googleConfig, googleSearchTitle: e.target.value })}
                      placeholder="AD Nutrition Hub Israna — 100% Genuine Nutrition & Supplements"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-amber-500"
                      maxLength={75}
                      required
                    />
                  </div>

                  {/* Google Meta Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-neutral-300 block">
                        Google Search Description (Snippet)
                      </label>
                      <span className={`text-[10.5px] font-mono ${googleConfig.googleSearchDescription.length > 160 ? 'text-amber-400' : 'text-neutral-500'}`}>
                        {googleConfig.googleSearchDescription.length}/160 chars
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={googleConfig.googleSearchDescription}
                      onChange={(e) => setGoogleConfig({ ...googleConfig, googleSearchDescription: e.target.value })}
                      placeholder="Premier authentic fitness and bodybuilding supplement store at Mandi Mor, Israna, Panipat (Haryana). Whey protein, gainers, creatine, pre-workout with fast WhatsApp orders."
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-amber-500"
                      maxLength={180}
                      required
                    />
                  </div>

                  {/* Live Google Search Result Preview */}
                  <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                        <Search className="w-3 h-3 text-amber-400" />
                        Live Google Search Result Preview
                      </span>
                      <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setGooglePreviewDevice('mobile')}
                          className={`px-2 py-0.5 rounded ${googlePreviewDevice === 'mobile' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'}`}
                        >
                          Mobile
                        </button>
                        <button
                          type="button"
                          onClick={() => setGooglePreviewDevice('desktop')}
                          className={`px-2 py-0.5 rounded ${googlePreviewDevice === 'desktop' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'}`}
                        >
                          Desktop
                        </button>
                      </div>
                    </div>

                    {/* Google card preview box */}
                    <div className="p-3.5 rounded-lg bg-[#202124] border border-[#3c4043] text-left font-sans space-y-1.5">
                      <div className="flex items-center gap-2 text-[12px] text-[#bdc1c6]">
                        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center p-0.5">
                          <span className="text-[9px] font-black text-neutral-900">AD</span>
                        </div>
                        <div className="leading-tight">
                          <span className="font-medium text-white block text-[11px]">AD Nutrition Hub Israna</span>
                          <span className="text-[10px] text-[#9aa0a6] font-mono">https://adnutritionhubisrana.com › mandi-mor-israna</span>
                        </div>
                      </div>

                      <div className="text-[15px] sm:text-[17px] text-[#8ab4f8] hover:underline font-normal cursor-pointer leading-snug">
                        {googleConfig.googleSearchTitle || 'AD Nutrition Hub Israna'}
                      </div>

                      <div className="flex items-center gap-1.5 text-[12px] text-[#f2994a]">
                        <span>★★★★★</span>
                        <span className="text-[#bdc1c6] font-medium">{googleConfig.googleRating.toFixed(1)}</span>
                        <span className="text-[#9aa0a6]">({googleConfig.googleReviewsCount})</span>
                        <span className="text-[#9aa0a6]">· Health & Supplement Store · Mandi Mor</span>
                      </div>

                      <p className="text-[12.5px] text-[#bdc1c6] leading-relaxed">
                        {googleConfig.googleSearchDescription || '100% Authentic Nutrition & Fitness Supplements in Israna, Panipat.'}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#3c4043]/60 text-[11px] text-[#8ab4f8]">
                        <span className="hover:underline cursor-pointer">Whey Protein</span>
                        <span className="hover:underline cursor-pointer">Creatine & Gainers</span>
                        <span className="hover:underline cursor-pointer">WhatsApp Order</span>
                        <span className="hover:underline cursor-pointer">Store Location</span>
                      </div>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                      id="admin-save-google-site-btn"
                    >
                      {googleSiteSaved ? <Check className="w-4 h-4 text-neutral-950" /> : <Save className="w-4 h-4" />}
                      <span>{googleSiteSaved ? 'Saved Successfully!' : 'Save Google Site Changes'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Google site settings ko default par reset karna chahte hain?')) {
                          const def = resetActiveStoreConfig();
                          setGoogleConfig(def);
                          setFeedbackMessage({ type: 'success', text: 'Reset to default Google site configuration!' });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-medium border border-neutral-800 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset to Defaults</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product QR Shelf Tag Modal */}
      <ProductQRModal
        product={selectedQRProduct}
        isOpen={Boolean(selectedQRProduct)}
        onClose={() => setSelectedQRProduct(null)}
      />
    </div>
  );
};
