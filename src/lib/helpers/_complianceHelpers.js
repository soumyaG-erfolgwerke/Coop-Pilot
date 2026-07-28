const gradeCategory = (grade) => {
  if (grade === 100)
    return {
      color: "green",
      label: "Good",
      text: "All Met",
    };
  if (grade > 60)
    return {
      color: "teal",
      label: "Fair",
      text: "Most Met",
    };
  if (grade > 40)
    return {
      color: "yellow",
      label: "Average",
      text: "Some Met",
    };
  if (grade > 20)
    return {
      color: "orange",
      label: "Poor",
      text: "Few Met",
    };
  return {
    color: "darkred",
    label: "Critical",
    text: "None Met",
  };
};

export const calculateComplianceGrade = (complianceResults) => {
  const totalChecks = complianceResults.length;
  if (totalChecks === 0) {
    return { grade: 0, color: "darkred", label: "Critical", text: "None Met" };
  }
  const passedChecks = complianceResults.filter((check) => check.result).length;
  const grade = (passedChecks / totalChecks) * 100;
  const { color, label, text } = gradeCategory(grade);
  return { grade, color, label, text };
};

export const getComplianceInfoByCoopId = async (coopId) => {
  try {
    const res = await fetch(`/api/compliance/${coopId}`);
    const data = await res.json();
    return {
      success: res.ok,
      details: data.details || [],
      result: data.result || null,
      // lastChecked: data.lastChecked || null,
      assemblyInfo: data.assemblyInfo || {
        upcomingAssemblyCount: 0,
        totalAssemblyCount: 0,
      },
      docsCount: data.docsCount || 0,
      governanceCount: data.governanceCount || 0,
    };
  } catch (error) {
    console.error("Error checking compliance:", error);
    return {
      success: false,
      message: "Error checking compliance",
    };
  }
};
