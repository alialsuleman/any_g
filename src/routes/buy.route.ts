// routes/buyRoutes.ts
import express from 'express';
import { buyController } from '../controllers/buy.controller';
import { verify } from '../middleware/verify-token';
//import { authenticate } from '../middleware/auth'; // نفترض وجود middleware للمصادقة

const router = express.Router();

//router.use(authenticate);

// Routes
router.post('/', verify, buyController.purchaseProgram);// tested
router.get('/', verify, buyController.getUserPurchases);// tested
router.get('/stats', verify, buyController.getPurchaseStats);// tested
router.get('/:id', verify, buyController.getPurchaseById);// tested
router.put('/:purchaseId/confirm', verify, buyController.confirmPurchase);// tested
router.put('/:id/cancel', verify, buyController.cancelPurchase);// tested

export default router;