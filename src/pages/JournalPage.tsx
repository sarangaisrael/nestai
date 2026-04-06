import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/AppHeader";
import BackButton from "@/components/BackButton";
import SilentJournal from "@/components/SilentJournal";

const JournalPage = () => {
  const { dir } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <AppHeader />
      <div className="px-4 pt-3">
        <BackButton />
      </div>
      <div className="flex-1 overflow-y-auto">
        <SilentJournal />
      </div>
    </div>
  );
};

export default JournalPage;
