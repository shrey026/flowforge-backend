import { prisma } from "../../lib/prisma.js";

interface CreateProjectInput {
    name: string;
    description?: string;
}

interface UpdateProjectInput {
    name?: string;
    description?: string;
    status?: "PLANNING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
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

export const createProject = async (
    organizationId: string,
    userId: string,
    input: CreateProjectInput
) => {
    const membership = await getOrganizationMembership(
        organizationId,
        userId
    );

    if (!membership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (membership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    const project = await prisma.project.create({
        data: {
            organizationId,
            name: input.name,
            description: input.description ?? null,
        },
    });

    return project;
};

export const getOrganizationProjects = async (
    organizationId: string,
    userId: string
) => {
    const membership = await getOrganizationMembership(
        organizationId,
        userId
    );

    if (!membership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const projects = await prisma.project.findMany({
        where: {
            organizationId,
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    return projects;
};

export const getProjectById = async (
    projectId: string,
    userId: string
) => {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            members: {
                select: {
                    id: true,
                    userId: true,
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
    });

    if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
    }

    const membership = await getOrganizationMembership(
        project.organizationId,
        userId
    );

    if (!membership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    return {
        ...project,
        requesterRole: membership.role,
    };
};

export const updateProject = async (
    projectId: string,
    userId: string,
    input: UpdateProjectInput
) => {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
    });

    if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
    }

    const membership = await getOrganizationMembership(
        project.organizationId,
        userId
    );

    if (!membership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (membership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    const updatedProject = await prisma.project.update({
        where: {
            id: projectId,
        },
        data: input,
    });

    return updatedProject;
};

export const deleteProject = async (
    projectId: string,
    userId: string
) => {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
    });

    if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
    }

    const membership = await getOrganizationMembership(
        project.organizationId,
        userId
    );

    if (!membership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (membership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    await prisma.project.delete({
        where: {
            id: projectId,
        },
    });
};