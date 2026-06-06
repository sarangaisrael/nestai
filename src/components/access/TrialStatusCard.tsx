// Trial status card removed — no longer shown to users.
import type { AccessState } from "@/lib/accessControl";

type TrialStatusCardProps = {
  accessState: AccessState;
  className?: string;
};

const TrialStatusCard = (_props: TrialStatusCardProps) => null;
export default TrialStatusCard;
