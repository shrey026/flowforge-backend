import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    addLabelToTask,
    getTaskLabels,
    removeLabelFromTask,
} from "./label-task.service.js";

export const addLabelToTaskController = async (
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
        const { labelId } = req.body;

        if (typeof taskId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Task ID is required",
            });
        }

        if (!labelId || typeof labelId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Label ID is required",
            });
        }

        const taskLabel = await addLabelToTask(
            taskId,
            labelId,
            req.user.id
        );

        return res.status(201).json({
            status: "success",
            message: "Label added to task successfully",
            data: {
                taskLabel,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "TASK_NOT_FOUND") {
                return res.status(404).json({
                    status: "error",
                    message: "Task not found",
                });
            }

            if (error.message === "LABEL_NOT_FOUND") {
                return res.status(404).json({
                    status: "error",
                    message: "Label not found",
                });
            }

            if (error.message === "ORGANIZATION_ACCESS_DENIED") {
                return res.status(403).json({
                    status: "error",
                    message: "You do not have access to this organization",
                });
            }

            if (error.message === "PROJECT_ACCESS_DENIED") {
                return res.status(403).json({
                    status: "error",
                    message: "You do not have access to this project",
                });
            }

            if (error.message === "LABEL_ORGANIZATION_MISMATCH") {
                return res.status(403).json({
                    status: "error",
                    message: "Label does not belong to this organization",
                });
            }

            if (error.message === "LABEL_ALREADY_ATTACHED") {
                return res.status(409).json({
                    status: "error",
                    message: "Label is already attached to this task",
                });
            }
        }

        console.error("Add label to task error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while adding the label",
        });
    }
};

export const getTaskLabelsController = async (
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

        const taskLabels = await getTaskLabels(
            taskId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            data: {
                taskLabels,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "TASK_NOT_FOUND") {
                return res.status(404).json({
                    status: "error",
                    message: "Task not found",
                });
            }

            if (error.message === "ORGANIZATION_ACCESS_DENIED") {
                return res.status(403).json({
                    status: "error",
                    message: "You do not have access to this organization",
                });
            }

            if (error.message === "PROJECT_ACCESS_DENIED") {
                return res.status(403).json({
                    status: "error",
                    message: "You do not have access to this project",
                });
            }
        }

        console.error("Get task labels error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while fetching task labels",
        });
    }
};

export const removeLabelFromTaskController = async (
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

        const { taskId, labelId } = req.params;

        if (
            typeof taskId !== "string" ||
            typeof labelId !== "string"
        ) {
            return res.status(400).json({
                status: "error",
                message: "Task ID and Label ID are required",
            });
        }

        await removeLabelFromTask(
            taskId,
            labelId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            message: "Label removed from task successfully",
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "TASK_NOT_FOUND") {
                return res.status(404).json({
                    status: "error",
                    message: "Task not found",
                });
            }

            if (error.message === "ORGANIZATION_ACCESS_DENIED") {
                return res.status(403).json({
                    status: "error",
                    message: "You do not have access to this organization",
                });
            }

            if (error.message === "PROJECT_ACCESS_DENIED") {
                return res.status(403).json({
                    status: "error",
                    message: "You do not have access to this project",
                });
            }

            if (error.message === "LABEL_NOT_ATTACHED") {
                return res.status(404).json({
                    status: "error",
                    message: "Label is not attached to this task",
                });
            }
        }

        console.error("Remove label from task error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while removing the label",
        });
    }
};