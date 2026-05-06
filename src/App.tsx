import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SiteContentProvider } from "@/contexts/SiteContentContext";
import { FeatureToggleProvider } from "@/contexts/FeatureToggleContext";
import { AppDirectivesProvider } from "@/components/AppDirectivesProvider";
import AppLayout from "@/components/AppLayout";

// Lazy load all other pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const TherapistLandingPage = lazy(() => import("./pages/TherapistLandingPage"));
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Summary = lazy(() => import("./pages/Summary"));
const MonthlySummary = lazy(() => import("./pages/MonthlySummary"));
const Settings = lazy(() => import("./pages/Settings"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Meditation = lazy(() => import("./pages/Meditation"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const InstallScreen = lazy(() => import("./pages/InstallScreen"));
const MailMessages = lazy(() => import("./pages/MailMessages"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const PressDemo = lazy(() => import("./pages/PressDemo"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Paywall = lazy(() => import("./pages/Paywall"));


const JournalPage = lazy(() => import("./pages/JournalPage"));
const PatternsInsights = lazy(() => import("./pages/PatternsInsights"));
const Support = lazy(() => import("./pages/Support"));
const AdminGate = lazy(() => import("./components/AdminGate"));
const ChoosePathScreen = lazy(() => import("./pages/ChoosePathScreen"));
const ProfessionalIntro = lazy(() => import("./pages/professional/ProfessionalIntro"));
const ProfessionalDemo = lazy(() => import("./pages/professional/ProfessionalDemo"));
const TherapistDashboard = lazy(() => import("./pages/professional/TherapistDashboard"));
const JoinReferral = lazy(() => import("./pages/JoinReferral"));

const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <SiteContentProvider>
      <AppDirectivesProvider>
      <FeatureToggleProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* ── Public / marketing pages — no sidebar ── */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/landing" element={<Navigate to="/" replace />} />
              <Route path="/for-therapists" element={<TherapistLandingPage />} />
              <Route path="/join/:ref" element={<JoinReferral />} />

              {/* ── Auth / onboarding — no sidebar ── */}
              <Route path="/app/auth" element={<Auth />} />
              <Route path="/app" element={<ChoosePathScreen />} />
              <Route path="/app/join" element={<JoinReferral />} />
              <Route path="/app/install" element={<InstallScreen />} />
              <Route path="/app/press-demo" element={<PressDemo />} />
              <Route path="/app/mail" element={<MailMessages />} />
              <Route path="/app/admin/login" element={<AdminLogin />} />

              {/* ── Professional / therapist — no sidebar ── */}
              <Route path="/app/professional/intro" element={<ProfessionalIntro />} />
              <Route path="/app/professional/demo" element={<ProfessionalDemo />} />
              <Route path="/app/professional/dashboard" element={<TherapistDashboard />} />

              {/* ── Admin — no sidebar ── */}
              <Route path="/app/admin" element={<Suspense fallback={<LoadingSpinner />}><AdminGate><AdminDashboard /></AdminGate></Suspense>} />
              <Route path="/app/admin/notifications" element={<Suspense fallback={<LoadingSpinner />}><AdminGate><AdminNotifications /></AdminGate></Suspense>} />

              {/* ── Authenticated patient pages — with sidebar on desktop ── */}
              <Route path="/app/chat"            element={<AppLayout><Index /></AppLayout>} />
              <Route path="/app/dashboard"       element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/app/summary"         element={<AppLayout><Summary /></AppLayout>} />
              <Route path="/app/monthly-summary" element={<AppLayout><MonthlySummary /></AppLayout>} />
              <Route path="/app/settings"        element={<AppLayout><Settings /></AppLayout>} />
              <Route path="/app/account-settings" element={<AppLayout><AccountSettings /></AppLayout>} />
              <Route path="/app/meditation"      element={<AppLayout><Meditation /></AppLayout>} />
              <Route path="/app/journal"         element={<AppLayout><JournalPage /></AppLayout>} />
              <Route path="/app/patterns"        element={<AppLayout><PatternsInsights /></AppLayout>} />
              <Route path="/app/privacy"         element={<AppLayout><Privacy /></AppLayout>} />
              <Route path="/app/support"         element={<AppLayout><Support /></AppLayout>} />
              <Route path="/app/paywall"         element={<AppLayout><Paywall /></AppLayout>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      </FeatureToggleProvider>
      </AppDirectivesProvider>
      </SiteContentProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
