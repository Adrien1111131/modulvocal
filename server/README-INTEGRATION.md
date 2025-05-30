# Intégration du Module Vocal avec votre Module Histoire

Ce document explique comment intégrer le module vocal avec votre module histoire pour permettre aux utilisateurs de générer des voix à partir de leurs histoires sans interface graphique.

## Vue d'ensemble

Nous avons mis en place une solution qui permet à votre module histoire d'envoyer des textes au module vocal via une API REST, puis de rediriger l'utilisateur vers le module vocal pour écouter l'audio généré.

### Architecture

```
┌─────────────────┐     1. Envoie l'histoire     ┌─────────────────┐
│                 ├────────────────────────────> │                 │
│ Module Histoire │                              │   Module Vocal  │
│                 │ <───────────────────────────┤                 │
└─────────────────┘     2. Redirige avec ID      └─────────────────┘
                                                        │
                                                        │ 3. Génère l'audio
                                                        ▼
                                                  ┌─────────────────┐
                                                  │  ElevenLabs API │
                                                  └─────────────────┘
```

## Fonctionnement

1. L'utilisateur écrit une histoire dans votre module histoire
2. Votre module histoire envoie cette histoire au module vocal via l'API
3. Le module vocal stocke l'histoire et génère un ID de session
4. Votre module histoire redirige l'utilisateur vers le module vocal avec cet ID de session
5. Le module vocal récupère l'histoire à partir de l'ID de session
6. Le module vocal génère automatiquement la voix et l'affiche à l'utilisateur

## Composants de la solution

### 1. Stockage des histoires

Nous avons créé un service de stockage temporaire des histoires (`server/services/storyStorage.js`) qui permet de :
- Stocker une histoire et générer un ID de session
- Récupérer une histoire à partir de son ID de session
- Supprimer une histoire
- Nettoyer automatiquement les histoires expirées

### 2. API REST

Nous avons ajouté des endpoints API au serveur (`server/routes/api.js`) :
- `POST /api/store-story` : Pour stocker une histoire et générer un ID de session
- `GET /api/get-story` : Pour récupérer une histoire à partir de son ID de session
- `DELETE /api/delete-story` : Pour supprimer une histoire

### 3. Configuration CORS

Nous avons configuré CORS dans le serveur (`server/server.js`) pour permettre les requêtes entre domaines.

### 4. Récupération automatique de l'histoire

Nous avons modifié l'application React (`src/App.tsx`) pour qu'elle puisse récupérer l'histoire depuis l'ID de session dans l'URL et générer automatiquement la voix.

## Comment utiliser cette solution

### Étape 1 : Déployer le module vocal

Suivez les instructions dans le fichier `DEPLOYMENT.md` pour déployer le module vocal sur Vercel.

### Étape 2 : Intégrer le module histoire

Consultez les exemples d'intégration dans le dossier `examples/` pour voir comment intégrer votre module histoire avec le module vocal. Nous fournissons des exemples pour différents langages et frameworks :
- JavaScript (React, Vue, etc.)
- HTML/JavaScript simple
- PHP
- Python (Flask)

### Étape 3 : Tester l'intégration

1. Déployez votre module histoire sur Vercel
2. Mettez à jour les URL dans les exemples d'intégration avec les URL réelles de vos applications déployées
3. Testez l'intégration en envoyant une histoire depuis votre module histoire et en vérifiant qu'elle est bien reçue par votre module vocal

## Exemple d'intégration simple

Voici un exemple simple d'intégration avec JavaScript :

```javascript
// Fonction pour envoyer l'histoire au module vocal et rediriger l'utilisateur
async function sendStoryToVocalModule(storyText) {
  try {
    // URL de l'API du module vocal
    const apiUrl = 'https://votre-module-vocal.vercel.app/api/store-story';
    
    // Envoyer l'histoire à l'API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: storyText
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Rediriger l'utilisateur vers le module vocal avec l'ID de session
      window.location.href = data.redirectUrl;
    } else {
      console.error('Erreur lors de l\'envoi de l\'histoire:', data.message);
    }
  } catch (error) {
    console.error('Erreur lors de la communication avec le module vocal:', error);
  }
}

// Utilisation
document.getElementById('generateButton').addEventListener('click', function() {
  const storyText = document.getElementById('storyText').value;
  sendStoryToVocalModule(storyText);
});
```

## Considérations importantes

### Sécurité

Dans un environnement de production, vous devriez ajouter une authentification pour protéger votre API contre les abus.

### Stockage des fichiers audio

Sur Vercel, vous devrez utiliser un service de stockage externe comme AWS S3, Google Cloud Storage ou Cloudinary pour stocker les fichiers audio générés de manière persistante. Consultez le fichier `DEPLOYMENT.md` pour plus d'informations.

### Limites de taille

L'API a une limite de taille pour les histoires (5000 caractères par défaut). Si vous avez besoin de traiter des histoires plus longues, vous devrez les diviser en segments.

### Variables d'environnement

N'oubliez pas de configurer les variables d'environnement nécessaires dans votre tableau de bord Vercel.

## Ressources supplémentaires

- `DEPLOYMENT.md` : Guide de déploiement sur Vercel
- `examples/integration-examples.md` : Exemples d'intégration dans différents langages
- `test-api.js` : Script pour tester l'API
- `public/index.html` : Interface web simple pour tester l'API
