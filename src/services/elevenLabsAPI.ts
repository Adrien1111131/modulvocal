import axiosInstance from './axiosConfig';
import axios from 'axios';
import { config, logger } from '../config/development';
import { analyzeTextEnvironments } from './grokService';
import { audioMixerService, AudioSegment } from './audioMixerService';
import { getEnvironmentConfig, getSoundUrl } from '../config/soundEnvironments';
import {
  analyzeText,
  addBreathingAndPauses,
  getVoiceSettings,
  parseTextSegments,
  calculateSegmentTiming,
  generateSegmentSSML,
  addBreathingToSSML,
  SegmentWithTiming
} from './elevenlabs/index';

const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || '';
const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
const API_URL = `${config.api.baseUrl}/text-to-speech/${VOICE_ID}`;

// Vérification de la présence des variables d'environnement
if (!VOICE_ID || !API_KEY) {
  logger.error('Variables d\'environnement manquantes: VITE_ELEVENLABS_VOICE_ID ou VITE_ELEVENLABS_API_KEY');
  console.error('Variables d\'environnement manquantes: VITE_ELEVENLABS_VOICE_ID ou VITE_ELEVENLABS_API_KEY');
}

/**
 * Fonction principale pour générer la voix
 * @param text Le texte à convertir en voix
 * @returns URL de l'audio généré
 */
