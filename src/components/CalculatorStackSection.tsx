import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Layers, 
  Dumbbell, 
  Flame, 
  Droplets, 
  Scale, 
  Target, 
  Sparkles, 
  Check, 
  Plus, 
  Minus, 
  MessageCircle, 
  Phone, 
  Info, 
  ShieldCheck, 
  ChevronRight, 
  RefreshCw,
  Zap,
  TrendingUp,
  Heart
} from 'lucide-react';
import { Product, STORE_INFO } from '../types';
import { formatPrice } from '../services/productService';
import { triggerHaptic } from '../utils/haptics';

interface CalculatorStackSectionProps {
  products: Product[];
  onViewProductDetails?: (product: Product) => void;
}

// Activity levels with calorie multipliers
const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise / desk job', multiplier: 1.2 },
  { id: 'light', label: 'Light Exercise', desc: 'Workout 1–3 days/week', multiplier: 1.375 },
  { id: 'moderate', label: 'Moderate Training', desc: 'Workout 3–5 days/week', multiplier: 1.55 },
  { id: 'heavy', label: 'Heavy Athletic', desc: 'Workout 6–7 days/week', multiplier: 1.725 },
  { id: 'extreme', label: 'Extreme Athlete', desc: 'Intense workouts or 2x/day', multiplier: 1.9 },
];

// Fitness goals with protein and calorie adjustment factors
const FITNESS_GOALS = [
  { 
    id: 'lean_muscle', 
    label: 'Lean Muscle & Hypertrophy', 
    icon: '🏋️‍♂️',
    desc: 'Build dense, defined muscle with minimal fat gain',
    proteinPerKg: 2.0, // grams per kg
    calorieOffset: 250, // surplus
    carbRatio: 0.45,
    fatRatio: 0.25,
    recommendedStackId: 'lean-muscle'
  },
  { 
    id: 'bulking', 
    label: 'Mass & Fast Bulking', 
    icon: '⚡',
    desc: 'Rapid size, calorie surplus & maximum weight gain',
    proteinPerKg: 1.8,
    calorieOffset: 550,
    carbRatio: 0.55,
    fatRatio: 0.25,
    recommendedStackId: 'bulking'
  },
  { 
    id: 'cutting', 
    label: 'Fat Loss & Shredding', 
    icon: '🔥',
    desc: 'Burn fat while strictly preserving muscle mass',
    proteinPerKg: 2.3, // higher protein to preserve lean tissue
    calorieOffset: -450, // deficit
    carbRatio: 0.35,
    fatRatio: 0.25,
    recommendedStackId: 'cutting'
  },
  { 
    id: 'strength', 
    label: 'Raw Strength & Powerlifting', 
    icon: '💥',
    desc: 'Explosive ATP energy, heavy PRs & fast recovery',
    proteinPerKg: 2.0,
    calorieOffset: 300,
    carbRatio: 0.45,
    fatRatio: 0.30,
    recommendedStackId: 'strength'
  },
  { 
    id: 'health', 
    label: 'Daily Fitness & Wellness', 
    icon: '🛡️',
    desc: 'Active lifestyle, joint health, and energy',
    proteinPerKg: 1.4,
    calorieOffset: 0,
    carbRatio: 0.50,
    fatRatio: 0.25,
    recommendedStackId: 'wellness'
  },
];

