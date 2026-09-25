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