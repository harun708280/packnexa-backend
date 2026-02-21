import express from "express";
import { fileUploader } from "../../helper/fileUploader";
import { authMiddleware } from "../../middlewares/auth.middleware";
import checkMerchantNotSubmitted from "../../middlewares/checkMerchantNotSubmitted";
import { MerchantController } from "./merchant.controller";

const router = express.Router();

router.post(
  "/personal-details",
  authMiddleware,
  checkMerchantNotSubmitted,
  fileUploader.upload.single("profilePhoto"),

  MerchantController.personalDetails,
);

router.get(
  "/personal-details",
  authMiddleware,
  MerchantController.getPersonalDetails,
);

router.post(
  "/business-details",
  authMiddleware,
  checkMerchantNotSubmitted,
  fileUploader.upload.single("businessLogo"),

  MerchantController.businessDetails,
);

router.get(
  "/business-details",
  authMiddleware,
  MerchantController.getBusinessDetails,
);

router.post(
  "/documents",
  authMiddleware,
  checkMerchantNotSubmitted,
  fileUploader.upload.fields([
    { name: "nidFront" },
    { name: "nidBack" },
    { name: "tradeLicense" },
    { name: "passport" },
    { name: "drivingLicense" },
    { name: "tinCertificate" },
    { name: "binCertificate" },
    { name: "bankDocuments" },
  ]),

  MerchantController.documents,
);

router.get("/documents", authMiddleware, MerchantController.getDocuments);

router.post(
  "/payments",
  authMiddleware,
  checkMerchantNotSubmitted,
  MerchantController.payments,
);

router.get("/payments", authMiddleware, MerchantController.getPayments);

router.post("/complete-onboarding", authMiddleware, MerchantController.completeOnboarding);

router.get(
  "/onboarding-config",
  authMiddleware,
  MerchantController.getOnboardingConfig,
);

// klfjg
/**
 * Apply for merchant account
 * Access: Authenticated User
 */
// router.post("/apply", authMiddleware, MerchantController.applyMerchant);

/**
 * Get own merchant profile
 * Access: Merchant (self)
 */
// router.get("/me", authMiddleware, MerchantController.getMyMerchantProfile);

/**
 * Update own merchant profile
 * Access: Merchant (self)
 */
// router.patch("/me", authMiddleware, MerchantController.updateMyMerchantProfile);

/**
 * ============================
 * ADMIN ROUTES
 * ============================
 */

/**
 * Get all merchants (pagination, search, filter, sort)
 * Access: Admin only
 */
// router.get(
//   "/",
//   authMiddleware,
//   adminMiddleware,
//   MerchantController.getAllMerchants,
// );

/**
 * Approve merchant application
 * Access: Admin only
 */
// router.post(
//   "/approve",
//   authMiddleware,
//   adminMiddleware,
//   MerchantController.approveMerchant,
// );

/**
 * Reject merchant application
 * Access: Admin only
 */
// router.post(
//   "/reject",
//   authMiddleware,
//   adminMiddleware,
//   MerchantController.rejectMerchant,
// );

export const merchantRoutes = router;
