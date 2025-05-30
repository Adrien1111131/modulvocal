import { config, logger } from '../config/development';
import { analyzeTextEnvironments } from './grokService';
import { getFallbackImageUrl, generateImageDescription } from './fallbackImageService';

const API_KEY = import.meta.env.VITE_GROK_API_KEY || '';
const API_URL = 'https://api.x.ai/v1/images/generate'; // URL correcte selon la documentation
const CHAT_API_URL = 'https://api.x.ai/v1/chat/completions'; // URL pour l'API de chat
const USE_FALLBACK = false; // Désactiver le mode fallback pour tester l'API

export interface ImageGenerationResult {
  imageUrl: string | null;
  prompt: string;
  error?: string;
}

/**
 * Analyse un texte spécifiquement pour la génération d'images
 * @param text Le texte à analyser
 * @returns Un prompt détaillé pour la génération d'image
 */
export const analyzeTextForImageGeneration = async (text: string): Promise<string> => {
  try {
    logger.group('Analyse du texte pour la génération d\'image');
    logger.info('Début de l\'analyse pour le texte:', text);

    // Prompt spécifique pour l'analyse visuelle
    const prompt = `
Analyse cette histoire érotique écrite à la première personne et imagine une scène visuelle précise à représenter.

IMPORTANT : L'histoire est écrite du point de vue du narrateur et peut ne pas décrire explicitement une scène visuelle. Tu dois :
1. Identifier le moment le plus intense ou significatif de l'histoire
2. Imaginer comment cette scène apparaîtrait visuellement à un observateur externe
3. Créer un prompt détaillé pour générer une image de cette scène

Concentre-toi sur les éléments visuels importants :

1. PERSONNAGES
   - Apparence physique (même si non décrite explicitement dans l'histoire)
   - Expressions faciales (désir, plaisir, passion)
   - Positions corporelles précises
   - Vêtements (ou absence de)

2. ACTIONS
   - Mouvements spécifiques entre les personnages
   - Interactions physiques explicites
   - Moment le plus intense à représenter

3. ENVIRONNEMENT
   - Lieu précis avec détails visuels
   - Éclairage et ambiance (heure de la journée, sources de lumière)
   - Objets importants qui enrichissent la scène
   - Éléments de décor pertinents

4. STYLE VISUEL
   - Angle de vue optimal pour la scène
   - Cadrage (gros plan, plan moyen, plan large)
   - Atmosphère générale (intime, passionnée, intense)

Ton prompt d'image doit :
- Décrire précisément les personnages, leurs actions et l'environnement
- Être explicite sur les actions représentées sans censure
- Ne pas dépasser 1000 caractères

Texte à analyser :
${text}
`;

    // Appel à l'API Grok
    console.log('Envoi de la requête à l\'API Grok pour l\'analyse d\'image...');
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'Tu es un expert en création de prompts pour la génération d\'images érotiques.' },
          { role: 'user', content: prompt }
        ],
        model: 'grok-3',
        temperature: 0.7
      })
    });

    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Réponse d\'erreur complète:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
    }

    // Traitement de la réponse
    const responseData = await response.json();
    let imagePrompt = responseData.choices[0].message.content;
    
    // Extraire uniquement la partie finale du prompt
    let finalPrompt = imagePrompt;
    
    // Essayer d'extraire une section spécifique si elle existe
    if (imagePrompt.includes("### Prompt détaillé pour générer l'image")) {
      const parts = imagePrompt.split("### Prompt détaillé pour générer l'image");
      finalPrompt = parts[1].trim();
    } else if (imagePrompt.includes("Prompt détaillé pour générer l'image")) {
      const parts = imagePrompt.split("Prompt détaillé pour générer l'image");
      finalPrompt = parts[1].trim();
    } else if (imagePrompt.includes("Prompt d'image :")) {
      const parts = imagePrompt.split("Prompt d'image :");
      finalPrompt = parts[1].trim();
    } else if (imagePrompt.includes("Prompt final :")) {
      const parts = imagePrompt.split("Prompt final :");
      finalPrompt = parts[1].trim();
    }
    
    // Si le prompt est toujours trop long, extraire le dernier paragraphe substantiel
    if (finalPrompt.length > 1000) {
      const paragraphs = finalPrompt.split('\n\n').filter((p: string) => p.trim().length > 0);
      if (paragraphs.length > 0) {
        // Prendre le dernier paragraphe substantiel (plus de 100 caractères)
        for (let i = paragraphs.length - 1; i >= 0; i--) {
          if (paragraphs[i].length > 100) {
            finalPrompt = paragraphs[i];
            break;
          }
        }
      }
    }
    
    // Supprimer les guillemets si présents
    finalPrompt = finalPrompt.replace(/^["']|["']$/g, '');
    
    // S'assurer que le prompt ne dépasse pas 1024 caractères
    if (finalPrompt.length > 1000) {
      // Tronquer à la fin de la dernière phrase complète avant 1000 caractères
      const match = finalPrompt.substring(0, 1000).match(/.*[.!?]/);
      if (match) {
        finalPrompt = match[0];
      } else {
        finalPrompt = finalPrompt.substring(0, 997) + "...";
      }
    }
    
    logger.debug('Analyse complète:', imagePrompt);
    logger.debug('Prompt final pour l\'image:', finalPrompt);
    logger.groupEnd();
    
    return finalPrompt;
  } catch (error) {
    logger.error('Erreur lors de l\'analyse pour la génération d\'image:', error);
    console.error('Erreur détaillée:', error);
    
    // Prompt par défaut en cas d'erreur
    return `Une image érotique représentant une scène de ${text.length > 50 ? text.substring(0, 50) + '...' : text}`;
  }
};

