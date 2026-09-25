import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    createOrganizationController,
    getOrganizationsController,
    getOrganizationController,
} from "./organization.controller.js";

const router = Router();

router.post(
    "/",
    authenticate,
    createOrganizationController
);

router.get(
    "/",
    authenticate,
    getOrganizationsController
);

router.get(
    "/:id",
    authenticate,
    getOrganizationController
);

export default router;