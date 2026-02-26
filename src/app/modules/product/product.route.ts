import { UserRole } from "@prisma/client";
import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/requireRole.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { ProductController } from "./product.controller";
import { ProductValidation } from "./product.validation";

export const router = express.Router();


router.get(
    "/all-products",
    authMiddleware,
    requireRole(UserRole.ADMIN),
    ProductController.getAllProducts
);

router.get(
    "/applied-merchants",
    authMiddleware,
    requireRole(UserRole.ADMIN),
    ProductController.getAppliedMerchant
);


router.post(
    "/create-product",
    authMiddleware,
    requireRole(UserRole.MERCHANT),
    validateRequest(ProductValidation.createProductValidationSchema),
    ProductController.createProduct
);

router.get(
    "/my-products",
    authMiddleware,
    requireRole(UserRole.MERCHANT),
    ProductController.getMyProducts
);

router.patch(
    "/:id/approve",
    authMiddleware,
    requireRole(UserRole.ADMIN),
    ProductController.approveProduct
);

router.patch(
    "/:id/reject",
    authMiddleware,
    requireRole(UserRole.ADMIN),
    ProductController.rejectProduct
);

router.get(
    "/:id",
    authMiddleware,
    requireRole(UserRole.MERCHANT, UserRole.ADMIN),
    ProductController.getSingleProduct
);

router.patch(
    "/:id",
    authMiddleware,
    requireRole(UserRole.MERCHANT),
    validateRequest(ProductValidation.updateProductValidationSchema),
    ProductController.updateProduct
);

router.delete(
    "/:id",
    authMiddleware,
    requireRole(UserRole.MERCHANT),
    ProductController.deleteProduct
);


export const productRoutes = router;
