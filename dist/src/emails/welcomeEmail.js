"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.welcomeEmail = void 0;
const config_1 = require("../config");
const baseTemplate_1 = require("./baseTemplate");
const welcomeEmail = (firstName, lastName) => {
    return (0, baseTemplate_1.baseEmailTemplate)({
        title: "Welcome to Packnexa",
        headerTitle: `Welcome to Packnexa, ${firstName}!`,
        content: `
      <h2>Hi ${firstName} ${lastName},</h2>
      <p>Your registration was successful and your account is now active.</p>
      <ul>
        <li>Track fulfillment orders in real time</li>
        <li>Manage inventory and shipments</li>
        <li>Invite your team securely</li>
      </ul>
    `,
        ctaText: "Go to Dashboard",
        ctaLink: `${config_1.envVariables.FRONTEND_URL}/login`,
    });
};
exports.welcomeEmail = welcomeEmail;
