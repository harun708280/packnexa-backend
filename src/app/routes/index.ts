import express from "express";
import { adminRoutes } from "../modules/admin/admin.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { inventoryRoutes } from "../modules/inventory/inventory.route";
import { merchantRoutes } from "../modules/merchant/merchant.routes";
import { productRoutes } from "../modules/product/product.route";
import { userRoutes } from "../modules/user/user.routes";
import { orderRoutes } from "../modules/order/order.route";

import { ExternalOrderRoutes } from "../modules/externalOrder/externalOrder.routes";
import { uploadRoutes } from "../modules/upload/upload.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/upload",
    route: uploadRoutes,
  },
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/merchant",
    route: merchantRoutes,
  },
  {
    path: "/admin",
    route: adminRoutes,
  },
  {
    path: "/product",
    route: productRoutes,
  },
  {
    path: "/inventory",
    route: inventoryRoutes,
  },
  {
    path: "/order",
    route: orderRoutes,
  },
  {
    path: "/external-order",
    route: ExternalOrderRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
