import React from "react";
import KPICards from "./KPICards";
import AuditLogs from "./AuditLogs";
import { useAuth } from "@/hooks/useAuth";
import AuditorStats from "./AuditorStats";

const OverviewView = ({ auditOrg }) => {
  return (
    <div>
      <KPICards auditOrgId={auditOrg?.id} />
      {auditOrg && <AuditorStats auditOrgId={auditOrg?.id} />}
      {auditOrg && <AuditLogs auditOrgId={auditOrg.id} />}
    </div>
  );
};

export default OverviewView;