/**
 * Génère une image basée sur l'analyse du texte
 * @param text Le texte à analyser
 * @returns URL de l'image générée et le prompt utilisé
 */
export const generateImageFromText = async (text: string): Promise<ImageGenerationResult> => {
  // Déclarer la variable prompt en dehors des blocs try/catch pour qu'elle soit accessible partout
  let finalPrompt = '';
  
  // Variables pour stocker l'environnement et l'émotion détectés (pour le fallback)
  let mainEnvironment = 'chambre';
  let mainEmotion = 'sensuel';
  
  try {
    logger.group('Génération d\'image');
    logger.info('Début de la génération d\'image pour le texte:', text);

    // Générer un prompt spécifique pour l'image
    finalPrompt = await analyzeTextForImageGeneration(text);
    
    // Pour le fallback, analyser quand même le texte pour extraire l'environnement et l'émotion
    const textAnalysis = await analyzeTextEnvironments(text);
    
    if (textAnalysis.length > 0) {
      // Extraire l'environnement principal
      const environments = textAnalysis.map(segment => segment.environment);
      mainEnvironment = environments.length > 0 ? 
        environments.sort((a, b) => 
          environments.filter(e => e === a).length - environments.filter(e => e === b).length
        ).pop() || 'chambre' : 'chambre';
      
      // Extraire l'émotion dominante
      const emotions = textAnalysis.map(segment => segment.emotionalTone);
      mainEmotion = emotions.length > 0 ? 
        emotions.sort((a, b) => 
          emotions.filter(e => e === a).length - emotions.filter(e => e === b).length
        ).pop() || 'sensuel' : 'sensuel';
    }
    
    logger.debug('Prompt généré:', finalPrompt);
    console.log('Prompt généré pour l\'image:', finalPrompt);

    // Si le mode fallback est activé, utiliser directement une image locale
    if (USE_FALLBACK) {
      console.log('Mode fallback activé, utilisation d\'une image locale');
      // Créer une description basée sur le texte original
      const description = text.length > 150 ? text.substring(0, 150) + '...' : text;
      const fallbackUrl = getFallbackImageUrl(mainEnvironment, mainEmotion);
      
      return {
        imageUrl: fallbackUrl,
        prompt: description
      };
    }
    
    // Sinon, essayer d'utiliser l'API Grok
    console.log('Envoi de la requête à l\'API Grok pour générer une image...');
    
    // Créer un timeout pour éviter les attentes infinies
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 secondes timeout
    
    try {
      // Appel à l'API selon la documentation officielle
      console.log('Envoi de la requête à l\'API Grok avec les paramètres corrects...');
      const response = await fetch(API_URL, {
        method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
        body: JSON.stringify({
          model: "grok-2-image-1212", // Nom exact du modèle selon la documentation
          prompt: finalPrompt,
          n: 1
          // Suppression du paramètre size qui n'est pas supporté selon l'erreur
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
      const data = await response.json();
      console.log('Réponse de l\'API Grok:', data);
      
      // Extraire l'URL de l'image selon le format documenté
      const imageUrl = data.data[0].url;
      console.log('URL de l\'image extraite:', imageUrl);
      
      if (!imageUrl) {
        throw new Error('Impossible d\'extraire l\'URL de l\'image de la réponse');
      }
      
      logger.debug('URL de l\'image générée:', imageUrl);
      
      // Si nous avons une URL d'image, tenter de la télécharger
      try {
        console.log('Téléchargement de l\'image...');
        const imageResponse = await fetch(imageUrl, { 
          signal: (new AbortController()).signal
        });
        
        if (!imageResponse.ok) {
          throw new Error(`Erreur lors du téléchargement de l'image: ${imageResponse.status}`);
        }
        
        const imageBlob = await imageResponse.blob();
        const localImageUrl = URL.createObjectURL(imageBlob);
        
        logger.info('Image téléchargée et URL locale créée avec succès');
        console.log('Image téléchargée avec succès');
        
        return {
          imageUrl: localImageUrl,
          prompt: finalPrompt
        };
      } catch (downloadError) {
        // En cas d'erreur de téléchargement (CORS, etc.), utiliser directement l'URL
        console.warn('Erreur lors du téléchargement de l\'image:', downloadError);
        logger.warn('Erreur lors du téléchargement de l\'image, utilisation de l\'URL directe');
        
        return {
          imageUrl: imageUrl,
          prompt: finalPrompt,
          error: "L'image a été générée mais ne peut pas être téléchargée. Cliquez pour l'ouvrir dans un nouvel onglet."
        };
      }
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Erreur lors de la requête fetch:', fetchError);
      
      // Essayer avec l'autre endpoint
      console.log('Tentative avec l\'endpoint alternatif...');
      
      try {
        // Essai avec un endpoint alternatif en utilisant les paramètres corrects
        const alternativeResponse = await fetch('https://api.x.ai/v1/images/generations', {
          method: 'POST',
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "grok-2-image-1212", // Nom exact du modèle
            prompt: finalPrompt,
            n: 1
            // Suppression du paramètre size qui n'est pas supporté
          })
        });
        
        // Meilleure gestion des erreurs pour l'endpoint alternatif
        if (!alternativeResponse.ok) {
          const errorText = await alternativeResponse.text();
          console.error('Réponse d\'erreur alternative complète:', {
            status: alternativeResponse.status,
            statusText: alternativeResponse.statusText,
            body: errorText
          });
          throw new Error(`Erreur API alternative: ${alternativeResponse.status} - ${alternativeResponse.statusText}`);
        }
        
        const altResponseText = await alternativeResponse.text();
        console.log('Réponse brute de l\'API alternative:', altResponseText);
        
        // Tenter de parser la réponse comme JSON
        let altData;
        try {
          altData = JSON.parse(altResponseText);
        } catch (parseError) {
          // Si ce n'est pas du JSON valide, vérifier si c'est une URL directe
          if (altResponseText.trim().startsWith('http')) {
            return {
              imageUrl: altResponseText.trim(),
              prompt: finalPrompt
            };
          } else {
            throw new Error('Format de réponse alternative non reconnu');
          }
        }
        
        // Extraire l'URL de l'image selon le format documenté
        const altImageUrl = altData.data[0].url;
        console.log('URL alternative extraite:', altImageUrl);
        
        if (!altImageUrl) {
          throw new Error('Format de réponse alternative non reconnu');
        }
        
        return {
          imageUrl: altImageUrl,
          prompt: finalPrompt
        };
        
      } catch (altError) {
        console.error('Erreur avec l\'endpoint alternatif:', altError);
        throw altError; // Propager l'erreur pour être gérée par le bloc catch principal
      }
    }
    
    logger.info('Image générée avec succès');
    logger.groupEnd();
    
  } catch (error: unknown) {
    logger.error('Erreur lors de la génération de l\'image:', error);
    console.error('Erreur détaillée lors de la génération d\'image:', error);
    
    // Erreurs spécifiques
    let errorMessage = "Erreur lors de la génération d'image";
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = "Délai d'attente dépassé lors de la génération d'image";
      } else if (error.message.includes('401')) {
        errorMessage = "Clé API invalide ou expirée";
      } else if (error.message.includes('429')) {
        errorMessage = "Limite de requêtes API dépassée";
      } else if (error.message.includes('Network Error')) {
        errorMessage = "Problème de connexion réseau";
      } else {
        errorMessage = error.message;
      }
    }
    
    // Utiliser une image de fallback en cas d'erreur
    console.log('Utilisation d\'une image de fallback suite à une erreur');
    const fallbackUrl = getFallbackImageUrl(mainEnvironment, mainEmotion);
    
    // Utiliser le texte original comme prompt
    const description = text.length > 150 ? text.substring(0, 150) + '...' : text;
    
    return {
      imageUrl: fallbackUrl,
      prompt: description,
      error: errorMessage
    };
  }
};

