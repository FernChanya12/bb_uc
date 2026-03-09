"use client";

import { useState, useRef, useEffect } from "react";

export default function KebabMenu({ itemId, activeMenu, setActiveMenu, children }) {
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const updatePos = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
  };

  // ปิดตอน scroll
  useEffect(() => {
    if (activeMenu === itemId) {
      window.addEventListener("scroll", updatePos, true);
      return () => window.removeEventListener("scroll", updatePos, true);
    }
  }, [activeMenu, itemId]);

  // ปิดตอนคลิกที่ว่าง
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setActiveMenu(null);
      }
    };

    if (activeMenu === itemId) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenu, itemId]);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (activeMenu === itemId) {
      setActiveMenu(null);
    } else {
      updatePos();
      setActiveMenu(itemId);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 focus:outline-none"
        onClick={handleOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="19" r="2" fill="currentColor" />
        </svg>
      </button>

      {activeMenu === itemId && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 9999,
          }}
          className="w-40 bg-white border border-gray-100 rounded-lg shadow-xl py-1"
          onClick={() => setActiveMenu(null)}
        >
          {children}
        </div>
      )}
    </div>
  );
}