export const CalculatorStackSection: React.FC<CalculatorStackSectionProps> = ({
  products,
  onViewProductDetails
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'stack'>('calculator');

  // Calculator State
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [age, setAge] = useState<number>(24);
  const [activity, setActivity] = useState<string>('moderate');
  const [goal, setGoal] = useState<string>('lean_muscle');

  // Stack Builder State
  const [selectedPrebuiltStackId, setSelectedPrebuiltStackId] = useState<string>('lean-muscle');
  const [customStackProductIds, setCustomStackProductIds] = useState<string[]>([]);
  const [stackMode, setStackMode] = useState<'prebuilt' | 'custom'>('prebuilt');

  // Find products helper
  const findProduct = (keyword: string, fallbackCategory?: string): Product | undefined => {
    return products.find(p => p.name.toLowerCase().includes(keyword.toLowerCase())) ||
           products.find(p => p.category.toLowerCase().includes((fallbackCategory || keyword).toLowerCase())) ||
           products[0];
  };

  // Pre-configured stacks based on store catalog
  const prebuiltStacks = useMemo(() => {
    // 1. Lean Muscle Stack
    const whey = findProduct('Whey', 'Whey Protein');
    const creatine = findProduct('Creatine', 'Creatine');
    const preworkout = findProduct('Pre-Workout', 'Pre-Workout');
    const gainer = findProduct('Gainer', 'Mass Gainer');
    const fishoil = findProduct('Fish Oil', 'Vitamins & Minerals');
    const growth = findProduct('Growth', 'Maximum Strength');
    const proActive = findProduct('Pro Active', 'Dietary Supplements');

    return [
      {
        id: 'lean-muscle',
        title: 'Lean Muscle & Definition Stack',
        tag: '🔥 Most Popular in Israna',
        desc: 'The gold standard trio for pure lean muscle synthesis, rapid post-workout recovery, and high vascularity.',
        goalKey: 'lean_muscle',
        badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
        products: [whey, creatine, preworkout].filter(Boolean) as Product[],
        dosageTip: 'Whey: 1 scoop post-workout • Creatine: 3–5g daily • Pre-Workout: 1 scoop 20m before training',
        discountPercent: 8,
      },
      {
        id: 'bulking',
        title: 'Extreme Mass & Size Bulking Stack',
        tag: '⚡ Hardgainer Special',
        desc: 'Dense high-calorie carbohydrates, ultra-pure protein, and cell-volumizing creatine for fast weight and size increase.',
        goalKey: 'bulking',
        badgeColor: 'border-yellow-500/40 text-yellow-300 bg-yellow-500/10',
        products: [gainer, creatine, fishoil].filter(Boolean) as Product[],
        dosageTip: 'Mass Gainer: 1 serving between meals • Creatine: 5g daily • Fish Oil: 1 softgel with breakfast',
        discountPercent: 10,
      },
      {
        id: 'cutting',
        title: 'Fat Loss & Lean Muscle Shred Stack',
        tag: '✂️ Lean Definition',
        desc: 'Retain maximum muscle while shredding body fat with high bioavailability protein, essential omega-3s, and metabolic vitality.',
        goalKey: 'cutting',
        badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
        products: [whey, proActive, fishoil].filter(Boolean) as Product[],
        dosageTip: 'Whey: 1–2 scoops daily • Pro Active: 1 capsule with lunch • Fish Oil: 1 softgel morning & night',
        discountPercent: 7,
      },
      {
        id: 'strength',
        title: 'Powerlifting & Heavy PR Strength Stack',
        tag: '💥 Raw Explosive Power',
        desc: 'Formulated for explosive gym lifting, heavy squats and bench PRs, and deep muscle recovery while sleeping.',
        goalKey: 'strength',
        badgeColor: 'border-red-500/40 text-red-300 bg-red-500/10',
        products: [preworkout, creatine, growth].filter(Boolean) as Product[],
        dosageTip: 'Pre-Workout: 1 scoop pre-gym • Creatine: 5g with warm water • Growth Support: 2 capsules before bed',
        discountPercent: 9,
      },
      {
        id: 'wellness',
        title: 'Daily Athlete Vitality & Joint Care Stack',
        tag: '🛡️ Overall Health',
        desc: 'Crucial joint lubrication, heart health, stamina, and daily foundational protein for all fitness enthusiasts.',
        goalKey: 'health',
        badgeColor: 'border-blue-500/40 text-blue-300 bg-blue-500/10',
        products: [whey, fishoil].filter(Boolean) as Product[],
        dosageTip: 'Whey: 1 scoop daily • Fish Oil: 1 softgel after main meal',
        discountPercent: 5,
      },
    ];
  }, [products]);

  // Active stack products
  const currentStackData = useMemo(() => {
    if (stackMode === 'prebuilt') {
      const found = prebuiltStacks.find(s => s.id === selectedPrebuiltStackId) || prebuiltStacks[0];
      const subtotal = found.products.reduce((acc, p) => acc + p.price, 0);
      const originalSubtotal = found.products.reduce((acc, p) => acc + (p.originalPrice || p.price), 0);
      const discountAmount = Math.round(subtotal * (found.discountPercent / 100));
      const bundlePrice = subtotal - discountAmount;
      const totalSavings = (originalSubtotal - subtotal) + discountAmount;

      return {
        title: found.title,
        desc: found.desc,
        tag: found.tag,
        dosageTip: found.dosageTip,
        products: found.products,
        subtotal,
        bundlePrice,
        totalSavings,
        discountPercent: found.discountPercent,
      };
    } else {
      // Custom Stack
      const selectedProducts = products.filter(p => customStackProductIds.includes(p.id));
      const subtotal = selectedProducts.reduce((acc, p) => acc + p.price, 0);
      const originalSubtotal = selectedProducts.reduce((acc, p) => acc + (p.originalPrice || p.price), 0);
      // Give 8% bundle discount if 2 or more products selected
      const discountPercent = selectedProducts.length >= 3 ? 10 : selectedProducts.length >= 2 ? 6 : 0;
      const discountAmount = Math.round(subtotal * (discountPercent / 100));
      const bundlePrice = subtotal - discountAmount;
      const totalSavings = (originalSubtotal - subtotal) + discountAmount;

      return {
        title: 'Custom Personalized Stack',
        desc: 'Your custom-selected stack tailored specifically for your routine and budget.',
        tag: '✨ Custom Selection',
        dosageTip: 'Consult shop owner on WhatsApp for customized timing of your selected items.',
        products: selectedProducts,
        subtotal,
        bundlePrice,
        totalSavings,
        discountPercent,
      };
    }
  }, [stackMode, selectedPrebuiltStackId, customStackProductIds, prebuiltStacks, products]);

  // Calculation Results
  const calculations = useMemo(() => {
    const selectedGoal = FITNESS_GOALS.find(g => g.id === goal) || FITNESS_GOALS[0];
    const selectedActivity = ACTIVITY_LEVELS.find(a => a.id === activity) || ACTIVITY_LEVELS[2];

    // BMR using Mifflin-St Jeor Equation
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    // TDEE (Maintenance Calories)
    const tdee = Math.round(bmr * selectedActivity.multiplier);
    // Target Calories adjusted for goal
    const targetCalories = Math.max(1200, Math.round(tdee + selectedGoal.calorieOffset));

    // Daily Protein Target in grams
    const dailyProteinGrams = Math.round(weightKg * selectedGoal.proteinPerKg);
    const proteinCalories = dailyProteinGrams * 4;

    // Daily Fat Target (approx 25% of calories, 9 cal/g)
    const fatCalories = Math.round(targetCalories * selectedGoal.fatRatio);
    const dailyFatGrams = Math.round(fatCalories / 9);

    // Daily Carbs Target (Remaining calories, 4 cal/g)
    const carbCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
    const dailyCarbGrams = Math.round(carbCalories / 4);

    // Daily Water Intake (35ml per kg base + 500ml for training)
    const waterLitres = ((weightKg * 35 + (selectedActivity.multiplier > 1.3 ? 700 : 300)) / 1000).toFixed(1);

    // Creatine Protocol
    const creatineLoadingGrams = Math.round(weightKg * 0.3); // e.g. 21g
    const creatineMaintenanceGrams = weightKg > 85 ? 5 : 3;

    // Supplement Contribution (e.g. 1-2 scoops of Whey gives ~25-50g)
    const supplementProteinScoops = Math.round((dailyProteinGrams * 0.35) / 25);

    return {
      bmr,
      tdee,
      targetCalories,
      dailyProteinGrams,
      dailyFatGrams,
      dailyCarbGrams,
      waterLitres,
      creatineLoadingGrams,
      creatineMaintenanceGrams,
      supplementProteinScoops,
      recommendedStackId: selectedGoal.recommendedStackId
    };
  }, [gender, weightKg, heightCm, age, activity, goal]);

  // Jump from calculator to recommended stack
  const handleJumpToStack = (stackId: string) => {
    triggerHaptic('light');
    setSelectedPrebuiltStackId(stackId);
    setStackMode('prebuilt');
    setActiveTab('stack');
  };

  // Toggle product in custom stack
  const toggleCustomProduct = (productId: string) => {
    triggerHaptic('light');
    setCustomStackProductIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // WhatsApp stack order link
  const generateWhatsAppStackUrl = () => {
    const productListText = currentStackData.products
      .map((p, i) => `  ${i + 1}. ${p.name} (${formatPrice(p.price)})`)
      .join('\n');

    const message = `Namaste AD Nutrition Hub Israna! 🏋️‍♂️\n\nMujhe yeh *${currentStackData.title}* order/confirm karna hai:\n\n${productListText}\n\n*Total MRP:* ${formatPrice(currentStackData.subtotal)}\n*Stack Bundle Price:* ${formatPrice(currentStackData.bundlePrice)} (Saved ${formatPrice(currentStackData.totalSavings)})\n\nKripya iska stock aur delivery confirmation bhejein. Dhanyawad!`;

    return `https://wa.me/917015959517?text=${encodeURIComponent(message)}`;
  };

  return (
    <section id="calculator-stack" className="py-12 sm:py-16 bg-neutral-950 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Fitness Tool</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Supplement Stack Builder & Nutrition Calculator
          </h2>
          <p className="text-sm sm:text-base text-neutral-400">
            Calculate your exact daily protein and calorie requirements, then build or order a tailored supplement stack with exclusive bundle discounts at AD Nutrition Hub Israna.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center">
          <div className="p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 inline-flex items-center gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('calculator');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'calculator'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
              id="calc-tab-calculator"
            >
              <Calculator className="w-4 h-4" />
              <span>Nutrition Calculator</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('stack');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'stack'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
              id="calc-tab-stacks"
            >
              <Layers className="w-4 h-4" />
              <span>Supplement Stack Builder</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-neutral-950/40 text-amber-950 border border-amber-950/20">
                Save 10%
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: NUTRITION & DOSAGE CALCULATOR */}
        {/* ========================================================================= */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Left Inputs Panel (7 Cols) */}
            <div className="lg:col-span-7 bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Your Body & Workout Profile</h3>
                    <p className="text-xs text-neutral-400">Enter accurate stats for genuine daily targets</p>
                  </div>
                </div>

                {/* Gender Toggle */}
                <div className="flex items-center p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${gender === 'male' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${gender === 'female' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Female
                  </button>
                </div>
              </div>

              {/* Sliders / Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Weight Input */}
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
                    <span>Weight</span>
                    <span className="text-amber-400 font-bold text-sm">{weightKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="140"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>40 kg</span>
                    <span>90 kg</span>
                    <span>140 kg</span>
                  </div>
                </div>

                {/* Height Input */}
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
                    <span>Height</span>
                    <span className="text-amber-400 font-bold text-sm">{heightCm} cm</span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="210"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>140 cm</span>
                    <span>175 cm</span>
                    <span>210 cm</span>
                  </div>
                </div>

                {/* Age Input */}
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
                    <span>Age</span>
                    <span className="text-amber-400 font-bold text-sm">{age} yrs</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="70"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>16</span>
                    <span>40</span>
                    <span>70</span>
                  </div>
                </div>
              </div>

              {/* Activity Level Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Weekly Training Frequency</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ACTIVITY_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setActivity(lvl.id);
                      }}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        activity === lvl.id
                          ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{lvl.label}</span>
                        {activity === lvl.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">{lvl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fitness Goal Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Primary Fitness Goal</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FITNESS_GOALS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setGoal(g.id);
                      }}
                      className={`p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 ${
                        goal === g.id
                          ? 'bg-gradient-to-r from-amber-500/20 to-neutral-900 border-amber-500 text-white shadow-md'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-2xl shrink-0 mt-0.5">{g.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
                          <span>{g.label}</span>
                          {goal === g.id && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{g.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Results Panel (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
                {/* Glow Backdrop */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-extrabold text-white">Recommended Daily Targets</h3>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Scientific
                  </span>
                </div>

                {/* Primary Metric 1: Daily Protein Target */}
                <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                      <span>Daily Protein Requirement</span>
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      ~{(calculations.dailyProteinGrams / weightKg).toFixed(1)}g / kg bodyweight
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-amber-400">
                      {calculations.dailyProteinGrams}
                    </span>
                    <span className="text-base font-bold text-neutral-300">grams / day</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    💡 <strong>Smart Breakdown:</strong> Take ~{calculations.supplementProteinScoops * 25}g from Whey/Gainer (~{calculations.supplementProteinScoops} scoop/day) + {Math.max(0, calculations.dailyProteinGrams - (calculations.supplementProteinScoops * 25))}g from whole food meals (Paneer, Soya, Eggs, Dal, Chicken).
                  </p>
                </div>

                {/* Primary Metric 2: Calories & Macro Breakdown */}
                <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>Target Daily Calories (TDEE)</span>
                    </span>
                    <span className="text-xs font-extrabold text-white">
                      {calculations.targetCalories} kcal
                    </span>
                  </div>

                  {/* 3 Macro Cards */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">Protein</span>
                      <p className="text-sm font-black text-white">{calculations.dailyProteinGrams}g</p>
                      <span className="text-[9px] text-neutral-500">4 kcal/g</span>
                    </div>

                    <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">Carbs</span>
                      <p className="text-sm font-black text-white">{calculations.dailyCarbGrams}g</p>
                      <span className="text-[9px] text-neutral-500">Clean energy</span>
                    </div>

                    <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                      <span className="text-[10px] font-bold text-yellow-400 uppercase">Healthy Fats</span>
                      <p className="text-sm font-black text-white">{calculations.dailyFatGrams}g</p>
                      <span className="text-[9px] text-neutral-500">Hormone health</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Metrics: Creatine & Hydration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-400">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Creatine Dosage</span>
                    </div>
                    <p className="text-base font-extrabold text-white">
                      {calculations.creatineMaintenanceGrams}g <span className="text-xs text-neutral-400 font-normal">/ day</span>
                    </p>
                    <p className="text-[10px] text-neutral-500">Loading: {calculations.creatineLoadingGrams}g/day (optional 5 days)</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-400">
                      <Droplets className="w-3 h-3 text-blue-400" />
                      <span>Hydration Target</span>
                    </div>
                    <p className="text-base font-extrabold text-blue-400">
                      {calculations.waterLitres} <span className="text-xs text-neutral-400 font-normal">Litres / day</span>
                    </p>
                    <p className="text-[10px] text-neutral-500">Essential for creatine uptake</p>
                  </div>
                </div>

                {/* Call-to-action: Jump to recommended stack */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleJumpToStack(calculations.recommendedStackId)}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                    id="calc-cta-view-recommended-stack"
                  >
                    <span>View Recommended Supplement Stack for {weightKg}kg</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SUPPLEMENT STACK BUILDER */}
        {/* ========================================================================= */}
        {activeTab === 'stack' && (
          <div className="space-y-8 animate-fade-in">
            {/* Mode Toggle: Curated Pre-built Stacks vs Custom Picker */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setStackMode('prebuilt');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                    stackMode === 'prebuilt'
                      ? 'bg-amber-500 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  id="stack-mode-prebuilt"
                >
                  Curated Goal Stacks (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setStackMode('custom');
                    // Pre-fill custom with first 2 products if empty
                    if (customStackProductIds.length === 0 && products.length > 0) {
                      setCustomStackProductIds([products[0].id, products[1]?.id].filter(Boolean));
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                    stackMode === 'custom'
                      ? 'bg-amber-500 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  id="stack-mode-custom"
                >
                  Build Your Own Custom Stack ({customStackProductIds.length})
                </button>
              </div>

              <span className="text-xs text-neutral-400 hidden md:inline">
                🚚 Free delivery & verified batch testing across Israna & Panipat
              </span>
            </div>

            {/* Sub-view A: Curated Goal Stacks */}
            {stackMode === 'prebuilt' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {prebuiltStacks.map((stk) => (
                  <button
                    key={stk.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedPrebuiltStackId(stk.id);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between h-full ${
                      selectedPrebuiltStackId === stk.id
                        ? 'bg-gradient-to-b from-amber-500/20 to-neutral-950 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                    id={`stack-preset-card-${stk.id}`}
                  >
                    <div className="space-y-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${stk.badgeColor}`}>
                        {stk.tag}
                      </span>
                      <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                        {stk.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2">{stk.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs mt-3">
                      <span className="text-neutral-400">{stk.products.length} Products</span>
                      <span className="text-emerald-400 font-bold">{stk.discountPercent}% OFF</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Sub-view B: Custom Product Picker */}
            {stackMode === 'custom' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-400">
                    Tap any supplements to include or remove them from your personalized stack:
                  </p>
                  <span className="text-xs font-bold text-amber-400">
                    {customStackProductIds.length} items in bundle
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {products.map((p) => {
                    const isSelected = customStackProductIds.includes(p.id);

                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleCustomProduct(p.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                        }`}
                        id={`custom-stack-toggle-${p.id}`}
                      >
                        <div className="space-y-2">
                          <div className="relative">
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full aspect-square object-cover rounded-xl bg-neutral-950"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=300&q=80';
                              }}
                            />
                            <div className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelected ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-900/80 text-neutral-400 border border-neutral-700'
                            }`}>
                              {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                            </div>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold uppercase text-amber-400">
                              {p.category}
                            </span>
                            <h5 className="text-xs font-bold text-white line-clamp-1">{p.name}</h5>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
                          <span className="font-extrabold text-amber-400">{formatPrice(p.price)}</span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`}>
                            {isSelected ? 'Added' : 'Tap to Add'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Stack Breakdown & Bundle Checkout Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900 border-2 border-amber-500/30 shadow-2xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {currentStackData.tag}
                    </span>
                    {currentStackData.discountPercent > 0 && (
                      <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {currentStackData.discountPercent}% Bundle Savings
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {currentStackData.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
                    {currentStackData.desc}
                  </p>
                </div>

                {/* Price Snapshot */}
                <div className="text-left md:text-right bg-neutral-950 p-4 rounded-2xl border border-neutral-800 shrink-0">
                  <div className="text-xs text-neutral-400">Total Bundle Investment</div>
                  <div className="flex items-baseline gap-2 md:justify-end mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400">
                      {formatPrice(currentStackData.bundlePrice)}
                    </span>
                    {currentStackData.subtotal > currentStackData.bundlePrice && (
                      <span className="text-xs text-neutral-500 line-through">
                        {formatPrice(currentStackData.subtotal)}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                    You save {formatPrice(currentStackData.totalSavings)} on this stack
                  </div>
                </div>
              </div>

              {/* Stack Products List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Stack Inclusions ({currentStackData.products.length} Items)</span>
                  <span className="text-[10px] text-neutral-500 font-normal">All sealed with genuine importer QR tags</span>
                </h4>

                {currentStackData.products.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-2xl">
                    No products selected in your custom stack yet. Tap any products above to add them!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {currentStackData.products.map((p, idx) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center gap-3 relative group"
                      >
                        <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>

                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-14 h-14 rounded-xl object-cover bg-neutral-900 shrink-0 border border-neutral-800"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=300&q=80';
                          }}
                        />

                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase text-amber-400">{p.category}</span>
                          <h5 className="text-xs sm:text-sm font-bold text-white truncate">{p.name}</h5>
                          <div className="flex items-center gap-2 mt-0.5 text-xs">
                            <span className="font-extrabold text-amber-400">{formatPrice(p.price)}</span>
                            {p.weightOrSize && <span className="text-neutral-500">• {p.weightOrSize}</span>}
                          </div>
                        </div>

                        {onViewProductDetails && (
                          <button
                            type="button"
                            onClick={() => onViewProductDetails(p)}
                            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
                            title="Inspect product"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Usage Guidance Note */}
              <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-3 text-xs text-neutral-300">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-white">Recommended Routine & Timing:</span>
                  <p className="text-neutral-400 text-[11px]">{currentStackData.dosageTip}</p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>100% Genuine Importer Hologram Guaranteed • In-Store Pickup at Israna or Fast Shipping</span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <a
                    href={`tel:${STORE_INFO.phone}`}
                    className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Call Store</span>
                  </a>

                  <a
                    href={generateWhatsAppStackUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHaptic('success')}
                    className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    id="stack-order-whatsapp-btn"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Order Stack on WhatsApp ({formatPrice(currentStackData.bundlePrice)})</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
