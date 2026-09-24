import "dotenv/config";
import jwt from "jsonwebtoken";

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    return secret;
};

export const createAccessToken = (userId: string) => {
    return jwt.sign(
        {
            userId,
        },
        getJwtSecret(),
        {
            expiresIn: "7d",
        }
    );
};