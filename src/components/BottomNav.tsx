import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const TABS = [
  { path: "/app/dashboard", label: "בית",    emoji: "🏠" },
  { path: "/app/journal",   label: "יומן",   emoji: "📓" },
  { path: "/app/trends",    label: "מגמות",  emoji: "📊" },
  { path: "/app/chat",      label: "צ'אט",   emoji: "💬" },
  { path: "/app/settings",  label: "הגדרות", emoji: "⚙️" },
] as const;

const BottomNav = () => {
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const ratio = vv.height / window.innerHeight;
      setKeyboardOpen(ratio < 0.75);
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  const onChat = pathname === "/app/chat";
  if (onChat || keyboardOpen) return null;

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "#ffffff",
      borderTop: "0.5px solid #e2e8f0",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      fontFamily: "'Heebo', sans-serif",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-around",
        height: 58, maxWidth: 480, margin: "0 auto",
      }}>
        {TABS.map(({ path, label, emoji }) => {
          const active = pathname === path || (path === "/app/dashboard" && pathname === "/app");
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                padding: "6px 12px", background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Heebo', sans-serif", WebkitTapHighlightColor: "transparent",
                minWidth: 56,
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1.2, opacity: active ? 1 : 0.45 }}>
                {emoji}
              </span>
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 400,
                color: active ? "#6366f1" : "#94a3b8",
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
