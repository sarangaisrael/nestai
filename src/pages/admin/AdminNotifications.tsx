import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Bell, Send, Users, Loader2, Trash2, Calendar } from "lucide-react";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Subscriber {
  id: string;
  user_id: string;
  created_at: string;
  email?: string;
}

const AdminNotifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [triggeringMonthly, setTriggeringMonthly] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/app/auth");
        return;
      }
      loadStats();
      loadSubscribers();
    });

    // Subscribe to realtime changes for push_subscriptions
    const channel = supabase
      .channel('push_subscriptions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'push_subscriptions'
        },
        () => {
          // Reload stats and subscribers when any change occurs
          loadStats();
          loadSubscribers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const loadStats = async () => {
    try {
      // Use security definer function to get count without exposing sensitive columns
      const { data, error } = await supabase.rpc("get_admin_push_subscription_count");

      if (!error && data !== null) {
        setSubscriberCount(Number(data));
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadSubscribers = async () => {
    try {
      // Use security definer function to get subscriptions without sensitive columns
      const { data: subscriptions, error: subError } = await supabase.rpc("get_admin_push_subscriptions");

      if (subError) throw subError;

      if (subscriptions && subscriptions.length > 0) {
        // Get user emails using secure admin function
        const userIds = subscriptions.map((s: { user_id: string }) => s.user_id);
        const { data: emailsData, error: emailError } = await supabase.rpc("get_admin_user_emails", {
          user_ids: userIds
        });

        if (emailError) {
          console.error("Error loading emails:", emailError);
        }

        // Merge data
        const subscribersWithEmails = subscriptions.map((sub: { id: string; user_id: string; created_at: string }) => ({
          ...sub,
          email: emailsData?.find((e: { user_id: string; email: string }) => e.user_id === sub.user_id)?.email || "לא ידוע"
        }));

        setSubscribers(subscribersWithEmails);
      } else {
        setSubscribers([]);
      }
    } catch (error) {
      console.error("Error loading subscribers:", error);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "נמחק בהצלחה",
        description: "המנוי הוסר מרשימת ההתראות",
      });

      // Refresh list
      loadSubscribers();
      loadStats();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את המנוי",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendPush = async () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: "שגיאה",
        description: "נא למלא כותרת ותוכן",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push-to-all", {
        body: {
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || "/",
        },
      });

      if (error) throw error;

      toast({
        title: "התראות נשלחו",
        description: `נשלחו ${data.sent} התראות בהצלחה`,
      });

      setTitle("");
      setBody("");
      setUrl("/");
    } catch (error: any) {
      console.error("Error sending push:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח את ההתראות",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect non-admins
  if (!isAdmin) {
    navigate("/app/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">ניהול התראות</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/dashboard")} className="h-9 w-9">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Card */}
        <Card className="p-4 border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">משתמשים רשומים להתראות</p>
              {loadingStats ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{subscriberCount}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Send Notification Form */}
        <Card className="p-5 border border-border bg-card space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            שליחת התראה לכל המשתמשים
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                כותרת
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="כותרת ההתראה"
                className="text-base"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                תוכן
              </label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="תוכן ההתראה"
                className="min-h-[100px] text-base"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                קישור (אופציונלי)
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/dashboard"
                className="text-base"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground mt-1">
                לאן יועבר המשתמש בלחיצה על ההתראה
              </p>
            </div>
          </div>

          <Button
            onClick={handleSendPush}
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <Bell className="ml-2 h-4 w-4" />
                שלח התראה לכולם
              </>
            )}
          </Button>
        </Card>

        {/* Subscribers List */}
        <Card className="p-5 border border-border bg-card space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            רשימת מנויים ({subscriberCount || 0})
          </h2>

          {loadingSubscribers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : subscribers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              אין מנויים להתראות עדיין
            </p>
          ) : (
            <div className="space-y-2">
              {subscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {subscriber.email}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(subscriber.created_at), "d בMMMM yyyy", { locale: he })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSubscription(subscriber.id)}
                    disabled={deletingId === subscriber.id}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deletingId === subscriber.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="text-center text-xs text-muted-foreground pt-4">
          © 2025 nestai.care. All rights reserved
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;