import React from 'react';
import { Compass, Wand2, Image as ImageIcon, Settings } from 'lucide-react';

export default function BottomNav({ currentTab, onTabChange }) {
  const tabs = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'studio', label: 'Studio', icon: Wand2 },
    { id: 'creations', label: 'Creations', icon: ImageIcon },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
          >
            <div className="nav-icon-box">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            </div>
            <span>{tab.label}</span>
            {isActive && <div className="nav-dot" />}
          </button>
        );
      })}
    </nav>
  );
}
