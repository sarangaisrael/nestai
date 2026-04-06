import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Language, languageNames } from '@/lib/translations';

interface LanguageSwitcherProps {
  variant?: 'icon' | 'full';
  className?: string;
}

export const LanguageSwitcher = ({ variant = 'icon', className }: LanguageSwitcherProps) => {
  const { language, setLanguage, t } = useLanguage();

  const languages: Language[] = ['he', 'en'];

  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={className}>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`cursor-pointer ${language === lang ? 'bg-muted' : ''}`}
            >
              {languageNames[lang]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-foreground">
        {t.settings.selectLanguage}
      </label>
      <div className="flex gap-2">
        {languages.map((lang) => (
          <Button
            key={lang}
            variant={language === lang ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage(lang)}
          >
            {languageNames[lang]}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;