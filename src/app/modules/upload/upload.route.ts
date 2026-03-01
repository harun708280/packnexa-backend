import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { fileUploader } from "../../helper/fileUploader";
import { UploadController } from "./upload.controller";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    fileUploader.upload.array("files", 10),
    UploadController.uploadFiles
);

export const uploadRoutes = router;
