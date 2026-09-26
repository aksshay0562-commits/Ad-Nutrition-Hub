export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  availability: 'In Stock' | 'Out of Stock';
  description: string;
  weightOrSize?: string;
  flavour?: string;
  imageUrl: string;
  featured?: boolean;
  brand?: string;
  youtubeUrl?: string;
  priceHistory?: PriceHistoryPoint[];
  createdAt: string;
  updatedAt?: string;
}

export interface PriceAlert {
  id?: string;
  userId?: string;
  productId: string;
  productName: string;
  phone: string;
  customerName?: string;
  currentPrice: number;
  targetPrice: number;
  status: 'active' | 'notified' | 'cancelled';
  createdAt: string;
}

export const CATEGORIES = [
  'All',
  'Whey Protein',
  'Mass Gainer',
  'Creatine',
  'Pre-Workout',
  'BCAA / EAA',
  'Vitamins & Minerals',
  'Weight Gain Supplements',
  'Fitness Accessories',
  'Maximum Strength',
  'Dietary Supplements'
] as const;

export type CategoryType = typeof CATEGORIES[number];

export interface StoreInfo {
  name: string;
  tagline: string;
  category: string;
  location: string;
  addressDetail: string;
  phone: string;
  whatsapp: string;
  businessType: string;
  about: string;
  hours: {
    weekdays: string;
    sunday: string;
  };
  googleMapsUrl: string;
  instagram: string;
  facebook: string;
}

export const STORE_INFO: StoreInfo = {
  name: "AD Nutrition Hub Israna",
  tagline: "100% Authentic Nutrition & Fitness Supplements",
  category: "Nutrition & Fitness Supplement Store",
  location: "mandi mor, Israna, Panipat, Haryana, India",
  addressDetail: "Mandi Mor, Main Road, Israna, Panipat, Haryana 132107",
  phone: "+91 70159 59517",
  whatsapp: "+91 70159 59517",
  businessType: "AD Nutrition Hub Israna Shop",
  about: "AD Nutrition Hub Israna par fitness aur nutrition se related products ka collection available hai. Customers protein supplements, weight-gain products, vitamins, pre-workout aur fitness accessories ki product details, price aur availability dekh sakte hain.",
  hours: {
    weekdays: "8:00 AM - 9:00 PM",
    sunday: "9:00 AM - 8:00 PM"
  },
  googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandi+Mor+Israna+Panipat+Haryana",
  instagram: "https://www.instagram.com/ad_nutrition_hub_israna",
  facebook: "https://www.facebook.com/adnutritionhubisrana"
};
