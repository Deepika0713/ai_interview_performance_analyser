import React, { useState } from 'react';
import { JobRole } from '../types/interview';
import { QUESTION_BANK } from '../data/questions';
import {
  Briefcase,
  HelpCircle,
  HardDrive,
  Cpu,
  Layers,
  Code2,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Eye,
  Smile,
  Mic,
  FileDown,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedRole: JobRole;
  onRoleChange: (role: JobRole) => void;
  selectedQuestion: string;
  onQuestionChange: (q: string) => void;
  isCustomQuestion: boolean;
  onToggleCustomQuestion: (val: boolean) => void;
  customQuestionText: string;
  onCustomQuestionTextChange: (text: string) => void;
  onOpenCodeModal: () => void;
  tempFileCount: number;
  onDownloadPDF?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  selectedRole,
  onRoleChange,
  selectedQuestion,
  onQuestionChange,
  isCustomQuestion,
  onToggleCustomQuestion,
  customQuestionText,
  onCustomQuestionTextChange,
  onOpenCodeModal,
  tempFileCount,
  onDownloadPDF,
}) => {
  const [isDocExpanded, setIsDocExpanded] = useState(true);
  const roleQuestions = QUESTION_BANK.filter((q) => q.role === selectedRole);

  return (
    <>
      {/* Floating Toggle Button for when sidebar is closed on desktop or mobile */}
      <button
        onClick={onToggle}
        title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        className={`fixed top-3 z-40 p-2.5 rounded-lg bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 backdrop-blur-md shadow-lg transition-all duration-300 ${
          isOpen ? 'left-[290px]' : 'left-3'
        }`}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-30 w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-lg">
              🎯
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-tight">AI Interview Analyzer</h2>
              <span className="text-[11px] text-blue-400 font-mono tracking-wide">Streamlit ML • Phase 1</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm text-slate-300 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Target Role Selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              Target Job Role
            </label>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => onRoleChange(e.target.value as JobRole)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              >
                <option value="Software Engineer">Software Engineer</option>
                <option value="Product Manager">Product Manager</option>
                <option value="HR Specialist / People Ops">HR Specialist / People Ops</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              Tailors evaluation benchmarks and domain vocabulary metrics.
            </p>
          </div>

          {/* Question Mode */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              Interview Question Prompt
            </label>

            <div className="flex rounded-md p-1 bg-slate-900 border border-slate-800/80 text-xs font-medium">
              <button
                type="button"
                onClick={() => onToggleCustomQuestion(false)}
                className={`flex-1 py-1.5 rounded transition-colors ${
                  !isCustomQuestion ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Role Presets
              </button>
              <button
                type="button"
                onClick={() => onToggleCustomQuestion(true)}
                className={`flex-1 py-1.5 rounded transition-colors ${
                  isCustomQuestion ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom Prompt
              </button>
            </div>

            {!isCustomQuestion ? (
              <div className="space-y-1.5">
                <select
                  value={selectedQuestion}
                  onChange={(e) => onQuestionChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 leading-relaxed"
                >
                  {roleQuestions.map((q) => (
                    <option key={q.id} value={q.text}>
                      [{q.category}] {q.text.slice(0, 55)}...
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  value={customQuestionText}
                  onChange={(e) => onCustomQuestionTextChange(e.target.value)}
                  placeholder="Type your custom interview question prompt..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
                />
              </div>
            )}
          </div>

          {/* Media Temp Infrastructure */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                Temp Storage
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                Active
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono space-y-1">
              <div>Path: <span className="text-slate-300">/temp/interview_*</span></div>
              <div>Cached Items: <span className="text-emerald-400 font-semibold">{tempFileCount} files</span></div>
              <div className="text-[10px] text-slate-500">Auto-cleans items &gt; 2 hours old</div>
            </div>
          </div>

          {/* Qwen2-Audio Model Status Card */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Qwen2-Audio-7B
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Active Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Hugging Face Multimodal Audio-Language Model (7B Parameters). Evaluates audio answers for STAR structure, domain keywords, and transcripts.
            </p>
            <div className="text-[10px] text-indigo-300 font-mono bg-indigo-950/80 px-2 py-1 rounded border border-indigo-800/60 flex items-center justify-between">
              <span>Qwen/Qwen2-Audio-7B-Instruct</span>
              <span className="text-emerald-400 font-bold">READY</span>
            </div>
          </div>

          {/* Pipeline Phases Status */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              ML Architecture Status
            </label>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-emerald-900/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-200 font-medium">Phase 1: Ingestion & Cache</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-emerald-900/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-200 font-medium">Phase 2: MediaPipe & DeepFace</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-emerald-900/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-200 font-medium">Phase 3: Qwen2-Audio Multimodal</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
              </div>
            </div>
          </div>

          {/* ML Pipeline Documentation Accordion */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setIsDocExpanded(!isDocExpanded)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>ML Pipeline Documentation</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isDocExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDocExpanded && (
              <div className="p-3 pt-1 border-t border-slate-800/80 space-y-3 text-[11px] text-slate-300 leading-relaxed">
                {/* Step 1: MediaPipe */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                    <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>1. MediaPipe (Pose & Gaze)</span>
                  </div>
                  <p className="text-slate-400 pl-5 text-[10.5px]">
                    Extracts 468 3D landmarks + iris centers (#468, #473). Uses <code className="text-sky-300">cv2.solvePnP</code> to compute Head Pose (Pitch, Yaw, Roll), camera eye contact ratio, and fidgeting stability.
                  </p>
                </div>

                {/* Step 2: DeepFace */}
                <div className="space-y-1 border-t border-slate-800/60 pt-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                    <Smile className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>2. DeepFace (Emotion & Demeanor)</span>
                  </div>
                  <p className="text-slate-400 pl-5 text-[10.5px]">
                    Sub-samples video at 1 FPS for instant throughput. Quantifies Neutral, Happy, Nervous/Fearful, Sad, and Surprised states to map session composure.
                  </p>
                </div>

                {/* Step 3: Qwen2-Audio */}
                <div className="space-y-1 border-t border-slate-800/60 pt-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                    <Mic className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>3. Qwen2-Audio (Speech Model)</span>
                  </div>
                  <p className="text-slate-400 pl-5 text-[10.5px]">
                    7B Multimodal Audio-LLM directly understanding raw speech audio. Evaluates STAR structure, keyword coverage, verbatim transcripts, WPM (130-160 range), and pauses &gt;1.5s.
                  </p>
                </div>

                {/* PDF Download Trigger */}
                {onDownloadPDF && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={onDownloadPDF}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-indigo-100 border border-indigo-700/60 text-[11px] font-semibold transition-all shadow-sm group"
                      title="Download complete system architecture and ML pipeline manual as PDF"
                    >
                      <FileDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
                      <span>Download Documentation (PDF)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Python Code & Streamlit Export Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenCodeModal}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all shadow-sm group"
            >
              <Code2 className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Inspect Python / Streamlit Code</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/30 text-center">
          <p className="text-[10px] text-slate-500">
            AI Interview Performance Analyzer • Streamlit + WebRTC
          </p>
        </div>
      </aside>
    </>
  );
};
