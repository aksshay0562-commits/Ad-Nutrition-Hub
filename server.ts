import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Increase limit to allow direct image uploads (base64)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

// Initial seed products
const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    name: "Hyper Whey Protein – 2kg",
    price: 3800,
    originalPrice: 4600,
    category: "Whey Protein",
    availability: "In Stock",
    weightOrSize: "2kg (4.4 lbs)",
    flavour: "Rich Chocolate",
    description: "High-protein supplement for customers following a fitness and workout routine. Packed with 25g pure protein per scoop, rich in BCAAs and rapid digestion enzymes for accelerated recovery.",
    imageUrl: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80",
    featured: true,
    brand: "Hyper Nutrition",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "prod-2",
    name: "Hyper Max Gainer – 5kg",
    price: 3300,
    originalPrice: 4200,
    category: "Mass Gainer",
    availability: "In Stock",
    weightOrSize: "5kg (11 lbs)",
    flavour: "Belgian Chocolate",
    description: "High-protein supplement for customers following a fitness and Weight Gain. Provides balanced complex carbs, high biological value protein, and digestive enzymes for clean bulk without unwanted fat.",
    imageUrl: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80",
    featured: true,
    brand: "Hyper Nutrition",
    createdAt: "2026-01-02T00:00:00.000Z"
  },
  {
    id: "prod-3",
    name: "RW Growth Support 60 Capsules",
    price: 2500,
    originalPrice: 3200,
    category: "Maximum Strength",
    availability: "In Stock",
    weightOrSize: "60 Capsules",
    flavour: "Unflavoured",
    description: "Advanced maximum strength and herbal recovery support formula. Enhances deep sleep recovery, lean muscle density, and workout power for intense training cycles.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    featured: true,
    brand: "RW Performance",
    createdAt: "2026-01-03T00:00:00.000Z"
  },
  {
    id: "prod-4",
    name: "MK-67 Strength Formula",
    price: 2209,
    originalPrice: 2800,
    category: "Maximum Strength",
    availability: "In Stock",
    weightOrSize: "60 Servings",
    flavour: "Standard",
    description: "High-potency botanical strength and appetite vitality formula designed for accelerated workout recovery, performance, and muscle conditioning.",
    imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80",
    featured: false,
    brand: "Strength Labs",
    createdAt: "2026-01-04T00:00:00.000Z"
  },
  {
    id: "prod-5",
    name: "Pro Active Formula 45 Capsules",
    price: 2500,
    originalPrice: 3100,
    category: "Dietary Supplements",
    availability: "In Stock",
    weightOrSize: "45 Capsules",
    flavour: "Vegetarian Capsules",
    description: "Premium dietary vitality and metabolic conditioning formula. Loaded with bio-available micronutrients and stamina boosters for active gym athletes.",
    imageUrl: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=800&q=80",
    featured: false,
    brand: "Pro Active Labs",
    createdAt: "2026-01-05T00:00:00.000Z"
  },
  {
    id: "prod-6",
    name: "Deep Sea Fish Oil 2500mg",
    price: 900,
    originalPrice: 1350,
    category: "Vitamins & Minerals",
    availability: "In Stock",
    weightOrSize: "60 Softgels",
    flavour: "Lemon Flavour",
    description: "High-potency Omega-3 fish oil 2500mg with EPA & DHA. Lemon flavored enteric coating ensures zero fishy burps. Supports heart health, flexible joints, and brain focus.",
    imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80",
    featured: true,
    brand: "Deep Sea Marine",
    createdAt: "2026-01-06T00:00:00.000Z"
  },
  {
    id: "prod-7",
    name: "Micronized 100% Pure Creatine – 300g",
    price: 999,
    originalPrice: 1400,
    category: "Creatine",
    availability: "In Stock",
    weightOrSize: "300g (100 Servings)",
    flavour: "Unflavoured",
    description: "Ultra-pure micronized creatine monohydrate for rapid ATP resynthesis, cellular hydration, explosive strength, and high-intensity power outputs.",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    featured: true,
    brand: "AD Nutrition",
    createdAt: "2026-01-07T00:00:00.000Z"
  },
  {
    id: "prod-8",
    name: "Thunder Pump Extreme Pre-Workout",
    price: 1450,
    originalPrice: 1999,
    category: "Pre-Workout",
    availability: "In Stock",
    weightOrSize: "300g (30 Servings)",
    flavour: "Blue Razz Blast",
    description: "Explosive energy and laser sharp focus with Beta-Alanine, Citrulline Malate, and Caffeine Anhydrous. Delivers insane muscle pumps and endurance.",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    featured: true,
    brand: "Thunder Lab",
    createdAt: "2026-01-08T00:00:00.000Z"
  },
  {
    id: "prod-9",
    name: "Ultra BCAA + EAA 7000mg Matrix",
    price: 1650,
    originalPrice: 2200,
    category: "BCAA / EAA",
    availability: "In Stock",
    weightOrSize: "400g (40 Servings)",
    flavour: "Watermelon Chill",
    description: "Optimal 2:1:1 ratio BCAAs plus essential amino acids and electrolytes to halt muscle catabolism during training and supercharge intra-workout hydration.",
    imageUrl: "https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&w=800&q=80",
    featured: false,
    brand: "Matrix Fuel",
    createdAt: "2026-01-09T00:00:00.000Z"
  },
  {
    id: "prod-10",
    name: "Massive Weight Gain Complex – 3kg",
    price: 2100,
    originalPrice: 2800,
    category: "Weight Gain Supplements",
    availability: "In Stock",
    weightOrSize: "3kg (6.6 lbs)",
    flavour: "Kesar Pista",
    description: "Calorie-dense formula designed specifically for hardgainers wanting solid weight gain. Packed with clean carbohydrates, whey protein, and vitamins.",
    imageUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
    featured: false,
    brand: "AD Nutrition",
    createdAt: "2026-01-10T00:00:00.000Z"
  },
  {
    id: "prod-11",
    name: "AD Heavy Duty Gym Shaker 700ml",
    price: 350,
    originalPrice: 500,
    category: "Fitness Accessories",
    availability: "In Stock",
    weightOrSize: "700ml",
    flavour: "Matte Black & Gold",
    description: "BPA-free leakproof gym shaker bottle with stainless steel wire blending ball and secure flip lock cap. Ideal for protein shakes and pre-workouts.",
    imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    featured: false,
    brand: "AD Accessories",
    createdAt: "2026-01-11T00:00:00.000Z"
  },
  {
    id: "prod-12",
    name: "Pro Weight Lifting Wrist Straps + Grip",
    price: 450,
    originalPrice: 650,
    category: "Fitness Accessories",
    availability: "In Stock",
    weightOrSize: "Standard Pair",
    flavour: "Industrial Cotton",
    description: "Heavy-duty padded wrist wraps for heavy deadlifts, pull-downs, and dumbbell rows. Neoprene wrist padding for maximum joint protection.",
    imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80",
    featured: false,
    brand: "Iron Grip",
    createdAt: "2026-01-12T00:00:00.000Z"
  }
];

