import { useEffect } from "react";

export default function ConfirmModal({ message, subtext, confirmLabel = "Delete", onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onCancel(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 20, padding: "32px 28px",
          maxWidth: 400, width: "100%",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          animation: "modalPop 0.18s ease",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12, textAlign: "center" }}>🗑️</div>
        <h3 style={{ margin: "0 0 8px", fontWeight: 900, fontSize: 18, textAlign: "center" }}>
          {message}
        </h3>
        {subtext && (
          <p style={{ margin: "0 0 24px", opacity: 0.55, fontSize: 14, textAlign: "center", lineHeight: 1.5 }}>
            {subtext}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: subtext ? 0 : 24 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12,
              border: "1.5px solid rgba(0,0,0,0.12)", background: "white",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12,
              border: "none", background: "linear-gradient(135deg,#ff2d55,#ff6b35)",
              color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(255,45,85,0.3)",
              transition: "filter 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`@keyframes modalPop { from { opacity:0; transform:scale(0.93) } to { opacity:1; transform:scale(1) } }`}</style>
    </div>
  );
}
