import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";

const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

interface CreateInvitationInput {
    email: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
}

const getOrganizationMembership = async (
    organizationId: string,
    userId: string
) => {
    return prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });
};

const generateInvitationToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

export const createInvitation = async (
    organizationId: string,
    requesterUserId: string,
    input: CreateInvitationInput
) => {
    const requesterMembership = await getOrganizationMembership(
        organizationId,
        requesterUserId
    );

    if (!requesterMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (requesterMembership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    const existingMember = await prisma.organizationMember.findFirst({
        where: {
            organizationId,
            user: {
                email: input.email,
            },
        },
    });

    if (existingMember) {
        throw new Error("ORGANIZATION_MEMBER_ALREADY_EXISTS");
    }

    const existingInvitation = await prisma.organizationInvitation.findFirst({
        where: {
            organizationId,
            email: input.email,
            acceptedAt: null,
            expiresAt: {
                gt: new Date(),
            },
        },
    });

    if (existingInvitation) {
        throw new Error("INVITATION_ALREADY_EXISTS");
    }

    const invitation = await prisma.organizationInvitation.create({
        data: {
            organizationId,
            email: input.email,
            role: input.role,
            token: generateInvitationToken(),
            expiresAt: new Date(Date.now() + INVITATION_EXPIRY_MS),
        },
    });

    return invitation;
};

export const getOrganizationInvitations = async (
    organizationId: string,
    requesterUserId: string
) => {
    const requesterMembership = await getOrganizationMembership(
        organizationId,
        requesterUserId
    );

    if (!requesterMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (requesterMembership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    const invitations = await prisma.organizationInvitation.findMany({
        where: {
            organizationId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return invitations;
};

export const acceptInvitation = async (
    token: string,
    userId: string,
    userEmail: string
) => {
    const invitation = await prisma.organizationInvitation.findUnique({
        where: {
            token,
        },
    });

    if (!invitation) {
        throw new Error("INVITATION_NOT_FOUND");
    }

    if (invitation.acceptedAt) {
        throw new Error("INVITATION_ALREADY_ACCEPTED");
    }

    if (invitation.expiresAt < new Date()) {
        throw new Error("INVITATION_EXPIRED");
    }

    if (invitation.email !== userEmail) {
        throw new Error("INVITATION_EMAIL_MISMATCH");
    }

    const existingMembership = await getOrganizationMembership(
        invitation.organizationId,
        userId
    );

    if (existingMembership) {
        throw new Error("ORGANIZATION_MEMBER_ALREADY_EXISTS");
    }

    const [member] = await prisma.$transaction([
        prisma.organizationMember.create({
            data: {
                userId,
                organizationId: invitation.organizationId,
                role: invitation.role,
            },
        }),
        prisma.organizationInvitation.update({
            where: {
                id: invitation.id,
            },
            data: {
                acceptedAt: new Date(),
            },
        }),
    ]);

    return member;
};

export const revokeInvitation = async (
    organizationId: string,
    invitationId: string,
    requesterUserId: string
) => {
    const requesterMembership = await getOrganizationMembership(
        organizationId,
        requesterUserId
    );

    if (!requesterMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (requesterMembership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    const invitation = await prisma.organizationInvitation.findUnique({
        where: {
            id: invitationId,
        },
    });

    if (!invitation) {
        throw new Error("INVITATION_NOT_FOUND");
    }

    if (invitation.organizationId !== organizationId) {
        throw new Error("INVITATION_ORGANIZATION_MISMATCH");
    }

    await prisma.organizationInvitation.delete({
        where: {
            id: invitationId,
        },
    });
};
