import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import nestLogo from "@/assets/nestai-logo-full.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteContent } from "@/contexts/SiteContentContext";
import { getDefaultRouteForUser } from "@/lib/userRoles";
import { Capacitor } from "@capacitor/core";
import { PenLine, FileText, TrendingUp, Lock, ArrowRight, ArrowLeft, Download, Heart } from "lucide-react";
import IOSInstallOverlay from "@/components/IOSInstallOverlay";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import HeroSection from "@/components/landing/HeroSection";
import MediaSection from "@/components/landing/MediaSection";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface LandingBlock {
  id: string;
  block_type: string;
  sort_order: number;
  visible: boolean;
  config: Record<string, any>;
}

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showIOSOverlay, setShowIOSOverlay] = useState(false);
  const [blocks, setBlocks] = useState<LandingBlock[]>([]);
  const { t, dir, isRTL } = useLanguage();
  const { get } = useSiteContent();
  const { isIOS, isInstalled, promptInstall, canShowAndroidPrompt } = usePWAInstall();

  const handlePWAInstall = async () => {
    if (isIOS && !isInstalled) {
      setShowIOSOverlay(true);
    } else if (canShowAndroidPrompt) {
      await promptInstall();
    } else {
      navigate('/app');
    }
  };

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // Native Capacitor app — never show the landing page
      if (Capacitor.isNativePlatform()) {
        if (session) {
          const target = await getDefaultRouteForUser(session.user.id);
          navigate(target, { replace: true });
        } else {
          navigate("/app/chat", { replace: true });
        }
        return;
      }

      // PWA installed to home screen — redirect out of landing page
      if (isStandalone) {
        navigate(session ? "/app/dashboard" : "/app", { replace: true });
        return;
      }

      // In the browser, redirect authenticated users straight to their default route
      if (session) {
        const target = await getDefaultRouteForUser(session.user.id);
        navigate(target, { replace: true });
        return;
      }

      // Unauthenticated browser visitor — check for password-reset hash
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        if (hashParams.get("type") === "recovery") {
          navigate(`/app/auth${hash}`, { replace: true });
          return;
        }
      }

      // Load blocks
      const { data } = await supabase
        .from("landing_blocks")
        .select("*")
        .eq("visible", true)
        .order("sort_order", { ascending: true });
      setBlocks((data || []).map((b: any) => ({ ...b, config: b.config || {} })));
      setIsLoading(false);
    };
    init();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const features = [
    { icon: PenLine, title: get("feature1_title", t.landing.feature1Title), description: get("feature1_desc", t.landing.feature1Desc) },
    { icon: FileText, title: get("feature2_title", t.landing.feature2Title), description: get("feature2_desc", t.landing.feature2Desc) },
    { icon: TrendingUp, title: get("feature3_title", t.landing.feature3Title), description: get("feature3_desc", t.landing.feature3Desc) },
    { icon: Lock, title: get("feature4_title", t.landing.feature4Title), description: get("feature4_desc", t.landing.feature4Desc) },
  ];

  const renderBlock = (block: LandingBlock) => {
    switch (block.block_type) {
      case "hero":
        return <HeroSection key={block.id} onShowIOSOverlay={() => setShowIOSOverlay(true)} />;

      case "why":
        return (
          <section key={block.id} className="py-20 px-6 bg-background">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {get("why_badge", t.landing.whyNeedThis)}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {get("why_title", t.landing.whyTitle)}
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                {get("why_description", t.landing.whyDescription)}
              </p>
            </div>
          </section>
        );

      case "features":
        return (
          <section key={block.id} className="py-24 px-6 bg-muted/30">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                  {get("features_badge", t.landing.whatsIncluded)}
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                  {get("features_title", t.landing.toolsTitle)}
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature, index) => (
                  <div key={index} className="group bg-card rounded-3xl p-8 border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                      <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-foreground/60 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case "media":
        return <MediaSection key={block.id} />;

      case "cta":
        return (
          <section key={block.id} className="py-24 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                {get("cta_title", t.landing.readyToStart)}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/app">
                  <Button size="lg" className="rounded-full gap-2 px-10 text-lg h-14">
                    {t.welcome.getStarted}
                    <ArrowIcon className="w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="rounded-full gap-2 px-8 text-lg h-14" onClick={handlePWAInstall}>
                  <Download className="w-5 h-5" />
                  {t.nav.installApp}
                </Button>
              </div>
            </div>
          </section>
        );

      case "problem_solution":
        return (
          <section key={block.id} className="py-20 px-6 bg-muted/20">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
              {/* Problem / Left card */}
              <div className="bg-card rounded-3xl p-8 md:p-10 border border-border shadow-sm space-y-4">
                <span className="inline-block px-3 py-1.5 bg-destructive/10 text-destructive rounded-full text-sm font-semibold">
                  {isRTL ? "האתגר" : "The Challenge"}
                </span>
                {block.config?.problem_title && (
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    {block.config.problem_title}
                  </h3>
                )}
                {block.config?.problem_body && (
                  <p className="text-foreground/60 leading-relaxed text-base md:text-lg">
                    {block.config.problem_body}
                  </p>
                )}
              </div>
              {/* Solution / Right card */}
              <div className="bg-card rounded-3xl p-8 md:p-10 border border-primary/30 shadow-sm space-y-4">
                <span className="inline-block px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  {isRTL ? "הפתרון" : "The Solution"}
                </span>
                {block.config?.solution_title && (
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    {block.config.solution_title}
                  </h3>
                )}
                {block.config?.solution_body && (
                  <p className="text-foreground/60 leading-relaxed text-base md:text-lg">
                    {block.config.solution_body}
                  </p>
                )}
              </div>
            </div>
          </section>
        );

      case "custom":
        return (
          <section key={block.id} className="py-20 px-6 bg-background">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              {block.config?.badge && (
                <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {block.config.badge}
                </span>
              )}
              {block.config?.title && (
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  {block.config.title}
                </h2>
              )}
              {block.config?.body && (
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  {block.config.body}
                </p>
              )}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden" dir={dir}>
      {/* Header */}
      <header className="fixed top-4 left-4 right-4 z-50 bg-background/70 backdrop-blur-xl border border-border/40 rounded-2xl shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <img src={nestLogo} alt="NestAI.care" className="h-10 sm:h-14 object-contain" />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher variant="icon" />
            <Link to="/for-therapists">
              <Button variant="ghost" size="sm">{isRTL ? "למטפלים" : "For Therapists"}</Button>
            </Link>
            <Link to="/app/auth">
              <Button variant="ghost" size="sm">{t.common.login}</Button>
            </Link>
            <Link to="/app">
              <Button size="sm" className="rounded-full px-6">{t.landing.freeSignup}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Dynamic Blocks */}
      {blocks.map(renderBlock)}

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={nestLogo} alt="MyNest" className="h-8 object-contain" />
            <span className="text-sm text-foreground/40">{t.footer.copyright}</span>
          </div>
          <div className="flex gap-6">
            <Link to="/app/privacy" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
              {t.nav.privacy}
            </Link>
          </div>
        </div>
      </footer>

      <IOSInstallOverlay isOpen={showIOSOverlay} onClose={() => setShowIOSOverlay(false)} />
    </div>
  );
};

export default LandingPage;
