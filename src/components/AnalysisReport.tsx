import React, { useState } from 'react';
import {
  Mic,
  Eye,
  Award,
  TrendingUp,
  Volume2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Share2,
  Download,
  Flame,
  Activity,
  Smile,
  Compass,
  FileText,
  Clock,
  ThumbsUp,
  Target,
  Sparkles,
  Quote,
} from 'lucide-react';
import { AnalysisResult, TimelinePoint } from '../types/interview';

interface AnalysisReportProps {
  result: AnalysisResult;
  onReset: () => void;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ result, onReset }) => {
  const { phase2, phase3, overallScore, jobRole, question, mediaType } = result;
  const [hoveredTimelinePoint, setHoveredTimelinePoint] = useState<TimelinePoint | null>(null);

  const exportReportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `interview_performance_${result.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Color mapping for emotions
  const emotionColors: Record<string, string> = {
    Neutral: '#38bdf8', // sky
    Happy: '#10b981', // emerald
    'Nervous/Fearful': '#f59e0b', // amber
    Surprised: '#a855f7', // purple
    Sad: '#f43f5e', // rose
  };

  // SVG Donut Calculations
  const renderEmotionDonut = () => {
    if (!phase3 || !phase3.emotionBreakdown) return null;
    const entries = Object.entries(phase3.emotionBreakdown);
    const radius = 64;
    const strokeWidth = 18;
    const circumference = 2 * Math.PI * radius;
    let accumulatedAngle = 0;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {entries.map(([label, percentage]) => {
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedAngle / 100) * circumference);
              accumulatedAngle += percentage;
              const color = emotionColors[label] || '#94a3b8';

              return (
                <circle
                  key={label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:opacity-80"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Dominant
            </span>
            <span className="text-sm font-bold text-white mt-0.5">
              {phase3.dominantEmotion || 'Neutral'}
            </span>
          </div>
        </div>

        {/* Donut Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 w-full text-xs">
          {entries.map(([label, pct]) => (
            <div key={label} className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: emotionColors[label] || '#94a3b8' }}
                />
                <span className="text-[11px] truncate">{label}</span>
              </div>
              <span className="font-mono text-[11px] font-semibold text-slate-200">{pct}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Interactive Timeline Chart Calculation
  const renderTimelineChart = () => {
    if (!phase3 || !phase3.timeline || phase3.timeline.length === 0) return null;
    const points = phase3.timeline;
    const maxTime = Math.max(...points.map((p) => p.timestampSec), 10);
    const chartHeight = 110;
    const chartWidth = 360;

    return (
      <div className="space-y-2">
        <div className="relative w-full h-[150px] bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          {/* Target 80% Threshold Line */}
          <div
            className="absolute left-3 right-3 border-b border-dashed border-emerald-500/50 flex justify-end"
            style={{ top: '28%' }}
          >
            <span className="text-[9px] text-emerald-400 font-mono -mt-3.5 bg-slate-950/80 px-1 rounded">
              Target 80% Threshold
            </span>
          </div>

          {/* Points Timeline Area */}
          <div className="relative flex-1 flex items-end">
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
            >
              {/* Spline Path */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                points={points
                  .map((p) => {
                    const x = (p.timestampSec / maxTime) * chartWidth;
                    const y = p.eyeContact ? chartHeight * 0.2 : chartHeight * 0.85;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Circles */}
              {points.map((p, idx) => {
                const x = (p.timestampSec / maxTime) * chartWidth;
                const y = p.eyeContact ? chartHeight * 0.2 : chartHeight * 0.85;
                const isHovered = hoveredTimelinePoint?.timestampSec === p.timestampSec;

                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill={p.eyeContact ? '#10b981' : '#ef4444'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredTimelinePoint(p)}
                    onMouseLeave={() => setHoveredTimelinePoint(null)}
                  />
                );
              })}
            </svg>
          </div>

          {/* Time axis markers */}
          <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
            <span>0.0s</span>
            <span>~{Math.round(maxTime / 2)}s</span>
            <span>{maxTime.toFixed(1)}s</span>
          </div>
        </div>

        {/* Hover detail tooltip bar */}
        <div className="min-h-[28px] text-[11px] font-mono text-slate-300 flex items-center justify-between px-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
          {hoveredTimelinePoint ? (
            <>
              <span className="text-blue-400 font-semibold">
                Time: {hoveredTimelinePoint.timestampSec}s
              </span>
              <span className={hoveredTimelinePoint.eyeContact ? 'text-emerald-400' : 'text-red-400'}>
                {hoveredTimelinePoint.gazeLabel}
              </span>
              <span className="text-slate-400">
                Emotion: <strong className="text-white">{hoveredTimelinePoint.dominantEmotion}</strong>
              </span>
            </>
          ) : (
            <span className="text-slate-500 italic">
              Hover over points to inspect moment-by-moment gaze & emotion.
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pt-2 animate-fadeIn">
      {/* Top Banner Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 flex flex-wrap items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Evaluation Completed
            </span>
            <span className="text-xs text-slate-400 font-mono">{result.timestamp}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Interview Performance Scorecard
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white">Role:</strong> {jobRole} &nbsp;|&nbsp;
            <strong className="text-white"> Format:</strong> {mediaType.toUpperCase()}
          </p>
          <p className="text-xs text-slate-400 italic">
            "{question}"
          </p>
        </div>

        {/* Big Overall Score Badge */}
        <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 px-6 shadow-inner">
          <div className="text-center">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Composite Score
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                {overallScore}
              </span>
              <span className="text-sm font-semibold text-slate-500">/ 100</span>
            </div>
            <span className="inline-block mt-1 text-[11px] font-bold text-emerald-400">
              {overallScore >= 85 ? 'Strong Hire Grade' : 'Proficient Competency'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={exportReportJson}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Export Report JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Quad: Eye Contact Score, Gaze Direction Status, Pace WPM, Long Pauses (>1.5s) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Eye Contact Score */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Eye Contact Score (%)
          </span>
          <div className="text-2xl font-bold text-sky-400 mt-1">
            {phase3 ? `${phase3.eyeContactRatio}%` : 'N/A'}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 block">
            {phase3 ? phase3.eyeContactRating : 'Audio Only'}
          </span>
        </div>

        {/* Metric 2: Gaze Direction Status */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Gaze Direction Status
          </span>
          <div className="text-lg font-bold text-slate-100 mt-1 truncate">
            {phase3 ? phase3.gazeStatus : 'Audio Submission'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {phase3 ? 'MediaPipe Iris Mesh' : 'Visual Skipped'}
          </span>
        </div>

        {/* Metric 3: Speaking Pace (WPM) */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Speaking Pace (WPM)
          </span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {phase2.wpm} <span className="text-xs text-slate-400 font-normal">WPM</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 block">
            {phase2.wpmRating}
          </span>
        </div>

        {/* Metric 4: Long Pauses (>1.5s) */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Long Pauses (&gt;1.5s)
          </span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {phase2.longPausesCount} <span className="text-xs text-slate-400 font-normal">instance{phase2.longPausesCount !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block truncate">
            {phase2.pauseRatio}% Total Silence Ratio
          </span>
        </div>
      </div>

      {/* PHASE 3 MULTIMODAL SPEECH INTELLIGENCE (Qwen2-Audio-7B-Instruct) */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Phase 3 Multimodal Speech Intelligence</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Qwen2-Audio-7B-Instruct
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates question alignment, domain keywords, structural STAR delivery, and acoustic clarity.
              </p>
            </div>
          </div>
        </div>

        {/* Four Speech Scores Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Relevance Score */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Relevance Score</span>
              <Target className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {phase2.relevanceScore}<span className="text-xs text-slate-500">/100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${phase2.relevanceScore}%` }}
              />
            </div>
          </div>

          {/* Keyword Coverage */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Keyword Coverage</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {phase2.keywordCoverageScore}<span className="text-xs text-slate-500">/100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${phase2.keywordCoverageScore}%` }}
              />
            </div>
          </div>

          {/* Structural Clarity */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Structural Clarity</span>
              <Award className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400 mt-1">
              {phase2.structuralClarityScore}<span className="text-xs text-slate-500">/100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full"
                style={{ width: `${phase2.structuralClarityScore}%` }}
              />
            </div>
          </div>

          {/* Tone Confidence */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Tone Confidence</span>
              <Volume2 className="w-3.5 h-3.5 text-pink-400" />
            </div>
            <div className="text-2xl font-bold text-pink-400 mt-1">
              {phase2.toneConfidenceScore}<span className="text-xs text-slate-500">/100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-pink-500 h-full rounded-full"
                style={{ width: `${phase2.toneConfidenceScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Verbatim Transcript & Filler Words Cloud */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Quote className="w-3.5 h-3.5 text-blue-400" />
              <span>Verbatim Speech Transcript</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono italic">
              "{phase2.transcript}"
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Detected Filler Words</span>
              <span className="font-mono text-amber-400 font-bold">{phase2.fillerWordCount} total</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {phase2.fillerWords.map((word, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded bg-amber-950/80 text-amber-300 text-xs font-mono border border-amber-800/80"
                  >
                    "{word}"
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Filler hesitations disrupt vocal cadence. Try deliberate 1-second silence pauses.
              </p>
            </div>
          </div>
        </div>

        {/* Strengths & Improvement Areas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Strengths */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Key Strengths Identified</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              {phase2.strengths.map((str, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{str}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Areas */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Actionable Areas for Growth</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              {phase2.improvementAreas.map((imp, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span>{imp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 2 VISION DEEP DIVE: Donut Chart + Timeline Line Chart */}
      {phase3 && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Phase 2 Vision Analytics (MediaPipe Face Landmarker & DeepFace)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Sub-sampled at 1 frame/sec for real-time throughput
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-purple-950 text-purple-400 border border-purple-800">
              Vision Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Donut Chart: Facial Emotion Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-blue-400" />
                  Facial Emotion Breakdown (Session Duration)
                </h4>
                <span className="text-[10px] font-mono text-slate-400">DeepFace ML</span>
              </div>
              {renderEmotionDonut()}
            </div>

            {/* Line Chart: Eye Contact Engagement Timeline */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Eye Contact Engagement Timeline
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Gaze Vector (SolvePnP)</span>
              </div>
              {renderTimelineChart()}
            </div>
          </div>

          {/* MediaPipe Head Pose & Stability Diagnostics Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                Head Pose Movement Stability: {phase3.headPoseStability}%
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                Pose Standard: Optimal
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              • <strong>Movement Evaluation:</strong> {phase3.movementFlags[0]}
            </p>
            <p className="text-slate-400 leading-relaxed">
              • <strong>3D Landmarks:</strong> Evaluated MediaPipe Face Landmarker 468 mesh landmarks and iris center positions (indices 468 & 473) to determine camera focus vs downward gaze.
            </p>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-slate-400">
          Want to test another prompt or re-record your answer?
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Practice Another Question
          </button>
        </div>
      </div>
    </div>
  );
};
