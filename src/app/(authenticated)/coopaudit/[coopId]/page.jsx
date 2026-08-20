import ProtectedCoopAuditRoute from "@/pages/ProtectedCoopAuditRoute";

export const metadata = {
  title: "Cooperative Audit - EasyCoop",
  description: "Audit cooperative details",
};

export default function CoopAudit() {
  return <ProtectedCoopAuditRoute />;
}
