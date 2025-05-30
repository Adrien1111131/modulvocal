import { logger } from '../../config/development';
import { ContextualMoodType, IntonationContext, IntonationMarker, TextAnalysis } from './types';
import { contextualMoodPatterns } from './voiceSettings';

/**
 * Extrait les marqueurs d'intonation du texte
 * @param text Le texte à analyser
 * @returns Le texte nettoyé et les marqueurs d'intonation extraits
 */
export const extractIntonationMarkers = (text: string): { text: string; markers: IntonationMarker[]; contexts: IntonationContext[] } => {
  // Nettoyer les espaces multiples uniquement
  const cleanText = text.replace(/\s+/g, ' ').trim();
  return { 
    text: cleanText, 
    markers: [], 
    contexts: [] 
  };
};

/**
 * Ajoute des respirations et des pauses au texte en utilisant le format SSML
 * @param text Le texte à traiter
 * @param emotion L'émotion dominante du texte
 * @param analysis L'analyse du texte
 * @returns Le texte au format SSML avec respirations et pauses
 */
export const addBreathingAndPauses = (text: string, emotion: string, analysis: TextAnalysis): string => {
  logger.group('Ajout des respirations et pauses');
  logger.debug('Texte initial:', text);
  logger.debug('Émotion:', emotion);
  logger.debug('Analyse:', analysis);
  
  // Nettoyer le texte des espaces multiples
  text = text.replace(/\s+/g, ' ').trim();

  // Calculer la durée des pauses en fonction de l'intensité
  const pauseDuration = Math.min(1500, 1000 + (analysis.intensity * 700));
  
  // Ajouter des pauses pour la ponctuation
  text = text.replace(/\.\.\./g, `<break time="${pauseDuration * 1.2}ms"/>`);
  text = text.replace(/([.!?])/g, (match) => {
    const duration = match === '?' ? pauseDuration * 1.1 : 
                    match === '!' ? pauseDuration * 1.5 : 
                    pauseDuration;
    return `${match}<break time="${duration}ms"/>`;
  });
  text = text.replace(/,/g, `,<break time="${pauseDuration * 0.7}ms"/>`);

  // Les interjections et onomatopées sont maintenant traitées naturellement par le TTS
  // Le code qui ralentissait les onomatopées a été supprimé pour permettre un rendu plus naturel

  // Appliquer les variations contextuelles
  if (analysis.contextualMood !== 'neutral') {
    const contextPattern = contextualMoodPatterns[analysis.contextualMood];
    const baseRate = "70%";
    text = `<prosody pitch="${contextPattern.pitch}" rate="${baseRate}">${text}</prosody>`;
  } else {
    text = `<prosody rate="70%" pitch="-5%">${text}</prosody>`;
  }

  // Ajouter des emphases sur les mots importants
  analysis.emphasis.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const emphasisLevel = analysis.intensity > 0.7 ? 'strong' : 'moderate';
    text = text.replace(regex, `<emphasis level="${emphasisLevel}">${word}</emphasis>`);
  });

  logger.debug('Texte avec respirations et variations:', text);
  logger.groupEnd();
  return text;
};

/**
 * Génère le SSML pour un segment avec des paramètres spécifiques
 * @param segment Le texte du segment
 * @param emotion L'émotion dominante
 * @param analysis L'analyse du texte
 * @param options Options supplémentaires (pitch, rate)
 * @returns Le SSML généré
 */
export const generateSegmentSSML = (
  segment: string, 
  emotion: string, 
  analysis: TextAnalysis, 
  options: { pitch?: string; rate?: string } = {}
): string => {
  const basePitch = options.pitch || '-10%';
  const baseRate = options.rate || '35%';
  
  return `<speak><prosody pitch="${basePitch}" rate="${baseRate}">${addBreathingAndPauses(segment, emotion, analysis)}</prosody></speak>`;
};

/**
 * Ajoute des respirations au SSML en fonction de l'intensité
 * @param ssml Le SSML à modifier
 * @param breathingType Le type de respiration ('haletante' ou 'profonde')
 * @returns Le SSML avec respirations
 */
export const addBreathingToSSML = (ssml: string, breathingType: 'haletante' | 'profonde'): string => {
  if (breathingType === 'haletante') {
    // Ajouter des respirations haletantes entre les phrases
    return ssml.replace(/([.!?]<break[^>]*>)/g, `$1<say-as interpret-as="interjection">inhale</say-as><break time="100ms"/>`);
  } else if (breathingType === 'profonde') {
    // Ajouter des respirations profondes au début des phrases
    return ssml.replace(/(<\/break>)([A-Z])/g, `$1<say-as interpret-as="interjection">exhale</say-as><break time="200ms"/>$2`);
  }
  return ssml;
};
