import { logger } from '../../config/development';
import { ContextualMoodPattern, ContextualMoodType, TextAnalysis, VoiceSettings } from './types';

// Mots-clés émotionnels pour l'analyse du texte
export const emotionKeywords = {
  sensuel: ['désir', 'doux', 'caresse', 'peau', 'frisson', 'sensuel', 'chaleur', 'corps'],
  excite: ['gémis', 'soupir', 'excité', 'passionné', 'brûlant', 'urgent', 'envie', 'trembler'],
  jouissance: ['extase', 'jouir', 'orgasme', 'plaisir', 'délice', 'intense', 'explosion'],
  murmure: ['murmure', 'souffle', 'chuchote', 'doux', 'tendre', 'délicat'],
  intense: ['fort', 'intense', 'profond', 'puissant', 'violent', 'ardent', 'sauvage'],
  doux: ['tendre', 'doux', 'délicat', 'léger', 'suave', 'douceur']
};

// Patterns de prosodie pour les différentes ambiances émotionnelles
export const contextualMoodPatterns: Record<Exclude<ContextualMoodType, 'neutral'>, ContextualMoodPattern> = {
  anticipation: { pitch: '+5%', rate: '55%' },   // Ralenti pour plus de tension
  tension: { pitch: '+10%', rate: '65%' },       // Ralenti pour plus d'impact
  relaxation: { pitch: '-5%', rate: '50%' },     // Très lent pour la détente
  intimacy: { pitch: '-10%', rate: '45%' },      // Extrêmement lent pour l'intimité
  passion: { pitch: '+15%', rate: '60%' }        // Ralenti pour plus de profondeur
};

/**
 * Calcule les paramètres vocaux en fonction de l'émotion et de l'analyse du texte
 * @param emotion L'émotion dominante du texte
 * @param analysis L'analyse du texte
 * @returns Les paramètres vocaux ajustés
 */
export const getVoiceSettings = (emotion: string, analysis: TextAnalysis): VoiceSettings => {
  logger.group('Calcul des paramètres de voix');
  logger.debug('Émotion:', emotion);
  logger.debug('Analyse:', analysis);
  
  // Paramètres ajustés pour plus de sensualité et de profondeur
  const baseSettings: Record<string, VoiceSettings> = {
    sensuel: {
      stability: 0.7,  // Augmenté pour plus de constance
      similarity_boost: 0.9  // Augmenté pour plus d'expressivité
    },
    excite: {
      stability: 0.4,  // Légèrement augmenté
      similarity_boost: 0.95
    },
    jouissance: {
      stability: 0.3,  // Légèrement augmenté
      similarity_boost: 1.0
    },
    murmure: {
      stability: 0.85, // Légèrement réduit pour plus de variation
      similarity_boost: 0.8  // Augmenté pour plus d'expressivité
    },
    intense: {
      stability: 0.4,  // Légèrement augmenté
      similarity_boost: 0.95 // Augmenté pour plus d'expressivité
    },
    doux: {
      stability: 0.75, // Légèrement réduit
      similarity_boost: 0.85 // Augmenté pour plus d'expressivité
    }
  };

  const settings = baseSettings[emotion] || baseSettings.sensuel;
  const adjustedSettings = {
    ...settings,
    // Ajustements moins agressifs pour préserver la sensualité
    stability: Math.max(0.3, Math.min(0.9, settings.stability * (1 - analysis.intensity * 0.3))),
    similarity_boost: Math.max(0.6, Math.min(1.0, settings.similarity_boost + analysis.emotionalProgression * 0.15))
  };

  logger.debug('Paramètres ajustés:', adjustedSettings);
  logger.groupEnd();
  return adjustedSettings;
};

/**
 * Calcule la durée de transition entre deux émotions
 * @param currentEmotion L'émotion actuelle
 * @param nextEmotion L'émotion suivante
 * @returns La durée de transition en millisecondes
 */
export const calculateEmotionTransitionDuration = (currentEmotion: string, nextEmotion: string): number => {
  // Définir les durées de transition entre les émotions
  const transitionMap: Record<string, Record<string, number>> = {
    sensuel: {
      excite: 600,
      jouissance: 800,
      murmure: 400,
      intense: 700,
      doux: 300
    },
    excite: {
      sensuel: 600,
      jouissance: 400,
      murmure: 700,
      intense: 500,
      doux: 800
    },
    jouissance: {
      sensuel: 800,
      excite: 400,
      murmure: 900,
      intense: 300,
      doux: 1000
    },
    murmure: {
      sensuel: 400,
      excite: 700,
      jouissance: 900,
      intense: 800,
      doux: 300
    },
    intense: {
      sensuel: 700,
      excite: 500,
      jouissance: 300,
      murmure: 800,
      doux: 900
    },
    doux: {
      sensuel: 300,
      excite: 800,
      jouissance: 1000,
      murmure: 300,
      intense: 900
    }
  };

  return transitionMap[currentEmotion]?.[nextEmotion] || 500;
};
