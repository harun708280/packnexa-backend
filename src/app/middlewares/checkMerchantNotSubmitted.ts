import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelper/AppError";
import { prisma } from "../shared/prisma";

const checkMerchantNotSubmitted = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = (req as any).user?.userId;

  if (!userId) {
    return next(new AppError(401, "Unauthorized"));
  }

  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
    select: { isSubmitted: true },
  });

  if (merchantDetails?.isSubmitted) {
    return next(
      new AppError(403, "Profile already submitted. Editing not allowed."),
    );
  }

  next();
};

export default checkMerchantNotSubmitted;
