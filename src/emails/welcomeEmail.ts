import { envVariables } from "../config";
import { baseEmailTemplate } from "./baseTemplate";

export const welcomeEmail = (firstName: string, lastName: string): string => {
  return baseEmailTemplate({
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
    ctaLink: `${envVariables.FRONTEND_URL}/login`,
  });
};
