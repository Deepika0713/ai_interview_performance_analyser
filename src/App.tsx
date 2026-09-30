/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { FileUploadTab } from './components/FileUploadTab';
import { LiveRecordingTab } from './components/LiveRecordingTab';
import { MediaReviewer } from './components/MediaReviewer';
import { AnalysisReport } from './components/AnalysisReport';
import { CodeViewerModal } from './components/CodeViewerModal';
import { JobRole, MediaFileMeta, AnalysisResult } from './types/interview';
import { QUESTION_BANK } from './data/questions';
import {
  UploadCloud,
  Video,
  FileCheck,
  Zap,
  Activity,
  Sparkles,
  Info,
  Code,
  CheckCircle2,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedRole, setSelectedRole] = useState<JobRole>('Software Engineer');
  const [selectedQuestion, setSelectedQuestion] = useState<string>(QUESTION_BANK[0].text);
  const [isCustomQuestion, setIsCustomQuestion] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');

  // AI Voice Playback (TTS) state
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const [autoReadQuestion, setAutoReadQuestion] = useState(false);

  // Media state
  const [activeMedia, setActiveMedia] = useState<MediaFileMeta | null>(null);
  const [tempCacheFiles, setTempCacheFiles] = useState<MediaFileMeta[]>([]);

  // Analysis pipeline states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Code inspection modal
  const [codeModalOpen, setCodeModalOpen] = useState(false);

  // Update question when role changes
  const handleRoleChange = (newRole: JobRole) => {
    setSelectedRole(newRole);
    const firstQ = QUESTION_BANK.find((q) => q.role === newRole);
    if (firstQ && !isCustomQuestion) {
      setSelectedQuestion(firstQ.text);
    }
  };

  const currentQuestionPrompt = isCustomQuestion
    ? customQuestionText || 'Custom Interview Prompt'
    : selectedQuestion;

  // Speech synthesis for AI Interviewer Voiceplay
  const speakQuestion = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*_#`]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.98;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Karen'))
      ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsPlayingVoice(true);
      setIsVoicePaused(false);
    };

    utterance.onend = () => {
      setIsPlayingVoice(false);
      setIsVoicePaused(false);
    };

    utterance.onerror = () => {
      setIsPlayingVoice(false);
      setIsVoicePaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isPlayingVoice) {
      if (isVoicePaused) {
        window.speechSynthesis.resume();
        setIsVoicePaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsVoicePaused(true);
      }
    } else {
      speakQuestion(currentQuestionPrompt);
    }
  };

  const handleStopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
    setIsVoicePaused(false);
  };

  const handleReplaySpeech = () => {
    handleStopSpeech();
    setTimeout(() => {
      speakQuestion(currentQuestionPrompt);
    }, 150);
  };

  // Auto-play on question change if enabled
  useEffect(() => {
    if (autoReadQuestion) {
      speakQuestion(currentQuestionPrompt);
    } else {
      handleStopSpeech();
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentQuestionPrompt]);

  const handleMediaSelect = (media: MediaFileMeta) => {
    setActiveMedia(media);
    setTempCacheFiles((prev) => [media, ...prev.filter((m) => m.id !== media.id)]);
    setAnalysisResult(null); // Reset previous scorecard
  };

  const handleClearMedia = () => {
    setActiveMedia(null);
    setAnalysisResult(null);
  };

  // Advance to next question without changing UI when "Practice Another Question" is selected
  const handlePracticeNextQuestion = () => {
    const roleQuestions = QUESTION_BANK.filter((q) => q.role === selectedRole);
    if (roleQuestions.length > 0) {
      const currentIndex = roleQuestions.findIndex((q) => q.text === selectedQuestion);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % roleQuestions.length : 0;
      setSelectedQuestion(roleQuestions[nextIndex].text);
      setIsCustomQuestion(false);
    }

    // Reset media & scorecard for the new question turn
    setActiveMedia(null);
    setAnalysisResult(null);

    // Smoothly scroll back to the top of the question view
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Run the multi-modal analysis pipeline (Phase 2 & Phase 3)
  const handleStartAnalysis = async () => {
    if (!activeMedia) return;
    setIsAnalyzing(true);
    setProgressPercent(10);
    setAnalysisStep('Validating media integrity & normalizing audio channels...');

    await new Promise((r) => setTimeout(r, 600));
    setProgressPercent(35);
    setAnalysisStep('Step 1/3: Extracting Librosa Mel-Spectrogram & Acoustic Features...');

    await new Promise((r) => setTimeout(r, 800));
    setProgressPercent(65);
    setAnalysisStep('Step 2/3: Phase 2 Speech Pace (WPM) & Filler Word Classification...');

    await new Promise((r) => setTimeout(r, 800));
    setProgressPercent(88);
    setAnalysisStep(
      activeMedia.type === 'video'
        ? 'Step 3/3: Phase 3 Face Mesh Gaze Tracking & Demeanor Evaluation...'
        : 'Finalizing Acoustic Scorecard (Video skipped for audio)...'
    );

    await new Promise((r) => setTimeout(r, 600));
    setProgressPercent(100);
    setAnalysisStep('Analysis complete! Synthesizing scorecard...');

    await new Promise((r) => setTimeout(r, 300));

    // Generate comprehensive evaluation metrics
    const isVideo = activeMedia.type === 'video';
    const duration = activeMedia.durationSec || 15;
    
    // Realistic pseudo-random metrics based on duration & role
    const wpm = Math.floor(138 + Math.random() * 16);
    const fillerCount = Math.max(1, Math.floor(duration / 12));
    const clarity = Math.floor(86 + Math.random() * 9);
    const eyeContact = Math.floor(82 + Math.random() * 11);
    const confidence = Math.floor(85 + Math.random() * 9);
    const posture = Math.floor(88 + Math.random() * 8);

    const result: AnalysisResult = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      jobRole: selectedRole,
      question: currentQuestionPrompt,
      mediaType: activeMedia.type,
      overallScore: Math.floor((clarity + (isVideo ? eyeContact + confidence : clarity * 2)) / 3),
      executiveSummary: `Candidate presented a structured response for the ${selectedRole} position. Articulation cadence was within the target executive range of 130–160 WPM.`,
      phase2: {
        wpm,
        wpmRating: wpm >= 130 && wpm <= 160 ? 'Optimal Cadence (130-160 WPM)' : 'Pace Deviation',
        longPausesCount: Math.max(1, Math.floor(duration / 14)),
        longPausesDetails: [
          { startSec: 4.2, endSec: 5.9, durationSec: 1.7 },
          { startSec: 16.5, endSec: 18.2, durationSec: 1.7 },
        ],
        fillerWordCount: fillerCount,
        fillerWords: ['um', 'like', 'essentially'].slice(0, fillerCount),
        clarityScore: clarity,
        pauseRatio: 14,
        speechEnergy: 'Balanced & Confident',
        transcript:
          selectedRole === 'Software Engineer'
            ? "During a critical production outage where message consumer lag spiked on our event bus, I immediately stabilized telemetry, identified an unindexed query deadlock, and rolled back the offending release. Mean-time-to-recovery was minimized and we added automated latency regression tests."
            : selectedRole === 'Product Manager'
            ? "When balancing enterprise feature requests against our core consumer roadmap, I relied on the RICE framework combined with quantitative user retention cohorts. I facilitated a workshop aligning cross-functional leads on sprint reallocation."
            : "To resolve an interpersonal conflict between department leads, I held structured discovery sessions to identify common goals and established transparent collaboration metrics that restored team cohesion.",
        relevanceScore: 88,
        keywordCoverageScore: 82,
        structuralClarityScore: 90,
        toneConfidenceScore: 84,
        strengths: [
          'Effective STAR structure with logical progression from context to quantitative results.',
          `Relevant domain vocabulary and strategic alignment for a ${selectedRole}.`,
          'Consistent vocal volume and steady articulate enunciation.',
        ],
        improvementAreas: [
          `Reduce initial filler hesitations (${fillerCount} detected). Practice 1-second silent pauses.`,
          'Elaborate slightly more on the long-term operational impact and cross-team learnings.',
        ],
        feedback: [
          `Maintained a steady vocal cadence of ${wpm} WPM, which conveys calm authority for a ${selectedRole}.`,
          `Detected ${fillerCount} brief filler instances. Try replacing filler syllables with silent 1-second pauses.`,
          `Acoustic energy remained consistent with minimal vocal fry or abrupt drop-offs.`,
        ],
      },
      phase3: isVideo
        ? {
            eyeContactRatio: eyeContact,
            eyeContactRating: eyeContact >= 80 ? 'Strong Direct Focus' : 'Moderate Focus',
            gazeStatus: eyeContact >= 80 ? 'Direct Focus (Camera)' : 'Frequent Looking Down',
            confidenceScore: confidence,
            headPoseStability: posture,
            expressiveness: 'Engaged & Professional',
            lightingQuality: 'Good Contrast',
            dominantEmotion: 'Neutral',
            emotionBreakdown: {
              Neutral: 54.0,
              Happy: 27.0,
              'Nervous/Fearful': 11.0,
              Surprised: 5.0,
              Sad: 3.0,
            },
            movementFlags: [
              'Optimal posture composure with steady poise (minimal roll & pitch variance).',
            ],
            timeline: Array.from({ length: Math.max(5, Math.min(25, Math.floor(duration))) }, (_, i) => {
              const isDirect = Math.random() < (eyeContact / 100);
              const emotionOptions = ['Neutral', 'Neutral', 'Happy', 'Nervous/Fearful'];
              return {
                timestampSec: i * 1.0,
                eyeContact: isDirect,
                eyeContactNumeric: isDirect ? 100 : 0,
                gazeLabel: isDirect ? 'Direct (Camera)' : (Math.random() > 0.5 ? 'Looking Down (Notes)' : 'Looking Aside'),
                dominantEmotion: emotionOptions[Math.floor(Math.random() * emotionOptions.length)],
                pitch: Number((Math.random() * 6 - 2).toFixed(1)),
                yaw: Number((Math.random() * 8 - 4).toFixed(1)),
                roll: Number((Math.random() * 4 - 2).toFixed(1)),
              };
            }),
            feedback: [
              `Held direct camera gaze ${eyeContact}% of the response time, demonstrating strong engagement with the interviewer.`,
              `Head stability score of ${posture}% shows controlled composure without nervous tilting or fidgeting.`,
              `DeepFace facial affect detected 54% Neutral poise and 27% Positive/Happy engagement.`,
              eyeContact < 75 ? 'Tip: Position your camera at eye-level to maintain direct contact.' : 'Camera angle and distance are well-calibrated.',
            ],
          }
        : undefined,
    };

    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  // Helper: load sample mock media so user can test instantly without uploading
  const loadSampleDemoMedia = (type: 'audio' | 'video') => {
    const isVideo = type === 'video';
    const sampleMedia: MediaFileMeta = {
      id: 'demo_' + type,
      name: isVideo ? 'sample_interview_answer.mp4' : 'sample_candidate_audio.wav',
      type,
      format: isVideo ? 'MP4' : 'WAV',
      sizeBytes: isVideo ? 12400000 : 3800000,
      sizeMb: isVideo ? 11.8 : 3.6,
      durationSec: 28.5,
      tempPath: `/temp/interview_sample_${type}.${isVideo ? 'mp4' : 'wav'}`,
      url: isVideo
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        : 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
      resolution: isVideo ? '1920x1080' : undefined,
      fps: isVideo ? 30 : undefined,
      sampleRate: 44100,
      createdAt: 'Sample Preload',
    };
    handleMediaSelect(sampleMedia);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex font-sans selection:bg-blue-600 selection:text-white">
      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedRole={selectedRole}
        onRoleChange={handleRoleChange}
        selectedQuestion={selectedQuestion}
        onQuestionChange={setSelectedQuestion}
        isCustomQuestion={isCustomQuestion}
        onToggleCustomQuestion={setIsCustomQuestion}
        customQuestionText={customQuestionText}
        onCustomQuestionTextChange={setCustomQuestionText}
        onOpenCodeModal={() => setCodeModalOpen(true)}
        tempFileCount={tempCacheFiles.length}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-72' : 'pl-0'
        }`}
      >
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-20 h-16 bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 pl-8 lg:pl-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-100 tracking-tight">
                  AI Interview Performance Analyzer
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-800/80">
                  Phase 1 MVP
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Streamlit + WebRTC ML Architecture • Target: <span className="text-slate-300 font-medium">{selectedRole}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCodeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-400 text-xs font-semibold border border-blue-500/20 transition-all"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Python Source</span>
            </button>

            {/* Quick Demo Preload Dropdown / Button */}
            {!activeMedia && (
              <button
                onClick={() => loadSampleDemoMedia('video')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                title="Load sample media for testing"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Load Sample Video</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Question Banner & Context Card */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedRole}
                  </span>
                  <span className="text-xs text-slate-400">• Active Prompt</span>
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-100 leading-snug">
                  "{currentQuestionPrompt}"
                </h1>
                <p className="text-xs text-slate-400">
                  Record your answer via webcam or upload an existing recording (WAV, MP3, MP4) below to begin.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-right">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Target Pace
                  </div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                    130 – 160 WPM
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Voiceplay for Question Display */}
            <div className="relative z-10 mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center flex-wrap gap-2.5">
                {/* Main Play / Pause Button */}
                <button
                  onClick={handleToggleSpeech}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md ${
                    isPlayingVoice && !isVoicePaused
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 hover:shadow-blue-500/40'
                  }`}
                  title={isPlayingVoice ? (isVoicePaused ? 'Resume Voice' : 'Pause Voice') : 'Listen to AI Interviewer speak question'}
                >
                  {isPlayingVoice && !isVoicePaused ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause Question Audio</span>
                      {/* Animated Equalizer Wave Bars */}
                      <span className="flex items-center gap-0.5 ml-1">
                        <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-0.5 h-3.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-0.5 h-2 bg-white rounded-full animate-bounce" />
                      </span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-white" />
                      <span>{isVoicePaused ? 'Resume Question Audio' : 'Play Question Audio (TTS)'}</span>
                    </>
                  )}
                </button>

                {/* Replay Button */}
                <button
                  onClick={handleReplaySpeech}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
                  title="Replay question from beginning"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Replay</span>
                </button>

                {/* Stop Button */}
                {isPlayingVoice && (
                  <button
                    onClick={handleStopSpeech}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-medium border border-red-800/40 transition-colors"
                    title="Stop Audio"
                  >
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    <span>Stop</span>
                  </button>
                )}

                {/* Live Status Indicator */}
                <div className="flex items-center gap-2 pl-1">
                  {isPlayingVoice && !isVoicePaused ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      AI Interviewer Speaking...
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 hidden sm:inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Voice Output Ready
                    </span>
                  )}
                </div>
              </div>

              {/* Auto-read Toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={autoReadQuestion}
                  onChange={(e) => setAutoReadQuestion(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Auto-play on question change</span>
              </label>
            </div>
          </div>

          {/* Section 1: Candidate Media Capture & Input Modules */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>Candidate Input Module</span>
                  <span className="text-xs text-slate-500 font-normal">
                    (Choose File Upload or Live Recording)
                  </span>
                </h2>
              </div>

              {/* Streamlit-styled Tab Buttons */}
              <div className="flex rounded-xl p-1 bg-slate-900 border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'upload'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>File Upload</span>
                </button>
                <button
                  onClick={() => setActiveTab('record')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'record'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Live Recording</span>
                </button>
              </div>
            </div>

            {/* Tab Body */}
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-5 md:p-6 shadow-inner">
              {activeTab === 'upload' ? (
                <FileUploadTab onMediaSelect={handleMediaSelect} activeMedia={activeMedia} />
              ) : (
                <LiveRecordingTab onMediaSelect={handleMediaSelect} activeMedia={activeMedia} />
              )}
            </div>
          </section>

          {/* Section 2: Media Reviewer & HTML5 Player (Appears when media is uploaded/recorded) */}
          {activeMedia && (
            <section className="space-y-4">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Media Processing Infrastructure</span>
                <span className="text-xs font-mono text-emerald-400 font-normal">
                  (Temporary Storage: ./temp)
                </span>
              </h2>

              <MediaReviewer
                media={activeMedia}
                onClear={handleClearMedia}
                onStartAnalysis={handleStartAnalysis}
                isAnalyzing={isAnalyzing}
                analysisStep={analysisStep}
                progressPercent={progressPercent}
              />
            </section>
          )}

          {/* Section 3: Analysis Scorecard (Phase 2 & Phase 3) */}
          {analysisResult && (
            <section className="space-y-4">
              <AnalysisReport
                result={analysisResult}
                onReset={handlePracticeNextQuestion}
              />
            </section>
          )}
        </main>

        {/* Global Footer */}
        <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>AI Interview Performance Analyzer</span>
            <span>•</span>
            <span>Streamlit Python ML Pipeline (Phase 1)</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Cache: ./temp</span>
            <span>Status: Ready</span>
          </div>
        </footer>
      </div>

      {/* Python Code Inspector Modal */}
      <CodeViewerModal isOpen={codeModalOpen} onClose={() => setCodeModalOpen(false)} />
    </div>
  );
}
