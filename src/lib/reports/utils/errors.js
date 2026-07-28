import { NextResponse } from "next/server";

const resError = (message, status) =>
  NextResponse.json({ success: false, error: message }, { status });

const resNotFound = () => resError("Not Found", 404);
const resUnauthorized = () => resError("Unauthorized", 401);
const resForbidden = () => resError("Forbidden", 403);
const resBadRequest = (msg) => resError(msg, 400);

const assertNotTruncated = (res, label) => {
  if (res.truncated) {
    throw new Error(`${label} truncated — dataset too large`);
  }
};

const buildWarnings = (warningBuckets) => {
  const out = [];
  for (const [bucket, members] of Object.entries(warningBuckets)) {
    if (members.size > 0) {
      out.push(`${members.size} members have ${bucket}`);
    }
  }
  return out;
};

export {
  assertNotTruncated,
  buildWarnings,
  resBadRequest,
  resForbidden,
  resNotFound,
  resUnauthorized,
};
