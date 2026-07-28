export const maskValue = (val) => {
  if (!val) return "";
  const str = String(val);
  if (str.length <= 4) {
    return str.length > 1 
      ? str[0] + "***" + str[str.length - 1] 
      : str + "***";
  }
  return str.substring(0, 2) + "***" + str.substring(str.length - 2);
};