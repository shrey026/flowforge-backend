import type { Request, Response } from "express";
import { registerSchema } from "./auth.schema.js";
import { registerUser } from "./auth.service.js";

export const register = async (req: Request, res: Response) => {
    try {
        const result = registerSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                status: "error",
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }

        const user = await registerUser(result.data);

        return res.status(201).json({
            status: "success",
            message: "User registered successfully",
            data: {
                user,
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "USER_ALREADY_EXISTS") {
            return res.status(409).json({
                status: "error",
                message: "A user with this email already exists",
            });
        }

        console.error("Registration error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while registering the user",
        });
    }
};