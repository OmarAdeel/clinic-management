import dotenv from 'dotenv';

dotenv.config();

// Use ES6 getters to dynamically resolve environment variables from process.env on demand.
// This is critical for Cloudflare Workers, where process.env is populated dynamically right before the request handler runs.
export const env = {
  get port() {
    return Number(process.env.PORT || 5000);
  },
  get clientOrigin() {
    return process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  },
  get db() {
    return {
      get host() {
        return process.env.DB_HOST || 'localhost';
      },
      get port() {
        return Number(process.env.DB_PORT || 5432);
      },
      get user() {
        return process.env.DB_USER || 'root';
      },
      get password() {
        return process.env.DB_PASSWORD || '';
      },
      get database() {
        return process.env.DB_NAME || 'clinic_db';
      }
    };
  },
  get jwtSecret() {
    return process.env.JWT_SECRET || 'dev_secret_change_me';
  },
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '12h';
  }
};
