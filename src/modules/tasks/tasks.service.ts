import { prisma } from "../../lib/prisma.js";

interface CreateTaskInput {
    title: string;
    description?: string;
    status?: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    assigneeId?: string;
    dueDate?: string;
}

interface UpdateTaskInput {
    title?: string;
    description?: string;
    status?: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    assigneeId?: string | null;
    dueDate?: string | null;
}

const getProjectWithOrganization = async (projectId: string) => {
    return prisma.project.findUnique({
        where: {
            id: projectId,
        },
        select: {
            id: true,
            organizationId: true,
        },
    });
};

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

const getProjectMembership = async (
    projectId: string,
    userId: string
) => {
    return prisma.projectMember.findUnique({
        where: {
            projectId_userId: {
                projectId,
                userId,
            },
        },
    });
};

export const createTask = async (
    projectId: string,
    userId: string,
    input: CreateTaskInput
) => {
    const project = await getProjectWithOrganization(projectId);

    if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
    }

    const organizationMembership = await getOrganizationMembership(
        project.organizationId,
        userId
    );

    if (!organizationMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const projectMembership = await getProjectMembership(
        projectId,
        userId
    );

    if (
        organizationMembership.role === "MEMBER" &&
        !projectMembership
    ) {
        throw new Error("PROJECT_ACCESS_DENIED");
    }

    if (input.assigneeId) {
        const assigneeOrganizationMembership =
            await getOrganizationMembership(
                project.organizationId,
                input.assigneeId
            );

        if (!assigneeOrganizationMembership) {
            throw new Error("ASSIGNEE_NOT_IN_ORGANIZATION");
        }

        const assigneeProjectMembership =
            await getProjectMembership(
                projectId,
                input.assigneeId
            );

        if (!assigneeProjectMembership) {
            throw new Error("ASSIGNEE_NOT_IN_PROJECT");
        }
    }

    const task = await prisma.task.create({
        data: {
            projectId,
            title: input.title,
            description: input.description ?? null,
            status: input.status ?? "TODO",
            priority: input.priority ?? "MEDIUM",
            assigneeId: input.assigneeId ?? null,
            createdById: userId,
            dueDate: input.dueDate
                ? new Date(input.dueDate)
                : null,
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
        },
    });

    return task;
};

export const getProjectTasks = async (
    projectId: string,
    userId: string
) => {
    const project = await getProjectWithOrganization(projectId);

    if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
    }

    const organizationMembership = await getOrganizationMembership(
        project.organizationId,
        userId
    );

    if (!organizationMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const projectMembership = await getProjectMembership(
        projectId,
        userId
    );

    if (
        organizationMembership.role === "MEMBER" &&
        !projectMembership
    ) {
        throw new Error("PROJECT_ACCESS_DENIED");
    }

    const tasks = await prisma.task.findMany({
        where: {
            projectId,
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    return tasks;
};

export const getOrganizationTasks = async (
    organizationId: string,
    userId: string
) => {
    const organizationMembership = await getOrganizationMembership(
        organizationId,
        userId
    );

    if (!organizationMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const tasks = await prisma.task.findMany({
        where: {
            project: {
                organizationId,
                ...(organizationMembership.role === "MEMBER"
                    ? {
                        members: {
                            some: {
                                userId,
                            },
                        },
                    }
                    : {}),
            },
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            project: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    return tasks;
};

export const getTaskById = async (
    taskId: string,
    userId: string
) => {
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            project: {
                select: {
                    id: true,
                    name: true,
                    organizationId: true,
                },
            },
        },
    });

    if (!task) {
        throw new Error("TASK_NOT_FOUND");
    }

    const organizationMembership = await getOrganizationMembership(
        task.project.organizationId,
        userId
    );

    if (!organizationMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const projectMembership = await getProjectMembership(
        task.projectId,
        userId
    );

    if (
        organizationMembership.role === "MEMBER" &&
        !projectMembership
    ) {
        throw new Error("PROJECT_ACCESS_DENIED");
    }

    return task;
};

export const updateTask = async (
    taskId: string,
    userId: string,
    input: UpdateTaskInput
) => {
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
        },
        include: {
            project: {
                select: {
                    id: true,
                    organizationId: true,
                },
            },
        },
    });

    if (!task) {
        throw new Error("TASK_NOT_FOUND");
    }

    const organizationMembership = await getOrganizationMembership(
        task.project.organizationId,
        userId
    );

    if (!organizationMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const projectMembership = await getProjectMembership(
        task.projectId,
        userId
    );

    if (
        organizationMembership.role === "MEMBER" &&
        !projectMembership
    ) {
        throw new Error("PROJECT_ACCESS_DENIED");
    }

    if (
        input.assigneeId !== undefined &&
        input.assigneeId !== null
    ) {
        const assigneeOrganizationMembership =
            await getOrganizationMembership(
                task.project.organizationId,
                input.assigneeId
            );

        if (!assigneeOrganizationMembership) {
            throw new Error("ASSIGNEE_NOT_IN_ORGANIZATION");
        }

        const assigneeProjectMembership =
            await getProjectMembership(
                task.projectId,
                input.assigneeId
            );

        if (!assigneeProjectMembership) {
            throw new Error("ASSIGNEE_NOT_IN_PROJECT");
        }
    }

    const updatedTask = await prisma.task.update({
        where: {
            id: taskId,
        },
        data: {
            ...(input.title !== undefined && {
                title: input.title,
            }),
            ...(input.description !== undefined && {
                description: input.description,
            }),
            ...(input.status !== undefined && {
                status: input.status,
            }),
            ...(input.priority !== undefined && {
                priority: input.priority,
            }),
            ...(input.assigneeId !== undefined && {
                assigneeId: input.assigneeId,
            }),
            ...(input.dueDate !== undefined && {
                dueDate: input.dueDate
                    ? new Date(input.dueDate)
                    : null,
            }),
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
        },
    });

    return updatedTask;
};

export const deleteTask = async (
    taskId: string,
    userId: string
) => {
    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
        },
        include: {
            project: {
                select: {
                    id: true,
                    organizationId: true,
                },
            },
        },
    });

    if (!task) {
        throw new Error("TASK_NOT_FOUND");
    }

    const organizationMembership = await getOrganizationMembership(
        task.project.organizationId,
        userId
    );

    if (!organizationMembership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (organizationMembership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    await prisma.task.delete({
        where: {
            id: taskId,
        },
    });
};