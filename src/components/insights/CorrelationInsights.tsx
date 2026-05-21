import { AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";

interface Correlation {
  type: 'warning' | 'insight' | 'positive';
  text: string;
}

interface CorrelationInsightsProps {
  correlations: Correlation[];
}

export const CorrelationInsights = ({ correlations }: CorrelationInsightsProps) => {
  const getIcon = (type: Correlation['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />;
      case 'insight':
        return <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />;
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />;
    }
  };

  const getBgClass = (type: Correlation['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-orange-500/10 border-orange-500/20';
      case 'insight':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'positive':
        return 'bg-green-500/10 border-green-500/20';
    }
  };

  if (!correlations || correlations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {correlations.map((correlation, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 p-3 rounded-lg border ${getBgClass(correlation.type)}`}
        >
          {getIcon(correlation.type)}
          <p className="text-sm text-foreground leading-relaxed">{correlation.text}</p>
        </div>
      ))}
    </div>
  );
};

export default CorrelationInsights;
