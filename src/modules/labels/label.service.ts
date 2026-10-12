import { prisma } from "../../lib/prisma.js";

interface CreateLabelInput {
    name: string;
    color: string;
}

export const createLabel = async (
    organizationId: string,
    userId: string,
    input: CreateLabelInput
) => {
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });

    if (!membership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (membership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    const existingLabel = await prisma.label.findUnique({
        where: {
            organizationId_name: {
                organizationId,
                name: input.name,
            },
        },
    });

    if (existingLabel) {
        throw new Error("LABEL_ALREADY_EXISTS");
    }

    const label = await prisma.label.create({
        data: {
            organizationId,
            name: input.name,
            color: input.color,
        },
    });

    return label;
};

export const deleteLabel = async (
    organizationId: string,
    labelId: string,
    userId: string
) => {
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });

    if (!membership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    if (membership.role === "MEMBER") {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    // A single statement scoped to the organization: TaskLabel rows are
    // removed by the database's ON DELETE CASCADE, tasks are never touched,
    // and a concurrent delete simply matches zero rows.
    const { count } = await prisma.label.deleteMany({
        where: {
            id: labelId,
            organizationId,
        },
    });

    if (count === 0) {
        throw new Error("LABEL_NOT_FOUND");
    }
};

export const getOrganizationLabels = async (
    organizationId: string,
    userId: string
) => {
    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId,
            },
        },
    });

    if (!membership) {
        throw new Error("ORGANIZATION_ACCESS_DENIED");
    }

    const labels = await prisma.label.findMany({
        where: {
            organizationId,
        },
        orderBy: {
            name: "asc",
        },
    });

    return labels;
};