export const generateVoice = async (text: string): Promise<string> => {
  try {
    logger.group('Génération de la voix');
    logger.info('Début de la génération pour le texte:', text);
    
    // 1. Analyser le texte localement
    logger.info('Étape 1: Analyse locale du texte');
    const analysis = analyzeText(text);
    
    // 2. Obtenir les paramètres vocaux
    logger.info('Étape 2: Obtention des paramètres vocaux');
    const emotion = 'sensuel'; // Émotion par défaut
    const settings = getVoiceSettings(emotion, analysis);
    
    // 3. Créer le SSML
    logger.info('Étape 3: Création du SSML');
    const textWithBreathing = addBreathingAndPauses(text, emotion, analysis);
    
    // Ajuster les paramètres en fonction de l'analyse
    const baseRate = '35%'; // Très lent pour une ambiance sensuelle
    const basePitch = '-10%'; // Plus grave pour plus de profondeur
    
    // Diviser le texte en segments plus courts pour éviter les limitations de l'API
    const segments = text.split(/[.!?…]+/).filter(s => s.trim().length > 0);
    logger.debug('Nombre de segments:', segments.length);
    
    // Générer l'audio pour chaque segment
    const audioBlobs: Blob[] = [];
    for (const segment of segments) {
      const segmentSSML = generateSegmentSSML(segment, emotion, analysis, { pitch: basePitch, rate: baseRate });
      logger.debug('SSML pour le segment:', segmentSSML);
      
      const response = await axiosInstance.post(
        API_URL,
        {
          text: segmentSSML,
          model_id: "eleven_multilingual_v2",
          voice_settings: settings
        },
        {
          headers: {
            'xi-api-key': API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'blob',
          timeout: config.api.timeout
        }
      );
      
      audioBlobs.push(response.data);
    }
    
    // Concaténer tous les blobs audio
    const combinedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(combinedBlob);
    logger.debug('URL audio générée:', audioUrl);
    
    logger.groupEnd();
    return audioUrl;
  } catch (error: unknown) {
    logger.error('Erreur lors de la génération de la voix:', error);
    if (axios.isAxiosError(error)) {
      logger.error('Réponse de l\'API:', error.response?.data);
      logger.error('Status:', error.response?.status);
      logger.error('Headers:', error.response?.headers);
    }
    throw new Error('Échec de la génération de la voix');
  }
};

/**
 * Fonction pour générer la voix avec des sons d'environnement
 * @param text Le texte à convertir en voix
 * @param useAI Indique si on doit utiliser l'IA pour ajouter des sons d'environnement
 * @returns URL de l'audio généré
 */
export const generateVoiceWithEnvironment = async (text: string, useAI: boolean = false): Promise<string> => {
  try {
    logger.group('Génération de la voix avec environnement');
    logger.info('Texte à traiter:', text);
    logger.info('Utilisation de l\'IA:', useAI);
    
    // 1. Analyser le texte avec Grok pour obtenir les segments
    logger.info('Étape 1: Analyse du texte avec Grok');
    const segments = await analyzeTextEnvironments(text);
    logger.debug('Segments détectés:', segments.length);
    
    // 2. Générer la voix pour chaque segment
    logger.info('Étape 2: Génération des segments audio');
    const audioSegments: AudioSegment[] = [];
    
    // Paramètres de transition entre segments
    const defaultFadeIn = 0.15;  // 150ms de fondu d'entrée
    const defaultFadeOut = 0.2;  // 200ms de fondu de sortie
    const defaultCrossfade = 0.3; // 300ms de crossfade entre segments
    
    // Calculer les temps de début pour chaque segment
    const segmentsWithTiming = calculateSegmentTiming(segments, {
      defaultFadeIn,
      defaultFadeOut,
      defaultCrossfade
    });
    
    // Générer l'audio pour chaque segment
    for (let i = 0; i < segmentsWithTiming.length; i++) {
      const segment = segmentsWithTiming[i] as SegmentWithTiming;
      const prevSegment = i > 0 ? segmentsWithTiming[i - 1] : null;
      const nextSegment = i < segmentsWithTiming.length - 1 ? segmentsWithTiming[i + 1] : null;
      
      logger.debug(`Traitement du segment ${i+1}/${segmentsWithTiming.length}:`, segment.segment);
      logger.debug('Émotion détectée:', segment.emotionalTone);
      logger.debug('Environnement détecté:', segment.environment);
      
      // Ajuster les paramètres vocaux en fonction du contexte
      const analysis = analyzeText(segment.segment);
      
      // Ajuster l'analyse en fonction des segments voisins pour une transition plus fluide
      if (prevSegment) {
        // Transition depuis le segment précédent
        analysis.emotionalProgression = 0.7; // Augmenter la progression émotionnelle
        
        // Ajuster l'intensité en fonction de l'émotion précédente
        if (prevSegment.emotionalTone === 'intense' || prevSegment.emotionalTone === 'excite') {
          analysis.intensity = 0.8;
        } else if (prevSegment.emotionalTone === 'doux' || prevSegment.emotionalTone === 'murmure') {
          analysis.intensity = 0.5;
        }
      }
      
      // Construire le SSML pour ce segment avec des transitions fluides
      let ssml = `<speak>\n`;
      
      // Ajouter une respiration au début si c'est le premier segment ou après une pause
      if (i === 0 || (prevSegment && prevSegment.segment.match(/[.!?…]$/))) {
        ssml += `<break time="200ms"/>\n`;
      }
      
      // Ajouter la prosodie avec des transitions douces
      ssml += `<prosody rate="${segment.speechRate === 'très lent' ? '25%' :
                           segment.speechRate === 'lent' ? '35%' :
                           segment.speechRate === 'modéré' ? '45%' :
                           segment.speechRate === 'rapide' ? '55%' :
                           '40%'}"
                       volume="${segment.volume === 'doux' ? '-2dB' :
                              segment.volume === 'fort' ? '+4dB' :
                              '+0dB'}">\n`;
      
      // Ajouter le texte avec des respirations naturelles
      ssml += addBreathingAndPauses(segment.segment, segment.emotionalTone, analysis);
      
      // Fermer les balises
      ssml += `\n</prosody>\n`;
      
      // Ajouter une respiration à la fin si c'est le dernier segment
      if (i === segmentsWithTiming.length - 1) {
        ssml += `<break time="300ms"/>\n`;
      }
      
      ssml += `</speak>`;
      
      logger.debug('SSML généré:', ssml);

      // Utiliser les paramètres vocaux fournis par Grok si disponibles
      let voiceSettings = getVoiceSettings(segment.emotionalTone, analysis);
      
      if (segment.elevenlabsParams) {
        // Utiliser les paramètres détaillés de Grok
        voiceSettings = {
          stability: segment.elevenlabsParams.stability,
          similarity_boost: segment.elevenlabsParams.similarity_boost
        };
        logger.debug('Utilisation des paramètres Grok:', voiceSettings);
        
        // Ajuster le SSML avec les paramètres de vitesse et de hauteur
        if (segment.elevenlabsParams.speed || segment.elevenlabsParams.pitch_shift) {
          const speed = segment.elevenlabsParams.speed || '35%';
          const pitch = segment.elevenlabsParams.pitch_shift ? 
                      (segment.elevenlabsParams.pitch_shift > 0 ? `+${segment.elevenlabsParams.pitch_shift}%` : `${segment.elevenlabsParams.pitch_shift}%`) : 
                      '-5%';
          
          // Remplacer la balise prosody existante
          ssml = ssml.replace(/<prosody[^>]*>/i, `<prosody rate="${speed}" pitch="${pitch}">`);
          logger.debug('SSML ajusté avec les paramètres Grok:', ssml);
        }
        
        // Les onomatopées sont maintenant traitées naturellement par le TTS
        
        // Ajouter des respirations selon l'intensité
        if (segment.expressionDetails && segment.expressionDetails.breathing === 'haletante') {
          // Ajouter des respirations haletantes entre les phrases
          ssml = addBreathingToSSML(ssml, 'haletante');
          logger.debug('SSML enrichi avec des respirations haletantes:', ssml);
        } else if (segment.expressionDetails && segment.expressionDetails.breathing === 'profonde') {
          // Ajouter des respirations profondes au début des phrases
          ssml = addBreathingToSSML(ssml, 'profonde');
          logger.debug('SSML enrichi avec des respirations profondes:', ssml);
        }
      }

      try {
        logger.info(`Appel à l'API ElevenLabs pour le segment ${i+1}/${segmentsWithTiming.length}`);
        // Générer l'audio pour ce segment
        const response = await axiosInstance.post(
          API_URL,
          {
            text: ssml,
            model_id: "eleven_multilingual_v2",
            voice_settings: voiceSettings
          },
          {
            headers: {
              'xi-api-key': API_KEY,
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg'
            },
            responseType: 'blob',
            timeout: config.api.timeout
          }
        );
        
        logger.debug('Réponse reçue de l\'API ElevenLabs');
        logger.debug('Type de la réponse:', response.data.type);
        logger.debug('Taille de la réponse:', response.data.size);

        // Créer l'URL du blob audio
        const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        logger.debug('URL du blob audio créée:', audioUrl);

        // Ajouter le segment à la liste avec les paramètres de transition
        audioSegments.push({
          startTime: segment.startTime,
          duration: segment.duration,
          audioUrl,
          environment: segment.environment,
          volume: segment.volume === 'doux' ? 0.7 :
                  segment.volume === 'fort' ? 1.0 :
                  0.85,
          fadeIn: segment.fadeIn,
          fadeOut: segment.fadeOut
        });
        
        logger.debug(`Segment audio ${i+1}/${segmentsWithTiming.length} ajouté à la liste`);
      } catch (segmentError) {
        logger.error(`Erreur lors de la génération du segment audio ${i+1}/${segmentsWithTiming.length}:`, segmentError);
        if (axios.isAxiosError(segmentError)) {
          logger.error('Réponse de l\'API pour le segment:', segmentError.response?.data);
          logger.error('Status pour le segment:', segmentError.response?.status);
        }
        // Continuer avec les autres segments même si celui-ci a échoué
      }
    }
    
    logger.debug('Nombre de segments audio générés:', audioSegments.length);
    
    if (audioSegments.length === 0) {
      logger.error('Aucun segment audio n\'a été généré');
      throw new Error('Aucun segment audio n\'a été généré');
    }

    // 3. Mixer tous les segments audio
    logger.info('Étape 3: Mixage des segments audio');
    const mixedAudio = await audioMixerService.mixAudioSegments(audioSegments);
    logger.debug('Audio mixé:', mixedAudio);
    
    // 4. Ajouter les sons d'environnement directement dans le mixage
    logger.info('Étape 4: Intégration des sons d\'environnement');
    
    // Récupérer les environnements uniques détectés
    const uniqueEnvironments = [...new Set(segments.map(s => s.environment))];
    logger.debug('Environnements uniques détectés:', uniqueEnvironments);
    
    // Ajouter les sons d'environnement au mixage
    for (const segment of segmentsWithTiming) {
      try {
        // Obtenir la configuration de l'environnement
        const envConfig = getEnvironmentConfig(segment.environment);
        
        // Charger le son d'ambiance principal
        const envSoundUrl = getSoundUrl(envConfig.mainAmbience);
        logger.debug(`Chargement du son d'environnement: ${envSoundUrl} pour le segment "${segment.segment.substring(0, 30)}..."`);
        
        // Ajouter le son d'environnement comme segment audio
        audioSegments.push({
          startTime: segment.startTime,
          duration: segment.duration,
          audioUrl: envSoundUrl,
          environment: segment.environment,
          volume: 0.3, // Volume réduit pour l'ambiance
          fadeIn: segment.fadeIn || 0.3,
          fadeOut: segment.fadeOut || 0.3
        });
        
        // Ajouter des sons additionnels si disponibles
        if (envConfig.additionalSounds && envConfig.additionalSounds.length > 0) {
          const additionalSound = envConfig.additionalSounds[0];
          const addSoundUrl = getSoundUrl(additionalSound.sound);
          
          // Ajouter le son additionnel avec un délai aléatoire
          const randomDelay = Math.random() * 2; // 0-2 secondes de délai
          
          audioSegments.push({
            startTime: segment.startTime + randomDelay,
            duration: segment.duration - randomDelay,
            audioUrl: addSoundUrl,
            environment: segment.environment,
            volume: 0.2, // Volume encore plus réduit pour les sons additionnels
            fadeIn: 0.5,
            fadeOut: 0.5
          });
        }
      } catch (envError) {
        logger.error(`Erreur lors de l'intégration de l'environnement ${segment.environment}:`, envError);
      }
    }
    
    logger.info('Génération terminée avec succès');
    logger.info('URL audio finale:', mixedAudio.audioUrl);
    logger.groupEnd();
    
    return mixedAudio.audioUrl;
  } catch (error) {
    logger.error('Erreur lors de la génération de la voix avec environnement:', error);
    if (axios.isAxiosError(error)) {
      logger.error('Réponse de l\'API:', error.response?.data);
      logger.error('Status:', error.response?.status);
      logger.error('Headers:', error.response?.headers);
    }
    
    // En cas d'erreur, essayer de générer une voix simple sans environnement
    logger.info('Tentative de génération de voix simple sans environnement');
    try {
      const simpleVoiceUrl = await generateVoice(text);
      logger.info('Génération de voix simple réussie');
      return simpleVoiceUrl;
    } catch (fallbackError) {
      logger.error('Échec de la génération de voix simple:', fallbackError);
      throw error; // Renvoyer l'erreur originale
    }
  }
};
