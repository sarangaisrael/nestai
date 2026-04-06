import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Copy,
  FileText,
  Lightbulb,
  Loader2,
  LogOut,
  Menu,
  MessageCircleMore,
  Moon,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  Sun,
  TrendingUp,
  Type,
  User,
  UserPlus,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useAccessibility } from "@/hooks/useAccessibility";
import EmotionStats from "@/components/dashboard/EmotionStats";
import TrialStatusCard from "@/components/access/TrialStatusCard";
import { buildReferralUrl } from "@/lib/referrals";
import nestLogo from "@/assets/nestai-logo-full.png";
import AccessLockOverlay from "@/components/AccessLockOverlay";
import { ensureUserAccessProfile, fetchMyAccessState, type AccessState } from "@/lib/accessControl";

type DashboardPatient = {
  connection_id: string;
  patient_id: string;
  patient_name: string;
  connected_at: string | null;
  invite_code: string;
  recent_activity_at: string | null;
  weekly_summary_count: number;
  monthly_summary_count: number;
  engagement_score: number;
};

type PatientSummary = {
  id: string;
  summary_type: "weekly" | "monthly";
  created_at: string;
  period_start: string;
  period_end: string;
  viewed_at: string | null;
  summary_text: string;
};

type MessageKind = "update" | "task";

type InsightBreakdownItem = {
  emotion: string;
  percent: number;
};

type InsightPoint = {
  date: string;
  intensity: number;
  stress_level: number;
  outlook: number;
};

type InsightCard = {
  title: string;
  description: string;
  type: "pattern" | "trigger" | "positive" | "warning";
  emoji: string;
};

type SummaryInsight = {
  id: string;
  created_at: string;
  period_start: string;
  period_end: string;
  viewed_at: string | null;
  summary_text: string;
};

type PatientInsights = {
  weekly_summary: SummaryInsight | null;
  monthly_summary: SummaryInsight | null;
  emotion_breakdown: InsightBreakdownItem[];
  intensity_points: InsightPoint[];
  pattern_cards: InsightCard[];
  trend_summary: string;
  recent_mood_entries: number;
};

type InsightTab = "narrative" | "trends" | "monthly";

const insightColors = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

const insightCardStyles: Record<InsightCard["type"], { surface: string; badge: string }> = {
  pattern: { surface: "border-primary/20 bg-primary/5", badge: "bg-primary/10 text-primary" },
  trigger: { surface: "border-destructive/20 bg-destructive/5", badge: "bg-destructive/10 text-destructive" },
  positive: { surface: "border-secondary/20 bg-secondary/10", badge: "bg-secondary/15 text-secondary" },
  warning: { surface: "border-accent/20 bg-accent/10", badge: "bg-accent/15 text-accent-foreground" },
};

const trendChartConfig = {
  intensity: {
    label: "עוצמה",
    color: "hsl(var(--primary))",
  },
};

