export function formatXaf(value: number) {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  })
    .format(value)
    // Normalize narrow no-break spaces to regular spaces for a cleaner FCFA layout.
    .replace(/\u202f/g, " ")
    .replace(/\u00a0/g, " ");

  return `${formatted} FCFA`;
}
