import { sendError, sendSuccess } from '../library/ApiResponse';
import Matomo from '../services/Matomo';
import { NextFunction, Request, Response } from 'express';
import VisitsSumamry from '../types/VisitsSummary';

function logMatomoError(operation: string, error: unknown): void {
  if (!(error instanceof Error)) {
    console.error(`Error de Matomo al ${operation}: error no identificado`);
    return;
  }

  const cause =
    error.cause instanceof Error
      ? {
          name: error.cause.name,
          message: error.cause.message,
        }
      : undefined;

  console.error(`Error de Matomo al ${operation}:`, {
    name: error.name,
    message: error.message,
    cause,
  });
}

/* *lee la version, tambien sirve como ping*/
async function readVersion(req: Request, res: Response, next: NextFunction) {
  const matomo: Matomo = Matomo.Instance;
  try {
    const version = await matomo.version();
    return sendSuccess(res, { version: version }, 'OK', 200);
  } catch (error) {
    logMatomoError('consultar la versión', error);
    return sendError(res, error, 'Something went wrong');
  }
}

async function readSummary(req: Request, res: Response, next: NextFunction) {
  const matomo: Matomo = Matomo.Instance;
  try {
    const summary: VisitsSumamry = await matomo.getVisitsSummary();
    return sendSuccess(res, summary, 'OK', 200);
  } catch (error) {
    logMatomoError('consultar el resumen de visitas', error);
    return sendError(res, error, 'Something went wrong');
  }
}

export default { readVersion, readSummary };
