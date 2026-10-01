import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MessageCircle, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Target, 
  Award, 
  Scale, 
  Check, 
  Copy, 
  Phone, 
  ExternalLink, 
  Flame, 
  Dumbbell, 
  Layers, 
  Zap, 
  ChevronRight, 
  HelpCircle,
  Clock,
  HeartPulse,
  Info
} from 'lucide-react';
import { STORE_INFO } from '../types';
import { buildWhatsAppUrl, WhatsAppLine } from '../utils/whatsapp';
import { triggerHaptic } from '../utils/haptics';

export interface NutritionExpertModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGoal?: string;
}

export type FitnessGoal = 
  | 'lean_muscle'
  | 'mass_gain'
  | 'fat_loss'
  | 'stamina_army'
  | 'powerlifting'
  | 'wellness';

export type ExperienceLevel = 
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'athlete';

export type BudgetTier = 
  | 'starter'
  | 'core'
  | 'elite';

export type DietType = 
  | 'vegetarian'
  | 'non_veg'
  | 'eggetarian'
  | 'vegan';

export const FITNESS_GOALS_LIST = [
  {
    id: 'lean_muscle' as FitnessGoal,
    title: 'Lean Muscle & Definition',
    subtitle: 'Build dense, toned muscle while keeping body fat low',
    icon: '🏋️‍♂️',
    coreProduct: 'Whey Protein Isolate / Concentrated Blend',
    synergies: ['Creatine Monohydrate', 'Omega-3 Fish Oil', 'Multivitamin'],
    badge: 'Most Popular',
  },
  {
    id: 'mass_gain' as FitnessGoal,
    title: 'Mass Bulking & Weight Gain',
    subtitle: 'Fast calorie surplus, size & weight gain for hardgainers',
    icon: '⚡',
    coreProduct: 'High-Calorie Mass Gainer',
    synergies: ['Creatine Monohydrate', 'Peanut Butter / Oats', 'Digestive Enzymes'],
    badge: 'Hardgainer Special',
  },
  {
    id: 'fat_loss' as FitnessGoal,
    title: 'Fat Loss & Shredding',
    subtitle: 'Drop excess body fat, preserve muscle & boost metabolism',
    icon: '🔥',
    coreProduct: 'Zero-Carb 100% Whey Isolate',
    synergies: ['L-Carnitine Liquid', 'Green Tea Extract / CLA', 'BCAA / Electrolytes'],
    badge: 'Summer Shred',
  },
  {
    id: 'stamina_army' as FitnessGoal,
    title: 'Army Bharti & Athletic Endurance',
    subtitle: '1600m running stamina, joint recovery & high cardio output',
    icon: '🏃‍♂️',
    coreProduct: 'Clean Whey + Fast Acting Carbs',
    synergies: ['Pre-Workout Stamina Blend', 'Joint Support Glucosamine', 'Electrolytes'],
    badge: 'Bharti & Sports',
  },
  {
    id: 'powerlifting' as FitnessGoal,
    title: 'Strength & Powerlifting',
    subtitle: 'Heavy compound PRs (Squat, Bench, Deadlift) & fast ATP recovery',
    icon: '💥',
    coreProduct: 'Whey Blend + High Dose Creatine Creapure',
    synergies: ['Beta-Alanine', 'Caffeine Matrix', 'ZMA & Ashwagandha'],
    badge: 'Raw Power',
  },
  {
    id: 'wellness' as FitnessGoal,
    title: 'General Health & Daily Vitality',
    subtitle: 'Daily protein targets, immune health, bone density & energy',
    icon: '🌿',
    coreProduct: 'Daily Wellness Protein / Plant Protein',
    synergies: ['Triple Strength Fish Oil', 'Daily Multivitamin & Zinc', 'Vitamin D3 & K2'],
    badge: 'Healthy Living',
  },
];

export const EXPERIENCE_LEVELS = [
  { id: 'beginner' as ExperienceLevel, label: 'Beginner (0–6 Months)', desc: 'Starting gym journey or first time with supplements' },
  { id: 'intermediate' as ExperienceLevel, label: 'Intermediate (6m–2 Yrs)', desc: 'Regular training with solid exercise routine' },
  { id: 'advanced' as ExperienceLevel, label: 'Advanced (2+ Years)', desc: 'Heavy lifter aiming for competitive or peak aesthetics' },
  { id: 'athlete' as ExperienceLevel, label: 'Army / Sports Athlete', desc: 'Running, outdoor field drills & functional stamina' },
];

