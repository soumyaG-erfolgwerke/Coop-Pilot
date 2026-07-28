import { getTotalMembersOfCoop } from "@/lib/getMembersDetails";
import { fetchAllAttendiesInAssembly } from "../attendence/AttendenceServices";
import { getQuorumSettingsByCoopId } from "./QuorumServices";

export default async function calculateQuorum(assembly) {
  const assemblyId = assembly.id;
  const coopId = assembly.coopId;
  const { quorumTypeSetting, quorumThresholdSetting } =
    await getQuorumSettingsByCoopId(coopId);
  if (quorumTypeSetting === "ANTEILSBASIERT") {
    return calculateQuorumByAttendance(
      assemblyId,
      coopId,
      quorumThresholdSetting,
    );
  } else {
    return calculateQuorumByShares(assemblyId, quorumThresholdSetting);
  }
}

export const calculateQuorumByAttendance = async (
  assemblyId,
  coopId,
  quorumThresholdSetting,
) => {
  const totalMembers = await getTotalMembersOfCoop(coopId);

  const present = await fetchAllAttendiesInAssembly(assemblyId, "present");
  const proxy = await fetchAllAttendiesInAssembly(assemblyId, "proxy");
  const attendancetotal =
    (present.attendancetotal || 0) + (proxy.attendancetotal || 0);

  const quorumPercentage = Math.ceil((attendancetotal / totalMembers) * 100);
  const isQuorumMet = quorumPercentage >= quorumThresholdSetting;

  return { quorumPercentage, isQuorumMet };
};

export const calculateQuorumByShares = async (
  assemblyId,
  quorumThresholdSetting,
) => {
  const present = await fetchAllAttendiesInAssembly(assemblyId, "present");
  const proxy = await fetchAllAttendiesInAssembly(assemblyId, "proxy");
  const attendance = [
    ...(present.attendance || []),
    ...(proxy.attendance || []),
  ];
  const totalPresentShares = attendance.reduce(
    (sum, member) => sum + (member.shares || 0),
    0,
  );
  const isQuorumMet = totalPresentShares >= quorumThresholdSetting;
  return { quorumPercentage: totalPresentShares, isQuorumMet: isQuorumMet };
};
