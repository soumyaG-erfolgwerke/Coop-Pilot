export const getAssembliesByCoopId = async (coopId) => {
  if (!coopId) {
    return [];
  }

  const response = await fetch(
    `/api/assembly?coopId=${encodeURIComponent(coopId)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  const result = await response.json();
  const updatedResult = result.assemblies?.map((assembly) => {
    // const isWithinCutoff =
    //   assembly.startDateTime >= new Date(Date.now() - 5 * 60 * 60 * 1000); // Allow closing within 5 hours of start time
    // const now = new Date();
    // const start = new Date(assembly.startDateTime);
    // const end = new Date(assembly.endDateTime);

    // let status = "upcoming";
    // if (assembly.endDateTime) {
    //   if (now >= start && now <= end) {
    //     status = "live";
    //   } else if (now > end) {
    //     status = "closed";
    //   }
    // } else {
    //   if (!isWithinCutoff) {
    //     status = "closed";
    //   }
    // }

    const now = new Date();
    const start = new Date(assembly.startDateTime);
    const end = new Date(assembly.endDateTime);

    let status = "upcoming";
    if (assembly.status === "closed") {
      status = "closed";
    } else if (assembly.status === "live") {
      status = "live";
    } else if (assembly.status === "draft") {
      status = "draft";
    } else {
      if (assembly.format === "gestreckt" && assembly.endDateTime) {
        if (now >= start && now <= end) {
          status = "live";
        } else if (now > end) {
          status = "closed";
        }
      } else {
        // if (!isWithinCutoff) {
        //   status = "closed";
        // }
      }
    }

    return {
      ...assembly,
      status,
    };
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch assemblies");
  }

  return updatedResult || [];
};

export const getAssemblyById = async (assemblyId) => {
  if (!assemblyId) {
    throw new Error("assemblyId is required.");
  }

  const response = await fetch(
    `/api/assembly/${encodeURIComponent(assemblyId)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch assembly");
  }

  console.log("service assembly data:", result.data);

  return result.data;
};

export const getLiveAssembliesByCoopId = async (coopId) => {
  if (!coopId) {
    return [];
  }
  const response = await fetch(
    `/api/assembly?coopId=${encodeURIComponent(coopId)}&status=live`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch assemblies");
  }

  return result.assemblies || [];
};

export const createAssembly = async (payload) => {
  const response = await fetch("/api/assembly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to create assembly");
  }

  return result.assembly;
};

export const updateAssemblyStatus = async (
  assemblyId,
  status,
  isLive = true,
) => {
  const response = await fetch("/api/assembly", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ assemblyId, status, isLive }),
  });
  const result = await response.json();
  // console.log('assembly data: ', result);
  if (!result.success) {
    throw new Error(result.error || "Failed to update assembly");
  }

  return result.assembly;
};

export const getMemberAssemblies = async (coopId) => {
  if (!coopId) {
    return [];
  }

  const response = await fetch(
    `/api/assembly/member?coopId=${encodeURIComponent(coopId)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  const result = await response.json();
  // console.log("1data: ", result);
  const updatedResult = result.assemblies?.map((assembly) => {
    // const isWithinCutoff =
    // assembly.startDateTime >= new Date(Date.now() - 5 * 60 * 60 * 1000); // Allow closing within 5 hours of start time
    const now = new Date();
    const start = new Date(assembly.startDateTime);
    const end = assembly.endDateTime ? new Date(assembly.endDateTime) : null;

    let status = "upcoming";
    if (assembly.status === "closed") {
      status = "closed";
    } else if (assembly.status === "live") {
      status = "live";
    } else if (assembly.status === "draft") {
      status = "draft";
    } else {
      if (assembly.format === "gestreckt" && assembly.endDateTime) {
        if (now >= start && now <= end) {
          status = "live";
        } else if (now > end) {
          status = "closed";
        }
      } else {
        // if (!isWithinCutoff) {
        //   status = "closed";
        // }
      }
    }

    return {
      ...assembly,
      status,
    };
  });
  // console.log("2 updated data: ", updatedResult);

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch assemblies");
  }

  return updatedResult || [];
};

export const markAssemblyAttendance = async (assemblyId) => {
  const response = await fetch("/api/assembly/attendance", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ assemblyId, status: "present" }),
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to mark attendance");
  }

  return result;
};

export const updateAssembly = async (assemblyId, payload) => {
  const response = await fetch("/api/assembly", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ assemblyId, ...payload }),
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to update assembly");
  }

  return result.assembly;
};
