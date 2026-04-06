import { useMemo } from "react";

interface WordCloudProps {
  words: { word: string; count: number }[];
  maxFontSize?: number;
  minFontSize?: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#7cb3ff',
];

export const WordCloud = ({ words, maxFontSize = 32, minFontSize = 12 }: WordCloudProps) => {
  const processedWords = useMemo(() => {
    if (!words || words.length === 0) return [];
    
    const maxCount = Math.max(...words.map(w => w.count));
    const minCount = Math.min(...words.map(w => w.count));
    const range = maxCount - minCount || 1;

    return words.map((w, index) => ({
      ...w,
      fontSize: minFontSize + ((w.count - minCount) / range) * (maxFontSize - minFontSize),
      color: COLORS[index % COLORS.length],
      rotation: Math.random() > 0.7 ? (Math.random() > 0.5 ? 10 : -10) : 0,
    }));
  }, [words, maxFontSize, minFontSize]);

  if (processedWords.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap justify-center items-center gap-3 p-4 min-h-[200px]">
      {processedWords.map((word, index) => (
        <span
          key={`${word.word}-${index}`}
          className="inline-block transition-all hover:scale-110 cursor-default font-medium"
          style={{
            fontSize: `${word.fontSize}px`,
            color: word.color,
            transform: `rotate(${word.rotation}deg)`,
            opacity: 0.7 + (word.count / (Math.max(...words.map(w => w.count)) || 1)) * 0.3,
          }}
        >
          {word.word}
        </span>
      ))}
    </div>
  );
};

export default WordCloud;