export const BUDGET_TIERS = [
  { 
    id: 'starter' as BudgetTier, 
    label: '₹1,500 – ₹3,000 / month', 
    name: 'Starter / Student Stack', 
    desc: 'High-value essentials (e.g. Budget Whey or Creatine + Multivitamin)' 
  },
  { 
    id: 'core' as BudgetTier, 
    label: '₹3,000 – ₹6,000 / month', 
    name: 'Core Performance Stack', 
    desc: 'Complete stack (Whey Protein + Creatine + Pre-workout / Fish Oil)' 
  },
  { 
    id: 'elite' as BudgetTier, 
    label: '₹6,000 – ₹10,000+ / month', 
    name: 'Elite Pro Stack', 
    desc: 'Premium imported Brands (ON, Dymatize, Muscletech) + full synergy' 
  },
];

export const DIET_OPTIONS = [
  { id: 'vegetarian' as DietType, label: 'Vegetarian', icon: '🥦' },
  { id: 'non_veg' as DietType, label: 'Non-Vegetarian', icon: '🍗' },
  { id: 'eggetarian' as DietType, label: 'Eggetarian', icon: '🍳' },
  { id: 'vegan' as DietType, label: 'Vegan / Plant', icon: '🌱' },
];

export const COMMON_SUPPLEMENTS = [
  'Whey Protein',
  'Creatine Monohydrate',
  'Mass Gainer',
  'Pre-Workout',
  'Multivitamin / Fish Oil',
  'BCAA / EAA',
  'Fat Burner / L-Carnitine',
  'None (First Time User)',
];

export const QUICK_QUESTIONS = [
  'Is Creatine safe for daily long-term use?',
  'Best budget whey protein for students in Israna?',
  'How to verify genuine scratch code & importer hologram?',
  'Vegetarian high-protein diet chart recommendation?',
  'Can I take mass gainer without gym workouts?',
  'Best pre-workout for high energy without jitters?',
];

