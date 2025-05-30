# Exemples d'intégration avec votre module histoire

Ce document fournit des exemples de code pour intégrer votre module histoire avec le module vocal. Ces exemples montrent comment envoyer une histoire au module vocal et rediriger l'utilisateur.

## Configuration

Avant d'utiliser ces exemples, vous devez remplacer les URL par les URL réelles de vos applications déployées sur Vercel :

- `https://votre-module-vocal.vercel.app` : URL de votre module vocal
- `https://votre-module-histoire.vercel.app` : URL de votre module histoire

## Exemple 1 : Intégration JavaScript (React, Vue, etc.)

```javascript
// Fonction pour envoyer l'histoire au module vocal et rediriger l'utilisateur
async function sendStoryToVocalModule(storyText, metadata = {}) {
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
        text: storyText,
        metadata: metadata // Vous pouvez ajouter des métadonnées comme le titre, l'auteur, etc.
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Histoire envoyée avec succès !');
      console.log('ID de session:', data.sessionId);
      
      // Rediriger l'utilisateur vers le module vocal avec l'ID de session
      window.location.href = data.redirectUrl;
    } else {
      console.error('Erreur lors de l\'envoi de l\'histoire:', data.message);
      alert('Erreur lors de l\'envoi de l\'histoire: ' + data.message);
    }
  } catch (error) {
    console.error('Erreur lors de la communication avec le module vocal:', error);
    alert('Erreur lors de la communication avec le module vocal. Veuillez réessayer plus tard.');
  }
}

// Exemple d'utilisation dans un composant React
function StoryComponent() {
  const [story, setStory] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Vérifier que l'histoire n'est pas vide
    if (!story.trim()) {
      alert('Veuillez entrer une histoire avant de continuer.');
      return;
    }
    
    // Envoyer l'histoire au module vocal
    sendStoryToVocalModule(story, {
      title: 'Mon histoire',
      author: 'Utilisateur',
      createdAt: new Date().toISOString()
    });
  };
  
  return (
    <div>
      <h1>Créer une histoire</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Écrivez votre histoire ici..."
          rows={10}
          cols={50}
        />
        <button type="submit">Générer la voix</button>
      </form>
    </div>
  );
}
```

## Exemple 2 : Intégration HTML/JavaScript simple

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Module Histoire</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    textarea {
      width: 100%;
      height: 300px;
      padding: 10px;
      margin-bottom: 10px;
    }
    button {
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      cursor: pointer;
    }
    .error {
      color: red;
      margin-top: 10px;
    }
    .loading {
      display: none;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h1>Créer une histoire</h1>
  
  <textarea id="storyText" placeholder="Écrivez votre histoire ici..."></textarea>
  
  <button id="generateButton">Générer la voix</button>
  
  <div id="loading" class="loading">Envoi en cours...</div>
  <div id="error" class="error"></div>
  
  <script>
    document.getElementById('generateButton').addEventListener('click', async function() {
      const storyText = document.getElementById('storyText').value.trim();
      const loadingElement = document.getElementById('loading');
      const errorElement = document.getElementById('error');
      
      // Vider les messages d'erreur précédents
      errorElement.textContent = '';
      
      // Vérifier que l'histoire n'est pas vide
      if (!storyText) {
        errorElement.textContent = 'Veuillez entrer une histoire avant de continuer.';
        return;
      }
      
      // Afficher le chargement
      loadingElement.style.display = 'block';
      
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
            text: storyText,
            metadata: {
              title: 'Histoire générée',
              createdAt: new Date().toISOString()
            }
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Histoire envoyée avec succès !');
          console.log('ID de session:', data.sessionId);
          
          // Rediriger l'utilisateur vers le module vocal avec l'ID de session
          window.location.href = data.redirectUrl;
        } else {
          errorElement.textContent = 'Erreur lors de l\'envoi de l\'histoire: ' + data.message;
        }
      } catch (error) {
        console.error('Erreur lors de la communication avec le module vocal:', error);
        errorElement.textContent = 'Erreur lors de la communication avec le module vocal. Veuillez réessayer plus tard.';
      } finally {
        // Masquer le chargement
        loadingElement.style.display = 'none';
      }
    });
  </script>
</body>
</html>
```

## Exemple 3 : Intégration PHP

```php
<?php
// Fonction pour envoyer l'histoire au module vocal
function sendStoryToVocalModule($storyText, $metadata = []) {
    // URL de l'API du module vocal
    $apiUrl = 'https://votre-module-vocal.vercel.app/api/store-story';
    
    // Préparer les données à envoyer
    $data = [
        'text' => $storyText,
        'metadata' => $metadata
    ];
    
    // Initialiser cURL
    $ch = curl_init($apiUrl);
    
    // Configurer la requête
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    // Exécuter la requête
    $response = curl_exec($ch);
    
    // Vérifier les erreurs
    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        return [
            'success' => false,
            'message' => "Erreur cURL: $error"
        ];
    }
    
    // Fermer la connexion
    curl_close($ch);
    
    // Décoder la réponse
    $result = json_decode($response, true);
    
    return $result;
}

