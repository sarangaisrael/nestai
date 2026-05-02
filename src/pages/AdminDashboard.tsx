import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useSiteContent } from "@/contexts/SiteContentContext";
import { useFeatureToggles } from "@/contexts/FeatureToggleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2, Save, X, Trash2, Plus,
  ArrowRight, Pencil, CheckCircle2,
  Globe, FolderOpen, Bot, Palette, Shield,
  Music, Users, Search, ToggleLeft,
  MessageSquare, FileText, Bell, BarChart3,
  Copy, Send, Clock, Phone, Stethoscope, UserCheck, UserX,
} from "lucide-react";
import { format } from "date-fns";
import ContentInsights from "@/components/admin/ContentInsights";
import AdminFeedbackTab from "@/components/admin/AdminFeedbackTab";
import LandingBlockManager from "@/components/admin/LandingBlockManager";
import LandingContentEditor from "@/components/admin/LandingContentEditor";

/* ── Types ─────────────────────────────────── */
interface AdminUser {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  first_name?: string | null;
}
interface SystemMessage { id: string; title: string; body: string; created_at: string; }
interface FeatureToggleRow { id: string; key: string; label: string; enabled: boolean; category: string; config: Record<string, any>; }
interface MeditationRow { id: string; title: string; description: string; media_url: string; media_type: string; tags: string[]; published: boolean; sort_order: number; }
interface TherapistRegistrationRow {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  specialization: string;
  years_of_experience: number;
  license_number: string | null;
  status: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

interface AccessControlRow {
  user_id: string;
  role: "therapist" | "patient";
  registration_date: string;
  trial_ends_at: string;
  payment_status: "trial" | "active" | "locked";
  linked_therapist_id: string | null;
  therapist_code: string | null;
  updated_at: string;
}

interface PaymentRequestRow {
  id: string;
  user_id: string;
  role: "therapist" | "patient";
  linked_therapist_id: string | null;
  amount_ils: number;
  payment_provider: string;
  contact_email: string;
  contact_name: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

/* ── Landing‑page field mapping ────────────── */
const LANDING_FIELDS: { key: string; label: string; multiline?: boolean; group?: string }[] = [
  // Hero
  { key: "hero_title", label: "כותרת ראשית (Hero)", group: "🏠 Hero" },
  { key: "hero_highlight1", label: "הדגשה 1 (צבעונית)", group: "🏠 Hero" },
  { key: "hero_highlight2", label: "הדגשה 2 (צבעונית)", group: "🏠 Hero" },
  { key: "hero_subtitle", label: "טקסט משנה (Hero)", multiline: true, group: "🏠 Hero" },
  // Why section
  { key: "why_badge", label: "תגית (Badge)", group: "❓ למה צריך את זה" },
  { key: "why_title", label: "כותרת", group: "❓ למה צריך את זה" },
  { key: "why_description", label: "תיאור", multiline: true, group: "❓ למה צריך את זה" },
  // Features
  { key: "features_badge", label: "תגית (Badge)", group: "✨ פיצ׳רים" },
  { key: "features_title", label: "כותרת בלוק הפיצ׳רים", group: "✨ פיצ׳רים" },
  { key: "feature1_title", label: "פיצ׳ר 1 — כותרת", group: "✨ פיצ׳רים" },
  { key: "feature1_desc", label: "פיצ׳ר 1 — תיאור", multiline: true, group: "✨ פיצ׳רים" },
  { key: "feature2_title", label: "פיצ׳ר 2 — כותרת", group: "✨ פיצ׳רים" },
  { key: "feature2_desc", label: "פיצ׳ר 2 — תיאור", multiline: true, group: "✨ פיצ׳רים" },
  { key: "feature3_title", label: "פיצ׳ר 3 — כותרת", group: "✨ פיצ׳רים" },
  { key: "feature3_desc", label: "פיצ׳ר 3 — תיאור", multiline: true, group: "✨ פיצ׳רים" },
  { key: "feature4_title", label: "פיצ׳ר 4 — כותרת", group: "✨ פיצ׳רים" },
  { key: "feature4_desc", label: "פיצ׳ר 4 — תיאור", multiline: true, group: "✨ פיצ׳רים" },
  // Therapist
  { key: "therapist_title", label: "כותרת", group: "👩‍⚕️ מטפלים" },
  { key: "therapist_desc", label: "תיאור", multiline: true, group: "👩‍⚕️ מטפלים" },
  // Privacy
  { key: "privacy_title", label: "כותרת", group: "🔒 פרטיות" },
  { key: "privacy_desc", label: "תיאור", multiline: true, group: "🔒 פרטיות" },
  // Media
  { key: "media_badge", label: "תגית (Badge)", group: "📰 תקשורת" },
  { key: "media_headline", label: "כותרת", group: "📰 תקשורת" },
  { key: "media_subheadline", label: "טקסט", multiline: true, group: "📰 תקשורת" },
  { key: "media_quote", label: "ציטוט", multiline: true, group: "📰 תקשורת" },
  { key: "media_button", label: "טקסט כפתור", group: "📰 תקשורת" },
  // CTA
  { key: "cta_title", label: "כותרת CTA סופי", group: "🚀 קריאה לפעולה" },
];

/* ── Therapist landing‑page field mapping ────────────── */
const THERAPIST_LANDING_FIELDS: { key: string; label: string; multiline?: boolean; group?: string }[] = [
  // Hero
  { key: "tp_hero_badge", label: "תגית Hero", group: "🏠 Hero" },
  { key: "tp_hero_title", label: "כותרת ראשית", group: "🏠 Hero" },
  { key: "tp_hero_highlight", label: "הדגשה צבעונית", group: "🏠 Hero" },
  { key: "tp_hero_subtitle", label: "טקסט משנה", multiline: true, group: "🏠 Hero" },
  // Why
  { key: "tp_why_badge", label: "תגית", group: "❓ למה צריך" },
  { key: "tp_why_title", label: "כותרת", group: "❓ למה צריך" },
  { key: "tp_why_description", label: "תיאור", multiline: true, group: "❓ למה צריך" },
  // Problem / Solution
  { key: "tp_problem_title", label: "כותרת אתגר", group: "⚡ אתגר ופתרון" },
  { key: "tp_problem_body", label: "תיאור אתגר", multiline: true, group: "⚡ אתגר ופתרון" },
  { key: "tp_solution_title", label: "כותרת פתרון", group: "⚡ אתגר ופתרון" },
  { key: "tp_solution_body", label: "תיאור פתרון", multiline: true, group: "⚡ אתגר ופתרון" },
  // Features
  { key: "tp_features_badge", label: "תגית", group: "✨ פיצ׳רים" },
  { key: "tp_features_title", label: "כותרת", group: "✨ פיצ׳רים" },
  { key: "tp_feature1_title", label: "פיצ׳ר 1 — כותרת", group: "✨ פיצ׳רים" },
  { key: "tp_feature1_desc", label: "פיצ׳ר 1 — תיאור", multiline: true, group: "✨ פיצ׳רים" },
  { key: "tp_feature2_title", label: "פיצ׳ר 2 — כותרת", group: "✨ פיצ׳רים" },
  { key: "tp_feature2_desc", label: "פיצ׳ר 2 — תיאור", multiline: true, group: "✨ פיצ׳רים" },
  { key: "tp_feature3_title", label: "פיצ׳ר 3 — כותרת", group: "✨ פיצ׳רים" },
  { key: "tp_feature3_desc", label: "פיצ׳ר 3 — תיאור", multiline: true, group: "✨ פיצ׳רים" },
  { key: "tp_feature4_title", label: "פיצ׳ר 4 — כותרת", group: "✨ פיצ׳רים" },
  { key: "tp_feature4_desc", label: "פיצ׳ר 4 — תיאור", multiline: true, group: "✨ פיצ׳רים" },
  // CTA
  { key: "tp_cta_title", label: "כותרת CTA סופי", group: "🚀 קריאה לפעולה" },
];

/* ── Component ─────────────────────────────── */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const { toast } = useToast();
  const { refresh: refreshSiteContent } = useSiteContent();
  const { refresh: refreshToggles } = useFeatureToggles();

