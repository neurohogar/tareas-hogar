/** By code units: independent of the locale. */
export const compareIds = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
