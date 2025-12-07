import { useState } from 'react';
import Navigation from '../components/Navigation';
import CapacitySettings from '../components/CapacitySettings';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('capacity');

  const tabs = [
    { id: 'capacity', label: 'Time Budget', icon: '⏰' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'account', label: 'Account', icon: '👤' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark-light to-dark">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-light mb-2">Settings</h1>
          <p className="text-light/60">Manage your preferences and account settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-light/5 text-light/60 hover:bg-light/10'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'capacity' && <CapacitySettings />}
          
          {activeTab === 'preferences' && (
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-light mb-4">Preferences</h2>
              <p className="text-light/60">Coming soon...</p>
            </div>
          )}
          
          {activeTab === 'account' && (
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-light mb-4">Account</h2>
              <p className="text-light/60">Coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
