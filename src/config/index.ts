import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const envVariables = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: Number(process.env.PORT || 5050),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
  JWT_ACCESS_EXPIRES_MAX_AGE: Number(process.env.JWT_ACCESS_EXPIRES_MAX_AGE || 0),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES as string,
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
  STEADFAST: {
    API_KEY: process.env.STEADFAST_API_KEY,
    SECRET_KEY: process.env.STEADFAST_SECRET_KEY,
  }
};

export const config = {
  env: envVariables.NODE_ENV,
  port: envVariables.PORT,
  database_url: envVariables.DATABASE_URL,
  jwt: {
    access_secret: envVariables.JWT_ACCESS_SECRET,
    access_expires_in: envVariables.JWT_ACCESS_EXPIRES,
    refresh_secret: envVariables.JWT_REFRESH_SECRET,
    refresh_expires_in: envVariables.JWT_REFRESH_EXPIRES,
  },
  cloudinary: {
    cloud_name: envVariables.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: envVariables.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: envVariables.CLOUDINARY.CLOUDINARY_API_SECRET,
  },
  email: {
    host: envVariables.EMAIL_SENDER.SMTP_HOST,
    port: envVariables.EMAIL_SENDER.SMTP_PORT,
    user: envVariables.EMAIL_SENDER.SMTP_USER,
    pass: envVariables.EMAIL_SENDER.SMTP_PASS,
  },
  bcrypt_salt_rounds: envVariables.BCRYPT_SALT_ROUND,
  frontend_url: envVariables.FRONTEND_URL,
  steadfast: {
    api_key: envVariables.STEADFAST.API_KEY,
    secret_key: envVariables.STEADFAST.SECRET_KEY,
  },
};

export default config;
