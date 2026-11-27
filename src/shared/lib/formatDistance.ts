/** Meters as short text: "40m" under 1km, "1.2km" from there. */
export function formatDistance(meters: number) {
  const rounded = Math.round(meters)
  return rounded < 1000 ? `${rounded}m` : `${(rounded / 1000).toFixed(1)}km`
}
