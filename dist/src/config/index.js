"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.envVariables = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), ".env") });
exports.envVariables = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: Number(process.env.PORT || 5050),
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES,
    JWT_ACCESS_EXPIRES_MAX_AGE: Number(process.env.JWT_ACCESS_EXPIRES_MAX_AGE || 0),
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES,
    JWT_REFRESH_EXPIRES_MAX_AGE: Number(process.env.JWT_REFRESH_EXPIRES_MAX_AGE || 0),
    CLOUDINARY: {
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    },
    EMAIL_SENDER: {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
    },
    BCRYPT_SALT_ROUND: Number(process.env.BCRYPT_SALT_ROUND || 10),
    FORGOT_PASSWORD_OTP_EXPIRE_MINUTES: Number(process.env.FORGOT_PASSWORD_OTP_EXPIRE_MINUTES || 10),
    FRONTEND_URL: process.env.FRONTEND_URL,
};
exports.config = {
    env: exports.envVariables.NODE_ENV,
    port: exports.envVariables.PORT,
    database_url: exports.envVariables.DATABASE_URL,
    jwt: {
        access_secret: exports.envVariables.JWT_ACCESS_SECRET,
        access_expires_in: exports.envVariables.JWT_ACCESS_EXPIRES,
        refresh_secret: exports.envVariables.JWT_REFRESH_SECRET,
        refresh_expires_in: exports.envVariables.JWT_REFRESH_EXPIRES,
    },
    cloudinary: {
        cloud_name: exports.envVariables.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
        api_key: exports.envVariables.CLOUDINARY.CLOUDINARY_API_KEY,
        api_secret: exports.envVariables.CLOUDINARY.CLOUDINARY_API_SECRET,
    },
    email: {
        host: exports.envVariables.EMAIL_SENDER.SMTP_HOST,
        port: exports.envVariables.EMAIL_SENDER.SMTP_PORT,
        user: exports.envVariables.EMAIL_SENDER.SMTP_USER,
        pass: exports.envVariables.EMAIL_SENDER.SMTP_PASS,
    },
    bcrypt_salt_rounds: exports.envVariables.BCRYPT_SALT_ROUND,
    frontend_url: exports.envVariables.FRONTEND_URL,
};
exports.default = exports.config;
