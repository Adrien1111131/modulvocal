import express from 'express';
import multer from 'multer';
import { generateVoice, generateVoiceWithEnvironment } from '../adapters/elevenLabsAdapter.js';
import { storeStory, getStory, deleteStory, getStorageStats } from '../services/storyStorage.js';

const router = express.Router();
const upload = multer(); // Pour gérer les données multipart/form-data si nécessaire

/**
 * @route POST /api/generate-voice
 * @desc Génère une voix à partir d'un texte
 * @access Public
 */
router.post('/generate-voice', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Le texte est requis et doit être une chaîne de caractères'
      });
    }
    
    console.log('Requête de génération vocale reçue');
    console.log('Longueur du texte:', text.length);
    
    // Limiter la taille du texte
    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Le texte est trop long (maximum 5000 caractères)'
      });
    }
    
    // Générer la voix
    const audioUrl = await generateVoice(text);
    
    // Renvoyer l'URL de l'audio
    return res.status(200).json({
      success: true,
      message: 'Voix générée avec succès',
      audioUrl,
      fullUrl: `${req.protocol}://${req.get('host')}${audioUrl}`
    });
  } catch (error) {
    console.error('Erreur lors de la génération de la voix:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération de la voix',
      error: error.message
    });
  }
});

/**
 * @route POST /api/generate-voice-with-environment
 * @desc Génère une voix avec environnement à partir d'un texte
 * @access Public
 */
router.post('/generate-voice-with-environment', async (req, res) => {
  try {
    const { text, useAI = false } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Le texte est requis et doit être une chaîne de caractères'
      });
    }
    
    console.log('Requête de génération vocale avec environnement reçue');
    console.log('Longueur du texte:', text.length);
    console.log('Utilisation de l\'IA:', useAI);
    
    // Limiter la taille du texte
    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Le texte est trop long (maximum 5000 caractères)'
      });
    }
    
    // Générer la voix avec environnement
    const audioUrl = await generateVoiceWithEnvironment(text, useAI);
    
    // Renvoyer l'URL de l'audio
    return res.status(200).json({
      success: true,
      message: 'Voix avec environnement générée avec succès',
      audioUrl,
      fullUrl: `${req.protocol}://${req.get('host')}${audioUrl}`
    });
  } catch (error) {
    console.error('Erreur lors de la génération de la voix avec environnement:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération de la voix avec environnement',
      error: error.message
    });
  }
});

/**
 * @route GET /api/status
 * @desc Vérifie le statut de l'API
 * @access Public
 */
router.get('/status', (req, res) => {
  // Obtenir les statistiques du stockage d'histoires
  const storageStats = getStorageStats();
  
  res.status(200).json({
    success: true,
    message: 'API de génération vocale opérationnelle',
    timestamp: new Date().toISOString(),
    storage: {
      stories: storageStats.count,
      oldestStory: storageStats.oldestTimestamp ? new Date(storageStats.oldestTimestamp).toISOString() : null,
      newestStory: storageStats.newestTimestamp ? new Date(storageStats.newestTimestamp).toISOString() : null
    }
  });
});

/**
 * @route POST /api/store-story
 * @desc Stocke une histoire et retourne un ID de session
 * @access Public
 */
router.post('/store-story', async (req, res) => {
  try {
    const { text, metadata = {} } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Le texte est requis et doit être une chaîne de caractères'
      });
    }
    
    console.log('Requête de stockage d\'histoire reçue');
    console.log('Longueur du texte:', text.length);
    
    // Stocker l'histoire et obtenir l'ID de session
    const sessionId = storeStory(text, metadata);
    
    // Construire l'URL de redirection
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const redirectUrl = `${baseUrl}?sessionId=${sessionId}`;
    
    // Renvoyer l'ID de session et l'URL de redirection
    return res.status(200).json({
      success: true,
      message: 'Histoire stockée avec succès',
      sessionId,
      redirectUrl
    });
  } catch (error) {
    console.error('Erreur lors du stockage de l\'histoire:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du stockage de l\'histoire',
      error: error.message
    });
  }
});

/**
 * @route GET /api/get-story
 * @desc Récupère une histoire à partir de son ID de session
 * @access Public
 */
router.get('/get-story', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID de session est requis'
      });
    }
    
    console.log('Requête de récupération d\'histoire reçue');
    console.log('ID de session:', sessionId);
    
    // Récupérer l'histoire
    const story = getStory(sessionId);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Histoire non trouvée pour cet ID de session'
      });
    }
    
    // Renvoyer l'histoire
    return res.status(200).json({
      success: true,
      message: 'Histoire récupérée avec succès',
      text: story.text,
      timestamp: story.timestamp,
      metadata: story.metadata
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'histoire:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'histoire',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/delete-story
 * @desc Supprime une histoire à partir de son ID de session
 * @access Public
 */
router.delete('/delete-story', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID de session est requis'
      });
    }
    
    console.log('Requête de suppression d\'histoire reçue');
    console.log('ID de session:', sessionId);
    
    // Supprimer l'histoire
    const deleted = deleteStory(sessionId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Histoire non trouvée pour cet ID de session'
      });
    }
    
    // Confirmer la suppression
    return res.status(200).json({
      success: true,
      message: 'Histoire supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'histoire:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'histoire',
      error: error.message
    });
  }
});

export default router;
