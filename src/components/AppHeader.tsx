import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  User, Settings, LogOut, Type,
  Moon, Sun, Menu, FileText, Sparkles,
  Bell, LayoutDashboard, MessageSquareHeart, Search,
  MessageCircle
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAppDirectives } from "@/hooks/useAppDirectives";
import FeedbackForm from "@/components/FeedbackForm";

const iconBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 9,
  background: '#f1f5f9', border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
};

const AppHeader = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("feedback") === "true") {
      setFeedbackOpen(true);
      searchParams.delete("feedback");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { t, isRTL } = useLanguage();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { settings: a11y, cycleFontSize } = useAccessibility();
  const { isAdmin } = useAdminStatus();
  const { isInstalled, promptInstall, canShowAndroidPrompt } = usePWAInstall();
  const { toast } = useToast();
  const { hasFlag } = useAppDirectives();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) keysToRemove.push(key);
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      navigate("/app/auth", { replace: true });
    } catch {
      navigate("/app/auth", { replace: true });
    }
  };

  const handleInstallClick = async () => {
    if (canShowAndroidPrompt) {
      const installed = await promptInstall();
      if (installed) {
        toast({ title: t.dashboard.installedSuccess, description: t.dashboard.appAddedToHome });
      }
    } else {
      toast({ title: t.nav.installApp, description: t.dashboard.installInstructions });
    }
  };

  return (
    <>
      {/* Fixed header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: '#ffffff',
        paddingTop: 'env(safe-area-inset-top,0px)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', height: 56,
          borderBottom: '0.5px solid #e2e8f0',
        }}>
          {/* Right: chat icon (first child = visual right in RTL) */}
          <button onClick={() => navigate("/app/chat")} style={iconBtn} aria-label="chat">
            <MessageCircle size={15} color="#0f172a" strokeWidth={1.8} />
          </button>

          {/* Center: logo */}
          <button
            onClick={() => navigate("/app/dashboard")}
            style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', fontFamily: 'inherit' }}>NestAI.care</span>
          </button>

          {/* Left: profile icon with full dropdown (last child = visual left in RTL) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button style={iconBtn} aria-label="profile menu">
                <User size={15} color="#0f172a" strokeWidth={1.8} />
              </button>
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
        </div>
      </div>

      {/* Spacer */}
      <div style={{ height: 'calc(env(safe-area-inset-top,0px) + 56px)' }} />

      <FeedbackForm open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
};

export default AppHeader;
