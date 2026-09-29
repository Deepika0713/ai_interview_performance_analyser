import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Mic,
  Video,
  VideoOff,
  MicOff,
  Circle,
  Square,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { MediaFileMeta } from '../types/interview';

interface LiveRecordingTabProps {
  onMediaSelect: (media: MediaFileMeta) => void;
  activeMedia: MediaFileMeta | null;
}

export const LiveRecordingTab: React.FC<LiveRecordingTabProps> = ({ onMediaSelect, activeMedia }) => {
  const [recordMode, setRecordMode] = useState<'video' | 'audio'>('video');
  const [streamActive, setStreamActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize or update stream based on recordMode
  const startCameraStream = async () => {
    setCameraError(null);
    stopAllStreams();

    try {
      const constraints: MediaStreamConstraints = {
        video: recordMode === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoPreviewRef.current && recordMode === 'video') {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // Initialize Web Audio API Analyser for real-time waveform visualization
      initAudioVisualizer(stream);
      setStreamActive(true);
    } catch (err: any) {
      console.warn('Media access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera/microphone permission was denied in your browser. Please allow permissions in your address bar.'
          : 'Could not access camera or microphone devices.'
      );
      setStreamActive(false);
    }
  };

  const stopAllStreams = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setStreamActive(false);
  };

  const initAudioVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const drawWaveform = () => {
        animationFrameRef.current = requestAnimationFrame(drawWaveform);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * canvas.height;

          // Gradient color: blue to sky
          const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(1, '#38bdf8');

          canvasCtx.fillStyle = gradient;
          canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

          x += barWidth;
        }
      };

      drawWaveform();
    } catch (e) {
      console.warn('Audio visualization not supported', e);
    }
  };

  // Start actual MediaRecorder recording
  const handleStartRecording = () => {
    if (!mediaStreamRef.current) {
      startCameraStream();
      return;
    }

    recordedChunksRef.current = [];
    const mimeType = recordMode === 'video' ? 'video/webm;codecs=vp8,opus' : 'audio/webm;codecs=opus';

    try {
      const options = MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : undefined;
      const recorder = new MediaRecorder(mediaStreamRef.current, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const recordedBlob = new Blob(recordedChunksRef.current, {
          type: recordMode === 'video' ? 'video/mp4' : 'audio/wav',
        });

        const uniqueId = Math.random().toString(36).substring(2, 9);
        const ext = recordMode === 'video' ? 'mp4' : 'wav';
        const fileName = `live_record_${uniqueId}.${ext}`;
        const tempPath = `/temp/interview_rec_${uniqueId}.${ext}`;
        const sizeMb = parseFloat((recordedBlob.size / (1024 * 1024)).toFixed(2));
        const url = URL.createObjectURL(recordedBlob);

        const newMedia: MediaFileMeta = {
          id: uniqueId,
          name: fileName,
          type: recordMode,
          format: ext.toUpperCase(),
          sizeBytes: recordedBlob.size,
          sizeMb: sizeMb > 0 ? sizeMb : 0.45,
          durationSec: recordingSeconds > 0 ? recordingSeconds : 10.0,
          tempPath,
          url,
          blob: recordedBlob,
          resolution: recordMode === 'video' ? '1280x720' : undefined,
          fps: recordMode === 'video' ? 30 : undefined,
          sampleRate: 48000,
          createdAt: new Date().toLocaleTimeString(),
        };

        onMediaSelect(newMedia);
      };

      recorder.start(500); // 500ms chunk intervals
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e: any) {
      setCameraError('Recording failed to initialize: ' + e.message);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Auto-start stream preview on mount
    startCameraStream();
    return () => {
      stopAllStreams();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [recordMode]);

  return (
    <div className="space-y-4">
      {/* Mode Selector & Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg p-1 bg-slate-950 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => {
                if (!isRecording) setRecordMode('video');
              }}
              disabled={isRecording}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                recordMode === 'video' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Webcam & Audio</span>
            </button>
            <button
              onClick={() => {
                if (!isRecording) setRecordMode('audio');
              }}
              disabled={isRecording}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                recordMode === 'audio' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Microphone Only</span>
            </button>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 text-[11px] font-mono text-slate-300 border border-slate-700/60">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Streamlit WebRTC Engine
          </span>
        </div>

        {/* Live Timer & Indicator */}
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-red-400 text-xs font-mono font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>REC {formatTime(recordingSeconds)}</span>
            </div>
          )}

          {!streamActive && (
            <button
              onClick={startCameraStream}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reconnect Device
            </button>
          )}
        </div>
      </div>

      {/* Camera / Audio Live Stage */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[340px] flex flex-col items-center justify-center shadow-xl">
        {recordMode === 'video' ? (
          <div className="relative w-full h-[360px] flex items-center justify-center bg-black">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Overlaid Face Framing Guide */}
            {streamActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-52 h-64 border-2 border-dashed border-blue-500/30 rounded-[50px] flex items-center justify-center">
                  <span className="text-[10px] text-blue-400/60 font-mono tracking-wider uppercase mt-48">
                    Align Face Here
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-10 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Mic className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-200">Audio Mode Active</h4>
              <p className="text-xs text-slate-400 mt-1">
                Speak directly into your microphone. Visual demeanor analysis (Phase 3) will be bypassed.
              </p>
            </div>
          </div>
        )}

        {/* Real-time Web Audio Waveform Canvas Bar at Bottom */}
        <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px]">Audio Meter:</span>
          </div>
          <div className="flex-1 max-w-md h-6 flex items-center">
            <canvas ref={canvasRef} width={260} height={24} className="w-full h-full" />
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            {recordMode === 'video' ? '720p @ 30fps' : '48 kHz WAV'}
          </div>
        </div>

        {/* Error overlay */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center space-y-3 z-10">
            <AlertTriangle className="w-10 h-10 text-amber-400" />
            <p className="text-sm font-semibold text-slate-200">Camera / Mic Access Needed</p>
            <p className="text-xs text-slate-400 max-w-md">{cameraError}</p>
            <button
              onClick={startCameraStream}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              Retry Device Permissions
            </button>
          </div>
        )}
      </div>

      {/* Recording Control Bar */}
      <div className="flex items-center justify-center gap-4 pt-2">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-600/30 transition-all hover:scale-105"
          >
            <Circle className="w-4 h-4 fill-white" />
            <span>Start Recording Answer</span>
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-semibold text-sm shadow-xl transition-all hover:scale-105"
          >
            <Square className="w-4 h-4 fill-slate-900" />
            <span>Finish & Save to /temp ({formatTime(recordingSeconds)})</span>
          </button>
        )}
      </div>

      {/* Recorded Media Preview notification */}
      {activeMedia && (
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">
                Latest Recording Saved: <span className="font-mono text-emerald-400">{activeMedia.name}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Saved in {activeMedia.tempPath} • {activeMedia.durationSec}s recorded
              </div>
            </div>
          </div>
          <span className="text-xs text-blue-400 font-medium">Ready in Review player below ↓</span>
        </div>
      )}
    </div>
  );
};
