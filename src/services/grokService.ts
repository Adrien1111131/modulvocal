import { config, logger } from '../config/development';

const API_KEY = import.meta.env.VITE_GROK_API_KEY || '';
const API_URL = 'https://api.x.ai/v1/chat/completions'; // URL correcte pour l'API de chat

// Vérification de la présence de la clé API
if (!API_KEY) {
  logger.error('Variable d\'environnement manquante: VITE_GROK_API_KEY');
  console.error('Variable d\'environnement manquante: VITE_GROK_API_KEY');
}

// Interface pour les caractéristiques vocales
interface VocalCharacteristics {
  intensity: number;       // 0-100%
  type: string;            // murmure, normal, gémissement, cri
  rhythm: string;          // très lent, lent, normal, rapide
  pitch: number;           // -20 à +20%
}

// Interface pour les expressions et onomatopées
interface ExpressionDetails {
  breathing: string;       // légère, profonde, haletante
  sounds: string[];        // mmmh, ahhh, ohhh, etc.
  duration: number;        // durée en ms
}

// Interface pour les paramètres ElevenLabs
interface ElevenLabsParams {
  stability: number;       // 0.0-1.0
  similarity_boost: number; // 0.0-1.0
  speed?: string;          // pourcentage de vitesse
  pitch_shift?: number;    // décalage de hauteur
}

// Interface pour l'environnement
interface EnvironmentDetails {
  type: string;            // chambre, plage, forêt, etc.
  suggestedSound?: string; // fichier son suggéré
}

// Interface pour les segments analysés par Grok
export interface EnhancedSegment {
  text: string;
  vocal: VocalCharacteristics;
  expressions: ExpressionDetails;
  elevenlabs: ElevenLabsParams;
  environment?: EnvironmentDetails;
}

// Interface pour la réponse de Grok
interface GrokAnalysisResponse {
  segments: EnhancedSegment[];
}

export interface EnvironmentDetection {
  segment: string;
  environment: string;
  soundEffects: string[];
  emotionalTone: string;
  speechRate: string;
  volume: string;
  startTime?: number;
  duration?: number;
  fadeIn?: number;
  fadeOut?: number;
  transition?: {
    type: 'crossfade' | 'cut' | 'overlap';
    duration: number;
  };
  // Nouveaux paramètres pour ElevenLabs
  elevenlabsParams?: {
    stability: number;
    similarity_boost: number;
    speed?: string;
    pitch_shift?: number;
  };
  // Détails des expressions
  expressionDetails?: {
    breathing: string;
    sounds: string[];
    duration: number;
  };
}

interface TimingInfo {
  estimatedDuration: number;
  fadeIn: number;
  fadeOut: number;
  transitionType: 'crossfade' | 'cut' | 'overlap';
  transitionDuration: number;
}

const calculateTiming = (text: string, speechRate: string): TimingInfo => {
  // Estimation de la durée basée sur le nombre de mots et le débit
  const words = text.trim().split(/\s+/).length;
  const wordsPerSecond = speechRate === 'très lent' ? 1.0 :
                        speechRate === 'lent' ? 1.5 :
                        speechRate === 'modéré' ? 2.0 :
                        2.5; // rapide
  
  const estimatedDuration = words / wordsPerSecond;
  
  // Durées de fondu basées sur la longueur du segment
  const fadeIn = Math.min(1.0, estimatedDuration * 0.1);
  const fadeOut = Math.min(1.0, estimatedDuration * 0.1);
  
  // Type de transition basé sur le contexte
  const hasEllipsis = text.includes('...');
  const endsWithPunctuation = /[.!?]$/.test(text.trim());
  
  const transitionType = hasEllipsis ? 'crossfade' :
                        endsWithPunctuation ? 'cut' :
                        'overlap';
  
  const transitionDuration = transitionType === 'crossfade' ? 1.0 :
                            transitionType === 'overlap' ? 0.5 :
                            0.2;
  
  return {
    estimatedDuration,
    fadeIn,
    fadeOut,
    transitionType,
    transitionDuration
  };
};

/**
 * Analyse un texte avec l'API Grok pour obtenir des segments détaillés
 * @param text Le texte à analyser
 * @returns Une liste de segments analysés
 */
