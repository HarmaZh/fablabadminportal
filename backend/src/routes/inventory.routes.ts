import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

router.get('/', inventoryController.getAllItems);
router.get('/alerts', inventoryController.getLowStockAlerts);
router.get('/stats', inventoryController.getStats);
router.get('/:id', inventoryController.getItemById);
router.post('/', inventoryController.createItem);
router.put('/:id', inventoryController.updateItem);
router.delete('/:id', inventoryController.deleteItem);
router.patch('/:id/stock', inventoryController.adjustStock);

export default router;
