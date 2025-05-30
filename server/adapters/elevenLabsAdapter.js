import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Configuration de base
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
const VOICE_ID = process.env.VITE_ELEVENLABS_VOICE_ID || '';
const API_KEY = process.env.VITE_ELEVENLABS_API_KEY || '';
const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

// Vérification de la présence des variables d'environnement
if (!VOICE_ID || !API_KEY) {
  console.error('Variables d\'environnement manquantes: VITE_ELEVENLABS_VOICE_ID ou VITE_ELEVENLABS_API_KEY');
}

/**
 * Fonction pour générer un nom de fichier unique
 * @returns {string} Nom de fichier unique
 */
const generateUniqueFilename = () => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `voice_${timestamp}_${randomString}.mp3`;
};

/**
 * Fonction pour sauvegarder un blob audio dans un fichier
 * @param {Buffer} audioBuffer Le buffer audio à sauvegarder
 * @returns {string} Le chemin du fichier sauvegardé
 */
const saveAudioToFile = (audioBuffer) => {
  const filename = generateUniqueFilename();
  const filePath = path.join(__dirname, '..', 'public', 'audio', filename);
  
  fs.writeFileSync(filePath, audioBuffer);
  
  return filename;
};

/**
 * Fonction simplifiée pour générer la voix
 * @param {string} text Le texte à convertir en voix
 * @returns {Promise<string>} URL du fichier audio généré
 */
export const generateVoice = async (text) => {
  try {
    console.log('Début de la génération pour le texte:', text);
    
    // Paramètres vocaux de base
    const settings = {
      stability: 0.5,
      similarity_boost: 0.75
    };
    
    // Appel à l'API ElevenLabs
    const response = await axios.post(
      API_URL,
      {
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: settings
      },
      {
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer'
      }
    );
    
    // Sauvegarder l'audio dans un fichier
    const filename = saveAudioToFile(response.data);
    
    // Construire l'URL complète
    const audioUrl = `/audio/${filename}`;
    console.log('URL audio générée:', audioUrl);
    
    return audioUrl;
  } catch (error) {
    console.error('Erreur lors de la génération de la voix:', error);
    if (axios.isAxiosError(error)) {
      console.error('Réponse de l\'API:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
    throw new Error('Échec de la génération de la voix');
  }
};

/**
 * Fonction simplifiée pour générer la voix avec environnement
 * @param {string} text Le texte à convertir en voix
 * @param {boolean} useAI Indique si on doit utiliser l'IA pour ajouter des sons d'environnement
 * @returns {Promise<string>} URL du fichier audio généré
 */
export const generateVoiceWithEnvironment = async (text, useAI = false) => {
  try {
    console.log('Génération de la voix avec environnement');
    console.log('Texte à traiter:', text);
    console.log('Utilisation de l\'IA:', useAI);
    
    // Pour cette version simplifiée, nous utilisons la même fonction de base
    // Dans une implémentation complète, vous devriez adapter la fonction complète
    // de votre fichier elevenLabsAPI.ts
    const audioUrl = await generateVoice(text);
    
    return audioUrl;
  } catch (error) {
    console.error('Erreur lors de la génération de la voix avec environnement:', error);
    
    // En cas d'erreur, essayer de générer une voix simple sans environnement
    console.log('Tentative de génération de voix simple sans environnement');
    try {
      const simpleVoiceUrl = await generateVoice(text);
      console.log('Génération de voix simple réussie');
      return simpleVoiceUrl;
    } catch (fallbackError) {
      console.error('Échec de la génération de voix simple:', fallbackError);
      throw error; // Renvoyer l'erreur originale
    }
  }
};
