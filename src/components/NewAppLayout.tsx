import type { ReactNode } from "react";
import BottomNav from "./BottomNav";

interface Props {
  children: ReactNode;
}

const NewAppLayout = ({ children }: Props) => (
  <div dir="rtl" style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "'Heebo', sans-serif" }}>
    <div style={{ paddingBottom: "calc(58px + env(safe-area-inset-bottom, 0px))" }}>
      {children}
    </div>
    <BottomNav />
  </div>
);

export default NewAppLayout;
