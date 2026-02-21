import bcrypt from "bcryptjs";
import { envVariables } from "../../../config";
import { forgetPasswordEmail } from "../../../emails/forgetPasswordEmail";
import { otpEmail } from "../../../emails/otpEmail";
import { resendOtpEmail } from "../../../emails/resendOtpEmail";
import AppError from "../../errorHelper/AppError";
import { jwtHelper } from "../../helper/jwtHelper";
import { sendEmail } from "../../shared/mailer";
import { prisma } from "../../shared/prisma";

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError(400, "Invalid email address");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw new AppError(400, "Invalid credentials");

  if (envVariables.NODE_ENV === "development") {
    const accessToken = jwtHelper.generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      envVariables.JWT_ACCESS_SECRET,
      envVariables.JWT_ACCESS_EXPIRES
    );

    const refreshToken = jwtHelper.generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      envVariables.JWT_REFRESH_SECRET,
      envVariables.JWT_REFRESH_EXPIRES
    );

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, envVariables.BCRYPT_SALT_ROUND);
  const otpExpires = new Date(
    Date.now() + envVariables.FORGOT_PASSWORD_OTP_EXPIRE_MINUTES * 60 * 1000
  );

  await prisma.user.update({
    where: { email },
    data: { otp: hashedOtp, otpExpires },
  });

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
    html: otpEmail(otp),
  });

  return { message: "OTP sent to email", otpExpires };
};

const verifyOtp = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.otp || !user.otpExpires) {
    throw new AppError(400, "Invalid request");
  }

  if (user.otpExpires < new Date()) {
    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpires: null, otpAttempts: 0 },
    });
    throw new AppError(400, "OTP expired");
  }

  const attempts = user.otpAttempts ?? 0;

  if (attempts >= 2) {
    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpires: null, otpAttempts: 0 },
    });
    throw new AppError(
      429,
      "Maximum OTP attempts reached. Please request a new OTP."
    );
  }

  const isValid = await bcrypt.compare(otp, user.otp);
  if (!isValid) {
    await prisma.user.update({
      where: { email },
      data: { otpAttempts: attempts + 1 },
    });
    throw new AppError(401, "Invalid OTP");
  }

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtHelper.generateToken(
    payload,
    envVariables.JWT_ACCESS_SECRET,
    envVariables.JWT_ACCESS_EXPIRES
  );

  const refreshToken = jwtHelper.generateToken(
    payload,
    envVariables.JWT_REFRESH_SECRET,
    envVariables.JWT_REFRESH_EXPIRES
  );

  await prisma.user.update({
    where: { email },
    data: { otp: null, otpExpires: null, otpAttempts: 0 },
  });

  return {
    accessToken,
    refreshToken,
    user: payload,
  };
};

const resendOtp = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError(404, "User not found");

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, envVariables.BCRYPT_SALT_ROUND);

  const otpExpires = new Date(
    Date.now() + envVariables.FORGOT_PASSWORD_OTP_EXPIRE_MINUTES * 60 * 1000
  );
  await prisma.user.update({
    where: { email },
    data: { otp: hashedOtp, otpExpires },
  });

  await sendEmail({
    to: email,
    subject: "Your New OTP Code",
    text: `Your OTP code is: ${otp}`,
    html: resendOtpEmail(otp),
  });

  return { message: "New OTP sent successfully", otpExpires };
};

const forgetPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { message: "OTP has been sent" };
  }

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, envVariables.BCRYPT_SALT_ROUND);
  const otpExpires = new Date(
    Date.now() + envVariables.FORGOT_PASSWORD_OTP_EXPIRE_MINUTES * 60 * 1000
  );

  await prisma.user.update({
    where: { email },
    data: { otp: hashedOtp, otpExpires, otpAttempts: 0 },
  });

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
    html: forgetPasswordEmail(otp),
  });

  return { message: "OTP has been sent", otpExpires };
};

const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.otp || !user.otpExpires)
    throw new AppError(400, "Invalid request");

  if (user.otpExpires < new Date()) {
    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpires: null, otpAttempts: 0 },
    });
    throw new AppError(400, "OTP expired");
  }

  const attempts = user.otpAttempts ?? 0;

  if (attempts >= 2) {
    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpires: null, otpAttempts: 0 },
    });
    throw new AppError(
      429,
      "Maximum OTP attempts reached. Please request a new OTP."
    );
  }

  const isValid = await bcrypt.compare(otp, user.otp);
  if (!isValid) {
    await prisma.user.update({
      where: { email },
      data: { otpAttempts: attempts + 1 },
    });
    throw new AppError(401, "Invalid OTP");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    envVariables.BCRYPT_SALT_ROUND
  );

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      otp: null,
      otpExpires: null,
      otpAttempts: 0,
    },
  });

  return { message: "Password updated successfully" };
};

export const AuthService = {
  login,
  verifyOtp,
  resendOtp,
  forgetPassword,
  resetPassword,
};
