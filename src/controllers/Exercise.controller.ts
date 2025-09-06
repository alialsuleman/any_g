// controllers/exerciseController.ts
import { Request, Response } from 'express';
import { Exercise, IExercise } from '../models/Exercise';
import { v2 as cloudinary } from 'cloudinary';
import { FitnessProgram } from '../models/FitnessProgram';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

export const exerciseController = {
    // Create new exercise
    createExercise: async (req: Request, res: Response) => {
        try {
            const {
                name,
                description,
                dayNumber,
                orderInDay,
                sets,
                reps,
                equipment,
                difficulty,
                targetMuscles,
                programId
            } = req.body;



            var userId = await FitnessProgram.findById(
                programId
            ).populate('createdBy', 'name email');
            //@ts-ignore
            var userId = userId.createdBy._id.toString();

            if (userId != res.locals.userId) {
                return res.status(404).json({
                    success: false,
                    message: 'you are not the owner of this program'
                });
            } else console.log("auth valid");



            // Process images and upload to Cloudinary
            const files = Array.isArray(req.files)
                ? req.files
                : [];

            let imagesUrl: string[] = [];
            let videosUrl: string[] = [];

            if (files.length > 0) {
                // معالجة الصور
                const imageFiles = files.filter(file => file.mimetype.startsWith('image/'));
                if (imageFiles.length > 0) {
                    const imageUrls = await Promise.all(
                        imageFiles.map(async (item) => {
                            const result = await cloudinary.uploader.upload(item.path, {
                                resource_type: 'image',
                                folder: 'fitness_app/exercises/images'
                            });
                            return result.secure_url;
                        })
                    );
                    imagesUrl = imageUrls;
                }

                // معالجة الفيديوهات
                const videoFiles = files.filter(file => file.mimetype.startsWith('video/'));
                if (videoFiles.length > 0) {
                    const videoUrls = await Promise.all(
                        videoFiles.map(async (item) => {
                            const result = await cloudinary.uploader.upload(item.path, {
                                resource_type: 'video',
                                folder: 'fitness_app/exercises/videos'
                            });
                            return result.secure_url;
                        })
                    );
                    videosUrl = videoUrls;
                }
            }
            console.log(videosUrl);
            console.log(imagesUrl);


            // الآن يمكنك استخدام imagesUrl للصور و videosUrl للفيديوهات
            console.log(targetMuscles);

            const newExercise: IExercise = new Exercise({
                name,
                description,
                dayNumber: parseInt(dayNumber),
                orderInDay: parseInt(orderInDay),
                sets: parseInt(sets),
                reps: parseInt(reps),
                equipment: equipment ? JSON.parse(equipment) : [],
                difficulty,
                targetMuscles: targetMuscles ? JSON.parse(targetMuscles) : [],
                images: [...imagesUrl, ...videosUrl],
                FitnessProgram: programId
            });

            // Save exercise to database
            const savedExercise = await newExercise.save();

            res.status(201).json({
                success: true,
                message: 'Exercise created successfully',
                data: savedExercise
            });
        } catch (error) {
            console.error('Error creating exercise:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while creating the exercise',
                error: error
            });
        }
    },

    // Get all exercises
    getAllExercises: async (req: Request, res: Response) => {
        try {
            const { day, difficulty, muscle } = req.query;
            let filter: any = {};

            if (day) filter.dayNumber = day;
            if (difficulty) filter.difficulty = difficulty;
            if (muscle) filter.targetMuscles = { $in: [muscle] };

            const exercises = await Exercise.find(filter)
                .sort({ dayNumber: 1, orderInDay: 1 })
                .populate('targetMuscles');

            res.status(200).json({
                success: true,
                data: exercises
            });
        } catch (error) {
            console.error('Error fetching exercises:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching exercises',
                error: error
            });
        }
    },

    // Get exercise by ID
    getExerciseById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const exercise = await Exercise.findById(id);

            if (!exercise) {
                return res.status(404).json({
                    success: false,
                    message: 'Exercise not found'
                });
            }

            res.status(200).json({
                success: true,
                data: exercise
            });
        } catch (error) {
            console.error('Error fetching exercise:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching the exercise',
                error: error
            });
        }
    },

    // Update exercise
    updateExercise: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const updates = req.body;

            var program = await Exercise.findById(id);
            console.log(program);
            //@ts-ignore
            var programId = program.FitnessProgram;
            console.log(programId);
            var userId = await FitnessProgram.findById(
                programId
            ).populate('createdBy', 'name email');
            //@ts-ignore
            var userId = userId.createdBy._id.toString();
            console.log(userId);

            if (userId != res.locals.userId) {
                return res.status(404).json({
                    success: false,
                    message: 'you are not the owner of this program'
                });
            } else console.log("auth valid");




            // Convert numbers if they exist
            if (updates.dayNumber) updates.dayNumber = parseInt(updates.dayNumber);
            if (updates.orderInDay) updates.orderInDay = parseInt(updates.orderInDay);
            if (updates.sets) updates.sets = parseInt(updates.sets);
            if (updates.reps) updates.reps = parseInt(updates.reps);
            if (updates.equipment) updates.equipment = JSON.parse(updates.equipment);

            const updatedExercise = await Exercise.findByIdAndUpdate(
                id,
                updates,
                { new: true, runValidators: true }
            );

            if (!updatedExercise) {
                return res.status(404).json({
                    success: false,
                    message: 'Exercise not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Exercise updated successfully',
                data: updatedExercise
            });
        } catch (error) {
            console.error('Error updating exercise:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while updating the exercise',
                error: error
            });
        }
    },

    // Delete exercise
    deleteExercise: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;


            var program = await Exercise.findById(id);
            //@ts-ignore
            var programId = program.FitnessProgram;
            console.log(programId);
            var userId = await FitnessProgram.findById(
                programId
            ).populate('createdBy', 'name email');
            //@ts-ignore
            var userId = userId.createdBy._id.toString();
            console.log(userId);

            if (userId != res.locals.userId) {
                return res.status(404).json({
                    success: false,
                    message: 'you are not the owner of this program'
                });
            } else console.log("auth valid");






            const deletedExercise = await Exercise.findByIdAndDelete(id);

            if (!deletedExercise) {
                return res.status(404).json({
                    success: false,
                    message: 'Exercise not found'
                });
            }

            // if (deletedExercise.images && deletedExercise.images.length > 0) {
            //     await Promise.all(
            //         deletedExercise.images.map(async (imageUrl) => {
            //             const publicId = imageUrl.split('/').pop()?.split('.')[0];
            //             if (publicId) {
            //                 await cloudinary.uploader.destroy(`fitness_app/exercises/${publicId}`);
            //             }
            //         })
            //     );
            // }

            res.status(200).json({
                success: true,
                message: 'Exercise deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting exercise:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while deleting the exercise',
                error: error
            });
        }
    }
};


/*


 {
      "name": "Push-Ups",
      "description": "Basic bodyweight exercise for chest, shoulders, and triceps",
      "dayNumber": 1,
      "orderInDay": 1,
      "sets": 3,
      "reps": 12,
      "equipment": ["none"],
      "difficulty": "beginner",
      "targetMuscles": ["Chest", "Shoulders", "Triceps"],
      "programId": "68a61e114ddb95d727a216d7"
}

*/