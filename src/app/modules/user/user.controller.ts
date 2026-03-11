import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { UserService } from "./user.service";
import { jwtHelper } from "../../helper/jwtHelper";
import { envVariables } from "../../../config";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: " Successfully registered. A confirmation email has been sent!",
    data: result,
  });
});

const me = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const sessionId = (req as any).user?.sessionId;
  const currentRole = (req as any).user?.role;

  if (!userId) throw new Error("Unauthorized");
  const user = await UserService.me(userId);


  if (user && user.role !== currentRole && sessionId) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: sessionId,
    };

    const accessToken = jwtHelper.generateToken(
      payload,
      envVariables.JWT_ACCESS_SECRET,
      envVariables.JWT_ACCESS_EXPIRES
    );

    const refreshToken = jwtHelper.generateToken(
      payload,
      envVariables.JWT_REFRESH_SECRET,
      envVariables.JWT_REFRESH_EXPIRES
    );

    const isProduction = envVariables.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: envVariables.JWT_ACCESS_EXPIRES_MAX_AGE,
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: envVariables.JWT_REFRESH_EXPIRES_MAX_AGE,
      path: "/",
    });
  }

  sendResponse(res, { statusCode: 200, success: true, data: user });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const result = await UserService.updateUser(userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

export const UserController = { createUser, me, updateUser };
