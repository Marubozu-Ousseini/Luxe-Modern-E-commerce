export function normalizeCameroonPhone(input: string): string | null {
  const digits = String(input || "").replace(/\D/g, "");
  if (!digits) return null;

  let national = digits;
  if (digits.startsWith("237") && digits.length === 12) {
    national = digits.slice(3);
  } else if (digits.length === 10 && digits.startsWith("0")) {
    national = digits.slice(1);
  } else if (digits.length !== 9) {
    return null;
  }

  if (!/^[236]\d{8}$/.test(national)) return null;

  // Display format matching the existing UI hint.
  return `+237 ${national[0]} ${national.slice(1, 3)} ${national.slice(3, 5)} ${national.slice(5, 7)} ${national.slice(7, 9)}`;
}

export function isValidCameroonPhone(input: string): boolean {
  return normalizeCameroonPhone(input) !== null;
}
