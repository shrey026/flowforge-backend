import { prisma } from "../../lib/prisma.js";
import {
    getOrganizationMembership,
    getProjectMembership,
} from "../tasks/tasks.service.js";

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

// Same access policy as the task endpoints: owners and admins can reach any
// task in their organization, members only tasks in projects they belong to.
const getAccessibleTask = async (taskId: string, userId: string) => {
    const task = await getTaskWithProject(taskId);

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
        const projectMembership = await getProjectMembership(
            task.projectId,
            userId
        );

        if (!projectMembership) {
            throw new Error("PROJECT_ACCESS_DENIED");
        }
    }

    return task;
};

export const addLabelToTask = async (
    taskId: string,
    labelId: string,
    userId: string
) => {
    const task = await getAccessibleTask(taskId, userId);

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
    await getAccessibleTask(taskId, userId);

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
    await getAccessibleTask(taskId, userId);

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
