import { body, validationResult } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

export function errorHandler(err, req, res, next) {
  console.error('[API] Error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
}

export function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
}
