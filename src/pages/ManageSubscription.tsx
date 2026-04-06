import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Crown, Shield, Loader2, AlertTriangle, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import AppHeader from '@/components/AppHeader';

const tierLabels: Record<string, { he: string; en: string }> = {
  free: { he: 'ללא מנוי', en: 'No subscription' },
  basic: { he: 'בסיס', en: 'Basic' },
  premium: { he: 'מתקדם', en: 'Premium' },
};

const tierPrices: Record<string, string> = {
  basic: '₪20/חודש',
  premium: '₪45/חודש',
};

export default function ManageSubscription() {
  const navigate = useNavigate();
  const { tier, isSubscribed, loading, refetch } = useSubscription();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      const { error } = await supabase.functions.invoke('paypal-cancel-subscription');
      if (error) throw error;
      toast.success('המנוי בוטל בהצלחה');
      refetch();
    } catch (err) {
      console.error('Cancel error:', err);
      toast.error('שגיאה בביטול המנוי. נסה שוב או פנה לתמיכה.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader />

      <div className="max-w-lg mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 gap-2">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Button>

          <h1 className="text-2xl font-bold text-foreground mb-6">ניהול מנוי</h1>

          <Card className="border-2 border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  המנוי שלך
                </CardTitle>
                {isSubscribed ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    פעיל
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    לא פעיל
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {isSubscribed ? (
                <>
                  <div className="bg-muted/50 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">תוכנית</span>
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Crown className="h-4 w-4 text-primary" />
                        {tierLabels[tier]?.he || tier}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">מחיר</span>
                      <span className="font-semibold text-foreground">{tierPrices[tier] || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">תשלום</span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" />
                        PayPal
                      </span>
                    </div>
                  </div>

                  {/* Upgrade prompt hidden during free launch */}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5">
                        בטל מנוי
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          ביטול מנוי
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                          האם אתה בטוח שברצונך לבטל את המנוי? תאבד גישה לפיצ'רים המתקדמים.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogCancel>חזור</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancel}
                          disabled={isCancelling}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isCancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'כן, בטל את המנוי'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <Crown className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">אין מנוי פעיל</p>
                    <p className="text-sm text-muted-foreground">בחר חבילה כדי לפתוח את כל התכנים</p>
                  </div>
                  <Button onClick={() => navigate('/app/pricing')} className="gap-2">
                    <Crown className="h-4 w-4" />
                    צפה בחבילות
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
