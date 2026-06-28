import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, LogOut, Settings, Sparkles, User, Calendar, Mail, Mic, MicOff } from "lucide-react";
import logo from "@/assets/nestai-logo-full.png";
import chatAvatar from "@/assets/chat-avatar.png";
import { useUnviewedSummary } from "@/hooks/useUnviewedSummary";
import { PreferencesOnboarding } from "@/components/PreferencesOnboarding";
import AddToHomeBanner from "@/components/AddToHomeBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/AppHeader";
import { useAppDirectives } from "@/hooks/useAppDirectives";
import { useSubscription } from "@/hooks/useSubscription";


type Message = {
  id: string;
  text: string;
  role: "user" | "assistant";
  created_at: string;
};

const WA_UPGRADE_URL = "https://wa.me/9720537000277?text=היי, אני רוצה לשדרג את המנוי שלי";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHeight, setChatHeight] = useState<string>("100dvh");

  // Track visual viewport so layout shrinks when keyboard opens (works in Capacitor WKWebView)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setChatHeight(`${vv.height}px`);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening,   setIsListening]   = useState(false);
  const recognitionRef          = useRef<any>(null);
  const inputBeforeRecordingRef = useRef<string>("");
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Question passed via ?q= from a daily notification tap
  const notificationQuestion = new URLSearchParams(location.search).get("q") ?? "";
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const { hasUnviewed } = useUnviewedSummary();
  const { t, dir, language } = useLanguage();
  const { getNumber, getValue, hasFlag } = useAppDirectives();
  const { isExpired } = useSubscription();
  
  const maxChars = getNumber("MAX_CHARS", 10000);
  const maxMessages = getNumber("MAX_MESSAGES", 0);
  const welcomeMessage = getValue("WELCOME_MESSAGE", "");
  const appName = getValue("APP_NAME", "");
  const supportPhone = getValue("SUPPORT_PHONE", "");
  const supportEmail = getValue("SUPPORT_EMAIL", "");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        console.error("Session error:", error);
        navigate("/app/auth");
      } else {
        setUser(session.user);
        loadMessages(session.user.id, notificationQuestion || undefined);
      }
    }).catch(err => {
      console.error("Session fetch failed:", err);
      navigate("/app/auth");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/app/auth");
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadMessages = async (userId: string, initialQuestion?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('decrypt-messages', { body: { source: 'chat' } });
      if (error) {
        console.error("Error loading messages:", error);
        return;
      }
      const loaded = (data?.messages || []) as Message[];
      if (initialQuestion) {
        const notifMsg: Message = {
          id: `notification-q-${Date.now()}`,
          text: initialQuestion,
          role: "assistant",
          created_at: new Date().toISOString(),
        };
        setMessages([notifMsg, ...loaded]);
      } else {
        setMessages(loaded);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const handleFocus = () => {
      if (textareaRef.current && inputContainerRef.current) {
        setTimeout(() => {
          inputContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 300);
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('focus', handleFocus);
      return () => textarea.removeEventListener('focus', handleFocus);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    // Enforce MAX_MESSAGES directive
    if (maxMessages > 0) {
      const userMessages = messages.filter(m => m.role === "user");
      if (userMessages.length >= maxMessages) {
        toast({ title: "הגעת למגבלת ההודעות היומית", variant: "destructive" });
        return;
      }
    }
    const messageText = input.trim();
    setInput("");
    setLoading(true);

    // Optimistically add user message to local state.
    // The `chat` edge function handles saving both the user message and AI reply
    // to the DB — so we must NOT call encrypt-message here (that would double-save).
    const optimisticUserMsg: Message = {
      id: `temp-user-${Date.now()}`,
      text: messageText,
      role: "user",
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticUserMsg]);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('chat', {
        body: { message: messageText, userId: user.id, ...(notificationQuestion ? { initialQuestion: notificationQuestion } : {}) }
      });
      if (functionError) throw functionError;

      if (!functionData.shouldRespond || !functionData.reply) {
        return;
      }

      // Add AI reply to local state — already saved to DB by the chat function
      const aiReplyMsg: Message = {
        id: `temp-ai-${Date.now()}`,
        text: functionData.reply,
        role: "assistant",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiReplyMsg]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Roll back the optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
      if (error?.message?.includes("JWT") || error?.message?.includes("token") || error?.message?.includes("session")) {
        toast({ title: t.errors.somethingWentWrong, description: t.chat.reloginRequired, variant: "destructive" });
        setTimeout(() => navigate("/app/auth"), 1500);
      } else {
        toast({ title: t.errors.somethingWentWrong, description: t.chat.errorSending, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "הדפדפן שלך לא תומך בהקלטה קולית", variant: "destructive" });
      return;
    }

    // Snapshot whatever was typed before recording starts
    inputBeforeRecordingRef.current = input;

    const recognition = new SpeechRecognition();
    recognition.lang = "he-IL";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend   = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      const base = inputBeforeRecordingRef.current;
      setInput(base ? `${base} ${transcript}` : transcript);
    };

    recognition.start();
  };

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    try {
      setUser(null);
      setMessages([]);
      await supabase.auth.signOut({ scope: 'local' });
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) keysToRemove.push(key);
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      navigate("/app/auth", { replace: true });
    } catch (error) {
      console.error("Logout exception:", error);
      navigate("/app/auth", { replace: true });
    }
  };



  return (
    <div className="w-full flex flex-col bg-background" style={{ height: chatHeight }} dir={dir}>
      <PreferencesOnboarding />
      <AddToHomeBanner />
      
      <AppHeader />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6" ref={scrollRef}>
        <div className="max-w-2xl mx-auto space-y-5 w-full">
          {messages.length === 0 && (
            <div className="text-center py-20 animate-in px-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">✨</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">{t.chat.hello}</h2>
              <p className="text-sm text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
                {welcomeMessage || t.chat.howWasYourDay}
              </p>
            </div>
          )}
          
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"} animate-in`}>
              {message.role === "assistant" ? (
                /* AI message — avatar + bubble */
                <div className="flex items-end gap-2 mr-auto max-w-[82%]">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden shadow-sm">
                    <img src={chatAvatar} alt="NestAI" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="rounded-lg px-4 py-2.5 shadow-sm bg-primary/10 text-foreground">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {new Date(message.created_at).toLocaleTimeString(language === 'he' ? "he-IL" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ) : (
                /* User message */
                <div className="max-w-[80%] rounded-lg px-4 py-2.5 shadow-sm bg-card ml-auto text-foreground border border-border">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {new Date(message.created_at).toLocaleTimeString(language === 'he' ? "he-IL" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-end mb-4 px-4 animate-slide-up">
              <div className="flex items-end gap-2 mr-auto">
                <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden shadow-sm">
                  <img src={chatAvatar} alt="NestAI" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="rounded-lg px-4 py-3 bg-primary/10 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Subscription expired overlay ── */}
      {isExpired && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 40,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(255,255,255,0.75)',
          fontFamily: "'Heebo', sans-serif",
          textAlign: 'center',
          padding: '0 24px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 24,
            padding: '32px 28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            maxWidth: 340,
            width: '100%',
          }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              הצ׳אט נעול
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
              תקופת הניסיון שלך הסתיימה. שדרג את המנוי כדי להמשיך לשוחח עם ה-AI.
            </p>
            <a
              href={WA_UPGRADE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#25D366', color: 'white',
                borderRadius: 12, padding: '14px 0', width: '100%',
                fontSize: 15, fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              שדרגו דרך וואטסאפ
            </a>
          </div>
        </div>
      )}

      {/* Input */}
      <div ref={inputContainerRef} className="bg-card border-t border-border px-3 py-2.5 md:px-4 md:py-3 shrink-0 shadow-sm safe-bottom">
        <div className="max-w-2xl mx-auto flex gap-2 w-full items-end">
          <Textarea 
            ref={textareaRef}
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder={t.chat.placeholder} 
            className="resize-none bg-background border border-border focus:border-primary rounded-lg text-base leading-relaxed min-h-[44px] max-h-[100px] px-3 py-2.5"
            maxLength={maxChars}
            rows={1} 
            style={{ fontSize: '16px' }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }} 
          />
          <div className="relative shrink-0">
            <Button
              onClick={toggleVoiceRecognition}
              size="icon"
              variant={isListening ? "destructive" : "ghost"}
              className="h-10 w-10 md:h-11 md:w-11"
              type="button"
              title={isListening ? "עצור הקלטה" : "הקלטה קולית"}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            {/* Pulsing red dot — visible only while recording */}
            {isListening && (
              <span
                className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse"
                style={{ transform: 'translate(30%, -30%)' }}
              />
            )}
          </div>
          <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon" className="shrink-0 h-10 w-10 md:h-11 md:w-11">
            →
          </Button>
        </div>
        <div className="text-center text-xs text-muted-foreground pt-2 md:pt-3">
          {t.footer.copyright}
        </div>
      </div>

      {/* Spacer so input bar sits above the fixed bottom nav */}
      <div style={{ height: "calc(58px + env(safe-area-inset-bottom, 0px))", flexShrink: 0 }} />

    </div>
  );
};

export default Index;