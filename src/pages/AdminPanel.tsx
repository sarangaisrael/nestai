import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface UserRow {
  user_id: string;
  email: string;
  registered_at: string;
  plan: string;
  is_active: boolean;
  expires_at: string | null;
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("he-IL") : "—";

const planLabel = (plan: string, is_active: boolean, expires_at: string | null) => {
  if (!is_active) return { text: "מבוטל", color: "#dc2626" };
  if (plan === "monthly") return { text: "חודשי ✓", color: "#16a34a" };
  if (plan === "yearly")  return { text: "שנתי ✓",  color: "#16a34a" };
  if (plan === "trial") {
    const expired = expires_at && new Date(expires_at) < new Date();
    return expired
      ? { text: "Trial פג", color: "#dc2626" }
      : { text: "Trial",    color: "#d97706" };
  }
  return { text: "אין", color: "#94a3b8" };
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const [users, setUsers]     = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/app/auth", { replace: true }); return; }

      // Client-side gate: silent redirect if not admin
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });
      if (!isAdmin) { navigate("/app/dashboard", { replace: true }); return; }

      await fetchUsers();
    };
    init();
  }, [navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    // Server-side gate: RPC raises exception if caller is not admin
    const { data, error } = await supabase.rpc("admin_get_users_with_subscriptions");
    if (error) { navigate("/app/dashboard", { replace: true }); return; }
    setUsers((data as UserRow[]) ?? []);
    setLoading(false);
  };

  const approve = async (userId: string, email: string) => {
    setApproving(userId);
    const { error } = await supabase.rpc("admin_approve_subscription", {
      p_target_user_id: userId,
    });
    if (error) {
      showToast(`שגיאה: ${error.message}`, false);
    } else {
      showToast(`מנוי אושר עבור ${email}`, true);
      await fetchUsers();
    }
    setApproving(null);
  };

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.ok ? "#16a34a" : "#dc2626" }}>
          {toast.msg}
        </div>
      )}

      <div style={styles.wrap}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.h1}>Admin Panel</h1>
            <p style={styles.sub}>{users.length} משתמשים רשומים</p>
          </div>
          <button onClick={fetchUsers} style={styles.refreshBtn}>↻ רענן</button>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["אימייל", "הרשמה", "סטטוס", "תפוגה", "פעולה"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const { text, color } = planLabel(u.plan, u.is_active, u.expires_at);
                const canApprove = u.plan !== "monthly" && u.plan !== "yearly";
                return (
                  <tr key={u.user_id} style={styles.tr}>
                    <td style={styles.td}>{u.email}</td>
                    <td style={{ ...styles.td, color: "#64748b" }}>{fmt(u.registered_at)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, color, borderColor: color }}>
                        {text}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: "#64748b" }}>{fmt(u.expires_at)}</td>
                    <td style={styles.td}>
                      {canApprove && (
                        <button
                          onClick={() => approve(u.user_id, u.email)}
                          disabled={approving === u.user_id}
                          style={{
                            ...styles.approveBtn,
                            opacity: approving === u.user_id ? 0.6 : 1,
                          }}
                        >
                          {approving === u.user_id ? "..." : "אשר מנוי"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", background: "#f8fafc",
    fontFamily: "'Heebo', sans-serif", direction: "rtl",
  },
  center: {
    minHeight: "100vh", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  spinner: {
    width: 36, height: 36, borderRadius: "50%",
    border: "3px solid #e2e8f0", borderTopColor: "#6366f1",
    animation: "spin 0.8s linear infinite",
  },
  wrap: { maxWidth: 960, margin: "0 auto", padding: "40px 24px" },
  header: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", marginBottom: 28,
  },
  h1: { fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 },
  sub: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  refreshBtn: {
    background: "white", border: "1px solid #e2e8f0",
    borderRadius: 8, padding: "7px 14px", fontSize: 13,
    cursor: "pointer", color: "#475569",
  },
  tableWrap: {
    background: "white", borderRadius: 16,
    border: "1px solid #e2e8f0", overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 16px", textAlign: "right",
    fontSize: 12, fontWeight: 700, color: "#64748b",
    background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 16px", fontSize: 13, color: "#1e293b" },
  badge: {
    display: "inline-block", padding: "2px 8px",
    borderRadius: 20, fontSize: 11, fontWeight: 700,
    border: "1.5px solid",
  },
  approveBtn: {
    background: "#6366f1", color: "white", border: "none",
    borderRadius: 8, padding: "5px 12px", fontSize: 12,
    fontWeight: 700, cursor: "pointer",
  },
  toast: {
    position: "fixed", top: 20, left: "50%",
    transform: "translateX(-50%)", zIndex: 100,
    padding: "10px 20px", borderRadius: 10,
    color: "white", fontSize: 13, fontWeight: 600,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
};

export default AdminPanel;
