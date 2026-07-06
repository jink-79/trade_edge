/**
 * The standard response envelope returned by every trade-edge-api endpoint:
 *   { success: boolean; message: string; data: T }
 *
 * Feature API layers should unwrap `.data` and return the inner `T`.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Shape of the paginated list payload used by collection endpoints. */
export interface Paginated<T> {
  entries: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