export const analyzeTextWithGrok = async (text: string): Promise<EnhancedSegment[]> => {
  try {
    logger.group('Analyse du texte avec Grok');
    logger.info('Début de l\'analyse pour le texte:', text);

    // Prompt détaillé pour Grok
    const prompt = `
Analyse ce texte érotique en détail. Pour chaque segment naturel du texte, identifie :

1. CARACTÉRISTIQUES VOCALES
- Intensité émotionnelle (0-100%)
- Type de voix :
  * Murmure/Chuchotement
  * Voix normale
  * Gémissement
  * Cri de plaisir
- Rythme de parole :
  * Très lent (passion intense)
  * Lent (sensuel)
  * Normal (narratif)
  * Rapide (excitation)
- Variations de hauteur :
  * Plus grave (-20% à 0%)
  * Normal (0%)
  * Plus aigu (0% à +20%)

2. EXPRESSIONS ET ONOMATOPÉES
- Respirations :
  * Légères
  * Profondes
  * Haletantes
- Sons spécifiques :
  * "mmmh"
  * "ahhh"
  * "ohhh"
  * Gémissements
- Durée des sons (en ms)

3. PARAMÈTRES ELEVENLABS
- stability (0.0-1.0) :
  * 0.1-0.3 pour forte émotion
  * 0.4-0.6 pour passion modérée
  * 0.7-1.0 pour voix stable
- similarity_boost (0.0-1.0) :
  * 0.8-1.0 pour expressions intenses
  * 0.5-0.7 pour ton normal
  * 0.3-0.4 pour murmures

4. ENVIRONNEMENT
- Lieu décrit (chambre, plage, etc.)
- Ambiance sonore suggérée
- Correspondance avec les sons disponibles :
  * mid-nights-sound-291477.mp3 (ambiance nuit)
  * ocean-waves-112906.mp3 (vagues)
  * forest-ambience-296528.mp3 (forêt)
  * city-ambience-9270.mp3 (ville)

Retourne au format JSON :
{
  "segments": [{
    "text": "texte",
    "vocal": {
      "intensity": 85,
      "type": "gémissement",
      "rhythm": "très lent",
      "pitch": -10
    },
    "expressions": {
      "breathing": "haletante",
      "sounds": ["mmmh", "ahhh"],
      "duration": 800
    },
    "elevenlabs": {
      "stability": 0.2,
      "similarity_boost": 0.9
    },
    "environment": {
      "type": "chambre",
      "suggestedSound": "mid-nights-sound-291477.mp3"
    }
  }]
}

Analyse uniquement le texte suivant :
${text}
`;

    // Appel à l'API Grok selon la documentation officielle
    console.log('Envoi de la requête à l\'API Grok...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'Tu es un assistant spécialisé dans l\'analyse de textes érotiques pour la génération audio.' },
          { role: 'user', content: prompt }
        ],
        model: 'grok-3', // Modèle mis à jour selon l'exemple
        temperature: 0.7
        // Suppression des paramètres non documentés
      })
    });

    // Vérifier si la réponse est OK avec une meilleure gestion des erreurs
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Réponse d\'erreur complète:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
    }

    // Récupérer la réponse JSON
    const responseData = await response.json();
    console.log('Réponse de l\'API Grok reçue');
    
    // Extraire la réponse
    const content = responseData.choices[0].message.content;
    logger.debug('Réponse brute de Grok:', content);

    // Extraire le JSON de la réponse
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                     content.match(/```\n([\s\S]*?)\n```/) || 
                     content.match(/{[\s\S]*}/);
    
    if (!jsonMatch) {
      throw new Error('Format de réponse invalide de Grok');
    }

    // Parser le JSON
    const jsonContent = jsonMatch[1] || jsonMatch[0];
    const parsedResponse = JSON.parse(jsonContent) as GrokAnalysisResponse;
    
    logger.debug('Segments analysés par Grok:', parsedResponse.segments);
    logger.groupEnd();

    return parsedResponse.segments;
  } catch (error) {
    logger.error('Erreur lors de l\'analyse avec Grok:', error);
    console.error('Erreur détaillée:', error);
    
    // En cas d'erreur, retourner un segment par défaut
    const defaultSegment: EnhancedSegment = {
      text: text,
      vocal: {
        intensity: 70,
        type: 'normal',
        rhythm: 'lent',
        pitch: -5
      },
      expressions: {
        breathing: 'légère',
        sounds: [],
        duration: 500
      },
      elevenlabs: {
        stability: 0.65,
        similarity_boost: 0.8
      },
      environment: {
        type: 'chambre',
        suggestedSound: 'mid-nights-sound-291477.mp3'
      }
    };
    
    return [defaultSegment];
  }
};

