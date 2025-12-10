import { useState, useEffect } from 'react';
import { useBobo } from '../contexts/BoboContext';
import RobotMascot from './RobotMascot';
import { themes, applyTheme, getCurrentTheme } from '../themes';

const BoboCustomization = () => {
  const { equippedItems, equipItem } = useBobo();
  const [unlockedItems, setUnlockedItems] = useState({
    hats: [],
    costumes: [],
    colors: [],
    dances: [],
    themes: []
  });
  const [preview, setPreview] = useState({
    hat: equippedItems.hat,
    costume: equippedItems.costume,
    color: equippedItems.color,
    dance: equippedItems.dance,
    theme: null
  });
  const [activeTab, setActiveTab] = useState('hats');
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());
  const [loading, setLoading] = useState(true);

  // Fetch unlocked items
  const fetchUnlockedItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('habit_coach_token');
      const response = await fetch('http://localhost:8000/api/bobo/items', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const items = await response.json();
        
        // Default items that are always available
        const defaultItems = {
          defaultHat: {
            item_id: 'default_hat',
            item_type: 'hat',
            item_name: 'Default',
            item_description: 'Classic antenna',
            svg_data: null // null means show antenna
          },
          noneCostume: {
            item_id: 'none_costume',
            item_type: 'costume',
            item_name: 'None',
            item_description: 'No costume',
            svg_data: null
          },
          noneDance: {
            item_id: 'none_dance',
            item_type: 'dance',
            item_name: 'None',
            item_description: 'No dancing',
            animation_data: false // No dance
          }
        };
        
        // Default themes (always available)
        const defaultThemes = [
          { item_id: 'retroArcade', item_type: 'theme', item_name: 'Retro Arcade', item_description: 'Vibrant retro colors' },
          { item_id: 'retroArcadeDark', item_type: 'theme', item_name: 'Retro Arcade Dark', item_description: 'Dark arcade vibes' },
          { item_id: 'bubblegum', item_type: 'theme', item_name: 'Bubblegum', item_description: 'Sweet pink & blue' },
          { item_id: 'bubblegumDark', item_type: 'theme', item_name: 'Bubblegum Dark', item_description: 'Dark bubblegum' },
          { item_id: 'haven', item_type: 'theme', item_name: 'Haven', item_description: 'Calm & sophisticated' },
          { item_id: 'havenDark', item_type: 'theme', item_name: 'Haven Dark', item_description: 'Dark haven' },
          { item_id: 'vintage', item_type: 'theme', item_name: 'Vintage Paper', item_description: 'Aged paper & sepia' },
          { item_id: 'vintageDark', item_type: 'theme', item_name: 'Vintage Paper Dark', item_description: 'Dark vintage tones' },
          { item_id: 'mocha', item_type: 'theme', item_name: 'Mocha Mouse', item_description: 'Warm coffee tones' },
          { item_id: 'mochaDark', item_type: 'theme', item_name: 'Mocha Mouse Dark', item_description: 'Dark coffee & cream' },
          { item_id: 'notebook', item_type: 'theme', item_name: 'Notebook', item_description: 'Clean grayscale' },
          { item_id: 'notebookDark', item_type: 'theme', item_name: 'Notebook Dark', item_description: 'Dark grayscale' },
          { item_id: 'kodama', item_type: 'theme', item_name: 'Kodama Grove', item_description: 'Earthy forest tones' },
          { item_id: 'kodamaDark', item_type: 'theme', item_name: 'Kodama Grove Dark', item_description: 'Dark forest spirits' },
          { item_id: 'candyland', item_type: 'theme', item_name: 'CandyLand', item_description: 'Sweet & playful' },
          { item_id: 'candylandDark', item_type: 'theme', item_name: 'CandyLand Dark', item_description: 'Dark candy colors' },
          { item_id: 'amethyst', item_type: 'theme', item_name: 'Amethyst Haze', item_description: 'Soft purple & pink' },
          { item_id: 'amethystDark', item_type: 'theme', item_name: 'Amethyst Haze Dark', item_description: 'Dark purple & pink' },
          { item_id: 'light2', item_type: 'theme', item_name: 'Light 2', item_description: 'Vibrant pastels' },
          { item_id: 'dark2', item_type: 'theme', item_name: 'Dark 2', item_description: 'Dark with neon' },
          { item_id: 'light', item_type: 'theme', item_name: 'Light', item_description: 'Clean and bright' },
          { item_id: 'dark', item_type: 'theme', item_name: 'Dark', item_description: 'Classic dark mode' }
        ];
        
        // Group items by type and prepend defaults
        const grouped = {
          hats: [defaultItems.defaultHat, ...items.filter(i => i.item_type === 'hat')],
          costumes: [defaultItems.noneCostume, ...items.filter(i => i.item_type === 'costume')],
          colors: items.filter(i => i.item_type === 'color'), // No default color
          dances: [defaultItems.noneDance, ...items.filter(i => i.item_type === 'dance')],
          themes: defaultThemes // Always available
        };
        
        setUnlockedItems(grouped);
      }
    } catch (error) {
      console.error('Error fetching unlocked items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnlockedItems();
    
    // Listen for achievement unlock events to refresh wardrobe
    const handleAchievementUnlock = () => {
      fetchUnlockedItems();
    };
    
    window.addEventListener('achievementUnlocked', handleAchievementUnlock);
    
    return () => {
      window.removeEventListener('achievementUnlocked', handleAchievementUnlock);
    };
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
    // If it's a theme, apply it immediately
    if (itemType === 'theme') {
      applyTheme(item.item_id);
      setCurrentTheme(item.item_id);
    }
    
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
      preview.dance?.item_id !== equippedItems.dance?.item_id ||
      (preview.theme && preview.theme.item_id !== currentTheme)
    );
  };

  const handleEquip = async () => {
    try {
      const token = localStorage.getItem('habit_coach_token');
      
      // Convert "none" and "default" items to null for backend
      const getItemId = (item) => {
        if (!item || item.item_id?.startsWith('none_') || item.item_id === 'default_hat') return null;
        return item.item_id;
      };
      
      // Save to backend
      const response = await fetch('http://localhost:8000/api/bobo/equip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hat: getItemId(preview.hat),
          costume: getItemId(preview.costume),
          color: getItemId(preview.color),
          dance: getItemId(preview.dance)
        })
      });

      if (response.ok) {
        // Update context - convert "none" and "default" items to null
        Object.entries(preview).forEach(([type, item]) => {
          if (type === 'theme') return; // Skip theme, handled separately
          const itemToEquip = (item?.item_id?.startsWith('none_') || item?.item_id === 'default_hat') ? null : item;
          equipItem(type, itemToEquip);
        });
        
        // Save theme to localStorage (persists across login/logout)
        if (preview.theme) {
          applyTheme(preview.theme.item_id);
          setCurrentTheme(preview.theme.item_id);
        }
        
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
    { id: 'dances', label: '💃 Dances', items: unlockedItems.dances },
    { id: 'themes', label: '🌈 Themes', items: unlockedItems.themes }
  ];

  const renderItem = (item, itemType) => {
    const isSelected = preview[itemType]?.item_id === item.item_id;
    const isEquipped = equippedItems[itemType]?.item_id === item.item_id;

    return (
      <div
        key={item.item_id}
        onClick={() => handlePreview(itemType, item)}
        className={`
          relative p-4 rounded-2xl border-2 cursor-pointer transition-all
          ${isSelected 
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/20 scale-105 shadow-lg' 
            : 'bg-light/5 border-light/10 hover:border-[var(--color-accent)]/50 hover:bg-light/10'
          }
        `}
      >
        {isEquipped && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Equipped
          </div>
        )}
        
        {itemType === 'theme' ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {themes[item.item_id] && (
                <>
                  <div className="w-6 h-12 rounded" style={{ backgroundColor: themes[item.item_id].colors.background }} />
                  <div className="w-6 h-12 rounded" style={{ backgroundColor: themes[item.item_id].colors.accent }} />
                  <div className="w-6 h-12 rounded" style={{ backgroundColor: themes[item.item_id].colors.foreground }} />
                </>
              )}
            </div>
            <span className="text-sm font-medium text-[var(--color-foreground)]">
              {item.item_name}
            </span>
            {currentTheme === item.item_id && (
              <span className="text-xs text-green-500">Active</span>
            )}
          </div>
        ) : itemType === 'color' ? (
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
            {item.item_id === 'default_hat' ? (
              // Show "Default" hat with antenna icon
              <div className="w-20 h-20 flex items-center justify-center">
                <svg viewBox="0 0 100 140" className="w-full h-full">
                  {/* Bobo head outline */}
                  <rect x="25" y="15" width="50" height="40" rx="6" fill="var(--color-accent)" opacity="0.3" stroke="var(--color-border)" strokeWidth="1"/>
                  {/* Antenna */}
                  <line x1="50" y1="15" x2="50" y2="8" stroke="var(--color-accent)" strokeWidth="2"/>
                  <circle cx="50" cy="6" r="3" fill="var(--color-accent)" className="animate-pulse"/>
                </svg>
              </div>
            ) : item.item_id.startsWith('none_') ? (
              // Show "None" option with X icon
              <div className="w-20 h-20 flex items-center justify-center text-4xl text-[var(--color-foreground-secondary)]">
                ✕
              </div>
            ) : (
              // Show SVG preview
              <div className="w-20 h-20 flex items-center justify-center">
                <svg viewBox="0 0 100 140" className="w-full h-full">
                  <g dangerouslySetInnerHTML={{ __html: item.svg_data }} />
                </svg>
              </div>
            )}
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
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">
            🎨 Bobo's Wardrobe
          </h2>
          <p className="text-[var(--color-foreground-secondary)]">
            Customize Bobo's appearance with items you've unlocked through achievements!
          </p>
        </div>
        <button
          onClick={fetchUnlockedItems}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
          title="Refresh items"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview Section */}
        <div className="lg:col-span-1">
          <div className="glass rounded-3xl p-6 border border-[var(--color-border)] h-full flex flex-col">
            <div className="flex justify-center flex-1 bg-gradient-to-b from-[var(--color-accent)]/10 to-transparent rounded-lg p-8 mb-6">
              <RobotMascot
                size="xl"
                emotion="excited"
                animate={true}
                dance={preview.dance?.item_id === 'none_dance' ? false : (preview.dance?.animation_data || false)}
                hat={preview.hat?.item_id === 'default_hat' ? null : (preview.hat ? { svg: preview.hat.svg_data } : null)}
                costume={preview.costume?.item_id === 'none_costume' ? null : (preview.costume ? { svg: preview.costume.svg_data } : null)}
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
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                ✨ Equip This Look
              </button>
            )}
          </div>
        </div>

        {/* Items Section */}
        <div className="lg:col-span-2">
          <div className="glass rounded-3xl p-6 border border-[var(--color-border)] h-full flex flex-col">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-2 rounded-xl whitespace-nowrap transition-all
                    ${activeTab === tab.id
                      ? 'bg-[var(--color-accent)] text-white shadow-lg'
                      : 'bg-light/5 text-[var(--color-foreground)] hover:bg-light/10 border border-light/10'
                    }
                  `}
                >
                  {tab.label} ({tab.items.length})
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
                  {tabs.find(t => t.id === activeTab)?.items.map(item => 
                    renderItem(item, activeTab.slice(0, -1)) // Remove 's' from tab id
                  )}
                </div>
              )}
            </div>
            
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: var(--color-glass);
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: var(--color-accent);
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: var(--color-accent-hover);
              }
            `}</style>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default BoboCustomization;
