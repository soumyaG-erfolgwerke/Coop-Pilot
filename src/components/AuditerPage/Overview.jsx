import React from "react";
import KPICards from "../orgadmin/KPICards";
import AuditLogs from "../orgadmin/AuditLogs";


const OverviewView = ({ auditOrg }) => {
  return (
    <div>
      <KPICards auditOrgId={auditOrg?.id} />
      {auditOrg && <AuditLogs auditOrgId={auditOrg.id} />}
    </div>
  );
};

export default OverviewView;
