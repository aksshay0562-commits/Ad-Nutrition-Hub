import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/defaultProducts';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { compressImage } from '../utils/imageCompressor';

const CACHE_KEY = 'ad_nutrition_products_cache_v1';
const PRODUCTS_COLLECTION = 'products';

/**
 * Strips out any keys with `undefined` values so Firestore setDoc / updateDoc
 * never fails with: "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = sanitizeForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result as T;
}

// Seed initial products into Firestore if the collection is empty
export async function seedInitialProductsIfEmpty(): Promise<Product[]> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log('Firestore products collection empty, seeding initial genuine products...');
      const batch = writeBatch(db);
      for (const prod of INITIAL_PRODUCTS) {
        const prodRef = doc(db, PRODUCTS_COLLECTION, prod.id);
        batch.set(prodRef, sanitizeForFirestore({
          ...prod,
          createdAt: prod.createdAt || new Date().toISOString()
        }));
      }
      await batch.commit();
      return INITIAL_PRODUCTS;
    } else {
      const items: Product[] = [];
      snap.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as Product), id: docSnap.id });
      });
      return items;
    }
  } catch (error) {
    console.warn('Could not seed/query Firestore products on startup:', error);
    return INITIAL_PRODUCTS;
  }
}

// Fetch products with Firestore priority and fallback to cache / local
export async function fetchProducts(): Promise<Product[]> {
  // 1. Try Firestore
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: Product[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as Product), id: docSnap.id });
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      return list;
    } else {
      // Empty in Firestore, seed defaults
      return await seedInitialProductsIfEmpty();
    }
  } catch (err: any) {
    if (err?.code === 'unavailable') {
      console.warn('Firestore offline: fetching from local cache or fallback.');
    } else {
      console.warn('Firestore fetch error, falling back to API / cache:', err);
    }
  }

  // 2. Fallback to server API
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data: Product[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('API fetch products fallback error:', err);
  }

  // 3. Fallback to LocalStorage cache
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

// Real-time Firestore snapshot listener with compliant error callback
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((docSnap) => {
        prods.push({ ...(docSnap.data() as Product), id: docSnap.id });
      });
      if (prods.length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(prods));
        onUpdate(prods);
      }
    },
    (error) => {
      // If client is temporarily offline or reconnecting, maintain local cache
      if ((error as any)?.code === 'unavailable') {
        console.warn('Firestore onSnapshot operating in offline mode.');
        return;
      }
      console.error('Firestore onSnapshot error:', error);
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
    }
  );
}

// Add a new product to Firestore
export async function addProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  let finalImageUrl = productData.imageUrl;

  // Ensure image is compressed to stay well under Firestore's 1MB limit
  if (finalImageUrl && finalImageUrl.startsWith('data:image') && finalImageUrl.length > 250000) {
    try {
      finalImageUrl = await compressImage(finalImageUrl, 900, 900, 0.8);
    } catch (e) {
      console.warn('Could not compress image in addProduct:', e);
    }
  }

  const payload: Product = sanitizeForFirestore({
    ...productData,
    imageUrl: finalImageUrl,
    id: newId,
    createdAt: new Date().toISOString()
  });

  // Try writing to Firestore
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, newId);
    await setDoc(docRef, payload);
  } catch (err) {
    console.warn('Firestore addDoc error, attempting API backup:', err);
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (apiErr) {
      console.warn('API backup also failed:', apiErr);
    }
    // Re-throw with compliant error handler if Firestore permission issue
    handleFirestoreError(err, OperationType.CREATE, `${PRODUCTS_COLLECTION}/${newId}`);
  }

  // Update local cache
  try {
    const cached = await fetchProducts();
    const updatedList = [payload, ...cached.filter(p => p.id !== newId)];
    localStorage.setItem(CACHE_KEY, JSON.stringify(updatedList));
  } catch {
    // Ignore cache write error
  }

  return payload;
}

// Update an existing product in Firestore
export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const updatedPayload = {
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Prepare full product record to preserve all required fields in Firestore
  const cached = await fetchProducts();
  const index = cached.findIndex((p) => p.id === id);
  const existing = index !== -1 ? cached[index] : null;
  let fullUpdated: Product = existing
    ? { ...existing, ...updatedPayload }
    : ({ id, ...updatedPayload } as Product);

  // If image is a large base64 string, compress it to keep document well under Firestore's 1MB limit
  if (fullUpdated.imageUrl && fullUpdated.imageUrl.startsWith('data:image') && fullUpdated.imageUrl.length > 250000) {
    try {
      fullUpdated.imageUrl = await compressImage(fullUpdated.imageUrl, 900, 900, 0.8);
      if (updatedPayload.imageUrl) {
        updatedPayload.imageUrl = fullUpdated.imageUrl;
      }
    } catch (compErr) {
      console.warn('Could not compress large image before Firestore update:', compErr);
    }
  }

  // 1. Try Firestore
  let firestoreSuccess = false;
  const sanitizedDoc = sanitizeForFirestore(fullUpdated);
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await setDoc(docRef, sanitizedDoc, { merge: true });
    firestoreSuccess = true;
  } catch (err) {
    console.warn('Firestore updateDoc/setDoc error:', err);
    // API fallback
    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });
    } catch {
      // Ignored
    }
    
    // Check if error is specifically document size exceeded
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('exceeds the maximum allowed size') || errMsg.includes('cannot be written')) {
      console.warn('Document size exceeded in Firestore; fallback applied.');
    } else {
      handleFirestoreError(err, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
    }
  }

  // Also sync to server API
  if (firestoreSuccess) {
    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });
    } catch {
      // Ignored
    }
  }

  // Update local cache
  if (index !== -1) {
    cached[index] = fullUpdated;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    return fullUpdated;
  }

  return fullUpdated;
}

// Delete product from Firestore
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteDoc error:', err);
    // Try API
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch {
      // Ignored
    }
    handleFirestoreError(err, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
  }

  // Also sync to server API
  try {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
  } catch {
    // Ignored
  }

  // Update cache
  const cached = await fetchProducts();
  const filtered = cached.filter(p => p.id !== id);
  localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
  return true;
}

// Reset catalog to default genuine supplements
export async function resetToDefaultProducts(): Promise<Product[]> {
  try {
    const batch = writeBatch(db);
    // First clear or overwrite with initial products
    for (const prod of INITIAL_PRODUCTS) {
      const prodRef = doc(db, PRODUCTS_COLLECTION, prod.id);
      batch.set(prodRef, sanitizeForFirestore({
        ...prod,
        createdAt: prod.createdAt || new Date().toISOString()
      }));
    }
    await batch.commit();
  } catch (err) {
    console.warn('Firestore batch reset failed, using API reset:', err);
    try {
      await fetch('/api/products/reset', { method: 'POST' });
    } catch {
      // Ignored
    }
  }

  localStorage.setItem(CACHE_KEY, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

// Submit a customer enquiry to Firestore
export async function submitCustomerEnquiry(data: {
  customerName: string;
  phone: string;
  message: string;
  productId?: string;
  productName?: string;
  userId?: string;
}): Promise<boolean> {
  const enquiryId = `enq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  try {
    const docRef = doc(db, 'enquiries', enquiryId);
    await setDoc(docRef, sanitizeForFirestore({
      ...data,
      id: enquiryId,
      status: 'pending',
      createdAt: new Date().toISOString()
    }));
    return true;
  } catch (err) {
    console.error('Error submitting enquiry to Firestore:', err);
    handleFirestoreError(err, OperationType.CREATE, `enquiries/${enquiryId}`);
    return false;
  }
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
