export const env = {
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postgres',
  },
  jwtSecret: (() => {
    const s = process.env.JWT_SECRET;
    if (!s) throw new Error('JWT_SECRET is not set in environment');
    return s;
  })(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
};