  // ── Shared state ──
  const [loadingData, setLoadingData] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Stats ──
  const [stats, setStats] = useState({ users: 0, messages: 0, weeklySummaries: 0, monthlySummaries: 0, pushSubs: 0 });

  // ── System messages map (key→{id,body}) ──
  const [sysMap, setSysMap] = useState<Record<string, { id: string; body: string }>>({});

  // ── Landing page local edits ──
  const [landingEdits, setLandingEdits] = useState<Record<string, string>>({});
  const [savingLanding, setSavingLanding] = useState<Record<string, boolean>>({});

  // ── Therapist landing page local edits ──
  const [therapistEdits, setTherapistEdits] = useState<Record<string, string>>({});
  const [savingTherapist, setSavingTherapist] = useState<Record<string, boolean>>({});

  // ── Content: Meditations ──
  const [meditationsList, setMeditationsList] = useState<MeditationRow[]>([]);
  const [showNewMeditation, setShowNewMeditation] = useState(false);
  const [newMedTitle, setNewMedTitle] = useState("");
  const [newMedDesc, setNewMedDesc] = useState("");
  const [newMedUrl, setNewMedUrl] = useState("");
  const [newMedType, setNewMedType] = useState<"youtube" | "audio">("youtube");
  const [newMedTags, setNewMedTags] = useState("");
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [editMedTitle, setEditMedTitle] = useState("");
  const [editMedDesc, setEditMedDesc] = useState("");
  const [editMedUrl, setEditMedUrl] = useState("");
  const [editMedType, setEditMedType] = useState<"youtube" | "audio">("youtube");
  const [editMedTags, setEditMedTags] = useState("");

  // ── Content: Feature toggles ──
  const [toggles, setToggles] = useState<FeatureToggleRow[]>([]);
  const [showNewToggle, setShowNewToggle] = useState(false);
  const [newToggleKey, setNewToggleKey] = useState("");
  const [newToggleLabel, setNewToggleLabel] = useState("");
  const [newToggleCategory, setNewToggleCategory] = useState<"nav" | "feature">("feature");
  const [newToggleUrl, setNewToggleUrl] = useState("");

  // ── AI ──
  const [summaryPrompt, setSummaryPrompt] = useState("");
  const [monthlySummaryPrompt, setMonthlySummaryPrompt] = useState("");
  const [multiMonthPrompt, setMultiMonthPrompt] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");
  const [appInstructions, setAppInstructions] = useState("");
  const [savingAi, setSavingAi] = useState<string | null>(null);

  // ── Regenerate ──
  const [regenUserId, setRegenUserId] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [regenLog, setRegenLog] = useState<string[]>([]);

  // ── Security: Users ──
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // ── Security: Therapist approvals ──
  const [therapistRegistrations, setTherapistRegistrations] = useState<TherapistRegistrationRow[]>([]);
  const [therapistSearch, setTherapistSearch] = useState("");
  const [reviewingRegistrationId, setReviewingRegistrationId] = useState<string | null>(null);
  const [accessRows, setAccessRows] = useState<AccessControlRow[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestRow[]>([]);
  const [accessSearch, setAccessSearch] = useState("");
  const [updatingAccessUserId, setUpdatingAccessUserId] = useState<string | null>(null);

  // ── Security: Admin password ──
  const [adminPw, setAdminPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // ── Notifications ──
  const [pushMessage, setPushMessage] = useState("");
  const [pushTitle, setPushTitle] = useState("NestAI");
  const [sendingPush, setSendingPush] = useState(false);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [dailyReminderTime, setDailyReminderTime] = useState("20:00");
  const [savingNotifSettings, setSavingNotifSettings] = useState(false);

  // ── Professional Leads ──
  const [professionalLeads, setProfessionalLeads] = useState<{ id: string; email: string; phone: string | null; created_at: string }[]>([]);

  /* ── Auth guard ── */
  useEffect(() => { if (!adminLoading && !isAdmin) navigate("/app/chat"); }, [adminLoading, isAdmin, navigate]);
  useEffect(() => { if (isAdmin) loadAllData(); }, [isAdmin]);

  const showSaveSuccess = () => { setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2500); };
  const formatDate = (d: string | null) => d ? format(new Date(d), "dd/MM/yyyy HH:mm") : "—";

  /* ── Loaders ────────────────────────────── */
  const loadAllData = async () => {
    setLoadingData(true);
    const [,,,usersResult] = await Promise.all([
      loadMessages(),
      loadToggles(),
      loadMeditations(),
      loadUsersAndReturn(),
      loadStatsFromDb(),
      loadProfessionalLeads(),
      loadTherapistRegistrations(),
        loadAccessControlData(),
    ]);
    // Update user count after users loaded
    setStats(prev => ({ ...prev, users: usersResult?.length ?? 0 }));
    setLoadingData(false);
  };

  const loadTherapistRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("therapist_registrations")
        .select("id, user_id, email, full_name, specialization, years_of_experience, license_number, status, created_at, reviewed_at, reviewed_by")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTherapistRegistrations((data ?? []) as TherapistRegistrationRow[]);
    } catch (e) {
      console.error("loadTherapistRegistrations", e);
    }
  };

  const loadProfessionalLeads = async () => {
    try {
      const { data, error } = await supabase.from("professional_leads" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setProfessionalLeads((data as any) || []);
    } catch (e) { console.error("loadProfessionalLeads", e); }
  };

  const loadAccessControlData = async () => {
    try {
      const [{ data: accessData, error: accessError }, { data: paymentData, error: paymentError }] = await Promise.all([
        supabase
          .from("user_access_statuses" as any)
          .select("user_id, role, registration_date, trial_ends_at, payment_status, linked_therapist_id, therapist_code, updated_at")
          .order("updated_at", { ascending: false }),
        supabase
          .from("payment_requests" as any)
          .select("id, user_id, role, linked_therapist_id, amount_ils, payment_provider, contact_email, contact_name, message, status, created_at, updated_at")
          .order("created_at", { ascending: false }),
      ]);

      if (accessError) throw accessError;
      if (paymentError) throw paymentError;

      setAccessRows((accessData as any) ?? []);
      setPaymentRequests((paymentData as any) ?? []);
    } catch (error) {
      console.error("loadAccessControlData", error);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const { error } = await supabase.from("professional_leads" as any).delete().eq("id", id);
      if (error) throw error;
      setProfessionalLeads(prev => prev.filter(l => l.id !== id));
      toast({ title: "✓ נמחק" });
    } catch { toast({ title: "שגיאה", variant: "destructive" }); }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase.from("system_messages").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      const map: Record<string, { id: string; body: string }> = {};
      (data || []).forEach((r) => { map[r.title] = { id: r.id, body: r.body }; });
      setSysMap(map);
      // Seed landing edits
      const le: Record<string, string> = {};
      LANDING_FIELDS.forEach((f) => { le[f.key] = map[f.key]?.body ?? ""; });
      setLandingEdits(le);
      // Seed therapist landing edits
      const te: Record<string, string> = {};
      THERAPIST_LANDING_FIELDS.forEach((f) => { te[f.key] = map[f.key]?.body ?? ""; });
      setTherapistEdits(te);
      // Seed AI fields
      setSummaryPrompt(map["summary_system_prompt"]?.body ?? "");
      setMonthlySummaryPrompt(map["monthly_summary_prompt"]?.body ?? "");
      setMultiMonthPrompt(map["multi_month_prompt"]?.body ?? "");
      setAiInstruction(map["ai_site_instruction"]?.body ?? "");
      setAppInstructions(map["app_instructions"]?.body ?? "");
      // Notification settings
      try {
        const notifSettings = map["daily_push_settings"]?.body ? JSON.parse(map["daily_push_settings"].body) : {};
        setDailyReminderEnabled(notifSettings.enabled !== false);
        setDailyReminderTime(notifSettings.time ?? "20:00");
      } catch { /* use defaults */ }
    } catch (e) { console.error("loadMessages", e); }
  };

  const loadToggles = async () => {
    try {
      const { data, error } = await supabase.from("feature_toggles").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      setToggles((data || []).map((r: any) => ({ ...r, config: r.config || {} })));
    } catch (e) { console.error(e); }
  };

