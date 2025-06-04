# Module Vocal - Application React avec ElevenLabs

Cette application React utilise l'API Eleven Labs pour générer des sorties vocales avec différentes émotions. L'application propose une interface conviviale où les utilisateurs peuvent saisir du texte, sélectionner une émotion et écouter la voix générée.

## Intégration avec le Module Histoire

Cette application est conçue pour fonctionner en tandem avec le Module Histoire. Lorsqu'un utilisateur génère une histoire érotique dans le Module Histoire, il peut être redirigé vers ce Module Vocal qui récupérera automatiquement le texte de l'histoire depuis sessionStorage et le préparera pour la génération vocale.

## Fonctionnalités

- Zone de saisie de texte pour que l'utilisateur entre le texte souhaité.
- Sélecteur d'émotion pour choisir l'émotion de la sortie vocale.
- Lecteur audio pour écouter la voix générée.

## Structure du projet

```
vite-react-elevenlabs-app
├── src
│   ├── components
│   │   ├── EmotionSelector.tsx
│   │   ├── TextInput.tsx
│   │   └── VoicePlayer.tsx
│   ├── config
│   │   └── development.ts
│   ├── services
│   │   ├── axiosConfig.ts
│   │   └── elevenLabsAPI.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles
│       └── App.css
├── public
│   └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Installation

1. Clonez le dépôt :
   ```
   git clone <url-du-dépôt>
   ```
2. Naviguez vers le répertoire du projet :
   ```
   cd vite-react-elevenlabs-app
   ```
3. Installez les dépendances :
   ```
   npm install
   ```

## Configuration

1. Créez un fichier `.env` à la racine du projet avec les variables suivantes :
   ```
   VITE_ELEVENLABS_API_KEY=votre_clé_api
   VITE_ELEVENLABS_VOICE_ID=votre_id_de_voix
   ```

## Utilisation

1. Démarrez le serveur de développement :
   ```
   npm run dev
   ```
2. Ouvrez votre navigateur et accédez à `http://localhost:3002` pour voir l'application.

## Déploiement sur GitHub Pages

1. La dépendance gh-pages a déjà été ajoutée au projet :
   ```
   npm install --save-dev gh-pages
   ```

2. La configuration de base dans `vite.config.ts` a été mise à jour pour GitHub Pages :
   ```typescript
   base: mode === 'production' ? '/modul-vocal/' : '/',
   ```

3. Configurez votre dépôt GitHub :
   - Créez un nouveau dépôt sur GitHub
   - Initialisez Git dans votre projet local si ce n'est pas déjà fait :
     ```
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin <url-de-votre-dépôt>
     git push -u origin main
     ```

4. Déployez l'application :
   ```
   npm run deploy
   ```

5. Configurez GitHub Pages dans les paramètres de votre dépôt :
   - Allez dans "Settings" > "Pages"
   - Sélectionnez la branche "gh-pages" comme source
   - Cliquez sur "Save"

Votre application sera accessible à l'adresse : `https://<votre-nom-utilisateur>.github.io/modul-vocal/`

## Déploiement sur Vercel

Pour déployer cette application sur Vercel après l'avoir poussée sur GitHub :

1. Connectez-vous à votre compte Vercel (ou créez-en un si vous n'en avez pas).

2. Importez votre projet depuis votre dépôt GitHub.

3. Configurez les variables d'environnement suivantes dans les paramètres du projet sur Vercel :
   - `VITE_ELEVENLABS_API_KEY` : Votre clé API ElevenLabs
   - `VITE_ELEVENLABS_VOICE_ID` : L'ID de la voix ElevenLabs à utiliser
   - `VITE_GROK_API_KEY` : Votre clé API Grok
   - `VITE_API_BASE_URL` : L'URL de base de l'API (par exemple, https://votre-domaine.vercel.app/api)

4. Déployez votre application en cliquant sur le bouton "Deploy".

Une fois le déploiement terminé, votre application sera accessible à l'URL fournie par Vercel.

## Intégration de l'API

Cette application interagit avec l'API Eleven Labs pour générer des sorties vocales. Les clés API et les configurations nécessaires sont maintenant gérées via des variables d'environnement pour plus de sécurité.

## Sécurité

- Ne jamais commiter le fichier `.env` contenant vos clés API
- Assurez-vous que `.env` est inclus dans votre fichier `.gitignore`
- Pour le déploiement en production, utilisez les variables d'environnement du service d'hébergement

## Contribution

N'hésitez pas à soumettre des problèmes ou des pull requests pour toute amélioration ou fonctionnalité que vous aimeriez voir dans ce projet.
