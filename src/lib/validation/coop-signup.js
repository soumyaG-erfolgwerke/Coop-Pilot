const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PART = /^\+?[0-9 ()-]{1,24}$/;

const requiredText = (value, max) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
const optionalText = (value, max) =>
  value === undefined || value === null || (typeof value === "string" && value.length <= max);

export function isValidCoopSignupData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  if (!requiredText(data.email, 254) || !EMAIL.test(data.email)) return false;
  if (typeof data.password !== "string" || data.password.length < 8 || data.password.length > 256) return false;
  if (!requiredText(data.fullLegalFirstMiddleName, 100) || !requiredText(data.fullLegalLastName, 100)) return false;
  if (!requiredText(data.businessName, 200) || !requiredText(data.registryNumber, 100)) return false;
  if (!requiredText(data.country, 100) || !requiredText(data.state, 100) || !requiredText(data.businessSector, 150)) return false;
  if (!optionalText(data.businessDescription, 5000) || !optionalText(data.street, 150) || !optionalText(data.houseNo, 30) || !optionalText(data.postalCode, 20) || !optionalText(data.location, 120) || !optionalText(data.courtName, 200) || !optionalText(data.directorName, 200)) return false;
  if (data.phoneCountryCode !== undefined && !PHONE_PART.test(data.phoneCountryCode)) return false;
  if (data.phoneNumber !== undefined && !PHONE_PART.test(data.phoneNumber)) return false;
  if (data.dateOfBirth !== undefined && data.dateOfBirth !== null && data.dateOfBirth !== "" && (typeof data.dateOfBirth !== "string" || Number.isNaN(Date.parse(data.dateOfBirth)))) return false;
  if (data.size !== undefined) {
    const size = Number(data.size);
    if (!Number.isInteger(size) || size < 1 || size > 1_000_000) return false;
  }
  return true;
}