  const loadMeditations = async () => {
    try {
      const { data, error } = await supabase.from("meditations").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      setMeditationsList((data || []) as MeditationRow[]);
    } catch (e) { console.error(e); }
  };

  const loadUsers = async () => {
    const result = await loadUsersAndReturn();
    return result;
  };

  const loadUsersAndReturn = async (): Promise<AdminUser[]> => {
    try {
      const { data: authUsers, error } = await supabase.rpc("get_admin_all_users");
      if (error) throw error;
      const userIds = (authUsers || []).map((u: any) => u.user_id);
      let profilesMap: Record<string, string | null> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, first_name").in("user_id", userIds);
        (profiles || []).forEach((p) => { profilesMap[p.user_id] = p.first_name; });
      }
      const mapped = (authUsers || []).map((u: any) => ({ ...u, first_name: profilesMap[u.user_id] || null }));
      setUsers(mapped);
      return mapped;
    } catch (e) { console.error(e); return []; }
  };

  const loadStatsFromDb = async () => {
    try {
      const [msgRes, weeklyRes, monthlyRes, pushRes] = await Promise.all([
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("weekly_summaries").select("id", { count: "exact", head: true }),
        supabase.from("monthly_summaries").select("id", { count: "exact", head: true }),
        supabase.rpc("get_admin_push_subscription_count"),
      ]);
      setStats(prev => ({
        ...prev,
        messages: msgRes.count ?? 0,
        weeklySummaries: weeklyRes.count ?? 0,
        monthlySummaries: monthlyRes.count ?? 0,
        pushSubs: typeof pushRes.data === "number" ? pushRes.data : 0,
      }));
    } catch (e) { console.error("loadStats", e); }
  };

  /* ── Upsert helper for system_messages ── */
  const upsertSysMsg = async (key: string, body: string) => {
    const existing = sysMap[key];
    if (existing) {
      const { error } = await supabase.from("system_messages").update({ body }).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("system_messages").insert({ title: key, body });
      if (error) throw error;
    }
  };

  /* ── TAB 1: Landing page saves ── */
  const handleSaveLandingField = async (key: string) => {
    setSavingLanding((p) => ({ ...p, [key]: true }));
    try {
      await upsertSysMsg(key, landingEdits[key] ?? "");
      toast({ title: "✓ נשמר בהצלחה" });
      showSaveSuccess();
      refreshSiteContent();
      await loadMessages();
    } catch { toast({ title: "שגיאה בשמירה", variant: "destructive" }); }
    finally { setSavingLanding((p) => ({ ...p, [key]: false })); }
  };

  /* ── Therapist landing page saves ── */
  const handleSaveTherapistField = async (key: string) => {
    setSavingTherapist((p) => ({ ...p, [key]: true }));
    try {
      await upsertSysMsg(key, therapistEdits[key] ?? "");
      toast({ title: "✓ נשמר בהצלחה" });
      showSaveSuccess();
      refreshSiteContent();
      await loadMessages();
    } catch { toast({ title: "שגיאה בשמירה", variant: "destructive" }); }
    finally { setSavingTherapist((p) => ({ ...p, [key]: false })); }
  };

  /* ── TAB 2: Meditations ── */
  const handleToggleMedPublished = async (med: MeditationRow) => {
    try {
      const { error } = await supabase.from("meditations").update({ published: !med.published }).eq("id", med.id);
      if (error) throw error;
      setMeditationsList((prev) => prev.map((m) => m.id === med.id ? { ...m, published: !m.published } : m));
      toast({ title: `✓ ${!med.published ? "פורסם" : "הועבר לטיוטה"}` });
      showSaveSuccess();
    } catch { toast({ title: "שגיאה", variant: "destructive" }); }
  };

  const handleCreateMeditation = async () => {
    if (!newMedTitle.trim() || !newMedUrl.trim()) return;
    try {
      const tags = newMedTags.split(",").map((t) => t.trim()).filter(Boolean);
      const { error } = await supabase.from("meditations").insert({ title: newMedTitle.trim(), description: newMedDesc.trim(), media_url: newMedUrl.trim(), media_type: newMedType, tags, published: false, sort_order: meditationsList.length + 1 });
      if (error) throw error;
      toast({ title: "✓ מדיטציה נוצרה" }); showSaveSuccess();
      setNewMedTitle(""); setNewMedDesc(""); setNewMedUrl(""); setNewMedTags(""); setShowNewMeditation(false);
      loadMeditations();
    } catch { toast({ title: "שגיאה", variant: "destructive" }); }
  };

  const handleSaveMeditation = async (id: string) => {
    try {
      const tags = editMedTags.split(",").map((t) => t.trim()).filter(Boolean);
      const { error } = await supabase.from("meditations").update({ title: editMedTitle.trim(), description: editMedDesc.trim(), media_url: editMedUrl.trim(), media_type: editMedType, tags }).eq("id", id);
      if (error) throw error;
      toast({ title: "✓ עודכן" }); showSaveSuccess(); setEditingMedId(null); loadMeditations();
    } catch { toast({ title: "שגיאה", variant: "destructive" }); }
  };

  const handleDeleteMeditation = async (id: string) => {
    try { const { error } = await supabase.from("meditations").delete().eq("id", id); if (error) throw error; toast({ title: "✓ נמחק" }); loadMeditations(); }
    catch { toast({ title: "שגיאה", variant: "destructive" }); }
  };

  /* ── TAB 2: Toggles ── */
  const handleToggleEnabled = async (toggle: FeatureToggleRow) => {
    try {
      const { error } = await supabase.from("feature_toggles").update({ enabled: !toggle.enabled }).eq("id", toggle.id);
      if (error) throw error;
      setToggles((prev) => prev.map((t) => t.id === toggle.id ? { ...t, enabled: !t.enabled } : t));
      toast({ title: `✓ ${toggle.label} ${!toggle.enabled ? "הופעל" : "הושבת"}` }); showSaveSuccess(); refreshToggles();
    } catch { toast({ title: "שגיאה", variant: "destructive" }); }
  };

  const handleCreateToggle = async () => {
    if (!newToggleKey.trim() || !newToggleLabel.trim()) return;
    try {
      const config: Record<string, any> = {};
      if (newToggleCategory === "nav" && newToggleUrl.trim()) { config.url = newToggleUrl.trim(); config.order = toggles.filter((t) => t.category === "nav").length + 1; }
      const { error } = await supabase.from("feature_toggles").insert({ key: newToggleKey.trim(), label: newToggleLabel.trim(), category: newToggleCategory, enabled: true, config });
      if (error) throw error;
      toast({ title: "✓ נוצר" }); showSaveSuccess(); setNewToggleKey(""); setNewToggleLabel(""); setNewToggleUrl(""); setShowNewToggle(false); loadToggles(); refreshToggles();
    } catch { toast({ title: "שגיאה", variant: "destructive" }); }
  };

  const handleDeleteToggle = async (id: string) => {
    try { const { error } = await supabase.from("feature_toggles").delete().eq("id", id); if (error) throw error; toast({ title: "✓ נמחק" }); loadToggles(); refreshToggles(); }
    catch { toast({ title: "שגיאה", variant: "destructive" }); }
  };

  /* ── TAB 3: AI saves ── */
  const handleSaveAiField = async (key: string, value: string, label: string) => {
    setSavingAi(key);
    try {
      await upsertSysMsg(key, value);
      toast({ title: `✓ ${label} עודכן` }); showSaveSuccess(); refreshSiteContent(); await loadMessages();
    } catch { toast({ title: "שגיאה", variant: "destructive" }); }
    finally { setSavingAi(null); }
  };

  /* ── Regenerate all summaries for a user ── */
  const handleRegenerateAll = async () => {
    if (!regenUserId) return;
    setRegenerating(true);
    setRegenLog([]);
    const log = (msg: string) => setRegenLog((prev) => [...prev, msg]);

    try {
      // Fetch weekly summaries for this user (service role via edge function)
      const { data: weeklies } = await supabase
        .from("weekly_summaries")
        .select("id")
        .eq("user_id", regenUserId)
        .order("week_start", { ascending: false })
        .limit(10);

      const { data: monthlies } = await supabase
        .from("monthly_summaries")
        .select("id")
        .eq("user_id", regenUserId)
        .order("month_start", { ascending: false })
        .limit(5);

      const weeklyIds = weeklies || [];
      const monthlyIds = monthlies || [];

      if (weeklyIds.length === 0 && monthlyIds.length === 0) {
        log("⚠️ לא נמצאו סיכומים למשתמש זה.");
        setRegenerating(false);
        return;
      }

      log(`🔄 נמצאו ${weeklyIds.length} סיכומים שבועיים ו-${monthlyIds.length} חודשיים`);

      for (const s of weeklyIds) {
        log(`⏳ מחדש סיכום שבועי...`);
        const { error } = await supabase.functions.invoke("regenerate-summary", {
          body: { type: "weekly", summary_id: s.id },
        });
        if (error) { log(`❌ שגיאה: ${error.message}`); } else { log(`✅ סיכום שבועי עודכן`); }
      }

      for (const s of monthlyIds) {
        log(`⏳ מחדש סיכום חודשי...`);
        const { error } = await supabase.functions.invoke("regenerate-summary", {
          body: { type: "monthly", summary_id: s.id },
        });
        if (error) { log(`❌ שגיאה: ${error.message}`); } else { log(`✅ סיכום חודשי עודכן`); }
      }

      log("🎉 הרענון הושלם!");
      toast({ title: "✓ כל הסיכומים רועננו בהצלחה" });
    } catch (e: any) {
      log(`❌ שגיאה כללית: ${e?.message}`);
      toast({ title: "שגיאה ברענון", variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  /* ── TAB 4: Design — theme toggle via app_instructions directive ── */
  const currentTheme = (() => {
    const m = appInstructions.match(/\[THEME:\s*(\w+)\]/i);
    return m ? m[1].toUpperCase() : "AUTO";
  })();

  const setThemeDirective = async (mode: "DARK" | "LIGHT" | "AUTO") => {
    let updated = appInstructions.replace(/\[THEME:\s*\w+\]/gi, "").trim();
    if (mode !== "AUTO") updated = `[THEME: ${mode}]\n${updated}`;
    setAppInstructions(updated);
    await handleSaveAiField("app_instructions", updated, "ערכת נושא");
  };

  /* ── TAB 5: Admin password ── */
  const handleSaveAdminPassword = async () => {
    if (!adminPw.trim()) return;
    setSavingPw(true);
    try {
      await upsertSysMsg("admin_password", adminPw.trim());
      toast({ title: "✓ סיסמת אדמין עודכנה" }); showSaveSuccess(); setAdminPw(""); refreshSiteContent(); await loadMessages();
    } catch { toast({ title: "שגיאה", variant: "destructive" }); }
    finally { setSavingPw(false); }
  };

  const handleReviewTherapist = async (registrationId: string, approve: boolean) => {
    setReviewingRegistrationId(registrationId);
    try {
      const { data, error } = await (supabase as any).rpc("admin_review_therapist_registration", {
        p_registration_id: registrationId,
        p_approve: approve,
      });

      if (error) throw error;

      const reviewed = Array.isArray(data) ? data[0] : data;

      setTherapistRegistrations((prev) => prev.map((registration) => (
        registration.id === registrationId
          ? {
              ...registration,
              status: reviewed?.status ?? (approve ? "approved" : "rejected"),
              reviewed_at: reviewed?.reviewed_at ?? new Date().toISOString(),
              reviewed_by: reviewed?.reviewed_by ?? registration.reviewed_by,
            }
          : registration
      )));

      toast({ title: approve ? "✓ המטפל/ת אושר/ה" : "✓ הבקשה נדחתה" });
      showSaveSuccess();
    } catch (error: any) {
      toast({
        title: "שגיאה בעדכון הבקשה",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setReviewingRegistrationId(null);
    }
  };

  const handleSetUserPaymentStatus = async (userId: string, nextStatus: "trial" | "active" | "locked") => {
    setUpdatingAccessUserId(userId);
    try {
      const { data, error } = await (supabase as any).rpc("admin_set_user_payment_status", {
        p_user_id: userId,
        p_payment_status: nextStatus,
      });

      if (error) throw error;

      const updated = Array.isArray(data) ? data[0] : data;
      setAccessRows((prev) => prev.map((row) => (
        row.user_id === userId
          ? { ...row, payment_status: updated?.payment_status ?? nextStatus, updated_at: updated?.updated_at ?? new Date().toISOString() }
          : row
      )));
      toast({ title: "✓ סטטוס גישה עודכן" });
      await loadAccessControlData();
    } catch (error: any) {
      toast({ title: "שגיאה בעדכון סטטוס", description: error?.message, variant: "destructive" });
    } finally {
      setUpdatingAccessUserId(null);
    }
  };

  /* ── Notifications ── */
  const handleSendPushNow = async () => {
    if (!pushMessage.trim()) return;
    setSendingPush(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push-to-all", {
        body: { title: pushTitle.trim() || "NestAI", body: pushMessage.trim(), url: "/" },
      });
      if (error) throw error;
      toast({ title: `✓ נשלח ל-${data?.sent ?? 0} משתמשים` });
      showSaveSuccess();
      setPushMessage("");
    } catch (e: any) {
      toast({ title: "שגיאה בשליחה", description: e?.message, variant: "destructive" });
    } finally {
      setSendingPush(false);
    }
  };

  const handleSaveNotifSettings = async () => {
    setSavingNotifSettings(true);
    try {
      const settings = JSON.stringify({ enabled: dailyReminderEnabled, time: dailyReminderTime });
      await upsertSysMsg("daily_push_settings", settings);
      toast({ title: "✓ הגדרות התראות נשמרו" });
      showSaveSuccess();
      await loadMessages();
    } catch {
      toast({ title: "שגיאה בשמירה", variant: "destructive" });
    } finally {
      setSavingNotifSettings(false);
    }
  };

  /* ── Derived ── */
  const filteredUsers = users.filter((u) => u.email?.toLowerCase().includes(userSearch.toLowerCase()) || u.first_name?.toLowerCase().includes(userSearch.toLowerCase()));
  const normalizedAccessSearch = accessSearch.trim().toLowerCase();
  const normalizedTherapistSearch = therapistSearch.trim().toLowerCase();
  const filteredTherapistRegistrations = therapistRegistrations.filter((registration) => {
    if (!normalizedTherapistSearch) return true;
    return [registration.full_name, registration.email, registration.specialization, registration.license_number ?? ""]
      .some((value) => value.toLowerCase().includes(normalizedTherapistSearch));
  });
  const pendingTherapistCount = therapistRegistrations.filter((registration) => (registration.status ?? "pending") === "pending").length;
  const filteredAccessRows = accessRows.filter((row) => {
    if (!normalizedAccessSearch) return true;
    return [row.user_id, row.role, row.payment_status, row.therapist_code ?? "", row.linked_therapist_id ?? ""]
      .some((value) => value.toLowerCase().includes(normalizedAccessSearch));
  });
  const pendingPaymentRequestCount = paymentRequests.filter((request) => request.status === "pending").length;

  const getTherapistStatusLabel = (status: string | null) => {
    switch (status) {
      case "approved":
        return "אושר";
      case "rejected":
        return "נדחה";
      default:
        return "ממתין";
    }
  };

  const getTherapistStatusClassName = (status: string | null) => {
    switch (status) {
      case "approved":
        return "bg-secondary/15 text-secondary";
      case "rejected":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  /* ── Loading / guard ── */
  if (adminLoading || loadingData) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return null;

  /* ── Render ──────────────────────────────── */
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Success toast overlay */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in">
          <div className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium text-sm">נשמר בהצלחה!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 glass-card border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">לוח בקרה</h1>
            <p className="text-xs text-muted-foreground">NestAI — מרכז ניהול</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2 tech-border" onClick={() => navigate("/app/chat")}>
          <ArrowRight className="h-4 w-4" />
          חזרה לאפליקציה
        </Button>
      </header>

      {/* Stats Overview */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "משתמשים", value: stats.users, icon: Users, gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
            { label: "הודעות", value: stats.messages, icon: MessageSquare, gradient: "from-secondary/20 to-secondary/5", iconColor: "text-secondary" },
            { label: "סיכומים שבועיים", value: stats.weeklySummaries, icon: FileText, gradient: "from-accent/20 to-accent/5", iconColor: "text-accent" },
            { label: "סיכומים חודשיים", value: stats.monthlySummaries, icon: BarChart3, gradient: "from-primary/15 to-accent/5", iconColor: "text-primary" },
            { label: "נרשמו להתראות", value: stats.pushSubs, icon: Bell, gradient: "from-secondary/15 to-primary/5", iconColor: "text-secondary" },
          ].map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden glass-card tech-border hover:tech-glow transition-all duration-300 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-60`} />
              <div className="relative p-4 flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-card/80 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <span className="text-2xl font-bold text-foreground tabular-nums">{stat.value.toLocaleString()}</span>
                <span className="text-[11px] text-muted-foreground text-center font-medium">{stat.label}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="landing" className="space-y-6">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-xl">
            <TabsTrigger value="landing" className="gap-1.5 text-xs sm:text-sm"><Globe className="h-4 w-4" />עמוד הנחיתה</TabsTrigger>
            <TabsTrigger value="therapist-landing" className="gap-1.5 text-xs sm:text-sm"><Stethoscope className="h-4 w-4" />עמוד מטפלים</TabsTrigger>
            <TabsTrigger value="content" className="gap-1.5 text-xs sm:text-sm"><FolderOpen className="h-4 w-4" />ניהול תוכן</TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5 text-xs sm:text-sm"><Bot className="h-4 w-4" />מנוע AI</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm"><Bell className="h-4 w-4" />ניהול התראות</TabsTrigger>
            <TabsTrigger value="design" className="gap-1.5 text-xs sm:text-sm"><Palette className="h-4 w-4" />עיצוב ונראות</TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm"><Shield className="h-4 w-4" />אבטחה</TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5 text-xs sm:text-sm"><Clock className="h-4 w-4" />גישה ותשלום</TabsTrigger>
            <TabsTrigger value="therapists" className="gap-1.5 text-xs sm:text-sm"><Stethoscope className="h-4 w-4" />אישור מטפלים</TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5 text-xs sm:text-sm"><BarChart3 className="h-4 w-4" />Content Insights</TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1.5 text-xs sm:text-sm"><MessageSquare className="h-4 w-4" />משוב משתמשים</TabsTrigger>
            <TabsTrigger value="leads" className="gap-1.5 text-xs sm:text-sm"><Phone className="h-4 w-4" />לידים מקצועיים</TabsTrigger>
            <TabsTrigger value="landing-new" className="gap-1.5 text-xs sm:text-sm"><Globe className="h-4 w-4" />עמוד נחיתה</TabsTrigger>
          </TabsList>

          {/* ═══════ TAB 1 — Landing Page ═══════ */}
          <TabsContent value="landing" className="space-y-8">
            {/* Block Manager */}
            <LandingBlockManager />

            {/* Text Content Editor */}
            <div className="border-t border-border pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">עריכת טקסטים</h3>
                <p className="text-xs text-muted-foreground mt-1">ערוך את התכנים שמופיעים בבלוקים המובנים. השאר ריק כדי להשתמש בטקסט ברירת המחדל.</p>
              </div>
              {(() => {
                const groups: Record<string, typeof LANDING_FIELDS> = {};
                LANDING_FIELDS.forEach((f) => {
                  const g = f.group || "כללי";
                  if (!groups[g]) groups[g] = [];
                  groups[g].push(f);
                });
                return Object.entries(groups).map(([groupName, fields]) => (
                  <div key={groupName} className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">{groupName}</h3>
                    {fields.map((field) => (
                      <Card key={field.key} className="p-4 space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">{field.label}</label>
                        {field.multiline ? (
                          <Textarea
                            value={landingEdits[field.key] ?? ""}
                            onChange={(e) => setLandingEdits((p) => ({ ...p, [field.key]: e.target.value }))}
                            className="min-h-[100px] text-sm leading-relaxed"
                            placeholder="ברירת מחדל"
                          />
                        ) : (
                          <Input
                            value={landingEdits[field.key] ?? ""}
                            onChange={(e) => setLandingEdits((p) => ({ ...p, [field.key]: e.target.value }))}
                            className="text-sm"
                            placeholder="ברירת מחדל"
                          />
                        )}
                        <Button size="sm" onClick={() => handleSaveLandingField(field.key)} disabled={savingLanding[field.key]}>
                          {savingLanding[field.key] ? <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" /> : <Save className="h-3.5 w-3.5 ml-1" />}
                          {savingLanding[field.key] ? "שומר..." : "שמור"}
                        </Button>
                      </Card>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </TabsContent>

          {/* ═══════ TAB — Therapist Landing Page ═══════ */}
          <TabsContent value="therapist-landing" className="space-y-8">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">עריכת טקסטים — עמוד נחיתה למטפלים</h3>
                <p className="text-xs text-muted-foreground mt-1">ערוך את התכנים שמופיעים בעמוד הנחיתה הייעודי למטפלים (/for-therapists). השאר ריק כדי להשתמש בטקסט ברירת המחדל.</p>
              </div>
              {(() => {
                const groups: Record<string, typeof THERAPIST_LANDING_FIELDS> = {};
                THERAPIST_LANDING_FIELDS.forEach((f) => {
                  const g = f.group || "כללי";
                  if (!groups[g]) groups[g] = [];
                  groups[g].push(f);
                });
                return Object.entries(groups).map(([groupName, fields]) => (
                  <div key={groupName} className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">{groupName}</h3>
                    {fields.map((field) => (
                      <Card key={field.key} className="p-4 space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">{field.label}</label>
                        {field.multiline ? (
                          <Textarea
                            value={therapistEdits[field.key] ?? ""}
                            onChange={(e) => setTherapistEdits((p) => ({ ...p, [field.key]: e.target.value }))}
                            className="min-h-[100px] text-sm leading-relaxed"
                            placeholder="ברירת מחדל"
                          />
                        ) : (
                          <Input
                            value={therapistEdits[field.key] ?? ""}
                            onChange={(e) => setTherapistEdits((p) => ({ ...p, [field.key]: e.target.value }))}
                            className="text-sm"
                            placeholder="ברירת מחדל"
                          />
                        )}
                        <Button size="sm" onClick={() => handleSaveTherapistField(field.key)} disabled={savingTherapist[field.key]}>
                          {savingTherapist[field.key] ? <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" /> : <Save className="h-3.5 w-3.5 ml-1" />}
                          {savingTherapist[field.key] ? "שומר..." : "שמור"}
                        </Button>
                      </Card>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="p-6 space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />ניהול גישה, ניסיון ותשלום ידני
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    שליטה במצב הגישה של מטפלים ומטופלים, כולל ניסיון 30 יום ובקשות תשלום ידניות.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">פרופילי גישה {accessRows.length}</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">בקשות פתוחות {pendingPaymentRequestCount}</span>
                </div>
              </div>

              <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש לפי מזהה משתמש, קוד מטפל או סטטוס..."
                  value={accessSearch}
                  onChange={(e) => setAccessSearch(e.target.value)}
                  className="pr-10 text-sm"
                />
              </div>

              <div className="overflow-x-auto border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">משתמש</TableHead>
                      <TableHead className="text-right">תפקיד</TableHead>
                      <TableHead className="text-right">סטטוס תשלום</TableHead>
                      <TableHead className="text-right">סיום ניסיון</TableHead>
                      <TableHead className="text-right">קוד מטפל</TableHead>
                      <TableHead className="text-right">מטפל מקושר</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccessRows.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">אין נתונים להצגה</TableCell></TableRow>
                    ) : filteredAccessRows.map((row) => {
                      const isUpdating = updatingAccessUserId === row.user_id;
                      return (
                        <TableRow key={row.user_id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">{users.find(u => u.user_id === row.user_id)?.email || row.user_id}</p>
                              <p className="text-[11px] text-muted-foreground">נרשם ב-{formatDate(row.registration_date)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{row.role === "therapist" ? "מטפל/ת" : "מטופל/ת"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${row.payment_status === "active" ? "bg-secondary/15 text-secondary" : row.payment_status === "locked" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                              {row.payment_status === "active" ? "פעיל" : row.payment_status === "locked" ? "נעול" : "ניסיון"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(row.trial_ends_at)}</TableCell>
                          <TableCell className="text-sm font-mono">{row.therapist_code || "—"}</TableCell>
                          <TableCell className="text-sm font-mono">{row.linked_therapist_id || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" disabled={isUpdating} onClick={() => handleSetUserPaymentStatus(row.user_id, "active")}>הפעל</Button>
                              <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => handleSetUserPaymentStatus(row.user_id, "trial")}>החזר לניסיון</Button>
                              <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => handleSetUserPaymentStatus(row.user_id, "locked")}>נעל</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />בקשות תשלום ידניות
                </h3>
                <p className="text-xs text-muted-foreground mt-1">פניות שנשלחו מתוך מסך הנעילה לתשלום ב-PayBox / Bit.</p>
              </div>

              <div className="overflow-x-auto border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">משתמש</TableHead>
                      <TableHead className="text-right">איש קשר</TableHead>
                      <TableHead className="text-right">סכום</TableHead>
                      <TableHead className="text-right">סטטוס</TableHead>
                      <TableHead className="text-right">הודעה</TableHead>
                      <TableHead className="text-right">נשלח</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentRequests.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">אין בקשות תשלום עדיין</TableCell></TableRow>
                    ) : paymentRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">{request.user_id}</p>
                            <p className="text-[11px] text-muted-foreground">{request.role === "therapist" ? "מטפל/ת" : "מטופל/ת"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{request.contact_name || "—"}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{request.contact_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">₪{request.amount_ils}</TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${request.status === "approved" ? "bg-secondary/15 text-secondary" : request.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                            {request.status === "approved" ? "אושר" : request.status === "rejected" ? "נדחה" : "ממתין"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[280px] text-sm text-muted-foreground">{request.message || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(request.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* ═══════ TAB 2 — Content Management ═══════ */}
          <TabsContent value="content" className="space-y-8">
            {/* Meditations */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2"><Music className="h-5 w-5 text-primary" />מדיטציות</h2>
              <p className="text-xs text-muted-foreground">הוסף, ערוך ומחק מדיטציות. השתמש בטוגל כדי לפרסם או להעביר לטיוטה.</p>

              {meditationsList.map((med) => (
                <Card key={med.id} className={`border transition-all ${editingMedId === med.id ? "border-primary/40 shadow-sm" : "border-border"}`}>
                  {editingMedId === med.id ? (
                    <div className="p-5 space-y-3">
                      <Input value={editMedTitle} onChange={(e) => setEditMedTitle(e.target.value)} placeholder="כותרת" className="text-sm font-medium" />
                      <Textarea value={editMedDesc} onChange={(e) => setEditMedDesc(e.target.value)} placeholder="תיאור" className="min-h-[80px] text-sm" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">{editMedType === "youtube" ? "YouTube ID" : "Audio URL"}</label>
                          <Input value={editMedUrl} onChange={(e) => setEditMedUrl(e.target.value)} className="text-sm font-mono" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">סוג מדיה</label>
                          <div className="flex gap-2">
                            <Button size="sm" variant={editMedType === "youtube" ? "default" : "outline"} onClick={() => setEditMedType("youtube")}>YouTube</Button>
                            <Button size="sm" variant={editMedType === "audio" ? "default" : "outline"} onClick={() => setEditMedType("audio")}>Audio</Button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">תגיות (מופרדות בפסיקים)</label>
                        <Input value={editMedTags} onChange={(e) => setEditMedTags(e.target.value)} className="text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveMeditation(med.id)}><Save className="h-3.5 w-3.5 ml-1" />שמור</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingMedId(null)}><X className="h-3.5 w-3.5 ml-1" />ביטול</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Switch checked={med.published} onCheckedChange={() => handleToggleMedPublished(med)} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground text-sm truncate">{med.title}</h3>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${med.published ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                                {med.published ? "פורסם" : "טיוטה"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{med.description}</p>
                            {med.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {med.tags.map((tag) => <span key={tag} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{tag}</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => { setEditingMedId(med.id); setEditMedTitle(med.title); setEditMedDesc(med.description); setEditMedUrl(med.media_url); setEditMedType(med.media_type as "youtube" | "audio"); setEditMedTags(med.tags.join(", ")); }}>
                            <Pencil className="h-3 w-3" />ערוך
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteMeditation(med.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}

              {showNewMeditation ? (
                <Card className="p-5 border-2 border-primary/30 bg-primary/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm">מדיטציה חדשה</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNewMeditation(false)}><X className="h-4 w-4" /></Button>
                  </div>
                  <Input value={newMedTitle} onChange={(e) => setNewMedTitle(e.target.value)} placeholder="כותרת" className="text-sm" />
                  <Textarea value={newMedDesc} onChange={(e) => setNewMedDesc(e.target.value)} placeholder="תיאור" className="min-h-[80px] text-sm" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">{newMedType === "youtube" ? "YouTube Video ID" : "Audio URL"}</label>
                      <Input value={newMedUrl} onChange={(e) => setNewMedUrl(e.target.value)} className="text-sm font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">סוג מדיה</label>
                      <div className="flex gap-2">
                        <Button size="sm" variant={newMedType === "youtube" ? "default" : "outline"} onClick={() => setNewMedType("youtube")}>YouTube</Button>
                        <Button size="sm" variant={newMedType === "audio" ? "default" : "outline"} onClick={() => setNewMedType("audio")}>Audio</Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">תגיות (מופרדות בפסיקים)</label>
                    <Input value={newMedTags} onChange={(e) => setNewMedTags(e.target.value)} className="text-sm" />
                  </div>
                  <Button size="sm" onClick={handleCreateMeditation} disabled={!newMedTitle.trim() || !newMedUrl.trim()}>
                    <Plus className="h-3.5 w-3.5 ml-1" />צור מדיטציה
                  </Button>
                </Card>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowNewMeditation(true)} className="gap-1.5"><Plus className="h-4 w-4" />הוסף מדיטציה</Button>
              )}
            </div>

            {/* Feature Toggles */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2"><ToggleLeft className="h-5 w-5 text-primary" />הצג / הסתר אזורים</h2>
              <p className="text-xs text-muted-foreground">הפעל או השבת אזורים ופיצ׳רים באפליקציה.</p>

              {toggles.map((toggle) => (
                <Card key={toggle.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Switch checked={toggle.enabled} onCheckedChange={() => handleToggleEnabled(toggle)} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{toggle.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{toggle.key}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDeleteToggle(toggle.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </Card>
              ))}

              {showNewToggle ? (
                <Card className="p-5 border-2 border-primary/30 bg-primary/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm">פיצ׳ר חדש</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNewToggle(false)}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">מפתח</label>
                      <Input value={newToggleKey} onChange={(e) => setNewToggleKey(e.target.value)} placeholder="nav_reports" className="text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">שם תצוגה</label>
                      <Input value={newToggleLabel} onChange={(e) => setNewToggleLabel(e.target.value)} placeholder="דוחות" className="text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">קטגוריה</label>
                      <div className="flex gap-2">
                        <Button size="sm" variant={newToggleCategory === "nav" ? "default" : "outline"} onClick={() => setNewToggleCategory("nav")}>ניווט</Button>
                        <Button size="sm" variant={newToggleCategory === "feature" ? "default" : "outline"} onClick={() => setNewToggleCategory("feature")}>פיצ׳ר</Button>
                      </div>
                    </div>
                    {newToggleCategory === "nav" && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">URL יעד</label>
                        <Input value={newToggleUrl} onChange={(e) => setNewToggleUrl(e.target.value)} placeholder="/app/reports" className="text-sm font-mono" />
                      </div>
                    )}
                  </div>
                  <Button size="sm" onClick={handleCreateToggle} disabled={!newToggleKey.trim() || !newToggleLabel.trim()}>
                    <Plus className="h-3.5 w-3.5 ml-1" />צור
                  </Button>
                </Card>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowNewToggle(true)} className="gap-1.5"><Plus className="h-4 w-4" />הוסף פיצ׳ר</Button>
              )}
            </div>
          </TabsContent>

          {/* ═══════ TAB 3 — AI Engine ═══════ */}
          <TabsContent value="ai" className="space-y-6">
            {/* Summary prompt */}
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">הנחיות סיכום שבועי</h3>
                <p className="text-xs text-muted-foreground mt-1">הפרומפט שמגדיר את אישיות ה-AI כשהוא מייצר סיכום שבועי למשתמש.</p>
              </div>
              <Textarea value={summaryPrompt} onChange={(e) => setSummaryPrompt(e.target.value)} placeholder="כתוב סיכום נרטיבי בעברית, בטון חם ותומך..." className="min-h-[250px] text-sm leading-relaxed" />
              <Button onClick={() => handleSaveAiField("summary_system_prompt", summaryPrompt, "פרומפט סיכומים")} disabled={savingAi === "summary_system_prompt"}>
                {savingAi === "summary_system_prompt" ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
                שמור פרומפט סיכומים
              </Button>
            </Card>

            {/* Monthly Summary prompt */}
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">הנחיות סיכום חודשי</h3>
                  <p className="text-xs text-muted-foreground mt-1">הפרומפט שמגדיר את ה-AI כשהוא מייצר דו״ח חודשי למשתמש.</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0 text-xs" onClick={() => { setMonthlySummaryPrompt(summaryPrompt); toast({ title: "✓ הועתק מהשבועי" }); }}>
                  <Copy className="h-3.5 w-3.5" />העתק מהשבועי
                </Button>
              </div>
              <Textarea value={monthlySummaryPrompt} onChange={(e) => setMonthlySummaryPrompt(e.target.value)} placeholder="את/ה מנתח/ת יומן רגשי אישי ומייצר/ת דו״ח חודשי חם ותומך..." className="min-h-[250px] text-sm leading-relaxed" />
              <Button onClick={() => handleSaveAiField("monthly_summary_prompt", monthlySummaryPrompt, "פרומפט סיכום חודשי")} disabled={savingAi === "monthly_summary_prompt"}>
                {savingAi === "monthly_summary_prompt" ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
                שמור פרומפט חודשי
              </Button>
            </Card>

            {/* Multi-Month Comparison prompt */}
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">הנחיות השוואה רב-חודשית</h3>
                <p className="text-xs text-muted-foreground mt-1">הפרומפט שמנתח מגמות בין חודשים (1, 2 ו-3 חודשים אחורה).</p>
              </div>
              <Textarea value={multiMonthPrompt} onChange={(e) => setMultiMonthPrompt(e.target.value)} placeholder="נתח את 3 התקופות הבאות וצור דו״ח השוואתי חם ותומך..." className="min-h-[250px] text-sm leading-relaxed" />
              <Button onClick={() => handleSaveAiField("multi_month_prompt", multiMonthPrompt, "פרומפט רב-חודשי")} disabled={savingAi === "multi_month_prompt"}>
                {savingAi === "multi_month_prompt" ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
                שמור פרומפט רב-חודשי
              </Button>
            </Card>

            {/* Chat AI */}
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">הנחיות צ׳אט</h3>
                <p className="text-xs text-muted-foreground mt-1">הוראות נוספות שמצורפות לצ׳אט. משפיעות על טון ותגובות הבוט.</p>
              </div>
              <Textarea value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} placeholder="ענה תמיד בעברית, היה חם ותמציתי..." className="min-h-[180px] text-sm leading-relaxed" />
              <Button onClick={() => handleSaveAiField("ai_site_instruction", aiInstruction, "הנחיות צ׳אט")} disabled={savingAi === "ai_site_instruction"}>
                {savingAi === "ai_site_instruction" ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
                שמור הנחיות צ׳אט
              </Button>
            </Card>

            {/* Master Config */}
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">הגדרות מאסטר (Master Config)</h3>
                <p className="text-xs text-muted-foreground mt-1">טקסט חופשי + מילות מפתח בסוגריים מרובעים לשליטה על התנהגות האפליקציה.</p>
              </div>
              <Textarea value={appInstructions} onChange={(e) => setAppInstructions(e.target.value)} placeholder={`[THEME: DARK]\n[MAX_CHARS: 5000]\n[WELCOME_MESSAGE: היי!]`} className="min-h-[200px] text-sm leading-relaxed font-mono" />
              <Button onClick={() => handleSaveAiField("app_instructions", appInstructions, "Master Config")} disabled={savingAi === "app_instructions"}>
                {savingAi === "app_instructions" ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
                שמור Master Config
              </Button>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <p className="text-xs text-muted-foreground">
                  💡 מילות מפתח נתמכות: <code className="bg-muted px-1 rounded">[THEME: DARK/LIGHT/AUTO]</code> · <code className="bg-muted px-1 rounded">[MAX_CHARS: n]</code> · <code className="bg-muted px-1 rounded">[WELCOME_MESSAGE: ...]</code> · <code className="bg-muted px-1 rounded">[HIDE_MEDITATION]</code>
                </p>
              </div>
            </Card>

            {/* ── Regenerate Summaries ── */}
            <Card className="p-6 space-y-4 border-2 border-primary/20">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />רענן סיכומים ומגמות
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  הרץ מחדש את ה-AI עבור משתמש נבחר עם ההנחיות המעודכנות. הנתונים הקיימים יידרסו.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">בחר משתמש</label>
                  <select
                    value={regenUserId}
                    onChange={(e) => setRegenUserId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={regenerating}
                  >
                    <option value="">— בחר משתמש —</option>
                    {users.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.email}{u.first_name ? ` (${u.first_name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={!regenUserId || regenerating} className="gap-2">
                      {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                      {regenerating ? "מרענן..." : "רענן סיכומים ומגמות"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>רענון סיכומים ומגמות</AlertDialogTitle>
                      <AlertDialogDescription>
                        פעולה זו תריץ מחדש את ה-AI עבור כל הסיכומים השבועיים והחודשיים של המשתמש הנבחר, ותדרוס את הנתונים הקיימים. פעולה זו עשויה להימשך מספר דקות.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRegenerateAll} className="gap-2">
                        <BarChart3 className="h-4 w-4" />אישור ורענון
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Log output */}
              {regenLog.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-3 border border-border/50 max-h-48 overflow-y-auto space-y-1">
                  {regenLog.map((line, i) => (
                    <p key={i} className="text-xs text-muted-foreground font-mono">{line}</p>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ═══════ TAB — Notifications ═══════ */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Manual Push */}
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />שליחת התראה ידנית
                </h3>
                <p className="text-xs text-muted-foreground mt-1">שלח הודעת Push לכל המשתמשים שנרשמו להתראות ({stats.pushSubs} נרשמים).</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">כותרת ההתראה</label>
                  <Input
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    placeholder="NestAI"
                    className="max-w-sm text-sm"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">הודעת התראה</label>
                  <Textarea
                    value={pushMessage}
                    onChange={(e) => setPushMessage(e.target.value)}
                    placeholder="כתוב את ההודעה שתישלח לכל המשתמשים..."
                    className="min-h-[100px] text-sm leading-relaxed"
                    maxLength={1000}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 text-left" dir="ltr">{pushMessage.length}/1000</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={!pushMessage.trim() || sendingPush} className="gap-2">
                      {sendingPush ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      שלח עכשיו
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>שליחת התראה לכל המשתמשים</AlertDialogTitle>
                      <AlertDialogDescription>
                        ההודעה תישלח ל-{stats.pushSubs} משתמשים שנרשמו להתראות. פעולה זו לא ניתנת לביטול.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="bg-muted/50 rounded-lg p-3 border border-border/50 space-y-1">
                      <p className="text-xs font-medium text-foreground">{pushTitle || "NestAI"}</p>
                      <p className="text-sm text-muted-foreground">{pushMessage}</p>
                    </div>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSendPushNow} className="gap-2">
                        <Send className="h-4 w-4" />אישור ושליחה
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>

            {/* Scheduled Reminder */}
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />תזכורת יומית מתוזמנת
                </h3>
                <p className="text-xs text-muted-foreground mt-1">הגדר תזכורת Push אוטומטית שנשלחת כל יום לכל הנרשמים.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={dailyReminderEnabled}
                    onCheckedChange={setDailyReminderEnabled}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {dailyReminderEnabled ? "תזכורת יומית מופעלת" : "תזכורת יומית מושבתת"}
                  </span>
                </div>
                {dailyReminderEnabled && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">שעת שליחה (שעון ישראל)</label>
                    <Input
                      type="time"
                      value={dailyReminderTime}
                      onChange={(e) => setDailyReminderTime(e.target.value)}
                      className="max-w-[140px] text-sm"
                    />
                  </div>
                )}
                <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    💡 הודעת התזכורת: <strong>״זמן לכתוב ב-NestAI - קחו כמה דקות לעצמכם״</strong>
                  </p>
                </div>
                <Button size="sm" onClick={handleSaveNotifSettings} disabled={savingNotifSettings}>
                  {savingNotifSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" /> : <Save className="h-3.5 w-3.5 ml-1" />}
                  שמור הגדרות
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ═══════ TAB 4 — Design & UI ═══════ */}
          <TabsContent value="design" className="space-y-6">
            <Card className="p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-foreground">מצב תצוגה</h3>
                <p className="text-xs text-muted-foreground mt-1">בחר ערכת נושא גלובלית לכל המשתמשים.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {([["AUTO", "🌗 אוטומטי"], ["LIGHT", "☀️ בהיר"], ["DARK", "🌙 כהה"]] as const).map(([mode, label]) => (
                  <Button
                    key={mode}
                    variant={currentTheme === mode ? "default" : "outline"}
                    className="gap-2 min-w-[120px]"
                    onClick={() => setThemeDirective(mode as "DARK" | "LIGHT" | "AUTO")}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">מצב נוכחי: <strong>{currentTheme === "DARK" ? "כהה" : currentTheme === "LIGHT" ? "בהיר" : "אוטומטי"}</strong></p>
            </Card>

            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">צבעים וגופנים</h3>
                <p className="text-xs text-muted-foreground mt-1">בקרוב — שינוי צבעים ראשיים וגופנים ישירות מכאן.</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {[
                  { label: "ראשי", color: "hsl(210, 60%, 35%)" },
                  { label: "משני", color: "hsl(175, 60%, 50%)" },
                  { label: "הדגשה", color: "hsl(260, 55%, 60%)" },
                  { label: "רקע", color: "hsl(0, 0%, 100%)" },
                  { label: "טקסט", color: "hsl(210, 50%, 20%)" },
                ].map((c) => (
                  <div key={c.label} className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-full mx-auto border-2 border-border shadow-sm" style={{ background: c.color }} />
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic">💡 כרגע הצבעים מוגדרים בקוד. בגרסה הבאה תוכל לשנות אותם מכאן.</p>
            </Card>
          </TabsContent>

          {/* ═══════ TAB 5 — Security ═══════ */}
          <TabsContent value="security" className="space-y-6">
            {/* Admin password */}
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />סיסמת אדמין</h3>
                <p className="text-xs text-muted-foreground mt-1">עדכן את הסיסמה שנדרשת בכניסה ללוח הבקרה.</p>
              </div>
              <Input
                type="password"
                value={adminPw}
                onChange={(e) => setAdminPw(e.target.value)}
                placeholder="הזן סיסמה חדשה..."
                className="max-w-sm text-sm"
              />
              <Button size="sm" onClick={handleSaveAdminPassword} disabled={savingPw || !adminPw.trim()}>
                {savingPw ? <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" /> : <Save className="h-3.5 w-3.5 ml-1" />}
                עדכן סיסמה
              </Button>
            </Card>

            {/* Users list */}
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2"><Users className="h-5 w-5 text-primary" />משתמשים רשומים</h3>
                <p className="text-xs text-muted-foreground mt-1">רשימת כל המשתמשים הרשומים באפליקציה ({users.length})</p>
              </div>
              <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="חיפוש..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pr-10 text-sm" />
              </div>
              <div className="overflow-x-auto border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">אימייל</TableHead>
                      <TableHead className="text-right">שם</TableHead>
                      <TableHead className="text-right">הרשמה</TableHead>
                      <TableHead className="text-right">כניסה אחרונה</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">לא נמצאו</TableCell></TableRow>
                    ) : filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium text-sm">{user.email}</TableCell>
                        <TableCell className="text-sm">{user.first_name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(user.last_sign_in_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* ═══════ TAB 6 — Therapist Approvals ═══════ */}
          <TabsContent value="therapists" className="space-y-6">
            <Card className="p-6 space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />אישור מטפלים מומחים
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    רק מטפלים שאושרו כאן יקבלו גישה לדאשבורד המטפלים.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">סה״כ {therapistRegistrations.length}</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">ממתינים {pendingTherapistCount}</span>
                </div>
              </div>

              <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש לפי שם, אימייל או תחום התמחות..."
                  value={therapistSearch}
                  onChange={(e) => setTherapistSearch(e.target.value)}
                  className="pr-10 text-sm"
                />
              </div>

              <div className="overflow-x-auto border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">מטפל/ת</TableHead>
                      <TableHead className="text-right">התמחות</TableHead>
                      <TableHead className="text-right">ניסיון</TableHead>
                      <TableHead className="text-right">רישיון</TableHead>
                      <TableHead className="text-right">סטטוס</TableHead>
                      <TableHead className="text-right">נשלח</TableHead>
                      <TableHead className="text-right">נסקר</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTherapistRegistrations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">אין בקשות להצגה</TableCell>
                      </TableRow>
                    ) : filteredTherapistRegistrations.map((registration) => {
                      const isPending = (registration.status ?? "pending") === "pending";
                      const isReviewing = reviewingRegistrationId === registration.id;

                      return (
                        <TableRow key={registration.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-sm text-foreground">{registration.full_name}</p>
                              <p className="text-xs text-muted-foreground" dir="ltr">{registration.email}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">{registration.user_id ?? "ללא משתמש מקושר"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{registration.specialization}</TableCell>
                          <TableCell className="text-sm">{registration.years_of_experience} שנים</TableCell>
                          <TableCell className="text-sm">{registration.license_number || "—"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTherapistStatusClassName(registration.status)}`}>
                              {getTherapistStatusLabel(registration.status)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(registration.created_at)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(registration.reviewed_at)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="gap-1.5"
                                disabled={isReviewing || (!isPending && registration.status === "approved")}
                                onClick={() => handleReviewTherapist(registration.id, true)}
                              >
                                {isReviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                                אשר
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                disabled={isReviewing || (!isPending && registration.status === "rejected")}
                                onClick={() => handleReviewTherapist(registration.id, false)}
                              >
                                <UserX className="h-3.5 w-3.5" />
                                דחה
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* ═══════ TAB 7 — Content Insights ═══════ */}
          <TabsContent value="insights" className="space-y-5">
            <ContentInsights />
          </TabsContent>

          {/* ═══════ TAB 8 — User Feedback ═══════ */}
          <TabsContent value="feedback" className="space-y-5">
            <AdminFeedbackTab />
          </TabsContent>

          {/* ═══════ TAB 9 — Professional Leads ═══════ */}
          <TabsContent value="leads" className="space-y-5">
            <Card className="glass-card tech-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">פניות מקצועיות מעמוד הדמו</h2>
                <span className="text-xs text-muted-foreground">{professionalLeads.length} פניות</span>
              </div>
              {professionalLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">אין פניות עדיין</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">אימייל</TableHead>
                        <TableHead className="text-right">טלפון</TableHead>
                        <TableHead className="text-right">תאריך</TableHead>
                        <TableHead className="text-right w-16">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {professionalLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium" dir="ltr">{lead.email}</TableCell>
                          <TableCell dir="ltr">{lead.phone || "—"}</TableCell>
                          <TableCell>{formatDate(lead.created_at)}</TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>מחיקת פנייה</AlertDialogTitle>
                                  <AlertDialogDescription>האם למחוק את הפנייה של {lead.email}?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteLead(lead.id)}>מחק</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ═══════ TAB — Landing Page Content Editor ═══════ */}
          <TabsContent value="landing-new" className="space-y-6">
            <LandingContentEditor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
