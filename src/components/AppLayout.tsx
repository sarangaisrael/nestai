import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

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
      width: 200px;
      height: calc(100vh - 56px);
      background: #ffffff;
      border-inline-end: 0.5px solid #e5e7eb;
      overflow-y: auto;
      padding: 0;
      box-sizing: border-box;
      z-index: 40;
    }
    .app-layout-content {
      margin-inline-start: 200px;
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
        <DashboardSidebar />
      </div>

      {/* Page content — offset by sidebar width on desktop */}
      <div className="app-layout-content">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