// Helper to ensure database file exists
function readProducts(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PRODUCTS_FILE)) {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(INITIAL_PRODUCTS, null, 2), 'utf-8');
      return INITIAL_PRODUCTS;
    }
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading products:', err);
    return INITIAL_PRODUCTS;
  }
}

function writeProducts(products: any[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing products:', err);
    return false;
  }
}

// Server-side helper to compress oversized base64 images if sharp is available
async function optimizeBase64Image(dataUrl?: string): Promise<string | undefined> {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image') || dataUrl.length < 250000) {
    return dataUrl;
  }
  try {
    const sharp = (await import('sharp')).default;
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches) {
      const buffer = Buffer.from(matches[2], 'base64');
      const compressed = await sharp(buffer)
        .resize(900, 900, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      return 'data:image/jpeg;base64,' + compressed.toString('base64');
    }
  } catch (err) {
    console.warn('Server image optimization skipped:', err);
  }
  return dataUrl;
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET all products
app.get('/api/products', (req, res) => {
  const products = readProducts();
  res.json(products);
});

// POST add new product
app.post('/api/products', async (req, res) => {
  try {
    const {
      name,
      price,
      originalPrice,
      category,
      availability,
      description,
      weightOrSize,
      flavour,
      imageUrl,
      brand,
      featured
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const optimizedImageUrl = await optimizeBase64Image(imageUrl);

    const products = readProducts();
    const newProduct = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: String(name).trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category: String(category).trim(),
      availability: availability === 'Out of Stock' ? 'Out of Stock' : 'In Stock',
      description: description ? String(description).trim() : '',
      weightOrSize: weightOrSize ? String(weightOrSize).trim() : undefined,
      flavour: flavour ? String(flavour).trim() : undefined,
      imageUrl: optimizedImageUrl || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80',
      brand: brand ? String(brand).trim() : 'AD Nutrition Hub',
      featured: Boolean(featured),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to top of list
    products.unshift(newProduct);
    writeProducts(products);

    res.status(201).json(newProduct);
  } catch (err: any) {
    console.error('Failed to create product:', err);
    res.status(500).json({ error: 'Failed to save product to database' });
  }
});

// PUT update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const products = readProducts();
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existing = products[index];
    let updatedImageUrl = req.body.imageUrl !== undefined ? req.body.imageUrl : existing.imageUrl;
    if (updatedImageUrl && updatedImageUrl !== existing.imageUrl) {
      updatedImageUrl = await optimizeBase64Image(updatedImageUrl);
    }

    const updated = {
      ...existing,
      ...req.body,
      imageUrl: updatedImageUrl,
      id: existing.id, // Immutable ID
      price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
      originalPrice: req.body.originalPrice !== undefined ? Number(req.body.originalPrice) : existing.originalPrice,
      updatedAt: new Date().toISOString()
    };

    products[index] = updated;
    writeProducts(products);

    res.json(updated);
  } catch (err: any) {
    console.error('Failed to update product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE remove product
app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const products = readProducts();
    const filtered = products.filter((p) => p.id !== id);

    if (products.length === filtered.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    writeProducts(filtered);
    res.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Failed to delete product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Reset to default products
app.post('/api/products/reset', (req, res) => {
  writeProducts(INITIAL_PRODUCTS);
  res.json({ success: true, products: INITIAL_PRODUCTS });
});

// Store info endpoint
app.get('/api/store-info', (req, res) => {
  res.json({
    name: "AD Nutrition Hub Israna",
    tagline: "100% Authentic Nutrition & Fitness Supplements",
    category: "Nutrition & Fitness Supplement Store",
    location: "mandi mor, Israna, Panipat, Haryana, India",
    addressDetail: "Mandi Mor, Main Road, Israna, Panipat, Haryana 132107",
    phone: "+91 70159 59517",
    whatsapp: "+91 70159 59517",
    businessType: "AD Nutrition Hub Israna Shop",
    hours: {
      weekdays: "8:00 AM - 9:00 PM",
      sunday: "9:00 AM - 8:00 PM"
    }
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AD Nutrition Hub server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
