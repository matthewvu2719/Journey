import { useState } from 'react';
import RobotMascot from './RobotMascot';

export default function BoboTestPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [generatedItem, setGeneratedItem] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const clearLogs = () => {
    setLogs([]);
    setGeneratedItem(null);
    setDbStatus(null);
  };

  // Test AI generation
  const testGeneration = async (itemType) => {
    setLoading(true);
    addLog(`Testing ${itemType} generation...`, 'info');
    
    try {
      const response = await fetch(`http://localhost:8000/api/test/generate-item?item_type=${itemType}`);
      const data = await response.json();
      
      if (data.success) {
        addLog(`✅ ${itemType} generated successfully!`, 'success');
        addLog(`Name: ${data.generated_item.name}`, 'info');
        addLog(`ID: ${data.generated_item.id}`, 'info');
        setGeneratedItem({ type: itemType, data: data.generated_item });
      } else {
        addLog(`❌ Generation failed`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Test achievement unlock
  const testAchievement = async (achievementType) => {
    setLoading(true);
    const achievementNames = {
      'single': 'Any Completion (Motivational)',
      'daily': 'Perfect Day (Dance)',
      'weekly': 'Perfect Week (Hat + Costume + Color)',
      'monthly': 'Perfect Month (Theme)'
    };
    
    addLog(`Triggering ${achievementNames[achievementType]}...`, 'info');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/test/trigger-achievement?achievement_type=${achievementType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        addLog(`✅ Achievement unlocked!`, 'success');
        addLog(`Reward: ${data[0].reward_type}`, 'info');
        addLog(`Message: ${data[0].message}`, 'info');
        
        // Check if items were added to wardrobe
        setTimeout(() => checkWardrobe(), 1000);
      } else {
        addLog(`⚠️ No achievement unlocked`, 'warning');
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check wardrobe items
  const checkWardrobe = async () => {
    addLog('Checking wardrobe items...', 'info');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/bobo/items', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const items = await response.json();
      addLog(`✅ Found ${items.length} items in wardrobe`, 'success');
      
      const grouped = {
        hats: items.filter(i => i.item_type === 'hat').length,
        costumes: items.filter(i => i.item_type === 'costume').length,
        colors: items.filter(i => i.item_type === 'color').length,
        dances: items.filter(i => i.item_type === 'dance').length
      };
      
      addLog(`Hats: ${grouped.hats}, Costumes: ${grouped.costumes}, Colors: ${grouped.colors}, Dances: ${grouped.dances}`, 'info');
    } catch (error) {
      addLog(`❌ Error checking wardrobe: ${error.message}`, 'error');
    }
  };

  // Check database status
  const checkDatabase = async () => {
    setLoading(true);
    addLog('Checking database status...', 'info');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/test/db-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setDbStatus(data);
      
      addLog(`✅ Database check complete`, 'success');
      addLog(`Mock mode: ${data.mock_mode ? 'Yes' : 'No'}`, 'info');
      addLog(`Total items: ${data.total_items}`, 'info');
      addLog(`Equipped items: ${data.equipped_items ? 'Yes' : 'No'}`, 'info');
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Unlock test items
  const unlockTestItems = async () => {
    setLoading(true);
    addLog('Unlocking test items...', 'info');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/test/unlock-items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        addLog(`✅ Test items unlocked!`, 'success');
        data.items.forEach(item => addLog(`  - ${item}`, 'info'));
        
        setTimeout(() => checkWardrobe(), 1000);
      } else {
        addLog(`❌ Failed to unlock items`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-105 font-medium"
        title="Open Bobo Test Panel"
      >
        🧪 Test Panel
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-40 w-96 max-h-[600px] bg-[var(--color-surface)] border-2 border-purple-500 rounded-xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
        <h3 className="font-bold text-[var(--color-foreground)] flex items-center gap-2">
          🧪 Bobo Test Panel
        </h3>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Generation Tests */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">
            🎨 Test AI Generation
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => testGeneration('hat')}
              disabled={loading}
              className="px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              Hat
            </button>
            <button
              onClick={() => testGeneration('costume')}
              disabled={loading}
              className="px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              Costume
            </button>
            <button
              onClick={() => testGeneration('dance')}
              disabled={loading}
              className="px-3 py-2 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
            >
              Dance
            </button>
          </div>
        </div>

        {/* Achievement Tests */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">
            🏆 Test Achievements
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => testAchievement('single')}
              disabled={loading}
              className="px-3 py-2 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 transition-colors"
            >
              Any Complete
            </button>
            <button
              onClick={() => testAchievement('daily')}
              disabled={loading}
              className="px-3 py-2 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              Perfect Day
            </button>
            <button
              onClick={() => testAchievement('weekly')}
              disabled={loading}
              className="px-3 py-2 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              Perfect Week
            </button>
            <button
              onClick={() => testAchievement('monthly')}
              disabled={loading}
              className="px-3 py-2 text-xs bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50 transition-colors"
            >
              Perfect Month
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">
            ⚡ Quick Actions
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={unlockTestItems}
              disabled={loading}
              className="px-3 py-2 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              Unlock Test Items
            </button>
            <button
              onClick={checkWardrobe}
              disabled={loading}
              className="px-3 py-2 text-xs bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              Check Wardrobe
            </button>
            <button
              onClick={checkDatabase}
              disabled={loading}
              className="px-3 py-2 text-xs bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:opacity-50 transition-colors"
            >
              Check Database
            </button>
            <button
              onClick={clearLogs}
              disabled={loading}
              className="px-3 py-2 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Generated Item Preview */}
        {generatedItem && (
          <div className="p-3 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
            <h4 className="text-xs font-semibold text-[var(--color-foreground)] mb-2">
              Generated {generatedItem.type}:
            </h4>
            <div className="flex items-center gap-3">
              {generatedItem.type === 'dance' ? (
                <div className="text-2xl">💃</div>
              ) : generatedItem.type === 'hat' || generatedItem.type === 'costume' ? (
                <div className="w-12 h-12 flex items-center justify-center">
                  <RobotMascot
                    size="sm"
                    emotion="excited"
                    hat={generatedItem.type === 'hat' ? { svg: generatedItem.data.svg } : null}
                    costume={generatedItem.type === 'costume' ? { svg: generatedItem.data.svg } : null}
                  />
                </div>
              ) : null}
              <div className="flex-1">
                <p className="text-xs font-medium text-[var(--color-foreground)]">
                  {generatedItem.data.name}
                </p>
                <p className="text-xs text-[var(--color-foreground-secondary)]">
                  {generatedItem.data.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Database Status */}
        {dbStatus && (
          <div className="p-3 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
            <h4 className="text-xs font-semibold text-[var(--color-foreground)] mb-2">
              Database Status:
            </h4>
            <div className="text-xs space-y-1 text-[var(--color-foreground-secondary)]">
              <div>Mode: {dbStatus.mock_mode ? '🟡 Mock' : '🟢 Live'}</div>
              <div>Items: {dbStatus.total_items}</div>
              <div>Equipped: {dbStatus.equipped_items ? '✅' : '❌'}</div>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">
            📋 Logs
          </h4>
          <div className="bg-[var(--color-background)] rounded-lg border border-[var(--color-border)] p-2 max-h-48 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <p className="text-xs text-[var(--color-foreground-secondary)] text-center py-4">
                No logs yet. Run a test!
              </p>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`text-xs font-mono ${
                    log.type === 'success' ? 'text-green-500' :
                    log.type === 'error' ? 'text-red-500' :
                    log.type === 'warning' ? 'text-yellow-500' :
                    'text-[var(--color-foreground-secondary)]'
                  }`}
                >
                  <span className="opacity-50">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
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
    </div>
  );
}
