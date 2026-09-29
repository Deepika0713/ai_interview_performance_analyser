import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, FileVideo, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { MediaFileMeta } from '../types/interview';

interface FileUploadTabProps {
  onMediaSelect: (media: MediaFileMeta) => void;
  activeMedia: MediaFileMeta | null;
}

const MAX_SIZE_MB = 50;
const ALLOWED_EXTENSIONS = ['wav', 'mp3', 'mp4'];

export const FileUploadTab: React.FC<FileUploadTabProps> = ({ onMediaSelect, activeMedia }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMsg(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // Validate extension
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMsg(`Unsupported file type ".${ext}". Please upload WAV, MP3 audio or MP4 video.`);
      return;
    }

    // Validate size (50 MB)
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_SIZE_MB) {
      setErrorMsg(`File size (${sizeMb.toFixed(1)} MB) exceeds maximum allowed limit of ${MAX_SIZE_MB} MB.`);
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate reading metadata and storing into /temp cache
      const isVideo = ext === 'mp4';
      const fileUrl = URL.createObjectURL(file);

      // Measure duration
      const duration = await new Promise<number>((resolve) => {
        if (isVideo) {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => resolve(video.duration || 15.0);
          video.onerror = () => resolve(15.0);
          video.src = fileUrl;
        } else {
          const audio = document.createElement('audio');
          audio.preload = 'metadata';
          audio.onloadedmetadata = () => resolve(audio.duration || 12.0);
          audio.onerror = () => resolve(12.0);
          audio.src = fileUrl;
        }
      });

      const uniqueId = Math.random().toString(36).substring(2, 9);
      const tempPath = `/temp/interview_${uniqueId}_${file.name.replace(/\s+/g, '_')}`;

      const mediaMeta: MediaFileMeta = {
        id: uniqueId,
        name: file.name,
        type: isVideo ? 'video' : 'audio',
        format: ext.toUpperCase(),
        sizeBytes: file.size,
        sizeMb: parseFloat(sizeMb.toFixed(2)),
        durationSec: parseFloat(duration.toFixed(1)),
        tempPath,
        url: fileUrl,
        blob: file,
        sampleRate: isVideo ? 48000 : 44100,
        resolution: isVideo ? '1920x1080' : undefined,
        fps: isVideo ? 30 : undefined,
        createdAt: new Date().toLocaleTimeString(),
      };

      // Simulate network / IO caching delay
      await new Promise((r) => setTimeout(r, 600));

      onMediaSelect(mediaMeta);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing uploaded file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.005]'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.mp4"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:text-blue-300 transition-all shadow-lg shadow-blue-500/5">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <p className="text-base font-semibold text-slate-200">
              Drag & drop your interview recording here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              or <span className="text-blue-400 underline font-medium">browse files</span> from your local drive
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700">
              WAV
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700">
              MP3
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700">
              MP4
            </span>
            <span className="text-xs text-slate-500 ml-1">Max 50 MB</span>
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-300 font-medium">Validating & writing to /temp cache...</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Upload Info */}
      {activeMedia && (
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              {activeMedia.type === 'video' ? <FileVideo className="w-5 h-5" /> : <FileAudio className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200 max-w-[220px] truncate">{activeMedia.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-950 text-[10px] font-mono text-blue-400 border border-blue-800">
                  {activeMedia.format}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {activeMedia.sizeMb} MB • ~{activeMedia.durationSec}s duration • Cached to {activeMedia.tempPath}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ready for Analysis</span>
          </div>
        </div>
      )}

      {/* Guidelines info */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p>
          For best results in Phase 2 & 3, speak clearly at a standard conversational pace (130–160 WPM).
          Ensure face is well-lit if uploading MP4 video.
        </p>
      </div>
    </div>
  );
};
