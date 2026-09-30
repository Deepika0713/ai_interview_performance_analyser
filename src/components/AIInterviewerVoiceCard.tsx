import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Square, Sparkles, Bot, Radio, Play } from 'lucide-react';

interface AIInterviewerVoiceCardProps {
  questionText: string;
  roleName: string;
  categoryName?: string;
  autoSpeak?: boolean;
}

export const AIInterviewerVoiceCard: React.FC<AIInterviewerVoiceCardProps> = ({
  questionText,
  roleName,
  categoryName = 'Evaluation Prompt',
  autoSpeak = false,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoSpeak);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        // Find best English voice (Google US English, Samantha, Natural, etc.)
        const preferred = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Karen'))
        );
        if (preferred) {
          setSelectedVoiceName(preferred.name);
        } else {
          const anyEn = voices.find((v) => v.lang.startsWith('en'));
          if (anyEn) setSelectedVoiceName(anyEn.name);
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    setHasUserInteracted(true);
    window.speechSynthesis.cancel();

    // Clean text of markdown formatting
    const cleaned = text
      .replace(/[*_~`]/g, '')
      .replace(/•/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (selectedVoiceName && availableVoices.length > 0) {
      const voice = availableVoices.find((v) => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis event:', e);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Trigger speak when questionText changes if autoPlay is enabled and user has interacted
  useEffect(() => {
    if (autoPlayEnabled && hasUserInteracted && questionText) {
      speakText(questionText);
    }
  }, [questionText]);

  return (
    <div className="rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Persona & Speaking Status */}
        <div className="flex items-start gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Bot className="w-6 h-6" />
            </div>
            {isSpeaking && (
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                Alex
                <span className="text-xs font-normal text-indigo-300">
                  • AI Interview Lead
                </span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isSpeaking
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60'
                    : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40'
                }`}
              >
                {isSpeaking ? '🔊 Speaking Aloud...' : '🟢 Voice Ready'}
              </span>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 italic">
              "{questionText}"
            </p>
          </div>
        </div>

        {/* Right: Audio Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Audio Wave Visualizer when speaking */}
          {isSpeaking && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-950/50 border border-indigo-800/50 mr-1">
              <div className="w-1 h-3.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1 h-5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce" />
              <div className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
            </div>
          )}

          {!isSpeaking ? (
            <button
              onClick={() => speakText(questionText)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              <span>Speak Question Aloud</span>
            </button>
          ) : (
            <button
              onClick={stopSpeaking}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/20 active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Voice</span>
            </button>
          )}

          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer hover:text-slate-200 select-none ml-1 bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={autoPlayEnabled}
              onChange={(e) => {
                setAutoPlayEnabled(e.target.checked);
                setHasUserInteracted(true);
              }}
              className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0 w-3 h-3"
            />
            <span>Auto-speak prompts</span>
          </label>
        </div>
      </div>
    </div>
  );
};
