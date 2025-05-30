// Exporter tous les types
export * from './types';

// Exporter les fonctions d'analyse de texte
export { analyzeText, calculateLocalIntensity } from './textAnalysis';

// Exporter les fonctions de génération de SSML
export { 
  addBreathingAndPauses, 
  extractIntonationMarkers, 
  generateSegmentSSML,
  addBreathingToSSML
} from './ssmlGenerator';

// Exporter les fonctions de traitement des segments
export { 
  parseTextSegments,
  calculateSegmentTiming
} from './segmentProcessing';

// Exporter les fonctions de paramètres vocaux
export { 
  getVoiceSettings, 
  calculateEmotionTransitionDuration,
  emotionKeywords,
  contextualMoodPatterns
} from './voiceSettings';