// Exemple d'utilisation dans un script PHP
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $storyText = $_POST['story'] ?? '';
    
    if (empty($storyText)) {
        echo json_encode([
            'success' => false,
            'message' => 'Veuillez entrer une histoire avant de continuer.'
        ]);
        exit;
    }
    
    $metadata = [
        'title' => $_POST['title'] ?? 'Histoire sans titre',
        'author' => $_POST['author'] ?? 'Anonyme',
        'createdAt' => date('c')
    ];
    
    $result = sendStoryToVocalModule($storyText, $metadata);
    
    if ($result['success']) {
        // Rediriger l'utilisateur vers le module vocal
        header('Location: ' . $result['redirectUrl']);
        exit;
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de l\'envoi de l\'histoire: ' . ($result['message'] ?? 'Erreur inconnue')
        ]);
        exit;
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Module Histoire (PHP)</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        textarea {
            width: 100%;
            height: 300px;
            padding: 10px;
            margin-bottom: 10px;
        }
        input[type="text"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
        }
        button {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>Créer une histoire</h1>
    
    <form method="post" action="">
        <div>
            <label for="title">Titre:</label>
            <input type="text" id="title" name="title" placeholder="Titre de l'histoire">
        </div>
        
        <div>
            <label for="author">Auteur:</label>
            <input type="text" id="author" name="author" placeholder="Votre nom">
        </div>
        
        <div>
            <label for="story">Histoire:</label>
            <textarea id="story" name="story" placeholder="Écrivez votre histoire ici..."></textarea>
        </div>
        
        <button type="submit">Générer la voix</button>
    </form>
</body>
</html>
```

## Exemple 4 : Intégration Python (Flask)

```python
from flask import Flask, request, render_template, redirect, jsonify
import requests
import json
from datetime import datetime

app = Flask(__name__)

def send_story_to_vocal_module(story_text, metadata=None):
    """
    Envoie l'histoire au module vocal et retourne la réponse
    """
    if metadata is None:
        metadata = {}
    
    # URL de l'API du module vocal
    api_url = 'https://votre-module-vocal.vercel.app/api/store-story'
    
    # Préparer les données à envoyer
    data = {
        'text': story_text,
        'metadata': metadata
    }
    
    try:
        # Envoyer la requête
        response = requests.post(
            api_url,
            headers={'Content-Type': 'application/json'},
            data=json.dumps(data)
        )
        
        # Vérifier la réponse
        if response.status_code == 200:
            return response.json()
        else:
            return {
                'success': False,
                'message': f'Erreur HTTP {response.status_code}: {response.text}'
            }
    except Exception as e:
        return {
            'success': False,
            'message': f'Erreur lors de la communication avec le module vocal: {str(e)}'
        }

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        story_text = request.form.get('story', '')
        
        if not story_text.strip():
            return render_template('index.html', error='Veuillez entrer une histoire avant de continuer.')
        
        metadata = {
            'title': request.form.get('title', 'Histoire sans titre'),
            'author': request.form.get('author', 'Anonyme'),
            'createdAt': datetime.now().isoformat()
        }
        
        result = send_story_to_vocal_module(story_text, metadata)
        
        if result.get('success'):
            # Rediriger l'utilisateur vers le module vocal
            return redirect(result['redirectUrl'])
        else:
            return render_template('index.html', error=f"Erreur: {result.get('message', 'Erreur inconnue')}")
    
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
```

Avec le template HTML correspondant (`templates/index.html`) :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Module Histoire (Flask)</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        textarea {
            width: 100%;
            height: 300px;
            padding: 10px;
            margin-bottom: 10px;
        }
        input[type="text"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
        }
        button {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
        }
        .error {
            color: red;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Créer une histoire</h1>
    
    {% if error %}
    <div class="error">{{ error }}</div>
    {% endif %}
    
    <form method="post" action="">
        <div>
            <label for="title">Titre:</label>
            <input type="text" id="title" name="title" placeholder="Titre de l'histoire">
        </div>
        
        <div>
            <label for="author">Auteur:</label>
            <input type="text" id="author" name="author" placeholder="Votre nom">
        </div>
        
        <div>
            <label for="story">Histoire:</label>
            <textarea id="story" name="story" placeholder="Écrivez votre histoire ici..."></textarea>
        </div>
        
        <button type="submit">Générer la voix</button>
    </form>
</body>
</html>
```

## Notes importantes

1. **Sécurité** : Dans un environnement de production, vous devriez ajouter une authentification pour protéger votre API contre les abus.

2. **Gestion des erreurs** : Les exemples ci-dessus incluent une gestion des erreurs de base. Dans un environnement de production, vous devriez implémenter une gestion des erreurs plus robuste.

3. **CORS** : Le serveur API est configuré pour accepter les requêtes de certaines origines. Si vous déployez vos applications sur des domaines différents, assurez-vous de mettre à jour la configuration CORS dans `server.js`.

4. **Variables d'environnement** : N'oubliez pas de configurer les variables d'environnement nécessaires dans votre tableau de bord Vercel.

5. **Stockage des fichiers audio** : Sur Vercel, vous devrez utiliser un service de stockage externe comme AWS S3, Google Cloud Storage ou Cloudinary pour stocker les fichiers audio générés de manière persistante.
