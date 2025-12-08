import React, { useState } from 'react';
import { useBobo } from '../contexts/BoboContext';
import RobotMascot from './RobotMascot';

const BoboCustomization = () => {
  const { emotion } = useBobo();
  
  // Sample data for testing
  const sampleHats = [
    { id: 'none', name: 'None', emoji: '🚫' },
    { id: 'party', name: 'Party Hat', emoji: '🎉' },
    { id: 'crown', name: 'Crown', emoji: '👑' },
    { id: 'cap', name: 'Baseball Cap', emoji: '🧢' },
    { id: 'wizard', name: 'Wizard Hat', emoji: '🧙' },
    { id: 'top', name: 'Top Hat', emoji: '🎩' },
  ];

  const sampleCostumes = [
    { id: 'none', name: 'None', emoji: '🚫' },
    { id: 'cape', name: 'Superhero Cape', emoji: '🦸' },
    { id: 'bowtie', name: 'Bow Tie', emoji: '🎀' },
    { id: 'scarf', name: 'Scarf', emoji: '🧣' },
    { id: 'wings', name: 'Wings', emoji: '🦋' },
  ];

  const sampleColors = [
    { id: 'cream', name: 'Cream', hex: '#F9F5F2' },
    { id: 'blue', name: 'Sky Blue', hex: '#87CEEB' },
    { id: 'mint', name: 'Mint Green', hex: '#98D8C8' },
    { id: 'lavender', name: 'Lavender', hex: '#B19CD9' },
    { id: 'peach', name: 'Peach', hex: '#FFB6A3' },
    { id: 'coral', name: 'Coral Pink', hex: '#FF6B9D' },
  ];

  const [equipped, setEquipped] = useState({
    hat: sampleHats[0],
    costume: sampleCostumes[0],
    color: sampleColors[0],
  });

  const [preview, setPreview] = useState({
    hat: sampleHats[0],
    costume: sampleCostumes[0],
    color: sampleColors[0],
  });

  const [activeTab, setActiveTab] = useState('hat');

  const handleSelect = (type, item) => {
    setPreview({ ...preview, [type]: item });
  };

  const handleEquip = () => {
    setEquipped({ ...preview });
  };

  const hasChanges = JSON.stringify(equipped) !== JSON.stringify(preview);

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'hat': return sampleHats;
      case 'costume': return sampleCostumes;
      case 'color': return sampleColors;
      default: return [];
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Preview Panel */}
      <div className="bg-[var(--color-glass)] backdrop-blur-sm rounded-2xl border border-[var(--color-border)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bobo Preview */}
          <div className="flex items-center justify-center">
            <div className="flex justify-center items-center h-[200px] w-full bg-[var(--color-background)]/30 rounded-xl">
              <RobotMascot 
                emotion={emotion}
                hat={preview.hat}
                costume={preview.costume}
                color={preview.color}
                size="medium"
              />
            </div>
          </div>

          {/* Equipped Items Info */}
          <div className="flex flex-col justify-center space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[var(--color-background)]/30 rounded-xl">
              <span className="text-2xl">{equipped.hat.emoji}</span>
              <div className="flex-1">
                <p className="text-xs text-[var(--color-foreground-secondary)]">Hat</p>
                <p className="font-semibold text-[var(--color-foreground)]">{equipped.hat.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[var(--color-background)]/30 rounded-xl">
              <span className="text-2xl">{equipped.costume.emoji}</span>
              <div className="flex-1">
                <p className="text-xs text-[var(--color-foreground-secondary)]">Costume</p>
                <p className="font-semibold text-[var(--color-foreground)]">{equipped.costume.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[var(--color-background)]/30 rounded-xl">
              <div 
                className="w-8 h-8 rounded-full border-2 border-[var(--color-border)]"
                style={{ backgroundColor: equipped.color.hex }}
              />
              <div className="flex-1">
                <p className="text-xs text-[var(--color-foreground-secondary)]">Color</p>
                <p className="font-semibold text-[var(--color-foreground)]">{equipped.color.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Panel */}
      <div className="bg-[var(--color-glass)] backdrop-blur-sm rounded-2xl border border-[var(--color-border)] overflow-hidden">
        {/* Items Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getCurrentItems().map(item => (
              <button
                key={item.id}
                onClick={() => handleSelect(activeTab, item)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  preview[activeTab]?.id === item.id
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/50'
                }`}
              >
                <div className="aspect-square bg-[var(--color-background)]/30 rounded-lg mb-3 flex items-center justify-center">
                  {activeTab === 'color' ? (
                    <div 
                      className="w-16 h-16 rounded-full border-2 border-[var(--color-border)]"
                      style={{ backgroundColor: item.hex }}
                    />
                  ) : (
                    <div className="text-4xl">{item.emoji}</div>
                  )}
                </div>
                <h4 className="font-semibold text-[var(--color-foreground)] text-sm">
                  {item.name}
                </h4>
              </button>
            ))}
          </div>

          {/* Equip Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleEquip}
              disabled={!hasChanges}
              className="px-8 py-3 bg-[var(--color-accent)] text-[var(--color-background)] font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Equip Selected Items
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[var(--color-background)] bg-opacity-80 backdrop-blur-sm border-t border-[var(--color-border)]">
          <div className="flex items-center justify-center gap-2 h-16 px-6">
            <button
              onClick={() => setActiveTab('hat')}
              className={`px-6 py-2 font-semibold transition rounded-lg ${
                activeTab === 'hat'
                  ? 'bg-[var(--color-accent)] text-[var(--color-background)]'
                  : 'text-[var(--color-foreground-secondary)] hover:bg-[var(--color-glass)]'
              }`}
            >
              🎩 Hats
            </button>
            <button
              onClick={() => setActiveTab('costume')}
              className={`px-6 py-2 font-semibold transition rounded-lg ${
                activeTab === 'costume'
                  ? 'bg-[var(--color-accent)] text-[var(--color-background)]'
                  : 'text-[var(--color-foreground-secondary)] hover:bg-[var(--color-glass)]'
              }`}
            >
              👔 Costumes
            </button>
            <button
              onClick={() => setActiveTab('color')}
              className={`px-6 py-2 font-semibold transition rounded-lg ${
                activeTab === 'color'
                  ? 'bg-[var(--color-accent)] text-[var(--color-background)]'
                  : 'text-[var(--color-foreground-secondary)] hover:bg-[var(--color-glass)]'
              }`}
            >
              🎨 Colors
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoboCustomization;
