import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles, 
  User, 
  Calendar, 
  Trash2, 
  Send, 
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Review } from '../types';
import { 
  fetchProductReviews, 
  subscribeToProductReviews, 
  addProductReview, 
  deleteProductReview 
} from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../utils/haptics';

interface ProductReviewsProps {
  productId: string;
  productName: string;
  isAdmin?: boolean;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  5: '⭐⭐⭐⭐⭐ Excellent / 100% Genuine',
  4: '⭐⭐⭐⭐ Very Good & Effective',
  3: '⭐⭐⭐ Average Quality',
  2: '⭐⭐ Below Expectations',
  1: '⭐ Poor'
};

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  productName,
  isAdmin = false
}) => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Review Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('ad_nutrition_reviewer_name') || currentUser?.displayName || '';
  });
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load reviews and real-time subscription
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchProductReviews(productId)
      .then((data) => {
        if (isMounted) {
          setReviews(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Initial reviews fetch failed:', err);
        if (isMounted) setIsLoading(false);
      });

    const unsubscribe = subscribeToProductReviews(productId, (updated) => {
      if (isMounted) {
        setReviews(updated);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [productId]);

  // Compute average rating
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating)));
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = userName.trim();
    const trimmedComment = comment.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your name (at least 2 characters).');
      return;
    }

    if (!trimmedComment || trimmedComment.length < 3) {
      setErrorMessage('Please leave a brief review comment (at least 3 characters).');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      localStorage.setItem('ad_nutrition_reviewer_name', trimmedName);

      const newReview = await addProductReview(productId, {
        userName: trimmedName,
        rating,
        comment: trimmedComment,
        ...(currentUser?.uid ? { userId: currentUser.uid } : {})
      });

      // Update state immediately if not already updated by snapshot
      setReviews((prev) => [newReview, ...prev.filter(r => r.id !== newReview.id)]);
      setComment('');
      setSuccessMessage('Thank you! Your verified review has been published.');
      setShowForm(false);
      triggerHaptic('success');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setErrorMessage(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Delete this customer review?')) return;
    triggerHaptic('light');

    try {
      await deleteProductReview(productId, reviewId);
      setReviews((prev) => prev.filter(r => r.id !== reviewId));
    } catch (err) {
      console.error('Delete review error:', err);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-5 pt-4 border-t border-neutral-800" id={`product-reviews-${productId}`}>
      {/* Header & Rating Snapshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Customer Reviews & Ratings</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
              {reviews.length}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Verified ratings from local gym athletes and store buyers in Israna & Panipat
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setShowForm(!showForm);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/10 transition-colors cursor-pointer self-start sm:self-auto"
          id="btn-toggle-review-form"
        >
          <Star className="w-3.5 h-3.5 fill-neutral-950" />
          <span>{showForm ? 'Close Form' : 'Write a Review'}</span>
          {showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Rating Summary Bar Card */}
      <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col md:flex-row items-center gap-6">
        {/* Left: Score */}
        <div className="text-center md:text-left shrink-0">
          <div className="flex items-baseline justify-center md:justify-start gap-1.5">
            <span className="text-4xl font-black text-white tracking-tight">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-neutral-500 text-sm font-semibold">/ 5.0</span>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-1 mt-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(averageRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-neutral-700'
                }`}
              />
            ))}
          </div>

          <span className="text-[11px] text-neutral-400 font-medium block mt-1">
            {reviews.length === 0 ? 'No reviews yet' : `${reviews.length} verified feedback${reviews.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Right: Star Distribution Bars */}
        <div className="flex-1 w-full space-y-1.5 border-t md:border-t-0 md:border-l border-neutral-800 md:pl-6 pt-3 md:pt-0">
          {[5, 4, 3, 2, 1].map((s) => {
            const count = ratingCounts[s] || 0;
            const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
            return (
              <div key={s} className="flex items-center gap-2.5 text-xs text-neutral-400">
                <span className="w-8 flex items-center gap-0.5 text-[11px] font-semibold text-neutral-300">
                  {s} <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] text-neutral-500 font-medium">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write Review Form Card (Collapsible) */}
      {showForm && (
        <form 
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl bg-neutral-900 border border-amber-500/30 shadow-xl space-y-4 animate-fadeIn"
          id="product-review-form"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Write a Review for {productName}
              </h4>
            </div>
            <span className="text-[11px] text-amber-400 font-semibold">5-Star Scale</span>
          </div>

          {/* Interactive Star Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 block">
              Your Rating: <span className="text-amber-400 font-bold ml-1">{RATING_DESCRIPTIONS[hoverRating || rating]}</span>
            </label>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setRating(star);
                  }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer group"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`w-7 h-7 transition-all ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'text-neutral-600 group-hover:text-neutral-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* User Name Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Your Name *</span>
              <span className="text-[10px] text-neutral-500">Displayed with your review</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-neutral-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                maxLength={60}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs font-semibold placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                id="review-name-input"
              />
            </div>
          </div>

          {/* Review Comment Textarea */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Your Comment / Experience *</span>
              <span className="text-[10px] text-neutral-500">{comment.length}/500</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the supplement taste, mixability, digestion, and workout recovery results? Did you verify the importer scratch code?"
              rows={3}
              maxLength={500}
              required
              className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs leading-relaxed placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
              id="review-comment-input"
            />
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Published permanently on AD Nutrition Hub</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                id="btn-submit-review"
              >
                {isSubmitting ? (
                  <span>Posting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading verified reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-neutral-900/40 border border-dashed border-neutral-800 space-y-2">
            <Star className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-xs font-bold text-white">No reviews yet for this product</p>
            <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
              Have you tried this supplement? Be the first to share your rating and workout results with the Israna fitness community!
            </p>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowForm(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>Leave First Review</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div 
                key={rev.id} 
                className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700/80 transition-all space-y-2.5 relative group"
                id={`review-item-${rev.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* User Avatar Initial */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-neutral-800 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-xs">
                      {rev.userName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{rev.userName}</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Verified Store Buyer</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-neutral-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{formatDate(rev.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admin or Author Delete */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(rev.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/40 transition-all"
                      title="Delete review (Admin)"
                      id={`delete-review-btn-${rev.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Review Text */}
                <p className="text-xs text-neutral-300 leading-relaxed pl-10 whitespace-pre-line">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
