export function normaliseBigInts(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(normaliseBigInts);
  } else if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, normaliseBigInts(v)])
    );
  } else if (typeof obj === "bigint") {
    return Number(obj);
  }
  return obj;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || "Unknown";
}
