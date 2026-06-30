import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, MessageCircle,
  Settings, LogOut, User, FileText, Sparkles,
  Moon, Sun, Type, Bell, LayoutDashboard, Search,
  MessageSquareHeart, Download,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useAccessibility } from "@/hooks/useAccessibility";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useToast } from "@/hooks/use-toast";
import { useAppDirectives } from "@/hooks/useAppDirectives";
import { supabase } from "@/integrations/supabase/client";
import FeedbackForm from "@/components/common/FeedbackForm";

const F = "'Heebo', sans-serif";

const TopBtn = ({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    style={{
      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
      background: "#f3f4f6", border: "0.5px solid #e5e7eb",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);

const DashboardTopbar = () => {
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { t, isRTL } = useLanguage();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { settings: a11y, cycleFontSize } = useAccessibility();
  const { isInstalled, promptInstall, canShowAndroidPrompt } = usePWAInstall();
  const { toast } = useToast();
  const { hasFlag } = useAppDirectives();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("sb-")) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    navigate("/app/auth", { replace: true });
  };

  const handleInstall = async () => {
    if (canShowAndroidPrompt) {
      const installed = await promptInstall();
      if (installed) toast({ title: t.dashboard.installedSuccess });
    } else {
      toast({ title: t.nav.installApp, description: t.dashboard.installInstructions });
    }
  };

  return (
    <>
      {/* Fixed topbar */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "#ffffff",
        borderBottom: "0.5px solid #e5e7eb",
        paddingTop: "env(safe-area-inset-top, 0px)",
        fontFamily: F,
      }}>
      <div style={{
        padding: "12px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        {/* Right side (visual in RTL): hamburger menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div><TopBtn><Menu size={15} color="#374151" strokeWidth={1.8} /></TopBtn></div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/app/dashboard")} className="cursor-pointer gap-2">
              <LayoutDashboard className="h-4 w-4" />
              {isRTL ? "דשבורד" : "Dashboard"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!hasFlag("HIDE_HISTORY") && (
              <DropdownMenuItem onClick={() => navigate("/app/summary")} className="cursor-pointer gap-2">
                <FileText className="h-4 w-4" />
                {isRTL ? "סיכומים שבועיים" : "Weekly Summaries"}
              </DropdownMenuItem>
            )}
            {!hasFlag("HIDE_MONTHLY_SUMMARY") && (
              <DropdownMenuItem onClick={() => navigate("/app/monthly-summary")} className="cursor-pointer gap-2">
                <FileText className="h-4 w-4" />
                {t.nav.monthlySummary}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigate("/app/patterns")} className="cursor-pointer gap-2">
              <Search className="h-4 w-4" />
              {isRTL ? "דפוסים ותובנות" : "Patterns & Insights"}
            </DropdownMenuItem>
            {!hasFlag("HIDE_MEDITATION") && (
              <DropdownMenuItem onClick={() => navigate("/app/meditation")} className="cursor-pointer gap-2">
                <Sparkles className="h-4 w-4" />
                {t.nav.meditation}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigate("/app/journal")} className="cursor-pointer gap-2">
              <FileText className="h-4 w-4" />
              {isRTL ? "יומן שקט" : "Silent Journal"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleDark} className="cursor-pointer gap-2">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? (isRTL ? "מצב בהיר" : "Light mode") : (isRTL ? "מצב כהה" : "Dark mode")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={cycleFontSize} className="cursor-pointer gap-2">
              <Type className="h-4 w-4" />
              {t.accessibility.fontSize}: {
                a11y.fontSize === "normal" ? t.accessibility.fontSizeNormal
                : a11y.fontSize === "large" ? t.accessibility.fontSizeLarge
                : t.accessibility.fontSizeXLarge
              }
            </DropdownMenuItem>
            {!isInstalled && (
              <DropdownMenuItem onClick={handleInstall} className="cursor-pointer gap-2">
                <Download className="h-4 w-4" />
                {t.nav.installApp}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {!hasFlag("HIDE_SETTINGS") && (
              <DropdownMenuItem onClick={() => navigate("/app/settings")} className="cursor-pointer gap-2">
                <Settings className="h-4 w-4" />
                {t.nav.settings}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigate("/app/account-settings")} className="cursor-pointer gap-2">
              <User className="h-4 w-4" />
              {t.accessibility.myAccount}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFeedbackOpen(true)} className="cursor-pointer gap-2">
              <MessageSquareHeart className="h-4 w-4" />
              {isRTL ? "שלח משוב" : "Give Feedback"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              {t.common.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Center: logo */}
        <button
          onClick={() => navigate("/app/dashboard")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: F }}
        >
          <span style={{ fontFamily: "'Righteous', sans-serif", fontSize: 18, color: '#111827' }}>
            Nest<span style={{ color: '#6366f1' }}>AI</span>
          </span>
        </button>

        {/* Left side (visual in RTL): chat icon */}
        <TopBtn onClick={() => navigate("/app/chat")}>
          <MessageCircle size={15} color="#374151" strokeWidth={1.8} />
        </TopBtn>
      </div>
      </div>


      <FeedbackForm open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
};

export default DashboardTopbar;