const formatDate = (value?: string | null, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("he-IL", options ?? { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(new Date(value));

const getEngagementVariant = (score: number) => {
  if (score >= 75) return "default" as const;
  if (score >= 40) return "secondary" as const;
  return "outline" as const;
};

const getEngagementLabel = (score: number) => {
  if (score >= 75) return "מעורבות גבוהה";
  if (score >= 40) return "מעורבות בינונית";
  return "מעורבות נמוכה";
};

const TherapistDashboard = () => {
  const navigate = useNavigate();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { settings: a11y, cycleFontSize } = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState<DashboardPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [summaries, setSummaries] = useState<PatientSummary[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [summaryFilter, setSummaryFilter] = useState<"all" | "weekly" | "monthly">("all");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteWhatsappUrl, setInviteWhatsappUrl] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageType, setMessageType] = useState<MessageKind>("update");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageLink, setMessageLink] = useState("");
  const [insightsTab, setInsightsTab] = useState<InsightTab>("narrative");
  const [patientInsights, setPatientInsights] = useState<PatientInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [accessState, setAccessState] = useState<AccessState | null>(null);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) keysToRemove.push(key);
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      navigate("/app/auth?mode=therapist", { replace: true });
    } catch {
      navigate("/app/auth?mode=therapist", { replace: true });
    }
  };

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.patient_id === selectedPatientId) ?? null,
    [patients, selectedPatientId],
  );

  const filteredSummaries = useMemo(() => {
    if (summaryFilter === "all") return summaries;
    return summaries.filter((summary) => summary.summary_type === summaryFilter);
  }, [summaries, summaryFilter]);

  const loadPatients = async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/app/auth?next=/app/professional/dashboard", { replace: true });
        return;
      }

        const ensuredAccessState = await ensureUserAccessProfile(session.user, "therapist");
        setAccessState(ensuredAccessState);

      const { data, error } = await (supabase as any).rpc("get_therapist_patients_dashboard");
      if (error) throw error;

      const nextPatients = (data ?? []) as DashboardPatient[];
      setPatients(nextPatients);

      if (nextPatients.length > 0) {
        setSelectedPatientId((current) => current || nextPatients[0].patient_id);
      } else {
        setSelectedPatientId("");
        setSummaries([]);
      }
    } catch (error: any) {
      toast({ title: "לא הצלחנו לטעון את הדאשבורד", description: error?.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSummaries = async (patientId: string) => {
    if (!patientId) {
      setSummaries([]);
      return;
    }

    setLoadingSummaries(true);
    try {
      const { data, error } = await (supabase as any).rpc("get_therapist_patient_summaries", {
        p_patient_id: patientId,
      });

      if (error) throw error;
      setSummaries((data ?? []) as PatientSummary[]);
    } catch (error: any) {
      toast({ title: "לא הצלחנו לטעון סיכומים", description: error?.message, variant: "destructive" });
    } finally {
      setLoadingSummaries(false);
    }
  };

  const loadPatientInsights = async (patientId: string) => {
    if (!patientId) {
      setPatientInsights(null);
      return;
    }

    setLoadingInsights(true);
    try {
      const { data, error } = await (supabase as any).rpc("get_therapist_patient_insights", {
        p_patient_id: patientId,
      });

      if (error) throw error;
      setPatientInsights((data ?? null) as PatientInsights | null);
    } catch (error: any) {
      toast({ title: "לא הצלחנו לטעון מגמות", description: error?.message, variant: "destructive" });
      setPatientInsights(null);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    void loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      void loadSummaries(selectedPatientId);
      void loadPatientInsights(selectedPatientId);
    }
  }, [selectedPatientId]);

  const emotionBreakdown = (patientInsights?.emotion_breakdown ?? []).map((item, index) => ({
    emotion: item.emotion,
    percent: item.percent,
    color: insightColors[index % insightColors.length],
  }));

  const intensitySeries = (patientInsights?.intensity_points ?? []).map((point) => ({
    ...point,
    shortDate: formatShortDate(point.date),
  }));

  const handleCreateInvite = async () => {
    setCreatingInvite(true);
    try {
      const { data, error } = await (supabase as any).rpc("create_therapist_invite");
      if (error) throw error;

      const inviteCode = Array.isArray(data) ? data[0]?.invite_code : data?.invite_code;
      if (!inviteCode) {
        throw new Error("לא נוצר קוד הזמנה חדש");
      }

      const link = buildReferralUrl(inviteCode);
      const whatsappMessage = `היי, זה קישור החיבור האישי שלך ל-Nest AI כדי שנוכל לעבוד יחד בין הפגישות:%0A${encodeURIComponent(link)}`;

      setInviteLink(link);
      setInviteWhatsappUrl(`https://wa.me/?text=${whatsappMessage}`);
      await navigator.clipboard.writeText(link);
      toast({ title: "נוצר קישור הזמנה חדש", description: "הקישור הועתק ללוח." });
      await loadPatients("refresh");
    } catch (error: any) {
      toast({ title: "שגיאה ביצירת הזמנה", description: error?.message, variant: "destructive" });
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    toast({ title: "הקישור הועתק שוב" });
  };

  const openComposer = (patientId?: string) => {
    if (patientId) setSelectedPatientId(patientId);
    setComposerOpen(true);
  };

  const handleSendMessage = async () => {
    if (!selectedPatientId || !messageTitle.trim() || !messageBody.trim()) {
      toast({ title: "חסרים פרטים", description: "יש למלא כותרת ותוכן הודעה.", variant: "destructive" });
      return;
    }

    setSendingMessage(true);
    try {
      const { error } = await (supabase as any).rpc("send_therapist_patient_message", {
        p_patient_id: selectedPatientId,
        p_title: messageTitle,
        p_body: messageBody,
        p_message_type: messageType,
        p_link: messageLink || null,
      });

      if (error) throw error;

      toast({
        title: messageType === "task" ? "המשימה נשלחה" : "העדכון נשלח",
        description: selectedPatient ? `נשלח אל ${selectedPatient.patient_name}` : undefined,
      });

      setComposerOpen(false);
      setMessageType("update");
      setMessageTitle("");
      setMessageBody("");
      setMessageLink("");
    } catch (error: any) {
      toast({ title: "לא הצלחנו לשלוח הודעה", description: error?.message, variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const totalEngagement = patients.length
    ? Math.round(patients.reduce((sum, patient) => sum + patient.engagement_score, 0) / patients.length)
    : 0;

  return (
    <div className="min-h-[100dvh] bg-background overflow-x-hidden" dir="rtl">
      {accessState?.is_locked && (
        <AccessLockOverlay
          accessState={accessState}
          onRequestSubmitted={async () => {
            const refreshed = await fetchMyAccessState();
            setAccessState(refreshed);
          }}
        />
      )}

      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-border/30">
          {/* Left: refresh */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => void loadPatients("refresh")} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
            </Button>
          </div>

          {/* Center: Logo */}
          <button onClick={() => navigate("/app/professional/dashboard")} className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <img src={nestLogo} alt="NestAI" className="h-8 w-auto" />
          </button>

          {/* Right: Hamburger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5 text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={toggleDark} className="cursor-pointer gap-2">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "מצב בהיר" : "מצב כהה"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={cycleFontSize} className="cursor-pointer gap-2">
                <Type className="h-4 w-4" />
                גודל גופן: {a11y.fontSize === "normal" ? "רגיל" : a11y.fontSize === "large" ? "גדול" : "גדול מאוד"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/app/settings")} className="cursor-pointer gap-2">
                <Settings className="h-4 w-4" />
                הגדרות
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/app/account-settings")} className="cursor-pointer gap-2">
                <User className="h-4 w-4" />
                החשבון שלי
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                התנתקות
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ height: "calc(env(safe-area-inset-top, 0px) + 56px)" }} />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8 pb-8">
        {/* Stats + Code section */}
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden border-border/60 bg-card/90 shadow-card">
            <CardHeader className="space-y-2 pb-3">
              <Badge variant="secondary" className="w-fit rounded-full text-xs">דאשבורד מטפלים</Badge>
              <CardTitle className="text-lg sm:text-xl">ניהול רצף טיפולי</CardTitle>
              <CardDescription className="text-sm">
                מעקב מרוכז אחרי מטופלים, סיכומים נרטיביים ושליחת משימות.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {accessState && <TrialStatusCard accessState={accessState} className="border-primary/10 bg-background/70 shadow-none" />}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">מטופלים</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">{loading ? "—" : patients.length}</div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">מעורבות</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">{loading ? "—" : `${totalEngagement}%`}</div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">סיכומים</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">
                    {loading ? "—" : patients.reduce((sum, patient) => sum + patient.weekly_summary_count + patient.monthly_summary_count, 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                קוד מטפל והזמנה
              </CardTitle>
              <CardDescription className="text-sm">קוד המטפל פעיל בהרשמת מטופלים.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="text-xs text-muted-foreground">קוד מטפל אישי</div>
                <div className="mt-2 text-3xl font-semibold tracking-[0.3em] text-foreground" dir="ltr">
                  {accessState?.therapist_code || "------"}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">מטופלים יזינו את הקוד הזה בהרשמה.</p>
              </div>
              <Button className="w-full rounded-full" onClick={handleCreateInvite} disabled={creatingInvite}>
                {creatingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                הזמנת מטופל חדש
              </Button>
              {inviteLink && (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground break-all">
                  {inviteLink}
                </div>
              )}
              {inviteLink && (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={handleCopyInvite}>
                    <Copy className="h-4 w-4" />
                    העתקה
                  </Button>
                  <Button size="sm" className="rounded-full" disabled={!inviteWhatsappUrl} onClick={() => window.open(inviteWhatsappUrl, "_blank", "noopener,noreferrer")}>
                    <MessageCircleMore className="h-4 w-4" />
                    וואטסאפ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Patients section */}
        <section className="space-y-5">
          <Card className="border-border/60 bg-card/90 shadow-card">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="text-lg">ניהול מטופלים</CardTitle>
                <CardDescription className="text-sm">מטופלים פעילים ומעורבות.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => openComposer()} disabled={!selectedPatientId}>
                <Plus className="h-4 w-4" />
                שליחת עדכון
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
              ) : patients.length === 0 ? (
                <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  עדיין אין מטופלים פעילים. צרו קישור הזמנה כדי להתחיל.
                </div>
              ) : (
                <div className="space-y-3">
                  {patients.map((patient) => (
                    <div
                      key={patient.connection_id}
                      className={`rounded-2xl border p-4 transition-colors ${
                        selectedPatientId === patient.patient_id
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-background hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="font-medium text-foreground truncate">{patient.patient_name}</div>
                          <div className="text-xs text-muted-foreground">חובר/ה ב-{formatDate(patient.connected_at, { dateStyle: "medium" })}</div>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Badge variant={getEngagementVariant(patient.engagement_score)} className="rounded-full text-xs">
                              {patient.engagement_score}% · {getEngagementLabel(patient.engagement_score)}
                            </Badge>
                            {patient.recent_activity_at && (
                              <span className="text-xs text-muted-foreground">
                                פעילות: {formatDate(patient.recent_activity_at, { dateStyle: "short" })}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="rounded-full shrink-0" onClick={() => openComposer(patient.patient_id)}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights card */}
          <Card className="border-border/60 bg-card/90 shadow-card">
            <CardHeader className="space-y-3 pb-3">
              <div>
                <CardTitle className="text-lg">סיכומים ומגמות</CardTitle>
                <CardDescription className="text-sm">בחר/י מטופל/ת כדי לצפות בסיכומים ומגמות.</CardDescription>
              </div>

              {patients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {patients.map((patient) => (
                    <Button
                      key={patient.patient_id}
                      variant={selectedPatientId === patient.patient_id ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => setSelectedPatientId(patient.patient_id)}
                    >
                      {patient.patient_name}
                    </Button>
                  ))}
                </div>
              )}

              {selectedPatient && (
                <div className="rounded-2xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium text-foreground">{selectedPatient.patient_name}</span>
                    <Badge variant="outline" className="rounded-full text-xs">{selectedPatient.engagement_score}% מעורבות</Badge>
                    <span className="inline-flex items-center gap-1 text-xs"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(selectedPatient.recent_activity_at, { dateStyle: "short" })}</span>
                    <span className="inline-flex items-center gap-1 text-xs"><CheckCircle2 className="h-3.5 w-3.5" /> {selectedPatient.weekly_summary_count + selectedPatient.monthly_summary_count} סיכומים</span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!selectedPatient ? (
                <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  בחר/י מטופל/ת מהכפתורים למעלה כדי לצפות בסיכומים.
                </div>
              ) : loadingSummaries || loadingInsights ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <Tabs value={insightsTab} onValueChange={(value) => setInsightsTab(value as InsightTab)}>
                  <TabsList className="grid w-full grid-cols-3 rounded-2xl">
                    <TabsTrigger value="narrative">סיכום נרטיבי</TabsTrigger>
                    <TabsTrigger value="trends">מגמות</TabsTrigger>
                    <TabsTrigger value="monthly">סיכום חודשי</TabsTrigger>
                  </TabsList>

                  <TabsContent value="narrative" className="mt-4 space-y-4">
                    {patientInsights?.weekly_summary ? (
                      <article className="rounded-3xl border border-border bg-background p-5 shadow-soft">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="rounded-full">סיכום שבועי</Badge>
                              <span className="text-xs text-muted-foreground">נוצר ב-{formatDate(patientInsights.weekly_summary.created_at)}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(patientInsights.weekly_summary.period_start, { dateStyle: "medium" })} — {formatDate(patientInsights.weekly_summary.period_end, { dateStyle: "medium" })}
                            </div>
                          </div>
                          <Badge variant="outline" className="rounded-full">
                            {patientInsights.weekly_summary.viewed_at ? "נצפה" : "טרם נצפה"}
                          </Badge>
                        </div>
                        <Separator className="my-4" />
                        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{patientInsights.weekly_summary.summary_text}</p>
                      </article>
                    ) : (
                      <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                        עדיין אין סיכום נרטיבי שבועי להצגה.
                      </div>
                    )}

                    <Card className="border-border/60 bg-card/80 shadow-soft">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <FileText className="h-4 w-4 text-primary" />
                          היסטוריית סיכומים
                        </CardTitle>
                        <CardDescription>גישה מהירה לכל הסיכומים השבועיים והחודשיים שנשמרו עבור המטופל/ת.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs value={summaryFilter} onValueChange={(value) => setSummaryFilter(value as "all" | "weekly" | "monthly")}>
                          <TabsList className="grid w-full grid-cols-3 rounded-2xl">
                            <TabsTrigger value="all">הכול</TabsTrigger>
                            <TabsTrigger value="weekly">שבועי</TabsTrigger>
                            <TabsTrigger value="monthly">חודשי</TabsTrigger>
                          </TabsList>
                          <TabsContent value={summaryFilter} className="mt-4 space-y-4">
                            {filteredSummaries.length === 0 ? (
                              <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                                עדיין אין סיכומים להצגה עבור המטופל/ת הזה.
                              </div>
                            ) : (
                              filteredSummaries.map((summary) => (
                                <article key={summary.id} className="rounded-3xl border border-border bg-background p-5 shadow-soft">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={summary.summary_type === "weekly" ? "secondary" : "default"} className="rounded-full">
                                          {summary.summary_type === "weekly" ? "סיכום שבועי" : "סיכום חודשי"}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">נוצר ב-{formatDate(summary.created_at)}</span>
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {formatDate(summary.period_start, { dateStyle: "medium" })} — {formatDate(summary.period_end, { dateStyle: "medium" })}
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="rounded-full">
                                      {summary.viewed_at ? "נצפה" : "טרם נצפה"}
                                    </Badge>
                                  </div>
                                  <Separator className="my-4" />
                                  <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{summary.summary_text}</p>
                                </article>
                              ))
                            )}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="trends" className="mt-4 space-y-4">
                    <Card className="border-secondary/20 bg-secondary/5 shadow-soft">
                      <CardContent className="flex items-start gap-3 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-secondary">מגמה כללית</p>
                          <p className="text-sm leading-7 text-foreground">{patientInsights?.trend_summary ?? "עדיין אין נתוני מגמות זמינים."}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {intensitySeries.length > 0 ? (
                      <Card className="overflow-hidden border-border/60 bg-card/90 shadow-soft">
                        <div className="h-1 bg-gradient-to-r from-secondary via-primary to-accent" />
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            עוצמה רגשית לאורך זמן
                          </CardTitle>
                          <CardDescription>מבוסס על שאלונים שבועיים ודיווחי מצב רוח של המטופל/ת.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer config={trendChartConfig} className="h-56 w-full">
                            <AreaChart data={intensitySeries} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="therapistIntensityGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                              <XAxis dataKey="shortDate" tickLine={false} axisLine={false} tickMargin={8} />
                              <YAxis domain={[0, 10]} tickLine={false} axisLine={false} width={30} />
                              <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent formatter={(value) => [Number(value).toFixed(1), "עוצמה"]} />}
                              />
                              <Area
                                type="monotone"
                                dataKey="intensity"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2.5}
                                fill="url(#therapistIntensityGradient)"
                                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                                activeDot={{ r: 5 }}
                              />
                            </AreaChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                        עדיין אין מספיק נתונים כדי להציג גרף מגמות.
                      </div>
                    )}

                    <EmotionStats breakdown={emotionBreakdown} />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">דפוסים שזוהו</h3>
                      </div>
                      {(patientInsights?.pattern_cards ?? []).map((card, index) => {
                        const style = insightCardStyles[card.type] ?? insightCardStyles.pattern;
                        return (
                          <article key={`${card.title}-${index}`} className={`rounded-2xl border p-4 shadow-soft ${style.surface}`}>
                            <div className="flex gap-3">
                              <span className="text-2xl" aria-hidden="true">{card.emoji}</span>
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-semibold text-foreground">{card.title}</h4>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.badge}`}>
                                    {card.type === "positive" ? "חיובי" : card.type === "trigger" ? "טריגר" : card.type === "warning" ? "שימו לב" : "דפוס"}
                                  </span>
                                </div>
                                <p className="text-xs leading-6 text-muted-foreground">{card.description}</p>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="monthly" className="mt-4 space-y-4">
                    {patientInsights?.monthly_summary ? (
                      <article className="rounded-3xl border border-border bg-background p-5 shadow-soft">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className="rounded-full">סיכום חודשי</Badge>
                              <span className="text-xs text-muted-foreground">נוצר ב-{formatDate(patientInsights.monthly_summary.created_at)}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(patientInsights.monthly_summary.period_start, { dateStyle: "medium" })} — {formatDate(patientInsights.monthly_summary.period_end, { dateStyle: "medium" })}
                            </div>
                          </div>
                          <Badge variant="outline" className="rounded-full">
                            {patientInsights.monthly_summary.viewed_at ? "נצפה" : "טרם נצפה"}
                          </Badge>
                        </div>
                        <Separator className="my-4" />
                        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{patientInsights.monthly_summary.summary_text}</p>
                      </article>
                    ) : (
                      <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                        עדיין אין סיכום חודשי להצגה עבור המטופל/ת הזה.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>שליחת משימות ועדכונים ידנית</DialogTitle>
            <DialogDescription>
              שולח/ת הודעה ישירות למרכז ההתראות של {selectedPatient?.patient_name ?? "המטופל/ת"}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>סוג ההודעה</Label>
              <Select value={messageType} onValueChange={(value) => setMessageType(value as MessageKind)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר/י סוג הודעה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update">עדכון</SelectItem>
                  <SelectItem value="task">משימה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message-title">כותרת</Label>
              <Input id="message-title" value={messageTitle} onChange={(e) => setMessageTitle(e.target.value)} placeholder="למשל: משימה קצרה לשבוע הקרוב" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message-body">תוכן</Label>
              <Textarea
                id="message-body"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="כתבו כאן את המשימה או העדכון שיישלחו למטופל/ת"
                className="min-h-[140px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message-link">קישור רלוונטי (אופציונלי)</Label>
              <Input id="message-link" value={messageLink} onChange={(e) => setMessageLink(e.target.value)} placeholder="https://..." dir="ltr" />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start sm:space-x-0">
            <Button className="rounded-full" onClick={handleSendMessage} disabled={sendingMessage}>
              {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              שליחה למטופל/ת
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setComposerOpen(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TherapistDashboard;