import { Request, Response, NextFunction } from "express";

import { z } from "zod";
import { User } from "../models/User";

// zod Validations
const registerSchema = z.object({
    name: z.string().min(3),
    email: z.string().min(6).email(),
    password: z.string().min(6),
    role: z.string().min(1),
    gender: z.string(),
}).strict();

type RequestBody = {
    email: string;
}

export const registerValidation = async (req: Request, res: Response, next: NextFunction) => {
    // validating using zod
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
        res.status(400).send(parsed.error)
    else {
        const { email: emailFromBody }: RequestBody = req.body;
        const role = req.body.role;
        // checking to see if the user is already registered
        const emailExist = await User.findOne({ email: emailFromBody })
        if (emailExist)
            res.status(400).send({
                success: false,
                message: 'Email already exists!!!'
            })
        else if (role != "user" && role != "coach")
            res.status(400).send({
                success: false,
                message: 'role must be valiad value (user  or coach)  !!!'
            })

        else
            next();
    }
}
