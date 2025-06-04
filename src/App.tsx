import React, { useState, useEffect } from 'react';
import TextInput from './components/TextInput';
import VoicePlayer from './components/VoicePlayer';
import { generateVoiceWithEnvironment } from './services/elevenLabsAPI';
import { analyzeTextEnvironments } from './services/grokService';
import { logger } from './config/development';
import './App.css';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedEnvironment, setDetectedEnvironment] = useState<string>('default');
  const [detectedEmotion, setDetectedEmotion] = useState<string>('sensuel');

  // Récupérer le texte depuis sessionStorage lors du chargement initial
  useEffect(() => {
    try {
      // Essayer de récupérer le texte depuis sessionStorage
      const storyText = sessionStorage.getItem('storyText');
      
      if (storyText) {
        logger.info('Texte récupéré depuis sessionStorage');
        setInputText(storyText);
      } else {
        logger.info('Aucun texte trouvé dans sessionStorage');
      }
    } catch (err) {
      logger.error('Erreur lors de la récupération du texte:', err);
    }
  }, []);

  useEffect(() => {
    logger.group('État de l\'application');
    logger.debug('État actuel:', {
      inputText,
      audioUrl,
      isLoading,
      error
    });
    logger.groupEnd();
  }, [inputText, audioUrl, isLoading, error]);

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
      
      // Utiliser directement le texte sans ajouter de balises d'émotion
      // L'analyse sera faite par l'API Grok
      logger.debug('Texte à analyser:', inputText);

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
    } catch (err) {
      logger.error('Erreur lors de la génération de la voix:', err);
      let errorMessage = "Erreur lors de la génération de la voix. ";
      
      if (err instanceof Error) {
        errorMessage += err.message;
        logger.error('Message d\'erreur:', err.message);
        logger.error('Stack trace:', err.stack);
      }
      
      setError(errorMessage);
    } finally {
      logger.info('Fin de la génération');
      setIsLoading(false);
      logger.groupEnd();
    }
  };

  return (
    <div className="app">
      <h1>Générateur de Voix Érotique</h1>
      <div className="app-container">
        <div className="controls-section">
          <TextInput onTextChange={handleTextChange} initialText={inputText} />
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
