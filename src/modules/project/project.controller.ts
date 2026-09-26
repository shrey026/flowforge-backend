import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    createProject,
    getOrganizationProjects,
    getProjectById,
    updateProject,
    deleteProject,
} from "./project.service.js";

export const createProjectController = async (
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
        const { name, description } = req.body;

        if (typeof organizationId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Organization ID is required",
            });
        }

        if (!name || typeof name !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Project name is required",
            });
        }

        const project = await createProject(
            organizationId,
            req.user.id,
            {
                name: name.trim(),
                ...(typeof description === "string"
                    ? { description: description.trim() }
                    : {}),
            }
        );

        return res.status(201).json({
            status: "success",
            message: "Project created successfully",
            data: {
                project,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "ORGANIZATION_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message: "You do not have access to this organization",
            });
        }

        if (
            error instanceof Error &&
            error.message === "INSUFFICIENT_PERMISSIONS"
        ) {
            return res.status(403).json({
                status: "error",
                message: "You do not have permission to create projects",
            });
        }

        console.error("Create project error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while creating the project",
        });
    }
};

export const getOrganizationProjectsController = async (
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

        const projects = await getOrganizationProjects(
            organizationId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            data: {
                projects,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "ORGANIZATION_ACCESS_DENIED"
        ) {
            return res.status(403).json({
                status: "error",
                message: "You do not have access to this organization",
            });
        }

        console.error("Get organization projects error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while fetching projects",
        });
    }
};

export const getProjectController = async (
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

        const project = await getProjectById(
            projectId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            data: {
                project,
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
                message: "You do not have access to this project",
            });
        }

        console.error("Get project error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while fetching the project",
        });
    }
};

export const updateProjectController = async (
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
        const { name, description, status } = req.body;

        if (typeof projectId !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Project ID is required",
            });
        }

        if (
            name !== undefined &&
            typeof name !== "string"
        ) {
            return res.status(400).json({
                status: "error",
                message: "Project name must be a string",
            });
        }

        if (
            description !== undefined &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                status: "error",
                message: "Project description must be a string",
            });
        }

        const validStatuses = [
            "PLANNING",
            "ACTIVE",
            "COMPLETED",
            "ARCHIVED",
        ];

        if (
            status !== undefined &&
            !validStatuses.includes(status)
        ) {
            return res.status(400).json({
                status: "error",
                message: "Invalid project status",
            });
        }

        const project = await updateProject(
            projectId,
            req.user.id,
            {
                ...(name !== undefined
                    ? { name: name.trim() }
                    : {}),
                ...(description !== undefined
                    ? { description: description.trim() }
                    : {}),
                ...(status !== undefined
                    ? { status }
                    : {}),
            }
        );

        return res.status(200).json({
            status: "success",
            message: "Project updated successfully",
            data: {
                project,
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
                message: "You do not have access to this project",
            });
        }

        if (
            error instanceof Error &&
            error.message === "INSUFFICIENT_PERMISSIONS"
        ) {
            return res.status(403).json({
                status: "error",
                message: "You do not have permission to update this project",
            });
        }

        console.error("Update project error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while updating the project",
        });
    }
};

export const deleteProjectController = async (
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

        await deleteProject(
            projectId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            message: "Project deleted successfully",
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
                message: "You do not have access to this project",
            });
        }

        if (
            error instanceof Error &&
            error.message === "INSUFFICIENT_PERMISSIONS"
        ) {
            return res.status(403).json({
                status: "error",
                message: "You do not have permission to delete this project",
            });
        }

        console.error("Delete project error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while deleting the project",
        });
    }
};