import React, { useState, useEffect } from 'react';
import TextInput from './components/TextInput';
import VoicePlayer from './components/VoicePlayer';
import { generateVoiceWithEnvironment } from './services/elevenLabsAPI';
import { logger } from './config/development';
import './App.css';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  };

  const handleGenerateVoice = async () => {
    logger.group('Génération de la voix');
    logger.info('Début de la génération');
    logger.debug('Texte actuel:', inputText);
    
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

      const url = await generateVoiceWithEnvironment(inputText, true);
      logger.info('URL audio reçue:', url);
      
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
          <VoicePlayer audioUrl={audioUrl} />
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
