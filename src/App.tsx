import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  PlusCircle, 
  RefreshCw, 
  AlertCircle,
  PackageX,
  SlidersHorizontal,
  ShieldCheck,
  Award,
  Zap,
  MapPin,
  Clock,
  Phone,
  MessageCircle
} from 'lucide-react';
import { Product, CATEGORIES, STORE_INFO } from './types';
import { 
  fetchProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  resetToDefaultProducts 
} from './services/productService';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { AdminPanel } from './components/AdminPanel';
import { ContactSection } from './components/ContactSection';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
  const [priceSort, setPriceSort] = useState<'default' | 'low-to-high' | 'high-to-low'>('default');
  
  // Modals & Selection
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeSection, setActiveSection] = useState('home');

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('ad_nutrition_admin_auth') === 'true';
  });

  // Feedback toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Initial products load
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Admin Login Handlers
  const handleAdminLogin = (pin: string): boolean => {
    if (pin === '1234' || pin === '70159') {
      setIsAdmin(true);
      sessionStorage.setItem('ad_nutrition_admin_auth', 'true');
      showToast('Owner / Admin Mode Activated! You can now add, edit or delete products.');
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('ad_nutrition_admin_auth');
    setIsAdminModalOpen(false);
    showToast('Logged out of Admin Mode', 'info');
  };

  // CRUD Actions connected to persistent server
  const handleAddProduct = async (data: Omit<Product, 'id' | 'createdAt'>) => {
    const newProd = await addProduct(data);
    setProducts((prev) => [newProd, ...prev.filter(p => p.id !== newProd.id)]);
    showToast(`Product "${newProd.name}" saved permanently to website!`);
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = await updateProduct(id, updates);
    setProducts((prev) => prev.map((p) => p.id === id ? updated : p));
    if (selectedProduct && selectedProduct.id === id) {
      setSelectedProduct(updated);
    }
    showToast(`Product "${updated.name}" updated successfully!`);
  };

  const handleDeleteProduct = async (id: string) => {
    const prodToDelete = products.find(p => p.id === id);
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (selectedProduct && selectedProduct.id === id) {
      setSelectedProduct(null);
    }
    showToast(`Product "${prodToDelete?.name || ''}" deleted from store.`);
  };

  const handleToggleStock = async (product: Product) => {
    const newStatus = product.availability === 'In Stock' ? 'Out of Stock' : 'In Stock';
    await handleUpdateProduct(product.id, { availability: newStatus });
  };

  const handleResetDefaults = async () => {
    const defaults = await resetToDefaultProducts();
    setProducts(defaults);
    showToast('Catalog reset to initial seed products.');
  };

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = products.filter((p) => p.category === cat).length;
      }
    });
    return counts;
  }, [products]);

  // Filtered & Sorted products list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategory !== 'All' && product.category !== selectedCategory) {
        return false;
      }

      // Stock status filter
      if (stockFilter === 'in-stock' && product.availability !== 'In Stock') {
        return false;
      }
      if (stockFilter === 'out-of-stock' && product.availability !== 'Out of Stock') {
        return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = product.name.toLowerCase().includes(q);
        const matchDesc = product.description.toLowerCase().includes(q);
        const matchCategory = product.category.toLowerCase().includes(q);
        const matchBrand = (product.brand || '').toLowerCase().includes(q);
        const matchFlavour = (product.flavour || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCategory && !matchBrand && !matchFlavour) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (priceSort === 'low-to-high') return a.price - b.price;
      if (priceSort === 'high-to-low') return b.price - a.price;
      return 0;
    });
  }, [products, selectedCategory, stockFilter, searchQuery, priceSort]);

  // Featured Spotlight products
  const featuredProducts = useMemo(() => {
    return products.filter(p => p.featured).slice(0, 4);
  }, [products]);

  // Smooth navigation handler
  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm p-4 rounded-xl bg-neutral-900 border border-amber-500/40 text-white shadow-2xl shadow-black/80 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs font-semibold leading-snug">{toast.message}</p>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        isAdmin={isAdmin}
        onToggleAdminModal={() => setIsAdminModalOpen(true)}
        onOpenAddProduct={() => {
          setEditingProduct(null);
          setIsAdminModalOpen(true);
        }}
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Hero Section */}
      <div id="home">
        <Hero
          onExploreClick={() => handleNavigate('products')}
          onLocationClick={() => handleNavigate('location')}
          onCategorySelect={(cat) => {
            setSelectedCategory(cat);
            handleNavigate('products');
          }}
        />
      </div>

      {/* Featured / Bestseller Spotlight */}
      {featuredProducts.length > 0 && selectedCategory === 'All' && !searchQuery && (
        <section className="py-12 bg-neutral-900/40 border-b border-neutral-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Israna Top Picks</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Trending & High-Demand Supplements
                </h2>
              </div>
              <button
                onClick={() => handleNavigate('products')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 self-start sm:self-auto"
              >
                View Full Catalog ({products.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={`featured-${product.id}`}
                  product={product}
                  onViewDetails={(p) => setSelectedProduct(p)}
                  isAdmin={isAdmin}
                  onEdit={(p) => {
                    setEditingProduct(p);
                    setIsAdminModalOpen(true);
                  }}
                  onDelete={(p) => handleDeleteProduct(p.id)}
                  onToggleStock={handleToggleStock}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Product Catalog Section */}
      <section id="products" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        {/* Section Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                <span>📦 Real-Time Inventory</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                SUPPLEMENT CATALOG & PRICES
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Prices and stock availability for AD Nutrition Hub Israna. Click any product to order directly on WhatsApp.
              </p>
            </div>

            {/* Quick Admin Add Shortcut if logged in */}
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsAdminModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 self-start md:self-auto transition-colors"
                id="catalog-admin-add-btn"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Product to Website</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories Pills */}
        <div className="mb-6" id="categories">
          <CategoryNav
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            categoryCounts={categoryCounts}
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 mb-8 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <input
                type="text"
                placeholder="Search supplements (e.g., Whey Protein, Gainer, Creatine, Fish Oil)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 placeholder-neutral-500"
                id="catalog-search-input"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-neutral-400 hover:text-white absolute right-3 top-3"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Stock Filter */}
            <div className="md:col-span-3 flex items-center gap-1.5">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700/80 text-neutral-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                id="catalog-stock-filter"
              >
                <option value="all">All Availability (All)</option>
                <option value="in-stock">🟢 In Stock Only</option>
                <option value="out-of-stock">🔴 Out of Stock Only</option>
              </select>
            </div>

            {/* Price Sort */}
            <div className="md:col-span-3 flex items-center gap-1.5">
              <select
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700/80 text-neutral-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                id="catalog-price-sort"
              >
                <option value="default">Sort by: Default</option>
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Active Filter Tags */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400 pt-1 border-t border-neutral-800/60">
            <div>
              Showing <strong className="text-white">{filteredProducts.length}</strong> of {products.length} supplements
              {selectedCategory !== 'All' && <span> in <strong className="text-amber-400">{selectedCategory}</strong></span>}
              {searchQuery && <span> matching "<span className="text-amber-300">{searchQuery}</span>"</span>}
            </div>

            {(selectedCategory !== 'All' || searchQuery || stockFilter !== 'all' || priceSort !== 'default') && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                  setStockFilter('all');
                  setPriceSort('default');
                }}
                className="text-amber-400 hover:underline font-semibold"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-neutral-400">Loading supplement inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center rounded-2xl bg-neutral-900/60 border border-neutral-800 max-w-lg mx-auto space-y-4">
            <PackageX className="w-12 h-12 text-neutral-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Supplements Found</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              No products match your current search or category filter. Check the spelling or enquire on WhatsApp for customized availability.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                  setStockFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                Clear Filters
              </button>
              <a
                href={`https://wa.me/917015959517?text=${encodeURIComponent(`Namaste AD Nutrition Hub Israna! Mujhe ${searchQuery || 'supplement'} ke baare mein poochhna hai jo website par nahi mila.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Ask on WhatsApp
              </a>
            </div>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={(p) => setSelectedProduct(p)}
                isAdmin={isAdmin}
                onEdit={(p) => {
                  setEditingProduct(p);
                  setIsAdminModalOpen(true);
                }}
                onDelete={(p) => handleDeleteProduct(p.id)}
                onToggleStock={handleToggleStock}
              />
            ))}
          </div>
        )}
      </section>

      {/* About & Trust Features Section */}
      <section id="about" className="py-16 bg-neutral-900/60 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: About Text */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                <span>About Our Shop</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                AD NUTRITION HUB ISRANA
              </h2>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                {STORE_INFO.about}
              </p>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Humara aim Israna aur aas-paas ke sabhi fitness enthusiasts, bodybuilders aur athletes ko authentic protein supplements aur vitamins provide karna hai bina kisi middleman markups ke.
              </p>

              {/* 3 Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <ShieldCheck className="w-6 h-6 text-amber-400 mb-2" />
                  <h4 className="text-xs font-bold text-white uppercase">100% Original</h4>
                  <p className="text-[11px] text-neutral-400 mt-1">Direct importer seals with scratch QR codes.</p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <Zap className="w-6 h-6 text-amber-400 mb-2" />
                  <h4 className="text-xs font-bold text-white uppercase">Best Pricing</h4>
                  <p className="text-[11px] text-neutral-400 mt-1">Wholesale & retail rates in Panipat district.</p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <MessageCircle className="w-6 h-6 text-emerald-400 mb-2" />
                  <h4 className="text-xs font-bold text-white uppercase">WhatsApp Help</h4>
                  <p className="text-[11px] text-neutral-400 mt-1">Instant chat support on +91 70159 59517.</p>
                </div>
              </div>
            </div>

            {/* Right: Store Snapshot Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-neutral-950 font-black text-xl">
                    AD
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">AD Nutrition Hub Israna</h3>
                    <p className="text-xs text-amber-400 font-semibold">Mandi Mor, Israna (Panipat)</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-neutral-300">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Mandi Mor, Main Road, Israna, Panipat, Haryana 132107</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                    <a href={`tel:${STORE_INFO.phone}`} className="hover:underline font-bold text-white">
                      {STORE_INFO.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Mon - Sat: 8:00 AM - 9:00 PM | Sun: 9:00 AM - 8:00 PM</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex flex-col gap-2">
                  <a
                    href={`https://wa.me/917015959517?text=${encodeURIComponent('Namaste AD Nutrition Hub Israna! Mujhe guidance chaiye.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Chat with Shop Owner</span>
                  </a>
                  <a
                    href={`tel:${STORE_INFO.phone}`}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold border border-neutral-700 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Call Store Directly</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Location & Map Section */}
      <ContactSection />

      {/* Floating WhatsApp Action Button */}
      <FloatingWhatsApp />

      {/* Footer */}
      <Footer
        onCategorySelect={(cat) => {
          setSelectedCategory(cat);
          handleNavigate('products');
        }}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        isAdmin={isAdmin}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isAdmin={isAdmin}
        onEdit={(p) => {
          setSelectedProduct(null);
          setEditingProduct(p);
          setIsAdminModalOpen(true);
        }}
      />

      {/* Owner / Admin Management Modal */}
      <AdminPanel
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isAdmin={isAdmin}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        products={products}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onResetDefaults={handleResetDefaults}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
      />
    </div>
  );
}
