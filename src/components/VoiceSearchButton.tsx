import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

// Browser Web Speech Recognition interface types
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  className?: string;
  id?: string;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onTranscript,
  onListeningChange,
  className = '',
  id = 'catalog-voice-search-btn',
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimText, setInterimText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition capability check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as IWindowWithSpeech;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Notify parent component of listening state changes
  useEffect(() => {
    onListeningChange?.(isListening);
  }, [isListening, onListeningChange]);

  const showTemporaryError = (msg: string) => {
    setErrorMessage(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMessage(null);
    }, 3800);
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;

    const win = window as unknown as IWindowWithSpeech;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      triggerHaptic('error');
      showTemporaryError('Voice search is not supported in this browser. Please use Chrome, Safari or Edge.');
      return;
    }

    try {
      // Abort any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      // 'en-IN' works best for Indian accent & supplement names (Whey, Gainer, Creatine, Avvatar, MuscleBlaze, etc.)
      recognition.lang = 'en-IN';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        triggerHaptic('light');
        setIsListening(true);
        setInterimText('');
        setErrorMessage(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          setInterimText(interim);
        }

        if (final) {
          // Clean up speech output (strip trailing punctuation usually appended by speech engines)
          const cleanText = final.trim().replace(/[.,!?;:]+$/, '');
          triggerHaptic('success');
          onTranscript(cleanText);
          setInterimText('');
          setIsListening(false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        setInterimText('');

        if (event.error === 'not-allowed') {
          triggerHaptic('error');
          showTemporaryError('Microphone permission denied. Allow mic access in browser settings to speak.');
        } else if (event.error === 'no-speech') {
          showTemporaryError('No speech detected. Please tap the mic and speak clearly.');
        } else if (event.error === 'network') {
          showTemporaryError('Network error during voice recognition. Check your connection.');
        } else if (event.error !== 'aborted') {
          showTemporaryError(`Voice search error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start SpeechRecognition:', err);
      setIsListening(false);
      triggerHaptic('error');
      showTemporaryError('Could not start microphone. Please try again.');
    }
  };

  const stopListening = () => {
    triggerHaptic('light');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Microphone Toggle Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.90 }}
        onClick={handleToggle}
        className={`relative p-1 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
          isListening
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/60 shadow-lg shadow-rose-500/25 ring-2 ring-rose-500/40 animate-pulse'
            : !isSupported
            ? 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-400'
            : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 border-neutral-800'
        } ${className}`}
        title={
          isListening
            ? 'Listening... Tap to stop speaking'
            : isSupported
            ? 'Search supplements by voice (Voice-to-Text)'
            : 'Voice search not supported in this browser'
        }
        id={id}
        aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
      >
        {isListening ? (
          <>
            <Mic className="w-3.5 h-3.5 text-rose-400 fill-rose-400/40" />
            {/* Pulsing ring indicator */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          </>
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
      </motion.button>

      {/* Floating Active Voice Banner when Listening */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.94 }}
            className="absolute left-1/2 -translate-x-1/2 -bottom-10 z-40 whitespace-nowrap bg-neutral-900/95 border border-rose-500/40 rounded-full px-3 py-1 shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-[11px] font-bold text-white">
              {interimText ? (
                <>
                  Hearing: <span className="text-amber-400 font-extrabold">"{interimText}"</span>
                </>
              ) : (
                'Listening... Speak supplement name'
              )}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Temporary Error Notice Tooltip */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.94 }}
            className="absolute right-0 -bottom-12 z-50 whitespace-nowrap bg-red-950/95 border border-red-800/80 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1.5 pointer-events-none max-w-xs text-red-200 text-[11px] font-semibold"
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
