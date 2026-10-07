import { Product, STORE_INFO } from '../types';
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

const QUOTA_KEY = 'ad_nutrition_quota_exceeded_timestamp';
const QUOTA_TTL_MS = 60 * 60 * 1000; // 1 hour

export function isFirestoreQuotaError(err: unknown): boolean {
  if (!err) return false;
  const errMsg = err instanceof Error ? err.message : String(err);
  const code = (err as any)?.code || '';
  return (
    code === 'resource-exhausted' ||
    errMsg.includes('Quota limit exceeded') ||
    errMsg.includes('Quota exceeded') ||
    errMsg.includes('Free daily read units per project')
  );
}

let firestoreQuotaExceededState = typeof window !== 'undefined' && (
  sessionStorage.getItem('ad_nutrition_quota_exceeded') === 'true' ||
  Boolean(localStorage.getItem(QUOTA_KEY))
);

export function isFirestoreQuotaExceeded(): boolean {
  if (typeof window === 'undefined') return false;
  if (firestoreQuotaExceededState) return true;
  try {
    const sessionFlag = sessionStorage.getItem('ad_nutrition_quota_exceeded');
    if (sessionFlag === 'true') {
      firestoreQuotaExceededState = true;
      return true;
    }
    const stored = localStorage.getItem(QUOTA_KEY);
    if (!stored) return false;
    const ts = parseInt(stored, 10);
    if (isNaN(ts) || Date.now() - ts < QUOTA_TTL_MS) {
      firestoreQuotaExceededState = true;
      return true;
    }
    localStorage.removeItem(QUOTA_KEY);
    sessionStorage.removeItem('ad_nutrition_quota_exceeded');
    firestoreQuotaExceededState = false;
    return false;
  } catch {
    return firestoreQuotaExceededState;
  }
}

export function setFirestoreQuotaExceeded(val: boolean): void {
  firestoreQuotaExceededState = val;
  if (typeof window !== 'undefined') {
    try {
      if (val) {
        localStorage.setItem(QUOTA_KEY, Date.now().toString());
        sessionStorage.setItem('ad_nutrition_quota_exceeded', 'true');
      } else {
        localStorage.removeItem(QUOTA_KEY);
        sessionStorage.removeItem('ad_nutrition_quota_exceeded');
      }
    } catch {}
  }
}

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
  if (isFirestoreQuotaExceeded()) {
    return INITIAL_PRODUCTS;
  }
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
  } catch (error: any) {
    if (isFirestoreQuotaError(error)) {
      setFirestoreQuotaExceeded(true);
    }
    console.warn('Could not seed/query Firestore products on startup:', error);
    return INITIAL_PRODUCTS;
  }
}

export function deduplicateProducts(list: Product[]): Product[] {
  const map = new Map<string, Product>();
  for (const item of list) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

// Fetch products with Firestore priority and fallback to cache / local
export async function fetchProducts(): Promise<Product[]> {
  // 1. Try Firestore if quota is not exceeded
  if (!isFirestoreQuotaExceeded()) {
    try {
      const colRef = collection(db, PRODUCTS_COLLECTION);
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const list: Product[] = [];
        snap.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as Product), id: docSnap.id });
        });
        const deduped = deduplicateProducts(list);
        localStorage.setItem(CACHE_KEY, JSON.stringify(deduped));
        return deduped;
      } else {
        // Empty in Firestore, seed defaults
        const seeded = await seedInitialProductsIfEmpty();
        return deduplicateProducts(seeded);
      }
    } catch (err: any) {
      if (isFirestoreQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
        console.warn('Firestore quota limit reached. Gracefully falling back to local cache & server API.');
      } else if (err?.code === 'unavailable') {
        console.warn('Firestore offline: fetching from local cache or fallback.');
      } else {
        console.warn('Firestore fetch error, falling back to API / cache:', err);
      }
    }
  }

  // 2. Fallback to server API
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data: Product[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const deduped = deduplicateProducts(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(deduped));
        return deduped;
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
        return deduplicateProducts(parsed);
      }
    }
  } catch {
    // Ignore cache parse error
  }

  return deduplicateProducts(INITIAL_PRODUCTS);
}

