import { useNavigate, useLocation } from "react-router-dom";
import { Home, PenLine, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const tabs = [
  { key: "home", path: "/app/dashboard", icon: Home },
  { key: "journal", path: "/app/chat", icon: PenLine },
  { key: "settings", path: "/app/settings", icon: Settings },
] as const;

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRTL } = useLanguage();

  const labels: Record<string, string> = isRTL
    ? { home: "בית", journal: "יומן", settings: "הגדרות" }
    : { home: "Home", journal: "Journal", settings: "Settings" };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/30"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map(({ key, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{labels[key]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
