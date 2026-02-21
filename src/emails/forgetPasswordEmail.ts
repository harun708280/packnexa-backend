import { baseEmailTemplate } from "./baseTemplate";

export const forgetPasswordEmail = (otp: string): string => {
  return baseEmailTemplate({
    title: "Your OTP Code",
    headerTitle: "Your OTP Code",
    content: `
      <p>Please use the following OTP to set a new password:</p>
      <h2 style="letter-spacing: 4px; text-align:center;">${otp}</h2>
      <p>This OTP will expire shortly. Do not share it with anyone.</p>
    `,
  });
};
