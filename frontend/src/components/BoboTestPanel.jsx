import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AchievementNotification from './AchievementNotification';

export default function BoboTestPanel() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [achievementToShow, setAchievementToShow] = useState(null);
  const [testResults, setTestResults] = useState({
    daily: null,
    weekly: null,
    monthly: null
  });

  const clearResults = () => {
    setTestResults({
      daily: null,
      weekly: null,
      monthly: null
    });
  };

  // Test achievement unlock flow
  const testAchievement = async (achievementType) => {
    setLoading(true);
    
    const testInfo = {
      daily: { name: 'Perfect Day', reward: 'Dance', icon: '⭐' },
      weekly: { name: 'Perfect Week', reward: 'Hat + Costume', icon: '🏆' },
      monthly: { name: 'Perfect Month', reward: 'Color', icon: '👑' }
    };
    
    const info = testInfo[achievementType];
    
    try {
      const token = localStorage.getItem('habit_coach_token');
      
      if (!token) {
        setTestResults(prev => ({
          ...prev,
          [achievementType]: {
            success: false,
            error: 'Not authenticated. Please log in first.',
            timestamp: new Date().toLocaleTimeString()
          }
        }));
        setLoading(false);
        return;
      }
      
      // Step 1: Trigger achievement
      const response = await fetch(`http://localhost:8000/api/test/trigger-achievement?achievement_type=${achievementType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const achievement = data[0];
        
        // Show achievement notification popup!
        setAchievementToShow(achievement);
        
        // Step 2: Wait a bit for database to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 3: Check wardrobe
        const wardrobeResponse = await fetch('http://localhost:8000/api/bobo/items', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!wardrobeResponse.ok) {
          throw new Error(`Failed to fetch wardrobe: ${wardrobeResponse.status}`);
        }
        
        const items = await wardrobeResponse.json();
        
        // Count items by type
        const counts = {
          hats: items.filter(i => i.item_type === 'hat').length,
          costumes: items.filter(i => i.item_type === 'costume').length,
          colors: items.filter(i => i.item_type === 'color').length,
          dances: items.filter(i => i.item_type === 'dance').length
        };
        
        // Get the newly unlocked items
        const newItems = items.slice(-3); // Get last 3 items
        
        setTestResults(prev => ({
          ...prev,
          [achievementType]: {
            success: true,
            achievement: achievement,
            items: newItems,
            counts: counts,
            timestamp: new Date().toLocaleTimeString()
          }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [achievementType]: {
            success: false,
            error: 'No achievement unlocked',
            timestamp: new Date().toLocaleTimeString()
          }
        }));
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [achievementType]: {
          success: false,
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Don't show if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[200px] right-6 z-40 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-105 font-medium text-sm"
        title="Test Achievement System"
      >
        🧪 Test Achievements
      </button>
    );
  }

  return (
    <div className="fixed bottom-[200px] right-6 z-40 w-[420px] max-h-[700px] bg-[var(--color-surface)] border-2 border-purple-500 rounded-xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div>
          <h3 className="font-bold text-[var(--color-foreground)] flex items-center gap-2">
            🧪 Achievement Test Panel
          </h3>
          <p className="text-xs text-[var(--color-foreground-secondary)] mt-1">
            Test the complete unlock flow
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Instructions */}
        <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <p className="text-xs text-[var(--color-foreground-secondary)]">
            Test the complete achievement unlock flow: Achievement notification → Items added to wardrobe → AI-generated SVG rewards
          </p>
        </div>

        {/* Test Buttons */}
        <div className="space-y-2">
          {/* Daily Test */}
          <button
            onClick={() => testAchievement('daily')}
            disabled={loading}
            className="w-full p-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="font-bold text-lg">⭐ Perfect Day</div>
                <div className="text-sm opacity-90">Unlocks: AI-Generated Dance</div>
              </div>
              <div className="text-3xl">💃</div>
            </div>
          </button>

          {/* Weekly Test */}
          <button
            onClick={() => testAchievement('weekly')}
            disabled={loading}
            className="w-full p-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="font-bold text-lg">🏆 Perfect Week</div>
                <div className="text-sm opacity-90">Unlocks: AI-Generated Hat + Costume</div>
              </div>
              <div className="text-3xl">🎩</div>
            </div>
          </button>

          {/* Monthly Test */}
          <button
            onClick={() => testAchievement('monthly')}
            disabled={loading}
            className="w-full p-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="font-bold text-lg">👑 Perfect Month</div>
                <div className="text-sm opacity-90">Unlocks: Random Color</div>
              </div>
              <div className="text-3xl">🎨</div>
            </div>
          </button>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearResults}
          disabled={loading}
          className="w-full px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          Clear Results
        </button>

        {/* Test Results */}
        {Object.entries(testResults).map(([type, result]) => {
          if (!result) return null;
          
          const icons = {
            daily: '⭐',
            weekly: '🏆',
            monthly: '👑'
          };
          
          const names = {
            daily: 'Perfect Day',
            weekly: 'Perfect Week',
            monthly: 'Perfect Month'
          };

          return (
            <div
              key={type}
              className={`p-4 rounded-lg border-2 ${
                result.success
                  ? 'bg-green-500/10 border-green-500'
                  : 'bg-red-500/10 border-red-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-[var(--color-foreground)] flex items-center gap-2">
                    {icons[type]} {names[type]}
                  </div>
                  <div className="text-xs text-[var(--color-foreground-secondary)]">
                    {result.timestamp}
                  </div>
                </div>
                <div className="text-2xl">
                  {result.success ? '✅' : '❌'}
                </div>
              </div>

              {result.success ? (
                <div className="space-y-2">
                  <div className="text-sm text-[var(--color-foreground)]">
                    <strong>Achievement:</strong> {result.achievement.achievement_name}
                  </div>
                  <div className="text-sm text-[var(--color-foreground-secondary)]">
                    {result.achievement.message}
                  </div>
                  
                  {result.items && result.items.length > 0 && (
                    <div className="mt-3 p-2 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                      <div className="text-xs font-semibold text-[var(--color-foreground)] mb-2">
                        New Items in Wardrobe:
                      </div>
                      {result.items.map((item, idx) => (
                        <div key={idx} className="text-xs text-[var(--color-foreground-secondary)] flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>{item.item_name}</span>
                          <span className="text-[var(--color-foreground-secondary)]/50">({item.item_type})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-[var(--color-foreground-secondary)]">
                    Total in wardrobe: {result.counts.hats} hats, {result.counts.costumes} costumes, {result.counts.colors} colors, {result.counts.dances} dances
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-500">
                  Error: {result.error}
                </div>
              )}
            </div>
          );
        })}

        {/* What to Check */}
        <div className="p-3 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
          <div className="text-xs font-semibold text-[var(--color-foreground)] mb-2">
            ✓ What to Check:
          </div>
          <div className="text-xs text-[var(--color-foreground-secondary)] space-y-1">
            <div>1. Achievement notification appears</div>
            <div>2. Items added to wardrobe</div>
            <div>3. Navigate to Bobo's Wardrobe</div>
            <div>4. Verify items appear in correct tabs</div>
            <div>5. Equip items and check sync</div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="bg-[var(--color-surface)] px-6 py-4 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2" />
            <p className="text-sm text-[var(--color-foreground)]">Testing...</p>
          </div>
        </div>
      )}
      
      {/* Achievement Notification Popup */}
      {achievementToShow && (
        <AchievementNotification
          achievement={achievementToShow}
          onClose={() => setAchievementToShow(null)}
        />
      )}
    </div>
  );
}
