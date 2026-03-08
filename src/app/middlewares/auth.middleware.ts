import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { envVariables } from "../../config";
import { jwtHelper } from "../helper/jwtHelper";
import { prisma } from "../shared/prisma";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token = req.cookies.accessToken;
  const authHeader = req.headers.authorization;

  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        envVariables.JWT_ACCESS_SECRET!
      ) as jwt.JwtPayload;

      // Verify session exists in DB
      if (decoded.sessionId) {
        const session = await prisma.userSession.findUnique({
          where: { id: decoded.sessionId },
        });

        if (!session) {
          return res.status(401).json({
            success: false,
            message: "Session expired or logged out",
          });
        }

        // Update lastActiveAt
        await prisma.userSession.update({
          where: { id: decoded.sessionId },
          data: { lastActiveAt: new Date() },
        });
      }

      (req as any).user = decoded;
      return next();
    } catch { }
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

    // Verify session exists in DB for refresh token too
    if (decoded.sessionId) {
      const session = await prisma.userSession.findUnique({
        where: { id: decoded.sessionId },
      });

      if (!session) {
        return res
          .status(401)
          .json({ success: false, message: "Session expired" });
      }
    }

    const payload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
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
  } catch (error) {
    return res.status(401).json({ success: false, message: "Login again" });
  }
};