/**
 * Extrait des mots-clés pertinents du texte
 * @param text Le texte à analyser
 * @returns Liste de mots-clés
 */
const extractKeywords = (text: string): string[] => {
  const keywords = [];
  
  // Mots-clés liés au corps
  const bodyParts = ['lèvres', 'peau', 'corps', 'mains', 'cou', 'dos', 'épaules', 'visage', 'cheveux', 'yeux', 'bouche', 'jambes'];
  
  // Mots-clés liés aux actions
  const actions = ['caresse', 'embrasse', 'touche', 'frôle', 'enlace', 'serre', 'étreint', 'effleure', 'explore'];
  
  // Mots-clés liés aux sensations
  const sensations = ['chaleur', 'frisson', 'douceur', 'plaisir', 'désir', 'passion', 'tendresse', 'sensualité', 'intimité'];
  
  // Rechercher ces mots-clés dans le texte
  const words = text.toLowerCase().split(/\s+/);
  
  for (const word of words) {
    const normalizedWord = word.replace(/[.,;!?]$/, '');
    
    if (bodyParts.includes(normalizedWord)) {
      keywords.push(normalizedWord);
    } else if (actions.includes(normalizedWord)) {
      keywords.push(normalizedWord);
    } else if (sensations.includes(normalizedWord)) {
      keywords.push(normalizedWord);
    }
  }
  
  return [...new Set(keywords)]; // Éliminer les doublons
};
