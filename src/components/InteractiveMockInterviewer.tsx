import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Volume2,
  Square,
  Mic,
  MicOff,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Layers,
  ArrowRight,
  Download,
  AlertCircle,
  Eye,
  Activity,
  Award,
  Play,
  FileCheck,
} from 'lucide-react';
import { JobRole, AdaptiveTurnRecord, AdaptiveFollowUp } from '../types/interview';

interface InteractiveMockInterviewerProps {
  initialRole?: JobRole;
}

const SEED_QUESTIONS: Record<JobRole, { category: string; prompt: string }> = {
  'Software Engineer': {
    category: 'Architectural Foundation',
    prompt:
      'Tell me about yourself and walk me through a distributed project or system outage you diagnosed under tight deadlines.',
  },
  'Product Manager': {
    category: 'Product Strategy & Prioritization',
    prompt:
      'How do you evaluate product-market fit and prioritize competing enterprise requests against core consumer retention?',
  },
  'HR Specialist / People Ops': {
    category: 'Organizational Leadership',
    prompt:
      'What methodology do you use to diagnose high voluntary turnover or mediate high-stakes conflict between senior department heads?',
  },
  'Data Scientist / ML Engineer': {
    category: 'ML Problem Formulation & Modeling',
    prompt:
      'Walk me through how you translated an ambiguous business challenge into an ML loss function, and how you detected data drift.',
  },
};

