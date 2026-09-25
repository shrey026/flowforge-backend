import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    createOrganizationController,
    getOrganizationsController,
    getOrganizationController,
    getOrganizationMembersController,
    updateOrganizationMemberRoleController,
    removeOrganizationMemberController,
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
    "/:id/members",
    authenticate,
    getOrganizationMembersController
);

router.patch(
    "/:id/members/:userId/role",
    authenticate,
    updateOrganizationMemberRoleController
);

router.delete(
    "/:id/members/:userId",
    authenticate,
    removeOrganizationMemberController
);

router.get(
    "/:id",
    authenticate,
    getOrganizationController
);

export default router;