// Real-time Firestore snapshot listener with compliant error callback
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  // If quota was already exceeded, avoid attaching onSnapshot listener to prevent repeated quota errors
  if (isFirestoreQuotaExceeded()) {
    console.info('Firestore operating with cached catalog due to quota limit.');
    return () => {};
  }

  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const prods: Product[] = [];
        snapshot.forEach((docSnap) => {
          prods.push({ ...(docSnap.data() as Product), id: docSnap.id });
        });
        const deduped = deduplicateProducts(prods);
        if (deduped.length > 0) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(deduped));
          onUpdate(deduped);
        }
      },
      (error) => {
        const errMsg = error instanceof Error ? error.message : String(error);
        const isQuota = isFirestoreQuotaError(error);

        if (isQuota) {
          setFirestoreQuotaExceeded(true);
          console.warn('Firestore onSnapshot quota reached: switched to offline/cache mode.');
          fetchProducts().then(onUpdate).catch(() => {});
          return;
        }

        // If client is temporarily offline or reconnecting, maintain local cache
        if ((error as any)?.code === 'unavailable') {
          console.warn('Firestore onSnapshot operating in offline mode.');
          return;
        }

        if ((error as any)?.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
        } else {
          console.warn('Firestore onSnapshot notice:', errMsg);
          if (onError) {
            onError(error instanceof Error ? error : new Error(errMsg));
          }
        }
      }
    );
  } catch (initErr) {
    console.warn('Could not initialize onSnapshot:', initErr);
    return () => {};
  }
}

// Add a new product to Firestore
export async function addProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  let finalImageUrl = productData.imageUrl;

  // Ensure image is compressed to stay well under Firestore's 1MB limit
  if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
    try {
      finalImageUrl = await compressImage(finalImageUrl, 800, 800, 0.75);
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

  // Emergency safety check: if serialized payload still exceeds 700KB, recompress aggressively
  if (JSON.stringify(payload).length > 700000 && payload.imageUrl && payload.imageUrl.startsWith('data:image')) {
    try {
      payload.imageUrl = await compressImage(payload.imageUrl, 500, 500, 0.55);
    } catch {}
  }

  // Try writing to Firestore
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, newId);
    await setDoc(docRef, payload);
  } catch (err: any) {
    console.warn('Firestore addDoc error, attempting API backup:', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const isDocSizeError = errMsg.includes('exceeds the maximum allowed size') || errMsg.includes('cannot be written');

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (apiErr) {
      console.warn('API backup also failed:', apiErr);
    }

    if (isDocSizeError) {
      // If Firestore failed due to document size, perform emergency low-res compression and retry once
      if (payload.imageUrl && payload.imageUrl.startsWith('data:image')) {
        try {
          payload.imageUrl = await compressImage(payload.imageUrl, 400, 400, 0.5);
          const docRef = doc(db, PRODUCTS_COLLECTION, newId);
          await setDoc(docRef, payload);
          console.log('Product written to Firestore successfully after emergency compression.');
        } catch (retryErr) {
          console.warn('Firestore retry after compression still failed; proceeding with API backup:', retryErr);
        }
      }
    } else {
      const isQuota = err?.code === 'resource-exhausted' || errMsg.includes('Quota limit exceeded') || errMsg.includes('Quota exceeded');
      if (isQuota) {
        setFirestoreQuotaExceeded(true);
        console.warn('Firestore quota reached during addProduct. Saved via REST API & local storage.');
      } else if (err?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.CREATE, `${PRODUCTS_COLLECTION}/${newId}`);
      } else {
        console.warn('Firestore write failed, saved via REST API & local storage:', err);
      }
    }
  }

  // Update local cache
  try {
    const cached = await fetchProducts();
    const updatedList = deduplicateProducts([payload, ...cached.filter(p => p.id !== newId)]);
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
  if (fullUpdated.imageUrl && fullUpdated.imageUrl.startsWith('data:image')) {
    try {
      fullUpdated.imageUrl = await compressImage(fullUpdated.imageUrl, 800, 800, 0.75);
      if (updatedPayload.imageUrl) {
        updatedPayload.imageUrl = fullUpdated.imageUrl;
      }
    } catch (compErr) {
      console.warn('Could not compress large image before Firestore update:', compErr);
    }
  }

  // Emergency safety check: if serialized payload exceeds 700KB, recompress aggressively
  if (JSON.stringify(fullUpdated).length > 700000 && fullUpdated.imageUrl && fullUpdated.imageUrl.startsWith('data:image')) {
    try {
      fullUpdated.imageUrl = await compressImage(fullUpdated.imageUrl, 500, 500, 0.55);
      if (updatedPayload.imageUrl) {
        updatedPayload.imageUrl = fullUpdated.imageUrl;
      }
    } catch {}
  }

  // 1. Try Firestore
  let firestoreSuccess = false;
  const sanitizedDoc = sanitizeForFirestore(fullUpdated);
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await setDoc(docRef, sanitizedDoc, { merge: true });
    firestoreSuccess = true;
  } catch (err: any) {
    console.warn('Firestore updateDoc/setDoc error:', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const isDocSizeError = errMsg.includes('exceeds the maximum allowed size') || errMsg.includes('cannot be written');

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
    
    if (isDocSizeError) {
      if (sanitizedDoc.imageUrl && sanitizedDoc.imageUrl.startsWith('data:image')) {
        try {
          sanitizedDoc.imageUrl = await compressImage(sanitizedDoc.imageUrl, 400, 400, 0.5);
          const docRef = doc(db, PRODUCTS_COLLECTION, id);
          await setDoc(docRef, sanitizedDoc, { merge: true });
          firestoreSuccess = true;
          console.log('Product updated in Firestore after emergency compression.');
        } catch (retryErr) {
          console.warn('Firestore update retry after compression failed; proceeding with API backup:', retryErr);
        }
      }
    } else {
      if (isFirestoreQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
        console.warn('Firestore quota reached during updateProduct. Saved via REST API & local storage.');
      } else if ((err as any)?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
      } else {
        console.warn('Firestore update notice, saved via REST API & local storage:', err);
      }
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
  } catch (err: any) {
    console.warn('Firestore deleteDoc notice:', err);
    // Try API
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch {
      // Ignored
    }
    if (isFirestoreQuotaError(err)) {
      setFirestoreQuotaExceeded(true);
      console.warn('Firestore quota reached during deleteProduct. Removed via REST API & local storage.');
    } else if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
    }
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
  } catch (err: any) {
    console.warn('Notice submitting enquiry to Firestore, proceeding with WhatsApp flow:', err);
    if (isFirestoreQuotaError(err)) {
      setFirestoreQuotaExceeded(true);
    } else if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.CREATE, `enquiries/${enquiryId}`);
    }
    return true;
  }
}

