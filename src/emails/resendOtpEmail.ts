import { baseEmailTemplate } from "./baseTemplate";

export const resendOtpEmail = (otp: string): string => {
  return baseEmailTemplate({
    title: "Your New OTP Code",
    headerTitle: "Your New OTP Code",
    content: `
      <p>Please use the following OTP to continue:</p>
      <h2 style="letter-spacing: 4px; text-align:center;">${otp}</h2>
      <p>This OTP will expire shortly. Do not share it with anyone.</p>
    `,
  });
};
