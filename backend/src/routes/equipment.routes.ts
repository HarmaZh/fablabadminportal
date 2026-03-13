import { Router } from 'express';
import * as equipmentController from '../controllers/equipment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', equipmentController.getAllEquipment);
router.get('/:id', equipmentController.getEquipmentById);
router.post('/', equipmentController.createEquipment);
router.put('/:id', equipmentController.updateEquipment);
router.patch('/:id/status', equipmentController.updateEquipmentStatus);
router.delete('/:id', equipmentController.deleteEquipment);

export default router;
