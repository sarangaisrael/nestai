import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { startOfWeek } from "date-fns";

interface Question {
  id: string;
  text: string;
  answers: string[];
}

const questions: Question[] = [
  {
    id: "q1",
    text: "איך השבוע הזה הרגיש ביחס לשבוע הקודם?",
    answers: [
      "הרבה פחות טוב",
      "קצת פחות טוב",
      "בערך אותו דבר",
      "קצת יותר טוב",
      "הרבה יותר טוב"
    ]
  },
  {
    id: "q2",
    text: "כמה עומס הרגשת השבוע?",
    answers: [
      "כמעט ולא",
      "נמוך",
      "בינוני",
      "גבוה",
      "גבוה מאוד"
    ]
  },
  {
    id: "q3",
    text: "עד כמה היה לך ברור מה עובר עליך השבוע?",
    answers: [
      "בכלל לא",
      "מעט",
      "חלקית",
      "די ברור",
      "מאוד ברור"
    ]
  },
  {
    id: "q4",
    text: "כשהיה קשה, עד כמה הרגשת שיש לך דרך להתמודד?",
    answers: [
      "לא הייתה לי דרך",
      "בקושי",
      "לפעמים כן לפעמים לא",
      "ברוב הזמן כן",
      "כן, באופן יציב"
    ]
  },
  {
    id: "q5",
    text: "מה הכי קרוב לתאר את התחושה שלך השבוע?",
    answers: [
      "תקוע",
      "דורך במקום",
      "מתנדנד",
      "בתנועה איטית קדימה",
      "בתנועה ברורה קדימה"
    ]
  },
  {
    id: "q6",
    text: "איך אתה מסתכל על השבוע הקרוב?",
    answers: [
      "בחשש",
      "בזהירות",
      "ניטרלי",
      "בתקווה",
      "באופטימיות"
    ]
  }
];

export function WeeklyQuestionnaire() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkIfShouldShow();
  }, []);

  const getWeekStart = () => {
    // Get start of current week (Sunday)
    return startOfWeek(new Date(), { weekStartsOn: 0 });
  };

  const checkIfShouldShow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekStart = getWeekStart().toISOString();

      // Check if there's a new unviewed weekly summary
      const { data: unviewedSummary } = await supabase
        .from("weekly_summaries")
        .select("id, week_start")
        .eq("user_id", user.id)
        .is("viewed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Only show questionnaire if there's an unviewed summary
      if (!unviewedSummary) {
        return;
      }

      // Check if questionnaire already completed this week
      const { data: existing } = await supabase
        .from("weekly_questionnaires")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .maybeSingle();

      if (!existing) {
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Error checking questionnaire status:", error);
    }
  };

  const handleAnswerChange = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex + 1 // Store 1-5 instead of 0-4
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast({
        title: "יש לענות על כל השאלות",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const weekStart = getWeekStart().toISOString();

      const { error } = await supabase
        .from("weekly_questionnaires")
        .insert({
          user_id: user.id,
          week_start: weekStart,
          q1_feeling_vs_last_week: answers.q1,
          q2_stress_level: answers.q2,
          q3_clarity: answers.q3,
          q4_coping_ability: answers.q4,
          q5_weekly_feeling: answers.q5,
          q6_next_week_outlook: answers.q6
        });

      if (error) throw error;

      toast({
        title: "תודה על מילוי השאלון",
        description: "התשובות נשמרו בהצלחה"
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      toast({
        title: "שגיאה בשמירת השאלון",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentStep === questions.length - 1;
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md mx-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-medium">
            שאלון שבועי
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            שאלה {currentStep + 1} מתוך {questions.length}
          </p>
        </DialogHeader>

        <div className="py-4">
          <h3 className="text-base font-medium mb-4 text-center">
            {currentQuestion.text}
          </h3>

          <RadioGroup
            value={currentAnswer?.toString()}
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value) - 1)}
            className="space-y-3"
          >
            {currentQuestion.answers.map((answer, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleAnswerChange(currentQuestion.id, index)}
              >
                <RadioGroupItem value={(index + 1).toString()} id={`${currentQuestion.id}-${index}`} />
                <Label
                  htmlFor={`${currentQuestion.id}-${index}`}
                  className="flex-1 cursor-pointer text-sm"
                >
                  {answer}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-between gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            הקודם
          </Button>
          
          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
            >
              {isSubmitting ? "שומר..." : "סיום"}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!currentAnswer}
            >
              הבא
            </Button>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-1 pt-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? "bg-primary"
                  : answers[questions[index].id]
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
