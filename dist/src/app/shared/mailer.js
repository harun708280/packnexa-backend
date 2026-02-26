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
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../../config");
const transporter = nodemailer_1.default.createTransport({
    host: config_1.envVariables.EMAIL_SENDER.SMTP_HOST,
    port: Number(config_1.envVariables.EMAIL_SENDER.SMTP_PORT),
    secure: false,
    auth: {
        user: config_1.envVariables.EMAIL_SENDER.SMTP_USER,
        pass: config_1.envVariables.EMAIL_SENDER.SMTP_PASS,
    },
});
const sendEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, subject, text, html, }) {
    const info = yield transporter.sendMail({
        from: config_1.envVariables.EMAIL_SENDER.SMTP_USER,
        to,
        subject,
        text,
        html,
    });
    return info;
});
exports.sendEmail = sendEmail;
