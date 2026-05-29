const normalizeOrigin = (value: string) =>
  value.trim().replace(/\/+$/, '').toLowerCase();

const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://gengig-frontend.vercel.app',
  'https://www.gengig-frontend.vercel.app',
];

const envOriginKeys = ['CORS_ORIGINS', 'FRONTEND_URL'];

const parseEnvOrigins = () =>
  envOriginKeys.flatMap((key) =>
    (process.env[key] || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

export const getAllowedCorsOrigins = () =>
  Array.from(
    new Set([...defaultCorsOrigins, ...parseEnvOrigins()].map(normalizeOrigin)),
  );

export const isOriginAllowed = (
  origin: string | undefined,
  allowedOrigins: string[] = getAllowedCorsOrigins(),
) => {
  if (!origin) {
    return true;
  }
  return allowedOrigins.includes(normalizeOrigin(origin));
};
