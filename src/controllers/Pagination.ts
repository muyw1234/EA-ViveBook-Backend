import { Request } from 'express';

const getQueryNumber = (value: Request['query'][string], fallback: number): number => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const getPaginationParams = (req: Request) => {
  return {
    page: getQueryNumber(req.query.page, 1),
    limit: getQueryNumber(req.query.limit, 10),
  };
};
