import React, { useRef, useEffect, useState } from 'react';
import { audioMixerService } from '../services/audioMixerService';
import { logger } from '../config/development';
import ImageDisplay from './ImageDisplay';
import { generateImageFromText } from '../services/grokImageService';

interface VoicePlayerProps {
  audioUrl: string | null;
  environment?: string;
  emotion?: string;
  originalText?: string; // Ajout du texte original
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ 
  audioUrl,
  environment = 'default',
  emotion = 'sensuel',
  originalText = ''
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | undefined>(undefined);

  useEffect(() => {
    console.log('VoicePlayer - useEffect [audioUrl]', { audioUrl });
    
    if (audioRef.current && audioUrl) {
      console.log('VoicePlayer - Chargement de l\'audio', { audioUrl });
      audioRef.current.load();
      
      // Ajouter un gestionnaire d'événements pour les erreurs de chargement
      const handleError = (e: ErrorEvent) => {
        console.error('VoicePlayer - Erreur de chargement audio:', e);
      };
      
      // Ajouter un gestionnaire d'événements pour le chargement réussi
      const handleCanPlay = () => {
        console.log('VoicePlayer - Audio prêt à être lu');
        // Activer les contrôles audio natifs pour une meilleure compatibilité
        if (audioRef.current) {
          audioRef.current.controls = true;
        }
      };
      
      audioRef.current.addEventListener('error', handleError as any);
      audioRef.current.addEventListener('canplay', handleCanPlay);
      
      // Initialiser le mixeur audio
      audioMixerService.resume();
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('error', handleError as any);
          audioRef.current.removeEventListener('canplay', handleCanPlay);
        }
        // Nettoyer le mixeur audio
        audioMixerService.stopAll();
      };
    }
    
    return () => {
      // Nettoyer le mixeur audio
      audioMixerService.stopAll();
    };
  }, [audioUrl, environment]);

  useEffect(() => {
    // Gérer les événements de lecture/pause de l'audio
    const handleAudioPlay = () => {
      setIsPlaying(true);
      // Reprendre le mixeur
      audioMixerService.resume();
    };

    const handleAudioPause = () => {
      setIsPlaying(false);
      // Mettre en pause le mixeur
      audioMixerService.suspend();
    };

    const handleAudioEnded = () => {
      setIsPlaying(false);
      // Arrêter le mixeur
      audioMixerService.stopAll();
    };

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('play', handleAudioPlay);
      audioRef.current.addEventListener('pause', handleAudioPause);
      audioRef.current.addEventListener('ended', handleAudioEnded);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('play', handleAudioPlay);
        audioRef.current.removeEventListener('pause', handleAudioPause);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    };
  }, []);

  useEffect(() => {
    // Synchroniser le volume du mixeur avec le volume du lecteur
    audioMixerService.setMasterVolume(volume);
  }, [volume]);
  
  // Fonction pour régénérer l'image
  const handleRegenerateImage = () => {
    setImageUrl(null);
    setImagePrompt('');
    setImageError(undefined);
    setIsGeneratingImage(false); // Ceci déclenchera la régénération via l'useEffect
  };
  
  // Générer l'image lorsque l'audio est disponible
  useEffect(() => {
    if (audioUrl && originalText && !imageUrl && !isGeneratingImage) {
      const generateImage = async () => {
        try {
          setIsGeneratingImage(true);
          console.log('Génération d\'image pour le texte:', originalText.substring(0, 50) + '...');
          
          // Utiliser le texte original directement
          const result = await generateImageFromText(originalText);
          setImageUrl(result.imageUrl);
          
          // Utiliser le texte original comme prompt au lieu du prompt généré
          // Limiter la longueur pour l'affichage
          const displayText = originalText.length > 150 ? 
            originalText.substring(0, 150) + '...' : 
            originalText;
          
          setImagePrompt(displayText);
          setImageError(result.error); // Stocker l'erreur éventuelle
        } catch (error) {
          console.error('Erreur lors de la génération de l\'image:', error);
          setImageError(error instanceof Error ? error.message : 'Erreur inconnue');
        } finally {
          setIsGeneratingImage(false);
        }
      };
      
      generateImage();
    }
  }, [audioUrl, originalText, imageUrl, isGeneratingImage]);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        logger.error('Erreur lors de la lecture:', error);
      });
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        logger.error('Erreur lors du redémarrage:', error);
      });
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(event.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-player">
      {audioUrl ? (
        <div>
          <audio 
            ref={audioRef} 
            src={audioUrl}
            controls
            style={{ width: '100%', marginBottom: '1rem' }}
          />
          <div className="progress-container">
            <span className="time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="progress-slider"
            />
            <span className="time">{formatTime(duration)}</span>
          </div>
          <div className="volume-container">
            <span className="volume-label">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
          </div>
          <div className="player-info">
            <span className="environment-display">Environnement: {environment}</span>
            <span className="emotion-display">Émotion: {emotion}</span>
          </div>
          
          {/* Section d'image améliorée */}
          <div className="player-image-section">
            <h3 className="image-section-title">Illustration générée</h3>
            {isGeneratingImage ? (
              <div className="image-loading">
                <div className="spinner"></div>
                <p>Génération de l'illustration en cours...</p>
              </div>
            ) : (
              <ImageDisplay 
                imageUrl={imageUrl} 
                prompt={imagePrompt} 
                error={imageError}
                onRegenerateClick={handleRegenerateImage}
              />
            )}
          </div>
        </div>
      ) : (
        <p>Aucun audio disponible</p>
      )}
      <style>
        {`
          .voice-player {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .player-controls {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .player-button {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            background: #007bff;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .player-button:disabled {
            background: #ccc;
            cursor: not-allowed;
          }

          .player-button:not(:disabled):hover {
            background: #0056b3;
          }

          .progress-container {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .progress-slider {
            flex: 1;
            height: 4px;
            -webkit-appearance: none;
            background: #ddd;
            border-radius: 2px;
            outline: none;
          }

          .progress-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            background: #007bff;
            border-radius: 50%;
            cursor: pointer;
          }

          .volume-container {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .volume-slider {
            width: 100px;
            height: 4px;
            -webkit-appearance: none;
            background: #ddd;
            border-radius: 2px;
            outline: none;
          }

          .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            background: #007bff;
            border-radius: 50%;
            cursor: pointer;
          }

          .time {
            font-family: monospace;
            min-width: 4ch;
          }

          .volume-label {
            min-width: 60px;
          }

          .player-info {
            margin-top: 1rem;
            padding: 0.8rem;
            background-color: #f0f8ff;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
          }

          .environment-display {
            font-style: italic;
            color: #666;
          }

          .emotion-display {
            color: #ff69b4;
            font-weight: bold;
          }
          
          .player-image-section {
            margin-top: 1.5rem;
            border-top: 1px solid #eee;
            padding-top: 1rem;
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 1rem;
          }
          
          .image-section-title {
            margin-top: 0;
            margin-bottom: 1rem;
            color: #333;
            font-size: 1.2rem;
            text-align: center;
          }
          
          .image-loading {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #007bff;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default VoicePlayer;
