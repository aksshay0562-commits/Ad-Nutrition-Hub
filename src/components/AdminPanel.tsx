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
  Image as ImageIcon
} from 'lucide-react';
import { Product, CATEGORIES, CategoryType } from '../types';
import { formatPrice } from '../services/productService';

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
  setEditingProduct
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'manage' | 'backup'>('form');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  const [featured, setFeatured] = useState(false);

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

  // Image file upload handler (converts file to base64)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large! Please choose an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
    const finalImageUrl = imageUrl.trim() || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80';

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, {
          name: name.trim(),
          category: finalCategory,
          price: numPrice,
          originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
          availability,
          weightOrSize: weightOrSize.trim() || undefined,
          flavour: flavour.trim() || undefined,
          brand: brand.trim() || 'AD Nutrition Hub',
          description: description.trim(),
          imageUrl: finalImageUrl,
          featured
        });
        setFeedbackMessage({ type: 'success', text: `Product "${name}" updated and saved permanently to server!` });
      } else {
        await onAddProduct({
          name: name.trim(),
          category: finalCategory,
          price: numPrice,
          originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
          availability,
          weightOrSize: weightOrSize.trim() || undefined,
          flavour: flavour.trim() || undefined,
          brand: brand.trim() || 'AD Nutrition Hub',
          description: description.trim(),
          imageUrl: finalImageUrl,
          featured
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
        <div className="px-5 py-2.5 bg-emerald-950/40 border-b border-emerald-900/40 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Server Database Active:</strong> Products are saved to <code className="bg-emerald-900/40 px-1 py-0.5 rounded font-mono text-[11px]">/data/products.json</code>. Anyone who opens the site sees your updates!
            </span>
          </div>
          <span className="hidden sm:inline-block font-semibold text-emerald-400">
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
              <h3 className="text-xl font-bold text-white">Enter Owner Passcode</h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Access product catalog manager to add, edit or delete supplements.
              </p>
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
                  Unlock Admin Panel
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

              <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
                Owner Contact: +91 70159 59517 • Mandi Mor, Israna
              </div>
            </form>
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
            </div>

            {/* Tab 1: Add or Edit Form */}
            {activeTab === 'form' && (
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
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

                {/* Product Image Section: Upload or Preset or URL */}
                <div className="space-y-3 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>Product Photo (Upload, Preset, or URL)</span>
                    </label>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-[11px] text-red-400 hover:underline"
                      >
                        Clear Photo
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Image Preview */}
                    <div className="md:col-span-3 w-28 h-28 mx-auto md:mx-0 rounded-xl bg-neutral-900 border border-neutral-700 overflow-hidden relative flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] text-neutral-400 text-center p-2">
                          No Photo Selected
                        </span>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="md:col-span-9 space-y-2.5">
                      {/* Option 1: File Upload from phone/camera */}
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors border border-neutral-700">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>Upload from Phone / PC</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileUpload}
                            className="hidden"
                            id="form-image-file-input"
                          />
                        </label>
                        <span className="text-neutral-400 text-xs">or paste image URL below</span>
                      </div>

                      {/* Option 2: Image URL input */}
                      <div className="relative">
                        <input
                          type="url"
                          placeholder="Paste image URL (https://...)"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                          id="form-image-url-input"
                        />
                        <LinkIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                      </div>

                      {/* Option 3: Quick Presets */}
                      <div className="pt-1">
                        <span className="text-[11px] text-neutral-400 block mb-1.5">
                          Quick Presets (Click to pick sample image):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {SUPPLEMENT_IMAGE_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setImageUrl(preset.url)}
                              className="text-[11px] px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 border border-neutral-800 transition-colors"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
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

            {/* Tab 2: Manage Products List */}
            {activeTab === 'manage' && (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    All Products in Store ({products.length})
                  </h3>
                  <button
                    onClick={() => {
                      resetForm();
                      setActiveTab('form');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 font-bold text-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add New</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {products.map((p) => {
                    const isInStock = p.availability === 'In Stock';

                    return (
                      <div
                        key={p.id}
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
          </div>
        )}
      </div>
    </div>
  );
};
