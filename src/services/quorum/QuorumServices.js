import { fetchCooperativeSettings } from "@/lib/cooperativeSettingsService";

export const getQuorumSettingsByCoopId = async (coopId) => {
  try {
    if (!coopId) {
      throw new Error("coopId is required");
    }

    const settings = await fetchCooperativeSettings(coopId);

    const quorumTypeSetting = settings?.quorum_type;
    const quorumThresholdSetting = settings?.quorum_threshold_percent;

    return { quorumTypeSetting, quorumThresholdSetting };
  } catch (error) {
    console.error("Error fetching quorum settings:", error);
    throw new Error(error.message || "Failed to fetch quorum settings");
  }
};

export const UpdateQuorumOfAssembly = async (assemblyId, quorumValue, isQuorumMet) => {
  try {
    if (!assemblyId) {
      throw new Error("assemblyId is required");
    }
    if (
      typeof quorumValue !== "number" ||
      quorumValue < 0 ||
      quorumValue > 100
    ) {
      throw new Error("Invalid quorum percentage");
    }

    // Call the API to update the settings
    // const response = await updateQuorum(assemblyId, quorumValue);
    const response = await fetch(
      `/api/assembly/${encodeURIComponent(assemblyId)}/quorumUpdate`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quorumValue, isQuorumMet }),
      },
    );
    if (!response.ok) {
      console.error("Failed to update quorum");
    } 
    // else {
    //   const data = await response.json();
    //   console.log("Quorum update response:", data);
    // }
    // // console.log("API Quorum Service Response:", response.updatedQuorum);

    return await response.updatedQuorum;
  } catch (error) {
    console.error("Error updating quorum settings:", error);
    throw new Error(error.message || "Failed to update quorum settings");
  }
};
