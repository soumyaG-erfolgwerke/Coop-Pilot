import ProtectedCoopAuditRoute from "@/pages/ProtectedCoopAuditRoute";

export const metadata = {
  title: "Cooperative Audit - EasyCoop",
  description: "Audit cooperative details",
};

export default function CoopAudit({ params }) {
  return <ProtectedCoopAuditRoute params={params} />;
  // TODO: ASKED_TO_RESUBMIT, VERIFIED, or REJECTED -> block access from auditors
}
