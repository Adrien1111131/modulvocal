/**
 * Service de stockage temporaire des histoires
 * 
 * Ce service permet de stocker temporairement les histoires en mémoire
 * et de les récupérer via un ID de session unique.
 * 
 * Note: Dans un environnement de production, il faudrait utiliser une base de données
 * ou un service de stockage externe comme Redis, MongoDB, etc.
 */

import crypto from 'crypto';

// Stockage en mémoire des histoires
// Format: { sessionId: { text, timestamp, metadata } }
const storyStorage = new Map();

// Durée de vie des histoires en millisecondes (24 heures par défaut)
const STORY_TTL = 24 * 60 * 60 * 1000;

/**
 * Génère un ID de session unique
 * @returns {string} ID de session
 */
const generateSessionId = () => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${randomBytes}`;
};

/**
 * Stocke une histoire et retourne un ID de session
 * @param {string} text Le texte de l'histoire
 * @param {Object} metadata Métadonnées optionnelles (auteur, titre, etc.)
 * @returns {string} ID de session
 */
export const storeStory = (text, metadata = {}) => {
  const sessionId = generateSessionId();
  const timestamp = Date.now();
  
  storyStorage.set(sessionId, {
    text,
    timestamp,
    metadata
  });
  
  console.log(`Histoire stockée avec l'ID de session: ${sessionId}`);
  console.log(`Longueur du texte: ${text.length} caractères`);
  
  // Planifier la suppression de l'histoire après expiration
  setTimeout(() => {
    if (storyStorage.has(sessionId)) {
      storyStorage.delete(sessionId);
      console.log(`Histoire expirée et supprimée: ${sessionId}`);
    }
  }, STORY_TTL);
  
  return sessionId;
};

/**
 * Récupère une histoire à partir de son ID de session
 * @param {string} sessionId ID de session
 * @returns {Object|null} L'histoire ou null si non trouvée
 */
export const getStory = (sessionId) => {
  if (!storyStorage.has(sessionId)) {
    console.log(`Histoire non trouvée pour l'ID de session: ${sessionId}`);
    return null;
  }
  
  const story = storyStorage.get(sessionId);
  console.log(`Histoire récupérée pour l'ID de session: ${sessionId}`);
  
  return story;
};

/**
 * Supprime une histoire à partir de son ID de session
 * @param {string} sessionId ID de session
 * @returns {boolean} true si l'histoire a été supprimée, false sinon
 */
export const deleteStory = (sessionId) => {
  if (!storyStorage.has(sessionId)) {
    return false;
  }
  
  storyStorage.delete(sessionId);
  console.log(`Histoire supprimée manuellement: ${sessionId}`);
  
  return true;
};

/**
 * Nettoie les histoires expirées
 * @returns {number} Nombre d'histoires supprimées
 */
export const cleanupExpiredStories = () => {
  const now = Date.now();
  let count = 0;
  
  for (const [sessionId, story] of storyStorage.entries()) {
    if (now - story.timestamp > STORY_TTL) {
      storyStorage.delete(sessionId);
      count++;
    }
  }
  
  if (count > 0) {
    console.log(`${count} histoires expirées ont été nettoyées`);
  }
  
  return count;
};

// Nettoyer les histoires expirées toutes les heures
setInterval(cleanupExpiredStories, 60 * 60 * 1000);

// Statistiques du stockage
export const getStorageStats = () => {
  return {
    count: storyStorage.size,
    oldestTimestamp: Array.from(storyStorage.values())
      .reduce((oldest, story) => Math.min(oldest, story.timestamp), Date.now()),
    newestTimestamp: Array.from(storyStorage.values())
      .reduce((newest, story) => Math.max(newest, story.timestamp), 0)
  };
};
