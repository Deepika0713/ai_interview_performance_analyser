export type JobRole = 'Software Engineer' | 'Product Manager' | 'HR Specialist / People Ops';

export interface InterviewQuestion {
  id: string;
  role: JobRole;
  text: string;
  category: 'Technical' | 'Behavioral' | 'Leadership' | 'System Design';
}

export interface MediaFileMeta {
  id: string;
  name: string;
  type: 'audio' | 'video';
  format: string;
  sizeBytes: number;
  sizeMb: number;
  durationSec: number;
  tempPath: string;
  url: string;
  blob?: Blob;
  sampleRate?: number;
  resolution?: string;
  fps?: number;
  createdAt: string;
}

export interface PauseDetail {
  startSec: number;
  endSec: number;
  durationSec: number;
}

export interface Phase2SpeechMetrics {
  wpm: number;
  wpmRating: string;
  longPausesCount: number;
  longPausesDetails: PauseDetail[];
  fillerWordCount: number;
  fillerWords: string[];
  clarityScore: number;
  pauseRatio: number;
  speechEnergy: string;
  transcript: string;
  relevanceScore: number;
  keywordCoverageScore: number;
  structuralClarityScore: number;
  toneConfidenceScore: number;
  strengths: string[];
  improvementAreas: string[];
  feedback: string[];
}

export interface TimelinePoint {
  timestampSec: number;
  eyeContact: boolean;
  eyeContactNumeric: number;
  gazeLabel: string;
  dominantEmotion: string;
  pitch: number;
  yaw: number;
  roll: number;
}

export interface Phase3VisionMetrics {
  eyeContactRatio: number;
  eyeContactRating: string;
  gazeStatus: string;
  confidenceScore: number;
  headPoseStability: number;
  expressiveness: string;
  lightingQuality: string;
  dominantEmotion: string;
  emotionBreakdown: Record<string, number>;
  movementFlags: string[];
  timeline: TimelinePoint[];
  feedback: string[];
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  jobRole: JobRole;
  question: string;
  mediaType: 'audio' | 'video';
  phase2: Phase2SpeechMetrics;
  phase3?: Phase3VisionMetrics;
  overallScore: number;
  executiveSummary: string;
}
