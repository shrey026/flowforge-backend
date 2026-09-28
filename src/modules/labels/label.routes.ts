import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {
    createLabelController,
    getOrganizationLabelsController,
} from "./label.controller.js";

import {
    addLabelToTaskController,
    getTaskLabelsController,
    removeLabelFromTaskController,
} from "./label-task.controller.js";

const router = Router();

router.post(
    "/organizations/:organizationId/labels",
    authenticate,
    createLabelController
);

router.get(
    "/organizations/:organizationId/labels",
    authenticate,
    getOrganizationLabelsController
);
router.post(
    "/tasks/:taskId/labels",
    authenticate,
    addLabelToTaskController
);

router.get(
    "/tasks/:taskId/labels",
    authenticate,
    getTaskLabelsController
);

router.delete(
    "/tasks/:taskId/labels/:labelId",
    authenticate,
    removeLabelFromTaskController
);
export default router;