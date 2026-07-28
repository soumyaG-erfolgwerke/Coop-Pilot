"use client";

// src/components/ProtectedRoute.jsx
import { usePathname } from "next/navigation";
import NotFoundPage from "./NotFoundPage";
import AdminPage from "./AdminPage";
import SuperAdminPage from "./SuperAdminPage";
import MemberPage from "./MemberPage";
import { useAuth } from "../hooks/useAuth";
import GovAuditorPage from "./GovAuditerPage";
import SubAuditerPage from './SubAuditerPage.jsx';
import OrgAdminPage from "./OrgAdminPage";
import AuditorPage from "./AuditorPage";
import SubAuditorPage from "./SubAuditorPage";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  // console.log(user)

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <NotFoundPage/>;
  }else{
    if(user.role==='coopadmin'){ return <AdminPage/>}
    else if(user.role==='superuser'){ return <SuperAdminPage/>}
    else if(user.role==='member'){ return <MemberPage/>}
    else if(user.role==='org_admin'){ return <OrgAdminPage/>}
    else if(user.role==='auditer'){ return <AuditorPage />} // TODO: Change to Auditor aligned component
    else if(user.role==='aud_E'){ return <SubAuditorPage/>}
    else { return <NotFoundPage/>}
  }
}
