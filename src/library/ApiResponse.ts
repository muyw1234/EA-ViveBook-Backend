import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  message: string;
  data?: T;
  errors?: any;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operación exitosa',
  status = 200,
) {
  return res.status(status).json({
    success: true,
    status,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  error: unknown,
  customMessage?: string,
  manualStatus?: number,
) {
  // Un error genérico no controlado
  let status = manualStatus || 500;
  let message = customMessage || 'Error interno del servidor';
  let errors: any = null;

  // Si nosotros le pasamos un texto directamente en lugar de un objeto Error
  if (typeof error === 'string') {
    return res.status(status).json({
      success: false,
      status: status,
      message: error,
      errors: null,
    });
  }

  // Analizar el error real devuelto por Mongoose / JavaScript
  if (error instanceof Error) {
    message = customMessage || error.message;

    // Error de Validación de Mongoose
    if (error.name === 'ValidationError' && 'errors' in error) {
      status = 400;
      message = 'Los datos enviados no son válidos';
      const mongooseErrors = (error as any).errors;
      errors = {};
      for (const key in mongooseErrors) {
        errors[key] = mongooseErrors[key].message;
      }
    }
    // Clave duplicada en MongoDB
    else if ((error as any).code === 11000) {
      status = 409; // Conflict
      message = 'Conflicto: Ya existe un registro con esos datos únicos';
      errors = (error as any).keyValue;
    }
    // ID de Mongoose mal formado
    else if (error.name === 'CastError') {
      status = 400;
      message = 'El formato del ID proporcionado no es válido';
      errors = { path: (error as any).path, value: (error as any).value };
    }
  }

  return res.status(status).json({
    success: false,
    status,
    message,
    errors,
  });
}
