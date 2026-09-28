import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {
    createCommentController,
    getTaskCommentsController,
    deleteCommentController,
} from "./comment.controller.js";

const router = Router();

router.post(
    "/tasks/:taskId/comments",
    authenticate,
    createCommentController
);

router.get(
    "/tasks/:taskId/comments",
    authenticate,
    getTaskCommentsController
);

router.delete(
    "/comments/:commentId",
    authenticate,
    deleteCommentController
);

export default router;
