import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
    createOrganization,
    getUserOrganizations,
    getOrganizationById,
} from "./organization.service.js";

export const createOrganizationController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const { name, slug } = req.body;

        if (!name || typeof name !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Organization name is required",
            });
        }

        if (!slug || typeof slug !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Organization slug is required",
            });
        }

        const organization = await createOrganization(
            {
                name: name.trim(),
                slug: slug.toLowerCase().trim(),
            },
            req.user.id
        );

        return res.status(201).json({
            status: "success",
            message: "Organization created successfully",
            data: {
                organization,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "ORGANIZATION_SLUG_EXISTS"
        ) {
            return res.status(409).json({
                status: "error",
                message: "An organization with this slug already exists",
            });
        }

        console.error("Create organization error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while creating the organization",
        });
    }
};
export const getOrganizationsController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const organizations = await getUserOrganizations(req.user.id);

        return res.status(200).json({
            status: "success",
            data: {
                organizations,
            },
        });
    } catch (error) {
        console.error("Get organizations error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while fetching organizations",
        });
    }
};

export const getOrganizationController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const organizationId = req.params.id;

        if (typeof organizationId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Organization ID is required",
            });
        }

        const organization = await getOrganizationById(
            organizationId,
            req.user.id
        );
        return res.status(200).json({
            status: "success",
            data: {
                organization,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "ORGANIZATION_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message: "You do not have access to this organization",
            });
        }

        console.error("Get organization error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while fetching the organization",
        });
    }
};