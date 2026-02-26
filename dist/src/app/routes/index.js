"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_routes_1 = require("../modules/admin/admin.routes");
const auth_routes_1 = require("../modules/auth/auth.routes");
const inventory_route_1 = require("../modules/inventory/inventory.route");
const merchant_routes_1 = require("../modules/merchant/merchant.routes");
const product_route_1 = require("../modules/product/product.route");
const user_routes_1 = require("../modules/user/user.routes");
const order_route_1 = require("../modules/order/order.route");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: "/user",
        route: user_routes_1.userRoutes,
    },
    {
        path: "/auth",
        route: auth_routes_1.authRoutes,
    },
    {
        path: "/merchant",
        route: merchant_routes_1.merchantRoutes,
    },
    {
        path: "/admin",
        route: admin_routes_1.adminRoutes,
    },
    {
        path: "/product",
        route: product_route_1.productRoutes,
    },
    {
        path: "/inventory",
        route: inventory_route_1.inventoryRoutes,
    },
    {
        path: "/order",
        route: order_route_1.orderRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
