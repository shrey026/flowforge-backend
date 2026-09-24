import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.ts";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { loginUser, registerUser } from "./auth.service.js";
import { createAccessToken } from "../../utils/jwt.js";

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

export const login = async (req: Request, res: Response) => {
    try {
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                status: "error",
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }

        const user = await loginUser(result.data);

        const token = createAccessToken(user.id);

        res.cookie("flowforge_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            status: "success",
            message: "Login successful",
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password",
            });
        }

        console.error("Login error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while logging in",
        });
    }
};

export const getMe = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    if (!req.user) {
        return res.status(401).json({
            status: "error",
            message: "Authentication required",
        });
    }

    return res.status(200).json({
        status: "success",
        data: {
            user: req.user,
        },
    });
};

export const logout = async (_req: Request, res: Response) => {
    res.clearCookie("flowforge_token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
};