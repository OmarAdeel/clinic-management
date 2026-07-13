import dotenv from 'dotenv';

dotenv.config();

// Resolve variables dynamically from globalThis (Cloudflare Workers global bindings)
// or fallback to process.env (Node.js/local dotenv).
export const env = {
  get port() {
    return Number(globalThis.PORT || process.env.PORT || 5000);
  },
  get clientOrigin() {
    return globalThis.CLIENT_ORIGIN || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  },
  get db() {
    return {
      get host() {
        return globalThis.DB_HOST || process.env.DB_HOST || 'localhost';
      },
      get port() {
        return Number(globalThis.DB_PORT || process.env.DB_PORT || 5432);
      },
      get user() {
        return globalThis.DB_USER || process.env.DB_USER || 'root';
      },
      get password() {
        return globalThis.DB_PASSWORD || process.env.DB_PASSWORD || '';
      },
      get database() {
        return globalThis.DB_NAME || process.env.DB_NAME || 'clinic_db';
      }
    };
  },
  get jwtSecret() {
    return globalThis.JWT_SECRET || process.env.JWT_SECRET || 'dev_secret_change_me';
  },
  get jwtExpiresIn() {
    return globalThis.JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '12h';
  },
  // --- Notification deliver config (read from Wrangler/Vercel secrets) ---
  get resendApiKey() {
    return globalThis.RESEND_API_KEY || process.env.RESEND_API_KEY || '';
  },
  get resendFrom() {
    return globalThis.NOTIFY_FROM_EMAIL || process.env.NOTIFY_FROM_EMAIL || 'Clinic <no-reply@clinic.app>';
  },
  get twilioAccountSid() {
    return globalThis.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID || '';
  },
  get twilioAuthToken() {
    return globalThis.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN || '';
  },
  get twilioFrom() {
    return globalThis.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM_NUMBER || '';
  }
};
