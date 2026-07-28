"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NotFoundPage from "./NotFoundPage";
import AuditPage from "./AuditPage";
import ReviewAuditPage from "./ReviewAuditPage";
import { useAuth } from "../hooks/useAuth";
import { getCoopAdmins } from "../lib/getCoopsService";
import FormSkeleton from "@/components/formRender/FormSkeleton";
import { AlertCircle } from "lucide-react";

const ProtectedCoopAuditRoute = () => {
  const params = useParams();
  const coopId = params?.coopId;

  const { user, isLoading, loading } = useAuth();

  const isAuthLoading =
    isLoading === true || loading === true || typeof user === "undefined";

  const [isAuthorized, setIsAuthorized] = useState(null); // null = loading, true = ok, false = denied

  useEffect(() => {
    setIsAuthorized(null);
  }, [coopId]);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (!user) return;

      if (user.role === "auditer" || user.role === "aud_E") {
        setIsAuthorized(true);
        return;
      }

      if (user.role === "coopadmin") {
        try {
          const coops = await getCoopAdmins(user.email);
          const hasAccess = coops.some((coop) => coop.id === coopId);
          setIsAuthorized(hasAccess);
        } catch (error) {
          console.error("Error fetching coops:", error);
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(false);
      }
    };

    if (!isAuthLoading) {
      checkAuthorization();
    }
  }, [user, coopId, isAuthLoading]);

  if (isAuthLoading) {
    return <FormSkeleton />;
  }

  // 2. Auth has resolved, and there is no user logged in
  if (!user) return <NotFoundPage />;

  // 3. Auditors skip the complex DB coop check and render their view
  if (
    user.role === "auditer" ||
    user.role === "aud_E" ||
    user.role === "org_admin"
  ) {
    // return <ReviewAuditPage coopId={coopId} />;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-bold bg-slate-50 dark:bg-slate-950 text-slate-500">
        <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
        <p className="text-xl">Oops! No data found.</p>
      </div>
    );
  }

  // 4. For coopadmins, wait for the database validation to finish
  if (isAuthorized === null) {
    return <FormSkeleton />;
  }

  // 5. Final render based on database authorization
  if (isAuthorized) {
    return <AuditPage coopId={coopId} />;
  } else {
    return <NotFoundPage />;
  }
};

export default ProtectedCoopAuditRoute;