/**
 * Analyse un texte pour détecter les environnements et les émotions
 * @param text Le texte à analyser
 * @returns Une liste de segments avec leurs environnements et paramètres vocaux
 */
export const analyzeTextEnvironments = async (text: string): Promise<EnvironmentDetection[]> => {
  try {
    logger.group('Analyse du texte');
    logger.info('Début de l\'analyse pour le texte:', text);

    // Utiliser l'analyse Grok pour obtenir des segments détaillés
    const enhancedSegments = await analyzeTextWithGrok(text);
    logger.debug('Segments analysés par Grok:', enhancedSegments);

    // Convertir les segments Grok en EnvironmentDetection
    let results: EnvironmentDetection[] = enhancedSegments.map(segment => {
      // Déterminer l'environnement et les sons associés
      const environment = segment.environment?.type || 'chambre';
      const soundEffects = mapEnvironmentToSounds(environment);
      
      // Déterminer le ton émotionnel en fonction de l'intensité et du type vocal
      let emotionalTone = 'sensuel'; // Par défaut
      if (segment.vocal.type === 'gémissement' || segment.vocal.intensity > 80) {
        emotionalTone = 'excite';
      } else if (segment.vocal.type === 'cri' || segment.vocal.intensity > 90) {
        emotionalTone = 'jouissance';
      } else if (segment.vocal.type === 'murmure' || segment.vocal.type === 'chuchotement') {
        emotionalTone = 'murmure';
      } else if (segment.vocal.intensity > 70) {
        emotionalTone = 'intense';
      } else if (segment.vocal.intensity < 50) {
        emotionalTone = 'doux';
      }
      
      // Déterminer le débit de parole
      const speechRate = segment.vocal.rhythm === 'très lent' ? 'très lent' :
                        segment.vocal.rhythm === 'lent' ? 'lent' :
                        segment.vocal.rhythm === 'rapide' ? 'rapide' :
                        'modéré';
      
      // Déterminer le volume
      const volume = segment.vocal.intensity > 80 ? 'fort' :
                    segment.vocal.intensity < 50 ? 'doux' :
                    'normal';
      
      return {
        segment: segment.text,
        environment,
        soundEffects,
        emotionalTone,
        speechRate,
        volume,
        // Ajouter les paramètres ElevenLabs
        elevenlabsParams: {
          stability: segment.elevenlabs.stability,
          similarity_boost: segment.elevenlabs.similarity_boost,
          speed: segment.vocal.rhythm === 'très lent' ? '25%' :
                segment.vocal.rhythm === 'lent' ? '35%' :
                segment.vocal.rhythm === 'rapide' ? '55%' :
                '45%',
          pitch_shift: segment.vocal.pitch
        },
        // Ajouter les détails des expressions
        expressionDetails: {
          breathing: segment.expressions.breathing,
          sounds: segment.expressions.sounds,
          duration: segment.expressions.duration
        }
      };
    });

    // Ajouter les informations de timing pour chaque segment
    let currentTime = 0;
    results = results.map((segment: EnvironmentDetection, index: number) => {
      const timing = calculateTiming(segment.segment, segment.speechRate);
      
      // Ajouter les informations de timing au segment
      const enhancedSegment = {
        ...segment,
        startTime: currentTime,
        duration: timing.estimatedDuration,
        fadeIn: timing.fadeIn,
        fadeOut: timing.fadeOut,
        transition: {
          type: timing.transitionType,
          duration: timing.transitionDuration
        }
      };
      
      // Mettre à jour le temps de début pour le prochain segment
      currentTime += timing.estimatedDuration;
      if (timing.transitionType === 'crossfade' && index < results.length - 1) {
        currentTime -= timing.transitionDuration;
      }
      
      return enhancedSegment;
    });

    logger.debug('Résultats de l\'analyse avec timing:', results);
    logger.groupEnd();

    return results;
  } catch (error) {
    logger.error('Erreur lors de l\'analyse du texte:', error);
    logger.info('Utilisation de l\'analyse locale de secours');
    
    // En cas d'erreur, utiliser l'analyse locale simple
    return analyzeTextLocally(text);
  }
};

/**
 * Analyse locale simple du texte (utilisée comme fallback)
 * @param text Le texte à analyser
 * @returns Une liste de segments avec leurs environnements et paramètres vocaux
 */
