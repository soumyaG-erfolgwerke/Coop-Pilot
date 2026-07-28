// Get logged in member's assembly with attendance details
export const getMemberAssemblyById = async (assemblyId) => {
  if (!assemblyId) {
    return null;
  }

  const response = await fetch(
    `/api/assembly/proxy/by-id?assemblyId=${encodeURIComponent(assemblyId)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch assembly");
  }
  const assembly = result.assembly;
  if (!assembly) {
    return null;
  }

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
    }
  }

  return {
    ...assembly,

    status,
  };
};

// Get Proxy by proxyId
export const getProxyById = async (proxyId) => {
  if (!proxyId) {
    return null;
  }

  const response = await fetch(
    `/api/assembly/proxy?proxyId=${encodeURIComponent(proxyId)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch proxy");
  }

  return result.proxy || null;
};
