import { useState, useEffect } from 'react';
import { useBobo } from '../contexts/BoboContext';
import RobotMascot from './RobotMascot';

const BoboCustomization = () => {
  const { equippedItems, equipItem } = useBobo();
  const [unlockedItems, setUnlockedItems] = useState({
    hats: [],
    costumes: [],
    colors: [],
    dances: []
  });
  const [preview, setPreview] = useState({
    hat: equippedItems.hat,
    costume: equippedItems.costume,
    color: equippedItems.color,
    dance: equippedItems.dance
  });
  const [activeTab, setActiveTab] = useState('hats');
  const [loading, setLoading] = useState(true);

  // Fetch unlocked items
  useEffect(() => {
    const fetchUnlockedItems = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/bobo/items', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const items = await response.json();
          
          // Group items by type
          const grouped = {
            hats: items.filter(i => i.item_type === 'hat'),
            costumes: items.filter(i => i.item_type === 'costume'),
            colors: items.filter(i => i.item_type === 'color'),
            dances: items.filter(i => i.item_type === 'dance')
          };
          
          setUnlockedItems(grouped);
        }
      } catch (error) {
        console.error('Error fetching unlocked items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnlockedItems();
  }, []);

  // Update preview when equipped items change
  useEffect(() => {
    setPreview({
      hat: equippedItems.hat,
      costume: equippedItems.costume,
      color: equippedItems.color,
      dance: equippedItems.dance
    });
  }, [equippedItems]);

  const handlePreview = (itemType, item) => {
    setPreview(prev => ({
      ...prev,
      [itemType]: item
    }));
  };

  // Check if preview is different from equipped items
  const hasChanges = () => {
    return (
      preview.hat?.item_id !== equippedItems.hat?.item_id ||
      preview.costume?.item_id !== equippedItems.costume?.item_id ||
      preview.color?.item_id !== equippedItems.color?.item_id ||
      preview.dance?.item_id !== equippedItems.dance?.item_id
    );
  };

  const handleEquip = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Save to backend
      const response = await fetch('http://localhost:8000/api/bobo/equip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hat: preview.hat?.item_id || null,
          costume: preview.costume?.item_id || null,
          color: preview.color?.item_id || null,
          dance: preview.dance?.item_id || null
        })
      });

      if (response.ok) {
        // Update context
        Object.entries(preview).forEach(([type, item]) => {
          equipItem(type, item);
        });
        
        alert('✨ Bobo\'s look has been updated!');
      }
    } catch (error) {
      console.error('Error equipping items:', error);
      alert('Failed to update Bobo\'s look');
    }
  };

  const tabs = [
    { id: 'hats', label: '🎩 Hats', items: unlockedItems.hats },
    { id: 'costumes', label: '👔 Costumes', items: unlockedItems.costumes },
    { id: 'colors', label: '🎨 Colors', items: unlockedItems.colors },
    { id: 'dances', label: '💃 Dances', items: unlockedItems.dances }
  ];

  const renderItem = (item, itemType) => {
    const isSelected = preview[itemType]?.item_id === item.item_id;
    const isEquipped = equippedItems[itemType]?.item_id === item.item_id;

    return (
      <div
        key={item.item_id}
        onClick={() => handlePreview(itemType, item)}
        className={`
          relative p-4 rounded-lg border-2 cursor-pointer transition-all
          ${isSelected 
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 scale-105' 
            : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/50'
          }
        `}
      >
        {isEquipped && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Equipped
          </div>
        )}
        
        {itemType === 'color' ? (
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-16 h-16 rounded-full border-2 border-[var(--color-border)]"
              style={{ backgroundColor: item.svg_data }}
            />
            <span className="text-sm font-medium text-[var(--color-foreground)]">
              {item.item_name}
            </span>
          </div>
        ) : itemType === 'dance' ? (
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl">💃</div>
            <span className="text-sm font-medium text-[var(--color-foreground)]">
              {item.item_name}
            </span>
            <span className="text-xs text-[var(--color-foreground-secondary)]">
              {item.item_description}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 flex items-center justify-center">
              <svg viewBox="0 0 100 140" className="w-full h-full">
                <g dangerouslySetInnerHTML={{ __html: item.svg_data }} />
              </svg>
            </div>
            <span className="text-sm font-medium text-[var(--color-foreground)]">
              {item.item_name}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent)] mx-auto mb-4" />
          <p className="text-[var(--color-foreground-secondary)]">Loading wardrobe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">
          🎨 Bobo's Wardrobe
        </h2>
        <p className="text-[var(--color-foreground-secondary)]">
          Customize Bobo's appearance with items you've unlocked through achievements!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview Section */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)] sticky top-6">
            <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-4 text-center">
              Preview
            </h3>
            
            <div className="flex justify-center mb-6 bg-gradient-to-b from-[var(--color-accent)]/10 to-transparent rounded-lg p-8">
              <RobotMascot
                size="xl"
                emotion="excited"
                animate={true}
                dance={preview.dance?.animation_data || false}
                hat={preview.hat ? { svg: preview.hat.svg_data } : null}
                costume={preview.costume ? { svg: preview.costume.svg_data } : null}
                color={preview.color?.svg_data || null}
              />
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-foreground-secondary)]">Hat:</span>
                <span className="text-[var(--color-foreground)] font-medium">
                  {preview.hat?.item_name || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-foreground-secondary)]">Costume:</span>
                <span className="text-[var(--color-foreground)] font-medium">
                  {preview.costume?.item_name || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-foreground-secondary)]">Color:</span>
                <span className="text-[var(--color-foreground)] font-medium">
                  {preview.color?.item_name || 'Default'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-foreground-secondary)]">Dance:</span>
                <span className="text-[var(--color-foreground)] font-medium">
                  {preview.dance?.item_name || 'None'}
                </span>
              </div>
            </div>

            {hasChanges() && (
              <button
                onClick={handleEquip}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                ✨ Equip This Look
              </button>
            )}
          </div>
        </div>

        {/* Items Section */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-2 rounded-lg whitespace-nowrap transition-all
                    ${activeTab === tab.id
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]'
                    }
                  `}
                >
                  {tab.label} ({tab.items.length})
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="min-h-[400px]">
              {tabs.find(t => t.id === activeTab)?.items.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔒</div>
                  <p className="text-[var(--color-foreground-secondary)] mb-2">
                    No {activeTab} unlocked yet
                  </p>
                  <p className="text-sm text-[var(--color-foreground-secondary)]">
                    Complete achievements to unlock new items!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {tabs.find(t => t.id === activeTab)?.items.map(item => 
                    renderItem(item, activeTab.slice(0, -1)) // Remove 's' from tab id
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoboCustomization;
