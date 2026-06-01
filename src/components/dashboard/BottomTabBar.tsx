import { useNavigate, useLocation } from "react-router-dom";
import { Home, PenLine, Settings } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const tabs = [
  { key: "home",     path: "/app/dashboard", icon: Home },
  { key: "journal",  path: "/app/chat",       icon: PenLine },
  { key: "settings", path: "/app/settings",   icon: Settings },
] as const;

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const labels: Record<string, string> = {
    home: t.dashboard.navHome,
    journal: t.dashboard.navJournal,
    settings: t.common.settings,
  };

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#ffffff',
      borderTop: '1px solid #f1f5f9',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      fontFamily: "'Heebo', sans-serif",
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        height: 58, maxWidth: 480, margin: '0 auto',
      }}>
        {tabs.map(({ key, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 22px', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Heebo', sans-serif",
              }}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.5}
                color={active ? '#6366f1' : '#94a3b8'}
              />
              <span style={{
                fontSize: 10,
                fontWeight: active ? 700 : 400,
                color: active ? '#6366f1' : '#94a3b8',
              }}>
                {labels[key]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
