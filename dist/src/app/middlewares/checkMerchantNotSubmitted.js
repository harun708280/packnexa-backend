"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../errorHelper/AppError"));
const prisma_1 = require("../shared/prisma");
const checkMerchantNotSubmitted = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        return next(new AppError_1.default(401, "Unauthorized"));
    }
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
        select: { isSubmitted: true },
    });
    if (merchantDetails === null || merchantDetails === void 0 ? void 0 : merchantDetails.isSubmitted) {
        return next(new AppError_1.default(403, "Profile already submitted. Editing not allowed."));
    }
    next();
});
exports.default = checkMerchantNotSubmitted;
