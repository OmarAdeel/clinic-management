import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { listAudit } from '../controllers/audit.controller.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/', listAudit);

export default router;
