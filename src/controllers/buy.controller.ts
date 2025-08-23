// controllers/buyController.ts
import { Request, Response } from 'express';
import { Buy, IBuy } from '../models/Buy';
import { FitnessProgram } from '../models/FitnessProgram';
import { User } from '../models/User';
import { createNotification } from './notification.controller';

export const buyController = {
    // Purchase fitness program
    purchaseProgram: async (req: Request, res: Response) => {
        try {
            const { programId } = req.body;
            const userId = res.locals.userId;

            // Verify program exists
            const program = await FitnessProgram.findById(programId);
            if (!program) {
                return res.status(404).json({
                    success: false,
                    message: 'Fitness program not found'
                });
            }


            const existingPurchase = await Buy.findOne({
                user: userId,
                program: programId,
                status: { $in: ['pending', 'confirmed', 'completed'] }
            });

            if (existingPurchase) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already purchased this program'
                });
            }

            const newPurchase: IBuy = new Buy({
                program: programId,
                user: userId,
                totalAmount: program.price,
                status: 'pending'
            });

            const savedPurchase = await newPurchase.save();
            await savedPurchase.populate('program');
            await savedPurchase.populate('user', 'name email');

            await createNotification({
                userId: userId, msg: `Purchase with id ${savedPurchase._id} process started successfully - ${savedPurchase.createdAt}`
            })

            createNotification({
                userId: program.createdBy.toString(),
                // @ts-ignore
                msg: `${savedPurchase.user.email} requested your exercise program.`
            })

            res.status(201).json({
                success: true,
                message: 'Purchase process started successfully',
                data: savedPurchase
            });
        } catch (error) {
            console.error('Purchase error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred during the purchase process',
                error: error
            });
        }
    },

    // In controllers/buyController.ts (update confirmPurchase)
    confirmPurchase: async (req: Request, res: Response) => {
        try {
            const { purchaseId } = req.params;
            const { transactionId } = req.body;
            const userId = res.locals.userId;
            const purchase = await Buy.findById(purchaseId);

            if (!purchase) {
                return res.status(404).json({
                    success: false,
                    message: 'Purchase transaction not found'
                });
            }
            else if (purchase.user._id != userId) {
                return res.status(404).json({
                    success: false,
                    message: 'you are not the owner of this Purchase'
                });
            }

            // Update purchase status
            purchase.status = 'completed';

            const updatedPurchase = await purchase.save();
            await updatedPurchase.populate('program', "createdBy");
            await updatedPurchase.populate('user', 'name email');

            // Add program to user's purchased programs list
            await User.findByIdAndUpdate(
                purchase.user,
                { $addToSet: { purchasedPrograms: purchase.program } }
            );
            await createNotification({
                userId: userId, msg: `Purchase with id ${updatedPurchase._id} confirmed successfully - ${updatedPurchase.createdAt}`
            })


            createNotification({
                // @ts-ignore
                userId: updatedPurchase.program.createdBy.toString(),
                // @ts-ignore
                msg: `${updatedPurchase.user.email} payed for your exercise program.`
            })

            res.status(200).json({
                success: true,
                message: 'Purchase confirmed successfully',
                data: updatedPurchase
            });
        } catch (error) {
            console.error('Purchase confirmation error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while confirming the purchase',
                error: error
            });
        }
    },
    // Get user's purchase history
    getUserPurchases: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            const { status, page = 1, limit = 10 } = req.query;

            let filter: any = { user: userId };
            if (status) filter.status = status;

            const options = {
                // page: parseInt(page as string),
                // limit: parseInt(limit as string),
                sort: { createdAt: -1 },
                populate: [
                    { path: 'program', select: 'name description difficulty duration' },
                    { path: 'user', select: 'name email' }
                ]
            };

            const purchases = await Buy.find(filter)
                .populate('program', 'name description difficulty duration price')
                .populate('user', 'name email')
                .sort({ createdAt: -1 });
            // .limit(parseInt(limit as string) * 1)
            // .skip((parseInt(page as string) - 1) * parseInt(limit as string));

            const total = await Buy.countDocuments(filter);

            res.status(200).json({
                success: true,
                data: purchases,
                // pagination: {
                //     page: parseInt(page as string),
                //     limit: parseInt(limit as string),
                //     total,
                //     pages: Math.ceil(total / parseInt(limit as string))
                // }
            });
        } catch (error) {
            console.error('Error fetching purchases:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching purchases',
                error: error
            });
        }
    },

    // Get specific purchase
    getPurchaseById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userId = res.locals.userId;

            const purchase = await Buy.findOne({ _id: id, user: userId })
                .populate('program')
                .populate('user', 'name email');

            if (!purchase) {
                return res.status(404).json({
                    success: false,
                    message: 'Purchase not found'
                });
            }

            res.status(200).json({
                success: true,
                data: purchase
            });
        } catch (error) {
            console.error('Error fetching purchase:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching the purchase',
                error: error
            });
        }
    },

    // Cancel purchase
    cancelPurchase: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userId = res.locals.userId;

            const purchase = await Buy.findOne({ _id: id, user: userId });

            if (!purchase) {
                return res.status(404).json({
                    success: false,
                    message: 'Purchase not found'
                });
            }

            // Can only cancel pending or confirmed transactions
            if (purchase.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel a completed purchase'
                });
            }

            if (purchase.status === 'cancelled') {
                return res.status(400).json({
                    success: false,
                    message: 'Purchase is already cancelled'
                });
            }

            purchase.status = 'cancelled';


            const updatedPurchase = await purchase.save();
            await updatedPurchase.populate('program');
            await updatedPurchase.populate('user', 'name email');
            await createNotification({
                userId: userId, msg: `Purchase with id ${updatedPurchase._id} cancelled successfully - ${updatedPurchase.createdAt}`
            })


            res.status(200).json({
                success: true,
                message: 'Purchase cancelled successfully',
                data: updatedPurchase
            });
        } catch (error) {
            console.error('Cancellation error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while cancelling the purchase',
                error: error
            });
        }
    },

    // Get purchase statistics (for admin)
    getPurchaseStats: async (req: Request, res: Response) => {
        try {
            // Check admin privileges
            const userId = res.locals.userId;
            //     const user = await User.findById(userId);
            // if (user.role !== 'admin') {
            //     return res.status(403).json({
            //         success: false,
            //         message: 'Unauthorized access to this data'
            //     });
            // }

            // const totalPurchases = await Buy.countDocuments();
            // const totalRevenue = await Buy.aggregate([
            //     { $match: { paymentStatus: 'paid' } },
            //     { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            // ]);

            // const purchasesByStatus = await Buy.aggregate([
            //     { $group: { _id: '$status', count: { $sum: 1 } } }
            // ]);

            // const recentPurchases = await Buy.find()
            //     .populate('program', 'name')
            //     .populate('user', 'name email')
            //     .sort({ createdAt: -1 })
            //     .limit(5);

            // res.status(200).json({
            //     success: true,
            //     data: {
            //         totalPurchases,
            //         totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            //         purchasesByStatus,
            //         recentPurchases
            //     }
            // });


            const purchases = await Buy.find()
                .populate({
                    path: 'program',
                    match: { createdBy: userId },
                    select: 'name price'
                })
                .populate({
                    path: 'user',
                    select: 'name email'
                })
                .then(purchases => purchases.filter(purchase => purchase.program !== null));

            res.status(200).json({
                success: true,
                data: {
                    purchases
                }
            });



        } catch (error) {
            console.error('Error fetching purchase statistics:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching purchase statistics',
                error: error
            });
        }
    }
};