const analyzeTextLocally = async (text: string): Promise<EnvironmentDetection[]> => {
  try {
    logger.group('Analyse locale du texte');
    logger.info('Début de l\'analyse locale pour le texte:', text);

    // Diviser le texte en paragraphes
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // Si pas de paragraphes, considérer le texte entier comme un segment
    const segments = paragraphs.length > 0 ? paragraphs : [text];
    
    // Créer un résultat par défaut pour chaque segment
    let results: EnvironmentDetection[] = segments.map(segment => {
      // Analyse simple pour déterminer l'environnement et l'émotion
      let environment = 'chambre';
      let emotionalTone = 'sensuel';
      
      // Mots-clés pour détecter l'environnement
      if (segment.toLowerCase().includes('plage') || segment.toLowerCase().includes('mer') || segment.toLowerCase().includes('vague')) {
        environment = 'plage';
      } else if (segment.toLowerCase().includes('forêt') || segment.toLowerCase().includes('bois') || segment.toLowerCase().includes('arbre')) {
        environment = 'forêt';
      } else if (segment.toLowerCase().includes('pluie') || segment.toLowerCase().includes('orage')) {
        environment = 'pluie';
      } else if (segment.toLowerCase().includes('ville') || segment.toLowerCase().includes('rue')) {
        environment = 'ville';
      }
      
      // Mots-clés pour détecter l'émotion
      if (segment.toLowerCase().includes('gémis') || segment.toLowerCase().includes('soupir') || segment.toLowerCase().includes('excit')) {
        emotionalTone = 'excite';
      } else if (segment.toLowerCase().includes('extase') || segment.toLowerCase().includes('jouir') || segment.toLowerCase().includes('orgasme')) {
        emotionalTone = 'jouissance';
      } else if (segment.toLowerCase().includes('murmure') || segment.toLowerCase().includes('chuchot')) {
        emotionalTone = 'murmure';
      } else if (segment.toLowerCase().includes('fort') || segment.toLowerCase().includes('intense') || segment.toLowerCase().includes('violent')) {
        emotionalTone = 'intense';
      } else if (segment.toLowerCase().includes('doux') || segment.toLowerCase().includes('tendre')) {
        emotionalTone = 'doux';
      }
      
      // Détecter les onomatopées
      const onomatopees = [];
      if (segment.match(/m+h+h+/i)) onomatopees.push('mhhh');
      if (segment.match(/a+h+h+/i)) onomatopees.push('ahhh');
      if (segment.match(/o+h+h+/i)) onomatopees.push('ohhh');
      if (segment.match(/h+a+h+/i)) onomatopees.push('hahh');
      if (segment.match(/o+u+i+/i)) onomatopees.push('oui');
      
      return {
        segment,
        environment,
        soundEffects: mapEnvironmentToSounds(environment),
        emotionalTone,
        speechRate: 'lent',
        volume: 'normal',
        // Ajouter des paramètres ElevenLabs par défaut
        elevenlabsParams: {
          stability: emotionalTone === 'jouissance' ? 0.3 :
                    emotionalTone === 'excite' ? 0.4 :
                    emotionalTone === 'murmure' ? 0.8 :
                    emotionalTone === 'intense' ? 0.4 :
                    0.65, // sensuel ou doux
          similarity_boost: emotionalTone === 'jouissance' ? 0.95 :
                          emotionalTone === 'excite' ? 0.9 :
                          emotionalTone === 'murmure' ? 0.75 :
                          emotionalTone === 'intense' ? 0.9 :
                          0.8, // sensuel ou doux
          speed: '35%', // Lent par défaut
          pitch_shift: emotionalTone === 'murmure' ? -10 :
                      emotionalTone === 'jouissance' ? 5 :
                      -5 // Autres émotions
        },
        // Ajouter des détails d'expression par défaut
        expressionDetails: {
          breathing: emotionalTone === 'jouissance' || emotionalTone === 'excite' ? 'haletante' :
                    emotionalTone === 'intense' ? 'profonde' :
                    'légère',
          sounds: onomatopees,
          duration: 500
        }
      };
    });

    // Ajouter les informations de timing pour chaque segment
    let currentTime = 0;
    results = results.map((segment: EnvironmentDetection, index: number) => {
      const timing = calculateTiming(segment.segment, segment.speechRate);
      
      // Ajouter les informations de timing au segment
      const enhancedSegment = {
        ...segment,
        startTime: currentTime,
        duration: timing.estimatedDuration,
        fadeIn: timing.fadeIn,
        fadeOut: timing.fadeOut,
        transition: {
          type: timing.transitionType,
          duration: timing.transitionDuration
        }
      };
      
      // Mettre à jour le temps de début pour le prochain segment
      currentTime += timing.estimatedDuration;
      if (timing.transitionType === 'crossfade' && index < results.length - 1) {
        currentTime -= timing.transitionDuration;
      }
      
      return enhancedSegment;
    });

    logger.debug('Résultats de l\'analyse locale avec timing:', results);
    logger.groupEnd();

    return results;
  } catch (error) {
    logger.error('Erreur lors de l\'analyse locale du texte:', error);
    
    // En cas d'erreur, retourner un segment par défaut
    const defaultSegment: EnvironmentDetection = {
      segment: text,
      environment: 'chambre',
      soundEffects: ['mid-nights-sound-291477.mp3'],
      emotionalTone: 'sensuel',
      speechRate: 'lent',
      volume: 'normal',
      startTime: 0,
      duration: 10,
      fadeIn: 0.5,
      fadeOut: 0.5,
      transition: {
        type: 'crossfade',
        duration: 0.5
      },
      elevenlabsParams: {
        stability: 0.65,
        similarity_boost: 0.8,
        speed: '35%',
        pitch_shift: -5
      },
      expressionDetails: {
        breathing: 'légère',
        sounds: [],
        duration: 500
      }
    };
    
    return [defaultSegment];
  }
};

