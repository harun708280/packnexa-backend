import { envVariables } from "../config";

interface BaseEmailProps {
  title: string;
  headerTitle: string;
  content: string;
  ctaText?: string;
  ctaLink?: string;
}

export const baseEmailTemplate = ({
  title,
  headerTitle,
  content,
  ctaText,
  ctaLink,
}: BaseEmailProps): string => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f6fb;
        font-family: Arial, sans-serif;
      }
      .wrapper {
        padding: 24px 12px;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
      }
      .header {
        background: linear-gradient(135deg, #304ffe, #00bcd4);
        color: #ffffff;
        text-align: center;
        padding: 28px 20px;
      }
      .header img {
        max-width: 140px;
        margin-bottom: 10px;
      }
      .header h1 {
        margin: 0;
        font-size: 22px;
      }
      .content {
        padding: 24px;
        font-size: 14px;
        color: #1f2933;
        line-height: 1.6;
      }
      .cta {
        text-align: center;
        padding: 0 24px 24px;
      }
      .cta a {
        display: inline-block;
        padding: 12px 28px;
        border-radius: 999px;
        background-color: #ff715b;
        color: #ffffff;
        text-decoration: none;
        font-weight: 600;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
        padding: 12px;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <img src="${
            envVariables.FRONTEND_URL
          }/Packnexa.png" alt="Packnexa Logo" />
          <h1>${headerTitle}</h1>
        </div>

        <div class="content">
          ${content}
        </div>

        ${
          ctaText && ctaLink
            ? `
          <div class="cta">
            <a href="${ctaLink}">${ctaText}</a>
          </div>
        `
            : ""
        }

        <div class="footer">
          © ${new Date().getFullYear()} Packnexa. All rights reserved.
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};
