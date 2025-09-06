// routes/exerciseRoutes.ts
import express from 'express';
import multer from 'multer';
import { exerciseController } from '../controllers/Exercise.controller';
import { verfiyCoach } from './FitnessProgram.route';
import { verify } from '../middleware/verify-token';

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime'];

        if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, GIF images and MP4, MPEG, MOV videos are allowed'));
        }
    }
});

// Routes
router.post('/', verify, verfiyCoach, upload.array('images', 6), exerciseController.createExercise); // tested
router.get('/:id', exerciseController.getExerciseById); // tested
router.put('/:id', verify, verfiyCoach, exerciseController.updateExercise); // tested
router.delete('/:id', verify, verfiyCoach, exerciseController.deleteExercise); // tested

export default router;