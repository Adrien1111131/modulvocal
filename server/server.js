import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Importer les routes API
import apiRoutes from './routes/api.js';

// Configuration de base
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Créer l'application Express
const app = express();
const PORT = process.env.PORT || 3001;

// Créer le dossier pour les fichiers audio générés s'il n'existe pas
const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Configuration CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (comme les appels d'API mobile ou Postman)
    if (!origin) return callback(null, true);
    
    // Liste des origines autorisées
    const allowedOrigins = [
      // Origines de développement local
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      
      // Origines de production (à remplacer par vos domaines Vercel)
      'https://votre-module-histoire.vercel.app',
      'https://votre-module-vocal.vercel.app'
    ];
    
    // Vérifier si l'origine est autorisée
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 heures
};

// Middleware de base
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Permettre le chargement des ressources cross-origin
})); 
app.use(cors(corsOptions)); // Permettre les requêtes cross-origin avec les options configurées
app.use(express.json({ limit: '50mb' })); // Parser le JSON avec une limite élevée pour les textes longs
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev')); // Logging

// Limiter le nombre de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes, veuillez réessayer plus tard'
});
app.use('/api/', limiter);

// Servir les fichiers statiques
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

// Routes API
app.use('/api', apiRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: 'API de génération vocale ElevenLabs',
    endpoints: {
      generateVoice: '/api/generate-voice',
      generateVoiceWithEnvironment: '/api/generate-voice-with-environment'
    }
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`API disponible à l'adresse: http://localhost:${PORT}/api`);
});

export default app;
