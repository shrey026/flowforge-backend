import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    createInvitation,
    getOrganizationInvitations,
    acceptInvitation,
    revokeInvitation,
} from "./invitation.service.js";

export const createInvitationController = async (
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
        const { email, role } = req.body;

        if (typeof organizationId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Organization ID is required",
            });
        }

        if (!email || typeof email !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Invitation email is required",
            });
        }

        if (
            role !== undefined &&
            role !== "OWNER" &&
            role !== "ADMIN" &&
            role !== "MEMBER"
        ) {
            return res.status(400).json({
                status: "error",
                message: "Invalid organization role",
            });
        }

        const invitation = await createInvitation(
            organizationId,
            req.user.id,
            {
                email: email.trim().toLowerCase(),
                role: role ?? "MEMBER",
            }
        );

        return res.status(201).json({
            status: "success",
            message: "Invitation created successfully",
            data: {
                invitation,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "ORGANIZATION_ACCESS_DENIED") {
                return res.status(403).json({
                    status: "error",
                    message: "You do not have access to this organization",
                });
            }

            if (error.message === "INSUFFICIENT_PERMISSIONS") {
                return res.status(403).json({
                    status: "error",
                    message: "You do not have permission to invite members",
                });
            }

            if (error.message === "ORGANIZATION_MEMBER_ALREADY_EXISTS") {
                return res.status(409).json({
                    status: "error",
                    message: "This user is already a member of the organization",
                });
            }

            if (error.message === "INVITATION_ALREADY_EXISTS") {
                return res.status(409).json({
                    status: "error",
                    message: "A pending invitation already exists for this email",
                });
            }
        }

        console.error("Create invitation error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while creating the invitation",
        });
    }
};

export const getOrganizationInvitationsController = async (
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

        const invitations = await getOrganizationInvitations(
            organizationId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            data: {
                invitations,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "ORGANIZATION_ACCESS_DENIED") {
                return res.status(403).json({
                    status: "error",
                    message: "You do not have access to this organization",
                });
            }

            if (error.message === "INSUFFICIENT_PERMISSIONS") {
                return res.status(403).json({
                    status: "error",
                    message: "You do not have permission to view invitations",
                });
            }
        }

        console.error("Get organization invitations error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while fetching invitations",
        });
    }
};

export const acceptInvitationController = async (
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

        const { token } = req.body;

        if (!token || typeof token !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Invitation token is required",
            });
        }

        const member = await acceptInvitation(
            token,
            req.user.id,
            req.user.email
        );

        return res.status(200).json({
            status: "success",
            message: "Invitation accepted successfully",
            data: {
                member,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "INVITATION_NOT_FOUND") {
                return res.status(404).json({
                    status: "error",
                    message: "Invitation not found",
                });
            }

            if (error.message === "INVITATION_ALREADY_ACCEPTED") {
                return res.status(409).json({
                    status: "error",
                    message: "This invitation has already been accepted",
                });
            }

            if (error.message === "INVITATION_EXPIRED") {
                return res.status(410).json({
                    status: "error",
                    message: "This invitation has expired",
                });
            }

            if (error.message === "INVITATION_EMAIL_MISMATCH") {
                return res.status(403).json({
                    status: "error",
                    message: "This invitation was not issued to your account",
                });
            }

            if (error.message === "ORGANIZATION_MEMBER_ALREADY_EXISTS") {
                return res.status(409).json({
                    status: "error",
                    message: "You are already a member of this organization",
                });
            }
        }

        console.error("Accept invitation error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while accepting the invitation",
        });
    }
};

export const revokeInvitationController = async (
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
        const { invitationId } = req.params;

        if (
            typeof organizationId !== "string" ||
            typeof invitationId !== "string"
        ) {
            return res.status(400).json({
                status: "error",
                message: "Organization ID and invitation ID are required",
            });
        }

        await revokeInvitation(
            organizationId,
            invitationId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            message: "Invitation revoked successfully",
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "ORGANIZATION_ACCESS_DENIED") {
                return res.status(403).json({
                    status: "error",
                    message: "You do not have access to this organization",
                });
            }

            if (error.message === "INSUFFICIENT_PERMISSIONS") {
                return res.status(403).json({
                    status: "error",
                    message: "You do not have permission to revoke invitations",
                });
            }

            if (error.message === "INVITATION_NOT_FOUND") {
                return res.status(404).json({
                    status: "error",
                    message: "Invitation not found",
                });
            }

            if (error.message === "INVITATION_ORGANIZATION_MISMATCH") {
                return res.status(404).json({
                    status: "error",
                    message: "Invitation not found",
                });
            }
        }

        console.error("Revoke invitation error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while revoking the invitation",
        });
    }
};
