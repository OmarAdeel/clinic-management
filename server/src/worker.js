import { httpServerHandler } from 'cloudflare:node';
import app from './index.js';
import { env } from './config/env.js';

// Serve the Express app dynamically on the port defined by our config
export default httpServerHandler({ port: env.port });
