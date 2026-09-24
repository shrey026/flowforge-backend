import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

interface AuthTokenPayload {
    userId: string;
}

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    };
}

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    return secret;
};

export const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies?.flowforge_token;

        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const decoded = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;

        if (!decoded.userId) {
            return res.status(401).json({
                status: "error",
                message: "Invalid authentication token",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "User no longer exists",
            });
        }

        req.user = user;

        next();
    } catch (error) {
        console.error("Authentication error:", error);

        return res.status(401).json({
            status: "error",
            message: "Invalid or expired authentication token",
        });
    }
};