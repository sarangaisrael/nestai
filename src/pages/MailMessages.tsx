import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Send, Mail, Bell, Loader2 } from "lucide-react";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import AddToHomeBanner from "@/components/AddToHomeBanner";
import { Switch } from "@/components/ui/switch";

type SystemMessage = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

const MailMessages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendPush, setSendPush] = useState(false);
  const [sendingPush, setSendingPush] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/app/auth");
        return;
      }
      loadMessages();
    });
  }, [navigate]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("system_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את ההודעות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast({
        title: "שגיאה",
        description: "נא למלא כותרת ותוכן",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("system_messages").insert({
        title: newTitle.trim(),
        body: newBody.trim(),
      });

      if (error) throw error;

      // Send push notification if enabled
      if (sendPush) {
        setSendingPush(true);
        try {
          const { data, error: pushError } = await supabase.functions.invoke("send-push-to-all", {
            body: {
              title: newTitle.trim(),
              body: newBody.trim(),
              url: "/mail",
            },
          });

          if (pushError) throw pushError;

          toast({
            title: "הודעה נשלחה",
            description: `ההודעה נשלחה בהצלחה + ${data.sent} התראות Push`,
          });
        } catch (pushErr) {
          console.error("Push error:", pushErr);
          toast({
            title: "הודעה נשלחה",
            description: "ההודעה נשלחה, אך שליחת ההתראות נכשלה",
          });
        }
        setSendingPush(false);
      } else {
        toast({
          title: "הודעה נשלחה",
          description: "ההודעה נשלחה בהצלחה",
        });
      }

      setNewTitle("");
      setNewBody("");
      setSendPush(false);
      loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח את ההודעה",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendPushOnly = async () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast({
        title: "שגיאה",
        description: "נא למלא כותרת ותוכן",
        variant: "destructive",
      });
      return;
    }

    setSendingPush(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push-to-all", {
        body: {
          title: newTitle.trim(),
          body: newBody.trim(),
          url: "/",
        },
      });

      if (error) throw error;

      toast({
        title: "התראות נשלחו",
        description: `נשלחו ${data.sent} התראות Push`,
      });

      setNewTitle("");
      setNewBody("");
    } catch (error) {
      console.error("Error sending push:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח את ההתראות",
        variant: "destructive",
      });
    } finally {
      setSendingPush(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Only admins can access this page
  if (!isAdmin) {
    navigate("/app/chat");
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">הודעות מערכת</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/chat")} className="h-9 w-9">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <AddToHomeBanner />

        {/* Admin Form */}
        {isAdmin && (
          <Card className="p-4 border border-border bg-card space-y-4">
            <h2 className="text-lg font-semibold text-foreground">הוספת הודעה / התראה</h2>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="כותרת"
              className="text-base"
            />
            <Textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="תוכן ההודעה"
              className="min-h-[100px] text-base"
            />
            
            <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">שלח גם התראת Push</span>
              </div>
              <Switch
                checked={sendPush}
                onCheckedChange={setSendPush}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSendMessage}
                disabled={sending || sendingPush || !newTitle.trim() || !newBody.trim()}
                className="flex-1"
              >
                <Send className="ml-2 h-4 w-4" />
                {sending ? "שולח..." : "שלח הודעת מערכת"}
              </Button>
              
              <Button
                onClick={handleSendPushOnly}
                disabled={sending || sendingPush || !newTitle.trim() || !newBody.trim()}
                variant="outline"
                className="flex-shrink-0"
              >
                {sendingPush ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              💡 הודעת מערכת נשמרת באפליקציה. התראת Push נשלחת ישירות למכשיר.
            </p>
          </Card>
        )}

        {/* Messages List */}
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">אין הודעות עדיין</p>
            </div>
          ) : (
            messages.map((message) => (
              <Card key={message.id} className="p-4 border border-border bg-card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">{message.title}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(message.created_at)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {message.body}
                </p>
              </Card>
            ))
          )}
        </div>

        <div className="text-center text-xs text-muted-foreground pt-4">
          © 2025 nestai.care. All rights reserved
        </div>
      </div>
    </div>
  );
};

export default MailMessages;
