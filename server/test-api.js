/**
 * Script de test pour l'API de génération vocale
 * 
 * Ce script envoie une requête à l'API pour générer une voix à partir d'un texte
 * et affiche l'URL de l'audio généré.
 * 
 * Utilisation:
 * 1. Démarrez le serveur: npm run dev
 * 2. Dans un autre terminal, exécutez: node test-api.js
 */

import fetch from 'node-fetch';

// Configuration
const API_URL = 'http://localhost:3001/api';
const TEST_TEXT = "Bonjour, ceci est un test de génération vocale sans interface graphique. J'espère que vous entendrez ma voix clairement.";

// Fonction pour tester l'API de génération vocale simple
async function testGenerateVoice() {
  console.log('Test de l\'API de génération vocale simple...');
  console.log(`Texte à convertir: "${TEST_TEXT.substring(0, 50)}..."`);
  
  try {
    const response = await fetch(`${API_URL}/generate-voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: TEST_TEXT
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Succès!');
      console.log('Message:', data.message);
      console.log('URL de l\'audio généré:', data.fullUrl);
      console.log('Pour écouter l\'audio, ouvrez cette URL dans votre navigateur.');
    } else {
      console.log('❌ Échec!');
      console.log('Message d\'erreur:', data.message);
      if (data.error) {
        console.log('Détails de l\'erreur:', data.error);
      }
    }
  } catch (error) {
    console.log('❌ Erreur lors de la requête:');
    console.error(error);
  }
}

// Fonction pour tester l'API de génération vocale avec environnement
async function testGenerateVoiceWithEnvironment() {
  console.log('\nTest de l\'API de génération vocale avec environnement...');
  console.log(`Texte à convertir: "${TEST_TEXT.substring(0, 50)}..."`);
  
  try {
    const response = await fetch(`${API_URL}/generate-voice-with-environment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: TEST_TEXT,
        useAI: true
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Succès!');
      console.log('Message:', data.message);
      console.log('URL de l\'audio généré:', data.fullUrl);
      console.log('Pour écouter l\'audio, ouvrez cette URL dans votre navigateur.');
    } else {
      console.log('❌ Échec!');
      console.log('Message d\'erreur:', data.message);
      if (data.error) {
        console.log('Détails de l\'erreur:', data.error);
      }
    }
  } catch (error) {
    console.log('❌ Erreur lors de la requête:');
    console.error(error);
  }
}

// Fonction pour vérifier le statut de l'API
async function checkApiStatus() {
  console.log('\nVérification du statut de l\'API...');
  
  try {
    const response = await fetch(`${API_URL}/status`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API opérationnelle!');
      console.log('Message:', data.message);
      console.log('Timestamp:', data.timestamp);
    } else {
      console.log('❌ API non opérationnelle!');
      console.log('Message d\'erreur:', data.message);
    }
  } catch (error) {
    console.log('❌ Erreur lors de la vérification du statut:');
    console.error(error);
    console.log('Assurez-vous que le serveur est démarré sur le port 3001.');
  }
}

// Exécuter les tests
async function runTests() {
  console.log('=== TESTS DE L\'API DE GÉNÉRATION VOCALE ===\n');
  
  // Vérifier d'abord le statut de l'API
  await checkApiStatus();
  
  // Si l'API est opérationnelle, exécuter les tests de génération vocale
  await testGenerateVoice();
  await testGenerateVoiceWithEnvironment();
  
  console.log('\n=== TESTS TERMINÉS ===');
}

runTests();
