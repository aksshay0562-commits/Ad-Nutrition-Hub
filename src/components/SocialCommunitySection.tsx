import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Instagram, 
  Facebook, 
  Users, 
  Sparkles, 
  ExternalLink, 
  Heart, 
  MessageCircle, 
  Share2, 
  Gift, 
  BadgePercent, 
  Camera, 
  Check, 
  ShieldCheck, 
  Flame,
  ThumbsUp,
  Award
} from 'lucide-react';
import { STORE_INFO } from '../types';
import { triggerHaptic } from '../utils/haptics';

export const SocialCommunitySection: React.FC = () => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCommunityLink = async () => {
    triggerHaptic('medium');
    const shareText = `Join the AD Nutrition Hub Israna Fitness Community! Follow on Instagram: ${STORE_INFO.instagram} and Facebook: ${STORE_INFO.facebook}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSocialClick = (platform: 'instagram' | 'facebook') => {
    triggerHaptic('light');
  };

  return (
    <section 
      id="community" 
      className="py-16 sm:py-20 bg-gradient-to-b from-neutral-900/60 via-neutral-950 to-neutral-900/80 border-t border-neutral-800 relative overflow-hidden"
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Users className="w-3.5 h-3.5 text-pink-400" />
            <span>Join 5,000+ Haryana Fitness Enthusiasts</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Connect With Our Fitness Community on{' '}
            <span className="bg-gradient-to-r from-pink-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              Instagram
            </span>{' '}
            &{' '}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Facebook
            </span>
          </h2>

          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            Follow AD Nutrition Hub Israna for daily unboxings, authentic batch code checks, local transformation stories, diet guidance, and follower-exclusive flash discounts.
          </p>
        </div>

        {/* Dual Primary Social Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12">
          {/* Instagram Showcase Card */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-neutral-900/90 border border-neutral-800 hover:border-pink-500/40 p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-black/40 relative overflow-hidden group"
            id="community-instagram-card"
          >
            {/* Top Instagram Gradient Banner */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600" />

            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {/* Story Gradient Ring Avatar */}
                  <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                    <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center font-black text-amber-400 text-lg border-2 border-neutral-900">
                      AD
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base sm:text-lg font-extrabold text-white">
                        @ad_nutrition_hub_israna
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-pink-500" title="Active on Instagram" />
                    </div>
                    <p className="text-xs text-neutral-400 font-medium">
                      AD Nutrition Hub • Israna, Panipat
                    </p>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 shadow-inner">
                  <Instagram className="w-5 h-5" />
                </div>
              </div>

              {/* Bio & Community Stats */}
              <div className="space-y-2 text-xs text-neutral-300">
                <p className="leading-relaxed">
                  🏋️ Haryana's Most Trusted Nutrition Store at Mandi Mor, Israna.<br />
                  🥛 100% Genuine Importer Stocks • GST Invoices • Scratch Verification Codes.<br />
                  ⚡ Daily Reels, Workout Motivation & Student Diet Plans.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center">
                    <span className="text-sm sm:text-base font-black text-white block">5.2K+</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Followers</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center">
                    <span className="text-sm sm:text-base font-black text-pink-400 block">Daily</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Reels & Tips</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center">
                    <span className="text-sm sm:text-base font-black text-amber-400 block">100%</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Authentic</span>
                  </div>
                </div>
              </div>

              {/* Recent Content Showcase Pills */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Trending On Our Instagram Page:
                </span>
                <div className="space-y-1.5">
                  <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 flex items-center gap-2.5 text-xs text-neutral-300">
                    <Flame className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="truncate">📦 Live Unboxings with Brand Verification Scratch Checks</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 flex items-center gap-2.5 text-xs text-neutral-300">
                    <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="truncate">💪 Local Gym Transformations & Bulking Diet Advice</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 flex items-center gap-2.5 text-xs text-neutral-300">
                    <BadgePercent className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">🔥 Flash Sale Announcements & Weekend Combo Discounts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-6 mt-6 border-t border-neutral-800/80">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                href={STORE_INFO.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSocialClick('instagram')}
                className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:from-amber-400 hover:via-pink-400 hover:to-purple-500 text-white font-black text-sm shadow-lg shadow-pink-900/30 transition-all cursor-pointer"
                id="community-instagram-follow-btn"
              >
                <Instagram className="w-4 h-4" />
                <span>Follow on Instagram (@ad_nutrition_hub_israna)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </motion.a>
            </div>
          </motion.div>

          {/* Facebook Community Card */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-neutral-900/90 border border-neutral-800 hover:border-blue-500/40 p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-black/40 relative overflow-hidden group"
            id="community-facebook-card"
          >
            {/* Top Facebook Blue Banner */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />

            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                    <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center font-black text-blue-400 text-lg border-2 border-neutral-900">
                      AD
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base sm:text-lg font-extrabold text-white">
                        AD Nutrition Hub Israna
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-blue-500" title="Active on Facebook" />
                    </div>
                    <p className="text-xs text-neutral-400 font-medium">
                      Official Facebook Page • Nutrition & Health
                    </p>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                  <Facebook className="w-5 h-5" />
                </div>
              </div>

              {/* Bio & Community Stats */}
              <div className="space-y-2 text-xs text-neutral-300">
                <p className="leading-relaxed">
                  🤝 Join our active Facebook community of fitness athletes, powerlifters, and gym owners across Israna, Panipat, and Haryana.<br />
                  💬 Ask questions, leave verified store feedback, and interact with the team.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center">
                    <span className="text-sm sm:text-base font-black text-white block">4.9 / 5</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Top Rating</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center">
                    <span className="text-sm sm:text-base font-black text-blue-400 block">Verified</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Store Page</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center">
                    <span className="text-sm sm:text-base font-black text-emerald-400 block">100%</span>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Direct Reply</span>
                  </div>
                </div>
              </div>

              {/* Highlights List */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Why Connect on Facebook:
                </span>
                <div className="space-y-1.5">
                  <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 flex items-center gap-2.5 text-xs text-neutral-300">
                    <ThumbsUp className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">⭐ Read Customer Reviews & Genuine Feedback from Haryana Gymmers</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 flex items-center gap-2.5 text-xs text-neutral-300">
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">💬 Ask Questions on Supplements, Creatine Cycle & Protein Timing</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 flex items-center gap-2.5 text-xs text-neutral-300">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">📢 Stock Restock Alerts for Optimum Nutrition, MuscleBlaze, Avvatar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-6 mt-6 border-t border-neutral-800/80">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                href={STORE_INFO.facebook}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSocialClick('facebook')}
                className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
                id="community-facebook-follow-btn"
              >
                <Facebook className="w-4 h-4" />
                <span>Join Facebook Community (Like & Follow)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Community Perks Grid (4 Value Props) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Gift className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Monthly Giveaways
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Followers on Instagram and Facebook are automatically eligible for monthly gym shakers, wrist wraps, and supplement giveaways.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/25 flex items-center justify-center text-pink-400">
              <BadgePercent className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Follower-Exclusive Deals
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Flash discount codes and weekend offers are published directly on our Instagram Stories and Facebook posts first.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <MessageCircle className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Direct DM Fast Support
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Send a DM on Instagram or Facebook Messenger for personalized stack suggestions, diet tips, and current store availability.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <Camera className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Tag Us to Get Featured
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Tag @ad_nutrition_hub_israna in your gym workout stories or unboxings to be featured on our official store pages.
            </p>
          </div>
        </div>

        {/* Share Social Links Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-750 flex items-center justify-center text-amber-400 shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Know someone passionate about fitness in Haryana?</span>
              <span className="text-neutral-400 text-[11px]">Share AD Nutrition Hub's Instagram & Facebook links with your workout partner!</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyCommunityLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-bold transition-all cursor-pointer"
              id="copy-community-links-btn"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Social Links Copied!' : 'Copy Social Links'}</span>
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out AD Nutrition Hub Israna! Official Instagram: ${STORE_INFO.instagram} | Facebook: ${STORE_INFO.facebook} - 100% Genuine Nutrition Supplements at Mandi Mor, Israna!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 cursor-pointer"
              id="share-community-whatsapp-btn"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>Share on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