/**
 * Mappe un environnement à des fichiers audio MP3 réels
 * @param environment Le nom de l'environnement
 * @returns Une liste d'URLs de fichiers audio
 */
export const mapEnvironmentToSounds = (environment: string): string[] => {
  // Mapping des environnements aux fichiers MP3 réels
  const environmentSounds: Record<string, string[]> = {
    plage: ['ocean-waves-112906.mp3', 'sea-and-seagull-wave-5932.mp3'],
    mer: ['ocean-waves-112906.mp3', 'sea-wave-34088.mp3'],
    océan: ['ocean-waves-112906.mp3', 'sea-and-seagull-wave-5932.mp3'],
    forêt: ['forest-ambience-296528.mp3', 'bird-333090.mp3'],
    bois: ['forest-ambience-296528.mp3', 'bird-333090.mp3'],
    pluie: ['light-spring-rain-nature-sounds-331710.mp3', 'calm-nature-sounds-196258.mp3'],
    orage: ['light-spring-rain-nature-sounds-331710.mp3', 'calm-nature-sounds-196258.mp3'],
    ville: ['city-ambience-9270.mp3', 'opening-the-front-door-210347.mp3'],
    rue: ['city-ambience-9270.mp3', 'opening-the-front-door-210347.mp3'],
    chambre: ['mid-nights-sound-291477.mp3', 'main-door-opening-closing-38280.mp3'],
    lit: ['mid-nights-sound-291477.mp3', 'main-door-opening-closing-38280.mp3'],
    ruisseau: ['relaxing-mountains-rivers-streams-running-water-18178.mp3', 'river-26984.mp3'],
    rivière: ['relaxing-mountains-rivers-streams-running-water-18178.mp3', 'river-26984.mp3'],
    vent: ['windy-hut-fx-64675.mp3'],
    nature: ['calm-nature-sounds-196258.mp3', 'bird-333090.mp3'],
    porte: ['main-door-opening-closing-38280.mp3', 'opening-the-front-door-210347.mp3'],
    nuit: ['mid-nights-sound-291477.mp3'],
    default: ['calm-nature-sounds-196258.mp3']
  };

  // Normaliser l'environnement (minuscules, sans accents)
  const normalizedEnv = environment.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '_');

  // Rechercher l'environnement dans le mapping
  for (const [env, sounds] of Object.entries(environmentSounds)) {
    const normalizedKey = env.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '_');
    
    if (normalizedEnv.includes(normalizedKey) || normalizedKey.includes(normalizedEnv)) {
      logger.debug(`Environnement "${environment}" mappé à "${env}" avec les sons:`, sounds);
      return sounds;
    }
  }

  // Environnement par défaut si aucune correspondance n'est trouvée
  logger.warn(`Aucun environnement trouvé pour "${environment}", utilisation des sons par défaut`);
  return environmentSounds.default;
};
