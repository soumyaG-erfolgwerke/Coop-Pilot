import React from "react";
import { useAuth } from "@/hooks/useAuth";
import Audit from "../orgadmin/Audit";

const AuditorAudit = () => {
  const { user } = useAuth();
  return <Audit user={user} />;
};

export default AuditorAudit;
