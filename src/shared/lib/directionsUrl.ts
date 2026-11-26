export type TravelMode = 'transit' | 'walking' | 'driving' | 'bicycling'

// Opens Google Maps directions (app if installed, browser otherwise). No API key needed.
// https://developers.google.com/maps/documentation/urls/get-started#directions-action
export function directionsUrl(lat: number, lng: number, travelMode: TravelMode = 'transit') {
  const params = new URLSearchParams({
    api: '1',
    destination: `${lat},${lng}`,
    travelmode: travelMode,
  })
  return `https://www.google.com/maps/dir/?${params}`
}
