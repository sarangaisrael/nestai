import { useNavigate, useLocation } from "react-router-dom";
import { Home, PenLine, TrendingUp, Sparkles, Settings } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const sectionLabel: React.CSSProperties = {
  fontSize: 9, fontWeight: 500, color: '#cbd5e1', letterSpacing: '0.1em',
  textTransform: 'uppercase', marginBottom: 8, display: 'block', paddingRight: 10,
};

const items = [
  {
    key: 'home',
    path: '/app/dashboard',
    labelHe: 'בית',
    labelEn: 'Home',
    icon: Home,
    iconBg: '#dbeafe',
    iconColor: '#1d4ed8',
    activeLabelColor: '#1e3a5f',
  },
  {
    key: 'journal',
    path: '/app/chat',
    labelHe: 'יומן',
    labelEn: 'Journal',
    icon: PenLine,
    iconBg: '#fce7f3',
    iconColor: '#be185d',
    activeLabelColor: '#be185d',
  },
  {
    key: 'trends',
    path: '/app/monthly-summary',
    labelHe: 'מגמות',
    labelEn: 'Trends',
    icon: TrendingUp,
    iconBg: '#d1fae5',
    iconColor: '#065f46',
    activeLabelColor: '#065f46',
    badge: 'חדש',
  },
  {
    key: 'tools',
    path: '/app/meditation',
    labelHe: 'כלים',
    labelEn: 'Tools',
    icon: Sparkles,
    iconBg: '#ede9fe',
    iconColor: '#6d28d9',
    activeLabelColor: '#6d28d9',
  },
  {
    key: 'settings',
    path: '/app/settings',
    labelHe: 'הגדרות',
    labelEn: 'Settings',
    icon: Settings,
    iconBg: '#f1f5f9',
    iconColor: '#64748b',
    activeLabelColor: '#64748b',
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRTL } = useLanguage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', marginBottom: 24 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>NestAI.care</span>
      </div>

      {/* Nav section */}
      <div>
        <span style={sectionLabel}>{isRTL ? 'ניווט' : 'NAVIGATION'}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item) => {
            const active = location.pathname === item.path;
            const label = isRTL ? item.labelHe : item.labelEn;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: active ? '#f0f7ff' : 'transparent',
                  width: '100%', textAlign: 'start',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: item.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <item.icon size={13} color={item.iconColor} strokeWidth={2} />
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 500, flex: 1,
                  color: active ? item.activeLabelColor : '#64748b',
                }}>
                  {label}
                </span>
                {item.badge && (
                  <span style={{
                    fontSize: 9, fontWeight: 500, color: '#1d4ed8',
                    background: '#dbeafe', borderRadius: 20, padding: '2px 6px', flexShrink: 0,
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
