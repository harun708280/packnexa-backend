import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { envVariables } from "../../config";
import { jwtHelper } from "../helper/jwtHelper";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies.accessToken;

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, envVariables.JWT_ACCESS_SECRET!);

      (req as any).user = decoded;
      return next();
    } catch {}
  }

  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      envVariables.JWT_REFRESH_SECRET!
    ) as jwt.JwtPayload;

    const payload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    const newAccessToken = jwtHelper.generateToken(
      payload,
      envVariables.JWT_ACCESS_SECRET,
      envVariables.JWT_ACCESS_EXPIRES
    );

    const isProduction = envVariables.NODE_ENV === "production";

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: envVariables.JWT_ACCESS_EXPIRES_MAX_AGE,
      path: "/",
    });

    (req as any).user = payload;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Login again" });
  }
};
