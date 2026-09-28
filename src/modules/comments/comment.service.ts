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

const commentAuthorSelect = {
    id: true,
    name: true,
    email: true,
    avatarUrl: true,
} as const;

export const createComment = async (
    taskId: string,
    userId: string,
    content: string
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

    const comment = await prisma.comment.create({
        data: {
            taskId,
            authorId: userId,
            content,
        },
        include: {
            author: {
                select: commentAuthorSelect,
            },
        },
    });

    return comment;
};

export const getTaskComments = async (
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

    const comments = await prisma.comment.findMany({
        where: {
            taskId,
        },
        include: {
            author: {
                select: commentAuthorSelect,
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    return comments;
};

export const deleteComment = async (
    commentId: string,
    userId: string
) => {
    const comment = await prisma.comment.findUnique({
        where: {
            id: commentId,
        },
    });

    if (!comment) {
        throw new Error("COMMENT_NOT_FOUND");
    }

    if (comment.authorId !== userId) {
        throw new Error("COMMENT_ACCESS_DENIED");
    }

    await prisma.comment.delete({
        where: {
            id: commentId,
        },
    });
};
