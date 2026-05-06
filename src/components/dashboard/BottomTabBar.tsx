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
  const { isRTL } = useLanguage();

  const labels: Record<string, string> = isRTL
    ? { home: "בית", journal: "יומן", settings: "הגדרות" }
    : { home: "Home", journal: "Journal", settings: "Settings" };

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#ffffff', borderTop: '0.5px solid #e2e8f0',
      paddingBottom: 'env(safe-area-inset-bottom,0px)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        height: 56, maxWidth: 480, margin: '0 auto',
      }}>
        {tabs.map(({ key, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 20px', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.5}
                color={active ? '#1e3a5f' : '#cbd5e1'}
              />
              <span style={{
                fontSize: 10, fontWeight: active ? 500 : 400,
                color: active ? '#1e3a5f' : '#cbd5e1',
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
