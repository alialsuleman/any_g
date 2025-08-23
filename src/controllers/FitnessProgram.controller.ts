// controllers/fitnessProgramController.ts
import { Request, Response } from 'express';
import { FitnessProgram, IFitnessProgram } from '../models/FitnessProgram';
import { Exercise } from '../models/Exercise';

export const fitnessProgramController = {
    // Create new fitness program
    createFitnessProgram: async (req: Request, res: Response) => {
        try {
            const {
                name,
                description,
                category,
                difficulty,
                duration,
                price
            } = req.body;
            const createdBy = res.locals.userId;

            // Create new fitness program
            const newFitnessProgram: IFitnessProgram = new FitnessProgram({
                name,
                createdBy,
                description,
                category,
                difficulty,
                duration: parseInt(duration),
                price: price ? parseFloat(price) : 0
            });

            // Save program to database
            const savedProgram = await newFitnessProgram.save();

            // Add exercises to the program

            res.status(201).json({
                success: true,
                message: 'Fitness program created successfully',
                data: savedProgram
            });
        } catch (error) {
            console.error('Error creating fitness program:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while creating the fitness program',
                error: error
            });
        }
    },

    // Get all fitness programs
    getAllFitnessPrograms: async (req: Request, res: Response) => {
        try {
            const { category, difficulty, minRating, maxPrice } = req.query;
            let filter: any = {};

            if (category) filter.category = category;
            if (difficulty) filter.difficulty = difficulty;
            if (minRating) filter.averageRating = { $gte: parseFloat(minRating as string) };
            if (maxPrice) filter.price = { $lte: parseFloat(maxPrice as string) };

            const programs = await FitnessProgram.find(filter)
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                data: programs
            });
        } catch (error) {
            console.error('Error fetching fitness programs:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching fitness programs',
                error: error
            });
        }
    },

    // Get fitness program by ID
    getFitnessProgramById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const program = await FitnessProgram.findById(id)
                .populate('createdBy', 'name email')
                .populate('ratings.user', 'name');

            const exercises = await Exercise.find({
                FitnessProgram: id
            });
            if (!program) {
                return res.status(404).json({
                    success: false,
                    message: 'Fitness program not found'
                });
            }

            res.status(200).json({
                success: true,
                data: { program, exercises }
            });
        } catch (error) {
            console.error('Error fetching fitness program:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching the fitness program',
                error: error
            });
        }
    },

    // Update fitness program
    updateFitnessProgram: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            var userId = await FitnessProgram.findById(
                id
            ).populate('createdBy', 'name email');
            //@ts-ignore
            var userId = userId.createdBy._id.toString();

            if (userId != res.locals.userId) {
                return res.status(404).json({
                    success: false,
                    message: 'you are not the owner of this program'
                });
            } else console.log("auth valid");


            const updatedProgram = await FitnessProgram.findByIdAndUpdate(
                id,
                updates,
                { new: true, runValidators: true }
            )
                .populate('createdBy', 'name email')

            if (!updatedProgram) {
                return res.status(404).json({
                    success: false,
                    message: 'Fitness program not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Fitness program updated successfully',
                data: updatedProgram
            });
        } catch (error) {
            console.error('Error updating fitness program:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while updating the fitness program',
                error: error
            });
        }
    },

    // Delete fitness program
    deleteFitnessProgram: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;


            var userId = await FitnessProgram.findById(
                id
            ).populate('createdBy', 'name email');
            //@ts-ignore
            var userId = userId.createdBy._id.toString();

            if (userId != res.locals.userId) {
                return res.status(404).json({
                    success: false,
                    message: 'you are not the owner of this program'
                });
            } else console.log("auth valid");



            const deletedProgram = await FitnessProgram.findByIdAndDelete(id);

            if (!deletedProgram) {
                return res.status(404).json({
                    success: false,
                    message: 'Fitness program not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Fitness program deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting fitness program:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while deleting the fitness program',
                error: error
            });
        }
    },

    // Add rating to fitness program
    addRating: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { rating, comment } = req.body;
            const userId = res.locals.userId;

            const program = await FitnessProgram.findById(id);

            if (!program) {
                return res.status(404).json({
                    success: false,
                    message: 'Fitness program not found'
                });
            }

            // Check if user has already rated
            const existingRating = program.ratings.find(r => r.user.toString() === userId.toString());

            if (existingRating) {
                // Update existing rating
                existingRating.rating = rating;
                existingRating.comment = comment;
                existingRating.createdAt = new Date();
            } else {
                // Add new rating
                program.ratings.push({
                    user: userId,
                    rating,
                    comment,
                    createdAt: new Date()
                });
            }

            // Save changes (averageRating will be calculated automatically by pre-save hook)
            await program.save();

            res.status(200).json({
                success: true,
                message: 'Rating added successfully',
                data: program
            });
        } catch (error) {
            console.error('Error adding rating:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while adding the rating',
                error: error
            });
        }
    }
};