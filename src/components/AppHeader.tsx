import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  User, Settings, LogOut, Accessibility, Type, Contrast,
  Link, Eye, Moon, Sun, Menu, FileText, Sparkles,
  Download, Bell, LayoutDashboard, MessageSquareHeart, Search,
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
import LanguageSwitcher from "@/components/LanguageSwitcher";
import nestLogo from "@/assets/nestai-logo-full.png";

const AppHeader = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("feedback") === "true") {
      setFeedbackOpen(true);
      searchParams.delete("feedback");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch user first name for sub-header
  useEffect(() => {
    const fetchName = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile?.first_name) setFirstName(profile.first_name);
    };
    fetchName();
  }, []);

  const { t, isRTL } = useLanguage();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { settings: a11y, update: updateA11y, cycleFontSize } = useAccessibility();
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
      {/* Fixed header wrapper */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        {/* Main Nav Bar */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border/30">
          {/* Left side: Chat + Notifications */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => navigate("/app/chat")}
            >
              <MessageCircle className="h-5 w-5 text-foreground" />
            </Button>
          </div>

          {/* Center: Logo */}
          <button
            onClick={() => navigate("/app/dashboard")}
            className="absolute left-1/2 -translate-x-1/2 flex items-center"
          >
            <img src={nestLogo} alt="NestAI" className="h-8 w-auto" />
          </button>

          {/* Right side: Hamburger Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5 text-foreground" />
              </Button>
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

      {/* Spacer to prevent content from hiding behind the fixed header */}
      <div style={{ height: "calc(env(safe-area-inset-top, 0px) + 56px)" }} />

      <FeedbackForm open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
};

export default AppHeader;
