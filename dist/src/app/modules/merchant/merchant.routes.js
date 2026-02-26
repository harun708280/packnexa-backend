"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantRoutes = void 0;
const express_1 = __importDefault(require("express"));
const fileUploader_1 = require("../../helper/fileUploader");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const checkMerchantNotSubmitted_1 = __importDefault(require("../../middlewares/checkMerchantNotSubmitted"));
const merchant_controller_1 = require("./merchant.controller");
const router = express_1.default.Router();
router.post("/personal-details", auth_middleware_1.authMiddleware, checkMerchantNotSubmitted_1.default, fileUploader_1.fileUploader.upload.single("profilePhoto"), merchant_controller_1.MerchantController.personalDetails);
router.get("/personal-details", auth_middleware_1.authMiddleware, merchant_controller_1.MerchantController.getPersonalDetails);
router.post("/business-details", auth_middleware_1.authMiddleware, checkMerchantNotSubmitted_1.default, fileUploader_1.fileUploader.upload.single("businessLogo"), merchant_controller_1.MerchantController.businessDetails);
router.get("/business-details", auth_middleware_1.authMiddleware, merchant_controller_1.MerchantController.getBusinessDetails);
router.post("/documents", auth_middleware_1.authMiddleware, checkMerchantNotSubmitted_1.default, fileUploader_1.fileUploader.upload.fields([
    { name: "nidFront" },
    { name: "nidBack" },
    { name: "tradeLicense" },
    { name: "passport" },
    { name: "drivingLicense" },
    { name: "tinCertificate" },
    { name: "binCertificate" },
    { name: "bankDocuments" },
]), merchant_controller_1.MerchantController.documents);
router.get("/documents", auth_middleware_1.authMiddleware, merchant_controller_1.MerchantController.getDocuments);
router.post("/payments", auth_middleware_1.authMiddleware, checkMerchantNotSubmitted_1.default, merchant_controller_1.MerchantController.payments);
router.get("/payments", auth_middleware_1.authMiddleware, merchant_controller_1.MerchantController.getPayments);
router.post("/complete-onboarding", auth_middleware_1.authMiddleware, merchant_controller_1.MerchantController.completeOnboarding);
router.get("/onboarding-config", auth_middleware_1.authMiddleware, merchant_controller_1.MerchantController.getOnboardingConfig);
exports.merchantRoutes = router;
