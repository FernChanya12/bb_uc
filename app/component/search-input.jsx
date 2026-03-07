"use client";

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "ค้นหา",
  disabled = false,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") onSearch?.(e.target.value);
  };

  return (
    <div style={{ position: "relative", width: "100%", display: "inline-block" }}>
      <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{
          position: "absolute", left: "10px", top: "50%",
          transform: "translateY(-50%)", pointerEvents: "none",
        }}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>

      <input
        type="text"
        // ถ้ามี value+onChange = controlled / ถ้าไม่มี = uncontrolled
        {...(onChange
          ? { value: value ?? "", onChange }
          : { defaultValue: value ?? "" }
        )}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          height: "40px",
          padding: "8px 12px 8px 32px",
          borderRadius: "8px",
          border: "1px solid #A9A9A9",
          color: "black",
          width: "100%",
          outline: "none",
          boxSizing: "border-box",
          fontSize: "14px",
          background: "#fff",
          transition: "box-shadow 0.15s",
          maxWidth: "500px"
        }}
        onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px rgb(59,130,246)")}
        onBlur={(e)  => (e.target.style.boxShadow = "none")}
      />
    </div>
  );
}