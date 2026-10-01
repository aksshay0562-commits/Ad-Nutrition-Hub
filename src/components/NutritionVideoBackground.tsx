import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Film, Sparkles, RefreshCw, Eye, Flame, ChevronDown } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export interface NutritionVideoClip {
  id: string;
  title: string;
  shortName: string;
  category: string;
  src: string;
  poster: string;
  tag: string;
}

export const NUTRITION_VIDEO_CLIPS: NutritionVideoClip[] = [
  {
    id: 'deadlift',
    title: 'Heavy Sumo Deadlift & Raw Power',
    shortName: 'Deadlift & Power',
    category: 'Mass & Strength',
    src: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/29/Free_Weight_Training_Assistive_Exercise-_Assistive_Sumo_Deadlift.webm/Free_Weight_Training_Assistive_Exercise-_Assistive_Sumo_Deadlift.webm.480p.vp9.webm',
    poster: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1920&q=80',
    tag: 'Creatine & Whey Fuel',
  },
  {
    id: 'barbell-jerk',
    title: 'Olympic Barbell Clean & Jerk Drive',
    shortName: 'Olympic Barbell',
    category: 'Explosive Stamina',
    src: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/20/Barbell_Jerk.webm/Barbell_Jerk.webm.480p.vp9.webm',
    poster: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80',
    tag: 'Pre-Workout Energy',
  },
  {
    id: 'dumbbell-press',
    title: 'Hypertrophy Dumbbell Bench Press',
    shortName: 'Dumbbell Press',
    category: 'Chest & Pump',
    src: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Video_showing_how_to_perform_the_dumbbell_bench_press_and_the_dumbbell_incline_bench_press.webm/Video_showing_how_to_perform_the_dumbbell_bench_press_and_the_dumbbell_incline_bench_press.webm.480p.vp9.webm',
    poster: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1920&q=80',
    tag: 'Whey Isolate & BCAA',
  },
];

interface NutritionVideoBackgroundProps {
  className?: string;
  showControls?: boolean;
}

export const NutritionVideoBackground: React.FC<NutritionVideoBackgroundProps> = ({
  className = '',
  showControls = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentClipIndex, setCurrentClipIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [videoOpacity, setVideoOpacity] = useState<'normal' | 'cinematic' | 'high'>('cinematic');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const activeClip = NUTRITION_VIDEO_CLIPS[currentClipIndex];

  // Auto-play enforcement on mount and clip switch
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const playVideo = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Browser autoplay policy might restrict until gesture, keep muted
            video.muted = true;
            video.play().catch(() => {});
          });
      }
    };

    playVideo();
  }, [currentClipIndex]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    triggerHaptic('light');
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const selectClip = (index: number) => {
    triggerHaptic('medium');
    setIsVideoLoaded(false);
    setCurrentClipIndex(index);
    setIsMenuOpen(false);
  };

  // Kinetic Nutrition Particle Canvas Overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes representing nutrition molecules (protein, creatine, amino chains)
    const particleCount = 38;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.45,
      speedY: (Math.random() - 0.5) * 0.45,
      alpha: Math.random() * 0.5 + 0.25,
      hue: Math.random() > 0.4 ? 42 : 155, // Gold amber & Vitality green
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect near particles with faint energetic filaments
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * 0.16;
            ctx.strokeStyle = `rgba(245, 158, 11, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Render glowing particle nodes
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.hue === 42 
          ? `rgba(251, 191, 36, ${p.alpha})` 
          : `rgba(52, 211, 153, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getOpacityClass = () => {
    switch (videoOpacity) {
      case 'high':
        return 'opacity-40 sm:opacity-50';
      case 'normal':
        return 'opacity-30 sm:opacity-35';
      case 'cinematic':
      default:
        return 'opacity-25 sm:opacity-30';
    }
  };

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none select-none ${className}`} id="nutrition-bg-video-container">
      {/* Background HTML5 Auto-Playing Nutrition Video */}
      <video
        ref={videoRef}
        key={activeClip.src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={activeClip.poster}
        onLoadedData={() => setIsVideoLoaded(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className={`absolute inset-0 w-full h-full object-cover object-center scale-105 filter contrast-125 saturate-135 transition-opacity duration-1000 ${getOpacityClass()} ${
          isVideoLoaded ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <source src={activeClip.src} type="video/webm" />
      </video>

      {/* Kinetic Particle & Energy Filament Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen opacity-75"
      />

      {/* Multi-tier Cinematic Contrast Vignettes & Gradient Shading for Text Legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/85 to-neutral-950/75 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-neutral-950/70 pointer-events-none" />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, transparent 20%, rgba(10, 10, 10, 0.7) 70%, rgba(10, 10, 10, 0.95) 100%)',
        }}
      />

      {/* Interactive Top Video Control & Clip Selector (Pointer events enabled on buttons) */}
      {showControls && (
        <div className="absolute top-3 right-4 sm:top-5 sm:right-8 z-20 pointer-events-auto flex items-center gap-2">
          {/* Main Auto-Playing Badge & Toggle */}
          <div className="relative">
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-750 text-neutral-200 text-xs font-semibold shadow-lg backdrop-blur-md transition-all cursor-pointer"
              id="nutrition-video-play-toggle-btn"
              title={isPlaying ? 'Pause background workout video' : 'Play background workout video'}
              aria-label={isPlaying ? 'Pause nutrition background video' : 'Play nutrition background video'}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isPlaying ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isPlaying ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              ) : (
                <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              )}
              <span className="hidden sm:inline text-[11px] font-bold tracking-tight">
                {isPlaying ? 'Nutrition Motion: Playing' : 'Nutrition Motion: Paused'}
              </span>
            </motion.button>
          </div>

          {/* Quick Clip Picker Dropdown */}
          <div className="relative">
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('light');
                setIsMenuOpen(!isMenuOpen)}
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-750 text-neutral-300 text-xs font-medium shadow-lg backdrop-blur-md transition-colors cursor-pointer"
              id="nutrition-video-clip-picker-btn"
              title="Change workout video clip"
              aria-label="Change workout video clip"
            >
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold hidden md:inline">{activeClip.shortName}</span>
              <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Clip Menu Popover */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-neutral-900/95 border border-neutral-750 shadow-2xl p-2.5 space-y-1.5 backdrop-blur-xl z-30"
                  id="nutrition-video-clips-dropdown"
                >
                  <div className="flex items-center justify-between px-2 pb-1 border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>Workout Clips</span>
                    </span>
                    <span className="text-amber-400">Auto-playing</span>
                  </div>

                  {NUTRITION_VIDEO_CLIPS.map((clip, index) => {
                    const isSelected = index === currentClipIndex;
                    return (
                      <button
                        key={clip.id}
                        type="button"
                        onClick={() => selectClip(index)}
                        className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800/90 text-white border border-amber-500/40 shadow-sm'
                            : 'hover:bg-neutral-800/60 text-neutral-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold ${
                            isSelected
                              ? 'bg-amber-400 text-neutral-950 font-black'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate text-[11px]">{clip.shortName}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{clip.tag}</p>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        )}
                      </button>
                    );
                  })}

                  {/* Brightness / Opacity quick selector */}
                  <div className="pt-1.5 border-t border-neutral-800 flex items-center justify-between px-2 text-[10px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-neutral-400" />
                      <span>Video Level:</span>
                    </span>
                    <div className="flex items-center gap-1 font-bold">
                      {(['cinematic', 'normal', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setVideoOpacity(level);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] capitalize transition-colors ${
                            videoOpacity === level
                              ? 'bg-amber-400 text-neutral-950 font-extrabold'
                              : 'bg-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
