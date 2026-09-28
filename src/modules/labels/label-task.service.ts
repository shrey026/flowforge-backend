import { prisma } from "../../lib/prisma.js";

const getTaskWithProject = async (taskId: string) => {
    return prisma.task.findUnique({
        where: {
            id: taskId,
        },
        select: {
            id: true,
            projectId: true,
            project: {
                select: {
                    organizationId: true,
                },
            },
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

export const addLabelToTask = async (
    taskId: string,
    labelId: string,
    userId: string
) => {
    const task = await getTaskWithProject(taskId);

    if (!task) {
        throw new Error("TASK_NOT_FOUND");
    }

    const membership = await getOrganizationMembership(
        task.project.organizationId,
        userId
    );

    if (!membership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const label = await prisma.label.findUnique({
        where: {
            id: labelId,
        },
    });

    if (!label) {
        throw new Error("LABEL_NOT_FOUND");
    }

    if (label.organizationId !== task.project.organizationId) {
        throw new Error("LABEL_ORGANIZATION_MISMATCH");
    }

    const existingTaskLabel = await prisma.taskLabel.findUnique({
        where: {
            taskId_labelId: {
                taskId,
                labelId,
            },
        },
    });

    if (existingTaskLabel) {
        throw new Error("LABEL_ALREADY_ATTACHED");
    }

    const taskLabel = await prisma.taskLabel.create({
        data: {
            taskId,
            labelId,
        },
        include: {
            label: true,
        },
    });

    return taskLabel;
};

export const getTaskLabels = async (
    taskId: string,
    userId: string
) => {
    const task = await getTaskWithProject(taskId);

    if (!task) {
        throw new Error("TASK_NOT_FOUND");
    }

    const membership = await getOrganizationMembership(
        task.project.organizationId,
        userId
    );

    if (!membership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const taskLabels = await prisma.taskLabel.findMany({
        where: {
            taskId,
        },
        include: {
            label: true,
        },
        orderBy: {
            label: {
                name: "asc",
            },
        },
    });

    return taskLabels;
};

export const removeLabelFromTask = async (
    taskId: string,
    labelId: string,
    userId: string
) => {
    const task = await getTaskWithProject(taskId);

    if (!task) {
        throw new Error("TASK_NOT_FOUND");
    }

    const membership = await getOrganizationMembership(
        task.project.organizationId,
        userId
    );

    if (!membership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const taskLabel = await prisma.taskLabel.findUnique({
        where: {
            taskId_labelId: {
                taskId,
                labelId,
            },
        },
    });

    if (!taskLabel) {
        throw new Error("LABEL_NOT_ATTACHED");
    }

    await prisma.taskLabel.delete({
        where: {
            taskId_labelId: {
                taskId,
                labelId,
            },
        },
    });
};