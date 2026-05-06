import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Sidebar from "@/components/dashboard/Sidebar";

/**
 * AppLayout — wraps every authenticated page.
 * Desktop (≥768px): fixed 220px sidebar on the inline-start edge (right in RTL, left in LTR)
 *                   + matching margin on the content area so nothing is hidden.
 * Mobile:           no sidebar; pages render their own BottomTabBar as usual.
 */

const CSS = `
  .app-sidebar-fixed {
    display: none;
  }
  @media (min-width: 768px) {
    .app-sidebar-fixed {
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 56px;
      inset-inline-start: 0;
      width: 220px;
      height: calc(100vh - 56px);
      background: #ffffff;
      border-inline-end: 0.5px solid #e2e8f0;
      overflow-y: auto;
      padding: 20px 16px;
      box-sizing: border-box;
      z-index: 40;
    }
    .app-layout-content {
      margin-inline-start: 220px;
    }
  }
`;

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { dir } = useLanguage();

  return (
    <div dir={dir}>
      <style>{CSS}</style>

      {/* Sidebar — desktop only, fixed */}
      <div className="app-sidebar-fixed">
        <Sidebar />
      </div>

      {/* Page content — offset by sidebar width on desktop */}
      <div className="app-layout-content">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
