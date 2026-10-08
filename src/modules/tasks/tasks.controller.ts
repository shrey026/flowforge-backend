import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    createTask,
    getProjectTasks,
    getOrganizationTasks,
    getTaskById,
    updateTask,
    deleteTask,
} from "./tasks.service.js";

export const createTaskController = async (
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

        const { projectId } = req.params;
        const {
            title,
            description,
            status,
            priority,
            assigneeId,
            dueDate,
        } = req.body;

        if (typeof projectId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Project ID is required",
            });
        }

        if (!title || typeof title !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Task title is required",
            });
        }
        const task = await createTask(
            projectId,
            req.user.id,
            {
                title: title.trim(),
                ...(typeof description === "string" && {
                    description: description.trim(),
                }),
                ...(status !== undefined && { status }),
                ...(priority !== undefined && { priority }),
                ...(assigneeId !== undefined && { assigneeId }),
                ...(dueDate !== undefined && { dueDate }),
            }
        );

        return res.status(201).json({
            status: "success",
            message: "Task created successfully",
            data: {
                task,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "PROJECT_NOT_FOUND"
        ) {
            return res.status(404).json({
                status: "error",
                message: "Project not found",
            });
        }

        if (
            error instanceof Error &&
            error.message === "ORGANIZATION_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this organization",
            });
        }

        if (
            error instanceof Error &&
            error.message === "PROJECT_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this project",
            });
        }

        if (
            error instanceof Error &&
            error.message ===
            "ASSIGNEE_NOT_IN_ORGANIZATION"
        ) {
            return res.status(400).json({
                status: "error",
                message:
                    "Assignee is not a member of this organization",
            });
        }

        if (
            error instanceof Error &&
            error.message === "ASSIGNEE_NOT_IN_PROJECT"
        ) {
            return res.status(400).json({
                status: "error",
                message:
                    "Assignee is not a member of this project",
            });
        }

        console.error("Create task error:", error);

        return res.status(500).json({
            status: "error",
            message:
                "Something went wrong while creating the task",
        });
    }
};

export const getProjectTasksController = async (
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

        const { projectId } = req.params;

        if (typeof projectId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Project ID is required",
            });
        }

        const tasks = await getProjectTasks(
            projectId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            data: {
                tasks,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "PROJECT_NOT_FOUND"
        ) {
            return res.status(404).json({
                status: "error",
                message: "Project not found",
            });
        }

        if (
            error instanceof Error &&
            error.message === "ORGANIZATION_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this organization",
            });
        }

        if (
            error instanceof Error &&
            error.message === "PROJECT_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this project",
            });
        }

        console.error("Get project tasks error:", error);

        return res.status(500).json({
            status: "error",
            message:
                "Something went wrong while fetching tasks",
        });
    }
};

export const getOrganizationTasksController = async (
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

        const { organizationId } = req.params;

        if (typeof organizationId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Organization ID is required",
            });
        }

        const tasks = await getOrganizationTasks(
            organizationId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            data: {
                tasks,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "ORGANIZATION_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this organization",
            });
        }

        console.error("Get organization tasks error:", error);

        return res.status(500).json({
            status: "error",
            message:
                "Something went wrong while fetching tasks",
        });
    }
};

export const getTaskController = async (
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

        const { taskId } = req.params;

        if (typeof taskId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Task ID is required",
            });
        }

        const task = await getTaskById(
            taskId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            data: {
                task,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "TASK_NOT_FOUND"
        ) {
            return res.status(404).json({
                status: "error",
                message: "Task not found",
            });
        }

        if (
            error instanceof Error &&
            error.message === "ORGANIZATION_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this organization",
            });
        }

        if (
            error instanceof Error &&
            error.message === "PROJECT_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this project",
            });
        }

        console.error("Get task error:", error);

        return res.status(500).json({
            status: "error",
            message:
                "Something went wrong while fetching the task",
        });
    }
};

export const updateTaskController = async (
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

        const { taskId } = req.params;

        if (typeof taskId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Task ID is required",
            });
        }

        const {
            title,
            description,
            status,
            priority,
            assigneeId,
            dueDate,
        } = req.body;

        const task = await updateTask(
            taskId,
            req.user.id,
            {
                ...(title !== undefined && { title }),
                ...(description !== undefined && {
                    description,
                }),
                ...(status !== undefined && { status }),
                ...(priority !== undefined && { priority }),
                ...(assigneeId !== undefined && {
                    assigneeId,
                }),
                ...(dueDate !== undefined && {
                    dueDate,
                }),
            }
        );

        return res.status(200).json({
            status: "success",
            message: "Task updated successfully",
            data: {
                task,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "TASK_NOT_FOUND"
        ) {
            return res.status(404).json({
                status: "error",
                message: "Task not found",
            });
        }

        if (
            error instanceof Error &&
            error.message === "ORGANIZATION_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this organization",
            });
        }

        if (
            error instanceof Error &&
            error.message === "PROJECT_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this project",
            });
        }

        if (
            error instanceof Error &&
            error.message ===
            "ASSIGNEE_NOT_IN_ORGANIZATION"
        ) {
            return res.status(400).json({
                status: "error",
                message:
                    "Assignee is not a member of this organization",
            });
        }

        if (
            error instanceof Error &&
            error.message === "ASSIGNEE_NOT_IN_PROJECT"
        ) {
            return res.status(400).json({
                status: "error",
                message:
                    "Assignee is not a member of this project",
            });
        }

        console.error("Update task error:", error);

        return res.status(500).json({
            status: "error",
            message:
                "Something went wrong while updating the task",
        });
    }
};

export const deleteTaskController = async (
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

        const { taskId } = req.params;

        if (typeof taskId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Task ID is required",
            });
        }

        await deleteTask(
            taskId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            message: "Task deleted successfully",
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "TASK_NOT_FOUND"
        ) {
            return res.status(404).json({
                status: "error",
                message: "Task not found",
            });
        }

        if (
            error instanceof Error &&
            error.message === "ORGANIZATION_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have access to this organization",
            });
        }

        if (
            error instanceof Error &&
            error.message === "INSUFFICIENT_PERMISSIONS"
        ) {
            return res.status(403).json({
                status: "error",
                message:
                    "You do not have permission to delete tasks",
            });
        }

        console.error("Delete task error:", error);

        return res.status(500).json({
            status: "error",
            message:
                "Something went wrong while deleting the task",
        });
    }
};