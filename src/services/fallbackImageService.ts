import { logger } from '../config/development';

/**
 * Service pour fournir des images de fallback en cas d'échec de l'API Grok
 */

// Mapping des environnements aux noms de fichiers d'images
const environmentImageMap: Record<string, string> = {
  'chambre': 'bedroom',
  'plage': 'beach',
  'mer': 'beach',
  'océan': 'beach',
  'forêt': 'forest',
  'bois': 'forest',
  'ville': 'city',
  'rue': 'city',
  'pluie': 'rain',
  'orage': 'rain',
  'nuit': 'night',
  'default': 'bedroom'
};

// Mapping des émotions aux noms de fichiers d'images
const emotionImageMap: Record<string, string> = {
  'sensuel': 'sensual',
  'excite': 'excited',
  'jouissance': 'pleasure',
  'murmure': 'whisper',
  'intense': 'intense',
  'doux': 'soft',
  'default': 'sensual'
};

/**
 * Obtient l'URL d'une image de fallback basée sur l'environnement et l'émotion
 * @param environment L'environnement détecté
 * @param emotion L'émotion détectée
 * @returns URL de l'image de fallback
 */
export const getFallbackImageUrl = (environment: string, emotion: string): string => {
  logger.debug('Génération d\'une image de fallback pour:', { environment, emotion });
  
  // Normaliser l'environnement et l'émotion
  const normalizedEnv = environment.toLowerCase();
  const normalizedEmotion = emotion.toLowerCase();
  
  // Trouver la correspondance d'environnement
  let envKey = 'default';
  for (const [key, _] of Object.entries(environmentImageMap)) {
    if (normalizedEnv.includes(key) || key.includes(normalizedEnv)) {
      envKey = key;
      break;
    }
  }
  
  // Trouver la correspondance d'émotion
  let emotionKey = 'default';
  for (const [key, _] of Object.entries(emotionImageMap)) {
    if (normalizedEmotion.includes(key) || key.includes(normalizedEmotion)) {
      emotionKey = key;
      break;
    }
  }
  
  // Construire le nom de fichier
  const envImage = environmentImageMap[envKey];
  const emotionImage = emotionImageMap[emotionKey];
  
  // Construire l'URL du placeholder HTML avec les paramètres
  const placeholderUrl = `/images/fallback/placeholder.html?environment=${encodeURIComponent(envKey)}&emotion=${encodeURIComponent(emotionKey)}`;
  logger.debug('URL de l\'image de fallback:', placeholderUrl);
  
  return placeholderUrl;
};

/**
 * Obtient une URL d'image de fallback garantie d'exister
 * @param environment L'environnement détecté
 * @param emotion L'émotion détectée
 * @returns URL d'une image de fallback qui existe
 */
export const getGuaranteedFallbackImageUrl = (environment: string, emotion: string): string => {
  // Utiliser directement le placeholder HTML
  return getFallbackImageUrl(environment, emotion);
};

/**
 * Génère une description textuelle basée sur l'environnement et l'émotion
 * @param environment L'environnement détecté
 * @param emotion L'émotion détectée
 * @returns Description textuelle
 */
export const generateImageDescription = (environment: string, emotion: string): string => {
  const envDescriptions: Record<string, string> = {
    'chambre': 'une chambre intime',
    'plage': 'une plage au coucher du soleil',
    'mer': 'la mer avec des vagues douces',
    'océan': 'l\'océan à perte de vue',
    'forêt': 'une forêt dense et mystérieuse',
    'bois': 'un bois paisible',
    'ville': 'une ville animée la nuit',
    'rue': 'une rue déserte',
    'pluie': 'une pluie fine et romantique',
    'orage': 'un orage puissant',
    'nuit': 'une nuit étoilée',
    'default': 'un lieu intime'
  };
  
  const emotionDescriptions: Record<string, string> = {
    'sensuel': 'une ambiance sensuelle',
    'excite': 'une excitation palpable',
    'jouissance': 'un moment de plaisir intense',
    'murmure': 'des murmures doux',
    'intense': 'une intensité brûlante',
    'doux': 'une douceur enveloppante',
    'default': 'une ambiance intime'
  };
  
  // Trouver les descriptions correspondantes
  let envDesc = envDescriptions['default'];
  for (const [key, desc] of Object.entries(envDescriptions)) {
    if (environment.toLowerCase().includes(key) || key.includes(environment.toLowerCase())) {
      envDesc = desc;
      break;
    }
  }
  
  let emotionDesc = emotionDescriptions['default'];
  for (const [key, desc] of Object.entries(emotionDescriptions)) {
    if (emotion.toLowerCase().includes(key) || key.includes(emotion.toLowerCase())) {
      emotionDesc = desc;
      break;
    }
  }
  
  return `Image représentant ${envDesc} avec ${emotionDesc}.`;
};
