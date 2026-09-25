import { prisma } from "../../lib/prisma.js";

interface CreateOrganizationInput {
    name: string;
    slug: string;
}

export const createOrganization = async (
    input: CreateOrganizationInput,
    userId: string
) => {
    const existingOrganization = await prisma.organization.findUnique({
        where: {
            slug: input.slug,
        },
    });

    if (existingOrganization) {
        throw new Error("ORGANIZATION_SLUG_EXISTS");
    }

    const organization = await prisma.organization.create({
        data: {
            name: input.name,
            slug: input.slug,
            members: {
                create: {
                    userId,
                    role: "OWNER",
                },
            },
        },
        include: {
            members: {
                select: {
                    id: true,
                    userId: true,
                    role: true,
                    joinedAt: true,
                },
            },
        },
    });

    return organization;
};

export const getUserOrganizations = async (userId: string) => {
    const memberships = await prisma.organizationMember.findMany({
        where: {
            userId,
        },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
        orderBy: {
            joinedAt: "asc",
        },
    });

    return memberships.map((membership) => ({
        ...membership.organization,
        role: membership.role,
        membershipId: membership.id,
        joinedAt: membership.joinedAt,
    }));
};

export const getOrganizationById = async (
    organizationId: string,
    userId: string
) => {
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    createdAt: true,
                    updatedAt: true,
                    members: {
                        select: {
                            id: true,
                            userId: true,
                            role: true,
                            joinedAt: true,
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!membership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    return {
        ...membership.organization,
        role: membership.role,
    };
};

export const getOrganizationMembers = async (
    organizationId: string,
    userId: string
) => {
    const requesterMembership =
        await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
        });

    if (!requesterMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const members = await prisma.organizationMember.findMany({
        where: {
            organizationId,
        },
        select: {
            id: true,
            userId: true,
            role: true,
            joinedAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
        },
        orderBy: {
            joinedAt: "asc",
        },
    });

    return {
        requesterRole: requesterMembership.role,
        members,
    };
};

export const updateOrganizationMemberRole = async (
    organizationId: string,
    targetUserId: string,
    newRole: "OWNER" | "ADMIN" | "MEMBER",
    requesterUserId: string
) => {
    const requesterMembership =
        await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: requesterUserId,
                    organizationId,
                },
            },
        });

    if (!requesterMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (requesterMembership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    if (targetUserId === requesterUserId) {
        throw new Error("CANNOT_CHANGE_OWN_ROLE");
    }

    const targetMembership =
        await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: targetUserId,
                    organizationId,
                },
            },
        });

    if (!targetMembership) {
        throw new Error("TARGET_MEMBER_NOT_FOUND");
    }

    if (targetMembership.role === "OWNER") {
        throw new Error("CANNOT_MODIFY_OWNER");
    }

    if (
        requesterMembership.role === "ADMIN" &&
        newRole !== "MEMBER"
    ) {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    if (newRole === "OWNER") {
        throw new Error("OWNER_ROLE_TRANSFER_NOT_SUPPORTED");
    }

    const updatedMember =
        await prisma.organizationMember.update({
            where: {
                id: targetMembership.id,
            },
            data: {
                role: newRole,
            },
            select: {
                id: true,
                userId: true,
                role: true,
                joinedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
        });

    return updatedMember;
};

export const removeOrganizationMember = async (
    organizationId: string,
    targetUserId: string,
    requesterUserId: string
) => {
    const requesterMembership =
        await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: requesterUserId,
                    organizationId,
                },
            },
        });

    if (!requesterMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (requesterMembership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    if (targetUserId === requesterUserId) {
        throw new Error("CANNOT_REMOVE_SELF");
    }

    const targetMembership =
        await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: targetUserId,
                    organizationId,
                },
            },
        });

    if (!targetMembership) {
        throw new Error("TARGET_MEMBER_NOT_FOUND");
    }

    if (targetMembership.role === "OWNER") {
        throw new Error("CANNOT_REMOVE_OWNER");
    }

    if (
        requesterMembership.role === "ADMIN" &&
        targetMembership.role !== "MEMBER"
    ) {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    await prisma.organizationMember.delete({
        where: {
            id: targetMembership.id,
        },
    });
};