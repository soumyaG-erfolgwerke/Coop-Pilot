export const validatePassword = (password) => {
  if (typeof password !== "string") {
    return ["a valid password"];
  }

  const p = password.trim();
  const errors = [];

  if (p.length < 8) errors.push("at least 8 characters");
  if (!/[a-z]/.test(p)) errors.push("a lowercase letter");
  if (!/[A-Z]/.test(p)) errors.push("an uppercase letter");
  if (!/\d/.test(p)) errors.push("a number");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) {
    errors.push("a special character");
  }

  return errors;
};
