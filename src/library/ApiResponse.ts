import { Response } from 'express';

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export interface ApiResponse<T = unknown> {
  success: true;
  status: number;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  status: number;
  message: string;
  code: ApiErrorCode;
  errors: unknown;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: ApiErrorCode,
    public readonly errors: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operación realizada con éxito',
  status = 200,
) {
  const response: ApiResponse<T> = {
    success: true,
    status,
    message,
    data,
  };
  return res.status(status).json(response);
}

const statusCodeMap: Record<number, ApiErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  500: 'INTERNAL_ERROR',
};

export function sendError(
  res: Response,
  error: unknown,
  customMessage?: string,
  manualStatus?: number,
) {
  let status = manualStatus || 500;
  let message = customMessage || 'Error interno del servidor';
  let code: ApiErrorCode = statusCodeMap[status] ?? 'INTERNAL_ERROR';
  let errors: unknown = null;

  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof ApiError) {
    status = error.status;
    message = error.message;
    code = error.code;
    errors = error.errors;
  } else if (error instanceof Error) {
    if (error.name === 'ValidationError' && 'errors' in error) {
      status = 400;
      code = 'BAD_REQUEST';
      message = 'Los datos enviados no son válidos';
      const mongooseErrors = (
        error as Error & {
          errors: Record<string, { message: string }>;
        }
      ).errors;
      errors = Object.entries(mongooseErrors).map(([field, detail]) => ({
        field,
        message: detail.message,
      }));
    } else if ('code' in error && error.code === 11000) {
      status = 409;
      code = 'CONFLICT';
      message = 'Ya existe un registro con esos datos';
      errors = 'keyValue' in error ? error.keyValue : null;
    } else if (error.name === 'CastError') {
      status = 400;
      code = 'BAD_REQUEST';
      message = 'El formato del identificador proporcionado no es válido';
      const castError = error as Error & { path?: string; value?: unknown };
      errors = { field: castError.path, value: castError.value };
    }
  }

  const response: ApiErrorResponse = {
    success: false,
    status,
    message,
    code,
    errors,
  };
  return res.status(status).json(response);
}
