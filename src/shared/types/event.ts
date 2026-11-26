// Provisional shape. Replace with the backend schema (FastAPI /docs) once it is fixed.
export interface Event {
  id: number
  title: string
  venue_name: string
  address: string
  start_date: string
  end_date: string
  image_url: string | null
  latitude: number
  longitude: number
}
