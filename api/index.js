// Single Vercel serverless function that runs the entire Express app.
// All /api/* routes are rewritten here (see vercel.json), keeping us to
// exactly ONE serverless function — well within the Hobby plan limit of 12.
import app from '../server/src/index.js';

export default app;
