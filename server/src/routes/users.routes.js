import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { listUsers, createUser, updateUser, deleteUser } from '../controllers/users.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
