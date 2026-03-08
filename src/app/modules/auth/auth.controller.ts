import { Request, Response } from "express";
import { envVariables } from "../../../config";
import { clearAuthCookies } from "../../helper/clearCookie";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthService } from "./auth.service";
import {
  ChangePasswordInput,
  EmailInput,
  LoginInput,
  ResetPasswordInput,
  VerifyOtpInput,
} from "./auth.validation";

const login = catchAsync(
  async (req: Request<{}, {}, LoginInput>, res: Response) => {
    const { email, password } = req.body;
    const clientInfo = {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip as string,
    };

    const { accessToken, refreshToken, user } = await AuthService.login(
      email,
      password,
      clientInfo
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

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: user,
    });
  }
);

const verifyOtp = catchAsync(
  async (req: Request<{}, {}, VerifyOtpInput>, res: Response) => {
    const { email, otp } = req.body;
    const clientInfo = {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip as string,
    };

    const { accessToken, refreshToken, user } = await AuthService.verifyOtp(
      email,
      otp,
      clientInfo
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

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: user,
    });
  }
);

const resendOtp = catchAsync(
  async (req: Request<{}, {}, EmailInput>, res: Response) => {
    const { email } = req.body;

    const { message, otpExpires } = await AuthService.resendOtp(email);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message,
      data: { otpExpires },
    });
  }
);

const logout = catchAsync(async (req: Request, res: Response) => {
  clearAuthCookies(res);

  sendResponse(res, { statusCode: 200, success: true, message: "Logged out" });
});

const forgetPassword = catchAsync(
  async (req: Request<{}, {}, EmailInput>, res: Response) => {
    const { email } = req.body;

    const { message, otpExpires } = await AuthService.forgetPassword(email);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message,
      data: { otpExpires },
    });
  }
);

const resetPassword = catchAsync(
  async (req: Request<{}, {}, ResetPasswordInput>, res: Response) => {
    const { email, otp, newPassword } = req.body;

    const response = await AuthService.resetPassword(email, otp, newPassword);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: response.message,
    });
  }
);

const getMySessions = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getMySessions(req.user.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Sessions fetched successfully",
    data: result,
  });
});

const logoutFromSession = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  await AuthService.logoutFromSession(sessionId, req.user.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logged out from session successfully",
  });
});

const logoutOtherSessions = catchAsync(async (req: Request, res: Response) => {
  await AuthService.logoutOtherSessions(req.user.sessionId, req.user.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logged out from other sessions successfully",
  });
});

const changePassword = catchAsync(
  async (req: Request<{}, {}, ChangePasswordInput>, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(req.user.userId, {
      oldPassword,
      newPassword,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.message,
    });
  }
);

export const AuthController = {
  login,
  verifyOtp,
  resendOtp,
  logout,
  forgetPassword,
  resetPassword,
  changePassword,
  getMySessions,
  logoutFromSession,
  logoutOtherSessions,
};
