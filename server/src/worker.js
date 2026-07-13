import { httpServerHandler } from 'cloudflare:node';
import app from './index.js';
import { env } from './config/env.js';
import { sendDueReminders } from './controllers/reminders.controller.js';

// Serve the Express app dynamically on the port defined by our config.
// `httpServerHandler` returns a fetch-compatible handler that runs the
// Express app on Cloudflare Workers.
const httpHandler = httpServerHandler({ port: env.port });

// Pick the fetch function off whatever shape httpServerHandler returned.
// (It may be a bare function or an object with a .fetch property.)
const fetchHandler = typeof httpHandler === 'function'
  ? httpHandler
  : (httpHandler?.fetch ?? httpHandler?.default);

/**
 * Cloudflare Worker entrypoint. Exposes:
 *   - fetch  : the Express HTTP API (drivers: REST + worker handler)
 *   - scheduled : the Cron Trigger handler that sends appointment reminders
 *
 * Cron schedule is configured in wrangler.toml via [triggers] crons.
 *
 * Bindings (e.g. Hyperdrive) arrive on the `workerEnv` argument — they are NOT
 * on globalThis automatically. We surface the Hyperdrive connection string
 * here so the Express/Postgres layer (db.js) can connect through Cloudflare's
 * persistent pool instead of opening a raw TCP socket per query (which blows
 * past the Workers subrequest limit when talking to external Postgres).
 */
export default {
  async fetch(request, workerEnv, ctx) {
    if (workerEnv?.HYPERDRIVE?.connectionString) {
      globalThis.HYPERDRIVE_CONNECTION_STRING = workerEnv.HYPERDRIVE.connectionString;
    }
    return fetchHandler(request, workerEnv, ctx);
  },
  async scheduled(event, ctx) {
    ctx.waitUntil(
      sendDueReminders().catch((err) => {
        console.error('[cron] reminders failed:', err);
      })
    );
  },
};
