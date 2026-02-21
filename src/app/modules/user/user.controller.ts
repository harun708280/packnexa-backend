import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { UserService } from "./user.service";

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
  if (!userId) throw new Error("Unauthorized");
  const user = await UserService.me(userId);
  sendResponse(res, { statusCode: 200, success: true, data: user });
});

export const UserController = { createUser, me };