// Submit a customer price alert request to Firestore
export async function submitPriceAlert(data: {
  productId: string;
  productName: string;
  phone: string;
  currentPrice: number;
  targetPrice: number;
  customerName?: string;
  userId?: string;
}): Promise<boolean> {
  const alertId = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  try {
    const docRef = doc(db, 'priceAlerts', alertId);
    await setDoc(docRef, sanitizeForFirestore({
      ...data,
      id: alertId,
      status: 'active',
      createdAt: new Date().toISOString()
    }));
    return true;
  } catch (err) {
    console.error('Error submitting price alert to Firestore:', err);
    // Don't crash if Firestore is offline, allow user flow to proceed to WhatsApp
    return true;
  }
}

// Utility for WhatsApp price drop alert subscription URL
export function buildWhatsAppPriceAlertUrl(
  product: Product, 
  targetPrice: number, 
  customerPhone?: string, 
  customerName?: string,
  storePhone: string = STORE_INFO.rawPhone1
): string {
  const text = `Namaste AD Nutrition Hub Israna! 🙏\n\n🔔 *Price Drop Alert Request*\n🛒 Product: ${product.name}\n💰 Current Store Price: ₹${product.price.toLocaleString('en-IN')}\n🎯 My Desired Price: ₹${targetPrice.toLocaleString('en-IN')}\n${customerName ? `👤 Name: ${customerName}\n` : ''}${customerPhone ? `📱 WhatsApp: ${customerPhone}\n` : ''}\nPlease notify me on this WhatsApp number whenever this product's price drops or if a special festival / bulk offer becomes available at your Mandi Mor, Israna shop!`;

  return `https://wa.me/${storePhone}?text=${encodeURIComponent(text)}`;
}

// Utility for WhatsApp enquiry URL
export function buildWhatsAppEnquiryUrl(
  product?: Product, 
  customMessage?: string,
  phoneNumber: string = STORE_INFO.rawPhone1
): string {
  let text = '';

  if (product) {
    text = `Namaste AD Nutrition Hub Israna! 🙏\n\nI want to enquire / order this product:\n🛒 Product: ${product.name}\n💰 Price: ₹${product.price.toLocaleString('en-IN')}\n📦 Category: ${product.category}\n${product.weightOrSize ? `⚖️ Size: ${product.weightOrSize}\n` : ''}${product.flavour ? `🍓 Flavour: ${product.flavour}\n` : ''}📌 Availability: ${product.availability}\n\nPlease share availability & best offer!`;
  } else if (customMessage) {
    text = customMessage;
  } else {
    text = `Namaste AD Nutrition Hub Israna! 🙏\nI want to enquire about fitness supplements and products available at your Mandi Mor, Israna store.`;
  }

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
}

export function formatPrice(num: number): string {
  return `₹${num.toLocaleString('en-IN')}`;
}

// Extract YouTube video ID from various link formats (watch, share, shorts, embed)
export function getYoutubeVideoId(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Direct 11 character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

// Convert any YouTube link into a privacy-friendly embed URL
export function getYoutubeEmbedUrl(url: string | undefined | null): string | null {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : null;
}

/**
 * Determines whether a product qualifies for the 'Quick-Buy' badge:
 * - Must be strictly 'In Stock'
 * - Must have a high sales count (salesCount >= 200, or featured with high demand)
 */
export function isQuickBuyProduct(product?: Product | null): boolean {
  if (!product) return false;
  if (product.availability !== 'In Stock') return false;

  const sales = product.salesCount ?? (product.featured ? 220 : 0);
  return sales >= 200;
}

