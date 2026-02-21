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
  port: Number(envVariables.EMAIL_SENDER.SMTP_PORT),
  secure: false,
  auth: {
    user: envVariables.EMAIL_SENDER.SMTP_USER,
    pass: envVariables.EMAIL_SENDER.SMTP_PASS,
  },
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
