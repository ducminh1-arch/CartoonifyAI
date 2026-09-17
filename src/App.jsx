import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import StudioView from './components/StudioView';
import ExploreView from './components/ExploreView';
import CreationsView from './components/CreationsView';
import SettingsView from './components/SettingsView';
import ProModal from './components/ProModal';
import { SAMPLE_PORTRAITS } from './data/samplePortraits';

export default function App() {
  const [currentTab, setCurrentTab] = useState('studio');
  const [selectedPortrait, setSelectedPortrait] = useState(SAMPLE_PORTRAITS[0]);
  const [activeStyleId, setActiveStyleId] = useState(null);
  const [creations, setCreations] = useState(() => {
    try {
      const saved = localStorage.getItem('cartoonify_creations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Sync creations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cartoonify_creations', JSON.stringify(creations));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [creations]);

  // Handle saving new creation
  const handleSaveCreation = (newCreation) => {
    setCreations((prev) => [newCreation, ...prev]);
  };

  // Handle deleting creation
  const handleDeleteCreation = (id) => {
    setCreations((prev) => prev.filter((c) => c.id !== id));
  };

  // Handle jumping from Explore showcase directly to Studio
  const handleOpenStudioWithPreset = (portrait, styleId) => {
    setSelectedPortrait(portrait);
    setActiveStyleId(styleId);
    setCurrentTab('studio');
  };

  return (
    <div className="app-container">
      {/* Top App Header */}
      <Header onOpenProModal={() => setIsProModalOpen(true)} />

      {/* Main Tab Views */}
      <main style={{ flex: 1 }}>
        {currentTab === 'studio' && (
          <StudioView
            selectedPortrait={selectedPortrait}
            onSelectNewPortrait={setSelectedPortrait}
            onSaveCreation={handleSaveCreation}
            initialStyleId={activeStyleId}
          />
        )}

        {currentTab === 'explore' && (
          <ExploreView onOpenStudioWithPreset={handleOpenStudioWithPreset} />
        )}

        {currentTab === 'creations' && (
          <CreationsView
            creations={creations}
            onDeleteCreation={handleDeleteCreation}
            onSelectCreationToEdit={(item) => {
              setSelectedPortrait({ id: item.id, url: item.originalUrl || item.url });
              setActiveStyleId(item.styleId || 'anime');
              setCurrentTab('studio');
            }}
          />
        )}

        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Persistent Bottom Tab Bar */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Pro Modal */}
      <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
    </div>
  );
}
