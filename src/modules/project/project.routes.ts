import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {
    createProjectController,
    getOrganizationProjectsController,
    getProjectController,
    updateProjectController,
    deleteProjectController,
} from "./project.controller.js";

const router = Router();

router.post(
    "/organizations/:organizationId/projects",
    authenticate,
    createProjectController
);

router.get(
    "/organizations/:organizationId/projects",
    authenticate,
    getOrganizationProjectsController
);

router.get(
    "/projects/:projectId",
    authenticate,
    getProjectController
);

router.patch(
    "/projects/:projectId",
    authenticate,
    updateProjectController
);

router.delete(
    "/projects/:projectId",
    authenticate,
    deleteProjectController
);

export default router;