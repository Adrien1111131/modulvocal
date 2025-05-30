# Guide de déploiement sur Vercel

Ce guide explique comment déployer votre module vocal sur Vercel et le configurer pour qu'il puisse communiquer avec votre module histoire.

## Prérequis

1. Un compte [Vercel](https://vercel.com/)
2. Un compte [GitHub](https://github.com/) (ou GitLab/BitBucket)
3. Les clés API nécessaires :
   - Clé API ElevenLabs
   - ID de voix ElevenLabs
   - Clé API Grok (si utilisée)

## Étape 1 : Préparer le projet pour le déploiement

### 1.1 Configurer le stockage des fichiers audio

Vercel étant une plateforme serverless, elle ne permet pas de stocker des fichiers de manière persistante. Pour stocker les fichiers audio générés, vous devez utiliser un service de stockage externe comme AWS S3, Google Cloud Storage ou Cloudinary.

Voici un exemple de configuration avec AWS S3 :

1. Créez un compte AWS et un bucket S3
2. Installez le SDK AWS pour Node.js :

```bash
cd server
npm install aws-sdk
```

3. Créez un fichier `server/services/storageService.js` :

```javascript
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configurer AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();
const bucketName = process.env.AWS_S3_BUCKET_NAME;

/**
 * Télécharge un fichier audio sur S3
 * @param {Buffer} audioBuffer Le buffer audio à télécharger
 * @returns {Promise<string>} L'URL du fichier téléchargé
 */
export const uploadAudio = async (audioBuffer) => {
  const fileName = `audio/${Date.now()}-${uuidv4()}.mp3`;
  
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: audioBuffer,
    ContentType: 'audio/mpeg',
    ACL: 'public-read'
  };
  
  const result = await s3.upload(params).promise();
  
  return result.Location;
};
```

4. Modifiez `server/adapters/elevenLabsAdapter.js` pour utiliser ce service de stockage

### 1.2 Configurer les variables d'environnement

Créez un fichier `.env.production` à la racine du projet avec les variables d'environnement nécessaires :

```
VITE_ELEVENLABS_API_KEY=votre_clé_api_elevenlabs
VITE_ELEVENLABS_VOICE_ID=votre_id_de_voix_elevenlabs
VITE_GROK_API_KEY=votre_clé_api_grok
VITE_API_BASE_URL=https://votre-module-vocal.vercel.app/api

# Variables pour AWS S3 (si utilisé)
AWS_ACCESS_KEY_ID=votre_clé_d_accès_aws
AWS_SECRET_ACCESS_KEY=votre_clé_secrète_aws
AWS_REGION=votre_région_aws
AWS_S3_BUCKET_NAME=nom_de_votre_bucket_s3
```

### 1.3 Mettre à jour la configuration CORS

Modifiez le fichier `server/server.js` pour mettre à jour la liste des origines autorisées avec les URL réelles de vos applications déployées sur Vercel :

```javascript
const allowedOrigins = [
  // Origines de développement local
  'http://localhost:3000',
  'http://localhost:5173',
  
  // Origines de production (à remplacer par vos domaines Vercel)
  'https://votre-module-histoire.vercel.app',
  'https://votre-module-vocal.vercel.app'
];
```

## Étape 2 : Déployer l'application React sur Vercel

1. Poussez votre code sur GitHub (ou GitLab/BitBucket)
2. Connectez-vous à votre compte Vercel
3. Cliquez sur "New Project"
4. Importez votre dépôt GitHub
5. Configurez le projet :
   - Framework Preset : Vite
   - Root Directory : `vite-react-elevenlabs-app`
   - Build Command : `npm run build`
   - Output Directory : `dist`
6. Ajoutez les variables d'environnement :
   - `VITE_ELEVENLABS_API_KEY`
   - `VITE_ELEVENLABS_VOICE_ID`
   - `VITE_GROK_API_KEY`
   - `VITE_API_BASE_URL` (l'URL de votre API, qui sera la même que l'URL de votre application avec `/api` à la fin)
7. Cliquez sur "Deploy"

## Étape 3 : Déployer le serveur API sur Vercel

Pour déployer le serveur API sur Vercel, vous devez créer un fichier `vercel.json` à la racine du projet :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "dist/$1"
    }
  ]
}
```

Ce fichier indique à Vercel comment construire et router les requêtes pour votre application.

## Étape 4 : Configurer les variables d'environnement sur Vercel

Dans le tableau de bord Vercel de votre projet, allez dans "Settings" > "Environment Variables" et ajoutez toutes les variables d'environnement nécessaires :

- `VITE_ELEVENLABS_API_KEY`
- `VITE_ELEVENLABS_VOICE_ID`
- `VITE_GROK_API_KEY`
- `VITE_API_BASE_URL`
- `AWS_ACCESS_KEY_ID` (si vous utilisez AWS S3)
- `AWS_SECRET_ACCESS_KEY` (si vous utilisez AWS S3)
- `AWS_REGION` (si vous utilisez AWS S3)
- `AWS_S3_BUCKET_NAME` (si vous utilisez AWS S3)

## Étape 5 : Redéployer l'application

Après avoir configuré les variables d'environnement, redéployez votre application en cliquant sur "Redeploy" dans le tableau de bord Vercel.

## Étape 6 : Tester l'intégration

1. Déployez votre module histoire sur Vercel en suivant un processus similaire
2. Mettez à jour les URL dans les exemples d'intégration avec les URL réelles de vos applications déployées
3. Testez l'intégration en envoyant une histoire depuis votre module histoire et en vérifiant qu'elle est bien reçue par votre module vocal

## Dépannage

### Problèmes CORS

Si vous rencontrez des problèmes CORS, vérifiez que :

1. Les origines autorisées dans `server/server.js` incluent bien l'URL de votre module histoire
2. Les en-têtes CORS sont correctement configurés

### Problèmes de stockage des fichiers audio

Si les fichiers audio ne sont pas correctement stockés ou accessibles :

1. Vérifiez que les variables d'environnement pour AWS S3 (ou autre service de stockage) sont correctement configurées
2. Vérifiez que les permissions du bucket S3 permettent l'accès public aux fichiers
3. Vérifiez les logs Vercel pour détecter d'éventuelles erreurs

### Problèmes de variables d'environnement

Si les variables d'environnement ne sont pas correctement chargées :

1. Vérifiez qu'elles sont bien configurées dans le tableau de bord Vercel
2. Vérifiez qu'elles sont correctement référencées dans votre code
3. Redéployez l'application après avoir modifié les variables d'environnement

## Notes importantes

1. **Limites de Vercel** : Vercel a des limites sur la taille des requêtes et la durée d'exécution des fonctions serverless. Si vous générez des fichiers audio volumineux, vous pourriez atteindre ces limites.

2. **Coûts** : L'utilisation de services comme AWS S3 peut entraîner des coûts. Assurez-vous de comprendre la structure de tarification de ces services.

3. **Sécurité** : Dans un environnement de production, vous devriez ajouter une authentification pour protéger votre API contre les abus.

4. **Mise à l'échelle** : Si votre application devient populaire, vous devrez peut-être envisager des solutions de mise à l'échelle plus robustes.
