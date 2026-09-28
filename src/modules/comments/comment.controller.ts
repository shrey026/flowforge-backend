import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    createComment,
    getTaskComments,
    deleteComment,
} from "./comment.service.js";

export const createCommentController = async (
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
        const { content } = req.body;

        if (typeof taskId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Task ID is required",
            });
        }

        if (!content || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                status: "error",
                message: "Comment content is required",
            });
        }

        const comment = await createComment(
            taskId,
            req.user.id,
            content.trim()
        );

        return res.status(201).json({
            status: "success",
            message: "Comment created successfully",
            data: {
                comment,
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
        }

        console.error("Create comment error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while creating the comment",
        });
    }
};

export const getTaskCommentsController = async (
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

        const comments = await getTaskComments(
            taskId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            data: {
                comments,
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
        }

        console.error("Get task comments error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while fetching comments",
        });
    }
};

export const deleteCommentController = async (
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

        const { commentId } = req.params;

        if (typeof commentId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Comment ID is required",
            });
        }

        await deleteComment(
            commentId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            message: "Comment deleted successfully",
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "COMMENT_NOT_FOUND") {
                return res.status(404).json({
                    status: "error",
                    message: "Comment not found",
                });
            }

            if (error.message === "COMMENT_ACCESS_DENIED") {
                return res.status(403).json({
                    status: "error",
                    message: "You can only delete your own comments",
                });
            }
        }

        console.error("Delete comment error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while deleting the comment",
        });
    }
};
