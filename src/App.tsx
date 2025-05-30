import React, { useState, useEffect } from 'react';
import TextInput from './components/TextInput';
import VoicePlayer from './components/VoicePlayer';
import { generateVoice, generateVoiceWithEnvironment } from './services/elevenLabsAPI';
import { analyzeTextEnvironments } from './services/grokService';
import { logger } from './config/development';
import axios from 'axios';
import './App.css';

// URL de base de l'API (à remplacer par l'URL de votre API déployée sur Vercel)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedEnvironment, setDetectedEnvironment] = useState<string>('default');
  const [detectedEmotion, setDetectedEmotion] = useState<string>('sensuel');

  // Récupérer l'histoire depuis l'ID de session dans l'URL
  useEffect(() => {
    const fetchStoryFromSession = async () => {
      try {
        // Récupérer les paramètres de l'URL
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('sessionId');
        
        if (sessionId) {
          logger.info('ID de session détecté dans l\'URL:', sessionId);
          console.log('ID de session détecté dans l\'URL:', sessionId);
          
          setIsLoading(true);
          setError(null);
          
          // Récupérer l'histoire depuis l'API
          const response = await axios.get(`${API_BASE_URL}/get-story`, {
            params: { sessionId }
          });
          
          if (response.data.success && response.data.text) {
            logger.info('Histoire récupérée avec succès depuis l\'ID de session');
            console.log('Histoire récupérée avec succès depuis l\'ID de session');
            
            // Définir le texte de l'histoire
            setInputText(response.data.text);
            
            // Analyser le texte pour détecter l'environnement et l'émotion
            try {
              const detections = await analyzeTextEnvironments(response.data.text);
              if (detections.length > 0) {
                setDetectedEnvironment(detections[0].environment);
                setDetectedEmotion(detections[0].emotionalTone);
              }
            } catch (err) {
              logger.error('Erreur lors de l\'analyse du texte:', err);
            }
            
            // Générer automatiquement la voix après un court délai
            setTimeout(() => {
              handleGenerateVoice();
            }, 1000);
          } else {
            logger.error('Erreur lors de la récupération de l\'histoire:', response.data.message);
            setError(`Erreur lors de la récupération de l'histoire: ${response.data.message}`);
          }
        }
      } catch (err) {
        logger.error('Erreur lors de la récupération de l\'histoire:', err);
        console.error('Erreur lors de la récupération de l\'histoire:', err);
        
        let errorMessage = "Erreur lors de la récupération de l'histoire. ";
        
        if (err instanceof Error) {
          errorMessage += err.message;
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStoryFromSession();
  }, []);

  // Vérifier les variables d'environnement au chargement
  useEffect(() => {
    const checkEnvironmentVariables = () => {
      const missingVars = [];
      
      if (!import.meta.env.VITE_ELEVENLABS_API_KEY) {
        missingVars.push('VITE_ELEVENLABS_API_KEY');
      }
      if (!import.meta.env.VITE_ELEVENLABS_VOICE_ID) {
        missingVars.push('VITE_ELEVENLABS_VOICE_ID');
      }
      if (!import.meta.env.VITE_GROK_API_KEY) {
        missingVars.push('VITE_GROK_API_KEY');
      }

      if (missingVars.length > 0) {
        const errorMsg = `Variables d'environnement manquantes : ${missingVars.join(', ')}`;
        logger.error(errorMsg);
        setError(errorMsg);
        return false;
      }

      logger.info('Variables d\'environnement vérifiées avec succès');
      return true;
    };

    // Vérifier le support de l'API Web Audio
    const checkWebAudioSupport = () => {
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        const errorMsg = 'Web Audio API non supportée par ce navigateur';
        logger.error(errorMsg);
        setError(errorMsg);
        return false;
      }
      
      logger.info('Web Audio API supportée');
      return true;
    };

    // Vérifier le contexte sécurisé
    const checkSecureContext = () => {
      if (!window.isSecureContext) {
        const errorMsg = 'L\'application doit être exécutée dans un contexte sécurisé (HTTPS)';
        logger.error(errorMsg);
        setError(errorMsg);
        return false;
      }
      
      logger.info('Contexte sécurisé vérifié');
      return true;
    };

    // Effectuer toutes les vérifications
    const envOk = checkEnvironmentVariables();
    const audioOk = checkWebAudioSupport();
    const secureOk = checkSecureContext();

    if (envOk && audioOk && secureOk) {
      logger.info('Toutes les vérifications système sont passées avec succès');
      console.log('Environnement de production:', {
        nodeEnv: import.meta.env.MODE,
        baseUrl: import.meta.env.BASE_URL,
        userAgent: window.navigator.userAgent,
        isSecureContext: window.isSecureContext
      });
    }
  }, []);

  useEffect(() => {
    logger.group('État de l\'application');
    logger.debug('État actuel:', {
      inputText,
      audioUrl,
      isLoading,
      error,
      detectedEnvironment,
      detectedEmotion
    });
    logger.groupEnd();
  }, [inputText, audioUrl, isLoading, error, detectedEnvironment, detectedEmotion]);

  const handleTextChange = (text: string) => {
    logger.debug('Changement de texte:', text);
    setInputText(text);
    setError(null);

    // Analyser le texte pour détecter l'environnement, l'émotion et les paramètres vocaux
    if (text.trim()) {
      analyzeTextEnvironments(text)
        .then(detections => {
          if (detections.length > 0) {
            setDetectedEnvironment(detections[0].environment);
            setDetectedEmotion(detections[0].emotionalTone);
            logger.debug('Environnement détecté:', detections[0].environment);
            logger.debug('Émotion détectée:', detections[0].emotionalTone);
          }
        })
        .catch(err => {
          logger.error('Erreur lors de la détection de l\'environnement et de l\'émotion:', err);
          setDetectedEnvironment('default');
          setDetectedEmotion('sensuel');
        });
    } else {
      setDetectedEnvironment('default');
      setDetectedEmotion('sensuel');
    }
  };


  const handleGenerateVoice = async () => {
    logger.group('Génération de la voix');
    logger.info('Début de la génération');
    logger.debug('Texte actuel:', inputText);
    logger.debug('Environnement détecté:', detectedEnvironment);
    logger.debug('Émotion détectée:', detectedEmotion);
    
    // Afficher les logs dans la console du navigateur
    console.log('Début de la génération de la voix');
    console.log('Texte:', inputText);
    console.log('Environnement:', detectedEnvironment);
    console.log('Émotion:', detectedEmotion);
    
    if (!inputText.trim()) {
      const errorMsg = "Veuillez entrer du texte avant de générer la voix";
      logger.warn(errorMsg);
      setError(errorMsg);
      logger.groupEnd();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Utiliser directement le texte brut sans ajouter de balises
      logger.debug('Analyse du texte par Grok:', inputText);
      console.log('Analyse du texte par Grok');

      // Utiliser la méthode avec environnement intégré
      console.log('Génération de voix avec environnement intégré');
      const url = await generateVoiceWithEnvironment(inputText, true);
      console.log('Génération avec environnement réussie');
      
      logger.info('URL audio reçue:', url);
      console.log('URL audio reçue:', url);
      
      // Vérifier que l'URL est valide
      if (!url) {
        throw new Error('URL audio invalide reçue');
      }

      setAudioUrl(url);
      logger.info('Audio URL mise à jour avec succès');
      console.log('Audio URL mise à jour avec succès');
      
      // Forcer une mise à jour de l'interface
      setTimeout(() => {
        console.log('Mise à jour forcée de l\'interface');
        setIsLoading(false);
      }, 500);
    } catch (err) {
      logger.error('Erreur lors de la génération de la voix:', err);
      console.error('Erreur lors de la génération de la voix:', err);
      
      let errorMessage = "Erreur lors de la génération de la voix. ";
      
      if (err instanceof Error) {
        errorMessage += err.message;
        logger.error('Message d\'erreur:', err.message);
        logger.error('Stack trace:', err.stack);
        console.error('Message d\'erreur:', err.message);
        console.error('Stack trace:', err.stack);
      }
      
      setError(errorMessage);
    } finally {
      logger.info('Fin de la génération');
      console.log('Fin de la génération');
      setIsLoading(false);
      logger.groupEnd();
    }
  };

  return (
    <div className="app">
      <h1>Générateur de Voix Érotique</h1>
      <div className="app-container">
        <div className="controls-section">
          <TextInput onTextChange={handleTextChange} />
          <button 
            onClick={handleGenerateVoice}
            disabled={isLoading || !inputText.trim()}
            className="generate-button"
          >
            {isLoading ? 'Génération en cours...' : 'Générer la Voix'}
          </button>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        <div className="player-section">
          <VoicePlayer 
            audioUrl={audioUrl} 
            environment={detectedEnvironment}
            emotion={detectedEmotion}
            originalText={inputText}
          />
          {audioUrl && (
            <div className="audio-info">
              Audio généré avec succès
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
