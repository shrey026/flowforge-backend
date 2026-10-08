import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

import {
    createLabel,
    getOrganizationLabels,
} from "./label.service.js";

// Matches the name column's length in the database.
const LABEL_NAME_MAX_LENGTH = 191;
const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Returns the color as uppercase `#RRGGBB`, or null if it isn't a hex color. */
const normalizeLabelColor = (color: string): string | null => {
    if (!HEX_COLOR_PATTERN.test(color)) {
        return null;
    }

    const hex = color.slice(1).toUpperCase();

    const full =
        hex.length === 3
            ? hex
                .split("")
                .map((char) => char + char)
                .join("")
            : hex;

    return `#${full}`;
};

export const createLabelController = async (
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

        const { name, color } = req.body;

        const trimmedName = typeof name === "string" ? name.trim() : "";

        if (!trimmedName) {
            return res.status(400).json({
                status: "error",
                message: "Label name is required",
            });
        }

        if (Array.from(trimmedName).length > LABEL_NAME_MAX_LENGTH) {
            return res.status(400).json({
                status: "error",
                message: `Label name must be ${LABEL_NAME_MAX_LENGTH} characters or fewer`,
            });
        }

        const normalizedColor =
            typeof color === "string"
                ? normalizeLabelColor(color.trim())
                : null;

        if (!normalizedColor) {
            return res.status(400).json({
                status: "error",
                message: "Label color must be a hex color like #22C55E",
            });
        }

        const label = await createLabel(
            organizationId,
            req.user.id,
            {
                name: trimmedName,
                color: normalizedColor,
            }
        );

        return res.status(201).json({
            status: "success",
            message: "Label created successfully",
            data: {
                label,
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
                message: "You do not have permission to create labels",
            });
        }

        if (
            error instanceof Error &&
            error.message === "LABEL_ALREADY_EXISTS"
        ) {
            return res.status(409).json({
                status: "error",
                message: "A label with this name already exists",
            });
        }

        console.error("Create label error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while creating the label",
        });
    }
};

export const getOrganizationLabelsController = async (
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

        const labels = await getOrganizationLabels(
            organizationId,
            req.user.id
        );

        return res.status(200).json({
            status: "success",
            data: {
                labels,
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

        console.error("Get organization labels error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while fetching labels",
        });
    }
};