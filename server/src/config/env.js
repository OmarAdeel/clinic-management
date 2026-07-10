import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clinic_db',
  },
  jwtSecret: (() => {
    const s = process.env.JWT_SECRET;
    if (!s) throw new Error('JWT_SECRET is not set. Add it to server/.env');
    return s;
  })(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
};
