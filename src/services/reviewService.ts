import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Review } from '../types';

const REVIEWS_SUBCOLLECTION = 'reviews';
const CACHE_REVIEWS_PREFIX = 'ad_nutrition_reviews_';

// Seed sample reviews for default store supplements
const DEFAULT_SAMPLE_REVIEWS: Record<string, Omit<Review, 'productId'>[]> = {
  'prod-1': [
    {
      id: 'rev-seed-1',
      userName: 'Vikram Sharma (Panipat)',
      rating: 5,
      comment: '100% genuine Hyper Whey! Scanned the importer QR tag and code matched immediately. Rich chocolate taste and mixes with water without any lumps.',
      createdAt: '2026-09-18T10:30:00.000Z'
    },
    {
      id: 'rev-seed-2',
      userName: 'Sahil Jaglan (Israna)',
      rating: 5,
      comment: 'Direct store pickup from Mandi Mor. Akshay bhai is super knowledgeable and gave genuine GST bill with scratch code verification.',
      createdAt: '2026-09-22T14:15:00.000Z'
    }
  ],
  'prod-2': [
    {
      id: 'rev-seed-3',
      userName: 'Aman Malik',
      rating: 5,
      comment: 'Best mass gainer in Haryana market! Put on 3kg clean weight in 4 weeks with daily workouts. Belgian Chocolate flavour is great.',
      createdAt: '2026-09-15T09:20:00.000Z'
    }
  ],
  'prod-3': [
    {
      id: 'rev-seed-4',
      userName: 'Deepak Hooda',
      rating: 5,
      comment: 'Very noticeable strength increase during heavy bench and squats. 100% authentic seal.',
      createdAt: '2026-09-20T16:40:00.000Z'
    }
  ]
};

// Fetch product reviews from Firestore with fallback to cached/initial reviews
export async function fetchProductReviews(productId: string): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, 'products', productId, REVIEWS_SUBCOLLECTION);
    const q = query(reviewsRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const list: Review[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as Review), id: docSnap.id });
      });
      try {
        localStorage.setItem(`${CACHE_REVIEWS_PREFIX}${productId}`, JSON.stringify(list));
      } catch {}
      return list;
    }
  } catch (err: any) {
    console.warn(`Firestore reviews fetch error for ${productId}, attempting fallback:`, err);
  }

  // Fallback to local storage cache
  try {
    const cached = localStorage.getItem(`${CACHE_REVIEWS_PREFIX}${productId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Fallback to default sample reviews if available for demo products
  if (DEFAULT_SAMPLE_REVIEWS[productId]) {
    return DEFAULT_SAMPLE_REVIEWS[productId].map(r => ({ ...r, productId }));
  }

  return [];
}

// Real-time Firestore listener for product reviews
export function subscribeToProductReviews(
  productId: string,
  onUpdate: (reviews: Review[]) => void,
  onError?: (err: Error) => void
): () => void {
  const reviewsRef = collection(db, 'products', productId, REVIEWS_SUBCOLLECTION);
  const q = query(reviewsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Review[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as Review), id: docSnap.id });
      });

      if (list.length > 0) {
        try {
          localStorage.setItem(`${CACHE_REVIEWS_PREFIX}${productId}`, JSON.stringify(list));
        } catch {}
        onUpdate(list);
      } else {
        // If empty in Firestore, check if we have defaults
        if (DEFAULT_SAMPLE_REVIEWS[productId]) {
          onUpdate(DEFAULT_SAMPLE_REVIEWS[productId].map(r => ({ ...r, productId })));
        } else {
          onUpdate([]);
        }
      }
    },
    (error) => {
      console.warn(`Firestore onSnapshot reviews error for ${productId}:`, error);
      if (onError) onError(error);
    }
  );
}

// Add a new review to Firestore under products/{productId}/reviews/{reviewId}
export async function addProductReview(
  productId: string,
  reviewData: Omit<Review, 'id' | 'createdAt' | 'productId'>
): Promise<Review> {
  const newId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const payload: Review = {
    id: newId,
    productId,
    userName: reviewData.userName.trim(),
    rating: Math.max(1, Math.min(5, Math.round(reviewData.rating))),
    comment: reviewData.comment.trim(),
    createdAt: new Date().toISOString(),
    ...(reviewData.userId ? { userId: reviewData.userId } : {})
  };

  const path = `products/${productId}/${REVIEWS_SUBCOLLECTION}/${newId}`;

  try {
    const docRef = doc(db, 'products', productId, REVIEWS_SUBCOLLECTION, newId);
    await setDoc(docRef, payload);
  } catch (err: any) {
    console.error('Failed to write review to Firestore:', err);
    // Also save in local cache as fallback so user sees their review immediately
    try {
      const cached = localStorage.getItem(`${CACHE_REVIEWS_PREFIX}${productId}`);
      const currentList: Review[] = cached ? JSON.parse(cached) : [];
      const updatedList = [payload, ...currentList.filter(r => r.id !== newId)];
      localStorage.setItem(`${CACHE_REVIEWS_PREFIX}${productId}`, JSON.stringify(updatedList));
    } catch {}
    handleFirestoreError(err, OperationType.CREATE, path);
  }

  // Update local cache
  try {
    const cached = localStorage.getItem(`${CACHE_REVIEWS_PREFIX}${productId}`);
    const currentList: Review[] = cached ? JSON.parse(cached) : [];
    const updatedList = [payload, ...currentList.filter(r => r.id !== newId)];
    localStorage.setItem(`${CACHE_REVIEWS_PREFIX}${productId}`, JSON.stringify(updatedList));
  } catch {}

  return payload;
}

// Delete a review (by admin or author)
export async function deleteProductReview(productId: string, reviewId: string): Promise<void> {
  const path = `products/${productId}/${REVIEWS_SUBCOLLECTION}/${reviewId}`;
  try {
    const docRef = doc(db, 'products', productId, REVIEWS_SUBCOLLECTION, reviewId);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.error('Failed to delete review in Firestore:', err);
    handleFirestoreError(err, OperationType.DELETE, path);
  }

  // Remove from local cache
  try {
    const cached = localStorage.getItem(`${CACHE_REVIEWS_PREFIX}${productId}`);
    if (cached) {
      const currentList: Review[] = JSON.parse(cached);
      const updatedList = currentList.filter(r => r.id !== reviewId);
      localStorage.setItem(`${CACHE_REVIEWS_PREFIX}${productId}`, JSON.stringify(updatedList));
    }
  } catch {}
}
