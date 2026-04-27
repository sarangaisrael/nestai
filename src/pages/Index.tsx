import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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


type Message = {
  id: string;
  text: string;
  role: "user" | "assistant";
  created_at: string;
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const { hasUnviewed } = useUnviewedSummary();
  const { t, dir, language } = useLanguage();
  const { getNumber, getValue, hasFlag } = useAppDirectives();
  
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
        loadMessages(session.user.id);
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

  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('decrypt-messages', { body: { source: 'chat' } });
      if (error) {
        console.error("Error loading messages:", error);
        return;
      }
      setMessages((data?.messages || []) as Message[]);
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

    try {
      const { data: encryptData, error: encryptError } = await supabase.functions.invoke('encrypt-message', {
        body: { text: messageText, role: "user", is_system: false, reply_count: 0 }
      });
      if (encryptError) throw encryptError;
      
      const savedMessage = encryptData.message;
      setMessages(prev => [...prev, savedMessage as Message]);
      
      const { data: functionData, error: functionError } = await supabase.functions.invoke('chat', {
        body: { message: messageText, userId: user.id }
      });
      if (functionError) throw functionError;

      if (!functionData.shouldRespond || !functionData.reply) {
        setLoading(false);
        return;
      }

      const aiReply = functionData.reply;
      const replyCount = functionData.replyCount || 1;
      
      const { data: assistantData, error: assistantError } = await supabase.functions.invoke('encrypt-message', {
        body: { text: aiReply, role: "assistant", is_system: false, reply_count: replyCount }
      });
      if (assistantError) throw assistantError;
      
      const assistantMessage = assistantData.message;
      setMessages(prev => [...prev, assistantMessage as Message]);
    } catch (error: any) {
      console.error("Error sending message:", error);
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
      toast({ title: "לא נתמך", description: "הדפדפן לא תומך בזיהוי קולי", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "he-IL";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      setInput(transcript);
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
    <div className="w-full flex flex-col bg-background fixed inset-0" dir={dir}>
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
          <Button
            onClick={toggleVoiceRecognition}
            size="icon"
            variant={isListening ? "destructive" : "ghost"}
            className={`shrink-0 h-10 w-10 md:h-11 md:w-11 ${isListening ? "animate-pulse" : ""}`}
            type="button"
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon" className="shrink-0 h-10 w-10 md:h-11 md:w-11">
            →
          </Button>
        </div>
        <div className="text-center text-xs text-muted-foreground pt-2 md:pt-3">
          {t.footer.copyright}
        </div>
      </div>
      
    </div>
  );
};

export default Index;