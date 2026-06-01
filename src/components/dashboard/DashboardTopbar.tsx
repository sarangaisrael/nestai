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
import { useAdminStatus } from "@/hooks/useAdminStatus";
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
  const { isAdmin } = useAdminStatus();
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
      <div style={{
        background: "#ffffff",
        borderBottom: "0.5px solid #e5e7eb",
        padding: "12px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: F,
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
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app/admin")} className="cursor-pointer gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  {isRTL ? "לוח בקרה" : "Admin Dashboard"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/admin/notifications")} className="cursor-pointer gap-2">
                  <Bell className="h-4 w-4" />
                  {t.nav.adminNotifications}
                </DropdownMenuItem>
              </>
            )}
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
          <span style={{ fontSize: 17, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px" }}>
            NestAI
          </span>
        </button>

        {/* Left side (visual in RTL): chat icon */}
        <TopBtn onClick={() => navigate("/app/chat")}>
          <MessageCircle size={15} color="#374151" strokeWidth={1.8} />
        </TopBtn>
      </div>

      <FeedbackForm open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
};

export default DashboardTopbar;
