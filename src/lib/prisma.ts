import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "flowforge",
    connectionLimit: 5,
    // MySQL 8's default caching_sha2_password auth plugin needs to fetch
    // an RSA public key to encrypt the password; the driver only does that
    // when explicitly allowed. Fine for local dev without TLS — do not
    // enable this against a production database.
    allowPublicKeyRetrieval: true,
});

export const prisma = new PrismaClient({
    adapter,
});