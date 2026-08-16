/**
 * Edge-safe request logging. Hosting platforms collect console output without
 * an application HTTP loopback, avoiding recursion and forged log ingestion.
 */
export const edgeLogger = {
  logRequest: async (request, requestId) => {
    const requestUrl = new URL(request.url);
    console.info(
      "[Edge]",
      `${request.method} ${requestUrl.pathname}`,
      `[req:${requestId.slice(0, 8)}]`,
    );
  },
};
