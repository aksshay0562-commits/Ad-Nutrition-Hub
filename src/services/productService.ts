import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/defaultProducts';

const CACHE_KEY = 'ad_nutrition_products_cache_v1';

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data: Product[] = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('API fetch products error, falling back to local storage cache:', err);
  }

  // Fallback to cache or initial products
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore cache parse error
  }

  return INITIAL_PRODUCTS;
}

export async function addProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const payload = {
    ...productData,
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const newProd: Product = await res.json();
      // Update local cache
      const cached = await fetchProducts();
      const updatedList = [newProd, ...cached.filter(p => p.id !== newProd.id)];
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedList));
      return newProd;
    }
  } catch (err) {
    console.warn('API add product error, saving locally:', err);
  }

  // Local fallback if server unreachable
  const fallbackProduct: Product = {
    ...payload,
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  const cached = await fetchProducts();
  const updatedList = [fallbackProduct, ...cached];
  localStorage.setItem(CACHE_KEY, JSON.stringify(updatedList));
  return fallbackProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (res.ok) {
      const updatedProd: Product = await res.json();
      const cached = await fetchProducts();
      const updatedList = cached.map(p => p.id === id ? updatedProd : p);
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedList));
      return updatedProd;
    }
  } catch (err) {
    console.warn('API update product error, saving locally:', err);
  }

  // Local fallback
  const cached = await fetchProducts();
  const index = cached.findIndex(p => p.id === id);
  if (index !== -1) {
    const updated = { ...cached[index], ...updates, updatedAt: new Date().toISOString() };
    cached[index] = updated;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    return updated;
  }
  throw new Error('Product not found');
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const cached = await fetchProducts();
      const filtered = cached.filter(p => p.id !== id);
      localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
      return true;
    }
  } catch (err) {
    console.warn('API delete product error, removing locally:', err);
  }

  // Local fallback
  const cached = await fetchProducts();
  const filtered = cached.filter(p => p.id !== id);
  localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
  return true;
}

export async function resetToDefaultProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products/reset', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.products || INITIAL_PRODUCTS));
      return data.products || INITIAL_PRODUCTS;
    }
  } catch (err) {
    console.warn('Failed to reset on server:', err);
  }

  localStorage.setItem(CACHE_KEY, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

// Utility for WhatsApp enquiry URL
export function buildWhatsAppEnquiryUrl(product?: Product, customMessage?: string): string {
  const phone = '917015959517';
  let text = '';

  if (product) {
    text = `Namaste AD Nutrition Hub Israna! 🙏\n\nI want to enquire / order this product:\n🛒 Product: ${product.name}\n💰 Price: ₹${product.price.toLocaleString('en-IN')}\n📦 Category: ${product.category}\n${product.weightOrSize ? `⚖️ Size: ${product.weightOrSize}\n` : ''}${product.flavour ? `🍓 Flavour: ${product.flavour}\n` : ''}📌 Availability: ${product.availability}\n\nPlease share availability & best offer!`;
  } else if (customMessage) {
    text = customMessage;
  } else {
    text = `Namaste AD Nutrition Hub Israna! 🙏\nI want to enquire about fitness supplements and products available at your Mandi Mor, Israna store.`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function formatPrice(num: number): string {
  return `₹${num.toLocaleString('en-IN')}`;
}
