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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const welcomeEmail_1 = require("../../../emails/welcomeEmail");
const mailer_1 = require("../../shared/mailer");
const prisma_1 = require("../../shared/prisma");
const createUser = (Payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email, password, contactNumber } = Payload;
    const existing = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing)
        throw new Error("Email already in use");
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
    const user = yield prisma_1.prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            contactNumber,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    yield (0, mailer_1.sendEmail)({
        to: email,
        subject: "Welcome to Packnexa!",
        text: `Hello ${firstName}, your registration is successful!`,
        html: (0, welcomeEmail_1.welcomeEmail)(firstName, lastName),
    });
    return { user };
});
const me = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            merchantDetails: {
                select: {
                    id: true,
                    isSubmitted: true,
                    isVerified: true,
                },
            },
        },
    });
    if (!user)
        throw new Error("User not found");
    const { password, otp, otpExpires, otpAttempts } = user, safeUser = __rest(user, ["password", "otp", "otpExpires", "otpAttempts"]);
    return safeUser;
});
exports.UserService = {
    createUser,
    me,
};
