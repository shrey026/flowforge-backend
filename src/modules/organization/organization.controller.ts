import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
    createOrganization,
    getUserOrganizations,
    getOrganizationById,
    getOrganizationMembers,
    updateOrganizationMemberRole,
    removeOrganizationMember,
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


export const getOrganizationMembersController = async (
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

        const result = await getOrganizationMembers(
            organizationId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            data: result,
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

        console.error("Get organization members error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while fetching organization members",
        });
    }
};

export const updateOrganizationMemberRoleController = async (
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
        const targetUserId = req.params.userId;
        const { role } = req.body;

        if (
            typeof organizationId !== "string" ||
            typeof targetUserId !== "string"
        ) {
            return res.status(400).json({
                status: "error",
                message: "Organization ID and user ID are required",
            });
        }

        if (
            role !== "OWNER" &&
            role !== "ADMIN" &&
            role !== "MEMBER"
        ) {
            return res.status(400).json({
                status: "error",
                message: "Invalid organization role",
            });
        }

        const member = await updateOrganizationMemberRole(
            organizationId,
            targetUserId,
            role,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            message: "Member role updated successfully",
            data: {
                member,
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

        if (
            error instanceof Error &&
            [
                "INSUFFICIENT_PERMISSIONS",
                "CANNOT_CHANGE_OWN_ROLE",
                "CANNOT_MODIFY_OWNER",
                "OWNER_ROLE_TRANSFER_NOT_SUPPORTED",
            ].includes(error.message)
        ) {
            return res.status(403).json({
                status: "error",
                message: error.message,
            });
        }

        if (
            error instanceof Error &&
            error.message === "TARGET_MEMBER_NOT_FOUND"
        ) {
            return res.status(404).json({
                status: "error",
                message: "Target user is not a member of this organization",
            });
        }

        console.error("Update organization member role error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while updating member role",
        });
    }
};

export const removeOrganizationMemberController = async (
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
        const targetUserId = req.params.userId;

        if (
            typeof organizationId !== "string" ||
            typeof targetUserId !== "string"
        ) {
            return res.status(400).json({
                status: "error",
                message: "Organization ID and user ID are required",
            });
        }

        await removeOrganizationMember(
            organizationId,
            targetUserId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            message: "Member removed successfully",
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

        if (
            error instanceof Error &&
            [
                "INSUFFICIENT_PERMISSIONS",
                "CANNOT_REMOVE_SELF",
                "CANNOT_REMOVE_OWNER",
            ].includes(error.message)
        ) {
            return res.status(403).json({
                status: "error",
                message: error.message,
            });
        }

        if (
            error instanceof Error &&
            error.message === "TARGET_MEMBER_NOT_FOUND"
        ) {
            return res.status(404).json({
                status: "error",
                message: "Target user is not a member of this organization",
            });
        }

        console.error("Remove organization member error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while removing the member",
        });
    }
};