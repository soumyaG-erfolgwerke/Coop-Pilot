//* services/attendence/AttendenceServices.js

// New function to fetch all attendies with optional status filter
export const fetchAllAttendiesInAssembly = async (
  assemblyId,
  status = "present",
) => {
  if (!assemblyId) {
    throw new Error("assemblyId is required");
  }

  const response = await fetch(
    `/api/assembly/attendance/${encodeURIComponent(assemblyId)}?status=${encodeURIComponent(status)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch attendance records");
  }

  const { data, total } = await response.json();
  return { attendance: data, attendancetotal: total };
};

// Function to fetch present members in an assembly
export const fetchPresentMembersInAssembly = async (assemblyId) => {
  if (!assemblyId) {
    throw new Error("assemblyId is required");
  }

  const response = await fetch(
    `/api/assembly/attendance/${encodeURIComponent(assemblyId)}?status=present`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch present members");
  }

  const { data, total } = await response.json();
  return { attendance: data, attendancetotal: total };
};

// Function to update attendance status
export const updateAttendance = async (
  assemblyId,
  status,
  proxyHolder = "",
  note = "",
) => {
  if (!assemblyId) {
    throw new Error("assemblyId is required");
  }
  if (!["present", "absent", "excused"].includes(status)) {
    throw new Error("Invalid attendance status");
  }
  const response = await fetch(
    `/api/assembly/attendance/${encodeURIComponent(assemblyId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ assemblyId, status, proxyHolder, note }),
    },
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update attendance");
  }
  const data = await response.json();
  return data;
};
