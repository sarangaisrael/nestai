import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ComparisonItem {
  label: string;
  current: number;
  previous: number;
  higherIsBetter?: boolean;
}

interface MonthComparisonProps {
  items: ComparisonItem[];
  isRTL?: boolean;
}

export const MonthComparison = ({ items, isRTL = false }: MonthComparisonProps) => {
  const getChange = (current: number, previous: number, higherIsBetter = true): { percent: number; direction: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) return { percent: 0, direction: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    const direction: 'up' | 'down' | 'neutral' = Math.abs(change) < 5 ? 'neutral' : change > 0 ? 'up' : 'down';
    return { percent: Math.round(Math.abs(change)), direction };
  };

  const getColor = (direction: 'up' | 'down' | 'neutral', higherIsBetter: boolean) => {
    if (direction === 'neutral') return 'text-muted-foreground';
    const isPositive = direction === 'up' ? higherIsBetter : !higherIsBetter;
    return isPositive ? 'text-green-500' : 'text-red-500';
  };

  const getBgColor = (direction: 'up' | 'down' | 'neutral', higherIsBetter: boolean) => {
    if (direction === 'neutral') return 'bg-muted';
    const isPositive = direction === 'up' ? higherIsBetter : !higherIsBetter;
    return isPositive ? 'bg-green-500/10' : 'bg-red-500/10';
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const { percent, direction } = getChange(item.current, item.previous, item.higherIsBetter);
        const colorClass = getColor(direction, item.higherIsBetter !== false);
        const bgClass = getBgColor(direction, item.higherIsBetter !== false);

        return (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-foreground">{item.label}</span>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${bgClass}`}>
              {direction === 'up' ? (
                <TrendingUp className={`h-3.5 w-3.5 ${colorClass}`} />
              ) : direction === 'down' ? (
                <TrendingDown className={`h-3.5 w-3.5 ${colorClass}`} />
              ) : (
                <Minus className={`h-3.5 w-3.5 ${colorClass}`} />
              )}
              <span className={`text-xs font-medium ${colorClass}`}>
                {direction === 'neutral' 
                  ? (isRTL ? 'יציב' : 'Stable')
                  : `${direction === 'up' ? '+' : '-'}${percent}%`
                }
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MonthComparison;
