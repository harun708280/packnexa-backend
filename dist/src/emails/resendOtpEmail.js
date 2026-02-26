"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendOtpEmail = void 0;
const baseTemplate_1 = require("./baseTemplate");
const resendOtpEmail = (otp) => {
    return (0, baseTemplate_1.baseEmailTemplate)({
        title: "Your New OTP Code",
        headerTitle: "Your New OTP Code",
        content: `
      <p>Please use the following OTP to continue:</p>
      <h2 style="letter-spacing: 4px; text-align:center;">${otp}</h2>
      <p>This OTP will expire shortly. Do not share it with anyone.</p>
    `,
    });
};
exports.resendOtpEmail = resendOtpEmail;
