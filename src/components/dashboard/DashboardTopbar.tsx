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
import NotificationBell from "@/components/notifications/NotificationBell";
import FeedbackForm from "@/components/common/FeedbackForm";

// ─── Icon button helper ───────────────────────────────────────────────────────
const IconBtn = ({
  children, onClick,
}: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    style={{
      width: 34, height: 34, borderRadius: 10,
      background: '#f8fafc',
      border: '1px solid #f1f5f9',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
    onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
  >
    {children}
  </button>
);

// ─── Component ───────────────────────────────────────────────────────────────
const DashboardTopbar = () => {
  const navigate   = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { t, isRTL } = useLanguage();
  const { isDark, toggle: toggleDark }  = useDarkMode();
  const { settings: a11y, cycleFontSize } = useAccessibility();
  const { isAdmin }  = useAdminStatus();
  const { isInstalled, promptInstall, canShowAndroidPrompt } = usePWAInstall();
  const { toast }    = useToast();
  const { hasFlag }  = useAppDirectives();

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
      <style>{`
        .dash-topbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 54px;
          padding: 0 16px;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        @media (min-width: 768px) {
          .dash-topbar-inner {
            padding: 0 48px;
          }
        }
      `}</style>

      {/* Fixed topbar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(250,250,250,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        fontFamily: "'Heebo', sans-serif",
      }}>
        <div className="dash-topbar-inner">

          {/* ── Right side (visual): chat + bell ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Chat */}
            <IconBtn onClick={() => navigate("/app/chat")}>
              <MessageCircle size={16} color="#0f172a" strokeWidth={1.8} />
            </IconBtn>

            {/* Bell — wrap NotificationBell inside the styled button shape */}
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: '#f8fafc', border: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', flexShrink: 0,
            }}>
              <NotificationBell />
            </div>
          </div>

          {/* ── Center: logo text ── */}
          <button
            onClick={() => navigate("/app/dashboard")}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: "'Heebo', sans-serif",
            }}
          >
            <span style={{
              fontSize: 20, fontWeight: 900, color: '#0f172a',
              letterSpacing: '-0.5px',
            }}>
              NestAI
            </span>
          </button>

          {/* ── Left side (visual): hamburger menu ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div>
                <IconBtn>
                  <Menu size={16} color="#0f172a" strokeWidth={1.8} />
                </IconBtn>
              </div>
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

        </div>
      </div>

      {/* Spacer so content doesn't hide behind the fixed bar */}
      <div style={{ height: 'calc(env(safe-area-inset-top, 0px) + 54px)' }} />

      <FeedbackForm open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
};

export default DashboardTopbar;
