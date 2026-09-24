import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";


export const registerUser = async (input: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: {
            email: input.email,
        },
    });

    if (existingUser) {
        throw new Error("USER_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            passwordHash,
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

    return user;
};

export const loginUser = async (input: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: {
            email: input.email,
        },
    });

    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const passwordMatches = await bcrypt.compare(
        input.password,
        user.passwordHash
    );

    if (!passwordMatches) {
        throw new Error("INVALID_CREDENTIALS");
    }

    return user;
};