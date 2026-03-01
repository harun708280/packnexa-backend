import nodemailer from "nodemailer";
import { envVariables } from "../../config";

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: envVariables.EMAIL_SENDER.SMTP_HOST,
  port: 465, // Using port 465 for better compatibility
  secure: true, // true for port 465, false for other ports
  auth: {
    user: envVariables.EMAIL_SENDER.SMTP_USER,
    pass: envVariables.EMAIL_SENDER.SMTP_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
});

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailOptions) => {
  const info = await transporter.sendMail({
    from: envVariables.EMAIL_SENDER.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return info;
};
