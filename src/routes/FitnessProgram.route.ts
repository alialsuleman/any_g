// routes/fitnessProgramRoutes.ts
import express, { NextFunction, Request, Response } from 'express';
import { fitnessProgramController } from '../controllers/FitnessProgram.controller';
import { loginValidation } from '../middleware/login-validation';
import { verify } from '../middleware/verify-token';

const router = express.Router();



export const verfiyCoach = (req: Request, res: Response, next: NextFunction) => {
    console.log(res.locals.role);
    if (res.locals.role == "coach") {
        next();
    }
    else {
        res.status(500).json({
            success: false,
            message: 'you have to login as coach first !!!',

        });
    }
}


// Routes
router.post('/', verify, verfiyCoach, fitnessProgramController.createFitnessProgram); // tested
router.get('/', fitnessProgramController.getAllFitnessPrograms); // tested 
router.get('/:id', fitnessProgramController.getFitnessProgramById); // tested
router.put('/:id', verify, verfiyCoach, fitnessProgramController.updateFitnessProgram);// tested
router.delete('/:id', verify, verfiyCoach, fitnessProgramController.deleteFitnessProgram); // tested
router.post('/:id/rating', verify, fitnessProgramController.addRating); // tested

export default router;