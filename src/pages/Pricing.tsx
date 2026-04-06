import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Crown, Sparkles, FileText, Archive, BarChart3, Loader2, MessageCircle, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlanConfig {
  name: string;
  nameEn: string;
  price: string;
  period: string;
  tier: string;
  planId: string;
  features: { icon: any; text: string }[];
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function Pricing() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const [planIds, setPlanIds] = useState<{ basic: string; premium: string }>({ basic: '', premium: '' });
  const basicButtonRef = useRef<HTMLDivElement>(null);
  const premiumButtonRef = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);

  const basicPlan: PlanConfig = {
    name: 'בסיס',
    nameEn: 'Basic',
    price: '₪20',
    period: '/ לחודש',
    tier: 'basic',
    planId: planIds.basic,
    features: [
      { icon: MessageCircle, text: 'צ\'אט ללא הגבלה' },
      { icon: FileText, text: 'סיכומים שבועיים' },
      { icon: Headphones, text: 'גישה למדיטציות מונחות' },
    ],
  };

  const premiumPlan: PlanConfig = {
    name: 'מתקדם',
    nameEn: 'Premium',
    price: '₪45',
    period: '/ לחודש',
    tier: 'premium',
    planId: planIds.premium,
    features: [
      { icon: MessageCircle, text: 'צ\'אט ללא הגבלה' },
      { icon: FileText, text: 'סיכומים שבועיים' },
      { icon: Headphones, text: 'גישה למדיטציות מונחות' },
      { icon: BarChart3, text: 'דו"ח מגמות חודשי (זיהוי דפוסים)' },
      { icon: Archive, text: 'ייצוא PDF מסודר למטפל' },
    ],
  };

  // Fetch PayPal config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('paypal-get-client-id');
        if (error) throw error;
        setPaypalClientId(data.client_id);
        setPlanIds({ basic: data.plan_id_basic, premium: data.plan_id_premium });
      } catch (err) {
        console.error('Failed to get PayPal config:', err);
        toast.error('שגיאה בטעינת מערכת התשלום');
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Load PayPal SDK with vault and intent=subscription
  useEffect(() => {
    if (!paypalClientId || !planIds.basic) return;
    const existingScript = document.querySelector('script[data-paypal-sdk]');
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=ILS&vault=true&intent=subscription`;
    script.setAttribute('data-paypal-sdk', 'true');
    script.async = true;
    script.onload = () => setIsLoading(false);
    script.onerror = () => {
      toast.error('שגיאה בטעינת PayPal');
      setIsLoading(false);
    };
    document.head.appendChild(script);
    return () => {
      const s = document.querySelector('script[data-paypal-sdk]');
      if (s) s.remove();
    };
  }, [paypalClientId, planIds]);

  // Render PayPal subscription buttons
  const renderButtons = useCallback(() => {
    if (buttonsRendered.current || isLoading || !window.paypal || !planIds.basic) return;
    buttonsRendered.current = true;

    const renderForPlan = (plan: PlanConfig, container: HTMLDivElement | null) => {
      if (!container || !plan.planId) return;
      window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'subscribe', height: 45 },
        createSubscription: (_data: any, actions: any) => {
          return actions.subscription.create({
            plan_id: plan.planId,
          });
        },
        onApprove: async (data: any) => {
          try {
            const { error } = await supabase.functions.invoke('paypal-verify-payment', {
              body: { subscription_id: data.subscriptionID, tier: plan.tier },
            });
            if (error) throw error;
            toast.success('🎉 המנוי הופעל בהצלחה! ברוכים הבאים למשפחה', {
              duration: 4000,
              icon: '🥳',
              style: { fontSize: '16px', padding: '16px' },
            });
            setTimeout(() => navigate('/app/dashboard'), 2000);
          } catch (err) {
            console.error('Subscription verification error:', err);
            toast.error('שגיאה באימות המנוי. פנה לתמיכה.');
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          toast.error('שגיאה בתשלום. נסה שוב.');
        },
        onCancel: () => toast.info('התשלום בוטל'),
      }).render(container);
    };

    renderForPlan(basicPlan, basicButtonRef.current);
    renderForPlan(premiumPlan, premiumButtonRef.current);
  }, [isLoading, navigate, planIds, basicPlan, premiumPlan]);

  useEffect(() => {
    renderButtons();
  }, [renderButtons]);

  const PlanCard = ({ plan, buttonRef, featured }: { plan: PlanConfig; buttonRef: React.RefObject<HTMLDivElement>; featured?: boolean }) => (
    <motion.div
      className={`relative rounded-2xl ${featured ? 'p-[1px] bg-gradient-to-br from-primary via-secondary to-accent' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: featured ? 0.35 : 0.2 }}
    >
      {featured && (
        <Badge className="absolute -top-3 right-6 bg-secondary text-secondary-foreground border-0 px-3 py-1 text-xs font-semibold shadow-md z-10">
          הכי פופולרי ⭐
        </Badge>
      )}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        {featured && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-60" />}
        <h3 className="text-lg font-semibold text-foreground mb-1">{plan.name}</h3>
        <div className="flex items-baseline gap-1 mb-6">
          <span className={`text-3xl font-bold ${featured ? 'text-primary' : 'text-foreground'}`}>{plan.price}</span>
          <span className="text-sm text-muted-foreground">{plan.period}</span>
        </div>

        <ul className="space-y-3.5 mb-8">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${featured ? 'bg-primary/10' : 'bg-muted'} flex items-center justify-center shrink-0`}>
                <f.icon className={`h-4 w-4 ${featured ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-sm ${featured ? 'text-foreground' : 'text-muted-foreground'}`}>{f.text}</span>
            </li>
          ))}
        </ul>

        <div className="min-h-[55px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-3 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">טוען מערכת תשלום...</span>
            </div>
          ) : (
            <div ref={buttonRef} />
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>מנוי חודשי מתחדש • ניתן לבטל בכל עת</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 pb-12">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 gap-2">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Button>
        </motion.div>

        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">בחר את החבילה שמתאימה לך</h1>
          <p className="text-muted-foreground text-base leading-relaxed">כל הכלים כדי להפוך את הכתיבה לתובנות משנות חיים</p>
        </motion.div>

        <div className="space-y-5">
          <PlanCard plan={basicPlan} buttonRef={basicButtonRef} />
          <PlanCard plan={premiumPlan} buttonRef={premiumButtonRef} featured />
        </div>

        <motion.p
          className="text-center text-xs text-muted-foreground mt-8 leading-relaxed px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          מנוי חודשי מתחדש. ניתן לבטל בכל עת דרך חשבון PayPal.
        </motion.p>
      </div>
    </div>
  );
}
