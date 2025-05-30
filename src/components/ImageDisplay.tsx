import React, { useState } from 'react';

interface ImageDisplayProps {
  imageUrl: string | null;
  prompt?: string;
  error?: string;
  onRegenerateClick?: () => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  imageUrl, 
  prompt, 
  error, 
  onRegenerateClick 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!imageUrl) {
    return (
      <div className="image-error">
        <p>La génération de l'image a échoué. {error && <span>Erreur: {error}</span>}</p>
        {onRegenerateClick && (
          <button 
            className="regenerate-button"
            onClick={onRegenerateClick}
          >
            Régénérer l'image
          </button>
        )}
        <style>{`
          .image-error {
            text-align: center;
            color: #dc3545;
            padding: 1rem;
            border: 1px solid #f8d7da;
            background-color: #fff5f5;
            border-radius: 8px;
            margin-top: 1rem;
          }
          
          .regenerate-button {
            margin-top: 0.5rem;
            padding: 0.5rem 1rem;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          
          .regenerate-button:hover {
            background-color: #0056b3;
          }
        `}</style>
      </div>
    );
  }
  
  // Vérifier si l'URL est un fichier HTML (placeholder)
  const isHtmlPlaceholder = imageUrl?.includes('.html');
  
  return (
    <div className="image-display-container">
      <div className="image-header">
        <h4 className="image-title">Illustration générée</h4>
        {onRegenerateClick && (
          <button 
            className="regenerate-button-small"
            onClick={(e) => {
              e.stopPropagation();
              onRegenerateClick();
            }}
            title="Générer une nouvelle image"
          >
            Régénérer
          </button>
        )}
      </div>
      
      {isHtmlPlaceholder ? (
        // Afficher le placeholder HTML dans un iframe
        <div className="iframe-container">
          <iframe 
            src={imageUrl || ''} 
            title={prompt || "Image générée par IA"}
            frameBorder="0"
            scrolling="no"
            width="100%"
            height="300px"
          ></iframe>
        </div>
      ) : (
        // Afficher l'image normale
        <div 
          className={`image-preview ${isExpanded ? 'expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <img 
            src={imageUrl} 
            alt="Illustration générée" 
            title={prompt || "Image générée par IA"}
          />
          <div className="image-overlay">
            <span>{isExpanded ? 'Réduire' : 'Agrandir'}</span>
          </div>
        </div>
      )}
      {prompt && (
        <div className="image-prompt">
          <details>
            <summary>Prompt utilisé</summary>
            <p>{prompt}</p>
          </details>
        </div>
      )}
      <style>{`
        .image-display-container {
          margin-top: 1rem;
          text-align: center;
          transition: all 0.3s ease;
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .image-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .image-title {
          margin: 0;
          color: #333;
          font-size: 1.1rem;
        }
        
        .regenerate-button-small {
          padding: 0.25rem 0.5rem;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .regenerate-button-small:hover {
          background-color: #5a6268;
        }
        
        .image-preview {
          position: relative;
          display: inline-block;
          max-width: ${isExpanded ? '100%' : '300px'};
          max-height: ${isExpanded ? 'none' : '200px'};
          overflow: hidden;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0.85;
          margin: 0.5rem 0;
        }
        
        .iframe-container {
          width: 100%;
          height: 300px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          margin: 0.5rem 0;
        }
        
        .image-preview:hover {
          opacity: 1;
        }
        
        .image-preview img {
          width: 100%;
          height: auto;
          display: block;
          transition: transform 0.3s ease;
        }
        
        .image-preview.expanded {
          max-width: 100%;
          max-height: 500px;
        }
        
        .image-prompt {
          margin-top: 0.5rem;
          text-align: left;
          font-size: 0.9rem;
          color: #666;
        }
        
        .image-prompt details {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 0.5rem;
          background-color: #fff;
        }
        
        .image-prompt summary {
          cursor: pointer;
          color: #007bff;
        }
        
        .image-prompt p {
          margin: 0.5rem 0 0;
          padding: 0.5rem;
          background-color: #f5f5f5;
          border-radius: 4px;
          font-style: italic;
        }
        
        .image-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 4px;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .image-preview:hover .image-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default ImageDisplay;
