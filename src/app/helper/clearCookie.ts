import { Response } from "express";
import { envVariables } from "../../config";

export const clearAuthCookies = (res: Response) => {
  const isProduction = envVariables.NODE_ENV === "production";

  ["accessToken", "refreshToken"].forEach((cookie) =>
    res.clearCookie(cookie, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    })
  );
};
