import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ReturnController } from "./return.controller";
import { ReturnValidation } from "./return.validation";

const router = express.Router();

router.get("/merchant", auth("MERCHANT"), ReturnController.getMerchantReturns);
router.get("/admin", auth("ADMIN"), ReturnController.getAllReturns);

router.post(
    "/create",
    auth("MERCHANT"),
    validateRequest(ReturnValidation.createReturnSchema),
    ReturnController.createReturn
);

router.patch(
    "/update/:id",
    auth("ADMIN"),
    validateRequest(ReturnValidation.updateReturnStatusSchema),
    ReturnController.updateReturnStatus
);

export const ReturnRoutes = router;
