export interface IErrorResponse {
  message: string;
  statusCode: number;
  detail: unknown | string;
}
export interface ISuccessResponse<T> {
  statusCode: unknown | string;
  message: string;
  metadata: T;
}
