import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./modules/auth/auth.routes.js";
import cookieParser from "cookie-parser";
import organizationRoutes from "./modules/organization/organization.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);


app.get("/api/health", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: "ok",
            message: "FlowForge API is running",
            database: "connected",
        });
    } catch (error) {
        console.error("Database connection failed:", error);

        res.status(500).json({
            status: "error",
            message: "FlowForge API is running, but database connection failed",
            database: "disconnected",
        });
    }
});

app.listen(PORT, () => {
    console.log(`FlowForge API running on http://localhost:${PORT}`);
});