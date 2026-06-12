import { Request } from 'express';

const getQueryNumber = (value: Request['query'][string], fallback: number): number => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const getQueryBoolean = (value: Request['query'][string], fallback: boolean): boolean => {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (typeof rawValue !== 'string') {
    return fallback;
  }

  if (rawValue.toLowerCase() === 'true') {
    return true;
  }

  if (rawValue.toLowerCase() === 'false') {
    return false;
  }

  return fallback;
};

export const getPaginationParams = (req: Request) => {
  return {
    page: getQueryNumber(req.query.page, 1),
    limit: getQueryNumber(req.query.limit, 10),
  };
};
