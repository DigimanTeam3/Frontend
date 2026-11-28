/** List answer of the paged APIs (e.g. GET /me/badges). */
export interface Page<T> {
  items: T[]
  total: number
  page: number
  size: number
}
