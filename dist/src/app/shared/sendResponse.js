"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse = (res, payload) => {
    const { statusCode = 200, success = true, message = '', meta, data = null } = payload;
    return res.status(statusCode).json({ success, message, meta, data });
};
exports.default = sendResponse;
