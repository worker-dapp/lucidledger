import express from 'express';
import { createEmployer, updateEmployer } from '../controllers/employerController.js';

const router = express.Router();

router.post('/', createEmployer);
router.put('/:id', updateEmployer);

export default router;


