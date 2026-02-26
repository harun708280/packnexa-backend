"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    console.log(`Checking role: user.role=${req.user.role}, requiredRoles=${roles}`);
    if (!roles.includes(req.user.role)) {
        return res
            .status(403)
            .json({ success: false, message: "Forbidden: Access denied" });
    }
    next();
};
exports.requireRole = requireRole;
