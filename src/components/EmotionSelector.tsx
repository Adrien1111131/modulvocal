import React from 'react';

interface EmotionSelectorProps {
  onEmotionChange: (emotion: string) => void;
}

const EmotionSelector: React.FC<EmotionSelectorProps> = ({ onEmotionChange }) => {
  const emotions = [
    { id: 'sensuel', label: 'Sensuel', description: 'Ton doux et séduisant' },
    { id: 'excite', label: 'Excité', description: 'Ton passionné et intense' },
    { id: 'jouissance', label: 'Jouissance', description: 'Ton d\'extase' },
    { id: 'murmure', label: 'Murmure', description: 'Ton doux et intime' },
    { id: 'intense', label: 'Intense', description: 'Ton profond et puissant' },
    { id: 'doux', label: 'Doux', description: 'Ton tendre et délicat' }
  ];

  const handleEmotionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onEmotionChange(e.target.value);
  };

  return (
    <div className="emotion-selector">
      <label htmlFor="emotion-select" className="emotion-label">
        Ton émotionnel
      </label>
      <select 
        id="emotion-select"
        onChange={handleEmotionChange}
        defaultValue="sensuel"
        className="emotion-select"
      >
        {emotions.map(emotion => (
          <option key={emotion.id} value={emotion.id}>
            {emotion.label} - {emotion.description}
          </option>
        ))}
      </select>
      <div className="emotion-help">
        <p>
          Le ton émotionnel influence la façon dont le texte sera interprété.
          Vous pouvez également utiliser des balises directement dans le texte :
        </p>
        <div className="emotion-tags">
          <span className="emotion-tag">[sensuel]texte[/sensuel]</span>
          <span className="emotion-tag">[excite]texte[/excite]</span>
          <span className="emotion-tag">[jouissance]texte[/jouissance]</span>
        </div>
      </div>
    </div>
  );
};

export default EmotionSelector;