export const NutritionExpertModal: React.FC<NutritionExpertModalProps> = ({
  isOpen,
  onClose,
  initialGoal,
}) => {
  // Form State
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>(() => {
    if (initialGoal) {
      const match = FITNESS_GOALS_LIST.find(g => g.id === initialGoal);
      if (match) return match.id;
    }
    return 'lean_muscle';
  });

  const [experience, setExperience] = useState<ExperienceLevel>('intermediate');
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('core');
  const [diet, setDiet] = useState<DietType>('vegetarian');
  
  // Body metrics
  const [weightKg, setWeightKg] = useState<string>('70');
  const [heightFt, setHeightFt] = useState<string>("5'9");
  const [age, setAge] = useState<string>('24');
  const [workoutDays, setWorkoutDays] = useState<number>(5);

  // Supplements & notes
  const [usedSupplements, setUsedSupplements] = useState<string[]>(['Whey Protein']);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<WhatsAppLine>('line2'); // Line 2 default for expert guidance
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'blueprint' | 'preview'>('profile');

  const activeGoalConfig = useMemo(() => {
    return FITNESS_GOALS_LIST.find(g => g.id === selectedGoal) || FITNESS_GOALS_LIST[0];
  }, [selectedGoal]);

  const activeBudgetConfig = useMemo(() => {
    return BUDGET_TIERS.find(b => b.id === budgetTier) || BUDGET_TIERS[1];
  }, [budgetTier]);

  const activeExperienceConfig = useMemo(() => {
    return EXPERIENCE_LEVELS.find(e => e.id === experience) || EXPERIENCE_LEVELS[1];
  }, [experience]);

  const toggleSupplement = (supp: string) => {
    triggerHaptic('light');
    if (supp === 'None (First Time User)') {
      setUsedSupplements(['None (First Time User)']);
      return;
    }
    setUsedSupplements(prev => {
      const filtered = prev.filter(s => s !== 'None (First Time User)');
      if (filtered.includes(supp)) {
        return filtered.filter(s => s !== supp);
      } else {
        return [...filtered, supp];
      }
    });
  };

  const handleSelectQuickQuestion = (q: string) => {
    triggerHaptic('light');
    setCustomQuestion(prev => {
      if (!prev) return q;
      if (prev.includes(q)) return prev;
      return `${prev}\n• ${q}`;
    });
  };

  // Compile Structured Consultation Message for WhatsApp
  const compiledMessage = useMemo(() => {
    const goalTitle = activeGoalConfig.title;
    const expLabel = activeExperienceConfig.label;
    const budgetLabel = activeBudgetConfig.name;
    const dietLabel = DIET_OPTIONS.find(d => d.id === diet)?.label || 'Vegetarian';
    const suppsList = usedSupplements.length > 0 ? usedSupplements.join(', ') : 'First time user';
    const noteContent = customQuestion.trim() ? `\n\n💬 *My Query / Question:* \n"${customQuestion.trim()}"` : '';

    return `*AD NUTRITION HUB ISRANA — EXPERT CONSULTATION REQUEST* 🙏
Store: Mandi Mor, Israna (Panipat, Haryana)

👤 *Athlete / Customer Profile:*
• Goal: *${goalTitle}*
• Experience: ${expLabel}
• Body Stats: ${weightKg || '70'} kg | ${heightFt || "5'9\""} | Age: ${age || '24'}
• Training: ${workoutDays} days/week
• Diet Type: ${dietLabel}

💰 *Budget & Stack Preference:*
• Monthly Budget: *${activeBudgetConfig.label}* (${budgetLabel})
• Supplements Used So Far: ${suppsList}

⭐ *Recommended Stack Focus:*
• Primary: ${activeGoalConfig.coreProduct}
• Suggested Synergies: ${activeGoalConfig.synergies.join(', ')}

Namaste Akshay Bhai! Mujhe is goal ke according authentic batch-verified supplements, current in-store offers aur best dosage timing suggest karein.${noteContent}`;
  }, [
    activeGoalConfig,
    activeExperienceConfig,
    activeBudgetConfig,
    weightKg,
    heightFt,
    age,
    workoutDays,
    diet,
    usedSupplements,
    customQuestion
  ]);

  const handleSendToWhatsApp = () => {
    triggerHaptic('success');
    const targetPhone = selectedLine === 'line2' ? STORE_INFO.rawPhone2 : STORE_INFO.rawPhone1;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(compiledMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = async () => {
    triggerHaptic('medium');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(compiledMessage);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = compiledMessage;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
        id="nutrition-expert-modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            triggerHaptic('light');
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24, mass: 0.8 }}
          className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          id="nutrition-expert-modal-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="relative px-5 py-4 sm:px-6 sm:py-5 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/25 shrink-0">
                <Sparkles className="w-5 h-5 text-neutral-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Nutrition Expert Consultation
                  </h3>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Free Store Guidance</span>
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Customized stack recommendation directly from store founder & coach Akshay Malik
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              id="nutrition-expert-modal-close-btn"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center border-b border-neutral-800 bg-neutral-950/70 px-4 sm:px-6 shrink-0 overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('profile');
              }}
              className={`py-3 px-3 sm:px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>1. Your Goals & Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('blueprint');
              }}
              className={`py-3 px-3 sm:px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'blueprint'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Recommended Blueprint</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('preview');
              }}
              className={`py-3 px-3 sm:px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'preview'
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>3. WhatsApp Preview & Routing</span>
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* 1. Goal Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs uppercase font-extrabold tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-amber-400" />
                      <span>Select Your Primary Fitness Goal:</span>
                    </label>
                    <span className="text-[11px] text-neutral-400">Step 1 of 4</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {FITNESS_GOALS_LIST.map((goal) => {
                      const isSelected = selectedGoal === goal.id;
                      return (
                        <div
                          key={goal.id}
                          onClick={() => {
                            triggerHaptic('light');
                            setSelectedGoal(goal.id);
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-neutral-800/90 border-amber-400 ring-2 ring-amber-400/25 shadow-lg shadow-amber-500/10'
                              : 'bg-neutral-950/70 hover:bg-neutral-800/60 border-neutral-800 text-neutral-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-2xl">{goal.icon}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                                {goal.badge}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-white mb-1">
                              {goal.title}
                            </h4>
                            <p className="text-[11px] text-neutral-400 leading-snug">
                              {goal.subtitle}
                            </p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-amber-400 font-semibold">
                            <span>Core: {goal.coreProduct.split(' ')[0]}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Experience Level & Training Days */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase font-extrabold tracking-wider text-neutral-300 mb-2.5 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Training Experience:</span>
                    </label>
                    <div className="space-y-1.5">
                      {EXPERIENCE_LEVELS.map((exp) => (
                        <div
                          key={exp.id}
                          onClick={() => {
                            triggerHaptic('light');
                            setExperience(exp.id);
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            experience === exp.id
                              ? 'bg-neutral-800 border-amber-400 text-white'
                              : 'bg-neutral-950/60 hover:bg-neutral-800/50 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-white">{exp.label}</p>
                            <p className="text-[10px] text-neutral-400">{exp.desc}</p>
                          </div>
                          {experience === exp.id && (
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase font-extrabold tracking-wider text-neutral-300 mb-2.5 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-amber-400" />
                      <span>Body Stats & Routine:</span>
                    </label>

                    <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-semibold block mb-1">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            value={weightKg}
                            onChange={(e) => setWeightKg(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                            placeholder="70"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-semibold block mb-1">
                            Height
                          </label>
                          <input
                            type="text"
                            value={heightFt}
                            onChange={(e) => setHeightFt(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                            placeholder="5'9"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-semibold block mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                            placeholder="24"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-neutral-400 font-semibold">Workout Days:</span>
                          <span className="font-bold text-amber-400">{workoutDays} days / week</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {[2, 3, 4, 5, 6, 7].map((days) => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setWorkoutDays(days);
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                workoutDays === days
                                  ? 'bg-amber-400 text-neutral-950 font-black'
                                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              {days}d
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-neutral-400 font-semibold block mb-1.5">
                          Diet Type:
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {DIET_OPTIONS.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setDiet(d.id);
                              }}
                              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                                diet === d.id
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                                  : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-400 border border-transparent'
                              }`}
                            >
                              <span>{d.icon}</span>
                              <span className="truncate">{d.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Budget Range */}
                <div>
                  <label className="text-xs uppercase font-extrabold tracking-wider text-neutral-300 mb-2.5 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Monthly Budget Range:</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {BUDGET_TIERS.map((tier) => {
                      const isSelected = budgetTier === tier.id;
                      return (
                        <div
                          key={tier.id}
                          onClick={() => {
                            triggerHaptic('light');
                            setBudgetTier(tier.id);
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-800 border-amber-400 ring-2 ring-amber-400/20'
                              : 'bg-neutral-950/60 hover:bg-neutral-800/40 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-amber-400">{tier.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <h5 className="text-xs font-bold text-white mb-0.5">{tier.name}</h5>
                          <p className="text-[10px] text-neutral-400 leading-snug">{tier.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Supplements Already Tried */}
                <div>
                  <label className="text-xs uppercase font-extrabold tracking-wider text-neutral-300 mb-2 flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-amber-400" />
                    <span>Supplements You Have Used or Currently Use (Select multiple):</span>
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {COMMON_SUPPLEMENTS.map((supp) => {
                      const isChecked = usedSupplements.includes(supp);
                      return (
                        <button
                          key={supp}
                          type="button"
                          onClick={() => toggleSupplement(supp)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                              : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                          }`}
                        >
                          {isChecked ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />}
                          <span>{supp}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Quick Questions & Custom Note */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase font-extrabold tracking-wider text-neutral-300 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span>Specific Doubts or Goals:</span>
                    </label>
                    <span className="text-[11px] text-neutral-500">Tap to auto-add</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSelectQuickQuestion(q)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-amber-300 transition-colors text-left"
                      >
                        + {q}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Type any specific requirement, e.g.: 'Mujhe 2 months mein 5kg muscle gain karni hai, lactose sensitive hu aur student budget me chahiye...'"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Bottom Step Forward Button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      setActiveTab('blueprint');
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 font-bold text-xs sm:text-sm hover:from-amber-400 hover:to-yellow-400 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <span>View Recommended Stack Blueprint</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'blueprint' && (
              <div className="space-y-6">
                {/* Blueprint Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-amber-500/30 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{activeGoalConfig.icon}</span>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                          Personalized Recommendation
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-white">
                          {activeGoalConfig.title} Stack
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block">Est. Budget Range</span>
                      <span className="text-xs font-bold text-amber-400">{activeBudgetConfig.label}</span>
                    </div>
                  </div>

                  {/* Core Foundation Supplement */}
                  <div className="space-y-3 mb-5">
                    <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs sm:text-sm font-bold text-white">
                            Primary Core: {activeGoalConfig.coreProduct}
                          </h5>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300">
                            Essential
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">
                          Primary protein/energy source to hit your target of ~{Math.round(Number(weightKg || 70) * 1.8)}g daily protein for clean recovery.
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Timing: Post-workout within 30–45 mins with cold water</span>
                        </div>
                      </div>
                    </div>

                    {/* Synergistic Add-ons */}
                    <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-emerald-400" />
                          <span>Synergistic Catalysts & Health Recovery:</span>
                        </h5>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          Multipliers
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {activeGoalConfig.synergies.map((syn, idx) => (
                          <div 
                            key={syn}
                            className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs flex flex-col justify-between"
                          >
                            <span className="font-bold text-white text-xs">{syn}</span>
                            <span className="text-[10px] text-neutral-400 mt-1">
                              {idx === 0 ? 'ATP & Muscle Volume' : idx === 1 ? 'Joints & Inflammation' : 'Immune & Vitality'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Trust Callout */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>100% Genuine Direct Importer Verified Products. Every tub scratch code verified before billing at Israna.</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveTab('profile');
                    }}
                    className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-750 transition-colors cursor-pointer"
                  >
                    ← Edit Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      setActiveTab('preview');
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <span>Proceed to WhatsApp Routing</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="space-y-6">
                {/* Store Line Selection */}
                <div>
                  <label className="text-xs uppercase font-extrabold tracking-wider text-neutral-300 mb-2.5 block">
                    Choose Consultation Line:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedLine('line2');
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedLine === 'line2'
                          ? 'bg-neutral-800/90 border-emerald-400 ring-2 ring-emerald-400/20'
                          : 'bg-neutral-950/70 hover:bg-neutral-800 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          <span className="text-xs font-black text-white">Line 2 — Akshay Malik</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-400/20 text-emerald-300">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-emerald-400 font-bold">{STORE_INFO.phone2}</p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Direct supplement guidance, customized diet advice & dosage consultation
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedLine('line1');
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedLine === 'line1'
                          ? 'bg-neutral-800/90 border-amber-400 ring-2 ring-amber-400/20'
                          : 'bg-neutral-950/70 hover:bg-neutral-800 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          <span className="text-xs font-black text-white">Line 1 — Store Order Desk</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300">
                          Fast Orders
                        </span>
                      </div>
                      <p className="text-xs text-amber-400 font-bold">{STORE_INFO.phone}</p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Fast in-store inventory check, product reservation & pickup
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compiled WhatsApp Message Preview Box */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span>Pre-filled WhatsApp Consultation Message:</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto select-all shadow-inner">
                    {compiledMessage}
                  </div>
                </div>

                {/* Quick Call Direct Option */}
                <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Prefer speaking on phone? Call directly:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`tel:${STORE_INFO.phone}`}
                      className="text-amber-400 font-bold hover:underline"
                    >
                      {STORE_INFO.phone}
                    </a>
                    <span className="text-neutral-600">•</span>
                    <a
                      href={`tel:${STORE_INFO.phone2}`}
                      className="text-emerald-400 font-bold hover:underline"
                    >
                      {STORE_INFO.phone2}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Akshay Malik Online • Ready for Consultation</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs sm:text-sm font-semibold transition-colors flex-1 sm:flex-none cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSendToWhatsApp}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all flex-1 sm:flex-none cursor-pointer"
                id="send-nutrition-expert-whatsapp-btn"
              >
                <MessageCircle className="w-4 h-4 fill-neutral-950 text-neutral-950" />
                <span>Send to WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-950" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
