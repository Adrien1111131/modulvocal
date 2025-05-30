import { EnvironmentDetection } from '../grokService';

export type IntonationType = 'crescendo' | 'diminuendo' | 'whisper' | 'emphasis' | 'dramatic' | 'soft';
export type ContextualMoodType = 'anticipation' | 'tension' | 'relaxation' | 'intimacy' | 'passion' | 'neutral';

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

export interface TextSegment {
  text: string;
  emotion: string;
  analysis: TextAnalysis;
  intonationMarkers: IntonationMarker[];
  context?: SegmentContext;
  intonationContexts?: IntonationContext[];
}

export interface TextAnalysis {
  intensity: number;
  rhythm: number;
  pause: boolean;
  isQuestion: boolean;
  isExclamation: boolean;
  emotionalProgression: number;
  contextualMood: ContextualMoodType;
  emphasis: string[];
  tonalVariation: number;
}

export interface IntonationMarker {
  type: IntonationType;
  value: string;
  position: number;
  duration?: number;
}

export interface ContextualMoodPattern {
  pitch: string;
  rate: string;
}

export interface IntonationContext {
  previousType?: IntonationType;
  nextType?: IntonationType;
  transitionDuration?: number;
}

export interface SegmentContext {
  previousEmotion?: string;
  nextEmotion?: string;
  transitionDuration?: number;
}

export interface ElevenLabsResponse {
  audioUrl: string;
}

export interface ElevenLabsParams {
  stability: number;
  similarity_boost: number;
  speed?: string;
  pitch_shift?: number;
}

export interface ExpressionDetails {
  sounds: string[];
  breathing?: 'haletante' | 'profonde' | 'normale';
  duration?: number;
}

export interface SegmentWithTiming {
  segment: string;
  environment: string;
  soundEffects: string[];
  emotionalTone: string;
  speechRate: string;
  volume: string;
  startTime: number;
  duration: number;
  fadeIn: number;
  fadeOut: number;
  elevenlabsParams?: ElevenLabsParams;
  expressionDetails?: ExpressionDetails;
}