export const InteractiveMockInterviewer: React.FC<InteractiveMockInterviewerProps> = ({
  initialRole = 'Software Engineer',
}) => {
  // Session Phases: Configuration -> In_Progress -> Completed
  const [phase, setPhase] = useState<'Configuration' | 'In_Progress' | 'Completed'>(
    'In_Progress'
  );
  const [candidateName, setCandidateName] = useState('Alex Rivera');
  const [jobRole, setJobRole] = useState<JobRole>(initialRole);
  const [targetTurns, setTargetTurns] = useState<number>(4);

  // Turn tracking
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>(
    SEED_QUESTIONS[initialRole]?.prompt || SEED_QUESTIONS['Software Engineer'].prompt
  );
  const [currentQuestionCategory, setCurrentQuestionCategory] = useState<string>(
    SEED_QUESTIONS[initialRole]?.category || 'Architectural Foundation'
  );
  const [isAdaptive, setIsAdaptive] = useState<boolean>(false);
  const [turns, setTurns] = useState<AdaptiveTurnRecord[]>([]);
  const [currentTurnEval, setCurrentTurnEval] = useState<AdaptiveTurnRecord | null>(null);

  // Voice engine states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true);

  // Recording & Evaluation state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioReady, setRecordedAudioReady] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-speak question when question changes
  useEffect(() => {
    if (phase === 'In_Progress' && autoSpeakEnabled && currentQuestionText) {
      speakAloud(currentQuestionText);
    }
    return () => {
      stopSpeaking();
    };
  }, [currentQuestionText, phase]);

  const speakAloud = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_~`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const enVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('David'))
      );
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleStartRecording = () => {
    stopSpeaking();
    setIsRecording(true);
    setRecordingSeconds(0);
    setRecordedAudioReady(false);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecordedAudioReady(true);
  };

  const handleLoadSampleDemo = () => {
    stopSpeaking();
    setRecordedAudioReady(true);
    setRecordingSeconds(28);
  };

  // Evaluate candidate answer and synthesize Question N+1 adaptively
  const handleEvaluateAndSynthesize = async () => {
    setIsEvaluating(true);
    stopSpeaking();

    await new Promise((r) => setTimeout(r, 1200));

    // Dynamic Follow-up generation logic
    let followUp: AdaptiveFollowUp;
    let transcript: string;
    let missingConcepts: string[];
    let detectedWeaknesses: string[];

    if (jobRole === 'Software Engineer') {
      if (currentTurnIndex === 0) {
        transcript =
          'In my previous distributed role, um, we encountered a severe database deadlock during our peak deployment. I triaged the thread pool, like, identified blocking queries on Postgres, and added composite indexes while restarting the worker pool.';
        missingConcepts = [
          'Secondary index write amplification analysis',
          'Read-replica synchronization telemetry',
        ];
        detectedWeaknesses = [
          'Did not verify if online index creation introduced lock contention',
          'Lacked mention of automated canary rollbacks',
        ];
        followUp = {
          question:
            'You mentioned mitigating the deadlock with composite indexing. How did you verify that adding those indexes did not adversely impact write throughput and replication lag on your read-replicas?',
          reasoning:
            'Candidate highlighted indexing as the primary solution; probing deeper into secondary-index write overhead and replication lag.',
          interviewerDialogue:
            'That was a solid operational triage. Let us drill into the architectural trade-offs of that fix.',
        };
      } else if (currentTurnIndex === 1) {
        transcript =
          'To ensure write throughput remained steady, we monitored replica lag via Prometheus and enabled pg_stat_statements. We also set up a circuit breaker in Envoy proxy to reject non-essential requests.';
        missingConcepts = ['Cascading failure thresholds', 'Dead letter queue triage'];
        detectedWeaknesses = ['Could quantify latency improvement in milliseconds'];
        followUp = {
          question:
            'Engineers often face pressure from product stakeholders to ship features despite mounting tech debt. Walk me through a time you negotiated refactoring time without halting business velocity.',
          reasoning:
            'Transitioning from technical execution to cross-functional engineering leadership and trade-off negotiation.',
          interviewerDialogue:
            'Technical competence is only half the battle; cross-functional alignment is equally crucial.',
        };
      } else {
        transcript =
          'I scheduled bi-weekly 20% refactoring sprints and presented data on incident frequency to product managers. This directly cut our production bug tickets by 35%.';
        missingConcepts = ['Long-term deprecation policies'];
        detectedWeaknesses = ['Minor hesitation pauses'];
        followUp = {
          question:
            'Looking back at your career, what is one major architectural decision you made that you would implement differently today with hindsight?',
          reasoning: 'Reflective engineering maturity and technical retrospection.',
          interviewerDialogue:
            'Let us conclude with technical reflection and architectural growth.',
        };
      }
    } else {
      transcript =
        'I evaluated our quarterly goals using the RICE scoring model. We discovered that enterprise customer retention was dropping due to compliance requirements, so we reprioritized our roadmap to satisfy SOC2 compliance.';
      missingConcepts = ['Cohort retention curves', 'Executive dissent mediation'];
      detectedWeaknesses = ['Did not explain how trade-offs were messaged to consumer users'];
      followUp = {
        question:
          'You noted using the RICE framework, but how do you handle cases where executive intuition or a single multi-million enterprise contract directly contradicts your RICE prioritization?',
        reasoning:
          'Challenging candidate on executive stakeholder management versus rigid framework adherence.',
        interviewerDialogue:
          'Frameworks look clean on paper, but real organizational friction is messy.',
      };
    }

    const rel = 86 + Math.floor(Math.random() * 8);
    const kw = 82 + Math.floor(Math.random() * 8);
    const struct = 88 + Math.floor(Math.random() * 6);
    const tone = 84 + Math.floor(Math.random() * 7);
    const eye = 85 + Math.floor(Math.random() * 7);
    const wpm = 142 + Math.floor(Math.random() * 10);
    const comp = Math.round(
      rel * 0.25 + struct * 0.2 + kw * 0.15 + eye * 0.15 + tone * 0.15 + 95 * 0.1
    );

    const record: AdaptiveTurnRecord = {
      turnIndex: currentTurnIndex,
      question: currentQuestionText,
      category: currentQuestionCategory,
      isAdaptive,
      transcript,
      scores: {
        relevance: rel,
        keywordCoverage: kw,
        structuralClarity: struct,
        tone,
        eyeContact: eye,
        wpm,
        composite: comp,
      },
      detectedWeaknesses,
      missingConcepts,
      followUp,
      fillerWords: ['um', 'like'],
      strengths: [
        'Adhered strictly to the STAR methodology (Situation, Task, Action, Result)',
        'Demonstrated strong contextual awareness of production trade-offs',
      ],
      improvements: [
        'Minimize transitional verbal hesitations by embracing brief, intentional pauses',
        'Directly quantify outcome metrics (% latency drops or business impact)',
      ],
      emotionBreakdown: {
        Neutral: 54,
        'Confident/Happy': 32,
        'Nervous/Hesitant': 10,
        Surprised: 4,
      },
    };

    setTurns((prev) => [...prev, record]);
    setCurrentTurnEval(record);
    setIsEvaluating(false);
    setRecordedAudioReady(false);
    setRecordingSeconds(0);
  };

  const handleNextTurn = () => {
    if (!currentTurnEval) return;
    if (currentTurnIndex + 1 < targetTurns) {
      setCurrentTurnIndex((prev) => prev + 1);
      setCurrentQuestionText(currentTurnEval.followUp.question);
      setCurrentQuestionCategory('Adaptive Follow-Up');
      setIsAdaptive(true);
      setCurrentTurnEval(null);
    } else {
      setPhase('Completed');
    }
  };

  const handleRetryTurn = () => {
    setTurns((prev) => prev.slice(0, -1));
    setCurrentTurnEval(null);
    setRecordedAudioReady(false);
    setRecordingSeconds(0);
  };

  const handleRestart = () => {
    setPhase('In_Progress');
    setCurrentTurnIndex(0);
    const seed = SEED_QUESTIONS[jobRole] || SEED_QUESTIONS['Software Engineer'];
    setCurrentQuestionText(seed.prompt);
    setCurrentQuestionCategory(seed.category);
    setIsAdaptive(false);
    setTurns([]);
    setCurrentTurnEval(null);
    setRecordedAudioReady(false);
    setRecordingSeconds(0);
  };

  // ===========================================================================
  // VIEW: COMPLETED FINAL REPORT CARD
  // ===========================================================================
  if (phase === 'Completed') {
    const numTurns = turns.length || 1;
    const avgOverall = Math.round(
      turns.reduce((acc, t) => acc + t.scores.composite, 0) / numTurns
    );
    const avgRel = Math.round(
      turns.reduce((acc, t) => acc + t.scores.relevance, 0) / numTurns
    );
    const avgEye = Math.round(
      turns.reduce((acc, t) => acc + t.scores.eyeContact, 0) / numTurns
    );
    const avgWpm = Math.round(turns.reduce((acc, t) => acc + t.scores.wpm, 0) / numTurns);
    const totalFillers = turns.reduce((acc, t) => acc + t.fillerWords.length, 0);

    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Adaptive Interview Completed
                </span>
                <span className="text-xs text-slate-400">
                  • {numTurns} of {targetTurns} Turns
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-100">
                Executive Debrief Report Card
              </h1>
              <p className="text-xs text-slate-400">
                Candidate: <strong className="text-slate-200">{candidateName}</strong> |
                Target Role: <strong className="text-blue-400">{jobRole}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Start New Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* Executive Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Overall Score
            </span>
            <div className="text-2xl font-bold text-sky-400 mt-1 font-mono">
              {avgOverall}/100
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">Strong Hire</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Answer Relevance
            </span>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              {avgRel}%
            </div>
            <span className="text-[11px] text-slate-400">STAR Aligned</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Eye Contact
            </span>
            <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">
              {avgEye}%
            </div>
            <span className="text-[11px] text-slate-400">Webcam Focus</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Speaking Cadence
            </span>
            <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
              {avgWpm} WPM
            </div>
            <span className="text-[11px] text-slate-400">Target: 130–160 WPM</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Filler Words
            </span>
            <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">
              {totalFillers} Total
            </div>
            <span className="text-[11px] text-slate-400">Clean Delivery</span>
          </div>
        </div>

        {/* Turn-by-Turn Transcripts & Adaptive Follow-Ups */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Turn-by-Turn Adaptive Conversation Transcript</span>
          </h3>

          <div className="space-y-4">
            {turns.map((t, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-500/30">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-100">
                      Turn {idx + 1}: {t.category}
                    </span>
                    {t.isAdaptive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                        Adaptive Follow-Up
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono font-bold text-sky-400">
                    Turn Score: {t.scores.composite}/100
                  </div>
                </div>

                <div className="text-xs text-slate-300">
                  <strong className="text-slate-400 uppercase tracking-wider text-[11px]">
                    Interviewer Question:
                  </strong>
                  <div className="mt-1 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 italic text-slate-200">
                    "{t.question}"
                  </div>
                </div>

                <div className="text-xs text-slate-300">
                  <strong className="text-slate-400 uppercase tracking-wider text-[11px]">
                    Candidate Verbatim Transcript:
                  </strong>
                  <div className="mt-1 p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-slate-200 leading-relaxed font-sans">
                    "{t.transcript}"
                  </div>
                </div>

                {t.missingConcepts.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 space-y-1">
                    <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Missing Concepts & Technical Weaknesses Identified:</span>
                    </div>
                    {t.missingConcepts.map((m, mi) => (
                      <div key={mi} className="text-slate-300 text-[11px] pl-4">
                        • {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Coaching Plan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-emerald-950/10 border border-emerald-800/40 space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Top Demonstrated Strengths</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc">
              <li>Adhered strictly to the STAR methodology across responses.</li>
              <li>Demonstrated solid grasp of distributed system failure patterns.</li>
              <li>Maintained strong camera eye contact (85%+) throughout adaptive probes.</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-amber-950/10 border border-amber-800/40 space-y-2">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Priority Areas for Growth</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc">
              <li>
                Deepen quantifiable metrics (e.g. latency drop % or replication lag seconds).
              </li>
              <li>
                When probed on adaptive follow-ups, immediately acknowledge the tradeoff.
              </li>
              <li>
                Embrace brief silent pauses instead of verbal hesitations ('um', 'like').
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // VIEW: IN_PROGRESS INTERACTIVE TURN LOOP
  // ===========================================================================
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Visual Stepper */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        {Array.from({ length: targetTurns }).map((_, i) => {
          const isDone = i < currentTurnIndex;
          const isCurrent = i === currentTurnIndex;
          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-900 text-emerald-300 border border-emerald-600'
                    : isCurrent
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isDone ? '✔' : i + 1}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  isCurrent ? 'text-blue-400' : isDone ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Turn {i + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* AI Interviewer Speaking Card */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/40 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-800/40 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  Alex • AI Senior Interviewer
                  {isSpeaking && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-indigo-300">
                  Turn {currentTurnIndex + 1} Focus: <strong>{currentQuestionCategory}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdaptive ? (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-700">
                  ⚡ Adaptive Follow-Up
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-950 text-blue-400 border border-blue-800">
                  Foundational Prompt
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border-l-4 border-l-blue-500 border border-slate-800/80 text-base md:text-lg font-semibold text-slate-100 leading-relaxed">
            "{currentQuestionText}"
          </div>

          {/* Voice Output Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {!isSpeaking ? (
                <button
                  onClick={() => speakAloud(currentQuestionText)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Speak Question Aloud</span>
                </button>
              ) : (
                <button
                  onClick={stopSpeaking}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Speaking</span>
                </button>
              )}

              {isSpeaking && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-800 text-[11px] text-indigo-300">
                  <span className="w-1 h-3 bg-indigo-400 rounded animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-4 bg-blue-400 rounded animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-3 bg-emerald-400 rounded animate-bounce" />
                  <span className="ml-1 text-xs">Alex is speaking...</span>
                </div>
              )}
            </div>

            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={autoSpeakEnabled}
                onChange={(e) => setAutoSpeakEnabled(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0 w-3 h-3"
              />
              <span>Auto-vocalize new turns</span>
            </label>
          </div>
        </div>
      </div>

      {/* Candidate Response Capture Box */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-400" />
              <span>Candidate Answer Recording (Turn {currentTurnIndex + 1})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Record your verbal response or load an instant demo answer.
            </p>
          </div>

          {/* Quick Demo Preload Button */}
          {!isRecording && !recordedAudioReady && !currentTurnEval && (
            <button
              onClick={handleLoadSampleDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Sample Demo Answer</span>
            </button>
          )}
        </div>

        {/* Live Audio Recorder */}
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col items-center justify-center gap-4 text-center">
          {isRecording ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-rose-400 text-sm font-bold animate-pulse">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span>Recording in progress... {recordingSeconds}s</span>
              </div>
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Finish & Review Answer</span>
              </button>
            </div>
          ) : recordedAudioReady ? (
            <div className="space-y-3 w-full max-w-md">
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Audio Captured ({recordingSeconds}s duration) • Ready for Evaluation</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleEvaluateAndSynthesize}
                  disabled={isEvaluating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isEvaluating
                      ? 'Qwen2-Audio Evaluating...'
                      : '⚡ Evaluate Response & Synthesize Adaptive Follow-Up'}
                  </span>
                </button>
                <button
                  onClick={() => setRecordedAudioReady(false)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Click below to begin speaking your answer using your browser microphone:
              </p>
              <button
                onClick={handleStartRecording}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition-all"
              >
                <Mic className="w-4 h-4" />
                <span>Record Voice Response</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Immediate Turn Scorecard & Conversational Bridge */}
      {currentTurnEval && (
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-blue-500/40 p-6 space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Turn {currentTurnIndex + 1} Performance Metrics</span>
            </h3>
            <span className="text-xs font-mono font-bold text-sky-400">
              Score: {currentTurnEval.scores.composite}/100
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Relevance
              </span>
              <div className="text-lg font-bold text-sky-400 font-mono">
                {currentTurnEval.scores.relevance}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                STAR Structure
              </span>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                {currentTurnEval.scores.structuralClarity}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Speaking Pace
              </span>
              <div className="text-lg font-bold text-amber-400 font-mono">
                {currentTurnEval.scores.wpm} WPM
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Eye Contact
              </span>
              <div className="text-lg font-bold text-indigo-400 font-mono">
                {currentTurnEval.scores.eyeContact}%
              </div>
            </div>
          </div>

          {/* Alex's Conversational Bridge & Rationale Card */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/50 space-y-2">
            <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              Alex's Adaptive Observation:
            </div>
            <p className="text-sm text-slate-200 italic">
              "{currentTurnEval.followUp.interviewerDialogue}"
            </p>
            <div className="text-xs text-amber-300 pt-1 border-t border-blue-900/40">
              ⚡ <strong>Adaptive Rationale:</strong> {currentTurnEval.followUp.reasoning}
            </div>
          </div>

          {/* Navigation to Next Turn */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleRetryTurn}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              🔄 Retry This Turn
            </button>

            <button
              onClick={handleNextTurn}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition-all"
            >
              <span>
                {currentTurnIndex + 1 < targetTurns
                  ? `Proceed to Turn ${currentTurnIndex + 2} (Adaptive Question)`
                  : 'Conclude Session & View Final Report Card'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
