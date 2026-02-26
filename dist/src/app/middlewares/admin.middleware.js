"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const adminMiddleware = (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (user.role !== "ADMIN") {
        return res.status(403).json({ success: false, message: "Forbidden: Admins only" });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
