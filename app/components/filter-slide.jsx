"use client";

import { useEffect } from "react";

// ============================================================
// FilterDrawer — Pure slide-in panel
//
// Props:
//   open       boolean     — เปิด/ปิด
//   onClose    () => void  — กด X
//   onSearch   () => void  — กดปุ่ม "ค้นหา" (ส่ง event กลับ แล้วปิด drawer)
//   onClear    () => void  — กด "ล้าง" (ส่ง event กลับ ไม่ปิด drawer)
//   title      string      — default: "ตัวกรอง"
//   width      string      — default: "320px"
//   children   ReactNode   — content จาก component ที่เรียกใช้
// ============================================================
export function FilterDrawer({
  open,
  onClose,
  onSearch,
  onClear,
  title = "ตัวกรอง",
  width = "320px",
  children,
}) {
  // ล็อก body scroll ตอน drawer เปิด
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ปิดด้วย ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && open) onClose?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSearch = () => {
    onSearch?.();  // ส่ง event กลับ
    onClose?.();   // ปิด drawer
  };

  const handleClear = () => {
    onClear?.();   // ส่ง event กลับ (ไม่ปิด drawer)
  };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(0,0,0,0.15)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width, zIndex: 50,
          background: "#fff",
          boxShadow: "-4px 0 32px rgba(0,0,0,0.1)",
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>
            {title}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={handleClear}
              style={{
                fontSize: "13px", color: "#2563eb",
                background: "none", border: "none",
                cursor: "pointer", padding: "2px 4px",
              }}
            >
              ล้าง
            </button>
            <button
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "28px", height: "28px", borderRadius: "6px",
                background: "none", border: "none", cursor: "pointer", color: "#9ca3af",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body — children จาก component ที่เรียกใช้ */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {children}
        </div>

        {/* Footer — ปุ่มค้นหา */}
        <div style={{ padding: "16px", flexShrink: 0 }}>
          <button
            onClick={handleSearch}
            style={{
              width: "100%", padding: "14px",
              background: "#1e3a8a", color: "#fff",
              border: "none", borderRadius: "12px",
              fontSize: "15px", fontWeight: 600,
              cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1e40af")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1e3a8a")}
          >
            ค้นหา
          </button>
        </div>
      </div>
    </>
  );
}