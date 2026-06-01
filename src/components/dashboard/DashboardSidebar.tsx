import { useNavigate, useLocation } from "react-router-dom";
import { Home, PenLine, TrendingUp, Sparkles, Settings } from "lucide-react";

interface NavItem {
  key: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { key: "home",     label: "בית",    icon: Home,       path: "/app/dashboard" },
  { key: "journal",  label: "יומן",   icon: PenLine,    path: "/app/chat" },
  { key: "trends",   label: "מגמות",  icon: TrendingUp, path: "/app/monthly-summary", badge: "חדש" },
  { key: "tools",    label: "כלים",   icon: Sparkles,   path: "/app/meditation" },
  { key: "settings", label: "הגדרות", icon: Settings,   path: "/app/settings" },
];

const F = "'Heebo', sans-serif";

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside style={{
      width: "100%",
      background: "#ffffff",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      padding: "24px 12px 20px",
      boxSizing: "border-box",
      fontFamily: F,
      height: "100%",
    }}>
      {/* Section label */}
      <p style={{
        fontSize: 9, fontWeight: 800, color: "#9ca3af",
        letterSpacing: "0.12em", textTransform: "uppercase",
        margin: "0 0 10px 4px",
      }}>
        ניווט
      </p>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map(({ key, label, icon: Icon, path, badge }) => {
          const active = location.pathname === path;
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px",
                borderRadius: 12,
                border: active ? "1.5px solid #fde68a" : "1.5px solid transparent",
                background: active ? "#fef3c7" : "transparent",
                cursor: "pointer",
                textAlign: "start",
                fontFamily: F,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f9fafb"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon
                size={15}
                strokeWidth={active ? 2.2 : 1.8}
                color={active ? "#d97706" : "#6b7280"}
              />
              <span style={{
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? "#92400e" : "#374151",
                flex: 1,
              }}>
                {label}
              </span>
              {badge && (
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  background: "#dcfce7", color: "#14532d",
                  borderRadius: 50, padding: "1px 7px",
                }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
