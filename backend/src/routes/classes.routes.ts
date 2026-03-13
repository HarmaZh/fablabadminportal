import { Router } from 'express';
import * as classesController from '../controllers/classes.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', classesController.getAllClasses);
router.get('/:id', classesController.getClassById);
router.post('/', classesController.createClass);
router.put('/:id', classesController.updateClass);
router.delete('/:id', classesController.deleteClass);

export default router;
