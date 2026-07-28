/**
 * * @param {string} iban - The raw IBAN string to validate (spaces allowed).
 * @returns {Promise<Object>} The API response containing validity status and bank details.
 * @throws {Error} If the input is invalid, the request times out, or the API fails.
 */
export const validateIBAN = async (iban) => {

  if (!iban || typeof iban !== "string") {
    throw new Error("Invalid input: IBAN must be a provided as a string.");
  }
  const sanitizedIban = iban.replace(/\s+/g, "").toUpperCase();

  // Prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      `https://openiban.com/validate/${sanitizedIban}?getBIC=true&validateBankCode=true`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);
  
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        if (errorData?.message) errorMessage = errorData.message;
      } catch (e) {
      
      }
      throw new Error(`IBAN Registry API failed: ${errorMessage}`);
    }

    // Return
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Request Timeout: The IBAN registry took too long to respond.",
      );
    }

    console.error('[IBAN Service] Error validating IBAN', error.message);

    throw new Error(
      error.message ||
        "An unexpected error occurred while validating the IBAN.",
    );
  }
};
