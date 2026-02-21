import { UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { welcomeEmail } from "../../../emails/welcomeEmail";
import { sendEmail } from "../../shared/mailer";
import { prisma } from "../../shared/prisma";
import { CreateUserData } from "./user.interface";

const createUser = async (Payload: CreateUserData) => {
  const { firstName, lastName, email, password, contactNumber } = Payload;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already in use");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      contactNumber,
      // role: Payload.role || UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  await sendEmail({
    to: email,
    subject: "Welcome to Packnexa!",
    text: `Hello ${firstName}, your registration is successful!`,
    html: welcomeEmail(firstName, lastName),
  });

  return { user };
};

const me = async (userId: string) => {
  const user = await prisma.user.findUnique({
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

  if (!user) throw new Error("User not found");

  const { password, otp, otpExpires, otpAttempts, ...safeUser } = user;

  return safeUser;
};

export const UserService = {
  createUser,
  me,
};
