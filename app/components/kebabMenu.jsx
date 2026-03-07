import React from 'react';

export default function kebabMenu({ itemId, activeMenu, setActiveMenu, children }) {
  return (
    <div className="kebab-wrapper relative inline-block">
      <button 
        className="kebab-btn p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 focus:outline-none"
        onClick={(e) => {
          e.stopPropagation(); 
          setActiveMenu(activeMenu === itemId ? null : itemId);
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="2" fill="currentColor"></circle>
          <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
          <circle cx="12" cy="19" r="2" fill="currentColor"></circle>
        </svg>
      </button>

      {activeMenu === itemId && (
        <div 
          className="kebab-menu absolute mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-xl z-[9999] py-1"
          style={{ 
            top: '100%', 
            left: '0',
          }}
        >
          {children} 
        </div>
      )}
    </div>
  );
}