import express from 'express';
import { createEmployee, updateEmployee } from '../controllers/employeeController.js';

const router = express.Router();

router.post('/', createEmployee);
router.put('/:id', updateEmployee);

export default router;


