import {
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_CURRENT_AUDIT_FORM,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";
import { Query } from "appwrite";

const { databases } = createAdminClient();

export const startAuditorService = async (coopId, formType, orgId) => {
  const currentAuditData = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_CURRENT_AUDIT_FORM,
    [
      Query.equal("orgId", orgId),
      Query.equal("auditType", formType),
      Query.orderDesc("$createdAt"),
      Query.select(["*", "auditForms", "auditForms.*"]),
      Query.limit(1),
    ],
  );

  const auditTemplateData = currentAuditData.documents[0]?.auditForms || null;

  if (!currentAuditData.documents[0]) {
    throw new Error(
      "No current audit form found for the given organization and type.",
    );
  }

  // const auditTemplate = JSON.parse(auditTemplateData.template);
  // console.log("auditTemplateData", auditTemplateData);

  const setAuditTemplate = await databases.updateDocument(
    DATABASE_ID,
    COLLECTION_ID_COOPERATIVES,
    coopId,
    {
      auditJson: auditTemplateData.template,
      auditFormId: auditTemplateData.$id,
      auditStatus: "START",
    },
  );
  // console.log("setAuditTemplate", setAuditTemplate);

  return stripInternalFields(setAuditTemplate);
};
