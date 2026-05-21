import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import agentImg from "@/assets/agent-character.png";

type AgentContext = "writing" | "weekly" | "monthly" | "post-writing" | "default";

const AGENT_MESSAGES: Record<AgentContext, string> = {
  writing:
    "היי, אני כאן איתך. זה זמן טוב לפרוק קצת מה שעבר עליך בימים האחרונים. אל תדאג לגבי הניסוח, פשוט תכתוב מה שיוצא – אני כבר אעזור לך לעשות בזה סדר אחר כך.",
  weekly:
    "הנה מה שעבר עליך השבוע. ריכזתי עבורך את הנקודות המרכזיות כדי שתגיע למפגש הקרוב ממוקד יותר.",
  monthly:
    "הסתכלתי על החודש האחרון שלך, ויש כאן תהליך מענין. אנחנו רואים שיפור הדרגתי במגמות החיוביות, למרות הימים המאתגרים. זה מראה על חוסן אמיתי.",
  "post-writing":
    "תודה ששיתפת. להוציא את הדברים על הכתב זה צעד משמעותי בשמירה על האיזון שלך. אני שומר את זה כאן בבטחה עבורנו.",
  default:
    "שלום, אני כאן אם תרצה לשוחח או לכתוב. קח את הזמן שלך.",
};

function getContextFromPath(pathname: string): AgentContext {
  if (pathname.includes("/chat")) return "writing";
  if (pathname.includes("/summary")) return "weekly";
  if (pathname.includes("/monthly")) return "monthly";
  if (pathname.includes("/dashboard")) return "default";
  return "default";
}

interface AgentCharacterProps {
  context?: AgentContext;
  customMessage?: string;
}

const AgentCharacter = ({ context, customMessage }: AgentCharacterProps) => {
  const location = useLocation();
  const [showBubble, setShowBubble] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const resolvedContext = context ?? getContextFromPath(location.pathname);
  const message = customMessage ?? AGENT_MESSAGES[resolvedContext];

  // Show bubble after a short delay when context changes
  useEffect(() => {
    setDismissed(false);
    setShowBubble(false);
    const timer = setTimeout(() => setShowBubble(true), 1200);
    return () => clearTimeout(timer);
  }, [resolvedContext]);

  const handleDismiss = useCallback(() => {
    setShowBubble(false);
    setDismissed(true);
  }, []);

  const handleCharacterTap = useCallback(() => {
    if (dismissed || !showBubble) {
      setDismissed(false);
      setShowBubble(true);
    } else {
      setMinimized((v) => !v);
    }
  }, [dismissed, showBubble]);

  return (
    <div className="fixed bottom-20 left-3 z-50 flex flex-col items-start gap-2 pointer-events-none md:bottom-6 md:left-6">
      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="pointer-events-auto relative max-w-[260px] md:max-w-[300px]"
          >
            <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
              <button
                onClick={handleDismiss}
                className="absolute top-2 left-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="סגור"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p
                className="text-sm leading-relaxed text-foreground pr-1 pt-1"
                dir="rtl"
                style={{ fontFamily: "'Assistant', 'Heebo', sans-serif" }}
              >
                {message}
              </p>
            </div>
            {/* Bubble tail */}
            <div className="absolute -bottom-2 left-6 w-4 h-4 bg-card/95 border-b border-l border-border rotate-[-45deg] rounded-bl-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character */}
      <motion.button
        onClick={handleCharacterTap}
        initial={{ opacity: 0, scale: 0.5, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden shadow-xl border-2 border-primary/20 bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="הפסיכולוג הדיגיטלי"
      >
        <img
          src={agentImg}
          alt="הפסיכולוג הדיגיטלי"
          className="w-full h-full object-cover object-top"
          style={{
            // Mask out white background
            mixBlendMode: "multiply",
          }}
          draggable={false}
        />
        {/* Subtle pulse ring when bubble is hidden */}
        {dismissed && (
          <span className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
        )}
      </motion.button>
    </div>
  );
};

export default AgentCharacter;
export type { AgentContext };
