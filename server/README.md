# API de Génération Vocale ElevenLabs

Cette API permet de générer des voix à partir de texte en utilisant l'API ElevenLabs, sans avoir besoin d'une interface graphique. Elle est conçue pour être utilisée via des requêtes HTTP POST.

## Installation

1. Installez les dépendances du serveur :

```bash
cd server
npm install
```

2. Assurez-vous que le fichier `.env` à la racine du projet contient les variables d'environnement nécessaires :

```
VITE_ELEVENLABS_API_KEY=votre_clé_api_elevenlabs
VITE_ELEVENLABS_VOICE_ID=votre_id_de_voix_elevenlabs
VITE_GROK_API_KEY=votre_clé_api_grok (optionnel)
PORT=3001 (optionnel, par défaut 3001)
```

## Démarrage du serveur

Pour démarrer le serveur en mode développement avec rechargement automatique :

```bash
npm run dev
```

Pour démarrer le serveur en mode production :

```bash
npm start
```

Le serveur sera accessible à l'adresse : `http://localhost:3001`

## Endpoints API

### Vérifier le statut de l'API

```
GET /api/status
```

Exemple de réponse :

```json
{
  "success": true,
  "message": "API de génération vocale opérationnelle",
  "timestamp": "2025-05-27T12:00:00.000Z"
}
```

### Générer une voix simple

```
POST /api/generate-voice
Content-Type: application/json

{
  "text": "Votre texte à convertir en voix"
}
```

Exemple de réponse :

```json
{
  "success": true,
  "message": "Voix générée avec succès",
  "audioUrl": "/audio/voice_1716805200000_abcdef1234567890.mp3",
  "fullUrl": "http://localhost:3001/audio/voice_1716805200000_abcdef1234567890.mp3"
}
```

### Générer une voix avec environnement sonore

```
POST /api/generate-voice-with-environment
Content-Type: application/json

{
  "text": "Votre texte à convertir en voix avec environnement",
  "useAI": true
}
```

Exemple de réponse :

```json
{
  "success": true,
  "message": "Voix avec environnement générée avec succès",
  "audioUrl": "/audio/voice_1716805200000_abcdef1234567890.mp3",
  "fullUrl": "http://localhost:3001/audio/voice_1716805200000_abcdef1234567890.mp3"
}
```

## Exemples d'utilisation

### Avec JavaScript (fetch)

```javascript
// Générer une voix simple
fetch('http://localhost:3001/api/generate-voice', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: "Votre texte à convertir en voix"
  }),
})
.then(response => response.json())
.then(data => {
  console.log('URL de l\'audio généré:', data.fullUrl);
  // Vous pouvez maintenant utiliser cette URL pour lire l'audio
  const audio = new Audio(data.fullUrl);
  audio.play();
})
.catch(error => {
  console.error('Erreur:', error);
});
```

### Avec Python (requests)

```python
import requests

# Générer une voix avec environnement
response = requests.post(
    'http://localhost:3001/api/generate-voice-with-environment',
    json={
        'text': "Votre texte à convertir en voix avec environnement",
        'useAI': True
    }
)

data = response.json()
if data['success']:
    print(f"URL de l'audio généré: {data['fullUrl']}")
else:
    print(f"Erreur: {data['message']}")
```

### Avec cURL

```bash
# Générer une voix simple
curl -X POST http://localhost:3001/api/generate-voice \
  -H "Content-Type: application/json" \
  -d '{"text":"Votre texte à convertir en voix"}'
```

## Limitations

- Le texte est limité à 5000 caractères maximum par requête.
- Le nombre de requêtes est limité à 100 par 15 minutes.
- Les fichiers audio générés sont stockés temporairement sur le serveur.

## Notes

- Pour une utilisation en production, il est recommandé d'ajouter une authentification.
- Les fichiers audio sont stockés dans le dossier `server/public/audio`.
