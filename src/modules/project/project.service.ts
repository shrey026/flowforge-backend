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


export const getProjectMembers = async (
    projectId: string,
    userId: string
) => {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
        select: {
            id: true,
            organizationId: true,
        },
    });

    if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
    }

    const requesterMembership = await getOrganizationMembership(
        project.organizationId,
        userId
    );

    if (!requesterMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const members = await prisma.projectMember.findMany({
        where: {
            projectId,
        },
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
        orderBy: {
            joinedAt: "asc",
        },
    });

    return {
        requesterRole: requesterMembership.role,
        members,
    };
};

export const addProjectMember = async (
    projectId: string,
    targetUserId: string,
    requesterUserId: string
) => {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
        select: {
            id: true,
            organizationId: true,
        },
    });

    if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
    }

    const requesterMembership = await getOrganizationMembership(
        project.organizationId,
        requesterUserId
    );

    if (!requesterMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (requesterMembership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    const targetOrganizationMembership =
        await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: targetUserId,
                    organizationId: project.organizationId,
                },
            },
        });

    if (!targetOrganizationMembership) {
        throw new Error("TARGET_USER_NOT_IN_ORGANIZATION");
    }

    const existingProjectMember =
        await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: targetUserId,
                },
            },
        });

    if (existingProjectMember) {
        throw new Error("PROJECT_MEMBER_ALREADY_EXISTS");
    }

    const projectMember = await prisma.projectMember.create({
        data: {
            projectId,
            userId: targetUserId,
        },
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
    });

    return projectMember;
};

export const removeProjectMember = async (
    projectId: string,
    targetUserId: string,
    requesterUserId: string
) => {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
        select: {
            id: true,
            organizationId: true,
        },
    });

    if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
    }

    const requesterMembership = await getOrganizationMembership(
        project.organizationId,
        requesterUserId
    );

    if (!requesterMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (requesterMembership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    const projectMember = await prisma.projectMember.findUnique({
        where: {
            projectId_userId: {
                projectId,
                userId: targetUserId,
            },
        },
    });

    if (!projectMember) {
        throw new Error("PROJECT_MEMBER_NOT_FOUND");
    }

    await prisma.projectMember.delete({
        where: {
            id: projectMember.id,
        },
    });
};