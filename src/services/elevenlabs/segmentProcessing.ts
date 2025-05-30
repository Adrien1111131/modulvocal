import { logger } from '../../config/development';
import { analyzeTextEnvironments } from '../grokService';
import { IntonationContext, IntonationMarker, SegmentContext, TextAnalysis, TextSegment } from './types';
import { analyzeText } from './textAnalysis';
import { calculateEmotionTransitionDuration } from './voiceSettings';
import { extractIntonationMarkers } from './ssmlGenerator';

/**
 * Analyse un texte et le divise en segments avec analyse émotionnelle
 * @param text Le texte à analyser
 * @returns Les segments analysés
 */
export const parseTextSegments = async (text: string): Promise<TextSegment[]> => {
  logger.group('Parsing des segments');
  logger.debug('Texte à parser:', text);
  
  const segments: TextSegment[] = [];
  
  // Utiliser l'analyse de Grok pour obtenir les segments et leurs émotions
  const environmentDetections = await analyzeTextEnvironments(text);
  
  // Convertir les détections en segments
  environmentDetections.forEach((detection, i) => {
    const analysis = analyzeText(detection.segment);
    const { markers, contexts } = extractIntonationMarkers(detection.segment);

    // Créer le contexte du segment
    const segmentContext: SegmentContext = {
      previousEmotion: i > 0 ? environmentDetections[i - 1].emotionalTone : undefined,
      nextEmotion: i < environmentDetections.length - 1 ? environmentDetections[i + 1].emotionalTone : undefined,
      transitionDuration: i < environmentDetections.length - 1 ? 
        calculateEmotionTransitionDuration(detection.emotionalTone, environmentDetections[i + 1].emotionalTone) : undefined
    };

    // Ajuster l'analyse en fonction du contexte
    if (segmentContext.previousEmotion) {
      analysis.emotionalProgression *= 1.2;
    }

    // Créer le segment avec les informations de contexte
    segments.push({
      text: detection.segment,
      emotion: detection.emotionalTone,
      analysis,
      intonationMarkers: markers,
      context: segmentContext,
      intonationContexts: contexts
    });
  });

  logger.debug('Segments générés:', segments);
  logger.groupEnd();
  return segments;
};

/**
 * Calcule les temps de début et de fin pour chaque segment
 * @param segments Les segments à traiter
 * @param options Options de timing (fadeIn, fadeOut, crossfade)
 * @returns Les segments avec timing
 */
export const calculateSegmentTiming = (
  segments: any[], 
  options: { defaultFadeIn?: number; defaultFadeOut?: number; defaultCrossfade?: number } = {}
) => {
  const defaultFadeIn = options.defaultFadeIn || 0.15;  // 150ms de fondu d'entrée
  const defaultFadeOut = options.defaultFadeOut || 0.2;  // 200ms de fondu de sortie
  const defaultCrossfade = options.defaultCrossfade || 0.3; // 300ms de crossfade entre segments
  
  // Calculer les temps de début pour chaque segment
  let currentTime = 0;
  return segments.map((segment, index) => {
    // Estimer la durée du segment en fonction du nombre de caractères
    // En moyenne, on parle à environ 15 caractères par seconde pour une voix lente
    const speechRate = segment.speechRate === 'très lent' ? 10 :
                       segment.speechRate === 'lent' ? 12 :
                       segment.speechRate === 'modéré' ? 15 :
                       segment.speechRate === 'rapide' ? 18 : 13;
    
    const estimatedDuration = segment.segment.length / speechRate;
    
    // Ajouter des pauses pour la ponctuation
    const pauseCount = (segment.segment.match(/[.!?…]/g) || []).length;
    const pauseDuration = pauseCount * 0.3; // 300ms par pause
    
    const totalDuration = estimatedDuration + pauseDuration;
    
    // Créer un objet avec les informations de timing
    const segmentWithTiming = {
      ...segment,
      startTime: currentTime,
      duration: totalDuration,
      fadeIn: segment.fadeIn || defaultFadeIn,
      fadeOut: segment.fadeOut || defaultFadeOut
    };
    
    // Mettre à jour le temps courant pour le prochain segment
    // On soustrait le crossfade pour que les segments se chevauchent légèrement
    currentTime += totalDuration - defaultCrossfade;
    
    return segmentWithTiming;
  });
};
