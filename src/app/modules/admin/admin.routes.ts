import { UserRole } from "@prisma/client";
import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/requireRole.middleware";
import { AdminController } from "./admin.controller";

export const router = express.Router();



router.get("/applied-merchants", AdminController.getAppliedMerchant);

router.get(
  "/applied-merchants-personal-details/:id",
  AdminController.getAppliedMerchantPersonalDetails,
);

router.patch(
  "/approve-profile-photo-merchants-personal-details/:id",
  AdminController.approveProfilePhoto,
);

router.patch(
  "/approve-phase-one-merchants-personal-details/:id",
  AdminController.approvePhaseOne,
);

router.get(
  "/applied-merchants-business-details/:id",
  AdminController.getAppliedMerchantBusinessDetails,
);

router.patch(
  "/approve-business-photo-merchants-business-details/:id",
  AdminController.approveBusinessPhoto,
);

router.patch(
  "/approve-phase-two-merchants-business-details/:id",
  AdminController.approvePhaseTwo,
);

router.get(
  "/applied-merchants-documents/:id",
  AdminController.getAppliedMerchantDocuments,
);

router.patch(
  "/approve-phase-three-merchants-documents/:id",
  AdminController.approvePhaseThree,
);

router.get(
  "/applied-merchants-payments/:id",
  AdminController.getAppliedMerchantPayments,
);

router.patch(
  "/approve-phase-four-merchants-payments/:id",
  AdminController.approvePhaseFour,
);

router.get("/approved-merchants", AdminController.getApprovedMerchant);
router.get("/merchant-profile/:id", AdminController.getMerchantProfile);

export const adminRoutes = router;
