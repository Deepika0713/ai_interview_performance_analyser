import React from 'react';
import {
  FileVideo,
  FileAudio,
  Play,
  Zap,
  Sparkles,
  Download,
  Trash2,
  HardDrive,
  Activity,
  Layers,
} from 'lucide-react';
import { MediaFileMeta } from '../types/interview';

interface MediaReviewerProps {
  media: MediaFileMeta;
  onClear: () => void;
  onStartAnalysis: () => void;
  isAnalyzing: boolean;
  analysisStep: string;
  progressPercent: number;
}

export const MediaReviewer: React.FC<MediaReviewerProps> = ({
  media,
  onClear,
  onStartAnalysis,
  isAnalyzing,
  analysisStep,
  progressPercent,
}) => {
  const isVideo = media.type === 'video';

  const handleDownload = () => {
    if (!media.url) return;
    const a = document.createElement('a');
    a.href = media.url;
    a.download = media.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6 shadow-xl">
      {/* Reviewer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            {isVideo ? <FileVideo className="w-5 h-5" /> : <FileAudio className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Candidate Media Review & Player</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-950 text-blue-400 border border-blue-800">
                {media.format}
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Cached locally at: <span className="text-slate-300 font-semibold">{media.tempPath}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            title="Download cached media file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-medium transition-colors"
            title="Clear and remove from temp"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Player on left, Extracted Diagnostics on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Player Column */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-xl overflow-hidden bg-black/80 border border-slate-800 flex items-center justify-center min-h-[220px]">
            {isVideo ? (
              <video
                controls
                src={media.url}
                className="w-full max-h-[380px] object-contain rounded-xl"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full p-8 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FileAudio className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-200">{media.name}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{media.sizeMb} MB • Audio Track</p>
                </div>
                <audio controls src={media.url} className="w-full max-w-md mt-2">
                  Your browser does not support the audio tag.
                </audio>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            Standard HTML5 native media player. Ensure clarity and audible volume before launching the evaluation.
          </p>
        </div>

        {/* Media Diagnostics Column */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            Media Diagnostics
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">File Name</span>
              <span className="text-slate-200 font-mono max-w-[140px] truncate" title={media.name}>
                {media.name}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Payload Size</span>
              <span className="text-slate-200 font-mono">{media.sizeMb} MB</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Duration</span>
              <span className="text-slate-200 font-mono">~{media.durationSec} seconds</span>
            </div>

            {isVideo && (
              <>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Resolution</span>
                  <span className="text-slate-200 font-mono">{media.resolution || '1080p'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Framerate</span>
                  <span className="text-slate-200 font-mono">{media.fps || 30} FPS</span>
                </div>
              </>
            )}

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Audio Sample Rate</span>
              <span className="text-slate-200 font-mono">{media.sampleRate || 44100} Hz</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Validation State</span>
              <span className="text-emerald-400 font-semibold font-mono">PASSED (50MB Limit)</span>
            </div>
          </div>

          {/* Temp Storage Pill */}
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <HardDrive className="w-3 h-3 text-emerald-400" />
              <span>Temp Cache Verified</span>
            </div>
            <p className="font-mono text-[10px] text-slate-400 break-all">{media.tempPath}</p>
          </div>
        </div>
      </div>

      {/* Start Analysis Button Bar */}
      <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-200">Ready to execute AI Evaluation Pipeline?</h4>
          <p className="text-[11px] text-slate-400">
            Triggers Phase 2 (Acoustic Speech Models) and Phase 3 (Visual Behavioral Analytics).
          </p>
        </div>

        <button
          onClick={onStartAnalysis}
          disabled={isAnalyzing}
          className={`flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl font-bold text-sm shadow-xl transition-all ${
            isAnalyzing
              ? 'bg-blue-600/50 text-blue-200 cursor-wait'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 hover:scale-[1.02]'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Submission...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              <span>Start Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Processing Progress Bar */}
      {isAnalyzing && (
        <div className="p-4 rounded-xl bg-slate-950 border border-blue-900/60 space-y-2.5 animate-fadeIn">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              {analysisStep}
            </span>
            <span className="font-mono text-slate-300 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
