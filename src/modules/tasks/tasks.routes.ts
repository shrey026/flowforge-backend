import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {
    createTaskController,
    getProjectTasksController,
    getOrganizationTasksController,
    getTaskController,
    updateTaskController,
    deleteTaskController,
} from "./tasks.controller.js";

const router = Router();

router.post(
    "/projects/:projectId/tasks",
    authenticate,
    createTaskController
);

router.get(
    "/projects/:projectId/tasks",
    authenticate,
    getProjectTasksController
);

router.get(
    "/organizations/:organizationId/tasks",
    authenticate,
    getOrganizationTasksController
);

router.get(
    "/tasks/:taskId",
    authenticate,
    getTaskController
);

router.patch(
    "/tasks/:taskId",
    authenticate,
    updateTaskController
);

router.delete(
    "/tasks/:taskId",
    authenticate,
    deleteTaskController
);

export default router;